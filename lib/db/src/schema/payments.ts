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
import { licensesTable } from "./licenses";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  licenseId: integer("license_id").references(() => licensesTable.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("PEN"),
  method: varchar("method", { length: 32 }).notNull().default("culqi"),
  status: varchar("status", { length: 32 }).notNull().default("pendiente"),
  reference: varchar("reference", { length: 128 }),
  externalId: varchar("external_id", { length: 128 }),
  description: text("description"),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
