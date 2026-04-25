export type ClientSession = {
  kind: "client";
  client: {
    id: number;
    name: string;
    company: string | null;
    industry: string | null;
    email: string | null;
  };
  license: {
    id: number;
    type: string;
    status?: string;
    endDate: string | null;
  };
};

export type AdminSession = {
  kind: "admin";
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

export type PortalSession = ClientSession | AdminSession;

export type CatalogModule = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  industry: string;
  monthlyPrice: string;
  currency: string;
  active: number;
};

export type ClientModuleRow = {
  id: number;
  moduleId: number;
  status: string;
  notes: string | null;
  requestedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  moduleSlug: string;
  moduleName: string;
  moduleDescription: string | null;
  moduleIndustry: string;
  monthlyPrice: string;
  currency: string;
};

export type AdminRequestRow = {
  id: number;
  clientId: number;
  moduleId: number;
  status: string;
  notes: string | null;
  requestedAt: string;
  activatedAt: string | null;
  clientName: string;
  clientCompany: string | null;
  clientIndustry: string | null;
  moduleSlug: string;
  moduleName: string;
  monthlyPrice: string;
  currency: string;
};

export type AdminClientRow = {
  id: number;
  name: string;
  company: string | null;
  industry: string | null;
  email: string | null;
  activeModules: number;
  pendingModules: number;
};

const API_BASE = "/api";

export class PortalApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (res.status === 204) return undefined as T;
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`;
    // Trigger global session clear on auth failures from any non-login request.
    if (res.status === 401 && !path.startsWith("/portal/auth/login")) {
      try {
        unauthorizedHandler?.();
      } catch {
        // ignore
      }
    }
    throw new PortalApiError(msg, res.status, body);
  }
  return body as T;
}

export const portalApi = {
  loginLicense: (key: string) =>
    request<PortalSession>("/portal/auth/login", {
      method: "POST",
      body: JSON.stringify({ mode: "license", key }),
    }),
  loginAdmin: (email: string, password: string, twofaCode?: string) =>
    request<PortalSession>("/portal/auth/login", {
      method: "POST",
      body: JSON.stringify({
        mode: "admin",
        email,
        password,
        ...(twofaCode ? { twofaCode } : {}),
      }),
    }),
  logout: () =>
    request<void>("/portal/auth/logout", { method: "POST" }),
  me: () => request<PortalSession>("/portal/auth/me"),

  catalog: () => request<CatalogModule[]>("/portal/catalog"),
  myModules: () => request<ClientModuleRow[]>("/portal/me/modules"),
  requestModule: (moduleId: number, notes?: string) =>
    request<ClientModuleRow>("/portal/me/modules/request", {
      method: "POST",
      body: JSON.stringify({ moduleId, notes }),
    }),

  adminCatalog: () => request<CatalogModule[]>("/portal/admin/catalog"),
  adminRequests: (status: string = "pendiente") =>
    request<AdminRequestRow[]>(
      `/portal/admin/requests?status=${encodeURIComponent(status)}`,
    ),
  adminApprove: (id: number) =>
    request<AdminRequestRow>(`/portal/admin/requests/${id}/approve`, {
      method: "POST",
    }),
  adminReject: (id: number) =>
    request<AdminRequestRow>(`/portal/admin/requests/${id}/reject`, {
      method: "POST",
    }),
  adminClients: () => request<AdminClientRow[]>("/portal/admin/clients"),
};
