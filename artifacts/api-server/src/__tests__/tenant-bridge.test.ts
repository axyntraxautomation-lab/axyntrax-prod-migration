/**
 * Tests de integración del bridge tenant SaaS Cecilia.
 * Cubre signup, jwt, me, caso "cliente sin tenant" y verificación de que
 * Supabase REST acepta el JWT firmado por el bridge.
 *
 * Pre-requisito de infra: el rol PG `tenant_owner` debe existir en Supabase.
 * Provisionarlo con `pnpm --filter @workspace/db-supabase run bootstrap`
 * (idempotente). Esta suite ya NO crea ni manipula roles PG.
 *
 * Uso: pnpm --filter @workspace/api-server run test:tenant
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db, clientsTable } from "@workspace/db";
import {
  getSupabaseDb,
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

before(async () => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[tenant-bridge.test] Supabase no configurado: tests dependientes serán skipped.",
    );
    return;
  }

  await cleanupSupabaseTenantByEmail(TEST_EMAIL_OWNER.toLowerCase());
  await cleanupSupabaseTenantByEmail(TEST_EMAIL_NOTENANT.toLowerCase());
  await db
    .delete(clientsTable)
    .where(eq(clientsTable.email, TEST_EMAIL_OWNER.toLowerCase()));
  await db
    .delete(clientsTable)
    .where(eq(clientsTable.email, TEST_EMAIL_NOTENANT.toLowerCase()));

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

/**
 * Verifica que Supabase REST acepta el JWT firmado por el bridge: el rol
 * `tenant_owner` resuelve y PostgREST retorna 200. NO se afirma aislamiento
 * por tenant (sin RLS el rol ve todas las filas; el aislamiento real lo
 * valida la suite de tests de RLS en task #45).
 */
test("Supabase REST acepta JWT firmado con role=tenant_owner (200 OK)", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdTenantId, "tenant creado en signup previo");

  const env = getSupabaseEnv();
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

  const url = `${env.publicUrl}/rest/v1/tenants?select=id&limit=1`;
  const r = await fetch(url, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (r.status !== 200) {
    const errBody = await r.text();
    assert.fail(
      `PostgREST rechazó JWT con role=tenant_owner (status ${r.status}): ${errBody}`,
    );
  }
});
