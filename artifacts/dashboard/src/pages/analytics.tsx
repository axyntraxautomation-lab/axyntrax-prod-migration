import { useGetDashboardKpis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp } from "lucide-react";

const CHANNEL_LABELS: Record<string, string> = {
  web: "Web",
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  email: "Email",
  otro: "Otro",
};

export default function Analytics() {
  const { data: kpis, isLoading } = useGetDashboardKpis();
  const channels = kpis?.conversionsByChannel ?? [];
  const maxLeads = Math.max(1, ...channels.map((c) => c.leads));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Métricas de conversión por canal y desempeño general.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Clientes</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{kpis?.totalClients ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">MRR (PEN)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {(kpis?.mrr ?? 0).toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Demos Activas</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{kpis?.activeDemos ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversiones por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : channels.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Aún no hay datos de canales para mostrar.
            </p>
          ) : (
            <div className="space-y-4">
              {channels.map((c) => {
                const conversionRate =
                  c.leads > 0 ? Math.round((c.conversions / c.leads) * 100) : 0;
                return (
                  <div key={c.channel} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {CHANNEL_LABELS[c.channel] ?? c.channel}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {c.conversions} / {c.leads} ({conversionRate}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(c.leads / maxLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
