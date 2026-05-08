import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildRfc822(opts: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string | null;
  references?: string | null;
}): string {
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(opts.subject).toString("base64")}?=`;
  const headers = [
    `To: ${opts.to}`,
    `Subject: ${subjectEncoded}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ];
  if (opts.inReplyTo) headers.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) headers.push(`References: ${opts.references}`);
  return [...headers, "", opts.body].join("\r\n");
}

export interface GmailSendResult {
  ok: boolean;
  externalMessageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Send a Gmail message. When `threadId` is provided, Gmail groups the new
 * message into the existing thread — but Gmail also requires the Subject of
 * the new message to match the thread's Subject (with or without an "Re: "
 * prefix). Pass the original conversation subject unmodified for safest
 * threading.
 */
export async function sendGmail(opts: {
  to: string;
  subject: string;
  body: string;
  threadId?: string | null;
  inReplyTo?: string | null;
  references?: string | null;
}): Promise<GmailSendResult> {
  const raw = base64UrlEncode(
    buildRfc822({
      to: opts.to,
      subject: opts.subject,
      body: opts.body,
      inReplyTo: opts.inReplyTo ?? null,
      references: opts.references ?? null,
    }),
  );
  const payload: Record<string, unknown> = { raw };
  if (opts.threadId) payload.threadId = opts.threadId;
  try {
    const r = (await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )) as unknown as Response;
    const text = await r.text();
    if (!r.ok) {
      return {
        ok: false,
        error: `Gmail send HTTP ${r.status}: ${text.slice(0, 200)}`,
      };
    }
    let parsed: { id?: string; threadId?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // ignore — leave parsed empty
    }
    return {
      ok: true,
      externalMessageId: parsed.id,
      threadId: parsed.threadId,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
