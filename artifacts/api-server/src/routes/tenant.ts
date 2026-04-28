import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { db, clientsTable } from "@workspace/db";
import {
  getSupabaseDb,
  rubrosRegistryTable,
  tenantsTable,
  tenantBrandingTable,
  tenantOnboardingStateTable,
  type Tenant,
  type TenantBranding,
  type TenantOnboardingState,
  type RubroRegistry,
} from "@workspace/db-supabase";
import { z } from "zod/v4";
import { requirePortalAuth, requirePortalClient } from "../lib/auth";
import { signTenantJwt, tenantJwtTtlSeconds } from "../lib/tenant-jwt";
import { isSupabaseConfigured } from "../lib/supabase-admin";
import { audit } from "../lib/audit";

const router: IRouter = Router();

const signupLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes de registro tenant. Intenta de nuevo en 1 minuto.",
  },
});

const jwtLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas rotaciones de token. Espera un momento." },
});

const SLUG_RX = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

// Spec exige snake_case en el body. Aceptamos también las variantes
// camelCase como alias retrocompatibles para uso interno.
const SignupBody = z
  .object({
    nombre_empresa: z.string().trim().min(2).max(160).optional(),
    nombreEmpresa: z.string().trim().min(2).max(160).optional(),
    rubro_id: z.string().trim().min(2).max(64).optional(),
    rubroId: z.string().trim().min(2).max(64).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(64)
      .regex(SLUG_RX, "El slug solo acepta minúsculas, números y guiones.")
      .optional(),
    owner_name: z.string().trim().min(1).max(160).optional(),
    ownerName: z.string().trim().min(1).max(160).optional(),
  })
  .refine((d) => d.nombre_empresa ?? d.nombreEmpresa, {
    message: "nombre_empresa es requerido",
    path: ["nombre_empresa"],
  })
  .refine((d) => d.rubro_id ?? d.rubroId, {
    message: "rubro_id es requerido",
    path: ["rubro_id"],
  });

function gateSupabase(req: Request, res: Response, next: NextFunction): void {
  if (!isSupabaseConfigured()) {
    res.status(503).json({
      error:
        "El módulo SaaS Cecilia aún no está configurado en este entorno. " +
        "Falta registrar los secrets SUPABASE_URL, SUPABASE_DB_URL, " +
        "SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_JWT_SECRET.",
      code: "supabase_not_configured",
    });
    return;
  }
  next();
}

function makeSlugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `tenant-${suffix}`;
}

async function getClientById(clientId: number) {
  const [client] = await db
    .select({
      id: clientsTable.id,
      email: clientsTable.email,
      name: clientsTable.name,
    })
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId))
    .limit(1);
  return client ?? null;
}

async function ensureRubroExists(rubroId: string): Promise<RubroRegistry | null> {
  const sdb = getSupabaseDb();
  const [r] = await sdb
    .select()
    .from(rubrosRegistryTable)
    .where(eq(rubrosRegistryTable.rubroId, rubroId))
    .limit(1);
  return r ?? null;
}

async function findTenantByOwnerEmail(ownerEmail: string): Promise<Tenant | null> {
  const sdb = getSupabaseDb();
  const [t] = await sdb
    .select()
    .from(tenantsTable)
    .where(sql`lower(${tenantsTable.ownerEmail}) = ${ownerEmail.toLowerCase()}`)
    .limit(1);
  return t ?? null;
}

async function getBrandingByTenantId(tenantId: string): Promise<TenantBranding | null> {
  const sdb = getSupabaseDb();
  const [b] = await sdb
    .select()
    .from(tenantBrandingTable)
    .where(eq(tenantBrandingTable.tenantId, tenantId))
    .limit(1);
  return b ?? null;
}

async function getOnboardingByTenantId(
  tenantId: string,
): Promise<TenantOnboardingState | null> {
  const sdb = getSupabaseDb();
  const [o] = await sdb
    .select()
    .from(tenantOnboardingStateTable)
    .where(eq(tenantOnboardingStateTable.tenantId, tenantId))
    .limit(1);
  return o ?? null;
}

router.post(
  "/tenant/signup",
  signupLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") {
      res.status(403).json({ error: "Acceso solo para clientes del portal." });
      return;
    }

    const parsed = SignupBody.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      res.status(400).json({
        error: first?.message ?? "Datos inválidos",
        field: first?.path?.join("."),
      });
      return;
    }

    const nombreEmpresa = parsed.data.nombre_empresa ?? parsed.data.nombreEmpresa!;
    const rubroId = parsed.data.rubro_id ?? parsed.data.rubroId!;
    const ownerNameInput = parsed.data.owner_name ?? parsed.data.ownerName ?? null;

    const client = await getClientById(req.portal.sub);
    if (!client?.email) {
      res.status(400).json({
        error:
          "Tu cuenta del portal no tiene email registrado. Actualiza tu perfil antes de crear el espacio Cecilia.",
      });
      return;
    }

    const rubro = await ensureRubroExists(rubroId);
    if (!rubro) {
      res.status(400).json({
        error: `El rubro '${rubroId}' no existe en el catálogo. Elige uno de los rubros disponibles.`,
        code: "rubro_invalid",
      });
      return;
    }

    const ownerEmail = client.email.toLowerCase();
    const sdb = getSupabaseDb();

    // Si ya existe tenant para este email, devolvemos el existente (idempotente).
    let tenant = await findTenantByOwnerEmail(ownerEmail);
    if (!tenant) {
      const desiredSlug = parsed.data.slug ?? makeSlugFromName(nombreEmpresa);
      try {
        const [created] = await sdb
          .insert(tenantsTable)
          .values({
            slug: desiredSlug,
            nombreEmpresa,
            rubroId,
            ownerEmail,
            ownerName: ownerNameInput ?? client.name ?? null,
            moneda: "PEN",
            timezone: "America/Lima",
            plan: "trial",
            status: "activo",
          })
          .returning();
        tenant = created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("tenants_slug_uniq")) {
          res.status(409).json({
            error: "El slug solicitado ya está en uso. Elige otro o déjalo en blanco.",
            code: "slug_taken",
          });
          return;
        }
        if (msg.includes("tenants_owner_email_lower_uniq")) {
          // Race condition: otro request creó el tenant en paralelo.
          tenant = await findTenantByOwnerEmail(ownerEmail);
          if (!tenant) throw err;
        } else {
          throw err;
        }
      }
    }

    if (!tenant) {
      res.status(500).json({ error: "No se pudo crear el espacio del tenant." });
      return;
    }

    // Branding y onboarding por defecto, idempotentes.
    const existingBranding = await getBrandingByTenantId(tenant.id);
    if (!existingBranding) {
      await sdb
        .insert(tenantBrandingTable)
        .values({ tenantId: tenant.id })
        .onConflictDoNothing({ target: tenantBrandingTable.tenantId });
    }

    const onboardingSteps = (rubro.onboarding_steps ?? []) as string[];
    const existingOnboarding = await getOnboardingByTenantId(tenant.id);
    if (!existingOnboarding) {
      await sdb
        .insert(tenantOnboardingStateTable)
        .values({
          tenantId: tenant.id,
          currentStep: 0,
          totalSteps: onboardingSteps.length,
          completados: [],
          estado: "en_progreso",
        })
        .onConflictDoNothing({ target: tenantOnboardingStateTable.tenantId });
    }

    await audit(req, {
      action: "tenant.signup",
      entityType: "tenant",
      entityId: tenant.id,
      meta: {
        slug: tenant.slug,
        rubroId: tenant.rubroId,
        nombreEmpresa: tenant.nombreEmpresa,
        ownerEmail,
      },
    });

    // Response shape exacta del spec: { tenant_id, slug }.
    res.status(201).json({
      tenant_id: tenant.id,
      slug: tenant.slug,
    });
  },
);

router.get(
  "/tenant/jwt",
  jwtLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") {
      res.status(403).json({ error: "Acceso solo para clientes del portal." });
      return;
    }

    const client = await getClientById(req.portal.sub);
    if (!client?.email) {
      res.status(400).json({ error: "Tu cuenta no tiene email registrado." });
      return;
    }

    const tenant = await findTenantByOwnerEmail(client.email);
    if (!tenant) {
      res.status(404).json({
        error: "Aún no has creado tu espacio Cecilia. Llama a /api/tenant/signup primero.",
        code: "tenant_not_found",
      });
      return;
    }

    const token = signTenantJwt({
      sub: String(client.id),
      tenant_id: tenant.id,
      role: "tenant_owner",
    });

    res.json({
      jwt: token,
      tenant_id: tenant.id,
      expires_in: tenantJwtTtlSeconds(),
    });
  },
);

router.get(
  "/tenant/me",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") {
      res.status(403).json({ error: "Acceso solo para clientes del portal." });
      return;
    }

    const client = await getClientById(req.portal.sub);
    if (!client?.email) {
      res.status(400).json({ error: "Tu cuenta no tiene email registrado." });
      return;
    }

    const tenant = await findTenantByOwnerEmail(client.email);
    if (!tenant) {
      res.status(404).json({
        error: "Aún no has creado tu espacio Cecilia.",
        code: "tenant_not_found",
      });
      return;
    }

    const [branding, onboarding, rubro] = await Promise.all([
      getBrandingByTenantId(tenant.id),
      getOnboardingByTenantId(tenant.id),
      ensureRubroExists(tenant.rubroId),
    ]);

    res.json({
      tenant,
      branding,
      onboarding,
      rubro: rubro
        ? {
            rubroId: rubro.rubroId,
            nombre: rubro.nombre,
            cecilia_persona: rubro.cecilia_persona,
            modulos: rubro.modulos,
            kpis: rubro.kpis,
            onboarding_steps: rubro.onboarding_steps,
          }
        : null,
    });
  },
);

export default router;
