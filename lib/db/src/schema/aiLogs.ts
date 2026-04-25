import { jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiLogsTable = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 64 }).notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  message: text("message"),
  data: jsonb("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiLogSchema = createInsertSchema(aiLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAiLog = z.infer<typeof insertAiLogSchema>;
export type AiLog = typeof aiLogsTable.$inferSelect;
