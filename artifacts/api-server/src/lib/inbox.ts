import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  type Conversation,
  type Message,
} from "@workspace/db";

export type Channel =
  | "web"
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "gmail";

export const VALID_CHANNELS: Channel[] = [
  "web",
  "facebook",
  "instagram",
  "whatsapp",
  "gmail",
];

export const VALID_STATUSES = [
  "nuevo",
  "en_curso",
  "esperando",
  "resuelto",
  "archivado",
] as const;

export type Status = (typeof VALID_STATUSES)[number];

export interface IncomingMessage {
  channel: Channel;
  externalConversationId: string;
  externalMessageId: string | null;
  contactName: string | null;
  contactHandle: string | null;
  subject: string | null;
  content: string;
  mediaUrl?: string | null;
  sentAt?: Date;
}

/**
 * Verify Meta x-hub-signature-256 over the raw request body.
 * Returns false (and the route should 403) when no app secret is configured —
 * we never accept unsigned events on a signed-channel webhook.
 */
export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string | undefined,
): boolean {
  if (!appSecret) return false;
  if (!Buffer.isBuffer(rawBody)) return false;
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex"),
    );
  } catch {
    return false;
  }
}

function previewOf(content: string, n = 140): string {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
}

/**
 * Idempotently upsert a conversation by (channel, externalConversationId)
 * and append the inbound message. Atomic via a single transaction:
 *   1. Upsert conversation (no counter change yet).
 *   2. Try to insert the message; the unique index on
 *      (conversation_id, external_message_id) makes this idempotent.
 *   3. ONLY if the message was actually new, bump unreadCount, lastMessageAt,
 *      and lastMessagePreview. Replays leave conversation state untouched.
 */
export async function ingestInbound(
  msg: IncomingMessage,
): Promise<{ conversation: Conversation; message: Message | null }> {
  const sentAt = msg.sentAt ?? new Date();
  const preview = previewOf(msg.content);

  return db.transaction(async (tx) => {
    const [conv] = await tx
      .insert(conversationsTable)
      .values({
        channel: msg.channel,
        externalId: msg.externalConversationId,
        contactName: msg.contactName,
        contactHandle: msg.contactHandle,
        subject: msg.subject,
        status: "nuevo",
        unreadCount: 0,
        lastMessageAt: sentAt,
        lastMessagePreview: preview,
      })
      .onConflictDoUpdate({
        target: [conversationsTable.channel, conversationsTable.externalId],
        // Only fill metadata that was previously NULL — never overwrite
        // existing operator-edited values, and never bump counters here.
        set: {
          contactName: sql`COALESCE(${conversationsTable.contactName}, EXCLUDED.contact_name)`,
          contactHandle: sql`COALESCE(${conversationsTable.contactHandle}, EXCLUDED.contact_handle)`,
          subject: sql`COALESCE(${conversationsTable.subject}, EXCLUDED.subject)`,
        },
      })
      .returning();

    let message: Message | null = null;
    if (msg.externalMessageId) {
      const [inserted] = await tx
        .insert(messagesTable)
        .values({
          conversationId: conv.id,
          direction: "inbound",
          senderName: msg.contactName ?? msg.contactHandle ?? null,
          externalMessageId: msg.externalMessageId,
          content: msg.content,
          mediaUrl: msg.mediaUrl ?? null,
          status: "delivered",
          sentAt,
        })
        .onConflictDoNothing({
          target: [
            messagesTable.conversationId,
            messagesTable.externalMessageId,
          ],
        })
        .returning();
      message = inserted ?? null;
    } else {
      const [inserted] = await tx
        .insert(messagesTable)
        .values({
          conversationId: conv.id,
          direction: "inbound",
          senderName: msg.contactName ?? msg.contactHandle ?? null,
          externalMessageId: null,
          content: msg.content,
          mediaUrl: msg.mediaUrl ?? null,
          status: "delivered",
          sentAt,
        })
        .returning();
      message = inserted ?? null;
    }

    if (message) {
      const [updated] = await tx
        .update(conversationsTable)
        .set({
          unreadCount: sql`${conversationsTable.unreadCount} + 1`,
          lastMessageAt: sentAt,
          lastMessagePreview: preview,
          status: sql`CASE WHEN ${conversationsTable.status} = 'archivado' THEN 'nuevo' ELSE ${conversationsTable.status} END`,
        })
        .where(eq(conversationsTable.id, conv.id))
        .returning();
      return { conversation: updated ?? conv, message };
    }
    return { conversation: conv, message: null };
  });
}
