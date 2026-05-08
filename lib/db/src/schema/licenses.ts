import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const licensesTable = pgTable("licenses", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 32 }).notNull(),
  module: varchar("module", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull().default("activa"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 8 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertLicenseSchema = createInsertSchema(licensesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licensesTable.$inferSelect;
