import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantServiciosTable = pgTable(
  "tenant_servicios",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    // tipo: 'servicio' (lavado, corte de pelo, consulta), 'producto' (insumo
    // vendible) o 'menu_item' (plato/bebida en restaurantes). Default
    // 'servicio' para que el cambio sea retro-compatible.
    tipo: varchar("tipo", { length: 16 }).notNull().default("servicio"),
    categoria: varchar("categoria", { length: 64 }),
    precio: numeric("precio", { precision: 12, scale: 2 }).notNull().default(sql`0`),
    moneda: varchar("moneda", { length: 8 }).notNull().default("PEN"),
    duracionMinutos: integer("duracion_minutos"),
    activo: boolean("activo").notNull().default(true),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_servicios_tenant_idx").on(t.tenantId),
  }),
);

export type TenantServicio = typeof tenantServiciosTable.$inferSelect;
export type InsertTenantServicio = typeof tenantServiciosTable.$inferInsert;
