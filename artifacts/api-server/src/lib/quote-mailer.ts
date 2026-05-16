import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function chunk76(s: string): string {
  return s.replace(/(.{76})/g, "$1\r\n");
}

export interface SendQuoteEmailInput {
  to: string;
  subject: string;
  bodyText: string;
  pdf: Buffer;
  pdfFilename: string;
}

export interface SendQuoteEmailResult {
  ok: boolean;
  externalMessageId?: string;
  error?: string;
}

/**
 * Send a quote email with the PDF attached as a multipart/mixed Gmail
 * message. Uses the Replit google-mail connector.
 */
export async function sendQuoteEmail(
  input: SendQuoteEmailInput,
): Promise<SendQuoteEmailResult> {
  const boundary = `axyn_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;

  const subjectEnc = `=?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`;
  const pdfB64 = chunk76(input.pdf.toString("base64"));

  const mime = [
    `To: ${input.to}`,
    `Subject: ${subjectEnc}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    input.bodyText,
    "",
    `--${boundary}`,
    "Content-Type: application/pdf",
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${input.pdfFilename}"`,
    "",
    pdfB64,
    `--${boundary}--`,
    "",
  ].join("\r\n");

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
