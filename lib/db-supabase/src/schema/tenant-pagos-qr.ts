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

export const tenantPagosQrTable = pgTable(
  "tenant_pagos_qr",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    clienteFinalId: uuid("cliente_final_id").references(
      () => tenantClientesFinalesTable.id,
      { onDelete: "set null" },
    ),
    metodo: varchar("metodo", { length: 16 }).notNull(),
    monto: numeric("monto", { precision: 14, scale: 2 }).notNull(),
    moneda: varchar("moneda", { length: 8 }).notNull().default("PEN"),
    concepto: text("concepto"),
    qrDataUrl: text("qr_data_url"),
    estado: varchar("estado", { length: 16 }).notNull().default("pendiente"),
    confirmadoEn: timestamp("confirmado_en", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_pagos_qr_tenant_idx").on(t.tenantId),
    tenantEstadoIdx: index("tenant_pagos_qr_tenant_estado_idx").on(
      t.tenantId,
      t.estado,
    ),
  }),
);

export type TenantPagoQr = typeof tenantPagosQrTable.$inferSelect;
export type InsertTenantPagoQr = typeof tenantPagosQrTable.$inferInsert;
