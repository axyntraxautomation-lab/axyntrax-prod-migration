import type { Request } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import {
  db,
  ipBlocklistTable,
  lockdownStateTable,
  securityAlertsTable,
  usersTable,
} from "@workspace/db";
import { logger } from "./logger";
import { sendPushToUser } from "./push";

const FAILED_WINDOW_MS = 10 * 60 * 1000;
const FAILED_THRESHOLD = 5;
const BLOCK_TTL_MS = 15 * 60 * 1000;
const FAILED_MAX_ENTRIES = 10_000;
const FAILED_SWEEP_MS = 60 * 1000;

const failedAttempts = new Map<string, { count: number; first: number }>();

function sweepFailedAttempts(): void {
  const now = Date.now();
  for (const [key, val] of failedAttempts) {
    if (now - val.first > FAILED_WINDOW_MS) failedAttempts.delete(key);
  }
  // Hard cap to avoid unbounded growth under credential-stuffing storms.
  if (failedAttempts.size > FAILED_MAX_ENTRIES) {
    const overflow = failedAttempts.size - FAILED_MAX_ENTRIES;
    let i = 0;
    for (const k of failedAttempts.keys()) {
      if (i++ >= overflow) break;
      failedAttempts.delete(k);
    }
  }
}

setInterval(sweepFailedAttempts, FAILED_SWEEP_MS).unref();

export function getClientIp(req: Request): string {
  // Trust express trust-proxy parsing (req.ip) instead of raw x-forwarded-for,
  // which is spoofable. Falls back to socket address if behind no proxy.
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

export interface AlertInput {
  type: string;
  severity?: "info" | "warning" | "critical";
  message: string;
  meta?: Record<string, unknown>;
  notifyAdmins?: boolean;
}

export async function recordAlert(
  req: Request | null,
  input: AlertInput,
): Promise<void> {
  const severity = input.severity ?? "warning";
  try {
    const [row] = await db
      .insert(securityAlertsTable)
      .values({
        type: input.type,
        severity,
        ip: req ? getClientIp(req) : null,
        userAgent: req ? (req.headers["user-agent"] as string | undefined) ?? null : null,
        path: req ? req.originalUrl ?? req.path : null,
        message: input.message,
        meta: input.meta ?? null,
      })
      .returning({ id: securityAlertsTable.id });

    logger.warn(
      { type: input.type, severity, alertId: row?.id, ip: req ? getClientIp(req) : null },
      "security alert",
    );

    if (severity === "critical" || input.notifyAdmins) {
      void notifyAdmins(input.type, input.message);
    }
  } catch (err) {
    logger.error({ err, type: input.type }, "failed to record security alert");
  }
}

async function notifyAdmins(type: string, message: string): Promise<void> {
  try {
    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));
    for (const a of admins) {
      try {
        await sendPushToUser(a.id, {
          title: `Alerta de seguridad · ${type}`,
          body: message.slice(0, 180),
          url: "/portal/admin/seguridad",
          tag: `sec-${type}`,
        });
      } catch (err) {
        logger.warn({ err, adminId: a.id }, "failed to push security alert");
      }
    }
  } catch (err) {
    logger.error({ err }, "notifyAdmins failed");
  }
}

export async function blockIp(
  ip: string,
  reason: string,
  ttlMs: number = BLOCK_TTL_MS,
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMs);
  try {
    await db
      .insert(ipBlocklistTable)
      .values({ ip, reason, expiresAt })
      .onConflictDoUpdate({
        target: ipBlocklistTable.ip,
        set: { reason, expiresAt },
      });
  } catch (err) {
    logger.error({ err, ip }, "failed to block ip");
  }
}

export async function unblockIp(ip: string): Promise<void> {
  await db.delete(ipBlocklistTable).where(eq(ipBlocklistTable.ip, ip));
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const [row] = await db
    .select({ id: ipBlocklistTable.id })
    .from(ipBlocklistTable)
    .where(
      and(eq(ipBlocklistTable.ip, ip), gt(ipBlocklistTable.expiresAt, new Date())),
    )
    .limit(1);
  return !!row;
}

export function trackFailedLogin(
  req: Request,
  identifier: string,
): { count: number; shouldBlock: boolean } {
  const ip = getClientIp(req);
  const key = `${ip}|${identifier.toLowerCase()}`;
  const now = Date.now();
  const cur = failedAttempts.get(key);
  if (!cur || now - cur.first > FAILED_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, first: now });
    return { count: 1, shouldBlock: false };
  }
  cur.count += 1;
  failedAttempts.set(key, cur);
  return { count: cur.count, shouldBlock: cur.count >= FAILED_THRESHOLD };
}

export function clearFailedLogin(req: Request, identifier: string): void {
  const ip = getClientIp(req);
  failedAttempts.delete(`${ip}|${identifier.toLowerCase()}`);
}

export async function handleFailedLogin(
  req: Request,
  identifier: string,
  reason: string,
): Promise<void> {
  const { count, shouldBlock } = trackFailedLogin(req, identifier);
  await recordAlert(req, {
    type: "auth.fail",
    severity: shouldBlock ? "critical" : count >= 3 ? "warning" : "info",
    message: `Intento de login fallido (${count}) para ${identifier}: ${reason}`,
    meta: { identifier, count, reason },
    notifyAdmins: shouldBlock,
  });
  if (shouldBlock) {
    const ip = getClientIp(req);
    await blockIp(ip, "brute-force-login", BLOCK_TTL_MS);
    await recordAlert(req, {
      type: "ip.blocked",
      severity: "critical",
      message: `IP ${ip} bloqueada 15min por fuerza bruta sobre ${identifier}`,
      meta: { ip, identifier },
      notifyAdmins: true,
    });
  }
}

export interface LockdownInfo {
  active: boolean;
  reason: string | null;
  enabledBy: number | null;
  enabledAt: Date | null;
}

export async function getLockdown(): Promise<LockdownInfo> {
  const [row] = await db.select().from(lockdownStateTable).limit(1);
  if (!row) return { active: false, reason: null, enabledBy: null, enabledAt: null };
  return {
    active: row.active === 1,
    reason: row.reason,
    enabledBy: row.enabledBy,
    enabledAt: row.enabledAt,
  };
}

export async function setLockdown(
  active: boolean,
  byUserId: number,
  reason: string | null,
): Promise<LockdownInfo> {
  const [existing] = await db.select().from(lockdownStateTable).limit(1);
  if (!existing) {
    const [created] = await db
      .insert(lockdownStateTable)
      .values({
        active: active ? 1 : 0,
        reason,
        enabledBy: active ? byUserId : null,
        enabledAt: active ? new Date() : null,
        disabledAt: active ? null : new Date(),
      })
      .returning();
    return {
      active: created!.active === 1,
      reason: created!.reason,
      enabledBy: created!.enabledBy,
      enabledAt: created!.enabledAt,
    };
  }
  const [updated] = await db
    .update(lockdownStateTable)
    .set({
      active: active ? 1 : 0,
      reason,
      enabledBy: active ? byUserId : existing.enabledBy,
      enabledAt: active ? new Date() : existing.enabledAt,
      disabledAt: active ? null : new Date(),
    })
    .where(eq(lockdownStateTable.id, existing.id))
    .returning();
  return {
    active: updated!.active === 1,
    reason: updated!.reason,
    enabledBy: updated!.enabledBy,
    enabledAt: updated!.enabledAt,
  };
}

let lockdownCache: { value: LockdownInfo; at: number } | null = null;
const LOCKDOWN_CACHE_MS = 5_000;

export async function getLockdownCached(): Promise<LockdownInfo> {
  const now = Date.now();
  if (lockdownCache && now - lockdownCache.at < LOCKDOWN_CACHE_MS) {
    return lockdownCache.value;
  }
  const value = await getLockdown();
  lockdownCache = { value, at: now };
  return value;
}

export function invalidateLockdownCache(): void {
  lockdownCache = null;
}

export async function purgeExpiredBlocks(): Promise<void> {
  await db
    .delete(ipBlocklistTable)
    .where(sql`${ipBlocklistTable.expiresAt} < now()`);
}
