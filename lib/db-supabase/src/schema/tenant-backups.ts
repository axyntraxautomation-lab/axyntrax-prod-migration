import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantBackupsTable = pgTable(
  "tenant_backups",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    destino: varchar("destino", { length: 32 }).notNull().default("google_drive"),
    fileId: text("file_id"),
    fileUrl: text("file_url"),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    estado: varchar("estado", { length: 32 }).notNull().default("pendiente"),
    error: text("error"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdIdx: index("tenant_backups_tenant_idx").on(t.tenantId),
    tenantFechaIdx: index("tenant_backups_tenant_fecha_idx").on(
      t.tenantId,
      t.createdAt,
    ),
  }),
);

export type TenantBackup = typeof tenantBackupsTable.$inferSelect;
export type InsertTenantBackup = typeof tenantBackupsTable.$inferInsert;
