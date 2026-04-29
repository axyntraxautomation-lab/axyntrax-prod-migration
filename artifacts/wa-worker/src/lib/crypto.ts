import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const raw =
    process.env["ENCRYPTION_KEY"] ??
    process.env["SESSION_SECRET"] ??
    null;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY (or SESSION_SECRET) is required to cipher WhatsApp credentials",
    );
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptBuffer(plain: Buffer): Buffer {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

export function decryptBuffer(blob: Buffer): Buffer {
  if (blob.length < 28) {
    throw new Error("Cipher blob too short");
  }
  const key = getKey();
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const enc = blob.subarray(28);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}
