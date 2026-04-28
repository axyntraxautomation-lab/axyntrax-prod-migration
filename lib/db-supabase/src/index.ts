import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { requireSupabaseDbUrl } from "./env";

const { Pool } = pg;

let cachedPool: pg.Pool | null = null;
let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getSupabaseDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!cachedDb) {
    cachedPool = new Pool({
      connectionString: requireSupabaseDbUrl(),
      max: 5,
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
