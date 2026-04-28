/**
 * Instalación idempotente de RLS endurecido en las 18 tablas tenant_*.
 *
 * Modelo:
 *  - Service role del api-server (BYPASSRLS por defecto en Supabase) sigue
 *    operando sin cambios: TODA la lógica de negocio del backend va por ahí.
 *  - Frontend tenant usa anon key + JWT firmado con SUPABASE_JWT_SECRET por
 *    /api/tenant/jwt. Ese JWT trae el claim `tenant_id` y `role:tenant_owner`.
 *  - Postgres expone el JWT vía `current_setting('request.jwt.claims')`.
 *  - Para CADA tabla tenant_* se ENABLE RLS + GRANT SELECT/INSERT/UPDATE/DELETE
 *    a tenant_owner, y se crea una POLICY UNIFICADA `*_tenant_isolation`
 *    `FOR ALL` con el predicado `tenant_id::text = jwt.tenant_id` aplicado a
 *    USING (filtra reads/updates/deletes) y WITH CHECK (filtra inserts/updates).
 *    Esto cumple el contrato de policy CRUD por tenant_id; el api-server sigue
 *    haciendo todos los writes "reales" (encriptación, dedupe, bitácora) pero
 *    el modelo de RLS queda completo para defense-in-depth.
 *  - Tabla `tenants` se restringe a la fila propia (solo SELECT; el tenant no
 *    debería rebrandearse a sí mismo bypassando el api-server).
 *  - Tabla `rubros_registry` queda con SELECT público (registry compartido).
 *
 * Idempotente: re-ejecutarlo no produce cambios destructivos. Las policies
 * se borran y recrean con el mismo nombre para reflejar cambios futuros.
 *
 * Uso:
 *   pnpm --filter @workspace/db-supabase run install-rls
 */
import { getSupabasePool, isSupabaseConfigured } from "../src/index";

const TENANT_TABLES = [
  "tenant_branding",
  "tenant_rubro_overrides",
  "tenant_inventario",
  "tenant_servicios",
  "tenant_clientes_finales",
  "tenant_empleados",
  "tenant_citas_servicios",
  "tenant_finanzas_movimientos",
  "tenant_alertas",
  "tenant_chat_cecilia_messages",
  "tenant_whatsapp_sessions",
  "tenant_whatsapp_messages",
  "tenant_kpi_snapshots",
  "tenant_onboarding_state",
  "tenant_faq_overrides",
  "tenant_pagos_qr",
  "tenant_backups",
] as const;

const JWT_TENANT_EXPR =
  "(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')";

async function installForTenantTable(
  pool: ReturnType<typeof getSupabasePool>,
  table: string,
): Promise<void> {
  const policyName = `${table}_tenant_isolation`;
  await pool.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
  await pool.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON public.${table} TO tenant_owner;`,
  );
  // Drop legacy split policies si existieran de versiones previas.
  await pool.query(
    `DROP POLICY IF EXISTS ${policyName} ON public.${table};`,
  );
  await pool.query(
    `DROP POLICY IF EXISTS ${policyName}_select ON public.${table};`,
  );
  await pool.query(
    `DROP POLICY IF EXISTS ${policyName}_insert ON public.${table};`,
  );
  await pool.query(
    `DROP POLICY IF EXISTS ${policyName}_update ON public.${table};`,
  );
  await pool.query(
    `DROP POLICY IF EXISTS ${policyName}_delete ON public.${table};`,
  );
  // Policy unificada FOR ALL: USING filtra SELECT/UPDATE/DELETE por owner,
  // WITH CHECK filtra el tenant_id de filas insertadas/actualizadas.
  await pool.query(
    `CREATE POLICY ${policyName} ON public.${table}
       FOR ALL
       TO tenant_owner
       USING (tenant_id::text = ${JWT_TENANT_EXPR})
       WITH CHECK (tenant_id::text = ${JWT_TENANT_EXPR});`,
  );
}

async function installForTenantsTable(
  pool: ReturnType<typeof getSupabasePool>,
): Promise<void> {
  await pool.query(`ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;`);
  await pool.query(`GRANT SELECT ON public.tenants TO tenant_owner;`);
  await pool.query(`DROP POLICY IF EXISTS tenants_self_only ON public.tenants;`);
  await pool.query(
    `CREATE POLICY tenants_self_only ON public.tenants
       FOR SELECT
       TO tenant_owner
       USING (id::text = ${JWT_TENANT_EXPR});`,
  );
}

async function installForRubrosRegistry(
  pool: ReturnType<typeof getSupabasePool>,
): Promise<void> {
  await pool.query(
    `GRANT SELECT ON public.rubros_registry TO tenant_owner;`,
  );
}

async function main(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.error("[install-rls] Supabase no configurado: faltan secrets.");
    process.exit(1);
  }

  const pool = getSupabasePool();
  try {
    console.log(
      `[install-rls] activando RLS en ${TENANT_TABLES.length + 1} tablas tenant_* + tenants`,
    );

    await installForTenantsTable(pool);
    console.log("[install-rls] tenants OK");

    for (const table of TENANT_TABLES) {
      await installForTenantTable(pool, table);
      console.log(`[install-rls] ${table} OK`);
    }

    await installForRubrosRegistry(pool);
    console.log("[install-rls] rubros_registry GRANT SELECT OK");

    console.log(
      `[install-rls] completado. ${TENANT_TABLES.length + 1} tablas con RLS + policy tenant_isolation. ` +
        "Service role sigue con BYPASSRLS; tenant_owner solo SELECT filtrado por JWT tenant_id.",
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[install-rls] fallo:", err);
  process.exit(1);
});
