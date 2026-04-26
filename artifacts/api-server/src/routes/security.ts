import { Router, type IRouter } from "express";
import { and, desc, eq, gt, gte, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  auditLogTable,
  db,
  ipBlocklistTable,
  securityAlertsTable,
} from "@workspace/db";
import {
  requireAuth,
  requireRole,
  requirePortalAuth,
  requirePortalAdmin,
} from "../lib/auth";
import {
  getLockdown,
  invalidateLockdownCache,
  setLockdown,
  unblockIp,
  recordAlert,
} from "../lib/security";
import { audit } from "../lib/audit";

const router: IRouter = Router();

// Public lockdown status (used by portal/landing to show maintenance page).
router.get("/portal/lockdown-status", async (_req, res): Promise<void> => {
  const lock = await getLockdown();
  res.json({ active: lock.active, reason: lock.reason });
});

router.get(
  "/portal/admin/security/alerts",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const onlyOpen = req.query.open === "1";
    const baseQuery = db
      .select()
      .from(securityAlertsTable)
      .orderBy(desc(securityAlertsTable.createdAt))
      .limit(200);
    const rows = onlyOpen
      ? await db
          .select()
          .from(securityAlertsTable)
          .where(isNull(securityAlertsTable.ackBy))
          .orderBy(desc(securityAlertsTable.createdAt))
          .limit(200)
      : await baseQuery;
    res.json(rows);
  },
);

router.post(
  "/portal/admin/security/alerts/:id/ack",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const userId = req.portal!.kind === "admin" ? req.portal!.sub : null;
    const [updated] = await db
      .update(securityAlertsTable)
      .set({ ackBy: userId, ackAt: new Date() })
      .where(eq(securityAlertsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Alerta no encontrada" });
      return;
    }
    await audit(req, {
      action: "security.alert.ack",
      entityType: "security_alert",
      entityId: id,
    });
    res.json(updated);
  },
);

router.get(
  "/portal/admin/security/blocks",
  requirePortalAuth,
  requirePortalAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(ipBlocklistTable)
      .where(gt(ipBlocklistTable.expiresAt, new Date()))
      .orderBy(desc(ipBlocklistTable.createdAt))
      .limit(200);
    res.json(rows);
  },
);

router.delete(
  "/portal/admin/security/blocks/:ip",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const ip = req.params.ip;
    await unblockIp(ip);
    await audit(req, {
      action: "security.ip.unblock",
      entityType: "ip",
      meta: { ip },
    });
    res.json({ ok: true });
  },
);

const LockdownBody = z.object({
  active: z.boolean(),
  reason: z.string().max(500).optional(),
});

router.get(
  "/portal/admin/security/lockdown",
  requirePortalAuth,
  requirePortalAdmin,
  async (_req, res): Promise<void> => {
    const lock = await getLockdown();
    res.json(lock);
  },
);

router.post(
  "/portal/admin/security/lockdown",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const parsed = LockdownBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const userId = req.portal!.kind === "admin" ? req.portal!.sub : 0;
    const lock = await setLockdown(
      parsed.data.active,
      userId,
      parsed.data.reason ?? null,
    );
    invalidateLockdownCache();
    await audit(req, {
      action: parsed.data.active
        ? "security.lockdown.enable"
        : "security.lockdown.disable",
      entityType: "lockdown",
      meta: { reason: parsed.data.reason ?? null },
    });
    if (parsed.data.active) {
      await recordAlert(req, {
        type: "lockdown.enabled",
        severity: "critical",
        message: `Modo blindaje activado: ${parsed.data.reason ?? "(sin motivo)"}`,
        notifyAdmins: true,
      });
    }
    res.json(lock);
  },
);

/**
 * Aggregate (operator, targetEmail) combinations that triggered 2FA reset
 * alerts (sent or suppressed by throttle) inside a sliding window. Used by the
 * JARVIS admin dashboard to spot scripts/attackers that hammer the same
 * combo and would otherwise be invisible because the throttle silenced
 * Slack/email after the first hit.
 *
 * "2FA reset alerts" here means the audit_log entries the security alerts
 * helper produces for the auth.2fa.* family, plus the synthetic
 * security.alert.throttled rows whose suppressedAction belongs to that
 * family.
 */
const TWOFA_RESET_ACTION_PREFIX = "auth.2fa.";
const ALLOWED_WINDOW_HOURS = new Set([1, 24, 168]);

router.get(
  "/admin/security/twofa-reset-stats",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const rawWindow = Number(req.query.windowHours ?? 24);
    const windowHours = ALLOWED_WINDOW_HOURS.has(rawWindow) ? rawWindow : 24;
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const generatedAt = new Date();

    const operatorExpr = sql<string>`COALESCE(NULLIF(${auditLogTable.meta} ->> 'operator', ''), 'desconocido')`;
    const targetExpr = sql<string>`COALESCE(NULLIF(LOWER(${auditLogTable.meta} ->> 'targetEmail'), ''), '')`;

    const rows = await db
      .select({
        operator: operatorExpr,
        targetEmail: targetExpr,
        count: sql<number>`COUNT(*)::int`,
        sentCount: sql<number>`COUNT(*) FILTER (WHERE ${auditLogTable.action} <> 'security.alert.throttled')::int`,
        suppressedCount: sql<number>`COUNT(*) FILTER (WHERE ${auditLogTable.action} = 'security.alert.throttled')::int`,
        lastActivityAt: sql<Date>`MAX(${auditLogTable.createdAt})`,
      })
      .from(auditLogTable)
      .where(
        and(
          gte(auditLogTable.createdAt, since),
          or(
            sql`${auditLogTable.action} LIKE ${`${TWOFA_RESET_ACTION_PREFIX}%`}`,
            and(
              eq(auditLogTable.action, "security.alert.throttled"),
              sql`${auditLogTable.meta} ->> 'suppressedAction' LIKE ${`${TWOFA_RESET_ACTION_PREFIX}%`}`,
            ),
          ),
        ),
      )
      .groupBy(operatorExpr, targetExpr)
      .orderBy(desc(sql`COUNT(*)`), desc(sql`MAX(${auditLogTable.createdAt})`))
      .limit(100);

    const combos = rows.map((row) => ({
      operator: row.operator,
      targetEmail: row.targetEmail,
      count: Number(row.count) || 0,
      sentCount: Number(row.sentCount) || 0,
      suppressedCount: Number(row.suppressedCount) || 0,
      lastActivityAt:
        row.lastActivityAt instanceof Date
          ? row.lastActivityAt.toISOString()
          : new Date(row.lastActivityAt as unknown as string).toISOString(),
    }));

    res.json({
      windowHours,
      since: since.toISOString(),
      generatedAt: generatedAt.toISOString(),
      combos,
    });
  },
);

export default router;
