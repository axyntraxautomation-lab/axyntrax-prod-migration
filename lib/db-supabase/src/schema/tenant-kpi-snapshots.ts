import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantKpiSnapshotsTable = pgTable(
  "tenant_kpi_snapshots",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    periodo: varchar("periodo", { length: 16 }).notNull(),
    fechaCorte: timestamp("fecha_corte", { withTimezone: true }).notNull(),
    kpis: jsonb("kpis").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantPeriodoFechaUniqueIdx: uniqueIndex(
      "tenant_kpi_snapshots_tenant_periodo_fecha_uniq",
    ).on(t.tenantId, t.periodo, t.fechaCorte),
    tenantIdIdx: index("tenant_kpi_snapshots_tenant_idx").on(t.tenantId),
  }),
);

export type TenantKpiSnapshot = typeof tenantKpiSnapshotsTable.$inferSelect;
export type InsertTenantKpiSnapshot = typeof tenantKpiSnapshotsTable.$inferInsert;
