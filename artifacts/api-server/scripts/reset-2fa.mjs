#!/usr/bin/env node
import readline from "node:readline/promises";
import os from "node:os";
import { stdin as input, stdout as output, argv, exit } from "node:process";

const email = (argv[2] || "").trim().toLowerCase();

if (!email) {
  console.error("Uso: pnpm --filter @workspace/api-server run reset-2fa <email>");
  console.error("Ejemplo: pnpm --filter @workspace/api-server run reset-2fa axyntraxautomation@gmail.com");
  exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: La variable DATABASE_URL no está definida.");
  exit(1);
}

const { db, usersTable, auditLogTable } = await import("@workspace/db");
const { eq } = await import("drizzle-orm");
const { notifyAdminTwofaResetAttempt } = await import(
  "../src/lib/security-alerts.mjs"
);

async function alertIfAdmin(action, extra) {
  try {
    await notifyAdminTwofaResetAttempt({
      action,
      operator,
      targetEmail: user.email,
      targetRole: user.role,
      extra,
    });
  } catch (err) {
    console.error(
      "ADVERTENCIA: fallo al enviar la alerta de seguridad:",
      err?.message ?? err,
    );
  }
}

const [user] = await db
  .select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    twofaEnabled: usersTable.twofaEnabled,
    twofaSecret: usersTable.twofaSecret,
  })
  .from(usersTable)
  .where(eq(usersTable.email, email))
  .limit(1);

if (!user) {
  console.error(`ERROR: No existe ningún usuario con email "${email}".`);
  exit(1);
}

console.log("--------------------------------------------------");
console.log("Usuario encontrado:");
console.log("  id:           ", user.id);
console.log("  email:        ", user.email);
console.log("  name:         ", user.name);
console.log("  role:         ", user.role);
console.log("  twofa_enabled:", user.twofaEnabled);
console.log("  twofa_secret: ", user.twofaSecret ? "(definido)" : "(vacío)");
console.log("--------------------------------------------------");
console.log("");
console.log("Esta acción borrará el secreto TOTP y el flag 2FA.");
console.log("El próximo login del usuario disparará el QR de re-enrolamiento.");
console.log("");

const operator =
  (process.env.AUDIT_OPERATOR || "").trim() ||
  process.env.SUDO_USER ||
  process.env.USER ||
  process.env.LOGNAME ||
  (() => {
    try {
      return os.userInfo().username;
    } catch {
      return "unknown";
    }
  })();

const baseMeta = {
  operator,
  targetEmail: user.email,
  targetRole: user.role,
  hadTwofaSecret: Boolean(user.twofaSecret),
  twofaEnabledBefore: user.twofaEnabled,
};

const baseAuditEntry = {
  userId: null,
  entityType: "user",
  entityId: String(user.id),
  ip: null,
  userAgent: `reset-2fa-cli (host=${os.hostname()})`,
};

const rl = readline.createInterface({ input, output });
const answer = (await rl.question('Escribí "RESET" para confirmar: ')).trim();
rl.close();

if (answer !== "RESET") {
  try {
    await db.insert(auditLogTable).values({
      ...baseAuditEntry,
      action: "auth.2fa.reset_cli.cancelled",
      meta: {
        ...baseMeta,
        confirmationAnswer: answer,
      },
    });
  } catch (err) {
    console.error(
      "ADVERTENCIA: No se pudo registrar la cancelación en audit_log:",
      err?.message ?? err,
    );
  }
  await alertIfAdmin("auth.2fa.reset_cli.cancelled", {
    confirmationAnswer: answer,
  });
  console.log("Cancelado. No se hicieron cambios.");
  exit(0);
}

try {
  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({
        twofaSecret: null,
        twofaEnabled: "false",
        emailOtpHash: null,
        emailOtpExpiresAt: null,
      })
      .where(eq(usersTable.id, user.id));

    await tx.insert(auditLogTable).values({
      ...baseAuditEntry,
      action: "auth.2fa.reset_cli",
      meta: baseMeta,
    });
  });
  await alertIfAdmin("auth.2fa.reset_cli", null);
} catch (err) {
  const errorMessage = err?.message ?? String(err);
  console.error(
    "ERROR: Reset 2FA abortado: no se pudo aplicar el cambio + auditoría en la misma transacción.",
  );
  console.error(errorMessage);
  try {
    await db.insert(auditLogTable).values({
      ...baseAuditEntry,
      action: "auth.2fa.reset_cli.failed",
      meta: {
        ...baseMeta,
        error: errorMessage,
      },
    });
  } catch (logErr) {
    console.error(
      "ADVERTENCIA: Tampoco se pudo registrar la falla en audit_log:",
      logErr?.message ?? logErr,
    );
  }
  await alertIfAdmin("auth.2fa.reset_cli.failed", { error: errorMessage });
  exit(1);
}

console.log("");
console.log("OK: 2FA reseteado para", user.email);
console.log("Operador registrado en bitácora:", operator);
console.log("Pasos para el usuario:");
console.log("  1. Ir a /jarvis/login");
console.log("  2. Ingresar email + contraseña actual");
console.log("  3. Escanear el QR que aparece con Google Authenticator o Authy");
console.log("  4. Ingresar el primer código de 6 dígitos para entrar");

exit(0);
