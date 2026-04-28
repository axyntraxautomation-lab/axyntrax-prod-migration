import { BrandingHeader } from "@/components/BrandingHeader";
import { KpiTileGrid } from "@/components/KpiTileGrid";
import { SalesChart } from "@/components/SalesChart";
import { StockAlertList } from "@/components/StockAlertList";
import { AgendaCalendar } from "@/components/AgendaCalendar";
import { FinanceCard } from "@/components/FinanceCard";
import { CeciliaFloatingChat } from "@/components/CeciliaFloatingChat";
import { useTenantReady } from "@/providers/TenantProvider";

export function Dashboard() {
  const me = useTenantReady();
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
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
            Bienvenido a Cecilia
          </div>
          <p className="mt-1 text-sm">{welcome}</p>
        </section>
        <FinanceCard />
        <KpiTileGrid />
        <SalesChart />
        <div className="grid gap-3 md:grid-cols-2">
          <StockAlertList />
          <AgendaCalendar />
        </div>
      </main>
      <CeciliaFloatingChat />
    </>
  );
}
