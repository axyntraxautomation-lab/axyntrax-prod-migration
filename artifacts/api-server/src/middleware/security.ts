import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  getClientIp,
  getLockdownCached,
  isIpBlocked,
  recordAlert,
} from "../lib/security";

// Allowed paths even when the IP is blocked: lets a locked-out admin reach the
// security console / unblock endpoint and self-recover. Admin auth is still
// required by the route handlers.
const BLOCKLIST_RECOVERY_PATHS = [
  "/api/portal/admin/security",
];

function hasValidAdminCookie(req: Request): boolean {
  const token = (req.cookies as Record<string, string> | undefined)?.["axyn_portal"];
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    const payload = jwt.verify(token, secret) as { kind?: string };
    return payload?.kind === "admin";
  } catch {
    return false;
  }
}

export async function blocklistGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = getClientIp(req);
  if (await isIpBlocked(ip)) {
    const path = req.originalUrl ?? req.path;
    // Recovery escape hatch: admin with a still-valid session cookie reaching
    // the security admin endpoints can always proceed (so they can unblock
    // themselves). Brute-force login attempts hitting auth endpoints are NOT
    // exempt and remain blocked.
    if (
      hasValidAdminCookie(req) &&
      BLOCKLIST_RECOVERY_PATHS.some((p) => path.startsWith(p))
    ) {
      next();
      return;
    }
    res.status(403).json({
      error: "Acceso bloqueado temporalmente",
      reason: "IP en lista de bloqueo de seguridad",
    });
    return;
  }
  next();
}

const LOCKDOWN_ALLOW_PATHS = [
  "/api/portal/auth/login",
  "/api/portal/auth/logout",
  "/api/portal/auth/me",
  "/api/portal/admin",
  "/api/portal/lockdown-status",
];

export async function lockdownGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const lock = await getLockdownCached();
  if (!lock.active) {
    next();
    return;
  }
  const path = req.originalUrl ?? req.path;
  if (LOCKDOWN_ALLOW_PATHS.some((p) => path.startsWith(p))) {
    next();
    return;
  }
  if (req.portal && req.portal.kind === "admin") {
    next();
    return;
  }
  res.status(503).json({
    error: "Sistema en modo blindaje",
    reason: lock.reason ?? "El administrador activó el bloqueo de seguridad.",
  });
}

export async function recordSuspicious(
  req: Request,
  type: string,
  message: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await recordAlert(req, {
    type,
    severity: "warning",
    message,
    meta,
  });
}
