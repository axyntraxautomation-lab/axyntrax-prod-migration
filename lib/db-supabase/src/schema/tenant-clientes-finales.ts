import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

// telefono es ciphertext AES-GCM (puede superar 32 chars). telefono_hash
// es un HMAC-SHA256 hex (64 chars) del E.164 normalizado del teléfono y
// se usa para búsquedas exactas + uniqueness.
export const tenantClientesFinalesTable = pgTable(
  "tenant_clientes_finales",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    telefono: text("telefono"),
    telefonoHash: varchar("telefono_hash", { length: 64 }),
    email: varchar("email", { length: 255 }),
    documentoTipo: varchar("documento_tipo", { length: 16 }),
    documentoNumero: varchar("documento_numero", { length: 32 }),
    rubroData: jsonb("rubro_data").notNull().default(sql`'{}'::jsonb`),
    historial: jsonb("historial").notNull().default(sql`'[]'::jsonb`),
    notas: text("notas"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantIdIdx: index("tenant_clientes_finales_tenant_idx").on(t.tenantId),
    tenantTelefonoHashUniqueIdx: uniqueIndex(
      "tenant_clientes_finales_tenant_telhash_uniq",
    )
      .on(t.tenantId, t.telefonoHash)
      .where(sql`${t.telefonoHash} is not null`),
  }),
);

export type TenantClienteFinal = typeof tenantClientesFinalesTable.$inferSelect;
export type InsertTenantClienteFinal = typeof tenantClientesFinalesTable.$inferInsert;
