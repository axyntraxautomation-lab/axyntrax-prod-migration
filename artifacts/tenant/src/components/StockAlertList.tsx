import { useMemo } from "react";
import { useTenantReady } from "@/providers/TenantProvider";

type StockItem = {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
};

const STOCK_THRESHOLD = 0.2; // 20%

/**
 * Items de muestra por rubro para evidenciar la lógica de alertas mientras
 * la Tarea #3 conecta tenant_inventario en realtime. Cuando llegue el
 * inventario real, sólo cambia el origen de `items` y el render no se toca.
 */
const SAMPLE_ITEMS_BY_RUBRO: Record<string, StockItem[]> = {
  car_wash: [
    { id: "shampoo", nombre: "Shampoo industrial", unidad: "L", stock_actual: 3, stock_minimo: 20 },
    { id: "cera", nombre: "Cera líquida premium", unidad: "L", stock_actual: 8, stock_minimo: 15 },
    { id: "microfibra", nombre: "Paño microfibra", unidad: "und", stock_actual: 40, stock_minimo: 30 },
  ],
  restaurante: [
    { id: "aceite", nombre: "Aceite vegetal", unidad: "L", stock_actual: 2, stock_minimo: 25 },
    { id: "arroz", nombre: "Arroz superior", unidad: "kg", stock_actual: 12, stock_minimo: 40 },
  ],
  bodega: [
    { id: "gaseosa", nombre: "Gaseosa 500ml", unidad: "und", stock_actual: 6, stock_minimo: 48 },
    { id: "leche", nombre: "Leche evaporada", unidad: "und", stock_actual: 18, stock_minimo: 36 },
  ],
  farmacia: [
    { id: "ibuprofeno", nombre: "Ibuprofeno 400mg", unidad: "caja", stock_actual: 1, stock_minimo: 10 },
  ],
  salon: [
    { id: "tintura", nombre: "Tintura castaño", unidad: "und", stock_actual: 2, stock_minimo: 12 },
  ],
  taller: [
    { id: "aceite_motor", nombre: "Aceite 10W-40", unidad: "L", stock_actual: 4, stock_minimo: 24 },
  ],
  gimnasio: [],
  consultoria: [],
  logistica: [],
};

function computeRatio(item: StockItem): number {
  if (item.stock_minimo <= 0) return 1;
  return item.stock_actual / item.stock_minimo;
}

function isCritical(item: StockItem): boolean {
  return computeRatio(item) < STOCK_THRESHOLD;
}

export function StockAlertList() {
  const me = useTenantReady();
  const rubroId = me.tenant.rubroId;

  const items = useMemo<StockItem[]>(
    () => SAMPLE_ITEMS_BY_RUBRO[rubroId] ?? [],
    [rubroId],
  );

  const sorted = useMemo(
    () => [...items].sort((a, b) => computeRatio(a) - computeRatio(b)),
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
            : "tiempo real"}
        </span>
      </header>
      {sorted.length === 0 ? (
        <p
          className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500"
          data-testid="stock-empty"
        >
          Aún no hay inventario cargado para tu rubro.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((item) => {
            const critical = isCritical(item);
            const pct = Math.round(computeRatio(item) * 100);
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
                    {item.stock_actual} {item.unidad} · mínimo {item.stock_minimo}{" "}
                    {item.unidad}
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
