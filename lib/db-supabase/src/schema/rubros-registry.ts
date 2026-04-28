import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

/**
 * Catálogo central de rubros baseline (Módulo 0 + Módulo 4 del spec).
 * Cada fila es un rubro disponible que un tenant puede elegir al hacer signup.
 * Los arrays jsonb (modulos, alertas_default, kpis, onboarding_steps,
 * catalogo_sugerido, faqs) se cargan en el seed inicial y el tenant puede
 * sobreescribirlos por instancia mediante tenant_rubro_overrides.
 */
export const rubrosRegistryTable = pgTable(
  "rubros_registry",
  {
    rubroId: varchar("rubro_id", { length: 64 }).primaryKey(),
    nombre: text("nombre").notNull(),
    cecilia_persona: text("cecilia_persona").notNull(),
    modulos: jsonb("modulos").notNull().default(sql`'[]'::jsonb`),
    terminologia: jsonb("terminologia").notNull().default(sql`'[]'::jsonb`),
    alertas_default: jsonb("alertas_default").notNull().default(sql`'[]'::jsonb`),
    kpis: jsonb("kpis").notNull().default(sql`'[]'::jsonb`),
    onboarding_steps: jsonb("onboarding_steps").notNull().default(sql`'[]'::jsonb`),
    catalogo_sugerido: jsonb("catalogo_sugerido").notNull().default(sql`'[]'::jsonb`),
    faqs: jsonb("faqs").notNull().default(sql`'[]'::jsonb`),
    activo: varchar("activo", { length: 8 }).notNull().default("true"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    nombreIdx: uniqueIndex("rubros_registry_nombre_uniq").on(t.nombre),
  }),
);

export type RubroRegistry = typeof rubrosRegistryTable.$inferSelect;
export type InsertRubroRegistry = typeof rubrosRegistryTable.$inferInsert;
