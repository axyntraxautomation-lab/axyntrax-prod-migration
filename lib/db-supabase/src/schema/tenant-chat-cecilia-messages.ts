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

export const tenantChatCeciliaMessagesTable = pgTable(
  "tenant_chat_cecilia_messages",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id"),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdIdx: index("tenant_chat_cecilia_msgs_tenant_idx").on(t.tenantId),
    tenantConvIdx: index("tenant_chat_cecilia_msgs_tenant_conv_idx").on(
      t.tenantId,
      t.conversationId,
    ),
  }),
);

export type TenantChatCeciliaMessage =
  typeof tenantChatCeciliaMessagesTable.$inferSelect;
export type InsertTenantChatCeciliaMessage =
  typeof tenantChatCeciliaMessagesTable.$inferInsert;
