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
