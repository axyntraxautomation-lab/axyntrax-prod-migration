/**
 * Cliente HTTP minimal contra el api-server compartido.
 * Toda llamada usa `credentials: "include"` para enviar la cookie axyn_portal
 * (HttpOnly) que demuestra la sesión del cliente AXYNTRAX. El proxy global
 * enruta /api/* al servicio api-server por path.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | null,
    message: string,
  ) {
    super(message);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    let body: { error?: string; code?: string } = {};
    try {
      body = (await res.json()) as { error?: string; code?: string };
    } catch {
      // ignore
    }
    throw new ApiError(res.status, body.code ?? null, body.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiSend<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = (await res.json()) as { error?: string; code?: string };
    } catch {
      // ignore
    }
    throw new ApiError(res.status, payload.code ?? null, payload.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const apiPost = <T>(path: string, body?: unknown) =>
  apiSend<T>("POST", path, body);
export const apiPatch = <T>(path: string, body?: unknown) =>
  apiSend<T>("PATCH", path, body);
export const apiPut = <T>(path: string, body?: unknown) =>
  apiSend<T>("PUT", path, body);
export const apiDelete = <T>(path: string, body?: unknown) =>
  apiSend<T>("DELETE", path, body);

export type TenantMe = {
  tenant: {
    id: string;
    slug: string;
    nombreEmpresa: string;
    rubroId: string;
    ownerEmail: string;
    moneda: string;
    plan: string;
    status: string;
  };
  branding: {
    id: string;
    logoUrl: string | null;
    colorPrimario: string;
    colorSecundario: string;
    welcomeText: string | null;
  } | null;
  onboarding: {
    currentStep: number;
    totalSteps: number;
    completados: string[];
    estado: "en_progreso" | "completado";
  } | null;
  rubro: {
    rubroId: string;
    nombre: string;
    cecilia_persona: string;
    modulos: string[];
    kpis: string[];
    onboarding_steps: string[];
  } | null;
  realtime: {
    supabaseUrl: string;
    supabaseAnonKey: string;
  } | null;
};

export type TenantJwtResponse = {
  jwt: string;
  tenant_id: string;
  expires_in: number;
};

export type FaqItem = {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  origen: "rubro" | "tenant";
};

export type CeciliaMessage = {
  id: string;
  conversation_id: string | null;
  role: string;
  content: string;
  created_at: string;
};

// ===== Entidades del negocio (Task #46) =====

export type InventarioItem = {
  id: string;
  tenantId: string;
  sku: string | null;
  nombre: string;
  categoria: string | null;
  cantidad: string;
  unidad: string;
  minimoAlerta: string;
  precioCosto: string | null;
  precioVenta: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ServicioTipo = "servicio" | "producto" | "menu_item";

export type ServicioItem = {
  id: string;
  tenantId: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  tipo: ServicioTipo;
  precio: string;
  moneda: string;
  duracionMinutos: number | null;
  activo: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type Empleado = {
  id: string;
  tenantId: string;
  nombre: string;
  rol: string | null;
  color: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClienteFinal = {
  id: string;
  tenantId: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  documentoTipo: string | null;
  documentoNumero: string | null;
  notas: string | null;
  rubroData: Record<string, unknown>;
  historial: unknown[];
  createdAt: string;
  updatedAt: string;
  // Agregados que vienen del endpoint /tenant/clientes (no de la tabla):
  // total de compras (cantidad y monto acumulado en S/) calculado desde
  // tenant_finanzas_movimientos donde tipo='ingreso'.
  comprasCount?: number;
  comprasMonto?: string;
};

export type Cita = {
  id: string;
  tenantId: string;
  clienteFinalId: string | null;
  servicioId: string | null;
  empleadoId: string | null;
  titulo: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: string;
  notas: string | null;
  recordatorioEnviado: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FinanzaMov = {
  id: string;
  tenantId: string;
  clienteFinalId: string | null;
  tipo: "ingreso" | "egreso";
  concepto: string | null;
  monto: string;
  moneda: string;
  metodoPago: string;
  estado: string;
  fecha: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FinanzaSummary = {
  dia: { ingreso: number; egreso: number; balance: number };
  semana: { ingreso: number; egreso: number; balance: number };
  mes: { ingreso: number; egreso: number; balance: number };
  canalesMes: Record<string, number>;
  moneda: string;
};

export type Alerta = {
  id: string;
  tenantId: string;
  tipo: string;
  severidad: string;
  titulo: string;
  detalle: string | null;
  payload: Record<string, unknown>;
  leida: boolean;
  resueltaEn: string | null;
  createdAt: string;
};

export type FaqOverride = {
  id: string;
  tenantId: string;
  pregunta: string;
  respuesta: string;
  categoria: string | null;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PagoQr = {
  id: string;
  tenantId: string;
  clienteFinalId: string | null;
  metodo: "yape" | "plin";
  monto: string;
  moneda: string;
  concepto: string | null;
  qrDataUrl: string | null;
  estado: "pendiente" | "confirmado" | "anulado";
  confirmadoEn: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
