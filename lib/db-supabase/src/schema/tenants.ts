import { sql } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { rubrosRegistryTable } from "./rubros-registry";

export const tenantsTable = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar("slug", { length: 64 }).notNull(),
    nombreEmpresa: text("nombre_empresa").notNull(),
    rubroId: varchar("rubro_id", { length: 64 })
      .notNull()
      .references(() => rubrosRegistryTable.rubroId, { onUpdate: "cascade" }),
    ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
    ownerName: text("owner_name"),
    moneda: varchar("moneda", { length: 8 }).notNull().default("PEN"),
    timezone: varchar("timezone", { length: 64 }).notNull().default("America/Lima"),
    plan: varchar("plan", { length: 32 }).notNull().default("trial"),
    status: varchar("status", { length: 32 }).notNull().default("activo"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    slugUniqueIdx: uniqueIndex("tenants_slug_uniq").on(t.slug),
    ownerEmailLowerUniqueIdx: uniqueIndex("tenants_owner_email_lower_uniq").on(
      sql`lower(${t.ownerEmail})`,
    ),
  }),
);

export type Tenant = typeof tenantsTable.$inferSelect;
export type InsertTenant = typeof tenantsTable.$inferInsert;
