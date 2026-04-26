import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface SendMailInput {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

export interface SendMailResult {
  ok: boolean;
  externalMessageId?: string;
  error?: string;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const subjectEnc = `=?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`;
  let mime: string;

  if (input.htmlBody) {
    const boundary = `axyn_alt_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2)}`;
    mime = [
      `To: ${input.to}`,
      `Subject: ${subjectEnc}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      input.textBody,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      input.htmlBody,
      "",
      `--${boundary}--`,
      "",
    ].join("\r\n");
  } else {
    mime = [
      `To: ${input.to}`,
      `Subject: ${subjectEnc}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      input.textBody,
      "",
    ].join("\r\n");
  }

  const raw = base64Url(Buffer.from(mime, "utf8"));

  try {
    const r = (await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      },
    )) as unknown as Response;
    const text = await r.text();
    if (!r.ok) {
      return { ok: false, error: `Gmail HTTP ${r.status}: ${text.slice(0, 200)}` };
    }
    let parsed: { id?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // ignore
    }
    return { ok: true, externalMessageId: parsed.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
