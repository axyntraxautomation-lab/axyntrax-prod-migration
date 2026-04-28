/**
 * Resolutor tolerante de la configuración Supabase.
 *
 * Tolerancia limitada al par URL ↔ DB_URL: si el usuario pegó cruzados
 * SUPABASE_URL y SUPABASE_DB_URL, los detecta por forma y los normaliza.
 * También repara prefijos truncados al inicio del Postgres URL (p, po,
 * pos…). Política TLS: secure-by-default (`sslmode=require`); el operador
 * puede opt-in a no-verify vía `SUPABASE_TLS_INSECURE=true` o `?sslmode=`
 * explícito en la cadena.
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
 * Política TLS (secure-by-default):
 *  - Si el URL ya trae `sslmode=` explícito, se respeta tal cual (el
 *    operador manda).
 *  - Si no, se completa con `sslmode=require` (TLS activo + verificación
 *    contra los root CAs de Node).
 *  - El downgrade a `no-verify` requiere opt-in EXPLÍCITO: añadir
 *    `?sslmode=no-verify` al SUPABASE_DB_URL o exportar
 *    SUPABASE_TLS_INSECURE=true (consumido por la pool en index.ts).
 *  - No se hace ningún override por host (la decisión queda en el operador).
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
    const insecureFlag =
      String(process.env.SUPABASE_TLS_INSECURE ?? "").toLowerCase() === "true";
    if (insecureFlag) {
      // Opt-in explícito del operador a no-verify. Sobreescribimos cualquier
      // sslmode previo (incluso `require`) porque pg-connection-string trata
      // `require` como `verify-full`, lo que anularía la opción ssl.* del
      // Pool. La intención del flag es desactivar la verificación end-to-end.
      u.searchParams.set("sslmode", "no-verify");
    } else if (!u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }
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
