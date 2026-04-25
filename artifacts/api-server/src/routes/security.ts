import { Router, type IRouter } from "express";
import { desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  ipBlocklistTable,
  securityAlertsTable,
} from "@workspace/db";
import { requirePortalAuth, requirePortalAdmin } from "../lib/auth";
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

export default router;
