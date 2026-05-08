import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@workspace/db-supabase/env";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const { publicUrl, serviceRoleKey } = getSupabaseEnv();
  if (!publicUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for wa-worker",
    );
  }
  cached = createClient(publicUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const SESSION_BUCKET = "wa-session-creds";

/** Best-effort bucket creation. Idempotent. */
export async function ensureSessionBucket(): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((b) => b.name === SESSION_BUCKET)) return;
  await supabase.storage.createBucket(SESSION_BUCKET, { public: false });
}
