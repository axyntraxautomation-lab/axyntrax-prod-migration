import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseEnv,
  isSupabaseConfigured as libIsSupabaseConfigured,
} from "@workspace/db-supabase/env";
import { logger } from "./logger";

let cachedAdmin: SupabaseClient | null = null;

/**
 * Cliente Supabase con service-role key (poderes totales, RLS bypassed).
 * Solo se debe usar dentro del api-server, NUNCA en el frontend.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const { publicUrl, serviceRoleKey } = getSupabaseEnv();
  if (!publicUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos. " +
        "Crea el proyecto en Supabase y registra ambos secrets en el panel de Replit.",
    );
  }

  cachedAdmin = createClient(publicUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "axyntrax-api-server" } },
  });
  return cachedAdmin;
}

/**
 * Cliente Supabase actuando como un tenant específico (útil para debugging).
 */
export async function getSupabaseAsTenant(args: {
  tenantId: string;
  ownerEmail: string;
}): Promise<SupabaseClient> {
  const { signTenantJwt } = await import("./tenant-jwt");
  const { publicUrl, anonKey } = getSupabaseEnv();
  if (!publicUrl || !anonKey) {
    throw new Error("SUPABASE_URL y SUPABASE_ANON_KEY son requeridos.");
  }
  const token = signTenantJwt({
    sub: args.ownerEmail,
    tenant_id: args.tenantId,
    role: "tenant_owner",
  });
  return createClient(publicUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function isSupabaseConfigured(): boolean {
  const ok = libIsSupabaseConfigured();
  if (!ok) {
    logger.warn(
      "Supabase no está completamente configurado. Las rutas /api/tenant/* responderán 503 hasta que los 5 secrets (SUPABASE_URL, SUPABASE_DB_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET) estén presentes.",
    );
  }
  return ok;
}
