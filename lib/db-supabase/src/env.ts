/**
 * Resolutor tolerante de la configuración Supabase.
 *
 * Tolerancia limitada al par URL ↔ DB_URL: si el usuario pegó cruzados
 * SUPABASE_URL y SUPABASE_DB_URL, los detecta por forma y los normaliza.
 * También repara prefijos truncados al inicio del Postgres URL (p, po,
 * pos…) y fuerza `sslmode=no-verify` para el cert self-signed del pooler.
 *
 * Reglas de detección:
 * - dbUrl: el primer valor que comience con "postgresql://" o "postgres://"
 *   buscando en SUPABASE_DB_URL, luego SUPABASE_URL.
 * - publicUrl: el primer valor con forma "https://*.supabase.co" buscando
 *   en SUPABASE_URL, luego SUPABASE_DB_URL. Si no aparece, se deriva del
 *   project ref extraído del dbUrl (host pooler usa user "postgres.<ref>").
 * - anonKey, serviceRoleKey, jwtSecret: se leen tal cual de su secret
 *   homónimo. NO se intenta detectar cruces entre ellos: si el usuario
 *   pegó la anon key en SERVICE_ROLE_KEY (o viceversa), debe corregirlo
 *   en el panel de secrets.
 */

export type SupabaseEnv = {
  dbUrl: string;
  publicUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
};

/**
 * Detecta y repara prefijos truncados al inicio de la cadena Postgres.
 * Si el valor parece un DB URL pero perdió "p", "po", "pos"... al inicio,
 * lo reconstruye. Devuelve "" si no es un DB URL.
 *
 * Adicionalmente fuerza `sslmode=no-verify` para que node-postgres acepte
 * el cert self-signed del pooler Supabase sin requerir una CA chain pública.
 */
function normalizePostgresUrl(value: string): string {
  if (!value) return "";

  let candidate = value;
  if (
    !candidate.startsWith("postgresql://") &&
    !candidate.startsWith("postgres://")
  ) {
    const m = candidate.match(/^([a-z]*?)(ostgresql:\/\/|ostgres:\/\/)/);
    if (m && m[1].length <= 7) {
      candidate = "p" + candidate.slice(m[1].length);
    }
  }
  if (
    !candidate.startsWith("postgresql://") &&
    !candidate.startsWith("postgres://")
  ) {
    return "";
  }

  try {
    const u = new URL(candidate);
    u.searchParams.set("sslmode", "no-verify");
    return u.toString();
  } catch {
    return candidate;
  }
}

function isHttpsSupabaseUrl(value: string): boolean {
  return value.startsWith("https://") && value.endsWith(".supabase.co");
}

function deriveProjectRef(postgresUrl: string): string | null {
  try {
    const u = new URL(postgresUrl);
    const userParts = u.username.split(".");
    if (userParts.length >= 2 && userParts[0] === "postgres") {
      return userParts[1];
    }
    const hostParts = u.hostname.split(".");
    if (hostParts[0] === "db" && hostParts.length >= 4) {
      return hostParts[1];
    }
    return null;
  } catch {
    return null;
  }
}

let cached: SupabaseEnv | null = null;

export function getSupabaseEnv(): SupabaseEnv {
  if (cached) return cached;

  const rawUrl = process.env.SUPABASE_URL || "";
  const rawDbUrl = process.env.SUPABASE_DB_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || "";

  let dbUrl = normalizePostgresUrl(rawDbUrl);
  if (!dbUrl) {
    dbUrl = normalizePostgresUrl(rawUrl);
  }

  let publicUrl = "";
  if (isHttpsSupabaseUrl(rawUrl)) {
    publicUrl = rawUrl;
  } else if (isHttpsSupabaseUrl(rawDbUrl)) {
    publicUrl = rawDbUrl;
  }
  if (!publicUrl && dbUrl) {
    const ref = deriveProjectRef(dbUrl);
    if (ref) publicUrl = `https://${ref}.supabase.co`;
  }

  cached = { dbUrl, publicUrl, anonKey, serviceRoleKey, jwtSecret };
  return cached;
}

export function isSupabaseConfigured(): boolean {
  const env = getSupabaseEnv();
  return !!(
    env.dbUrl &&
    env.publicUrl &&
    env.anonKey &&
    env.serviceRoleKey &&
    env.jwtSecret
  );
}

export function requireSupabaseDbUrl(): string {
  const { dbUrl } = getSupabaseEnv();
  if (!dbUrl) {
    throw new Error(
      "No se encontró una cadena Postgres válida. Registra la cadena de conexión Supabase (postgresql://...) en SUPABASE_DB_URL o en SUPABASE_URL.",
    );
  }
  return dbUrl;
}
