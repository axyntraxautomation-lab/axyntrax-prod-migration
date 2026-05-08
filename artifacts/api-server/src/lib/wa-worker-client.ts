import { createHash } from "node:crypto";
import { logger } from "./logger";

const BASE_URL =
  process.env["WA_WORKER_BASE_URL"] ?? "http://localhost:8099";

function getInternalToken(): string | null {
  const explicit = process.env["WA_WORKER_INTERNAL_TOKEN"];
  if (explicit && explicit.length > 0) return explicit;
  const seed = process.env["SESSION_SECRET"];
  if (!seed) return null;
  return createHash("sha256").update(seed).update("wa-worker").digest("hex");
}

export interface WaWorkerSessionState {
  status: string;
  qrDataUrl: string | null;
  phone: string | null;
  mock: boolean;
}

async function call<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<{ ok: boolean; status: number; body: T | null; error?: string }> {
  const token = getInternalToken();
  if (!token) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: "wa_worker_token_unavailable",
    };
  }
  try {
    const r = await fetch(`${BASE_URL}${path}`, {
      method: init.method,
      headers: {
        "x-wa-worker-token": token,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    let body: unknown = null;
    try {
      body = await r.json();
    } catch {
      body = null;
    }
    if (r.status >= 500) {
      logger.warn(
        { path, baseUrl: BASE_URL, status: r.status, body },
        "wa-worker call returned 5xx",
      );
    }
    return { ok: r.ok, status: r.status, body: body as T };
  } catch (err) {
    logger.warn({ err, path, baseUrl: BASE_URL }, "wa-worker call failed");
    return { ok: false, status: 0, body: null, error: String(err) };
  }
}

let healthCache: { online: boolean; checkedAt: number } | null = null;
const HEALTH_TTL_MS = 30_000;

/**
 * Probe rápido al wa-worker (`GET /healthz`) con cache 30s en memoria y
 * timeout 2s. Devuelve `false` si está caído / no responde / no contesta a
 * tiempo. NO requiere internal token: `/healthz` es público.
 *
 * Pasar `{ fresh: true }` desde rutas críticas (p.ej. POST sesion/iniciar)
 * para saltar la cache y evitar falsos negativos hasta 30s después de que
 * el worker recupere.
 */
export async function isWorkerOnline(opts?: { fresh?: boolean }): Promise<boolean> {
  const now = Date.now();
  if (
    !opts?.fresh &&
    healthCache &&
    now - healthCache.checkedAt < HEALTH_TTL_MS
  ) {
    return healthCache.online;
  }
  let online = false;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 2_000);
    try {
      const r = await fetch(`${BASE_URL}/healthz`, { signal: ctl.signal });
      online = r.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    logger.warn({ err, baseUrl: BASE_URL }, "wa-worker healthz probe failed");
    online = false;
  }
  healthCache = { online, checkedAt: now };
  return online;
}

export function startSession(tenantId: string) {
  return call<{ ok: boolean; state: WaWorkerSessionState }>("/wa/sesion/iniciar", {
    method: "POST",
    body: { tenant_id: tenantId },
  });
}

export function stopSession(tenantId: string) {
  return call<{ ok: boolean }>("/wa/sesion/detener", {
    method: "POST",
    body: { tenant_id: tenantId },
  });
}

export function getSessionState(tenantId: string) {
  return call<{ state: WaWorkerSessionState }>(
    `/wa/sesion/estado?tenant_id=${encodeURIComponent(tenantId)}`,
    { method: "GET" },
  );
}

export function sendOutbound(input: {
  tenantId: string;
  to: string;
  text: string;
}) {
  return call<{ ok: boolean; reason?: string }>("/wa/enviar", {
    method: "POST",
    body: { tenant_id: input.tenantId, to: input.to, text: input.text },
  });
}

export function isInternalRequestAuthorized(headerValue: string | undefined): boolean {
  const token = getInternalToken();
  if (!token) return false;
  return headerValue === token;
}
