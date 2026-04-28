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

export const tenantInventarioTable = pgTable(
  "tenant_inventario",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 64 }),
    nombre: text("nombre").notNull(),
    categoria: varchar("categoria", { length: 64 }),
    cantidad: numeric("cantidad", { precision: 14, scale: 3 })
      .notNull()
      .default(sql`0`),
    unidad: varchar("unidad", { length: 16 }).notNull().default("unidad"),
    minimoAlerta: numeric("minimo_alerta", { precision: 14, scale: 3 })
      .notNull()
      .default(sql`0`),
    precioCosto: numeric("precio_costo", { precision: 12, scale: 2 }),
    precioVenta: numeric("precio_venta", { precision: 12, scale: 2 }),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_inventario_tenant_idx").on(t.tenantId),
    tenantSkuIdx: index("tenant_inventario_tenant_sku_idx").on(t.tenantId, t.sku),
  }),
);

export type TenantInventario = typeof tenantInventarioTable.$inferSelect;
export type InsertTenantInventario = typeof tenantInventarioTable.$inferInsert;
