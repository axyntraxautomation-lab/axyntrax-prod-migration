import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const moduleEventsTable = pgTable("module_events", {
  id: serial("id").primaryKey(),
  clientModuleId: integer("client_module_id").notNull(),
  clientId: integer("client_id").notNull(),
  moduleId: integer("module_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull().default("info"),
  message: text("message"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ModuleEvent = typeof moduleEventsTable.$inferSelect;
export type NewModuleEvent = typeof moduleEventsTable.$inferInsert;
