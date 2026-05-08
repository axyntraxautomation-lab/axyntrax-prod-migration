import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantBrandingTable = pgTable(
  "tenant_branding",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    logoUrl: text("logo_url"),
    colorPrimario: varchar("color_primario", { length: 16 }).notNull().default("#06B6D4"),
    colorSecundario: varchar("color_secundario", { length: 16 })
      .notNull()
      .default("#7C3AED"),
    colorFondo: varchar("color_fondo", { length: 16 }).notNull().default("#0B1020"),
    fontDisplay: varchar("font_display", { length: 64 }).notNull().default("Space Grotesk"),
    fontMono: varchar("font_mono", { length: 64 }).notNull().default("JetBrains Mono"),
    welcomeText: text("welcome_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantUniqueIdx: uniqueIndex("tenant_branding_tenant_uniq").on(t.tenantId),
  }),
);

export type TenantBranding = typeof tenantBrandingTable.$inferSelect;
export type InsertTenantBranding = typeof tenantBrandingTable.$inferInsert;
