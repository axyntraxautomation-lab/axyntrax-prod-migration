import { sql } from "drizzle-orm";
import { getSupabaseDb, getSupabasePool } from "../index";
import { rubrosRegistryTable } from "../schema/rubros-registry";
import { RUBROS_BASELINE } from "./rubros";

async function main(): Promise<void> {
  const db = getSupabaseDb();

  console.log(`[seed] inserting/updating ${RUBROS_BASELINE.length} rubros baseline`);
  for (const r of RUBROS_BASELINE) {
    await db
      .insert(rubrosRegistryTable)
      .values({
        rubroId: r.rubroId,
        nombre: r.nombre,
        cecilia_persona: r.cecilia_persona,
        modulos: r.modulos,
        terminologia: r.terminologia,
        alertas_default: r.alertas_default,
        kpis: r.kpis,
        onboarding_steps: r.onboarding_steps,
        catalogo_sugerido: r.catalogo_sugerido,
        faqs: r.faqs,
        activo: true,
      })
      .onConflictDoUpdate({
        target: rubrosRegistryTable.rubroId,
        set: {
          nombre: r.nombre,
          cecilia_persona: r.cecilia_persona,
          modulos: r.modulos,
          terminologia: r.terminologia,
          alertas_default: r.alertas_default,
          kpis: r.kpis,
          onboarding_steps: r.onboarding_steps,
          catalogo_sugerido: r.catalogo_sugerido,
          faqs: r.faqs,
          activo: true,
          updatedAt: sql`now()`,
        },
      });
    console.log(`[seed]   ✓ ${r.rubroId} (${r.nombre})`);
  }

  const count = await db.select({ c: sql<number>`count(*)::int` }).from(rubrosRegistryTable);
  console.log(`[seed] rubros_registry total rows: ${count[0]?.c ?? 0}`);

  await getSupabasePool().end();
}

main().catch((err) => {
  console.error("[seed] FAILED:", err);
  process.exit(1);
});
