import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { conversationsTable } from "./conversations";
import { usersTable } from "./users";

/**
 * Per-conversation messages, ordered by sentAt.
 * `direction`:
 *   - "inbound"  = from the customer (came in via webhook)
 *   - "outbound" = sent by an agent or by AXYN CORE
 *   - "system"   = automated note (assignment, status change, link, etc.)
 */
export const messagesTable = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    direction: varchar("direction", { length: 16 }).notNull(),
    senderUserId: integer("sender_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    senderName: varchar("sender_name", { length: 128 }),
    externalMessageId: varchar("external_message_id", { length: 256 }),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    status: varchar("status", { length: 32 }).notNull().default("delivered"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId, t.sentAt),
    uniqueIndex("messages_conversation_external_idx").on(
      t.conversationId,
      t.externalMessageId,
    ),
  ],
);

export const insertMessageSchema = createInsertSchema(messagesTable).omit({
  id: true,
  sentAt: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
