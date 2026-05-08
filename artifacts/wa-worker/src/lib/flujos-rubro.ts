/**
 * Flujos rubro adaptativos. Cada flujo es una pequeña máquina de estados que
 * vive en `tenant_whatsapp_sessions.metadata.flujos[<from>]`.
 *
 * El router consulta `matchFlujo` con el rubro y el último mensaje. Si el
 * flujo devuelve un `reply`, ese se envía al cliente sin pasar por Cecilia.
 * Cuando el flujo termina (`done: true`) los handlers crean la cita /
 * pedido / pago real en la DB del tenant antes de devolver la confirmación.
 */
import { getSupabase } from "./supabase";
import { logger } from "./logger";

export interface FlujoState {
  rubro: string;
  paso: string;
  data: Record<string, string>;
  startedAt: number;
}

export interface FlujoTurnResult {
  reply: string | null;
  next: FlujoState | null;
  done: boolean;
}

interface FlujoCtx {
  tenantId: string;
  fromNumber: string;
}

type Handler = (
  ctx: FlujoCtx,
  state: FlujoState,
  text: string,
) => Promise<FlujoTurnResult>;

const handlers: Record<string, Handler> = {
  "car wash": carWashHandler,
  carwash: carWashHandler,
  car_wash: carWashHandler,
  restaurante: restauranteHandler,
  salon: salonHandler,
  "salón": salonHandler,
  taller: tallerHandler,
};

export function newFlujoState(rubro: string): FlujoState {
  return { rubro, paso: "inicio", data: {}, startedAt: Date.now() };
}

export async function matchFlujo(
  ctx: FlujoCtx,
  rubro: string | null | undefined,
  text: string,
  current: FlujoState | null,
): Promise<FlujoTurnResult> {
  const norm = (rubro ?? "").trim().toLowerCase();
  const handler = handlers[norm];
  if (!handler) {
    return { reply: null, next: null, done: false };
  }
  const state = current ?? newFlujoState(norm);
  return handler(ctx, state, text.trim());
}

// ---------- helpers ----------

/**
 * Asegura un cliente final para `fromNumber`. Si no existe, crea uno mínimo
 * (sin nombre, sólo número). Devuelve el id o null si la inserción falla.
 */
async function ensureClienteFinal(
  tenantId: string,
  fromNumber: string,
): Promise<string | null> {
  try {
    const supabase = getSupabase();
    // Intento de búsqueda por número. La columna `telefono` está cifrada en
    // reposo; aquí filtramos por `metadata.whatsappFrom` que el wa-worker
    // popula en cada cliente nuevo.
    const { data: existing } = await supabase
      .from("tenant_clientes_finales")
      .select("id")
      .eq("tenant_id", tenantId)
      .filter("rubro_data->>whatsappFrom", "eq", fromNumber)
      .limit(1);
    const found = (existing ?? [])[0] as { id?: string } | undefined;
    if (found?.id) return found.id;

    const { data: inserted, error } = await supabase
      .from("tenant_clientes_finales")
      .insert({
        tenant_id: tenantId,
        nombre: `WhatsApp +${fromNumber}`,
        rubro_data: { whatsappFrom: fromNumber, source: "wa-worker" },
      })
      .select("id")
      .single();
    if (error) {
      logger.warn({ error, tenantId }, "ensureClienteFinal insert failed");
      return null;
    }
    return (inserted as { id?: string } | null)?.id ?? null;
  } catch (err) {
    logger.warn({ err, tenantId }, "ensureClienteFinal threw");
    return null;
  }
}

/**
 * Crea una `tenant_citas_servicios` minima a partir del flujo. La fecha se
 * toma como "hoy + 1h" si no se pudo parsear; el operador del negocio luego
 * confirma. Devuelve el id de la cita o null si la inserción falla.
 */
async function createCita(
  tenantId: string,
  fromNumber: string,
  titulo: string,
  metadata: Record<string, unknown>,
): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const clienteId = await ensureClienteFinal(tenantId, fromNumber);
    const fecha = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("tenant_citas_servicios")
      .insert({
        tenant_id: tenantId,
        cliente_final_id: clienteId,
        titulo,
        fecha_inicio: fecha,
        estado: "pendiente",
        metadata: { ...metadata, source: "wa-worker", whatsappFrom: fromNumber },
      })
      .select("id")
      .single();
    if (error) {
      logger.warn({ error, tenantId, fromNumber }, "createCita insert failed");
      return null;
    }
    return (data as { id?: string } | null)?.id ?? null;
  } catch (err) {
    logger.warn({ err, tenantId, fromNumber }, "createCita threw");
    return null;
  }
}

function shortCode(id: string | null): string {
  if (!id) return "";
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

// ---------- car wash ----------
async function carWashHandler(
  ctx: FlujoCtx,
  state: FlujoState,
  text: string,
): Promise<FlujoTurnResult> {
  const lower = text.toLowerCase();
  switch (state.paso) {
    case "inicio":
      if (/lavad|reserv|cita|turno/.test(lower)) {
        return {
          reply:
            "Hola, soy Cecilia. Para reservar tu lavado dime: ¿qué tipo de vehículo es? (auto, suv, camioneta o moto)",
          next: { ...state, paso: "vehiculo" },
          done: false,
        };
      }
      return { reply: null, next: null, done: false };
    case "vehiculo": {
      const v = ["auto", "suv", "camioneta", "moto"].find((x) =>
        lower.includes(x),
      );
      if (!v) {
        return {
          reply: "No te entendí, dime auto, suv, camioneta o moto por favor.",
          next: state,
          done: false,
        };
      }
      return {
        reply: `Anotado ${v}. ¿Quieres lavado simple, completo o premium?`,
        next: { ...state, paso: "servicio", data: { ...state.data, vehiculo: v } },
        done: false,
      };
    }
    case "servicio": {
      const s = ["simple", "completo", "premium"].find((x) =>
        lower.includes(x),
      );
      if (!s) {
        return {
          reply: "Dime simple, completo o premium.",
          next: state,
          done: false,
        };
      }
      return {
        reply: "¿Para qué hora? (ejemplo: hoy 4pm o mañana 10am)",
        next: { ...state, paso: "hora", data: { ...state.data, servicio: s } },
        done: false,
      };
    }
    case "hora": {
      const titulo = `Lavado ${state.data["servicio"] ?? ""} - ${state.data["vehiculo"] ?? ""}`.trim();
      const citaId = await createCita(ctx.tenantId, ctx.fromNumber, titulo, {
        rubro: "car_wash",
        vehiculo: state.data["vehiculo"],
        servicio: state.data["servicio"],
        horaTexto: text,
      });
      const codigo = shortCode(citaId);
      return {
        reply:
          `Listo. Reservé tu lavado ${state.data["servicio"]} para ${state.data["vehiculo"]} a ${text}.` +
          (codigo ? ` Tu código de reserva es ${codigo}.` : "") +
          " Te confirmamos en breve.",
        next: null,
        done: true,
      };
    }
  }
  return { reply: null, next: null, done: false };
}

// ---------- restaurante ----------
async function restauranteHandler(
  ctx: FlujoCtx,
  state: FlujoState,
  text: string,
): Promise<FlujoTurnResult> {
  const lower = text.toLowerCase();
  switch (state.paso) {
    case "inicio":
      if (/reserv|mesa|pedido|delivery/.test(lower)) {
        return {
          reply: "Hola, soy Cecilia. ¿Quieres reservar mesa o pedir delivery?",
          next: { ...state, paso: "tipo" },
          done: false,
        };
      }
      return { reply: null, next: null, done: false };
    case "tipo": {
      if (/mesa|reserv/.test(lower)) {
        return {
          reply: "¿Para cuántas personas y a qué hora?",
          next: { ...state, paso: "mesa", data: { tipo: "mesa" } },
          done: false,
        };
      }
      if (/delivery|pedido|enviar/.test(lower)) {
        return {
          reply: "Cuéntame qué quieres pedir y tu dirección.",
          next: { ...state, paso: "delivery", data: { tipo: "delivery" } },
          done: false,
        };
      }
      return { reply: "Dime mesa o delivery.", next: state, done: false };
    }
    case "mesa": {
      const citaId = await createCita(
        ctx.tenantId,
        ctx.fromNumber,
        `Reserva mesa - ${text}`,
        { rubro: "restaurante", tipo: "mesa", detalle: text },
      );
      const codigo = shortCode(citaId);
      return {
        reply:
          `Anotado. Reserva: ${text}.` +
          (codigo ? ` Código ${codigo}.` : "") +
          " Te confirmamos en breve.",
        next: null,
        done: true,
      };
    }
    case "delivery": {
      const citaId = await createCita(
        ctx.tenantId,
        ctx.fromNumber,
        `Pedido delivery`,
        { rubro: "restaurante", tipo: "delivery", detalle: text },
      );
      const codigo = shortCode(citaId);
      return {
        reply:
          `Pedido tomado: ${text}.` +
          (codigo ? ` Código ${codigo}.` : "") +
          " Te confirmamos costo y tiempo.",
        next: null,
        done: true,
      };
    }
  }
  return { reply: null, next: null, done: false };
}

// ---------- salón de belleza ----------
async function salonHandler(
  ctx: FlujoCtx,
  state: FlujoState,
  text: string,
): Promise<FlujoTurnResult> {
  const lower = text.toLowerCase();
  switch (state.paso) {
    case "inicio":
      if (/cita|reserv|corte|color|manicure|pedicure/.test(lower)) {
        return {
          reply:
            "Hola, soy Cecilia. ¿Qué servicio quieres? (corte, color, manicure, pedicure)",
          next: { ...state, paso: "servicio" },
          done: false,
        };
      }
      return { reply: null, next: null, done: false };
    case "servicio": {
      const s = ["corte", "color", "manicure", "pedicure"].find((x) =>
        lower.includes(x),
      );
      if (!s) {
        return {
          reply: "Dime corte, color, manicure o pedicure.",
          next: state,
          done: false,
        };
      }
      return {
        reply: "¿Para qué día y hora?",
        next: { ...state, paso: "hora", data: { servicio: s } },
        done: false,
      };
    }
    case "hora": {
      const titulo = `Cita ${state.data["servicio"] ?? ""}`.trim();
      const citaId = await createCita(ctx.tenantId, ctx.fromNumber, titulo, {
        rubro: "salon",
        servicio: state.data["servicio"],
        horaTexto: text,
      });
      const codigo = shortCode(citaId);
      return {
        reply:
          `Anotado: ${state.data["servicio"]} para ${text}.` +
          (codigo ? ` Código ${codigo}.` : "") +
          " Te confirmamos.",
        next: null,
        done: true,
      };
    }
  }
  return { reply: null, next: null, done: false };
}

// ---------- taller mecánico ----------
async function tallerHandler(
  ctx: FlujoCtx,
  state: FlujoState,
  text: string,
): Promise<FlujoTurnResult> {
  const lower = text.toLowerCase();
  switch (state.paso) {
    case "inicio":
      if (/cita|revisi|repara|cambio|aceite|frenos/.test(lower)) {
        return {
          reply:
            "Hola, soy Cecilia. Cuéntame: ¿marca, modelo y año del vehículo?",
          next: { ...state, paso: "vehiculo" },
          done: false,
        };
      }
      return { reply: null, next: null, done: false };
    case "vehiculo":
      return {
        reply:
          "Bien. ¿Qué necesitas? (revisión, cambio de aceite, frenos, otro)",
        next: { ...state, paso: "servicio", data: { vehiculo: text } },
        done: false,
      };
    case "servicio":
      return {
        reply: "¿Para qué día puedes traer el vehículo?",
        next: { ...state, paso: "hora", data: { ...state.data, servicio: text } },
        done: false,
      };
    case "hora": {
      const titulo = `Taller: ${state.data["servicio"] ?? ""} - ${state.data["vehiculo"] ?? ""}`.trim();
      const citaId = await createCita(ctx.tenantId, ctx.fromNumber, titulo, {
        rubro: "taller",
        vehiculo: state.data["vehiculo"],
        servicio: state.data["servicio"],
        horaTexto: text,
      });
      const codigo = shortCode(citaId);
      return {
        reply:
          `Anotado: ${state.data["servicio"]} para ${state.data["vehiculo"]} el ${text}.` +
          (codigo ? ` Código ${codigo}.` : "") +
          " Te confirmamos.",
        next: null,
        done: true,
      };
    }
  }
  return { reply: null, next: null, done: false };
}
