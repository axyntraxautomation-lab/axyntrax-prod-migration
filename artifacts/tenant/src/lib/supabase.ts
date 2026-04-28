/**
 * Cliente Supabase (anon-key) usado SOLO para Realtime en el frontend tenant.
 *
 * Identidad: el cliente envía un JWT firmado por el api-server (claim
 * `tenant_id` + `role:tenant_owner`). RLS en la base se encarga de filtrar
 * cualquier evento que no sea del tenant. Defense-in-depth: además de la
 * policy SQL, los `filter` de cada subscripción incluyen `tenant_id=eq.<id>`.
 *
 * NUNCA se hace REST writes desde acá: todos los writes pasan por el api-server.
 */
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let cachedJwt: string | null = null;

export function getSupabaseRealtime(args: {
  url: string;
  anonKey: string;
}): SupabaseClient {
  if (cached) return cached;
  cached = createClient(args.url, args.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return cached;
}

export function setSupabaseAuth(jwt: string): void {
  if (!cached) return;
  if (cachedJwt === jwt) return;
  cachedJwt = jwt;
  cached.realtime.setAuth(jwt);
}

export function disposeSupabase(): void {
  if (!cached) return;
  cached.removeAllChannels();
  cached = null;
  cachedJwt = null;
}

export type { RealtimeChannel };
