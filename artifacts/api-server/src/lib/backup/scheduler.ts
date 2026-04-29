import { isSupabaseConfigured } from "@workspace/db-supabase";
import { logger } from "../logger";
import { runFullBackup } from "./runner";

const HOUR_MS = 60 * 60 * 1000;
const TARGET_HOUR_LIMA = 3; // 3am Lima (UTC-5, sin DST)
const LIMA_OFFSET_MIN = -5 * 60;
const TICK_MS = HOUR_MS;

let started = false;
let lastRunYmdLima: string | null = null;
let inFlight = false;

function nowLima(now = new Date()): { hour: number; ymd: string } {
  const limaMs = now.getTime() + LIMA_OFFSET_MIN * 60 * 1000;
  const d = new Date(limaMs);
  const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return { hour: d.getUTCHours(), ymd };
}

async function tick(): Promise<void> {
  if (inFlight) return;
  const { hour, ymd } = nowLima();
  if (hour !== TARGET_HOUR_LIMA) return;
  if (lastRunYmdLima === ymd) return;
  inFlight = true;
  lastRunYmdLima = ymd;
  try {
    logger.info({ ymd }, "[backup] disparando backup diario programado");
    const r = await runFullBackup({ trigger: "scheduler" });
    logger.info(
      { ok: r.ok, fileId: r.fileId, bytes: r.sizeBytes },
      "[backup] backup programado terminó",
    );
  } catch (err) {
    logger.error({ err }, "[backup] tick falló");
  } finally {
    inFlight = false;
  }
}

export function startTenantBackupScheduler(): void {
  if (started) return;
  if (!isSupabaseConfigured()) {
    logger.warn("[backup] Supabase no configurado, scheduler no inicia");
    return;
  }
  started = true;
  // Primer chequeo en 60s; luego cada hora chequea si es 3am Lima y aún no
  // corrió hoy. Esto sobrevive a desfasajes de cron y reinicios de proceso.
  const safeTick = (): void => {
    tick().catch((err) => logger.error({ err }, "[backup] tick rechazado"));
  };
  setTimeout(safeTick, 60_000).unref();
  setInterval(safeTick, TICK_MS).unref();
  logger.info(
    { targetHourLima: TARGET_HOUR_LIMA },
    "[backup] scheduler iniciado (chequeo horario, dispara a 3am Lima)",
  );
}

// Test helper.
export function _resetBackupSchedulerForTests(): void {
  started = false;
  lastRunYmdLima = null;
  inFlight = false;
}
