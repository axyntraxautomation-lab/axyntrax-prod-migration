/**
 * Flujos rubro adaptativos. Cada flujo es una pequeña máquina de estados que
 * vive en `tenant_whatsapp_sessions.metadata.flujos[<from>]`.
 *
 * El router consulta `matchFlujo` con el rubro y el último mensaje. Si el
 * flujo devuelve un `reply`, ese se envía al cliente sin pasar por Cecilia.
 * Si el flujo termina (`done: true`), se borra el estado.
 */

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

type Handler = (state: FlujoState, text: string) => FlujoTurnResult;

const handlers: Record<string, Handler> = {
  "car wash": carWashHandler,
  "carwash": carWashHandler,
  "restaurante": restauranteHandler,
  "salon": salonHandler,
  "salón": salonHandler,
  "taller": tallerHandler,
};

export function newFlujoState(rubro: string): FlujoState {
  return { rubro, paso: "inicio", data: {}, startedAt: Date.now() };
}

export function matchFlujo(
  rubro: string | null | undefined,
  text: string,
  current: FlujoState | null,
): FlujoTurnResult {
  const norm = (rubro ?? "").trim().toLowerCase();
  const handler = handlers[norm];
  if (!handler) {
    return { reply: null, next: null, done: false };
  }
  const state = current ?? newFlujoState(norm);
  return handler(state, text.trim());
}

// ---------- car wash ----------
function carWashHandler(state: FlujoState, text: string): FlujoTurnResult {
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
    case "hora":
      return {
        reply: `Listo. Reservo ${state.data["servicio"]} para ${state.data["vehiculo"]} a ${text}. Te confirmamos en breve.`,
        next: null,
        done: true,
      };
  }
  return { reply: null, next: null, done: false };
}

// ---------- restaurante ----------
function restauranteHandler(state: FlujoState, text: string): FlujoTurnResult {
  const lower = text.toLowerCase();
  switch (state.paso) {
    case "inicio":
      if (/reserv|mesa|pedido|delivery/.test(lower)) {
        return {
          reply:
            "Hola, soy Cecilia. ¿Quieres reservar mesa o pedir delivery?",
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
    case "mesa":
      return {
        reply: `Anotado. Reserva: ${text}. Te confirmamos en breve.`,
        next: null,
        done: true,
      };
    case "delivery":
      return {
        reply: `Pedido tomado: ${text}. Te confirmamos costo y tiempo.`,
        next: null,
        done: true,
      };
  }
  return { reply: null, next: null, done: false };
}

// ---------- salón de belleza ----------
function salonHandler(state: FlujoState, text: string): FlujoTurnResult {
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
    case "hora":
      return {
        reply: `Anotado: ${state.data["servicio"]} para ${text}. Te confirmamos.`,
        next: null,
        done: true,
      };
  }
  return { reply: null, next: null, done: false };
}

// ---------- taller mecánico ----------
function tallerHandler(state: FlujoState, text: string): FlujoTurnResult {
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
        reply: "Bien. ¿Qué necesitas? (revisión, cambio de aceite, frenos, otro)",
        next: { ...state, paso: "servicio", data: { vehiculo: text } },
        done: false,
      };
    case "servicio":
      return {
        reply: "¿Para qué día puedes traer el vehículo?",
        next: { ...state, paso: "hora", data: { ...state.data, servicio: text } },
        done: false,
      };
    case "hora":
      return {
        reply: `Anotado: ${state.data["servicio"]} para ${state.data["vehiculo"]} el ${text}. Te confirmamos.`,
        next: null,
        done: true,
      };
  }
  return { reply: null, next: null, done: false };
}
