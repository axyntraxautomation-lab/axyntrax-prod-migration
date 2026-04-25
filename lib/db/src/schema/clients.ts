import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    firstName: varchar("first_name", { length: 120 }),
    lastName: varchar("last_name", { length: 120 }),
    company: text("company"),
    industry: varchar("industry", { length: 64 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    passwordHash: text("password_hash"),
    channel: varchar("channel", { length: 32 }).notNull().default("web"),
    stage: varchar("stage", { length: 32 }).notNull().default("prospecto"),
    score: integer("score").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    // Unique case-insensitive index. Allows multiple NULL emails (legacy CRM
    // contacts) but blocks duplicates and case-variant collisions.
    emailLowerUniqueIdx: uniqueIndex("clients_email_lower_uniq")
      .on(sql`lower(${t.email})`)
      .where(sql`${t.email} is not null`),
  }),
);

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
