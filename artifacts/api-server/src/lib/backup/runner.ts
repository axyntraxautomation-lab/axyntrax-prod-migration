import { getSupabaseDb, tenantBackupsTable } from "@workspace/db-supabase";
import { logger } from "../logger";
import { exportTenantData } from "./exporter";
import {
  DriveNotConfiguredError,
  pruneOldBackups,
  uploadBackupToDrive,
} from "./drive-client";

export interface BackupRunResult {
  ok: boolean;
  filename: string;
  fileId?: string;
  fileUrl?: string;
  sizeBytes: number;
  rawBytes: number;
  tenantsIncluded: number;
  retention?: { deleted: number; kept: number };
  error?: string;
  driveNotConfigured?: boolean;
}

function buildFilename(now = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hhmm = `${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}`;
  return `axyntrax-saas-backup-${yyyy}${mm}${dd}-${hhmm}Z.json.gz`;
}

async function persistBackupRow(opts: {
  tenantId: string;
  estado: "ok" | "error";
  fileId?: string;
  fileUrl?: string;
  sizeBytes: number;
  metadata: Record<string, unknown>;
  error?: string;
}): Promise<void> {
  const sdb = getSupabaseDb();
  await sdb.insert(tenantBackupsTable).values({
    tenantId: opts.tenantId,
    destino: "google_drive",
    fileId: opts.fileId ?? null,
    fileUrl: opts.fileUrl ?? null,
    sizeBytes: opts.sizeBytes,
    estado: opts.estado,
    error: opts.error ?? null,
    metadata: opts.metadata,
  });
}

/**
 * Corre un backup full consolidado: exporta tablas tenant_*, sube a Drive,
 * persiste 1 fila por tenant en `tenant_backups` y aplica retención (30).
 *
 * Si Drive no está conectado, registra cada tenant con estado='error' y un
 * mensaje claro, y retorna ok:false sin tirar el caller.
 */
export async function runFullBackup(opts: {
  trigger: "scheduler" | "manual";
  triggeredBy?: string;
} = { trigger: "scheduler" }): Promise<BackupRunResult> {
  const startedAt = Date.now();
  const filename = buildFilename();
  let exported;
  try {
    exported = await exportTenantData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "[backup] export falló");
    return {
      ok: false,
      filename,
      sizeBytes: 0,
      rawBytes: 0,
      tenantsIncluded: 0,
      error: `export: ${msg}`,
    };
  }

  const baseMeta = {
    tipo: "full" as const,
    trigger: opts.trigger,
    triggeredBy: opts.triggeredBy ?? null,
    durationMs: 0,
    rawBytes: exported.rawBytes,
    rowCounts: exported.rowCounts,
    filename,
  };

  try {
    const upload = await uploadBackupToDrive({
      filename,
      payload: exported.payload,
      description: `AXYNTRAX SaaS Cecilia backup ${filename} (${exported.tenantsIncluded.length} tenants, ${exported.payload.length} bytes gzipped)`,
    });
    let retention: { deleted: number; kept: number } | undefined;
    try {
      retention = await pruneOldBackups(upload.folderId);
    } catch (err) {
      logger.warn({ err }, "[backup] retención falló (no bloquea)");
    }
    const meta = {
      ...baseMeta,
      durationMs: Date.now() - startedAt,
      driveFileId: upload.fileId,
      driveFolderId: upload.folderId,
      retention: retention ?? null,
    };
    if (exported.tenantsIncluded.length === 0) {
      logger.warn("[backup] no hay tenants para registrar histórico, backup file subido igual");
    }
    for (const tenantId of exported.tenantsIncluded) {
      await persistBackupRow({
        tenantId,
        estado: "ok",
        fileId: upload.fileId,
        fileUrl: upload.fileUrl,
        sizeBytes: exported.payload.length,
        metadata: meta,
      });
    }
    logger.info(
      {
        filename,
        bytes: exported.payload.length,
        tenants: exported.tenantsIncluded.length,
        retention,
      },
      "[backup] full backup OK",
    );
    return {
      ok: true,
      filename,
      fileId: upload.fileId,
      fileUrl: upload.fileUrl,
      sizeBytes: exported.payload.length,
      rawBytes: exported.rawBytes,
      tenantsIncluded: exported.tenantsIncluded.length,
      retention,
    };
  } catch (err) {
    const driveNotConfigured = err instanceof DriveNotConfiguredError;
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, driveNotConfigured }, "[backup] subida a Drive falló");
    const errorMeta = {
      ...baseMeta,
      durationMs: Date.now() - startedAt,
      error: msg,
      driveNotConfigured,
    };
    for (const tenantId of exported.tenantsIncluded) {
      try {
        await persistBackupRow({
          tenantId,
          estado: "error",
          sizeBytes: exported.payload.length,
          metadata: errorMeta,
          error: msg.slice(0, 500),
        });
      } catch (persistErr) {
        logger.warn({ persistErr, tenantId }, "[backup] no se pudo persistir fila de error");
      }
    }
    void notifyOwnerBackupFailure({ filename, error: msg, driveNotConfigured }).catch(
      (notifyErr) => logger.warn({ notifyErr }, "[backup] alerta dueño falló"),
    );
    return {
      ok: false,
      filename,
      sizeBytes: exported.payload.length,
      rawBytes: exported.rawBytes,
      tenantsIncluded: exported.tenantsIncluded.length,
      error: msg,
      driveNotConfigured,
    };
  }
}

/**
 * Avisa al dueño AXYNTRAX si el backup falló. Hoy: log estructurado + email
 * vía gmail-client si SECURITY_ALERT_EMAIL está configurado. WhatsApp queda
 * pendiente del bot JARVIS para no acoplar wa-worker (que es para tenants).
 */
async function notifyOwnerBackupFailure(opts: {
  filename: string;
  error: string;
  driveNotConfigured: boolean;
}): Promise<void> {
  logger.error(
    {
      filename: opts.filename,
      error: opts.error,
      driveNotConfigured: opts.driveNotConfigured,
    },
    opts.driveNotConfigured
      ? "[backup] DRIVE NO CONECTADO — el dueño AXYNTRAX debe completar el OAuth de Google Drive desde el panel de integraciones. Mientras tanto los backups quedan registrados como error."
      : "[backup] FALLO BACKUP DIARIO — revisar logs y reintentar manualmente",
  );

  const ownerEmail = (process.env.SECURITY_ALERT_EMAIL || process.env.OWNER_ALERT_EMAIL || "").trim();
  if (!ownerEmail) return;
  try {
    const { sendGmail } = await import("../gmail-client");
    await sendGmail({
      to: ownerEmail,
      subject: `[AXYNTRAX] Backup SaaS falló: ${opts.filename}`,
      body: opts.driveNotConfigured
        ? `El job de backup diario corrió pero Google Drive no está conectado.\n\nConecta Drive desde el panel de integraciones (one-time OAuth) y los siguientes runs subirán automáticamente.\n\nArchivo: ${opts.filename}\nError: ${opts.error}`
        : `Backup falló.\n\nArchivo: ${opts.filename}\nError: ${opts.error}\n\nRevisar logs del api-server.`,
    });
  } catch (err) {
    logger.warn({ err }, "[backup] no se pudo enviar email al dueño");
  }
}
