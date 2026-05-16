import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, type InventarioItem } from "@/lib/api";
import { useRealtimeRefetch } from "@/hooks/useRealtimeBus";

const STOCK_THRESHOLD = 0.2; // 20%

function ratio(it: InventarioItem): number {
  const m = Number(it.minimoAlerta);
  if (m <= 0) return 1;
  return Number(it.cantidad) / m;
}
function isCritical(it: InventarioItem): boolean {
  return ratio(it) < STOCK_THRESHOLD;
}

/**
 * Lista resumida de alertas de stock, leyendo el inventario real del tenant.
 * Resalta en rojo los items críticos (ratio < 20% del mínimo). Para el
 * detalle completo el tenant abre /t/:slug/inventario.
 */
export function StockAlertList() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchItems = useCallback(() => {
    apiGet<{ items: InventarioItem[] }>("/api/tenant/inventario")
      .then((d) => setItems(d.items))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useRealtimeRefetch(["tenant_inventario"], fetchItems);

  const sorted = useMemo(
    () =>
      items
        .filter((it) => Number(it.minimoAlerta) > 0)
        .sort((a, b) => ratio(a) - ratio(b))
        .slice(0, 6),
    [items],
  );
  const criticalCount = sorted.filter(isCritical).length;

  return (
    <section
      className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      data-testid="stock-alert-list"
    >
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Alertas de stock</h3>
        <span className="text-[11px] text-gray-400">
          {criticalCount > 0
            ? `${criticalCount} crítico${criticalCount === 1 ? "" : "s"}`
            : loaded
              ? "todo en orden"
              : "cargando…"}
        </span>
      </header>
      {sorted.length === 0 ? (
        <p
          className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500"
          data-testid="stock-empty"
        >
          {loaded
            ? "Aún no hay inventario con mínimos configurados."
            : "Cargando inventario…"}
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((item) => {
            const critical = isCritical(item);
            const pct = Math.round(ratio(item) * 100);
            const cantidad = Number(item.cantidad);
            const minimo = Number(item.minimoAlerta);
            return (
              <li
                key={item.id}
                data-testid={`stock-item-${item.id}`}
                data-critical={critical ? "true" : "false"}
                className={
                  "flex items-start justify-between gap-2 rounded-xl border px-3 py-2 " +
                  (critical
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-white")
                }
              >
                <div className="leading-tight">
                  <div className="text-sm font-medium text-gray-900">
                    {item.nombre}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {cantidad} {item.unidad} · mínimo {minimo} {item.unidad}
                  </div>
                </div>
                {critical ? (
                  <span
                    className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    data-testid={`stock-badge-critical-${item.id}`}
                  >
                    {pct}% · crítico
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                    {pct}%
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
