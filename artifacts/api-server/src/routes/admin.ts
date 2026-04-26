import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  usersTable,
  clientsTable,
  licensesTable,
  conversationsTable,
  messagesTable,
  financesTable,
  paymentsTable,
  gmailTemplatesTable,
  auditLogTable,
} from "@workspace/db";
import { hashPassword, requireAuth, requireRole } from "../lib/auth";
import { audit } from "../lib/audit";
// @ts-expect-error - JS helper sin tipos, ver lib/security-alerts.mjs
import { notifyAdminSensitiveAction } from "../lib/security-alerts.mjs";

const router: IRouter = Router();

router.get(
  "/admin/backup",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const [
      users,
      clients,
      licenses,
      conversations,
      messages,
      finances,
      payments,
      templates,
    ] = await Promise.all([
      db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          role: usersTable.role,
          twofaEnabled: usersTable.twofaEnabled,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable),
      db.select().from(clientsTable),
      db.select().from(licensesTable),
      db.select().from(conversationsTable),
      db.select().from(messagesTable),
      db.select().from(financesTable),
      db.select().from(paymentsTable),
      db.select().from(gmailTemplatesTable),
    ]);
    await audit(req, {
      action: "admin.backup",
      meta: {
        users: users.length,
        clients: clients.length,
        licenses: licenses.length,
        conversations: conversations.length,
        messages: messages.length,
        finances: finances.length,
        payments: payments.length,
        templates: templates.length,
      },
    });
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="axyntrax-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    );
    res.json({
      generatedAt: new Date().toISOString(),
      schemaVersion: 1,
      data: {
        users,
        clients,
        licenses,
        conversations,
        messages,
        finances,
        payments,
        templates,
      },
    });
  },
);

const ResetPasswordBody = z.object({
  newPassword: z.string().min(8).max(200),
});

router.post(
  "/admin/users/:id/reset-password",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const parsed = ResetPasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, targetId));
    await audit(req, {
      action: "auth.password.reset_admin_ui",
      entityType: "user",
      entityId: target.id,
      meta: {
        targetEmail: target.email,
        targetRole: target.role,
      },
    });
    if (target.role === "admin") {
      await notifyAdminSensitiveAction({
        action: "auth.password.reset_admin_ui",
        operator: `${req.user.email} (id=${req.user.id})`,
        targetEmail: target.email,
        targetRole: target.role,
        extra: null,
      });
    }
    res.json({ ok: true });
  },
);

router.post(
  "/admin/users/:id/disable-twofa",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    const hadSecret = Boolean(target.twofaSecret);
    const wasEnabled = target.twofaEnabled === "true";
    await db
      .update(usersTable)
      .set({
        twofaSecret: null,
        twofaEnabled: "false",
        emailOtpHash: null,
        emailOtpExpiresAt: null,
      })
      .where(eq(usersTable.id, targetId));
    await audit(req, {
      action: "auth.2fa.disable_admin_ui",
      entityType: "user",
      entityId: target.id,
      meta: {
        targetEmail: target.email,
        targetRole: target.role,
        hadSecret,
        wasEnabled,
      },
    });
    if (target.role === "admin") {
      await notifyAdminSensitiveAction({
        action: "auth.2fa.disable_admin_ui",
        operator: `${req.user.email} (id=${req.user.id})`,
        targetEmail: target.email,
        targetRole: target.role,
        extra: { hadSecret, wasEnabled },
      });
    }
    res.json({ ok: true });
  },
);

router.get(
  "/admin/audit",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const rows = await db
      .select()
      .from(auditLogTable)
      .orderBy(desc(auditLogTable.createdAt))
      .limit(limit);
    res.json(
      rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        ip: r.ip,
        userAgent: r.userAgent,
        meta: r.meta,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  },
);

export default router;
