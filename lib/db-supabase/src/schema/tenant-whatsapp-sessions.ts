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

export const tenantWhatsappSessionsTable = pgTable(
  "tenant_whatsapp_sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull().default("whatsapp-web"),
    phoneNumber: varchar("phone_number", { length: 32 }),
    sessionData: text("session_data"),
    qrCode: text("qr_code"),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantProviderIdx: uniqueIndex("tenant_whatsapp_sessions_tenant_provider_uniq").on(
      t.tenantId,
      t.provider,
    ),
    tenantIdIdx: index("tenant_whatsapp_sessions_tenant_idx").on(t.tenantId),
  }),
);

export type TenantWhatsappSession = typeof tenantWhatsappSessionsTable.$inferSelect;
export type InsertTenantWhatsappSession =
  typeof tenantWhatsappSessionsTable.$inferInsert;
