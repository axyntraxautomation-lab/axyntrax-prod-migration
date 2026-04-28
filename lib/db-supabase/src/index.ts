import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { requireSupabaseDbUrl } from "./env";

const { Pool } = pg;

let cachedPool: pg.Pool | null = null;
let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Resuelve la configuración TLS para la pool (secure-by-default).
 *
 * Política:
 *  - TLS siempre está activo (cifrado en tránsito).
 *  - Por defecto, `rejectUnauthorized: true` → la cadena de certificados
 *    se valida contra los root CAs de Node (`tls.rootCertificates`).
 *  - El downgrade a `rejectUnauthorized: false` requiere opt-in EXPLÍCITO
 *    del operador, mediante UNO de:
 *      • `SUPABASE_TLS_INSECURE=true` (env var de proceso).
 *      • `?sslmode=no-verify` o `?sslmode=disable` en el SUPABASE_DB_URL.
 *  - No hay override por host: la decisión queda en manos del operador.
 *
 * Para Supabase con verificación completa, registrar el CA bundle público
 * de Supabase en `ssl.ca` del Pool (TODO operacional).
 */
function resolveSslConfig(connectionString: string): pg.PoolConfig["ssl"] {
  const insecureFlag =
    String(process.env.SUPABASE_TLS_INSECURE ?? "").toLowerCase() === "true";

  let urlMode = "";
  try {
    const u = new URL(connectionString);
    urlMode = u.searchParams.get("sslmode") ?? "";
  } catch {
    /* no-op: cadenas mal formadas se manejan aguas abajo */
  }

  if (insecureFlag || urlMode === "no-verify" || urlMode === "disable") {
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
