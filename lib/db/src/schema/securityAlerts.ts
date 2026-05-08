import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const securityAlertsTable = pgTable("security_alerts", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull().default("warning"),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
  path: varchar("path", { length: 256 }),
  message: text("message").notNull(),
  meta: jsonb("meta"),
  ackBy: integer("ack_by"),
  ackAt: timestamp("ack_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ipBlocklistTable = pgTable("ip_blocklist", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull().unique(),
  reason: varchar("reason", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lockdownStateTable = pgTable("lockdown_state", {
  id: serial("id").primaryKey(),
  active: integer("active").notNull().default(0),
  reason: text("reason"),
  enabledBy: integer("enabled_by"),
  enabledAt: timestamp("enabled_at"),
  disabledAt: timestamp("disabled_at"),
});

export type SecurityAlert = typeof securityAlertsTable.$inferSelect;
export type NewSecurityAlert = typeof securityAlertsTable.$inferInsert;
export type IpBlock = typeof ipBlocklistTable.$inferSelect;
export type LockdownState = typeof lockdownStateTable.$inferSelect;
