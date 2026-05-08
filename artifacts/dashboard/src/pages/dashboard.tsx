import {
  useGetDashboardKpis,
  useGetRecentActivity,
} from "@workspace/api-client-react";
import {
  Users,
  Key,
  TrendingUp,
  AlertTriangle,
  Activity,
  Bot,
  Cpu,
  Radar,
  ArrowRight,
  MessageSquare,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";
import { KpiTile } from "@/components/ui/kpi-tile";
import { JarvisAvatar } from "@/components/ui/jarvis-avatar";
import { EmptyPremium } from "@/components/ui/empty-premium";
import { cn } from "@/lib/utils";

const QUICK_ACCESS = [
  {
    href: "/inbox",
    label: "Bandeja JARVIS",
    description: "Conversaciones IA en vivo",
    icon: MessageSquare,
  },
  {
    href: "/axyn-core",
    label: "AXYN CORE",
    description: "Núcleo de prompts y agentes",
    icon: Cpu,
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    description: "Cobros, Yape y conciliación",
    icon: Wallet,
  },
  {
    href: "/analytics",
    label: "Analytics",
    description: "Métricas operativas",
    icon: Radar,
  },
];

function botStatusTone(status: string): "success" | "danger" | "neutral" {
  if (status === "online") return "success";
  if (status === "error") return "danger";
  return "neutral";
}

function relativeTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const d = Math.floor(hr / 24);
  return `hace ${d} d`;
}

export default function Dashboard() {
  const { data: kpis, isLoading: loadingKpis } = useGetDashboardKpis();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();

  return (
    <div className="space-y-8">
      {/* Hero / status strip */}
      <GlassCard tone="strong" border="gradient" className="overflow-hidden p-0">
        <div className="relative flex flex-col items-start justify-between gap-5 p-6 md:flex-row md:items-center md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-mesh-cyan opacity-60"
          />
          <div className="relative flex items-center gap-4">
            <JarvisAvatar size="lg" pulse />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300">
                  Centro de mando
                </span>
                <StatusPill tone="success" size="sm">
                  Operativo
                </StatusPill>
              </div>
              <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
                Bienvenido,{" "}
                <span className="gradient-text-cyan-violet">comandante</span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Vista general de la agencia. JARVIS está supervisando bots,
                cotizaciones y bandeja en tiempo real.
              </p>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            <Link href="/axyn-core">
              <GradientButton variant="outline" size="md">
                <Cpu className="h-4 w-4" />
                Núcleo IA
              </GradientButton>
            </Link>
            <Link href="/inbox">
              <GradientButton variant="primary" size="md">
                <MessageSquare className="h-4 w-4" />
                Abrir bandeja
                <ArrowRight className="h-3.5 w-3.5" />
              </GradientButton>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Leads de hoy"
          value={
            loadingKpis ? (
              <Skeleton className="h-8 w-20 bg-white/5" />
            ) : (
              kpis?.leadsToday ?? 0
            )
          }
          hint="Captados por los bots"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiTile
          label="Ventas del mes"
          value={
            loadingKpis ? (
              <Skeleton className="h-8 w-20 bg-white/5" />
            ) : (
              kpis?.salesMonth ?? 0
            )
          }
          hint="Cotizaciones aceptadas"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiTile
          label="Licencias activas"
          value={
            loadingKpis ? (
              <Skeleton className="h-8 w-20 bg-white/5" />
            ) : (
              kpis?.activeLicenses ?? 0
            )
          }
          hint="En producción"
          icon={<Key className="h-4 w-4" />}
        />
        <KpiTile
          label="Por vencer"
          value={
            loadingKpis ? (
              <Skeleton className="h-8 w-20 bg-white/5" />
            ) : (
              <span
                className={cn(
                  (kpis?.expiringLicenses ?? 0) > 0
                    ? "text-rose-300"
                    : undefined,
                )}
              >
                {kpis?.expiringLicenses ?? 0}
              </span>
            )
          }
          hint="Licencias en alerta"
          icon={
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                (kpis?.expiringLicenses ?? 0) > 0 && "text-rose-300",
              )}
            />
          }
          tone={(kpis?.expiringLicenses ?? 0) > 0 ? "warn" : "default"}
        />
      </div>

      {/* Activity + Bot status */}
      <div className="grid gap-5 lg:grid-cols-7">
        <GlassCard tone="default" border="gradient" className="lg:col-span-4 p-0">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                <Activity className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <div className="font-display text-base font-semibold text-slate-50">
                  Actividad reciente
                </div>
                <div className="text-[11px] text-slate-400">
                  Eventos del sistema en tiempo real
                </div>
              </div>
            </div>
            <StatusPill tone="info" size="sm">
              Live
            </StatusPill>
          </div>

          <div className="px-6 py-5">
            {loadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full bg-white/5" />
                ))}
              </div>
            ) : !activity || activity.length === 0 ? (
              <EmptyPremium
                icon={<Activity className="h-5 w-5" />}
                title="Sin actividad todavía"
                description="Cuando JARVIS reciba mensajes o se generen cotizaciones, aparecerán acá en tiempo real."
              />
            ) : (
              <ol className="relative space-y-5">
                <span
                  aria-hidden
                  className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/40 via-cyan-400/10 to-transparent"
                />
                {activity.map((item) => (
                  <li key={item.id} className="relative flex gap-4 pl-0">
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-slate-950 shadow-[0_0_18px_-4px_rgba(34,211,238,0.5)]">
                      <Activity className="h-3.5 w-3.5 text-cyan-300" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-100">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-400">
                        {item.description}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-mono uppercase tracking-[0.14em]">
                          {relativeTime(item.timestamp)}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(item.timestamp).toLocaleString("es-PE")}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </GlassCard>

        <GlassCard tone="default" border="gradient" className="lg:col-span-3 p-0">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-200">
                <Bot className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <div className="font-display text-base font-semibold text-slate-50">
                  Estado de bots
                </div>
                <div className="text-[11px] text-slate-400">
                  AXYN CORE · canales activos
                </div>
              </div>
            </div>
            <Link href="/axyn-core">
              <button
                type="button"
                className="text-[11px] font-medium text-cyan-200 transition-colors hover:text-cyan-100"
              >
                Ver núcleo
              </button>
            </Link>
          </div>

          <div className="px-6 py-5">
            {loadingKpis ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full bg-white/5" />
                ))}
              </div>
            ) : !kpis?.botStatuses || kpis.botStatuses.length === 0 ? (
              <EmptyPremium
                icon={<Bot className="h-5 w-5" />}
                title="Sin bots configurados"
                description="Activa tus agentes desde AXYN CORE para verlos acá."
              />
            ) : (
              <div className="space-y-3">
                {kpis.botStatuses.map((bot) => {
                  const tone = botStatusTone(bot.status);
                  const dotCls =
                    tone === "success"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : tone === "danger"
                        ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"
                        : "bg-slate-500";
                  return (
                    <div
                      key={bot.name}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 transition-colors hover:border-cyan-400/20 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-950/60">
                          <Bot className="h-3.5 w-3.5 text-cyan-300" />
                        </span>
                        <div className="leading-tight">
                          <div className="font-display text-sm font-semibold text-slate-50">
                            {bot.name}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            {bot.channel}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", dotCls)} />
                        <StatusPill tone={tone} size="sm" dot={false}>
                          {bot.status}
                        </StatusPill>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Quick access */}
      <section className="space-y-4">
        <SectionHeader
          align="left"
          eyebrow="Accesos rápidos"
          title="Salta a un módulo de la cabina"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACCESS.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href}>
              <GlassCard
                tone="default"
                border="gradient"
                className="group flex h-full items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:glow-cyan-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 transition-colors group-hover:border-cyan-300/50">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 leading-tight">
                  <div className="font-display text-sm font-semibold text-slate-50">
                    {label}
                  </div>
                  <div className="text-[11px] text-slate-400">{description}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-300" />
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer signature line */}
      <div className="flex items-center justify-center gap-2 pt-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
        <Sparkles className="h-3 w-3 text-cyan-300" />
        AXYNTRAX OS · operaciones en vivo · Arequipa, Perú
      </div>
    </div>
  );
}
