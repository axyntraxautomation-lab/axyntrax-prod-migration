export type ClientPublic = {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
};

export type ClientSession = {
  kind: "client";
  client: ClientPublic;
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
  // Días de duración por demo (default backend = 30).
  demoDurationDays?: number;
};

export type ClientModuleRow = {
  id: number;
  moduleId: number;
  status: string;
  licenseKey: string | null;
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
  licenseKey: string | null;
  notes: string | null;
  requestedAt: string;
  activatedAt: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientCompany: string | null;
  clientIndustry: string | null;
  moduleSlug: string;
  moduleName: string;
  monthlyPrice: string;
  currency: string;
};

export type QuoteItemRow = {
  id: number;
  quoteId: number;
  moduleId: number;
  moduleName: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

export type QuoteRow = {
  id: number;
  clientId: number;
  status: string;
  currency: string;
  subtotal: string;
  igv: string;
  total: string;
  validUntil: string;
  pdfPath: string | null;
  notes: string | null;
  emailSentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  items: QuoteItemRow[];
};

export type AdminQuoteRow = {
  id: number;
  status: string;
  currency: string;
  subtotal: string;
  igv: string;
  total: string;
  validUntil: string;
  createdAt: string;
  emailSentAt: string | null;
  acceptedAt: string | null;
  clientId: number;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
};

export type CreateQuoteResult = {
  id: number;
  status: string;
  currency: string;
  subtotal: number;
  igv: number;
  total: number;
  validUntil: string;
  emailSent: boolean;
  pdfUrl: string;
};

export type SupportReply = {
  reply: string;
  steps?: string[];
  needsHuman?: boolean;
};

export type ModuleEventRow = {
  id: number;
  clientModuleId: number;
  clientId: number;
  moduleId: number;
  type: string;
  severity: string;
  message: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminModuleEventRow = ModuleEventRow & {
  clientName: string | null;
  moduleName: string | null;
  moduleSlug: string | null;
};

export type ModuleEventSummary = {
  clientId: number;
  clientName: string | null;
  total: number;
  errors: number;
  last: string | null;
};

export type ModuleUpdateRow = {
  id: number;
  moduleId: number;
  version: string;
  releaseNotes: string;
  severity: string;
  createdAt: string;
  moduleName?: string | null;
  applied?: number;
  pending?: number;
};

export type ClientUpdateRow = {
  id: number;
  clientModuleId: number;
  moduleUpdateId: number;
  status: string;
  appliedAt: string | null;
  notifiedAt: string;
  moduleName: string;
  moduleSlug: string;
  version: string;
  releaseNotes: string;
  severity: string;
};

export type SecurityAlertRow = {
  id: number;
  type: string;
  severity: string;
  ip: string | null;
  email: string | null;
  userAgent?: string | null;
  path?: string | null;
  message: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
  ackBy: number | null;
  ackAt: string | null;
};

export type IpBlockRow = {
  id: number;
  ip: string;
  reason: string | null;
  expiresAt: string;
  createdAt: string;
};

export type LockdownState = {
  active: boolean;
  reason: string | null;
  enabledBy: number | null;
  enabledAt: string | null;
};

export type SalesBotReply = {
  reply: string;
  recommendedModuleSlugs?: string[];
  ctaQuote?: boolean;
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

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

const API_BASE = "/api";

export class PortalApiError extends Error {
  status: number;
  data: unknown;
  field?: string;
  constructor(message: string, status: number, data: unknown, field?: string) {
    super(message);
    this.status = status;
    this.data = data;
    this.field = field;
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
    const obj = (typeof body === "object" && body) as Record<string, unknown> | false;
    const msg = obj && "error" in obj ? String(obj.error) : `HTTP ${res.status}`;
    const field = obj && typeof obj.field === "string" ? obj.field : undefined;
    if (
      res.status === 401 &&
      !path.startsWith("/portal/auth/login") &&
      !path.startsWith("/portal/auth/register")
    ) {
      try {
        unauthorizedHandler?.();
      } catch {
        // ignore
      }
    }
    throw new PortalApiError(msg, res.status, body, field);
  }
  return body as T;
}

export const portalApi = {
  register: (payload: RegisterPayload) =>
    request<ClientSession>("/portal/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  loginClient: (email: string, password: string) =>
    request<PortalSession>("/portal/auth/login", {
      method: "POST",
      body: JSON.stringify({ mode: "client", email, password }),
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

  // Quotes
  createQuote: (moduleIds: number[], notes?: string) =>
    request<CreateQuoteResult>("/portal/quotes", {
      method: "POST",
      body: JSON.stringify({ moduleIds, notes }),
    }),
  myQuotes: () => request<QuoteRow[]>("/portal/quotes"),
  acceptQuote: (id: number) =>
    request<{ quote: QuoteRow; createdRequests: number[]; skipped: number }>(
      `/portal/quotes/${id}/accept`,
      { method: "POST" },
    ),
  quotePdfUrl: (id: number) => `${API_BASE}/portal/quotes/${id}/pdf`,
  adminQuotes: () => request<AdminQuoteRow[]>("/portal/admin/quotes"),

  // License PDF
  licensePdfUrl: (clientModuleId: number) =>
    `${API_BASE}/portal/me/modules/${clientModuleId}/license-pdf`,

  // Module support (Cecilia Soporte por módulo)
  moduleSupport: (
    clientModuleId: number,
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
  ) =>
    request<SupportReply>(
      `/portal/me/modules/${clientModuleId}/support`,
      {
        method: "POST",
        body: JSON.stringify({ message, history }),
      },
    ),

  // Module events (telemetría cliente)
  recordModuleEvent: (
    clientModuleId: number,
    payload: {
      type: string;
      severity?: "info" | "warn" | "error";
      message?: string;
      meta?: Record<string, unknown>;
    },
  ) =>
    request<ModuleEventRow>(
      `/portal/me/modules/${clientModuleId}/events`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
  myModuleEvents: (clientModuleId: number) =>
    request<ModuleEventRow[]>(
      `/portal/me/modules/${clientModuleId}/events`,
    ),

  // Module updates - cliente
  myUpdates: () => request<ClientUpdateRow[]>("/portal/me/updates"),
  applyUpdate: (id: number) =>
    request<ClientUpdateRow>(`/portal/me/updates/${id}/apply`, {
      method: "POST",
    }),

  // Admin - seguridad
  adminAlerts: (status: "open" | "ack" | "all" = "open") => {
    const qs = status === "open" ? "?open=1" : "";
    return request<SecurityAlertRow[]>(
      `/portal/admin/security/alerts${qs}`,
    ).then((rows) =>
      status === "ack" ? rows.filter((r) => r.ackBy != null) : rows,
    );
  },
  adminAckAlert: (id: number) =>
    request<SecurityAlertRow>(
      `/portal/admin/security/alerts/${id}/ack`,
      { method: "POST" },
    ),
  adminBlocks: () => request<IpBlockRow[]>("/portal/admin/security/blocks"),
  adminDeleteBlock: (ip: string) =>
    request<{ ok: true }>(
      `/portal/admin/security/blocks/${encodeURIComponent(ip)}`,
      { method: "DELETE" },
    ),
  adminGetLockdown: () =>
    request<LockdownState>("/portal/admin/security/lockdown"),
  adminSetLockdown: (active: boolean, reason?: string) =>
    request<LockdownState>("/portal/admin/security/lockdown", {
      method: "POST",
      body: JSON.stringify({ active, reason }),
    }),

  // Admin - telemetría módulos
  adminModuleEvents: (params?: {
    clientModuleId?: number;
    type?: string;
    severity?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.clientModuleId)
      qs.set("clientModuleId", String(params.clientModuleId));
    if (params?.type) qs.set("type", params.type);
    if (params?.severity) qs.set("severity", params.severity);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<AdminModuleEventRow[]>(
      `/portal/admin/module-events${q ? `?${q}` : ""}`,
    );
  },
  adminModuleEventsSummary: () =>
    request<ModuleEventSummary[]>("/portal/admin/module-events/summary"),

  // Admin - module updates
  adminListUpdates: () =>
    request<ModuleUpdateRow[]>("/portal/admin/module-updates"),
  adminPublishUpdate: (payload: {
    moduleId: number;
    version: string;
    releaseNotes: string;
    severity?: "normal" | "important" | "critical";
  }) =>
    request<{ update: ModuleUpdateRow; fanout: number }>(
      "/portal/admin/module-updates",
      {
        method: "POST",
        body: JSON.stringify(payload),
    }),

  // Sales bots
  publicSalesBot: (
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
  ) =>
    request<SalesBotReply>("/portal/public/sales-bot", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  quoteBot: (
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
  ) =>
    request<SalesBotReply>("/portal/quote-bot", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
