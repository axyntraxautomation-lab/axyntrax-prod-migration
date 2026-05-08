import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { modulesCatalogTable } from "./modules";

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 16 }).notNull().default("enviada"),
  currency: varchar("currency", { length: 8 }).notNull().default("PEN"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  igv: numeric("igv", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  pdfPath: varchar("pdf_path", { length: 256 }),
  notes: text("notes"),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const quoteItemsTable = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => quotesTable.id, { onDelete: "cascade" }),
  moduleId: integer("module_id")
    .notNull()
    .references(() => modulesCatalogTable.id, { onDelete: "restrict" }),
  moduleName: varchar("module_name", { length: 128 }).notNull(),
  qty: integer("qty").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
});

export type Quote = typeof quotesTable.$inferSelect;
export type QuoteItem = typeof quoteItemsTable.$inferSelect;
