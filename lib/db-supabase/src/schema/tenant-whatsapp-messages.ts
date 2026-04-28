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
import { tenantWhatsappSessionsTable } from "./tenant-whatsapp-sessions";

export const tenantWhatsappMessagesTable = pgTable(
  "tenant_whatsapp_messages",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => tenantWhatsappSessionsTable.id, {
      onDelete: "set null",
    }),
    direccion: varchar("direccion", { length: 16 }).notNull(),
    fromNumber: varchar("from_number", { length: 32 }),
    toNumber: varchar("to_number", { length: 32 }),
    tipo: varchar("tipo", { length: 32 }).notNull().default("text"),
    body: text("body"),
    mediaUrl: text("media_url"),
    estado: varchar("estado", { length: 32 }).notNull().default("recibido"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdIdx: index("tenant_whatsapp_messages_tenant_idx").on(t.tenantId),
    tenantFechaIdx: index("tenant_whatsapp_messages_tenant_fecha_idx").on(
      t.tenantId,
      t.createdAt,
    ),
  }),
);

export type TenantWhatsappMessage = typeof tenantWhatsappMessagesTable.$inferSelect;
export type InsertTenantWhatsappMessage =
  typeof tenantWhatsappMessagesTable.$inferInsert;
