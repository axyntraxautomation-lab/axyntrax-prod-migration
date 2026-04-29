import { createHash } from "node:crypto";

/**
 * Token shared between api-server and wa-worker. Derived from SESSION_SECRET so
 * no extra secret has to be provisioned. api-server uses the same derivation.
 */
export function getInternalToken(): string {
  const explicit = process.env["WA_WORKER_INTERNAL_TOKEN"];
  if (explicit && explicit.length > 0) return explicit;
  const seed = process.env["SESSION_SECRET"];
  if (!seed) {
    throw new Error(
      "SESSION_SECRET (or WA_WORKER_INTERNAL_TOKEN) must be set for internal auth",
    );
  }
  return createHash("sha256").update(seed).update("wa-worker").digest("hex");
}
