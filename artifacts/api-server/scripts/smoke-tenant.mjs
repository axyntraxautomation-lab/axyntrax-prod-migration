#!/usr/bin/env node
/**
 * Smoke test E2E para el módulo SaaS Cecilia (Task #44).
 *
 * Recorre el flujo completo:
 *   1. Verifica que los 4 secrets de Supabase estén presentes.
 *   2. Crea un cliente del portal (idempotente: si ya existe, login).
 *   3. Hace POST /api/tenant/signup -> espera 201 con tenant + jwt.
 *   4. Hace GET  /api/tenant/me -> verifica tenant, branding, onboarding, rubro.
 *   5. Hace POST /api/tenant/jwt -> verifica rotación de token (HS256, exp 1h).
 *   6. Decodifica el payload del JWT y verifica claims (sub, tenant_id, role).
 *
 * Uso:
 *   pnpm --filter @workspace/api-server run smoke-tenant
 *
 * El script asume que el api-server está corriendo en http://localhost:8080.
 */
import { Buffer } from "node:buffer";

const BASE = process.env.SMOKE_API_BASE ?? "http://localhost:8080";
const STAMP = Date.now();
const TEST_EMAIL = `smoke-tenant-${STAMP}@axyntrax-test.local`;
const TEST_PASSWORD = "SmokeTenant2026!";
const TEST_NAME = `Smoke Tenant ${STAMP}`;

const REQUIRED_SECRETS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
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
    const json = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function postJson(path, body, cookies = "") {
  const headers = { "content-type": "application/json" };
  if (cookies) headers.cookie = cookies;
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const setCookie = r.headers.getSetCookie?.() ?? [];
  let json;
  try {
    json = await r.json();
  } catch {
    json = null;
  }
  return { status: r.status, body: json, setCookie };
}

async function getJson(path, cookies = "") {
  const headers = {};
  if (cookies) headers.cookie = cookies;
  const r = await fetch(`${BASE}${path}`, { method: "GET", headers });
  let json;
  try {
    json = await r.json();
  } catch {
    json = null;
  }
  return { status: r.status, body: json };
}

function pickPortalCookie(setCookies) {
  for (const c of setCookies) {
    if (c.startsWith("axyn_portal=")) {
      return c.split(";")[0];
    }
  }
  return null;
}

async function main() {
  console.log(`[smoke] BASE=${BASE} EMAIL=${TEST_EMAIL}`);

  // 1. Verifica secrets via gate público
  const gateProbe = await postJson("/api/tenant/signup", {});
  if (gateProbe.status === 503) {
    fail(
      "Secrets Supabase faltantes. Configura SUPABASE_URL, SUPABASE_ANON_KEY, " +
        "SUPABASE_SERVICE_ROLE_KEY y SUPABASE_JWT_SECRET y reintenta.",
    );
  }
  ok("gate /api/tenant/signup respondió (Supabase configurado)");

  // 2. Crea cliente del portal
  const reg = await postJson("/api/portal/auth/register", {
    name: TEST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (reg.status !== 201 && reg.status !== 200 && reg.status !== 409) {
    fail(`portal register inesperado: ${reg.status} ${JSON.stringify(reg.body)}`);
  }
  ok(`portal register status=${reg.status}`);

  // 3. Login portal (siempre, para asegurar cookie fresca)
  const login = await postJson("/api/portal/auth/login", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (login.status !== 200) {
    fail(`portal login falló: ${login.status} ${JSON.stringify(login.body)}`);
  }
  const portalCookie = pickPortalCookie(login.setCookie);
  if (!portalCookie) fail("no se recibió cookie axyn_portal en login");
  ok(`portal login + cookie OK`);

  // 4. Tenant signup
  const signup = await postJson(
    "/api/tenant/signup",
    {
      nombreEmpresa: `Cecilia Smoke ${STAMP}`,
      rubroId: "car_wash",
    },
    portalCookie,
  );
  if (signup.status !== 201) {
    fail(`tenant signup falló: ${signup.status} ${JSON.stringify(signup.body)}`);
  }
  if (!signup.body?.tenant?.id) fail("tenant signup no devolvió tenant.id");
  if (!signup.body?.jwt) fail("tenant signup no devolvió jwt");
  if (!signup.body?.branding) fail("tenant signup no devolvió branding");
  if (!signup.body?.onboarding) fail("tenant signup no devolvió onboarding");
  if (!signup.body?.rubro?.rubroId) fail("tenant signup no devolvió rubro");
  ok(
    `tenant signup → tenantId=${signup.body.tenant.id.slice(0, 8)}... ` +
      `slug=${signup.body.tenant.slug} rubro=${signup.body.rubro.rubroId}`,
  );

  // 5. Tenant signup idempotente
  const signupAgain = await postJson(
    "/api/tenant/signup",
    { nombreEmpresa: "ignored", rubroId: "car_wash" },
    portalCookie,
  );
  if (signupAgain.status !== 201) {
    fail(`signup idempotente devolvió ${signupAgain.status}, esperado 201`);
  }
  if (signupAgain.body.tenant.id !== signup.body.tenant.id) {
    fail("signup idempotente devolvió un tenantId distinto");
  }
  ok("tenant signup es idempotente");

  // 6. GET /api/tenant/me
  const me = await getJson("/api/tenant/me", portalCookie);
  if (me.status !== 200) fail(`tenant me falló: ${me.status} ${JSON.stringify(me.body)}`);
  if (me.body.tenant.id !== signup.body.tenant.id) {
    fail("tenant me devolvió tenant distinto al signup");
  }
  if (!Array.isArray(me.body.rubro.onboarding_steps)) {
    fail("tenant me no devolvió rubro.onboarding_steps");
  }
  ok(`tenant me → ${me.body.rubro.onboarding_steps.length} pasos onboarding`);

  // 7. POST /api/tenant/jwt (rotación)
  const jwt2 = await postJson("/api/tenant/jwt", {}, portalCookie);
  if (jwt2.status !== 200) fail(`tenant jwt falló: ${jwt2.status} ${JSON.stringify(jwt2.body)}`);
  if (!jwt2.body.jwt) fail("tenant jwt no devolvió token");
  if (jwt2.body.tenantId !== signup.body.tenant.id) {
    fail("tenant jwt devolvió tenantId distinto");
  }
  ok("tenant jwt rotation OK");

  // 8. Decodifica payload y verifica claims
  const payload = decodeJwtPayload(jwt2.body.jwt);
  if (!payload) fail("no se pudo decodificar payload del JWT");
  if (payload.sub !== TEST_EMAIL.toLowerCase()) {
    fail(`JWT sub=${payload.sub} esperado=${TEST_EMAIL.toLowerCase()}`);
  }
  if (payload.tenant_id !== signup.body.tenant.id) {
    fail(`JWT tenant_id=${payload.tenant_id} esperado=${signup.body.tenant.id}`);
  }
  if (payload.tenant_role !== "tenant_owner") {
    fail(`JWT tenant_role=${payload.tenant_role} esperado=tenant_owner`);
  }
  if (payload.role !== "authenticated") {
    fail(`JWT role=${payload.role} esperado=authenticated`);
  }
  if (payload.aud !== "authenticated") {
    fail(`JWT aud=${payload.aud} esperado=authenticated`);
  }
  const ttl = payload.exp - payload.iat;
  if (ttl !== 3600) fail(`JWT ttl=${ttl}s esperado=3600s`);
  ok(`JWT claims OK (sub, tenant_id, tenant_role, aud, exp=1h)`);

  // 9. Sin auth → 401
  const noAuth = await getJson("/api/tenant/me");
  if (noAuth.status !== 401) {
    fail(`tenant me sin cookie devolvió ${noAuth.status}, esperado 401`);
  }
  ok("tenant me rechaza sin auth");

  console.log(`\n[smoke] ✓ TODOS LOS CHECKS PASARON (${TEST_EMAIL})`);
}

main().catch((err) => {
  console.error("[smoke] excepción inesperada:", err);
  process.exit(1);
});
