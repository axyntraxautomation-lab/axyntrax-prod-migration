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
import { usersTable } from "./users";

export const gmailTemplatesTable = pgTable("gmail_templates", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  subject: text("subject"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertGmailTemplateSchema = createInsertSchema(
  gmailTemplatesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGmailTemplate = z.infer<typeof insertGmailTemplateSchema>;
export type GmailTemplate = typeof gmailTemplatesTable.$inferSelect;
