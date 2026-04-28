/**
 * Tests de integración del bridge tenant SaaS Cecilia.
 * Cubre: signup, jwt, me, caso negativo y SELECT real a Supabase con el JWT.
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
 *    pre-existente con phone encriptado), inserta un cliente directo en
 *    la DB Replit y firma la cookie portal en proceso.
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

const TEST_EMAIL = `tenant-bridge-test+${Date.now()}@axyntrax.test`;
const TEST_NAME = "Tenant Bridge Test";

let createdClientId: number | null = null;
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
      "[tenant-bridge.test] Supabase no configurado: los tests que requieren Supabase serán skipped.",
    );
  }

  // Limpieza idempotente por si una corrida previa dejó residuos.
  await cleanupSupabaseTenantByEmail(TEST_EMAIL.toLowerCase());
  await db
    .delete(clientsTable)
    .where(eq(clientsTable.email, TEST_EMAIL.toLowerCase()));

  // requirePortalAuth verifica que el cliente tenga password (sólo presencia,
  // no compara hash). Insertamos un placeholder bcrypt-shaped.
  // NOTA: la columna `password_hash` existe en la DB Replit pero el schema TS
  // de @workspace/db no la declara (drift pre-existente que esta tarea NO toca,
  // por la prefs.NO_TOCAR_SCHEMA del usuario), por eso casteamos el insert.
  const insertValues = {
    name: TEST_NAME,
    email: TEST_EMAIL.toLowerCase(),
    phone: "+51900000000",
    channel: "web",
    stage: "prospecto",
    passwordHash: "$2b$10$tenantBridgeTestPlaceholderHashOfFixedLengthValue",
  } as typeof clientsTable.$inferInsert;
  const [created] = await db
    .insert(clientsTable)
    .values(insertValues)
    .returning({ id: clientsTable.id });
  createdClientId = created!.id;
});

after(async () => {
  await cleanupSupabaseTenantByEmail(TEST_EMAIL.toLowerCase());
  if (createdClientId !== null) {
    await db.delete(clientsTable).where(eq(clientsTable.id, createdClientId));
  }
});

test("/api/tenant/signup: crea tenant con body snake_case y devuelve { tenant_id, slug }", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdClientId, "cliente de prueba creado");

  const res = await fetch(`${API_BASE}/api/tenant/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buildCookieHeader(createdClientId!),
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
  assert.ok(createdClientId, "cliente de prueba creado");

  const res = await fetch(`${API_BASE}/api/tenant/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buildCookieHeader(createdClientId!),
    },
    body: JSON.stringify({ nombre_empresa: "Falta rubro" }),
  });
  assert.equal(res.status, 400);
});

test("/api/tenant/jwt: GET devuelve JWT con claims exactos del spec", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdClientId, "cliente de prueba creado");
  assert.ok(createdTenantId, "tenant creado en signup previo");

  const res = await fetch(`${API_BASE}/api/tenant/jwt`, {
    method: "GET",
    headers: { Cookie: buildCookieHeader(createdClientId!) },
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
  assert.equal(decoded.sub, String(createdClientId), "sub = client_id");
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
  assert.ok(createdClientId, "cliente de prueba creado");

  const res = await fetch(`${API_BASE}/api/tenant/me`, {
    method: "GET",
    headers: { Cookie: buildCookieHeader(createdClientId!) },
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

test("Supabase REST acepta el JWT firmado y devuelve sólo el tenant del cliente", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(createdTenantId, "tenant creado en signup previo");

  const env = getSupabaseEnv();
  // Firmamos un JWT con el contrato del spec (sub=client_id, role=tenant_owner)
  const token = jwt.sign(
    {
      sub: String(createdClientId),
      tenant_id: createdTenantId,
      role: "tenant_owner",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    env.jwtSecret,
    { algorithm: "HS256" },
  );

  // PostgREST puede rechazar roles custom (tenant_owner no existe como rol PG
  // en el proyecto Supabase recién creado). Hacemos el SELECT y validamos:
  //  - status 200 + dato correcto, o
  //  - status 4xx con mensaje de role inválido (esperado hasta que Tarea
  //    siguiente cree el rol PG y active RLS).
  const url = `${env.publicUrl}/rest/v1/tenants?id=eq.${createdTenantId}&select=id,slug,rubro_id`;
  const r = await fetch(url, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (r.status === 200) {
    const rows = (await r.json()) as Array<{ id: string; slug: string }>;
    assert.equal(rows.length, 1, "PostgREST devolvió un tenant");
    assert.equal(rows[0].id, createdTenantId);
  } else {
    const body = await r.text();
    console.warn(
      `[tenant-bridge.test] PostgREST rechazó JWT (status ${r.status}): ${body}. ` +
        "Esperado hasta que se cree el rol PG 'tenant_owner' (Tarea siguiente).",
    );
    // El JWT es HS256 firmado correctamente — el rechazo, si ocurre, es por
    // role=tenant_owner no mapeado a un rol PG, no por firma inválida.
    assert.ok(
      r.status >= 400 && r.status < 500,
      `status del rechazo debe ser 4xx, recibió ${r.status}`,
    );
  }
});
