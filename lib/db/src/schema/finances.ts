import {
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financesTable = pgTable("finances", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 16 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }),
  description: text("description"),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFinanceSchema = createInsertSchema(financesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFinance = z.infer<typeof insertFinanceSchema>;
export type Finance = typeof financesTable.$inferSelect;
