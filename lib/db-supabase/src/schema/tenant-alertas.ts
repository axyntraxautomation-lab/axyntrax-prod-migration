import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantAlertasTable = pgTable(
  "tenant_alertas",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    tipo: varchar("tipo", { length: 64 }).notNull(),
    severidad: varchar("severidad", { length: 16 }).notNull().default("info"),
    titulo: text("titulo").notNull(),
    detalle: text("detalle"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    leida: boolean("leida").notNull().default(false),
    resueltaEn: timestamp("resuelta_en", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdIdx: index("tenant_alertas_tenant_idx").on(t.tenantId),
    tenantTipoIdx: index("tenant_alertas_tenant_tipo_idx").on(t.tenantId, t.tipo),
  }),
);

export type TenantAlerta = typeof tenantAlertasTable.$inferSelect;
export type InsertTenantAlerta = typeof tenantAlertasTable.$inferInsert;
