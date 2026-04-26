import { Router, type IRouter } from "express";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  like,
  lt,
  lte,
  not,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
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

// Caracteres especiales de LIKE/ILIKE en Postgres. Los escapamos para que el
// usuario pueda buscar por strings que contengan `%` o `_` literalmente.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

router.get(
  "/admin/audit",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const limit = Math.min(
      Math.max(Number(req.query.limit ?? 100) || 100, 1),
      500,
    );
    const filters: SQL[] = [];
    const fromRaw = typeof req.query.from === "string" ? req.query.from : null;
    const toRaw = typeof req.query.to === "string" ? req.query.to : null;
    if (fromRaw) {
      const from = new Date(fromRaw);
      if (!Number.isNaN(from.getTime())) {
        filters.push(gte(auditLogTable.createdAt, from));
      }
    }
    if (toRaw) {
      const to = new Date(toRaw);
      if (!Number.isNaN(to.getTime())) {
        filters.push(lte(auditLogTable.createdAt, to));
      }
    }

    const action =
      typeof req.query.action === "string" ? req.query.action.trim() : "";
    const actionPrefix =
      typeof req.query.actionPrefix === "string"
        ? req.query.actionPrefix.trim()
        : "";
    if (action) {
      // Match exacto tiene prioridad sobre prefijo (ver descripción del param).
      filters.push(eq(auditLogTable.action, action.slice(0, 64)));
    } else if (actionPrefix) {
      filters.push(
        like(
          auditLogTable.action,
          `${escapeLikePattern(actionPrefix.slice(0, 64))}%`,
        ),
      );
    }

    const actionExcludeRaw =
      typeof req.query.actionExclude === "string"
        ? req.query.actionExclude
        : "";
    if (actionExcludeRaw) {
      const prefixes = actionExcludeRaw
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .slice(0, 16);
      for (const prefix of prefixes) {
        filters.push(
          not(
            like(
              auditLogTable.action,
              `${escapeLikePattern(prefix.slice(0, 64))}%`,
            ),
          ),
        );
      }
    }

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q) {
      const pattern = `%${escapeLikePattern(q.slice(0, 200))}%`;
      const searchClause = or(
        ilike(auditLogTable.entityType, pattern),
        ilike(auditLogTable.entityId, pattern),
        sql`${auditLogTable.meta} ->> 'operator' ILIKE ${pattern}`,
        sql`${auditLogTable.meta} ->> 'targetEmail' ILIKE ${pattern}`,
        sql`${auditLogTable.meta} ->> 'email' ILIKE ${pattern}`,
        sql`${auditLogTable.meta} ->> 'actorEmail' ILIKE ${pattern}`,
        sql`${auditLogTable.meta} ->> 'userEmail' ILIKE ${pattern}`,
      );
      if (searchClause) filters.push(searchClause);
    }

    const beforeRaw = req.query.before;
    if (beforeRaw !== undefined && beforeRaw !== "") {
      const before = Number(beforeRaw);
      if (Number.isFinite(before) && before > 0) {
        filters.push(lt(auditLogTable.id, Math.floor(before)));
      }
    }

    const rows = await db
      .select()
      .from(auditLogTable)
      .where(filters.length ? and(...filters) : undefined)
      // id desc como criterio de desempate estable; los ids son seriales así
      // que también garantizan orden cronológico para el cursor `before`.
      .orderBy(desc(auditLogTable.createdAt), desc(auditLogTable.id))
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
