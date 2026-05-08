/**
 * Grid de KPIs adaptados al rubro con DATOS REALES y refresco en vivo.
 *
 * Cada KPI mapea a un cálculo concreto desde las APIs del tenant:
 *  - Ingresos hoy / mes  → /api/tenant/finanzas/summary
 *  - Citas hoy           → /api/tenant/citas?desde=hoy&hasta=mañana
 *  - Clientes activos    → /api/tenant/clientes (count)
 *  - Pagos pendientes    → /api/tenant/pagos-qr?estado=pendiente
 *
 * Si el rubro pide un KPI que no podemos calcular aún, mostramos "—".
 * El componente se suscribe al bus Realtime y refresca cuando cambian
 * las tablas relevantes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTenantReady } from "@/providers/TenantProvider";
import {
  apiGet,
  type ClienteFinal,
  type Cita,
  type FinanzaSummary,
} from "@/lib/api";
import { useRealtimeRefetch } from "@/hooks/useRealtimeBus";

type KpiSnapshot = {
  ingresoHoy: number;
  ingresoMes: number;
  citasHoy: number;
  clientes: number;
  pagosPendientes: number;
  moneda: string;
};

const DEFAULT: KpiSnapshot = {
  ingresoHoy: 0,
  ingresoMes: 0,
  citasHoy: 0,
  clientes: 0,
  pagosPendientes: 0,
  moneda: "PEN",
};

function kpiValue(snap: KpiSnapshot, name: string): { value: string; sub?: string } {
  const lower = name.toLowerCase();
  const sym = snap.moneda === "PEN" ? "S/" : snap.moneda;
  if (lower.includes("ingreso") && lower.includes("mes")) {
    return { value: `${sym} ${snap.ingresoMes.toFixed(0)}` };
  }
  if (lower.includes("ingreso") || lower.includes("venta")) {
    return { value: `${sym} ${snap.ingresoHoy.toFixed(0)}`, sub: "hoy" };
  }
  if (lower.includes("cita") || lower.includes("reserva")) {
    return { value: String(snap.citasHoy), sub: "hoy" };
  }
  if (lower.includes("cliente")) {
    return { value: String(snap.clientes) };
  }
  if (lower.includes("pago") && lower.includes("pend")) {
    return { value: String(snap.pagosPendientes) };
  }
  return { value: "—", sub: "aún sin datos" };
}

export function KpiTileGrid() {
  const me = useTenantReady();
  const kpis = me.rubro?.kpis ?? [];
  const [snap, setSnap] = useState<KpiSnapshot>(DEFAULT);

  const refetch = useCallback(async () => {
    try {
      const today = new Date();
      const startDay = new Date(today);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(startDay);
      endDay.setDate(endDay.getDate() + 1);
      const [summary, citasResp, clientesResp, pagosResp] = await Promise.all([
        apiGet<FinanzaSummary>("/api/tenant/finanzas/summary").catch(() => null),
        apiGet<{ items: Cita[] }>(
          `/api/tenant/citas?desde=${encodeURIComponent(startDay.toISOString())}&hasta=${encodeURIComponent(endDay.toISOString())}`,
        ).catch(() => ({ items: [] })),
        apiGet<{ items: ClienteFinal[] }>("/api/tenant/clientes").catch(() => ({
          items: [],
        })),
        apiGet<{ items: unknown[] }>(
          "/api/tenant/pagos-qr?estado=pendiente",
        ).catch(() => ({ items: [] })),
      ]);
      setSnap({
        ingresoHoy: summary?.dia.ingreso ?? 0,
        ingresoMes: summary?.mes.ingreso ?? 0,
        citasHoy: citasResp.items.length,
        clientes: clientesResp.items.length,
        pagosPendientes: pagosResp.items.length,
        moneda: summary?.moneda ?? me.tenant.moneda ?? "PEN",
      });
    } catch {
      // mantener estado previo
    }
  }, [me.tenant.moneda]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useRealtimeRefetch(
    [
      "tenant_finanzas_movimientos",
      "tenant_citas_servicios",
      "tenant_clientes_finales",
      "tenant_pagos_qr",
    ],
    () => {
      void refetch();
    },
  );

  const tiles = useMemo(
    () => kpis.slice(0, 4).map((k) => ({ name: k, ...kpiValue(snap, k) })),
    [kpis, snap],
  );

  if (kpis.length === 0) return null;

  return (
    <section aria-labelledby="kpis-title" className="mt-4">
      <h2 id="kpis-title" className="sr-only">
        Indicadores clave
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div
            key={t.name}
            data-testid={`kpi-${t.name}`}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primario) 12%, #e5e7eb)",
            }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              {t.name}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: "var(--color-primario)" }}
              >
                {t.value}
              </span>
              {t.sub ? (
                <span className="text-xs text-gray-400">{t.sub}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
