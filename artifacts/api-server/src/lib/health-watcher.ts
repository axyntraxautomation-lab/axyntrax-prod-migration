import { logger } from "./logger";

/**
 * Watcher in-process: cada 5 min hace HEAD/GET a los servicios del SaaS
 * (api-server propio, dashboard, portal, tenant, wa-worker). Si alguno
 * falla 2 ticks consecutivos (≥10 min de caída), loguea error estructurado
 * y manda email al dueño si SECURITY_ALERT_EMAIL está seteado.
 *
 * NO usa el wa-worker para alertar (sería circular si wa-worker es lo que
 * está caído). Usa email como canal externo.
 */

const TICK_MS = 5 * 60 * 1000;
const FAIL_THRESHOLD = 2;

interface HealthTarget {
  name: string;
  url: string;
  expectStatusBelow?: number; // default 500
}

function buildTargets(): HealthTarget[] {
  const proxyBase = "http://localhost:80";
  return [
    { name: "api-server", url: `${proxyBase}/api/healthz` },
    { name: "dashboard", url: `${proxyBase}/` },
    { name: "portal", url: `${proxyBase}/portal/` },
    { name: "tenant", url: `${proxyBase}/tenant/` },
    {
      name: "wa-worker",
      url: `${process.env["WA_WORKER_BASE_URL"] || "http://localhost:8099"}/healthz`,
    },
  ];
}

const failCount = new Map<string, number>();
const alertedDown = new Set<string>();
let started = false;

async function probeOne(t: HealthTarget): Promise<{ ok: boolean; detail: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(t.url, { method: "GET", signal: ctrl.signal });
    const expectBelow = t.expectStatusBelow ?? 500;
    if (r.status < expectBelow) return { ok: true, detail: `status=${r.status}` };
    return { ok: false, detail: `status=${r.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: msg };
  } finally {
    clearTimeout(timer);
  }
}

async function notifyOwnerHealth(opts: {
  service: string;
  state: "down" | "recovered";
  detail: string;
}): Promise<void> {
  const ownerEmail = (process.env["SECURITY_ALERT_EMAIL"] || process.env["OWNER_ALERT_EMAIL"] || "").trim();
  if (!ownerEmail) return;
  try {
    const { sendGmail } = await import("./gmail-client");
    const subject =
      opts.state === "down"
        ? `[AXYNTRAX] Servicio caído: ${opts.service}`
        : `[AXYNTRAX] Servicio recuperado: ${opts.service}`;
    const body =
      opts.state === "down"
        ? `El servicio ${opts.service} no responde hace al menos ${(FAIL_THRESHOLD * TICK_MS) / 60000} min.\n\nDetalle: ${opts.detail}\n\nRevisar workflows y logs del Reserved VM.`
        : `El servicio ${opts.service} volvió a responder.\n\nDetalle: ${opts.detail}`;
    await sendGmail({ to: ownerEmail, subject, body });
  } catch (err) {
    logger.warn({ err, service: opts.service }, "[health-watcher] no se pudo enviar email");
  }
}

async function tick(): Promise<void> {
  const targets = buildTargets();
  for (const t of targets) {
    const r = await probeOne(t);
    if (r.ok) {
      const prev = failCount.get(t.name) ?? 0;
      failCount.set(t.name, 0);
      if (alertedDown.has(t.name)) {
        alertedDown.delete(t.name);
        logger.info({ service: t.name }, "[health-watcher] servicio recuperado");
        void notifyOwnerHealth({ service: t.name, state: "recovered", detail: r.detail }).catch(
          () => {},
        );
      } else if (prev > 0) {
        logger.info({ service: t.name, prev }, "[health-watcher] servicio responde de nuevo");
      }
      continue;
    }
    const next = (failCount.get(t.name) ?? 0) + 1;
    failCount.set(t.name, next);
    logger.warn(
      { service: t.name, fails: next, detail: r.detail },
      "[health-watcher] probe falló",
    );
    if (next >= FAIL_THRESHOLD && !alertedDown.has(t.name)) {
      alertedDown.add(t.name);
      logger.error(
        { service: t.name, fails: next, detail: r.detail },
        "[health-watcher] SERVICIO CAÍDO — alertando al dueño",
      );
      void notifyOwnerHealth({ service: t.name, state: "down", detail: r.detail }).catch(
        () => {},
      );
    }
  }
}

export function startHealthWatcher(): void {
  if (started) return;
  if (process.env["DISABLE_HEALTH_WATCHER"] === "true") {
    logger.info("[health-watcher] deshabilitado por env");
    return;
  }
  started = true;
  // Primer probe en 90s para dejar que todos los workflows arranquen.
  setTimeout(() => {
    void tick().catch((err) => logger.error({ err }, "[health-watcher] tick falló"));
  }, 90_000).unref();
  setInterval(() => {
    void tick().catch((err) => logger.error({ err }, "[health-watcher] tick falló"));
  }, TICK_MS).unref();
  logger.info({ tickMs: TICK_MS }, "[health-watcher] iniciado");
}
