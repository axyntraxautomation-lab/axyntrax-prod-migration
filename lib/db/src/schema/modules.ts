import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { paymentsTable } from "./payments";
import { usersTable } from "./users";

export const INDUSTRIES = [
  "medical",
  "legal",
  "dental",
  "veterinary",
  "condo",
  "otro",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const modulesCatalogTable = pgTable(
  "modules_catalog",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    industry: varchar("industry", { length: 32 }).notNull(),
    monthlyPrice: numeric("monthly_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    currency: varchar("currency", { length: 8 }).notNull().default("PEN"),
    active: integer("active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("modules_catalog_slug_idx").on(t.slug),
  }),
);

export const clientModulesTable = pgTable("client_modules", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  moduleId: integer("module_id")
    .notNull()
    .references(() => modulesCatalogTable.id, { onDelete: "restrict" }),
  status: varchar("status", { length: 24 }).notNull().default("pendiente"),
  requestedById: integer("requested_by_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  approvedById: integer("approved_by_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  paymentId: integer("payment_id").references(() => paymentsTable.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
});

export const insertModuleCatalogSchema = createInsertSchema(
  modulesCatalogTable,
).omit({ id: true, createdAt: true });
export type InsertModuleCatalog = z.infer<typeof insertModuleCatalogSchema>;
export type ModuleCatalog = typeof modulesCatalogTable.$inferSelect;

export const insertClientModuleSchema = createInsertSchema(
  clientModulesTable,
).omit({ id: true, requestedAt: true });
export type InsertClientModule = z.infer<typeof insertClientModuleSchema>;
export type ClientModule = typeof clientModulesTable.$inferSelect;
