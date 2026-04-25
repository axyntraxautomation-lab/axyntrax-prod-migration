import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  channel: varchar("channel", { length: 32 }).notNull(),
  externalId: varchar("external_id", { length: 128 }),
  message: text("message").notNull(),
  reply: text("reply"),
  agent: varchar("agent", { length: 64 }),
  label: varchar("label", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull().default("nuevo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
