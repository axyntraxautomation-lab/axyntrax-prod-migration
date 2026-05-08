import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { requireSupabaseDbUrl } from "./env";
import { SUPABASE_ROOT_CA_2021 } from "./certs/embedded";

const { Pool } = pg;

let cachedPool: pg.Pool | null = null;
let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Root CA público de Supabase (Supabase Root 2021 CA, válido hasta
 * 2031-04-26). Supabase usa su propia CA privada para firmar los certs
 * de los conexion poolers (`*.pooler.supabase.com`), por lo que el trust
 * store de Node.js NO la incluye. Embebido como módulo TS en
 * `./certs/embedded.ts` para que TODA conexión Postgres use verify-full
 * sin depender de env vars y sin filesystem reads en runtime (compatible
 * con esbuild bundle, tsx dev y vitest).
 *
 * Para renovar antes de 2031: extraer con
 *   openssl s_client -connect aws-0-us-east-1.pooler.supabase.com:6543 \
 *     -starttls postgres -showcerts </dev/null
 * guardar el último cert (root self-signed) en certs/supabase-root-2021.crt
 * y regenerar `embedded.ts` con:
 *   (printf 'export const SUPABASE_ROOT_CA_2021 = `'; cat supabase-root-2021.crt; \
 *    printf '`;\n') > embedded.ts
 */
const CA_BUNDLE = SUPABASE_ROOT_CA_2021;

/**
 * Resuelve la configuración TLS para la pool (verify-full obligatorio).
 *
 * Política:
 *  - TLS siempre activo (cifrado en tránsito).
 *  - `rejectUnauthorized: true` siempre: la cadena de certificados se
 *    valida contra el `CA_BUNDLE` embebido (root CAs públicos de AWS RDS).
 *  - NO existe ningún escape hatch (env var, query string, host) para
 *    deshabilitar la verificación. Si el cert no valida, la conexión
 *    falla y el operador debe actualizar el bundle, NO bypasarlo.
 */
function resolveSslConfig(_connectionString: string): pg.PoolConfig["ssl"] {
  return { ca: CA_BUNDLE, rejectUnauthorized: true };
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
