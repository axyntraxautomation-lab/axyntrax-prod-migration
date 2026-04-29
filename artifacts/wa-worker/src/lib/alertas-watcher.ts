import { sendText } from "./session-manager";
import { getSupabase } from "./supabase";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 30_000;
let lastSeenAt = new Date(Date.now() - 60_000).toISOString();
let timer: NodeJS.Timeout | null = null;

interface AlertaRow {
  id: string;
  tenant_id: string;
  severidad: string;
  titulo: string;
  detalle: string | null;
  created_at: string;
}

interface TenantRow {
  id: string;
  metadata: Record<string, unknown> | null;
  whatsapp_phone?: string | null;
}

/**
 * Periodically polls tenant_alertas for new severidad='critica' entries and
 * delivers them via the tenant's own WhatsApp session. Polling avoids the
 * complexity of Realtime subscriptions in a long-running worker.
 */
export function startAlertasWatcher(): void {
  if (timer) return;
  timer = setInterval(() => {
    void pollOnce().catch((err) =>
      logger.warn({ err }, "alertas watcher pollOnce threw"),
    );
  }, POLL_INTERVAL_MS);
  logger.info("alertas watcher started");
}

async function pollOnce(): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tenant_alertas")
    .select("id, tenant_id, severidad, titulo, detalle, created_at")
    .eq("severidad", "critica")
    .gt("created_at", lastSeenAt)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    logger.warn({ error }, "alertas watcher select failed");
    return;
  }
  const rows = (data ?? []) as AlertaRow[];
  if (rows.length === 0) return;

  for (const row of rows) {
    const number = await resolveTenantPhone(row.tenant_id);
    if (!number) continue;
    const text = row.detalle
      ? `Alerta crítica: ${row.titulo}\n${row.detalle}`
      : `Alerta crítica: ${row.titulo}`;
    const r = await sendText(row.tenant_id, number, text);
    if (!r.ok) {
      logger.warn(
        { tenantId: row.tenant_id, alertaId: row.id, reason: r.reason },
        "alerta WhatsApp send failed",
      );
    }
  }
  lastSeenAt = rows[rows.length - 1]!.created_at;
}

async function resolveTenantPhone(tenantId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("tenants")
    .select("metadata, whatsapp_phone")
    .eq("id", tenantId)
    .maybeSingle();
  if (!data) return null;
  const t = data as TenantRow;
  if (t.whatsapp_phone) return t.whatsapp_phone;
  const meta = (t.metadata ?? {}) as Record<string, unknown>;
  const a = meta["tenantWhatsappNumber"];
  if (typeof a === "string" && a.length > 0) return a;
  const b = meta["whatsappPhone"];
  if (typeof b === "string" && b.length > 0) return b;
  return null;
}

export function _stopAlertasWatcher(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
