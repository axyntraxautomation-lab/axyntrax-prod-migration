import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Loader2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Bot,
  Stethoscope,
  Smile,
  PawPrint,
  Scale,
  Building2,
  CheckCircle2,
  FileText,
  Wallet,
  Headphones,
  Cpu,
  Radar,
  Zap,
  ChevronRight,
} from "lucide-react";
import { portalApi, type CatalogModule } from "@/lib/portal-api";
import { SalesBotWidget } from "@/components/sales-bot-widget";
import { YapeQR } from "@/components/yape-qr";
import { useAuth } from "@/lib/auth-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { BlueprintBackdrop } from "@/components/ui/blueprint-backdrop";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";
import { KpiTile } from "@/components/ui/kpi-tile";
import { JarvisAvatar } from "@/components/ui/jarvis-avatar";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const INDUSTRY_META: Record<
  string,
  {
    label: string;
    icon: typeof Stethoscope;
    accent: string;
    gradient: string;
  }
> = {
  medical: {
    label: "Medicina",
    icon: Stethoscope,
    accent: "text-cyan-300",
    gradient: "from-cyan-500/30 via-cyan-400/10 to-transparent",
  },
  dental: {
    label: "Dental",
    icon: Smile,
    accent: "text-sky-300",
    gradient: "from-sky-500/30 via-sky-400/10 to-transparent",
  },
  veterinary: {
    label: "Veterinaria",
    icon: PawPrint,
    accent: "text-emerald-300",
    gradient: "from-emerald-500/30 via-emerald-400/10 to-transparent",
  },
  legal: {
    label: "Legal",
    icon: Scale,
    accent: "text-violet-300",
    gradient: "from-violet-500/30 via-violet-400/10 to-transparent",
  },
  condo: {
    label: "Condominios",
    icon: Building2,
    accent: "text-amber-300",
    gradient: "from-amber-500/30 via-amber-400/10 to-transparent",
  },
};

function industryLabel(slug: string): string {
  return INDUSTRY_META[slug]?.label ?? slug;
}

function fmtPrice(n: string, c: string): string {
  const num = Number(n);
  if (!num) return "Demo gratuita por 30 días";
  return `${c} ${num.toFixed(2)} / mes`;
}

const NAV = [
  { id: "industrias", label: "Industrias" },
  { id: "catalogo", label: "Catálogo" },
  { id: "proceso", label: "Cómo funciona" },
  { id: "pago", label: "Pago" },
] as const;

const PROCESS_STEPS = [
  {
    n: "01",
    icon: CheckCircle2,
    title: "Creá tu cuenta",
    body: "Registro gratuito en menos de un minuto. Solo email y celular.",
  },
  {
    n: "02",
    icon: Bot,
    title: "Habla con Cecilia",
    body: "Contale tu rubro y recibe los módulos justos para tu operación.",
  },
  {
    n: "03",
    icon: FileText,
    title: "Recibe tu cotización",
    body: "Cotización formal con IGV 18 % en PDF, descargable y por correo.",
  },
  {
    n: "04",
    icon: Wallet,
    title: "Paga por Yape y listo",
    body: "Depositas vía Yape, Cecilia te activa los módulos en minutos.",
  },
];

export default function LandingPage() {
  const [modules, setModules] = useState<CatalogModule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "free">("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const { session } = useAuth();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portal/public/catalog")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((rows) => {
        if (!cancelled) setModules(rows as CatalogModule[]);
      })
      .catch(() => {
        if (cancelled) return;
        portalApi
          .catalog()
          .then((r) => !cancelled && setModules(r))
          .catch(() => !cancelled && setError("No se pudo cargar el catálogo"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const list = modules ?? [];
    const industries = new Set(list.map((m) => m.industry));
    return {
      modules: list.length,
      industries: industries.size,
      paid: list.filter((m) => Number(m.monthlyPrice) > 0).length,
      free: list.filter((m) => Number(m.monthlyPrice) === 0).length,
    };
  }, [modules]);

  const filtered = useMemo(() => {
    if (!modules) return [];
    return modules.filter((m) => {
      const isPaid = Number(m.monthlyPrice) > 0;
      if (filter === "paid" && !isPaid) return false;
      if (filter === "free" && isPaid) return false;
      if (industryFilter !== "all" && m.industry !== industryFilter)
        return false;
      return true;
    });
  }, [modules, filter, industryFilter]);

  const grouped = filtered.reduce<Record<string, CatalogModule[]>>(
    (acc, m) => {
      acc[m.industry] = acc[m.industry] ? [...acc[m.industry], m] : [m];
      return acc;
    },
    {},
  );

  const industriesList = Object.keys(
    (modules ?? []).reduce<Record<string, true>>((acc, m) => {
      acc[m.industry] = true;
      return acc;
    }, {}),
  );

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-background/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div className="hidden leading-tight sm:block">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Automation OS · Arequipa
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((it) => (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(it.id);
                }}
                data-testid={`nav-${it.id}`}
                className="rounded-full px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-cyan-200"
              >
                {it.label}
              </a>
            ))}
            <Link
              href="/nosotros"
              data-testid="nav-nosotros"
              className="rounded-full px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-cyan-200"
            >
              Nosotros
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Link href={session.kind === "admin" ? "/admin" : "/mis-modulos"}>
                <GradientButton variant="outline" size="sm" data-testid="link-portal">
                  Ir a mi portal
                  <ArrowRight className="h-3.5 w-3.5" />
                </GradientButton>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <GradientButton variant="ghost" size="sm" data-testid="link-login">
                    Ingresar
                  </GradientButton>
                </Link>
                <Link href="/login?tab=register">
                  <GradientButton variant="primary" size="sm" data-testid="link-register">
                    Crear cuenta
                    <ChevronRight className="h-3.5 w-3.5" />
                  </GradientButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <BlueprintBackdrop intensity="default" animated className="border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col gap-8">
              <StatusPill tone="info" size="md" className="self-start">
                Operaciones IA · Arequipa, Perú · 2026
              </StatusPill>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl md:text-[3.6rem]">
                Tu negocio,
                <br />
                con un{" "}
                <span className="gradient-text-cyan-violet">centro de mando</span>{" "}
                que nunca duerme.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                Módulos de automatización IA para clínicas, estudios legales y
                administraciones. <strong className="text-slate-100">Cecilia</strong>{" "}
                cotiza al instante, activa demos en minutos y atiende WhatsApp 24/7
                con tu catálogo en vivo.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/login?tab=register">
                  <GradientButton size="lg" variant="primary" data-testid="cta-register">
                    Crear cuenta y probar
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                </Link>
                <a
                  href="#catalogo"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("catalogo");
                  }}
                >
                  <GradientButton size="lg" variant="outline" data-testid="cta-explore">
                    Ver módulos
                  </GradientButton>
                </a>
              </div>
              {modules && (
                <div className="grid grid-cols-3 gap-3 pt-4 sm:max-w-lg">
                  <KpiTile
                    label="Módulos"
                    value={<span data-testid="stat-modules">{stats.modules}</span>}
                    hint="Activos en catálogo"
                    icon={<Cpu className="h-4 w-4" />}
                  />
                  <KpiTile
                    label="Industrias"
                    value={<span data-testid="stat-industries">{stats.industries}</span>}
                    hint="Verticales atendidas"
                    icon={<Radar className="h-4 w-4" />}
                  />
                  <KpiTile
                    label="Soporte"
                    value="24/7"
                    hint="Atención Cecilia"
                    icon={<Zap className="h-4 w-4" />}
                  />
                </div>
              )}
            </div>

            {/* Tarjeta decorativa: preview de cabina JARVIS */}
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-mesh-cyan opacity-80 blur-2xl" aria-hidden />
              <GlassCard tone="strong" border="gradient" className="overflow-hidden p-0 animate-float">
                <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <JarvisAvatar size="md" pulse />
                    <div className="leading-tight">
                      <div className="font-display text-sm font-semibold text-slate-50">
                        JARVIS · Cabina
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                        Stream en vivo
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-xs font-medium text-slate-100">
                          Demo activada · Veterinaria
                        </div>
                        <div className="text-[10px] text-slate-500">hace 2 min · 30 días</div>
                      </div>
                    </div>
                    <StatusPill tone="success" size="sm" dot={false}>
                      ACTIVA
                    </StatusPill>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-xs font-medium text-slate-100">
                          Cotización enviada · Estudio legal
                        </div>
                        <div className="text-[10px] text-slate-500">PDF + correo · S/ 1,180</div>
                      </div>
                    </div>
                    <StatusPill tone="info" size="sm" dot={false}>
                      ENVIADA
                    </StatusPill>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-400/10 text-violet-200">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-xs font-medium text-slate-100">
                          WhatsApp respondido por Cecilia
                        </div>
                        <div className="text-[10px] text-slate-500">+51 998 xxx xxx · Dental</div>
                      </div>
                    </div>
                    <StatusPill tone="violet" size="sm" dot={false}>
                      AUTO
                    </StatusPill>
                  </div>
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-3">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                      <span>Pulso operativo</span>
                      <span className="font-mono text-cyan-100">99.9%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/80">
                      <div className="h-full w-[99%] gradient-cyan-violet shimmer-overlay" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </BlueprintBackdrop>

      {/* ===== PILARES ===== */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeader
            align="center"
            eyebrow="Por qué AXYNTRAX"
            title={<>Tres certezas que sostienen tu operación</>}
            description="Una plataforma diseñada para profesionales peruanos: IA aplicada, activación inmediata y datos cifrados de punta a punta."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Bot,
                title: "Cotización con IA",
                body: "Cecilia analiza tu rubro y arma una propuesta detallada en PDF con IGV incluido, lista para firmar.",
              },
              {
                icon: Sparkles,
                title: "Activación inmediata",
                body: "Aceptas la cotización, depositas por Yape y empezamos a trabajar en minutos, sin trámites bancarios.",
              },
              {
                icon: ShieldCheck,
                title: "Datos protegidos",
                body: "Cifrado AES-256-GCM, 2FA en JARVIS, auditoría y respaldos. Cumplimos con la Ley 29733.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <GlassCard
                key={title}
                tone="default"
                border="gradient"
                className="group p-7 transition-all duration-300 hover:-translate-y-1 hover:glow-cyan-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[inset_0_0_18px_rgba(34,211,238,0.18)] transition-colors group-hover:border-cyan-300/50">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-slate-50">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INDUSTRIAS ===== */}
      <section id="industrias" className="relative border-b border-white/5 bg-mesh-soft">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeader
            align="center"
            eyebrow="Industrias atendidas"
            title="Hecho para profesionales peruanos"
            description="Cada módulo está pensado para un rubro específico. Tu negocio recibe IA entrenada con su jerga, sus procesos y su normativa."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
            {Object.entries(INDUSTRY_META).map(([slug, meta]) => {
              const count = (modules ?? []).filter((m) => m.industry === slug).length;
              const Icon = meta.icon;
              const active = industryFilter === slug;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    setIndustryFilter(slug);
                    setFilter("all");
                    scrollTo("catalogo");
                  }}
                  data-testid={`industry-card-${slug}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left transition-all duration-300",
                    "hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.04] hover:glow-cyan-sm",
                    active && "border-cyan-400/60 bg-cyan-400/5 ring-1 ring-cyan-400/40 glow-cyan-sm",
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-300 group-hover:opacity-100",
                      meta.gradient,
                    )}
                  />
                  <div className="relative flex flex-col gap-3">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur", meta.accent)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-display text-sm font-semibold text-slate-50">
                        {meta.label}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {count} {count === 1 ? "módulo" : "módulos"}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-200 opacity-0 transition-opacity group-hover:opacity-100">
                      Filtrar catálogo <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== PROCESO ===== */}
      <section id="proceso" className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeader
            align="center"
            eyebrow="Cómo funciona"
            title="De prospecto a cliente activo en 4 pasos"
            description="Un flujo claro y sin fricciones. Desde el primer mensaje hasta la activación, Cecilia te acompaña."
          />
          <div className="relative mt-14">
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent md:block"
            />
            <div className="grid gap-5 md:grid-cols-4">
              {PROCESS_STEPS.map(({ n, icon: Icon, title, body }) => (
                <div
                  key={n}
                  className="relative"
                  data-testid={`process-step-${parseInt(n, 10)}`}
                >
                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 ring-1 ring-cyan-400/40 shadow-[0_0_28px_-6px_rgba(34,211,238,0.5)]">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <GlassCard tone="default" border="soft" className="mt-5 p-5 text-center">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                      Paso {n}
                    </span>
                    <h3 className="mt-1 font-display text-base font-semibold text-slate-50">
                      {title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{body}</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATÁLOGO ===== */}
      <section id="catalogo" className="relative border-b border-white/5 bg-mesh-soft">
        <div className="mx-auto max-w-6xl space-y-10 px-6 py-20">
          <SectionHeader
            align="center"
            eyebrow="Catálogo"
            title="Todos los módulos disponibles"
            description="Demos sin precio se descargan gratis por 30 días. Los módulos cotizables los arma Cecilia y te llegan por correo en PDF."
          />

          {/* Filtros */}
          <GlassCard tone="default" border="soft" className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Tipo
                </span>
                {([
                  { key: "all", label: "Todos" },
                  { key: "paid", label: "Cotizables" },
                  { key: "free", label: "Demos gratis" },
                ] as const).map((opt) => (
                  <FilterChip
                    key={opt.key}
                    active={filter === opt.key}
                    onClick={() => setFilter(opt.key)}
                    testId={`filter-${opt.key}`}
                  >
                    {opt.label}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Industria
                </span>
                <FilterChip
                  active={industryFilter === "all"}
                  onClick={() => setIndustryFilter("all")}
                  testId="industry-filter-all"
                >
                  Todas
                </FilterChip>
                {industriesList.map((slug) => (
                  <FilterChip
                    key={slug}
                    active={industryFilter === slug}
                    onClick={() => setIndustryFilter(slug)}
                    testId={`industry-filter-${slug}`}
                  >
                    {industryLabel(slug)}
                  </FilterChip>
                ))}
              </div>
            </div>
          </GlassCard>

          {error && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          {!modules && !error && (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo…
            </div>
          )}
          {modules && filtered.length === 0 && (
            <GlassCard tone="default" border="soft" className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">
                No hay módulos con esos filtros. Probá con "Todos".
              </p>
            </GlassCard>
          )}

          {modules &&
            Object.entries(grouped).map(([industry, items]) => {
              const meta = INDUSTRY_META[industry];
              const Icon = meta?.icon;
              return (
                <div key={industry} className="space-y-5">
                  <div className="flex items-center gap-3">
                    {Icon && (
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]", meta?.accent)}>
                        <Icon className="h-4 w-4" />
                      </span>
                    )}
                    <h3 className="font-display text-xl font-semibold text-slate-50">
                      {industryLabel(industry)}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {items.length} {items.length === 1 ? "módulo" : "módulos"}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((m) => {
                      const isPaid = Number(m.monthlyPrice) > 0;
                      return (
                        <GlassCard
                          key={m.id}
                          tone="default"
                          border="gradient"
                          data-testid={`landing-module-${m.slug}`}
                          className="group flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:glow-cyan-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-display text-base font-semibold leading-tight text-slate-50">
                              {m.name}
                            </h4>
                            <StatusPill tone={isPaid ? "info" : "success"} size="sm">
                              {isPaid ? "Cotizable" : "Demo gratis"}
                            </StatusPill>
                          </div>
                          <div className="font-mono text-sm font-semibold text-cyan-200">
                            {fmtPrice(m.monthlyPrice, m.currency)}
                          </div>
                          {m.description && (
                            <p className="flex-1 text-sm leading-relaxed text-slate-400">
                              {m.description}
                            </p>
                          )}
                          <Link href={session ? "/mis-modulos" : "/login?tab=register"}>
                            <GradientButton
                              size="sm"
                              variant={isPaid ? "primary" : "soft"}
                              className="w-full"
                              data-testid={`landing-cta-${m.slug}`}
                            >
                              {isPaid ? "Cotizar con un asesor" : "Probar demo gratis"}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </GradientButton>
                          </Link>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ===== PAGO YAPE ===== */}
      <section id="pago" className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <GlassCard tone="strong" border="gradient" className="overflow-hidden p-0">
            <div className="grid items-center gap-10 p-8 md:grid-cols-[1.1fr_1fr] md:p-12">
              <div className="flex flex-col gap-6">
                <StatusPill tone="violet" size="md" className="self-start">
                  Pago seguro vía Yape
                </StatusPill>
                <h2 className="font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
                  Pagas por Yape, activamos en{" "}
                  <span className="gradient-text-cyan-violet">minutos</span>
                </h2>
                <p className="text-base leading-relaxed text-slate-400">
                  Aceptas la cotización dentro del portal, depositas por Yape al
                  titular y Cecilia te activa los módulos casi al instante. Sin
                  tarjetas, sin trámites bancarios, sin tiempos muertos.
                </p>
                <ul className="space-y-3 text-sm">
                  {[
                    <>Titular: <strong className="text-slate-100">Miguel Angel Montero Garcia</strong></>,
                    <>Yape: <span className="font-mono font-semibold text-cyan-200">991 740 590</span></>,
                    "Avisanos por el chat de Cecilia y activamos en el momento.",
                    "Toda cotización trae IGV 18 % incluido y comprobante en PDF.",
                  ].map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                      <span className="text-slate-300">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative flex justify-center">
                <div className="absolute -inset-6 rounded-full bg-mesh-cyan opacity-70 blur-2xl" aria-hidden />
                <div className="relative rounded-3xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur-xl glow-cyan-sm">
                  <YapeQR size={220} showCaption={false} />
                  <div className="mt-3 text-center">
                    <div className="font-display text-sm font-semibold text-slate-50">
                      Yape · Miguel Montero
                    </div>
                    <div className="font-mono text-base font-semibold text-cyan-200">
                      991 740 590
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative border-b border-white/5">
        <BlueprintBackdrop intensity="subtle" className="">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[inset_0_0_18px_rgba(34,211,238,0.18)]">
              <Headphones className="h-6 w-6" />
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
              ¿Listo para automatizar tu negocio?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
              Crea tu cuenta gratis y conversá con Cecilia ahora. Sin compromiso,
              sin tarjeta. Si no encuentras el módulo que buscas, lo armamos para
              tu rubro.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login?tab=register">
                <GradientButton size="lg" variant="primary" data-testid="cta-final-register">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </GradientButton>
              </Link>
              <a
                href="#catalogo"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("catalogo");
                }}
              >
                <GradientButton size="lg" variant="outline" data-testid="cta-final-catalog">
                  Explorar catálogo
                </GradientButton>
              </a>
            </div>
          </div>
        </BlueprintBackdrop>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-5">
          <div>
            <BrandLogo size="lg" />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-400">
              Automation OS · Arequipa, Perú. IA aplicada al negocio peruano,
              módulo por módulo.
            </p>
            <div className="mt-4">
              <StatusPill tone="success" size="sm">
                Online · 99.9 % uptime
              </StatusPill>
            </div>
          </div>
          <FooterCol
            title="Producto"
            items={[
              { href: "#industrias", label: "Industrias" },
              { href: "#catalogo", label: "Catálogo" },
              { href: "#proceso", label: "Cómo funciona" },
              { href: "#pago", label: "Cómo pagar" },
            ]}
          />
          <FooterCol
            title="Empresa"
            items={[
              { href: "/nosotros", label: "Nosotros", internal: true },
              { href: "/nosotros#mision", label: "Misión", internal: true },
              { href: "/nosotros#vision", label: "Visión", internal: true },
              { href: "/nosotros#valores", label: "Valores", internal: true },
            ]}
          />
          <FooterCol
            title="Cuenta"
            items={[
              { href: "/login", label: "Iniciar sesión", internal: true },
              { href: "/login?tab=register", label: "Crear cuenta", internal: true },
              { href: "/mis-modulos", label: "Mis módulos", internal: true },
              { href: "/mis-cotizaciones", label: "Mis cotizaciones", internal: true },
            ]}
          />
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Contacto
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>Miguel Angel Montero Garcia</li>
              <li>
                <a
                  href="mailto:axyntraxautomation@gmail.com"
                  className="text-slate-400 transition-colors hover:text-cyan-200"
                >
                  axyntraxautomation@gmail.com
                </a>
              </li>
              <li className="font-mono text-cyan-200">Yape · 991 740 590</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-[11px] text-slate-500">
            <div>© {new Date().getFullYear()} AXYNTRAX AUTOMATION · Todos los derechos reservados</div>
            <div className="font-mono">AXYNTRAX OS · v1.2 · Arequipa, Perú</div>
          </div>
        </div>
      </footer>

      <SalesBotWidget scope="public" />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_-4px_rgba(34,211,238,0.5)]"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-cyan-100",
      )}
    >
      {children}
    </button>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; internal?: boolean }[];
}) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((it) =>
          it.internal ? (
            <li key={it.href}>
              <Link
                href={it.href}
                className="text-slate-300 transition-colors hover:text-cyan-200"
              >
                {it.label}
              </Link>
            </li>
          ) : (
            <li key={it.href}>
              <a
                href={it.href}
                className="text-slate-300 transition-colors hover:text-cyan-200"
              >
                {it.label}
              </a>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
