import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jarvisAdsTable = pgTable("jarvis_ads", {
  id: serial("id").primaryKey(),
  channel: varchar("channel", { length: 16 }).notNull().default("both"),
  audience: varchar("audience", { length: 64 }),
  industry: varchar("industry", { length: 64 }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  hashtags: text("hashtags"),
  cta: varchar("cta", { length: 200 }),
  imagePrompt: text("image_prompt"),
  status: varchar("status", { length: 16 }).notNull().default("pendiente"),
  source: varchar("source", { length: 32 }).notNull().default("auto"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const insertJarvisAdSchema = createInsertSchema(jarvisAdsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertJarvisAd = z.infer<typeof insertJarvisAdSchema>;
export type JarvisAd = typeof jarvisAdsTable.$inferSelect;
