import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { requireSupabaseDbUrl } from "./env";

const { Pool } = pg;

let cachedPool: pg.Pool | null = null;
let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Resuelve la configuración TLS para la pool.
 *
 * Política:
 *  - TLS siempre está activo (cifrado en tránsito).
 *  - Por defecto, la cadena de certificados se valida contra los root CAs
 *    de Node (`tls.rootCertificates`).
 *  - Para hosts del pooler Supabase (`*.supabase.com` / `*.supabase.co`),
 *    se desactiva `rejectUnauthorized`. Razón: el pooler de Supabase sirve
 *    una cadena con un certificado intermedio que no está incluido en el
 *    bundle root CA por defecto de Node. La excepción es estrecha (sólo
 *    para hosts Supabase), explícita y limitada al destino conocido.
 *  - El operador puede forzar `rejectUnauthorized: false` globalmente
 *    exportando `SUPABASE_TLS_INSECURE=true` o usando `sslmode=no-verify`
 *    en el URL. Para subir la verificación al máximo en producción,
 *    cuando Supabase publique el bundle CA en `tls.rootCertificates`,
 *    bastará con quitar la excepción de host.
 */
function resolveSslConfig(connectionString: string): pg.PoolConfig["ssl"] {
  const insecureFlag =
    String(process.env.SUPABASE_TLS_INSECURE ?? "").toLowerCase() === "true";

  let urlMode = "";
  let host = "";
  try {
    const u = new URL(connectionString);
    urlMode = u.searchParams.get("sslmode") ?? "";
    host = u.hostname;
  } catch {
    /* no-op: cadenas mal formadas se manejan aguas abajo */
  }

  if (insecureFlag || urlMode === "no-verify" || urlMode === "disable") {
    return { rejectUnauthorized: false };
  }

  if (/\.supabase\.(com|co)$/i.test(host)) {
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: true };
}

export { resolveSslConfig };

export function getSupabaseDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!cachedDb) {
    const connectionString = requireSupabaseDbUrl();
    cachedPool = new Pool({
      connectionString,
      max: 5,
      ssl: resolveSslConfig(connectionString),
    });
    cachedDb = drizzle(cachedPool, { schema });
  }
  return cachedDb;
}

export function getSupabasePool(): pg.Pool {
  if (!cachedPool) {
    getSupabaseDb();
  }
  return cachedPool!;
}

export * from "./schema";
export { getSupabaseEnv, isSupabaseConfigured, requireSupabaseDbUrl } from "./env";
