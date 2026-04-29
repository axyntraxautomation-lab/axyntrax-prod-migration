interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 5;

const buckets = new Map<string, Bucket>();

/**
 * Token-bucket-ish per-tenant rate limit for model calls.
 * Returns true if the call is allowed, false if throttled.
 */
export function allowModelCall(tenantId: string, limit = DEFAULT_LIMIT): boolean {
  const now = Date.now();
  const cur = buckets.get(tenantId);
  if (!cur || now - cur.windowStart > WINDOW_MS) {
    buckets.set(tenantId, { count: 1, windowStart: now });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count += 1;
  return true;
}

/** Test helper. */
export function _resetRateLimit(): void {
  buckets.clear();
}
