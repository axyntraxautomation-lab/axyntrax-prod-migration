import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { authenticator } from "otplib";
import { db, usersTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  GetCurrentUserResponse,
} from "@workspace/api-zod";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signToken,
  verifyPassword,
} from "../lib/auth";
import { verifyEmailOtp } from "../lib/email-otp";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email.toLowerCase()))
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

  // JARVIS exige 2FA SI o SI para todo acceso al dashboard interno.
  // Si el usuario aún no enroló, generamos secreto pendiente y obligamos
  // al cliente a completar el setup en el mismo flujo de login.
  const twofaEnabledFully = user.twofaEnabled === "true" && !!user.twofaSecret;
  const code = parsed.data.twofaCode?.trim();

  if (!twofaEnabledFully) {
    let secret = user.twofaSecret as string | null;
    if (!secret) {
      secret = authenticator.generateSecret();
      await db
        .update(usersTable)
        .set({ twofaSecret: secret, twofaEnabled: "false" })
        .where(eq(usersTable.id, user.id));
    }
    if (!code) {
      const otpauth = authenticator.keyuri(user.email, "JARVIS · AXYNTRAX", secret);
      const qrDataUrl = await QRCode.toDataURL(otpauth);
      res.status(401).json({
        error:
          "JARVIS requiere doble factor obligatorio. Escanea el QR con tu app autenticadora y envía el primer código.",
        requiresTwofaSetup: true,
        secret,
        otpauth,
        qrDataUrl,
      });
      return;
    }
    const valid = authenticator.verify({ token: code, secret });
    if (!valid) {
      res.status(401).json({
        error: "Código 2FA inválido. Reintenta con el código actual.",
        requiresTwofaSetup: true,
      });
      return;
    }
    await db
      .update(usersTable)
      .set({ twofaEnabled: "true" })
      .where(eq(usersTable.id, user.id));
  } else {
    if (!code) {
      res.status(401).json({
        error: "Se requiere código de verificación 2FA",
        requiresTwofa: true,
      });
      return;
    }
    // Acepta TOTP (app autenticadora) O código de 6 dígitos enviado por email.
    let valid = authenticator.verify({
      token: code,
      secret: user.twofaSecret as string,
    });
    if (!valid && /^\d{4,8}$/.test(code)) {
      const emailOtpResult = await verifyEmailOtp(user.id, code);
      valid = emailOtpResult.ok;
    }
    if (!valid) {
      res.status(401).json({
        error: "Código 2FA inválido",
        requiresTwofa: true,
      });
      return;
    }
  }
  const twofaEnabled = true;

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = signToken(safeUser);
  setSessionCookie(res, token);

  res.json(
    LoginResponse.parse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        twofaEnabled,
        createdAt: user.createdAt,
      },
    }),
  );
});

router.post("/auth/logout", (_req, res): void => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  res.json(
    GetCurrentUserResponse.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      twofaEnabled: user.twofaEnabled === "true",
      createdAt: user.createdAt,
    }),
  );
});

export default router;
