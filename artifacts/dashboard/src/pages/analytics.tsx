import {
  useGetDashboardKpis,
  useGetAnalyticsOverview,
  getGetAnalyticsOverviewQueryKey,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Bot,
  Clock,
  PieChart,
} from "lucide-react";

const CHANNEL_LABELS: Record<string, string> = {
  web: "Web",
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  email: "Email",
  gmail: "Gmail",
  otro: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  en_curso: "En curso",
  esperando: "Esperando",
  resuelto: "Resuelto",
  archivado: "Archivado",
};

function fmtMin(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 1) return `${Math.round(n * 60)} s`;
  if (n < 60) return `${n.toFixed(1)} min`;
  return `${(n / 60).toFixed(1)} h`;
}

export default function Analytics() {
  const { data: kpis, isLoading: kpisLoading } = useGetDashboardKpis();
  const { data: overview, isLoading: ovLoading } = useGetAnalyticsOverview({
    query: {
      queryKey: getGetAnalyticsOverviewQueryKey(),
      refetchInterval: 60_000,
    },
  });

  const channels = kpis?.conversionsByChannel ?? [];
  const messagesByDay = overview?.messagesByDay ?? [];
  const financeByDay = overview?.financeByDay ?? [];
  const aiStats = overview?.aiStats ?? [];
  const responseTimes = overview?.responseTimesByChannel ?? [];
  const conversationsByStatus = overview?.conversationsByStatus ?? [];
  const recentAi = overview?.recentAiActivity ?? [];

  const totalAiCalls = aiStats.reduce((acc, a) => acc + a.count, 0);
  const totalMessages = messagesByDay.reduce((a, b) => a + b.count, 0);
  const balance30d = financeByDay.reduce(
    (acc, d) => acc + (d.ingreso - d.egreso),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Métricas operativas en tiempo real (últimos 30 días).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Clientes"
          icon={BarChart3}
          loading={kpisLoading}
          value={kpis?.totalClients ?? 0}
        />
        <KpiCard
          title="MRR (PEN)"
          icon={TrendingUp}
          loading={kpisLoading}
          value={`S/ ${(kpis?.mrr ?? 0).toFixed(2)}`}
        />
        <KpiCard
          title="Mensajes 30d"
          icon={Activity}
          loading={ovLoading}
          value={totalMessages}
        />
        <KpiCard
          title="Llamadas IA 30d"
          icon={Bot}
          loading={ovLoading}
          value={totalAiCalls}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mensajes por día</CardTitle>
            <CardDescription>Entrantes vs salientes</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {ovLoading ? (
              <Skeleton className="h-full w-full" />
            ) : messagesByDay.length === 0 ? (
              <EmptyState text="Sin actividad de mensajes en el rango." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={messagesByDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="inbound"
                    name="Entrantes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="outbound"
                    name="Salientes"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flujo financiero</CardTitle>
            <CardDescription>
              Ingresos vs egresos · balance 30d:{" "}
              <span
                className={
                  balance30d >= 0 ? "text-emerald-500" : "text-red-500"
                }
              >
                S/ {balance30d.toFixed(2)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {ovLoading ? (
              <Skeleton className="h-full w-full" />
            ) : financeByDay.length === 0 ? (
              <EmptyState text="Aún no hay movimientos financieros." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeByDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ingreso"
                    name="Ingreso"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.25)"
                  />
                  <Area
                    type="monotone"
                    dataKey="egreso"
                    name="Egreso"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive) / 0.25)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiempos de primera respuesta</CardTitle>
            <CardDescription>Promedio por canal</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {ovLoading ? (
              <Skeleton className="h-full w-full" />
            ) : responseTimes.length === 0 ? (
              <EmptyState text="Sin muestras suficientes." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={responseTimes.map((r) => ({
                    name: CHANNEL_LABELS[r.channel] ?? r.channel,
                    minutos: Number(r.avgMinutes.toFixed(2)),
                    samples: r.samples,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "minutos"
                        ? [fmtMin(value), "Promedio"]
                        : [value, name]
                    }
                  />
                  <Bar
                    dataKey="minutos"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversaciones por canal</CardTitle>
            <CardDescription>Distribución de la bandeja</CardDescription>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : channels.length === 0 ? (
              <EmptyState text="Aún no hay datos de canales." />
            ) : (
              <div className="space-y-4">
                {channels.map((c) => {
                  const max = Math.max(1, ...channels.map((x) => x.leads));
                  const conv =
                    c.leads > 0
                      ? Math.round((c.conversions / c.leads) * 100)
                      : 0;
                  return (
                    <div key={c.channel} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {CHANNEL_LABELS[c.channel] ?? c.channel}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {c.conversions} / {c.leads} ({conv}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(c.leads / max) * 100}%` }}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Actividad IA reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ovLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : recentAi.length === 0 ? (
              <EmptyState text="Sin eventos IA registrados." />
            ) : (
              <div className="space-y-2">
                {recentAi.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{a.source}</Badge>
                      <span className="text-sm">{a.event}</span>
                      {a.message && (
                        <span className="text-xs text-muted-foreground truncate max-w-xs">
                          {a.message}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(a.createdAt).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Estado de conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ovLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : conversationsByStatus.length === 0 ? (
              <EmptyState text="Sin datos." />
            ) : (
              <ul className="space-y-2 text-sm">
                {conversationsByStatus.map((s) => (
                  <li
                    key={s.status}
                    className="flex justify-between items-center"
                  >
                    <span>{STATUS_LABELS[s.status] ?? s.status}</span>
                    <Badge variant="secondary">{s.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  icon: Icon,
  loading,
  value,
}: {
  title: string;
  icon: typeof BarChart3;
  loading: boolean;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground text-sm py-8">
      <Clock className="h-4 w-4 mr-2" />
      {text}
    </div>
  );
}
