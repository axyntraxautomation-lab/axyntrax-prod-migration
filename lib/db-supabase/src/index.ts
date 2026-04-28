import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let cachedPool: pg.Pool | null = null;
let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getConnectionString(): string {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error(
      "SUPABASE_DB_URL no está configurado. Configura la cadena de conexión Postgres del proyecto Supabase como secret.",
    );
  }
  return url;
}

export function getSupabaseDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!cachedDb) {
    cachedPool = new Pool({
      connectionString: getConnectionString(),
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
