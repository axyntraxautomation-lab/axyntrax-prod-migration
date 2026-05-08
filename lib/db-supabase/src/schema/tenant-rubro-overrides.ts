import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

/**
 * Overrides por tenant del rubro baseline. Si un tenant edita su catálogo,
 * agrega FAQs propias o reordena su onboarding, los cambios viven aquí
 * y rubros_registry queda intacto.
 */
export const tenantRubroOverridesTable = pgTable(
  "tenant_rubro_overrides",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    overrides: jsonb("overrides").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantUniqueIdx: uniqueIndex("tenant_rubro_overrides_tenant_uniq").on(t.tenantId),
    tenantIdIdx: index("tenant_rubro_overrides_tenant_idx").on(t.tenantId),
  }),
);

export type TenantRubroOverride = typeof tenantRubroOverridesTable.$inferSelect;
export type InsertTenantRubroOverride = typeof tenantRubroOverridesTable.$inferInsert;
