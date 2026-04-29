import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decryptBuffer, encryptBuffer } from "./crypto";
import { SESSION_BUCKET, getSupabase } from "./supabase";
import { logger } from "./logger";

/**
 * Path on local disk where Baileys will read/write its multi-file auth state.
 * Each tenant gets its own dir.
 */
export function localAuthDir(tenantId: string): string {
  return join(tmpdir(), "wa-worker", tenantId);
}

/** Storage prefix for the encrypted snapshot of a tenant's auth state. */
function storagePrefix(tenantId: string): string {
  return `${tenantId}/`;
}

/**
 * Download the tenant's encrypted auth state from Supabase Storage and write it
 * to the local auth dir. Returns true if any files were restored.
 */
export async function restoreAuthState(tenantId: string): Promise<boolean> {
  const supabase = getSupabase();
  const dir = localAuthDir(tenantId);
  const prefix = storagePrefix(tenantId);
  await mkdir(dir, { recursive: true });

  const { data: files, error } = await supabase.storage
    .from(SESSION_BUCKET)
    .list(prefix, { limit: 1000 });

  if (error || !files || files.length === 0) {
    return false;
  }

  let restored = 0;
  for (const f of files) {
    if (!f.name.endsWith(".enc")) continue;
    const remotePath = `${prefix}${f.name}`;
    const { data: blob, error: dlErr } = await supabase.storage
      .from(SESSION_BUCKET)
      .download(remotePath);
    if (dlErr || !blob) {
      logger.warn({ tenantId, file: f.name, dlErr }, "auth-state download failed");
      continue;
    }
    try {
      const arr = Buffer.from(await blob.arrayBuffer());
      const plain = decryptBuffer(arr);
      const localName = f.name.slice(0, -".enc".length);
      await writeFile(join(dir, localName), plain);
      restored += 1;
    } catch (err) {
      logger.warn({ tenantId, file: f.name, err }, "auth-state decrypt failed");
    }
  }
  return restored > 0;
}

/**
 * Read the tenant's local auth dir, encrypt every file and upload to Storage.
 * Files removed locally are also removed remotely.
 */
export async function persistAuthState(tenantId: string): Promise<void> {
  const supabase = getSupabase();
  const dir = localAuthDir(tenantId);
  const prefix = storagePrefix(tenantId);
  if (!existsSync(dir)) return;

  const localFiles = await readdir(dir);
  const localSet = new Set(localFiles);

  await Promise.all(
    localFiles.map(async (name) => {
      const buf = await readFile(join(dir, name));
      const enc = encryptBuffer(buf);
      const { error } = await supabase.storage
        .from(SESSION_BUCKET)
        .upload(`${prefix}${name}.enc`, enc, {
          contentType: "application/octet-stream",
          upsert: true,
        });
      if (error) {
        logger.warn({ tenantId, name, error }, "auth-state upload failed");
      }
    }),
  );

  // Remove remote files that no longer exist locally.
  const { data: remote } = await supabase.storage
    .from(SESSION_BUCKET)
    .list(prefix, { limit: 1000 });
  if (remote) {
    const stale = remote
      .filter(
        (f) =>
          f.name.endsWith(".enc") &&
          !localSet.has(f.name.slice(0, -".enc".length)),
      )
      .map((f) => `${prefix}${f.name}`);
    if (stale.length > 0) {
      await supabase.storage.from(SESSION_BUCKET).remove(stale);
    }
  }
}

/** Delete the tenant's auth state both locally and remotely. */
export async function purgeAuthState(tenantId: string): Promise<void> {
  const supabase = getSupabase();
  const dir = localAuthDir(tenantId);
  const prefix = storagePrefix(tenantId);
  await rm(dir, { recursive: true, force: true });
  const { data: remote } = await supabase.storage
    .from(SESSION_BUCKET)
    .list(prefix, { limit: 1000 });
  if (remote && remote.length > 0) {
    await supabase.storage
      .from(SESSION_BUCKET)
      .remove(remote.map((f) => `${prefix}${f.name}`));
  }
}
