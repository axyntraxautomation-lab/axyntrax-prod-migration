import os from "node:os";

const ALERT_TIMEOUT_MS = (() => {
  const raw = Number(process.env.SECURITY_ALERT_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 5000;
})();

function withTimeout(ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error(`timeout tras ${ms}ms`)), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(timer) };
}

const ACTION_LABELS = {
  "auth.2fa.reset_cli": "EJECUTADO (2FA borrado)",
  "auth.2fa.reset_cli.cancelled": "CANCELADO en el prompt",
  "auth.2fa.reset_cli.failed": "FALLÓ durante el commit",
};

function describeAction(action) {
  return ACTION_LABELS[action] || action;
}

function buildSubject({ action, targetEmail }) {
  return `[ALERTA SEGURIDAD] Intento de reset 2FA sobre admin ${targetEmail} (${describeAction(action)})`;
}

function buildTextBody({ action, operator, targetEmail, targetRole, timestamp, extra }) {
  const lines = [
    "Se intentó resetear el 2FA de una cuenta admin desde el CLI.",
    "",
    `Acción:     ${action} (${describeAction(action)})`,
    `Target:     ${targetEmail} (rol=${targetRole})`,
    `Operador:   ${operator}`,
    `Host:       ${os.hostname()}`,
    `Timestamp:  ${timestamp}`,
  ];
  if (extra && typeof extra === "object") {
    const entries = Object.entries(extra).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length > 0) {
      lines.push("");
      lines.push("Detalles:");
      for (const [k, v] of entries) {
        lines.push(`  ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
      }
    }
  }
  lines.push("");
  lines.push("Si vos no estás detrás de esto, revisá audit_log y rotá credenciales del servidor YA.");
  return lines.join("\n");
}

function buildSlackPayload({ action, operator, targetEmail, targetRole, timestamp, extra }) {
  const text = `:rotating_light: *Intento de reset 2FA sobre admin* \`${targetEmail}\` — ${describeAction(action)}`;
  const fields = [
    { title: "Acción", value: action, short: true },
    { title: "Estado", value: describeAction(action), short: true },
    { title: "Target", value: `${targetEmail} (rol=${targetRole})`, short: false },
    { title: "Operador", value: operator, short: true },
    { title: "Host", value: os.hostname(), short: true },
    { title: "Timestamp", value: timestamp, short: false },
  ];
  if (extra && typeof extra === "object") {
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined || v === null) continue;
      fields.push({
        title: k,
        value: typeof v === "string" ? v : JSON.stringify(v),
        short: false,
      });
    }
  }
  return {
    text,
    attachments: [
      {
        color: "danger",
        fallback: text,
        fields,
      },
    ],
  };
}

async function sendWebhook(url, payload) {
  const t = withTimeout(ALERT_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: t.signal,
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { ok: false, error: `HTTP ${r.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  } finally {
    t.cancel();
  }
}

function base64Url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMime(to, subject, textBody) {
  const subjectEnc = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  return [
    `To: ${to}`,
    `Subject: ${subjectEnc}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    textBody,
    "",
  ].join("\r\n");
}

// Allows tests to inject a fake transport without touching the connectors SDK
// or the network. Production code never calls this.
let __sendEmailImpl = null;
export function __setSendEmailForTests(fn) {
  __sendEmailImpl = fn;
}

async function sendEmailViaGmail(to, subject, textBody) {
  if (__sendEmailImpl) {
    try {
      return await __sendEmailImpl({ to, subject, textBody });
    } catch (err) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }
  let ReplitConnectors;
  try {
    ({ ReplitConnectors } = await import("@replit/connectors-sdk"));
  } catch (err) {
    return {
      ok: false,
      error: `no se pudo cargar @replit/connectors-sdk: ${err?.message ?? err}`,
    };
  }
  try {
    const connectors = new ReplitConnectors();
    const raw = base64Url(Buffer.from(buildMime(to, subject, textBody), "utf8"));
    const proxyPromise = connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      },
    );
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`timeout tras ${ALERT_TIMEOUT_MS}ms`)),
        ALERT_TIMEOUT_MS,
      ).unref?.();
    });
    const r = await Promise.race([proxyPromise, timeoutPromise]);
    const text = await r.text();
    if (!r.ok) {
      return { ok: false, error: `Gmail HTTP ${r.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

/**
 * Notifica un intento (success/cancelled/failed) de reset de 2FA cuando el target
 * es admin. Lee SECURITY_ALERT_WEBHOOK y SECURITY_ALERT_EMAIL del entorno; si no
 * hay ninguna configurada, no hace nada y no rompe.
 */
export async function notifyAdminTwofaResetAttempt(event) {
  try {
    const { targetRole } = event;
    if (targetRole !== "admin") return;

    const webhookUrl = (process.env.SECURITY_ALERT_WEBHOOK || "").trim();
    const emailTo = (process.env.SECURITY_ALERT_EMAIL || "").trim();

    if (!webhookUrl && !emailTo) return;

    const enriched = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    if (webhookUrl) {
      const res = await sendWebhook(webhookUrl, buildSlackPayload(enriched));
      if (res.ok) {
        console.log(`[security-alerts] webhook OK (${enriched.action})`);
      } else {
        console.error(`[security-alerts] webhook FALLÓ: ${res.error}`);
      }
    }

    if (emailTo) {
      const subject = buildSubject(enriched);
      const textBody = buildTextBody(enriched);
      const res = await sendEmailViaGmail(emailTo, subject, textBody);
      if (res.ok) {
        console.log(`[security-alerts] email OK -> ${emailTo} (${enriched.action})`);
      } else {
        console.error(`[security-alerts] email FALLÓ: ${res.error}`);
      }
    }
  } catch (err) {
    console.error(
      `[security-alerts] error inesperado al enviar alerta: ${err?.message ?? err}`,
    );
  }
}
