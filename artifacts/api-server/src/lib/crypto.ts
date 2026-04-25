import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { logger } from "./logger";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;
let warnedFallback = false;

function deriveKey(): Buffer {
  if (cachedKey) return cachedKey;

  const explicit = process.env.ENCRYPTION_KEY;
  if (explicit && explicit.length >= 16) {
    cachedKey = createHash("sha256").update(explicit, "utf8").digest();
    return cachedKey;
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret && sessionSecret.length >= 16) {
    if (!warnedFallback) {
      warnedFallback = true;
      logger.warn(
        "ENCRYPTION_KEY is not set. Falling back to SESSION_SECRET to derive the AES-256-GCM data key. " +
          "Set ENCRYPTION_KEY explicitly (decoupled from SESSION_SECRET) before rotating session secrets, " +
          "otherwise stored encrypted data (clients.phone, clients.notes, licenses.key) will become unreadable.",
      );
    }
    cachedKey = createHash("sha256").update(sessionSecret, "utf8").digest();
    return cachedKey;
  }

  throw new Error(
    "Encryption key not configured. Set ENCRYPTION_KEY (32+ chars recommended) " +
      "in environment secrets to enable AES-256-GCM field encryption.",
  );
}

export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const key = deriveKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN) {
    throw new Error("Invalid encrypted payload: too short.");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

const ENCRYPTED_PREFIX = "enc::";

export function encryptField(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  return ENCRYPTED_PREFIX + encrypt(value);
}

export function decryptField(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;
  try {
    return decrypt(value.slice(ENCRYPTED_PREFIX.length));
  } catch {
    return null;
  }
}
