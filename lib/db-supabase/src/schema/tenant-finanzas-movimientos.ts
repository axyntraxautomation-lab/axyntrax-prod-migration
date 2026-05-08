import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
import { tenantClientesFinalesTable } from "./tenant-clientes-finales";

export const tenantFinanzasMovimientosTable = pgTable(
  "tenant_finanzas_movimientos",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    clienteFinalId: uuid("cliente_final_id").references(
      () => tenantClientesFinalesTable.id,
      { onDelete: "set null" },
    ),
    tipo: varchar("tipo", { length: 16 }).notNull(),
    concepto: text("concepto"),
    monto: numeric("monto", { precision: 14, scale: 2 }).notNull(),
    moneda: varchar("moneda", { length: 8 }).notNull().default("PEN"),
    metodoPago: varchar("metodo_pago", { length: 16 }).notNull().default("efectivo"),
    estado: varchar("estado", { length: 16 }).notNull().default("confirmado"),
    fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_finanzas_mov_tenant_idx").on(t.tenantId),
    tenantFechaIdx: index("tenant_finanzas_mov_tenant_fecha_idx").on(
      t.tenantId,
      t.fecha,
    ),
  }),
);

export type TenantFinanzasMovimiento =
  typeof tenantFinanzasMovimientosTable.$inferSelect;
export type InsertTenantFinanzasMovimiento =
  typeof tenantFinanzasMovimientosTable.$inferInsert;
