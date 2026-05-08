import type { Request } from "express";
import { db, auditLogTable } from "@workspace/db";
import { logger } from "./logger";

export interface AuditEntry {
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  meta?: Record<string, unknown> | null;
}

export async function audit(req: Request, entry: AuditEntry): Promise<void> {
  try {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers["user-agent"] ?? null;
    await db.insert(auditLogTable).values({
      userId: req.user?.id ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId:
        entry.entityId !== null && entry.entityId !== undefined
          ? String(entry.entityId)
          : null,
      ip,
      userAgent,
      meta: entry.meta ?? null,
    });
  } catch (err) {
    logger.warn({ err, entry }, "Failed to write audit log");
  }
}
