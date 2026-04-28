import { useTenantReady } from "@/providers/TenantProvider";

/**
 * Renderiza las alertas que el rubro define por defecto. Sirve de
 * preview mientras no haya inventario real cargado.
 */
export function StockAlertList() {
  const me = useTenantReady();
  const rubroId = me.tenant.rubroId;
  // Las alertas baseline se quedaron en `rubros_registry.alertas_default`,
  // pero el endpoint /tenant/me las omite para mantener payload pequeño.
  // Aquí derivamos un set genérico mostrando "vacío" por ahora.
  const sampleAlerts: { titulo: string; detalle: string; nivel: "info" | "warn" }[] = [
    { titulo: "Sin alertas activas", detalle: `Tu rubro ${rubroId} aún no tiene movimientos.`, nivel: "info" },
  ];
  return (
    <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Alertas</h3>
        <span className="text-[11px] text-gray-400">tiempo real</span>
      </header>
      <ul className="space-y-2">
        {sampleAlerts.map((a, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2"
          >
            <span
              aria-hidden
              className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
              style={{
                background:
                  a.nivel === "warn" ? "var(--color-secundario)" : "var(--color-primario)",
              }}
            />
            <div className="leading-tight">
              <div className="text-sm font-medium text-gray-800">{a.titulo}</div>
              <div className="text-xs text-gray-500">{a.detalle}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
