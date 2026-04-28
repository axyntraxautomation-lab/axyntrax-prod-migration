import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { sendMail } from "./mailer";
import { logger } from "./logger";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_LENGTH = 6;

export function generateOtp(): string {
  let s = "";
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    s += crypto.randomInt(0, 10).toString();
  }
  return s;
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const head = local.slice(0, Math.min(2, local.length));
  const tail = local.length > 4 ? local.slice(-1) : "";
  return `${head}${"•".repeat(Math.max(3, local.length - head.length - tail.length))}${tail}@${domain}`;
}

export interface IssueEmailOtpResult {
  ok: boolean;
  sentTo?: string;
  error?: string;
  expiresAt?: Date;
}

/**
 * Generates a fresh 6-digit OTP for the given user, persists the hash + expiry,
 * and sends the code by email via Gmail. Always returns ok:true on success
 * and surfaces errors only on Gmail failure (never reveals whether user exists).
 */
export async function issueEmailOtp(userId: number, toEmail: string): Promise<IssueEmailOtpResult> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db
    .update(usersTable)
    .set({ emailOtpHash: hashOtp(code), emailOtpExpiresAt: expiresAt })
    .where(eq(usersTable.id, userId));

  const subject = "JARVIS · Tu código de acceso";
  const textBody = [
    "Tu código de verificación AXYNTRAX JARVIS",
    "",
    `Código: ${code}`,
    "",
    `Vence en 10 minutos (${expiresAt.toLocaleString("es-PE", { timeZone: "America/Lima" })} hora Perú).`,
    "",
    "Si no fuiste tú, ignora este correo y cambia tu contraseña.",
    "",
    "— AXYNTRAX Automation · Arequipa, Perú",
  ].join("\n");

  const htmlBody = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#05070C;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#e2e8f0;">
  <div style="max-width:480px;margin:0 auto;background:#0b1220;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
    <div style="text-align:center;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#22d3ee;">AXYNTRAX · JARVIS</div>
    <h1 style="margin:16px 0 8px;font-size:22px;color:#f8fafc;text-align:center;">Tu código de acceso</h1>
    <p style="margin:0 0 24px;text-align:center;color:#94a3b8;font-size:14px;">Úsalo en la pantalla de doble factor de JARVIS.</p>
    <div style="margin:24px auto;text-align:center;font-family:'JetBrains Mono',Menlo,monospace;font-size:36px;letter-spacing:0.5em;color:#22d3ee;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.25);border-radius:12px;padding:18px 12px;">
      ${code}
    </div>
    <p style="margin:0;text-align:center;color:#64748b;font-size:12px;">Vence en 10 minutos. Si no fuiste tú, ignora este correo y cambia tu contraseña.</p>
    <hr style="margin:24px 0;border:0;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;text-align:center;color:#475569;font-size:11px;">AXYNTRAX Automation · Arequipa, Perú</p>
  </div>
</body></html>`;

  const result = await sendMail({ to: toEmail, subject, textBody, htmlBody });

  if (!result.ok) {
    logger.warn({ userId, error: result.error }, "auth.email_otp.send_failed");
    return { ok: false, error: "No pudimos enviar el correo. Intenta con tu app autenticadora o reintenta." };
  }

  logger.info({ userId, to: maskEmail(toEmail) }, "auth.email_otp.sent");
  return { ok: true, sentTo: maskEmail(toEmail), expiresAt };
}

export interface VerifyEmailOtpResult {
  ok: boolean;
  reason?: "expired" | "invalid" | "no_pending";
}

/**
 * Verifies the email OTP for a user. Returns ok:true and clears the stored
 * code on success. Constant-time comparison.
 */
export async function verifyEmailOtp(userId: number, code: string): Promise<VerifyEmailOtpResult> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user || !user.emailOtpHash || !user.emailOtpExpiresAt) {
    return { ok: false, reason: "no_pending" };
  }
  if (user.emailOtpExpiresAt.getTime() < Date.now()) {
    await db
      .update(usersTable)
      .set({ emailOtpHash: null, emailOtpExpiresAt: null })
      .where(eq(usersTable.id, userId));
    return { ok: false, reason: "expired" };
  }
  const inHash = Buffer.from(hashOtp(code.trim()));
  const stored = Buffer.from(user.emailOtpHash);
  if (inHash.length !== stored.length || !crypto.timingSafeEqual(inHash, stored)) {
    return { ok: false, reason: "invalid" };
  }
  await db
    .update(usersTable)
    .set({ emailOtpHash: null, emailOtpExpiresAt: null })
    .where(eq(usersTable.id, userId));
  return { ok: true };
}
