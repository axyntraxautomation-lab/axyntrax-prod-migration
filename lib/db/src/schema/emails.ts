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

export const emailsTable = pgTable("emails", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  direction: varchar("direction", { length: 16 }).notNull().default("inbound"),
  category: varchar("category", { length: 32 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmailSchema = createInsertSchema(emailsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emailsTable.$inferSelect;
