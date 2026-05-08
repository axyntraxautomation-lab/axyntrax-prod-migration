import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

/**
 * One conversation thread per (channel, externalId).
 * `message`/`reply` are LEGACY columns kept nullable for backward compatibility
 * with FASE 1 seed rows. New writes go to `messagesTable`.
 */
export const conversationsTable = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").references(() => clientsTable.id, {
      onDelete: "set null",
    }),
    assignedAgentId: integer("assigned_agent_id").references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
    channel: varchar("channel", { length: 32 }).notNull(),
    externalId: varchar("external_id", { length: 256 }),
    contactName: varchar("contact_name", { length: 128 }),
    contactHandle: varchar("contact_handle", { length: 256 }),
    subject: varchar("subject", { length: 256 }),
    label: varchar("label", { length: 64 }),
    status: varchar("status", { length: 32 }).notNull().default("nuevo"),
    unreadCount: integer("unread_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastMessagePreview: text("last_message_preview"),
    // legacy columns (FASE 1)
    message: text("message"),
    reply: text("reply"),
    agent: varchar("agent", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("conversations_channel_external_idx").on(
      t.channel,
      t.externalId,
    ),
    index("conversations_status_idx").on(t.status),
    index("conversations_last_message_idx").on(t.lastMessageAt),
  ],
);

export const insertConversationSchema = createInsertSchema(
  conversationsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
