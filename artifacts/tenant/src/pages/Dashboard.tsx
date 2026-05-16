import { useState } from "react";
import { BrandingHeader } from "@/components/BrandingHeader";
import { KpiTileGrid } from "@/components/KpiTileGrid";
import { SalesChart } from "@/components/SalesChart";
import { StockAlertList } from "@/components/StockAlertList";
import { AgendaCalendar } from "@/components/AgendaCalendar";
import { FinanceCard } from "@/components/FinanceCard";
import { CeciliaFloatingChat } from "@/components/CeciliaFloatingChat";
import { SideNav } from "@/components/SideNav";
import { NuevaVentaWizard } from "@/components/NuevaVentaWizard";
import { useTenantReady } from "@/providers/TenantProvider";
import { getTerminologia } from "@/lib/rubro-terminologia";

export function Dashboard() {
  const me = useTenantReady();
  const term = getTerminologia(me.tenant.rubroId);
  const [ventaOpen, setVentaOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const welcome =
    me.branding?.welcomeText?.trim() ||
    `Hola ${me.tenant.nombreEmpresa.split(/\s+/)[0] ?? ""}, así va tu negocio hoy.`;
  return (
    <>
      <BrandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-2">
        <section
          className="mt-3 rounded-2xl p-4 text-white shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primario), var(--color-secundario))",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
                Bienvenido a Cecilia
              </div>
              <p className="mt-1 text-sm">{welcome}</p>
            </div>
            <button
              type="button"
              onClick={() => setVentaOpen(true)}
              className="shrink-0 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-white"
              data-testid="btn-nueva-venta"
            >
              {term.venta}
            </button>
          </div>
        </section>
        <div key={reloadKey} className="contents">
          <FinanceCard />
        </div>
        <KpiTileGrid />
        <SalesChart />
        <div className="grid gap-3 md:grid-cols-2">
          <div key={`stock-${reloadKey}`} className="contents">
            <StockAlertList />
          </div>
          <AgendaCalendar />
        </div>
      </main>
      <SideNav />
      <CeciliaFloatingChat />
      <NuevaVentaWizard
        open={ventaOpen}
        onClose={() => setVentaOpen(false)}
        onCompleted={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}
