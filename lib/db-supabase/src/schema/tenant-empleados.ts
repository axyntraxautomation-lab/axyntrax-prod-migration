import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantEmpleadosTable = pgTable(
  "tenant_empleados",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    rol: varchar("rol", { length: 64 }),
    color: varchar("color", { length: 16 }).notNull().default("#10b981"),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_empleados_tenant_idx").on(t.tenantId),
  }),
);

export type TenantEmpleado = typeof tenantEmpleadosTable.$inferSelect;
export type InsertTenantEmpleado = typeof tenantEmpleadosTable.$inferInsert;
