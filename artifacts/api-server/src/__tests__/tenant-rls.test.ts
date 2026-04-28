/**
 * Tests cross-tenant RLS endurecido (Tarea #47).
 *
 * Estrategia:
 *  1. Crea 2 tenants A y B en Supabase con service-role (bypass RLS).
 *  2. Inserta data en tablas tenant_inventario / tenant_alertas /
 *     tenant_finanzas_movimientos / tenant_pagos_qr para CADA tenant.
 *  3. Firma un JWT con tenant_id = B (role=tenant_owner) y consulta
 *     PostgREST `/rest/v1/<tabla>?select=*` por cada tabla bajo RLS.
 *  4. Espera 0 filas del tenant A en TODAS las consultas.
 *  5. Espera que CUALQUIER intento de INSERT/UPDATE/DELETE como
 *     tenant_owner falle (solo se concedió SELECT al rol).
 *  6. Limpia ambos tenants al final.
 *
 * Pre-requisito: `pnpm --filter @workspace/db-supabase run bootstrap` y
 * `pnpm --filter @workspace/db-supabase run install-rls` ya ejecutados.
 *
 * Uso: pnpm --filter @workspace/api-server run test:rls
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import {
  getSupabaseDb,
  tenantsTable,
  tenantBrandingTable,
  tenantOnboardingStateTable,
  tenantInventarioTable,
  tenantAlertasTable,
  tenantFinanzasMovimientosTable,
  tenantPagosQrTable,
  tenantClientesFinalesTable,
  isSupabaseConfigured,
  getSupabaseEnv,
} from "@workspace/db-supabase";

type TenantSeed = { id: string; slug: string; ownerEmail: string };

const TS = Date.now();
const SLUG_A = `rls-a-${TS}`;
const SLUG_B = `rls-b-${TS}`;
const EMAIL_A = `rls-a-${TS}@axyntrax.test`;
const EMAIL_B = `rls-b-${TS}@axyntrax.test`;

const SECRET = (() => {
  const s = process.env.SUPABASE_JWT_SECRET;
  if (!s) throw new Error("SUPABASE_JWT_SECRET requerido para tests RLS");
  return s;
})();

let A: TenantSeed | null = null;
let B: TenantSeed | null = null;

function signJwt(tenantId: string): string {
  return jwt.sign(
    {
      sub: `test-${tenantId}`,
      tenant_id: tenantId,
      role: "tenant_owner",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SECRET,
    { algorithm: "HS256" },
  );
}

async function restGet(args: {
  table: string;
  jwt: string;
  query?: string;
}): Promise<{ status: number; rows: Array<Record<string, unknown>> }> {
  const env = getSupabaseEnv();
  const url = `${env.publicUrl}/rest/v1/${args.table}?${args.query ?? "select=*"}`;
  const res = await fetch(url, {
    headers: {
      apikey: env.anonKey!,
      Authorization: `Bearer ${args.jwt}`,
      Accept: "application/json",
    },
  });
  let rows: Array<Record<string, unknown>> = [];
  if (res.status >= 200 && res.status < 300) {
    rows = (await res.json()) as Array<Record<string, unknown>>;
  } else {
    try {
      await res.text();
    } catch {
      // ignore
    }
  }
  return { status: res.status, rows };
}

async function restMutate(args: {
  table: string;
  jwt: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: string;
}): Promise<number> {
  const env = getSupabaseEnv();
  const url = `${env.publicUrl}/rest/v1/${args.table}${args.query ? `?${args.query}` : ""}`;
  const res = await fetch(url, {
    method: args.method,
    headers: {
      apikey: env.anonKey!,
      Authorization: `Bearer ${args.jwt}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: args.body ? JSON.stringify(args.body) : undefined,
  });
  try {
    await res.text();
  } catch {
    // ignore
  }
  return res.status;
}

async function cleanupByEmail(email: string): Promise<void> {
  const sdb = getSupabaseDb();
  const [t] = await sdb
    .select({ id: tenantsTable.id })
    .from(tenantsTable)
    .where(eq(tenantsTable.ownerEmail, email))
    .limit(1);
  if (!t) return;
  await sdb
    .delete(tenantPagosQrTable)
    .where(eq(tenantPagosQrTable.tenantId, t.id));
  await sdb
    .delete(tenantFinanzasMovimientosTable)
    .where(eq(tenantFinanzasMovimientosTable.tenantId, t.id));
  await sdb
    .delete(tenantAlertasTable)
    .where(eq(tenantAlertasTable.tenantId, t.id));
  await sdb
    .delete(tenantInventarioTable)
    .where(eq(tenantInventarioTable.tenantId, t.id));
  await sdb
    .delete(tenantClientesFinalesTable)
    .where(eq(tenantClientesFinalesTable.tenantId, t.id));
  await sdb
    .delete(tenantOnboardingStateTable)
    .where(eq(tenantOnboardingStateTable.tenantId, t.id));
  await sdb
    .delete(tenantBrandingTable)
    .where(eq(tenantBrandingTable.tenantId, t.id));
  await sdb.delete(tenantsTable).where(eq(tenantsTable.id, t.id));
}

async function seedTenant(args: {
  slug: string;
  email: string;
}): Promise<TenantSeed> {
  const sdb = getSupabaseDb();
  const [t] = await sdb
    .insert(tenantsTable)
    .values({
      slug: args.slug,
      nombreEmpresa: `RLS Test ${args.slug}`,
      rubroId: "car_wash",
      ownerEmail: args.email,
      ownerName: "RLS Test Owner",
    })
    .returning({ id: tenantsTable.id, slug: tenantsTable.slug });
  const tenantId = t!.id;

  await sdb.insert(tenantInventarioTable).values({
    tenantId,
    sku: `SKU-${args.slug}`,
    nombre: `Insumo ${args.slug}`,
    cantidad: "10",
    minimoAlerta: "5",
    unidad: "u",
  });
  await sdb.insert(tenantAlertasTable).values({
    tenantId,
    tipo: "stock_bajo",
    severidad: "warning",
    titulo: `Alerta ${args.slug}`,
  });
  await sdb.insert(tenantFinanzasMovimientosTable).values({
    tenantId,
    tipo: "ingreso",
    monto: "100.00",
    moneda: "PEN",
    canal: "yape",
    concepto: `Ingreso ${args.slug}`,
  });
  await sdb.insert(tenantPagosQrTable).values({
    tenantId,
    metodo: "yape",
    monto: "50.00",
    moneda: "PEN",
    estado: "pendiente",
  });

  return { id: tenantId, slug: args.slug, ownerEmail: args.email };
}

before(async () => {
  if (!isSupabaseConfigured()) {
    console.warn("[tenant-rls.test] Supabase no configurado, tests skipped");
    return;
  }
  await cleanupByEmail(EMAIL_A);
  await cleanupByEmail(EMAIL_B);
  A = await seedTenant({ slug: SLUG_A, email: EMAIL_A });
  B = await seedTenant({ slug: SLUG_B, email: EMAIL_B });
});

after(async () => {
  if (!isSupabaseConfigured()) return;
  await cleanupByEmail(EMAIL_A);
  await cleanupByEmail(EMAIL_B);
});

const TENANT_TABLES_TO_CHECK = [
  "tenant_inventario",
  "tenant_alertas",
  "tenant_finanzas_movimientos",
  "tenant_pagos_qr",
] as const;

test("RLS: tenant B JWT NO ve filas del tenant A en ninguna tabla tenant_*", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(A && B, "tenants seed");
  const tokenB = signJwt(B!.id);

  for (const table of TENANT_TABLES_TO_CHECK) {
    const res = await restGet({ table, jwt: tokenB });
    assert.equal(
      res.status,
      200,
      `${table}: tenant_owner debe poder hacer SELECT (status=${res.status})`,
    );
    const fromA = res.rows.filter((r) => r.tenant_id === A!.id);
    assert.equal(
      fromA.length,
      0,
      `${table}: tenant B vio ${fromA.length} filas del tenant A (RLS roto)`,
    );
    const fromB = res.rows.filter((r) => r.tenant_id === B!.id);
    assert.ok(
      fromB.length >= 1,
      `${table}: tenant B debería ver sus propias filas (vio ${fromB.length})`,
    );
  }
});

test("RLS: tenant A JWT solo ve la fila propia de la tabla tenants", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(A && B, "tenants seed");
  const tokenA = signJwt(A!.id);
  const res = await restGet({
    table: "tenants",
    jwt: tokenA,
    query: "select=id,slug",
  });
  assert.equal(res.status, 200);
  assert.equal(res.rows.length, 1, "tenants debe devolver exactamente 1 fila");
  assert.equal(res.rows[0]!.id, A!.id);
});

test("RLS: SIN JWT (anon sin claims) no debe leer tenant_inventario", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  const env = getSupabaseEnv();
  const res = await fetch(
    `${env.publicUrl}/rest/v1/tenant_inventario?select=*&limit=1`,
    {
      headers: { apikey: env.anonKey!, Accept: "application/json" },
    },
  );
  // Sin JWT el rol es `anon`, que NO recibió GRANT SELECT. Esperamos
  // 401 (sin auth) o 200 con array vacío (si Supabase responde sin filas
  // por falta de policy aplicable).
  if (res.status === 200) {
    const rows = (await res.json()) as unknown[];
    assert.equal(rows.length, 0, "anon sin policy no debe ver filas");
  } else {
    assert.ok(
      res.status === 401 || res.status === 403 || res.status === 404,
      `anon sin JWT: status inesperado ${res.status}`,
    );
  }
});

test("RLS: tenant_owner NO puede INSERT/UPDATE/DELETE (solo SELECT)", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(A && B, "tenants seed");
  const tokenB = signJwt(B!.id);

  const insertStatus = await restMutate({
    table: "tenant_inventario",
    jwt: tokenB,
    method: "POST",
    body: {
      tenant_id: B!.id,
      sku: "SHOULD-FAIL",
      nombre: "denied",
      cantidad: "1",
      minimo_alerta: "0",
      unidad: "u",
    },
  });
  assert.ok(
    insertStatus >= 400,
    `INSERT debe fallar (status=${insertStatus})`,
  );

  const updateStatus = await restMutate({
    table: "tenant_alertas",
    jwt: tokenB,
    method: "PATCH",
    query: `tenant_id=eq.${B!.id}`,
    body: { leida: true },
  });
  assert.ok(
    updateStatus >= 400,
    `UPDATE debe fallar (status=${updateStatus})`,
  );

  const deleteStatus = await restMutate({
    table: "tenant_alertas",
    jwt: tokenB,
    method: "DELETE",
    query: `tenant_id=eq.${B!.id}`,
  });
  assert.ok(
    deleteStatus >= 400,
    `DELETE debe fallar (status=${deleteStatus})`,
  );
});

test("RLS: tenant B no puede consultar fila específica del tenant A por id", async (t) => {
  if (!isSupabaseConfigured()) return t.skip("Supabase no configurado");
  assert.ok(A && B, "tenants seed");
  const sdb = getSupabaseDb();
  const [aAlerta] = await sdb
    .select({ id: tenantAlertasTable.id })
    .from(tenantAlertasTable)
    .where(eq(tenantAlertasTable.tenantId, A!.id))
    .limit(1);
  assert.ok(aAlerta, "alerta de A existe");
  const tokenB = signJwt(B!.id);
  const res = await restGet({
    table: "tenant_alertas",
    jwt: tokenB,
    query: `select=*&id=eq.${aAlerta.id}`,
  });
  assert.equal(res.status, 200);
  assert.equal(
    res.rows.length,
    0,
    "lookup por id de fila ajena debe devolver vacío",
  );
});
