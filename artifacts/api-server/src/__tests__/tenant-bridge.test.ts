/**
 * Tests de integración del bridge tenant SaaS Cecilia.
 * Cubre: signup, jwt, me, caso negativo "cliente sin tenant" y SELECT real
 * a Supabase con el JWT firmado.
 *
 * Diseñado para correr con node:test (built-in en Node 20+) sin instalar
 * dependencias adicionales:
 *   pnpm --filter @workspace/api-server run test:tenant
 *
 * Pre-requisitos:
 *  - API server corriendo en process.env.PORT (default 8080) o en el
 *    proxy local (localhost:80/api).
 *  - Secrets Supabase configurados.
 *  - Esta suite NO depende de /api/portal/register (que tiene un bug
 *    pre-existente con phone encriptado): inserta clientes directos en
 *    la DB Replit y firma la cookie portal en proceso.
 *  - El `before()` crea idempotentemente el rol PG `tenant_owner` en
 *    Supabase si falta. La política RLS completa con ese rol es alcance
 *    de la siguiente tarea (#45 RLS), pero el rol mismo es necesario aquí
 *    para validar el SELECT real con el JWT firmado.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db, clientsTable } from "@workspace/db";
import {
  getSupabaseDb,
  getSupabasePool,
  tenantsTable,
  tenantBrandingTable,
  tenantOnboardingStateTable,
  isSupabaseConfigured,
  getSupabaseEnv,
} from "@workspace/db-supabase";
import { signPortalToken } from "../lib/auth.js";

const API_BASE =
  process.env.TEST_API_BASE ?? `http://localhost:${process.env.PORT ?? "8080"}`;

const TEST_EMAIL_OWNER = `tenant-bridge-owner+${Date.now()}@axyntrax.test`;
const TEST_EMAIL_NOTENANT = `tenant-bridge-notenant+${Date.now()}@axyntrax.test`;
const TEST_NAME = "Tenant Bridge Test";

let createdOwnerId: number | null = null;
let createdNoTenantId: number | null = null;
let createdTenantId: string | null = null;

function buildCookieHeader(clientId: number): string {
  const token = signPortalToken({
    kind: "client",
    sub: clientId,
    name: TEST_NAME,
  });
  return `axyn_portal=${token}`;
}

async function cleanupSupabaseTenantByEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sdb = getSupabaseDb();
  const [t] = await sdb
    .select({ id: tenantsTable.id })
    .from(tenantsTable)
    .where(eq(tenantsTable.ownerEmail, email))
    .limit(1);
  if (!t) return;
  await sdb
    .delete(tenantOnboardingStateTable)
    .where(eq(tenantOnboardingStateTable.tenantId, t.id));
  await sdb
    .delete(tenantBrandingTable)
    .where(eq(tenantBrandingTable.tenantId, t.id));
  await sdb.delete(tenantsTable).where(eq(tenantsTable.id, t.id));
}

/**
 * Crea idempotentemente el rol PG `tenant_owner` en Supabase y configura
 * el mínimo necesario para que PostgREST acepte el claim `role` y pueda
 * resolver un SELECT sobre `tenants` con el JWT firmado:
 *   - CREATE ROLE tenant_owner NOLOGIN
 *   - GRANT tenant_owner TO authenticator
 *   - GRANT USAGE ON SCHEMA public
 *   - GRANT SELECT ON public.tenants
 *
 * IMPORTANTE: este acceso es amplio (sin RLS, el rol verá todas las filas).
 * Es aceptable sólo para esta fase porque la siguiente tarea (#45) instala
 * las policies RLS que filtran por `tenant_id` extraído del JWT, restaurando
 * el aislamiento por tenant. Mover este setup a tests evita que el rol
 * "permisivo" exista en runtime de producción mientras #45 no se aplique.
 */
async function ensureTenantOwnerRole(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const pool = getSupabasePool();
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tenant_owner') THEN
        CREATE ROLE tenant_owner NOLOGIN;
      END IF;
      IF NOT EXISTS (
        SELECT 1
        FROM pg_auth_members m
        JOIN pg_roles parent ON parent.oid = m.roleid
        JOIN pg_roles child ON child.oid = m.member
        WHERE parent.rolname = 'tenant_owner'
          AND child.rolname = 'authenticator'
      ) THEN
        GRANT tenant_owner TO authenticator;
      END IF;
    END
    $$;
  `);
  // GRANTs idempotentes: re-ejecutarlos es no-op.
  await pool.query(`GRANT USAGE ON SCHEMA public TO tenant_owner;`);
  await pool.query(`GRANT SELECT ON public.tenants TO tenant_owner;`);
}

before(async () => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[tenant-bridge.test] Supabase no configurado: los tests que requieren Supabase serán skipped.",
    );
    return;
  }

  await ensureTenantOwnerRole();

  // Limpieza idempotente por si una corrida previa dejó residuos.
  await cleanupSupabaseTenantByEmail(TEST_EMAIL_OWNER.toLowerCase());
  await cleanupSupabaseTenantByEmail(TEST_EMAIL_NOTENANT.toLowerCase());
  await db
    .delete(clientsTable)
    .where(eq(clientsTable.email, TEST_EMAIL_OWNER.toLowerCase()));
  await db
    .delete(clientsTable)
    .where(eq(clientsTable.email, TEST_EMAIL_NOTENANT.toLowerCase()));

  // requirePortalAuth verifica que el cliente tenga password_hash no nulo
  // (sólo presencia, no compara hash). Insertamos un placeholder.
  const ownerInsert = await db
    .insert(clientsTable)
    .values({
      name: TEST_NAME,
      email: TEST_EMAIL_OWNER.toLowerCase(),
      phone: "+51900000001",
      channel: "web",
      stage: "prospecto",
      passwordHash: "$2b$10$tenantBridgeTestPlaceholderHashOfFixedLengthValue",
    })
    .returning({ id: clientsTable.id });
  createdOwnerId = ownerInsert[0]!.id;

  const noTenantInsert = await db
    .insert(clientsTable)
    .values({
      name: TEST_NAME + " (sin tenant)",
      email: TEST_EMAIL_NOTENANT.toLowerCase(),
      phone: "+51900000002",
      channel: "web",
      stage: "prospecto",
      passwordHash: "$2b$10$tenantBridgeTestPlaceholderHashOfFixedLengthValue",
    })
    .returning({ id: clientsTable.id });
  createdNoTenantId = noTenantInsert[0]!.id;
});

after(async () => {
  await cleanupSupabaseTenantByEmail(TEST_EMAIL_OWNER.toLowerCase());
  await cleanupSupabaseTenantByEmail(TEST_EMAIL_NOTENANT.toLowerCase());
  if (createdOwnerId !== null) {
    await db.delete(clientsTable).where(eq(clientsTable.id, createdOwnerId));
  }
  if (createdNoTenantId !== null) {
    await db.delete(clientsTable).where(eq(clientsTable.id, createdNoTenantId));
  }
});

test("/api/tenant/signup: crea tenant con body snake_case y devuelve { tenant_id, slug }", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdOwnerId, "cliente owner creado");

  const res = await fetch(`${API_BASE}/api/tenant/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buildCookieHeader(createdOwnerId!),
    },
    body: JSON.stringify({
      rubro_id: "car_wash",
      nombre_empresa: "Lavadero Cecilia Test",
    }),
  });
  assert.equal(res.status, 201, `signup esperaba 201, recibió ${res.status}`);
  const body = (await res.json()) as { tenant_id?: string; slug?: string };
  assert.ok(body.tenant_id, "respuesta incluye tenant_id");
  assert.ok(body.slug, "respuesta incluye slug");
  assert.equal(
    Object.keys(body).sort().join(","),
    "slug,tenant_id",
    "respuesta solo expone tenant_id y slug",
  );
  createdTenantId = body.tenant_id!;
});

test("/api/tenant/signup: validación rechaza body sin rubro_id", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdOwnerId, "cliente owner creado");

  const res = await fetch(`${API_BASE}/api/tenant/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buildCookieHeader(createdOwnerId!),
    },
    body: JSON.stringify({ nombre_empresa: "Falta rubro" }),
  });
  assert.equal(res.status, 400);
});

test("/api/tenant/jwt: GET devuelve JWT con claims exactos del spec", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdOwnerId, "cliente owner creado");
  assert.ok(createdTenantId, "tenant creado en signup previo");

  const res = await fetch(`${API_BASE}/api/tenant/jwt`, {
    method: "GET",
    headers: { Cookie: buildCookieHeader(createdOwnerId!) },
  });
  assert.equal(res.status, 200, `jwt esperaba 200, recibió ${res.status}`);
  const body = (await res.json()) as {
    jwt?: string;
    tenant_id?: string;
    expires_in?: number;
  };
  assert.ok(body.jwt, "respuesta incluye jwt");
  assert.equal(body.tenant_id, createdTenantId);
  assert.equal(body.expires_in, 3600, "TTL 1 hora");

  const secret = getSupabaseEnv().jwtSecret;
  const decoded = jwt.verify(body.jwt!, secret, { algorithms: ["HS256"] }) as {
    sub: string;
    tenant_id: string;
    role: string;
    exp: number;
    iat: number;
  };
  assert.equal(decoded.sub, String(createdOwnerId), "sub = client_id");
  assert.equal(decoded.tenant_id, createdTenantId);
  assert.equal(decoded.role, "tenant_owner");
  assert.ok(
    decoded.exp - decoded.iat === 3600,
    "exp = iat + 3600 (1 hora exacta)",
  );
});

test("/api/tenant/jwt: rechaza request sin cookie portal con 401", async () => {
  const res = await fetch(`${API_BASE}/api/tenant/jwt`, { method: "GET" });
  assert.equal(res.status, 401);
});

test("/api/tenant/me: devuelve tenant + branding + rubro", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdOwnerId, "cliente owner creado");

  const res = await fetch(`${API_BASE}/api/tenant/me`, {
    method: "GET",
    headers: { Cookie: buildCookieHeader(createdOwnerId!) },
  });
  assert.equal(res.status, 200, `me esperaba 200, recibió ${res.status}`);
  const body = (await res.json()) as {
    tenant?: { id?: string; slug?: string; rubroId?: string };
    branding?: unknown;
    rubro?: { rubroId?: string } | null;
  };
  assert.ok(body.tenant?.id, "tenant.id presente");
  assert.equal(body.tenant!.id, createdTenantId);
  assert.equal(body.tenant!.rubroId, "car_wash");
  assert.ok(body.branding, "branding presente");
  assert.equal(body.rubro?.rubroId, "car_wash");
});

test("/api/tenant/me: cliente válido sin tenant en Supabase devuelve 404", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdNoTenantId, "cliente sin tenant creado");

  const res = await fetch(`${API_BASE}/api/tenant/me`, {
    method: "GET",
    headers: { Cookie: buildCookieHeader(createdNoTenantId!) },
  });
  assert.equal(
    res.status,
    404,
    `me sin tenant esperaba 404, recibió ${res.status}`,
  );
});

test("/api/tenant/jwt: cliente válido sin tenant en Supabase devuelve 404", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdNoTenantId, "cliente sin tenant creado");

  const res = await fetch(`${API_BASE}/api/tenant/jwt`, {
    method: "GET",
    headers: { Cookie: buildCookieHeader(createdNoTenantId!) },
  });
  assert.equal(
    res.status,
    404,
    `jwt sin tenant esperaba 404, recibió ${res.status}`,
  );
});

test("Supabase REST acepta el JWT firmado y lo valida con SELECT real", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdTenantId, "tenant creado en signup previo");

  const env = getSupabaseEnv();
  // Firmamos un JWT con el contrato del spec (sub=client_id, role=tenant_owner)
  // El rol PG tenant_owner ya fue creado en before() y otorgado a authenticator.
  const token = jwt.sign(
    {
      sub: String(createdOwnerId),
      tenant_id: createdTenantId,
      role: "tenant_owner",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    env.jwtSecret,
    { algorithm: "HS256" },
  );

  const url = `${env.publicUrl}/rest/v1/tenants?id=eq.${createdTenantId}&select=id,slug,rubro_id`;
  const r = await fetch(url, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (r.status !== 200) {
    const errBody = await r.text();
    assert.fail(
      `PostgREST esperaba 200 (JWT válido + rol tenant_owner), recibió ${r.status}: ${errBody}`,
    );
  }
  const rows = (await r.json()) as Array<{ id: string; slug: string }>;
  assert.equal(rows.length, 1, "PostgREST devolvió un tenant");
  assert.equal(rows[0].id, createdTenantId);
});
