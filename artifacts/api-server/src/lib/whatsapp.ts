import { logger } from "./logger";

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v20.0";

export function whatsappOutboundReady(): boolean {
  return Boolean(PHONE_NUMBER_ID && TOKEN);
}

export interface WhatsappSendResult {
  ok: boolean;
  status: number;
  body: unknown;
  /** Meta message id (wamid.*) of the outbound message, if accepted. */
  externalMessageId: string | null;
}

/** Phone-number-id of the AXYNTRAX WhatsApp Business number. */
export function whatsappBusinessPhoneNumberId(): string | null {
  return PHONE_NUMBER_ID ?? null;
}

/**
 * Send a plain text WhatsApp message via Meta Cloud API.
 * `to` must be the wa_id (no leading +, only digits, e.g. "51991740590").
 */
export async function sendWhatsappText(
  to: string,
  text: string,
): Promise<WhatsappSendResult> {
  if (!whatsappOutboundReady()) {
    logger.warn("WhatsApp outbound not configured (missing token / phone id)");
    return { ok: false, status: 0, body: "not_configured", externalMessageId: null };
  }
  const cleanTo = to.replace(/\D+/g, "");
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: "text",
    text: { preview_url: false, body: text.slice(0, 4096) },
  };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    let body: unknown;
    try {
      body = await r.json();
    } catch {
      body = await r.text();
    }
    if (!r.ok) {
      logger.warn(
        { status: r.status, body, to: cleanTo },
        "WhatsApp outbound failed",
      );
    }
    let externalMessageId: string | null = null;
    if (
      r.ok &&
      body &&
      typeof body === "object" &&
      Array.isArray((body as { messages?: unknown }).messages)
    ) {
      const first = (body as { messages: Array<{ id?: unknown }> }).messages[0];
      if (first && typeof first.id === "string") externalMessageId = first.id;
    }
    return { ok: r.ok, status: r.status, body, externalMessageId };
  } catch (err) {
    logger.warn({ err, to: cleanTo }, "WhatsApp outbound threw");
    return { ok: false, status: 0, body: String(err), externalMessageId: null };
  }
}
