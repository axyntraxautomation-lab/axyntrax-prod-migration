import { useCallback, useEffect, useState } from "react";
import { useTenantReady } from "@/providers/TenantProvider";
import { apiGet, type FinanzaSummary } from "@/lib/api";
import { useRealtimeRefetch } from "@/hooks/useRealtimeBus";

type Channel = {
  id: "yape" | "plin" | "efectivo";
  label: string;
};

const CHANNELS: Channel[] = [
  { id: "yape", label: "Yape" },
  { id: "plin", label: "Plin" },
  { id: "efectivo", label: "Efectivo" },
];

/**
 * Tarjeta de finanzas: ingresos del día por canal de pago (Yape, Plin,
 * efectivo) y total. Lee de /api/tenant/finanzas/summary que ya filtra por
 * tenant_id en el backend.
 */
export function FinanceCard() {
  const me = useTenantReady();
  const moneda = me.tenant.moneda || "PEN";
  const simbolo = moneda === "PEN" ? "S/" : moneda;
  const [summary, setSummary] = useState<FinanzaSummary | null>(null);

  const refetch = useCallback(() => {
    apiGet<FinanzaSummary>("/api/tenant/finanzas/summary")
      .then((s) => setSummary(s))
      .catch(() => {
        // Silencio: el componente queda con ceros si falla.
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeRefetch(
    ["tenant_finanzas_movimientos", "tenant_pagos_qr"],
    refetch,
  );

  const channels = CHANNELS.map((c) => ({
    ...c,
    amount: summary?.canalesMes[c.id] ?? 0,
  }));
  const total = summary?.dia.balance ?? 0;
  const ingresoDia = summary?.dia.ingreso ?? 0;
  const formatter = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const fmt = (n: number) => `${simbolo} ${formatter.format(n)}`;

  return (
    <section
      className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      data-testid="finance-card"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Caja del día</h3>
        <span className="text-[11px] uppercase tracking-wider text-gray-400">
          ingresos del mes por canal
        </span>
      </header>
      <ul className="grid grid-cols-3 gap-2">
        {channels.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-gray-100 bg-gray-50 px-2 py-2 text-center"
            data-testid={`finance-channel-${c.id}`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {c.label}
            </div>
            <div className="mt-1 text-sm font-bold text-gray-900">
              {fmt(c.amount)}
            </div>
          </li>
        ))}
      </ul>
      <div
        className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primario), var(--color-secundario))",
        }}
        data-testid="finance-total"
      >
        <div className="leading-tight">
          <div className="text-[10px] font-medium uppercase opacity-90">
            Balance hoy
          </div>
          <div className="text-[10px] opacity-80">
            ingresos {fmt(ingresoDia)}
          </div>
        </div>
        <span className="text-base font-bold">{fmt(total)}</span>
      </div>
    </section>
  );
}
