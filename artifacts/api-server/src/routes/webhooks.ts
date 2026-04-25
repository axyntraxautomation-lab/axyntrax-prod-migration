import { Router, type IRouter, type Request } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, messagesTable } from "@workspace/db";
import { ingestInbound, verifyMetaSignature } from "../lib/inbox";
import { logger } from "../lib/logger";
import {
  sendWhatsappText,
  whatsappBusinessPhoneNumberId,
  whatsappOutboundReady,
} from "../lib/whatsapp";
import { runJarvisText } from "./sales-bot";

function getRawBody(req: Request): Buffer {
  const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
  return Buffer.isBuffer(raw) ? raw : Buffer.alloc(0);
}

const router: IRouter = Router();

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_APP_SECRET = process.env.META_APP_SECRET;
const WHATSAPP_VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN ?? META_VERIFY_TOKEN;
const WHATSAPP_APP_SECRET =
  process.env.WHATSAPP_APP_SECRET ?? META_APP_SECRET;
const WEB_FORM_TOKEN = process.env.WEB_FORM_TOKEN;

// ---- Web form ingress ------------------------------------------------------
router.post("/webhooks/web", async (req, res) => {
  if (!WEB_FORM_TOKEN) {
    res.status(503).json({
      error: "WEB_FORM_TOKEN not configured on the server",
    });
    return;
  }
  const auth = req.header("authorization") ?? "";
  if (auth !== `Bearer ${WEB_FORM_TOKEN}`) {
    res.status(401).json({ error: "Invalid bearer token" });
    return;
  }
  const body = req.body ?? {};
  const externalId =
    typeof body.externalId === "string"
      ? body.externalId
      : `web-${body.email ?? body.handle ?? body.contactHandle ?? "anon"}`;
  const content = String(body.content ?? body.message ?? "").trim();
  if (!content) {
    res.status(400).json({ error: "content required" });
    return;
  }
  const result = await ingestInbound({
    channel: "web",
    externalConversationId: externalId,
    externalMessageId:
      typeof body.externalMessageId === "string"
        ? body.externalMessageId
        : null,
    contactName: body.name ?? body.contactName ?? null,
    contactHandle: body.email ?? body.contactHandle ?? null,
    subject: body.subject ?? null,
    content,
  });
  res.status(201).json({
    conversationId: result.conversation.id,
    messageId: result.message?.id ?? null,
  });
});

// ---- Meta (Facebook Messenger + Instagram DM) ------------------------------
// Meta sends GET for webhook verification, POST for events.

router.get("/webhooks/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (
    mode === "subscribe" &&
    META_VERIFY_TOKEN &&
    token === META_VERIFY_TOKEN
  ) {
    res.status(200).send(String(challenge ?? ""));
    return;
  }
  res.sendStatus(403);
});

router.post("/webhooks/meta", async (req, res) => {
  const rawBody = getRawBody(req);
  if (
    !verifyMetaSignature(
      rawBody,
      req.header("x-hub-signature-256"),
      META_APP_SECRET,
    )
  ) {
    res.sendStatus(403);
    return;
  }
  const payload = req.body ?? {};
  // Meta indicates the channel via the top-level `object` field; we must NOT
  // infer it from the presence of `entry.changes` (Messenger payloads can
  // contain changes too).
  const channel: "facebook" | "instagram" =
    payload?.object === "instagram" ? "instagram" : "facebook";
  try {
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    for (const entry of entries) {
      const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];
      for (const m of messaging) {
        const senderId = m?.sender?.id ?? "unknown";
        const text = m?.message?.text ?? null;
        if (!text) continue;
        await ingestInbound({
          channel,
          externalConversationId: `${channel}:${senderId}`,
          externalMessageId: m?.message?.mid ?? null,
          contactName: null,
          contactHandle: senderId,
          subject: null,
          content: text,
          sentAt: m?.timestamp ? new Date(Number(m.timestamp)) : undefined,
        });
      }
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const c of changes) {
        const v = c?.value;
        if (v?.from?.id && v?.text) {
          await ingestInbound({
            channel: channel === "instagram" ? "instagram" : "facebook",
            externalConversationId: `${channel}:${v.from.id}`,
            externalMessageId: v?.id ?? null,
            contactName: v?.from?.username ?? null,
            contactHandle: v.from.id,
            subject: null,
            content: String(v.text),
          });
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, "Meta webhook ingest failed");
  }
  res.sendStatus(200);
});

// ---- JARVIS auto-reply for inbound WhatsApp --------------------------------

const HISTORY_LIMIT = 8;

async function jarvisAutoReplyWhatsapp(args: {
  conversationId: number;
  wa: string;
  contactName: string | null;
  inboundText: string;
}): Promise<void> {
  if (!whatsappOutboundReady()) {
    logger.warn(
      { wa: args.wa },
      "WhatsApp inbound received but outbound not configured; skipping auto-reply",
    );
    return;
  }
  try {
    const recent = await db
      .select({
        direction: messagesTable.direction,
        content: messagesTable.content,
        sentAt: messagesTable.sentAt,
      })
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, args.conversationId))
      .orderBy(desc(messagesTable.sentAt))
      .limit(HISTORY_LIMIT + 1);

    const ordered = recent.reverse();
    const history = ordered
      .filter(
        (m) =>
          (m.direction === "inbound" || m.direction === "outbound") &&
          m.content !== args.inboundText,
      )
      .map((m) => ({
        role: m.direction === "outbound" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

    const reply = await runJarvisText(
      args.inboundText,
      history,
      "whatsapp",
      args.contactName ? `${args.contactName} (wa:${args.wa})` : `wa:${args.wa}`,
    );

    const send = await sendWhatsappText(args.wa, reply);
    await db.insert(messagesTable).values({
      conversationId: args.conversationId,
      direction: "outbound",
      senderName: "JARVIS",
      content: reply,
      status: send.ok ? "sent" : "failed",
      errorMessage: send.ok ? null : `whatsapp_${send.status}`,
      externalMessageId: send.externalMessageId,
    });
  } catch (err) {
    logger.warn({ err, wa: args.wa }, "JARVIS WhatsApp auto-reply failed");
  }
}

/** Reconcile Meta delivery status callbacks against our outbound messages. */
async function applyWhatsappStatusUpdate(s: unknown): Promise<void> {
  if (!s || typeof s !== "object") return;
  const obj = s as { id?: unknown; status?: unknown; errors?: unknown };
  const id = typeof obj.id === "string" ? obj.id : null;
  const status = typeof obj.status === "string" ? obj.status : null;
  if (!id || !status) return;
  const errMsg = Array.isArray(obj.errors)
    ? (obj.errors[0] as { title?: unknown; message?: unknown } | undefined)
    : undefined;
  const errorMessage =
    status === "failed" && errMsg
      ? String(
          (errMsg.message as string | undefined) ??
            (errMsg.title as string | undefined) ??
            "failed",
        )
      : null;
  try {
    await db
      .update(messagesTable)
      .set({ status, errorMessage })
      .where(
        and(
          eq(messagesTable.externalMessageId, id),
          eq(messagesTable.direction, "outbound"),
        ),
      );
  } catch (err) {
    logger.warn({ err, id, status }, "WhatsApp status reconcile failed");
  }
}

// ---- WhatsApp Cloud API ----------------------------------------------------

router.get("/webhooks/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (
    mode === "subscribe" &&
    WHATSAPP_VERIFY_TOKEN &&
    token === WHATSAPP_VERIFY_TOKEN
  ) {
    res.status(200).send(String(challenge ?? ""));
    return;
  }
  res.sendStatus(403);
});

router.post("/webhooks/whatsapp", async (req, res) => {
  const rawBody = getRawBody(req);
  if (
    !verifyMetaSignature(
      rawBody,
      req.header("x-hub-signature-256"),
      WHATSAPP_APP_SECRET,
    )
  ) {
    res.sendStatus(403);
    return;
  }
  const payload = req.body ?? {};
  try {
      const entries = Array.isArray(payload?.entry) ? payload.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const c of changes) {
          const v = c?.value;
          const contacts = Array.isArray(v?.contacts) ? v.contacts : [];
          const messages = Array.isArray(v?.messages) ? v.messages : [];
          const contactByWaId = new Map<string, any>();
          for (const ct of contacts) {
            if (ct?.wa_id) contactByWaId.set(ct.wa_id, ct);
          }
          // Outbound delivery status callbacks from Meta (sent/delivered/read/failed).
          const statuses = Array.isArray(v?.statuses) ? v.statuses : [];
          for (const s of statuses) {
            void applyWhatsappStatusUpdate(s);
          }
          const businessPhoneId = whatsappBusinessPhoneNumberId();
          for (const m of messages) {
            const wa = m?.from;
            if (!wa) continue;
            // Defensive: ignore events that look like our own outbound (echo).
            if (businessPhoneId && wa === businessPhoneId) continue;
            const isText = typeof m?.text?.body === "string";
            const text = isText
              ? m.text.body
              : m?.type === "image"
                ? "[imagen recibida]"
                : m?.type === "audio"
                  ? "[audio recibido]"
                  : m?.type === "document"
                    ? "[documento recibido]"
                    : null;
            if (!text) continue;
            const contact = contactByWaId.get(wa);
            const ingest = await ingestInbound({
              channel: "whatsapp",
              externalConversationId: `whatsapp:${wa}`,
              externalMessageId: m?.id ?? null,
              contactName: contact?.profile?.name ?? null,
              contactHandle: wa,
              subject: null,
              content: text,
              sentAt: m?.timestamp
                ? new Date(Number(m.timestamp) * 1000)
                : undefined,
            });
            // Only auto-reply when:
            //   - it's a text message (don't try to answer images/audio yet)
            //   - Meta provided a stable message id (so retries dedupe in inbox)
            //   - ingestInbound actually inserted the inbound row (avoids
            //     replying twice if Meta retries a previously-seen id).
            if (isText && typeof m?.id === "string" && ingest.message) {
              // Fire-and-forget so Meta gets a fast 200.
              void jarvisAutoReplyWhatsapp({
                conversationId: ingest.conversation.id,
                wa,
                contactName: contact?.profile?.name ?? null,
                inboundText: text,
              });
            }
          }
        }
      }
  } catch (err) {
    logger.warn({ err }, "WhatsApp webhook ingest failed");
  }
  res.sendStatus(200);
});

export default router;
