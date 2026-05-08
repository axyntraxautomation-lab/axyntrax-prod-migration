import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const moduleUpdatesTable = pgTable("module_updates", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull().default("normal"),
  releaseNotes: text("release_notes").notNull(),
  publishedBy: integer("published_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientModuleUpdatesTable = pgTable("client_module_updates", {
  id: serial("id").primaryKey(),
  clientModuleId: integer("client_module_id").notNull(),
  updateId: integer("update_id").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  appliedAt: timestamp("applied_at"),
  notifiedAt: timestamp("notified_at").defaultNow().notNull(),
  meta: jsonb("meta"),
});

export type ModuleUpdate = typeof moduleUpdatesTable.$inferSelect;
export type NewModuleUpdate = typeof moduleUpdatesTable.$inferInsert;
export type ClientModuleUpdate = typeof clientModuleUpdatesTable.$inferSelect;
