import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { z } from "zod/v4";
import { db, usersTable } from "@workspace/db";
import {
  EnableTwofaBody,
  DisableTwofaBody,
  EnableTwofaResponse,
  SetupTwofaResponse,
} from "@workspace/api-zod";
import { requireAuth, verifyPassword } from "../lib/auth";
import { issueEmailOtp, maskEmail } from "../lib/email-otp";
import { audit } from "../lib/audit";
// @ts-expect-error - JS helper sin tipos, ver lib/security-alerts.mjs
import { notifyAdminSensitiveAction } from "../lib/security-alerts.mjs";

const router: IRouter = Router();

const ISSUER = "AXYNTRAX";

const RequestEmailOtpBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

router.post("/auth/2fa/email/request", async (req, res): Promise<void> => {
  const parsed = RequestEmailOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const result = await issueEmailOtp(user.id, user.email);
  if (!result.ok) {
    res.status(502).json({ error: result.error ?? "No se pudo enviar el correo" });
    return;
  }
  res.json({
    ok: true,
    sentTo: result.sentTo ?? maskEmail(user.email),
    expiresAt: result.expiresAt?.toISOString(),
  });
});

router.post(
  "/auth/2fa/setup",
  requireAuth,
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(req.user.email, ISSUER, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#0a1922", light: "#FFFFFFFF" },
    });
    res.json(
      SetupTwofaResponse.parse({
        secret,
        otpauthUrl,
        qrCodeDataUrl,
      }),
    );
  },
);

router.post(
  "/auth/2fa/enable",
  requireAuth,
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const parsed = EnableTwofaBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const valid = authenticator.verify({
      token: parsed.data.code.trim(),
      secret: parsed.data.secret,
    });
    if (!valid) {
      res.status(400).json({ error: "Código 2FA inválido" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({ twofaSecret: parsed.data.secret, twofaEnabled: "true" })
      .where(eq(usersTable.id, req.user.id))
      .returning();
    res.json(
      EnableTwofaResponse.parse({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        twofaEnabled: updated.twofaEnabled === "true",
        createdAt: updated.createdAt,
      }),
    );
  },
);

router.post(
  "/auth/2fa/disable",
  requireAuth,
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const parsed = DisableTwofaBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    if (!user || !user.twofaSecret) {
      res.status(400).json({ error: "2FA no está activo" });
      return;
    }
    const valid = authenticator.verify({
      token: parsed.data.code.trim(),
      secret: user.twofaSecret,
    });
    if (!valid) {
      res.status(400).json({ error: "Código 2FA inválido" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({ twofaSecret: null, twofaEnabled: "false" })
      .where(eq(usersTable.id, req.user.id))
      .returning();
    await audit(req, {
      action: "auth.2fa.disable_self_ui",
      entityType: "user",
      entityId: updated.id,
      meta: {
        targetEmail: updated.email,
        targetRole: updated.role,
      },
    });
    if (updated.role === "admin") {
      await notifyAdminSensitiveAction({
        action: "auth.2fa.disable_self_ui",
        operator: `${updated.email} (self)`,
        targetEmail: updated.email,
        targetRole: updated.role,
        extra: null,
      });
    }
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      twofaEnabled: false,
      createdAt: updated.createdAt,
    });
  },
);

export default router;
