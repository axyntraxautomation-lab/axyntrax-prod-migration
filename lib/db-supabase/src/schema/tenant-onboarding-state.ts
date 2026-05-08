import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantOnboardingStateTable = pgTable(
  "tenant_onboarding_state",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    currentStep: integer("current_step").notNull().default(0),
    totalSteps: integer("total_steps").notNull().default(0),
    completados: jsonb("completados").notNull().default(sql`'[]'::jsonb`),
    estado: varchar("estado", { length: 32 }).notNull().default("en_progreso"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tenantUniqueIdx: uniqueIndex("tenant_onboarding_state_tenant_uniq").on(t.tenantId),
  }),
);

export type TenantOnboardingState = typeof tenantOnboardingStateTable.$inferSelect;
export type InsertTenantOnboardingState =
  typeof tenantOnboardingStateTable.$inferInsert;
