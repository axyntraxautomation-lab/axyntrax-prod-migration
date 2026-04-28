import { useTenantReady } from "@/providers/TenantProvider";

/**
 * Grid de KPIs adaptados al rubro. Mientras el tenant no carga datos
 * reales, muestra el nombre del KPI y el placeholder "—" para que sepa
 * qué números va a ver cuando empiece a operar.
 */
export function KpiTileGrid() {
  const me = useTenantReady();
  const kpis = me.rubro?.kpis ?? [];
  if (kpis.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="kpis-title" className="mt-4">
      <h2 id="kpis-title" className="sr-only">
        Indicadores clave
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {kpis.slice(0, 4).map((kpi) => (
          <div
            key={kpi}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primario) 12%, #e5e7eb)",
            }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              {kpi}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: "var(--color-primario)" }}
              >
                —
              </span>
              <span className="text-xs text-gray-400">aún sin datos</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
