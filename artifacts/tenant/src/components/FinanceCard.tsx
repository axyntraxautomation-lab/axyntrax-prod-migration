import { useTenantReady } from "@/providers/TenantProvider";

type Channel = {
  id: "yape" | "plin" | "efectivo";
  label: string;
  amount: number;
};

/**
 * Tarjeta de finanzas: muestra ingresos del día por canal de pago
 * (Yape, Plin, efectivo) y el total. Los montos quedan en cero hasta que
 * la Tarea #3 conecte tenant_finanzas_movimientos en realtime; la
 * estructura ya soporta los datos reales sin tocar el componente.
 */
export function FinanceCard() {
  const me = useTenantReady();
  const moneda = me.tenant.moneda || "PEN";
  const simbolo = moneda === "PEN" ? "S/" : moneda;

  // Datos reales llegan en Tarea #3 (Supabase realtime). Por ahora ceros
  // tipados con la misma forma para que el componente no cambie.
  const channels: Channel[] = [
    { id: "yape", label: "Yape", amount: 0 },
    { id: "plin", label: "Plin", amount: 0 },
    { id: "efectivo", label: "Efectivo", amount: 0 },
  ];
  const total = channels.reduce((sum, c) => sum + c.amount, 0);
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
          ingresos por canal
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
        <span className="text-xs font-medium uppercase opacity-90">Total hoy</span>
        <span className="text-base font-bold">{fmt(total)}</span>
      </div>
    </section>
  );
}
