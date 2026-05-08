/**
 * Provisión idempotente del rol PG `tenant_owner` en Supabase.
 *
 * Este script DEBE ejecutarse una vez por proyecto Supabase como parte del
 * setup inicial (antes de que /api/tenant/jwt sea operativo). El rol es el
 * que firma el bridge JWT del api-server (claim `role: "tenant_owner"`).
 *
 * Sin esta provisión, PostgREST rechaza el JWT con "role does not exist".
 *
 * Uso:
 *   pnpm --filter @workspace/db-supabase run bootstrap
 *
 * Idempotente: re-ejecutarlo no produce cambios.
 *
 * Alcance actual (task #44): el rol tiene SELECT amplio sobre `public.tenants`
 * para que el bridge JWT funcione end-to-end. Las policies RLS por tenant
 * (filtrado por `tenant_id` extraído del JWT) se instalan en task #45 y
 * sustituyen ese acceso amplio por aislamiento real.
 */
import { getSupabasePool, isSupabaseConfigured } from "../src/index";

async function main(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.error("[bootstrap] Supabase no configurado: faltan secrets.");
    process.exit(1);
  }

  const pool = getSupabasePool();
  try {
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
    await pool.query(`GRANT USAGE ON SCHEMA public TO tenant_owner;`);
    await pool.query(`GRANT SELECT ON public.tenants TO tenant_owner;`);
    console.log("[bootstrap] rol tenant_owner provisionado (idempotente)");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[bootstrap] fallo:", err);
  process.exit(1);
});
