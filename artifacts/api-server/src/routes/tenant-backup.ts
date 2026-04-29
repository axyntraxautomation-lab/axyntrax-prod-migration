import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { desc, eq } from "drizzle-orm";
import {
  getSupabaseDb,
  tenantBackupsTable,
  isSupabaseConfigured,
} from "@workspace/db-supabase";
import { requirePortalAuth, requirePortalAdmin } from "../lib/auth";
import { runFullBackup } from "../lib/backup/runner";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function gateSupabase(req: Request, res: Response, next: NextFunction): void {
  if (!isSupabaseConfigured()) {
    res.status(503).json({
      error: "El módulo SaaS Cecilia aún no está configurado en este entorno.",
      code: "supabase_not_configured",
    });
    return;
  }
  next();
}

let manualInFlight = false;

/**
 * POST /api/tenant/backup/ahora
 * Solo dueño AXYNTRAX (rol admin). Dispara un backup full on-demand.
 */
router.post(
  "/tenant/backup/ahora",
  gateSupabase,
  requirePortalAuth,
  requirePortalAdmin,
  async (req: Request, res: Response) => {
    if (manualInFlight) {
      res.status(429).json({
        error: "Ya hay un backup manual en curso, espera a que termine.",
        code: "backup_in_flight",
      });
      return;
    }
    manualInFlight = true;
    try {
      const triggeredBy = req.portal?.sub ? String(req.portal.sub) : "admin";
      const result = await runFullBackup({ trigger: "manual", triggeredBy });
      const status = result.ok ? 200 : result.driveNotConfigured ? 503 : 500;
      res.status(status).json({
        ok: result.ok,
        filename: result.filename,
        fileId: result.fileId ?? null,
        fileUrl: result.fileUrl ?? null,
        sizeBytes: result.sizeBytes,
        tenantsIncluded: result.tenantsIncluded,
        retention: result.retention ?? null,
        error: result.error ?? null,
        driveNotConfigured: result.driveNotConfigured ?? false,
      });
    } catch (err) {
      logger.error({ err }, "[backup] /tenant/backup/ahora falló");
      res.status(500).json({ error: "backup_failed" });
    } finally {
      manualInFlight = false;
    }
  },
);

/**
 * GET /api/tenant/backup/historial?limit=30
 * Solo dueño AXYNTRAX. Lista los últimos backups (todos los tenants).
 */
router.get(
  "/tenant/backup/historial",
  gateSupabase,
  requirePortalAuth,
  requirePortalAdmin,
  async (req: Request, res: Response) => {
    const limit = Math.min(100, Math.max(1, Number(req.query["limit"]) || 30));
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantBackupsTable)
      .orderBy(desc(tenantBackupsTable.createdAt))
      .limit(limit);
    res.json({
      backups: rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        destino: r.destino,
        fileId: r.fileId,
        fileUrl: r.fileUrl,
        sizeBytes: r.sizeBytes,
        estado: r.estado,
        error: r.error,
        createdAt: r.createdAt,
        metadata: r.metadata,
      })),
    });
  },
);

/**
 * GET /api/tenant/backup/historial/:tenantId
 * Solo dueño AXYNTRAX. Lista backups de un tenant específico.
 */
router.get(
  "/tenant/backup/historial/:tenantId",
  gateSupabase,
  requirePortalAuth,
  requirePortalAdmin,
  async (req: Request, res: Response) => {
    const tenantId = String(req.params["tenantId"] || "");
    if (!tenantId) {
      res.status(400).json({ error: "tenant_id requerido" });
      return;
    }
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantBackupsTable)
      .where(eq(tenantBackupsTable.tenantId, tenantId))
      .orderBy(desc(tenantBackupsTable.createdAt))
      .limit(60);
    res.json({ backups: rows });
  },
);

export default router;
