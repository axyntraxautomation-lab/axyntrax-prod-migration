import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantFaqOverridesTable = pgTable(
  "tenant_faq_overrides",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    pregunta: text("pregunta").notNull(),
    respuesta: text("respuesta").notNull(),
    categoria: varchar("categoria", { length: 64 }),
    orden: integer("orden").notNull().default(0),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_faq_overrides_tenant_idx").on(t.tenantId),
  }),
);

export type TenantFaqOverride = typeof tenantFaqOverridesTable.$inferSelect;
export type InsertTenantFaqOverride = typeof tenantFaqOverridesTable.$inferInsert;
