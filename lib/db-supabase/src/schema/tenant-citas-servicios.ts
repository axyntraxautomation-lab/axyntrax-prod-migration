import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
import { tenantClientesFinalesTable } from "./tenant-clientes-finales";
import { tenantServiciosTable } from "./tenant-servicios";

export const tenantCitasServiciosTable = pgTable(
  "tenant_citas_servicios",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    clienteFinalId: uuid("cliente_final_id").references(
      () => tenantClientesFinalesTable.id,
      { onDelete: "set null" },
    ),
    servicioId: uuid("servicio_id").references(() => tenantServiciosTable.id, {
      onDelete: "set null",
    }),
    titulo: text("titulo"),
    fechaInicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
    fechaFin: timestamp("fecha_fin", { withTimezone: true }),
    estado: varchar("estado", { length: 32 }).notNull().default("agendada"),
    notas: text("notas"),
    recordatorioEnviado: varchar("recordatorio_enviado", { length: 8 })
      .notNull()
      .default("false"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_citas_servicios_tenant_idx").on(t.tenantId),
    tenantFechaIdx: index("tenant_citas_servicios_tenant_fecha_idx").on(
      t.tenantId,
      t.fechaInicio,
    ),
  }),
);

export type TenantCitaServicio = typeof tenantCitasServiciosTable.$inferSelect;
export type InsertTenantCitaServicio = typeof tenantCitasServiciosTable.$inferInsert;
