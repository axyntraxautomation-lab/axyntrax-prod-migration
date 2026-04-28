import { useTenantReady } from "@/providers/TenantProvider";

export function FinanceCard() {
  const me = useTenantReady();
  const moneda = me.tenant.moneda || "PEN";
  const simbolo = moneda === "PEN" ? "S/" : moneda;
  return (
    <section className="mt-4 grid grid-cols-2 gap-3">
      <article
        className="rounded-2xl p-4 text-white shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primario), var(--color-secundario))",
        }}
      >
        <div className="text-[11px] font-medium uppercase opacity-90">
          Caja del día
        </div>
        <div className="mt-1 text-2xl font-bold">{simbolo} 0.00</div>
        <div className="mt-1 text-[11px] opacity-80">sin movimientos hoy</div>
      </article>
      <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          Por cobrar
        </div>
        <div className="mt-1 text-2xl font-bold text-gray-900">{simbolo} 0.00</div>
        <div className="mt-1 text-[11px] text-gray-400">0 deudas pendientes</div>
      </article>
    </section>
  );
}
