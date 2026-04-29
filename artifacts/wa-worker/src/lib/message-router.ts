import { askCecilia } from "./cecilia-bridge";
import { matchFlujo, type FlujoState } from "./flujos-rubro";
import { filterCeciliaOutput } from "./post-filter";
import { allowModelCall } from "./rate-limit";
import { sendText } from "./session-manager";
import { getSupabase } from "./supabase";
import { logger } from "./logger";

interface InboundMessage {
  tenantId: string;
  fromNumber: string;
  text: string;
}

interface RouterContext {
  rubro: string | null;
  sessionId: string | null;
  flujoState: FlujoState | null;
  flujosAll: Record<string, FlujoState>;
}

const COMANDOS_MENU = ["/menu", "menu", "menú", "opciones"];

async function loadContext(tenantId: string, from: string): Promise<RouterContext> {
  const supabase = getSupabase();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("rubro_id")
    .eq("id", tenantId)
    .maybeSingle();

  const { data: sess } = await supabase
    .from("tenant_whatsapp_sessions")
    .select("id, metadata")
    .eq("tenant_id", tenantId)
    .eq("provider", "baileys")
    .maybeSingle();

  const flujosAll =
    (sess?.metadata as { flujos?: Record<string, FlujoState> } | null)?.flujos ??
    {};
  return {
    rubro:
      ((tenant as { rubro_id?: string | null } | null)?.rubro_id ?? null) as
        | string
        | null,
    sessionId: (sess?.id as string | null) ?? null,
    flujoState: flujosAll[from] ?? null,
    flujosAll,
  };
}

async function saveFlujoState(
  tenantId: string,
  sessionId: string | null,
  from: string,
  next: FlujoState | null,
  flujosAll: Record<string, FlujoState>,
): Promise<void> {
  if (!sessionId) return;
  const supabase = getSupabase();
  const updated = { ...flujosAll };
  if (next) updated[from] = next;
  else delete updated[from];
  await supabase
    .from("tenant_whatsapp_sessions")
    .update({
      metadata: { flujos: updated },
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("tenant_id", tenantId);
}

async function persistMessage(
  tenantId: string,
  sessionId: string | null,
  direccion: "in" | "out",
  fromNumber: string | null,
  toNumber: string | null,
  body: string,
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("tenant_whatsapp_messages").insert({
    tenant_id: tenantId,
    session_id: sessionId,
    direccion,
    from_number: fromNumber,
    to_number: toNumber,
    tipo: "text",
    body,
    estado: direccion === "in" ? "recibido" : "enviado",
  });
}

function defaultMenu(rubro: string | null): string {
  const r = (rubro ?? "").toLowerCase();
  if (r.includes("car") || r.includes("wash"))
    return "Servicios: 1) Lavado simple 2) Lavado completo 3) Premium. Escribe 'reservar' para agendar.";
  if (r.includes("restaur"))
    return "Opciones: 1) Reservar mesa 2) Pedir delivery. Escribe 'reservar' o 'delivery'.";
  if (r.includes("salon") || r.includes("salón"))
    return "Servicios: corte, color, manicure, pedicure. Escribe 'cita'.";
  if (r.includes("taller"))
    return "Servicios: revisión, cambio aceite, frenos. Escribe 'cita'.";
  return "Hola, soy Cecilia. ¿En qué te puedo ayudar? Escribe 'reservar' o cuéntame qué necesitas.";
}

/**
 * Procesa un mensaje entrante: persistencia, comandos, flujo por rubro,
 * Cecilia bridge con post-filter y rate limit, envío de respuesta.
 */
export async function handleInbound(msg: InboundMessage): Promise<{ replied: boolean; reply: string | null }> {
  const { tenantId, fromNumber, text } = msg;
  if (!text || text.trim().length === 0) {
    return { replied: false, reply: null };
  }
  const ctx = await loadContext(tenantId, fromNumber);

  await persistMessage(tenantId, ctx.sessionId, "in", fromNumber, null, text);

  const lower = text.trim().toLowerCase();

  // 1. Comando /menu
  if (COMANDOS_MENU.includes(lower)) {
    const menu = defaultMenu(ctx.rubro);
    await sendText(tenantId, fromNumber, menu);
    await persistMessage(tenantId, ctx.sessionId, "out", null, fromNumber, menu);
    return { replied: true, reply: menu };
  }

  // 2. Flujo por rubro
  const flujo = await matchFlujo(
    { tenantId, fromNumber },
    ctx.rubro,
    text,
    ctx.flujoState,
  );
  if (flujo.reply) {
    const out = filterCeciliaOutput(flujo.reply);
    await sendText(tenantId, fromNumber, out);
    await persistMessage(tenantId, ctx.sessionId, "out", null, fromNumber, out);
    await saveFlujoState(
      tenantId,
      ctx.sessionId,
      fromNumber,
      flujo.done ? null : flujo.next,
      ctx.flujosAll,
    );
    return { replied: true, reply: out };
  }

  // 3. Rate limit antes de llamar al modelo
  if (!allowModelCall(tenantId)) {
    const msg = "Cecilia está atendiendo a varios clientes, dame un momento";
    await sendText(tenantId, fromNumber, msg);
    await persistMessage(tenantId, ctx.sessionId, "out", null, fromNumber, msg);
    return { replied: true, reply: msg };
  }

  // 4. Cecilia bridge
  const resp = await askCecilia({
    tenantId,
    fromNumber,
    text,
    rubro: ctx.rubro,
  });
  if (!resp.ok || !resp.reply) {
    const fb = "Cecilia está atendiendo a varios clientes, dame un momento";
    await sendText(tenantId, fromNumber, fb);
    await persistMessage(tenantId, ctx.sessionId, "out", null, fromNumber, fb);
    return { replied: true, reply: fb };
  }

  const out = filterCeciliaOutput(resp.reply);
  await sendText(tenantId, fromNumber, out);
  await persistMessage(tenantId, ctx.sessionId, "out", null, fromNumber, out);
  return { replied: true, reply: out };
}

/** Wires Baileys `messages.upsert` to handleInbound. Called once per session. */
export function attachInboundListener(
  tenantId: string,
  sock: {
    ev: { on: (event: string, cb: (data: unknown) => void) => void };
  },
): void {
  sock.ev.on("messages.upsert", (raw: unknown) => {
    const u = raw as {
      type?: string;
      messages?: Array<{
        key?: { fromMe?: boolean; remoteJid?: string };
        message?: {
          conversation?: string;
          extendedTextMessage?: { text?: string };
        };
      }>;
    };
    if (u.type !== "notify" || !u.messages) return;
    for (const m of u.messages) {
      if (m.key?.fromMe) continue;
      const remote = m.key?.remoteJid;
      if (!remote || !remote.endsWith("@s.whatsapp.net")) continue;
      const text =
        m.message?.conversation ?? m.message?.extendedTextMessage?.text ?? null;
      if (!text) continue;
      const fromNumber = remote.split("@")[0]!;
      void handleInbound({ tenantId, fromNumber, text }).catch((err) => {
        logger.warn({ err, tenantId, fromNumber }, "handleInbound threw");
      });
    }
  });
}
