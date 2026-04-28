#!/usr/bin/env node
/**
 * Smoke test de fundaciones SaaS Cecilia (Task #44).
 *
 * Valida los componentes que la tarea introdujo, sin depender del flujo
 * del portal pre-existente (que tiene bugs aparte fuera del scope):
 *
 *   1. Normalizador de env (`@workspace/db-supabase/env`) detecta los 5
 *      secrets, tolerando cruces URL ↔ DB_URL y prefijos truncados.
 *   2. La conexión a Supabase responde y las 18 tablas del nuevo schema
 *      existen en `public`.
 *   3. La tabla `rubros_registry` quedó sembrada con los 9 rubros baseline.
 *   4. Los 3 endpoints `/api/tenant/{signup,me,jwt}` están registrados y
 *      responden 401 sin cookie de portal (gate de autenticación activo).
 *   5. `signTenantJwt` produce un token HS256 con los claims correctos
 *      (sub, tenant_id, tenant_role, role, aud, exp=1h).
 *
 * Uso: pnpm --filter @workspace/api-server run smoke-tenant
 */
import { Buffer } from "node:buffer";
import { getSupabaseEnv, isSupabaseConfigured } from "@workspace/db-supabase/env";
import { getSupabasePool } from "@workspace/db-supabase";
import { signTenantJwt } from "../src/lib/tenant-jwt.js";

const BASE = process.env.SMOKE_API_BASE ?? "http://localhost:8080";

const EXPECTED_TABLES = [
  "tenants",
  "rubros_registry",
  "tenant_branding",
  "tenant_onboarding_state",
  "tenant_rubro_overrides",
  "tenant_servicios",
  "tenant_inventario",
  "tenant_clientes_finales",
  "tenant_citas_servicios",
  "tenant_pagos_qr",
  "tenant_finanzas_movimientos",
  "tenant_whatsapp_sessions",
  "tenant_whatsapp_messages",
  "tenant_chat_cecilia_messages",
  "tenant_kpi_snapshots",
  "tenant_alertas",
  "tenant_faq_overrides",
  "tenant_backups",
];

const EXPECTED_RUBROS = [
  "car_wash",
  "restaurante",
  "salon",
  "taller",
  "gimnasio",
  "farmacia",
  "bodega",
  "consultoria",
  "logistica",
];

function fail(msg) {
  console.error(`\n[smoke] ✗ FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[smoke] ✓ ${msg}`);
}

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

async function main() {
  console.log(`[smoke] BASE=${BASE}`);

  // 1. Normalizador de env
  const env = getSupabaseEnv();
  if (!env.dbUrl) fail("normalizador no resolvió dbUrl desde los secrets");
  if (!env.publicUrl) fail("normalizador no resolvió publicUrl");
  if (!env.anonKey || !env.serviceRoleKey || !env.jwtSecret) {
    fail("faltan anon/service-role/jwt secret tras normalización");
  }
  if (!isSupabaseConfigured()) fail("isSupabaseConfigured() devolvió false");
  ok(`env normalizada → publicUrl=${env.publicUrl}`);

  // 2. Conexión Supabase + 18 tablas
  const pool = getSupabasePool();
  const tablesRes = await pool.query(
    `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
  );
  const tableNames = tablesRes.rows.map((r) => r.table_name);
  const missing = EXPECTED_TABLES.filter((t) => !tableNames.includes(t));
  if (missing.length) fail(`faltan tablas en Supabase: ${missing.join(", ")}`);
  ok(`Supabase conectado → ${tableNames.length} tablas (18 esperadas presentes)`);

  // 3. Rubros sembrados
  const rubrosRes = await pool.query(
    `select rubro_id from public.rubros_registry order by rubro_id`,
  );
  const rubroIds = rubrosRes.rows.map((r) => r.rubro_id);
  const missingRubros = EXPECTED_RUBROS.filter((r) => !rubroIds.includes(r));
  if (missingRubros.length) {
    fail(`faltan rubros en rubros_registry: ${missingRubros.join(", ")}`);
  }
  ok(`rubros_registry → ${rubroIds.length} rubros sembrados`);

  // 4. Endpoints registrados (gate auth devuelve 401 sin cookie)
  for (const path of ["/api/tenant/signup", "/api/tenant/me", "/api/tenant/jwt"]) {
    const method = path === "/api/tenant/me" ? "GET" : "POST";
    const r = await fetch(`${BASE}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? "{}" : undefined,
    });
    if (r.status === 503) fail(`${path} → 503 (Supabase mal configurado)`);
    if (r.status !== 401) {
      fail(`${path} sin cookie devolvió ${r.status}, esperado 401`);
    }
    ok(`${method} ${path} → 401 (gate auth activo)`);
  }

  // 5. signTenantJwt produce HS256 con claims correctos
  const fakeTenantId = "00000000-0000-0000-0000-000000000001";
  const fakeEmail = "smoke@axyntrax-test.local";
  const token = signTenantJwt({
    sub: fakeEmail,
    tenant_id: fakeTenantId,
    role: "tenant_owner",
  });
  const payload = decodeJwtPayload(token);
  if (!payload) fail("no se pudo decodificar payload del JWT");
  if (payload.sub !== fakeEmail) fail(`JWT sub=${payload.sub} esperado=${fakeEmail}`);
  if (payload.tenant_id !== fakeTenantId) fail(`JWT tenant_id incorrecto`);
  if (payload.tenant_role !== "tenant_owner") {
    fail(`JWT tenant_role=${payload.tenant_role} esperado=tenant_owner`);
  }
  if (payload.role !== "authenticated") fail(`JWT role=${payload.role}`);
  if (payload.aud !== "authenticated") fail(`JWT aud=${payload.aud}`);
  const ttl = payload.exp - payload.iat;
  if (ttl !== 3600) fail(`JWT ttl=${ttl}s esperado=3600s`);
  const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
  if (header.alg !== "HS256") fail(`JWT alg=${header.alg} esperado=HS256`);
  ok(`signTenantJwt → HS256 con claims correctos (exp=1h)`);

  console.log(`\n[smoke] ✓ TODOS LOS CHECKS DE FUNDACIONES PASARON`);
  await pool.end();
}

main().catch((err) => {
  console.error("[smoke] excepción inesperada:", err);
  process.exit(1);
});
