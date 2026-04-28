import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

let cachedAdmin: SupabaseClient | null = null;

/**
 * Cliente Supabase con service-role key (poderes totales, RLS bypassed).
 * Solo se debe usar dentro del api-server, NUNCA en el frontend.
 *
 * Este cliente sirve para:
 * - Crear/actualizar tenants desde el endpoint de signup
 * - Operaciones administrativas (impersonar tenant para debugging)
 * - Tareas de mantenimiento (limpieza, backups, migraciones controladas)
 *
 * Para operaciones del tenant en runtime, el frontend debe usar el JWT firmado
 * por tenant-jwt.ts, que respeta las policies RLS (cuando se activen en la
 * próxima tarea).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos. " +
        "Crea el proyecto en Supabase y registra ambos secrets en el panel de Replit.",
    );
  }

  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "axyntrax-api-server" } },
  });
  return cachedAdmin;
}

/**
 * Cliente Supabase actuando como un tenant específico (útil para debugging).
 * Firma un JWT temporal para el tenant y devuelve un cliente con ese token.
 */
export async function getSupabaseAsTenant(args: {
  tenantId: string;
  ownerEmail: string;
}): Promise<SupabaseClient> {
  const { signTenantJwt } = await import("./tenant-jwt");
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL y SUPABASE_ANON_KEY son requeridos.");
  }
  const token = signTenantJwt({
    sub: args.ownerEmail,
    tenant_id: args.tenantId,
    role: "tenant_owner",
  });
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function isSupabaseConfigured(): boolean {
  const ok =
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.SUPABASE_ANON_KEY &&
    !!process.env.SUPABASE_JWT_SECRET;
  if (!ok) {
    logger.warn(
      "Supabase no está completamente configurado. Las rutas /api/tenant/* responderán 503 hasta que los 4 secrets (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET) estén presentes.",
    );
  }
  return ok;
}
