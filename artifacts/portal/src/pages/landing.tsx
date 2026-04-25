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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { portalApi, type CatalogModule } from "@/lib/portal-api";
import { SalesBotWidget } from "@/components/sales-bot-widget";
import { YapeQR } from "@/components/yape-qr";
import { useAuth } from "@/lib/auth-context";

const INDUSTRY_META: Record<
  string,
  { label: string; icon: typeof Stethoscope; gradient: string }
> = {
  medical: {
    label: "Medicina",
    icon: Stethoscope,
    gradient: "from-cyan-500/20 to-cyan-500/0",
  },
  dental: {
    label: "Dental",
    icon: Smile,
    gradient: "from-sky-500/20 to-sky-500/0",
  },
  veterinary: {
    label: "Veterinaria",
    icon: PawPrint,
    gradient: "from-emerald-500/20 to-emerald-500/0",
  },
  legal: {
    label: "Legal",
    icon: Scale,
    gradient: "from-violet-500/20 to-violet-500/0",
  },
  condo: {
    label: "Condominios",
    icon: Building2,
    gradient: "from-amber-500/20 to-amber-500/0",
  },
};

function industryLabel(slug: string): string {
  return INDUSTRY_META[slug]?.label ?? slug;
}

function fmtPrice(n: string, c: string) {
  const num = Number(n);
  if (!num) return "Demo gratuita por 30 días";
  return `${c} ${num.toFixed(2)} / mes`;
}

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-cyan-400">
              AXYNTRAX
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground hidden sm:inline">
              Automation · Arequipa, Perú
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            <a
              href="#industrias"
              className="hover:text-foreground transition"
              data-testid="nav-industrias"
            >
              Industrias
            </a>
            <a
              href="#catalogo"
              className="hover:text-foreground transition"
              data-testid="nav-catalogo"
            >
              Catálogo
            </a>
            <a
              href="#proceso"
              className="hover:text-foreground transition"
              data-testid="nav-proceso"
            >
              Cómo funciona
            </a>
            <a
              href="#pago"
              className="hover:text-foreground transition"
              data-testid="nav-pago"
            >
              Pago
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Link href={session.kind === "admin" ? "/admin" : "/mis-modulos"}>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="link-portal"
                >
                  Ir a mi portal
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="link-login">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/login?tab=register">
                  <Button size="sm" data-testid="link-register">
                    Crear cuenta
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-background to-background pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <Badge
            variant="outline"
            className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 mb-5"
          >
            IA aplicada al negocio peruano
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
            Automatizá tu consultorio,
            <br className="hidden md:block" /> estudio o condominio
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Módulos SaaS listos para medicina, dental, veterinaria, legal y
            condominios. <strong className="text-foreground">JARVIS</strong>,
            nuestra IA principal, te arma la cotización al instante y activamos
            en minutos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login?tab=register">
              <Button size="lg" data-testid="cta-register">
                Crear cuenta y probar
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <a href="#catalogo">
              <Button size="lg" variant="outline" data-testid="cta-explore">
                Ver módulos
              </Button>
            </a>
          </div>

          {/* KPIs */}
          {modules && (
            <div className="mt-10 grid grid-cols-3 max-w-xl mx-auto gap-3 text-center">
              <div className="rounded-lg border border-border bg-card/50 px-3 py-3">
                <div
                  className="text-2xl font-bold text-cyan-400"
                  data-testid="stat-modules"
                >
                  {stats.modules}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Módulos activos
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card/50 px-3 py-3">
                <div
                  className="text-2xl font-bold text-cyan-400"
                  data-testid="stat-industries"
                >
                  {stats.industries}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Industrias
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card/50 px-3 py-3">
                <div className="text-2xl font-bold text-cyan-400">24/7</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Soporte JARVIS
                </div>
              </div>
            </div>
          )}

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto mt-12 text-left">
            <Card className="bg-card/40 border-border">
              <CardHeader className="pb-2">
                <Bot className="h-5 w-5 text-cyan-400 mb-2" />
                <CardTitle className="text-base">Cotización con IA</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                JARVIS analiza tu rubro y arma una propuesta detallada en PDF
                con IGV incluido.
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border">
              <CardHeader className="pb-2">
                <Sparkles className="h-5 w-5 text-cyan-400 mb-2" />
                <CardTitle className="text-base">
                  Activación inmediata
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Aceptás la cotización, pagás por Yape y empezamos a trabajar
                en minutos.
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border">
              <CardHeader className="pb-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400 mb-2" />
                <CardTitle className="text-base">Datos protegidos</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Cifrado AES-256, auditoría y respaldos. Cumplimos con la Ley
                29733 (Perú).
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* INDUSTRIAS */}
      <section
        id="industrias"
        className="border-t border-border bg-card/20"
      >
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <Badge
              variant="outline"
              className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 mb-3"
            >
              Industrias atendidas
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Hecho para profesionales peruanos
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
              Cada módulo está pensado para un rubro específico. Tu negocio
              recibe IA entrenada con su jerga y normativa.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(INDUSTRY_META).map(([slug, meta]) => {
              const count = (modules ?? []).filter(
                (m) => m.industry === slug,
              ).length;
              const Icon = meta.icon;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    setIndustryFilter(slug);
                    setFilter("all");
                    document
                      .getElementById("catalogo")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-testid={`industry-card-${slug}`}
                  className={`group relative overflow-hidden rounded-lg border border-border bg-card p-5 text-left transition hover:border-cyan-500/50 hover:scale-[1.02]`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-50 group-hover:opacity-100 transition`}
                  />
                  <div className="relative">
                    <Icon className="h-7 w-7 text-cyan-400 mb-3" />
                    <div className="font-semibold text-sm">{meta.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {count} {count === 1 ? "módulo" : "módulos"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section id="proceso" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <Badge
              variant="outline"
              className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 mb-3"
            >
              Cómo funciona
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              De prospecto a cliente activo en 4 pasos
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              {
                n: "1",
                icon: CheckCircle2,
                title: "Creá tu cuenta",
                body: "Registro gratuito en menos de un minuto. Solo email y celular.",
              },
              {
                n: "2",
                icon: Bot,
                title: "Hablá con JARVIS",
                body: "Contale tu rubro y JARVIS te recomienda los módulos justos.",
              },
              {
                n: "3",
                icon: FileText,
                title: "Recibí tu cotización",
                body: "Cotización formal con IGV 18% en PDF, descargable y por correo.",
              },
              {
                n: "4",
                icon: Wallet,
                title: "Pagá por Yape y listo",
                body: "Depositás vía Yape, JARVIS activa tus módulos en minutos.",
              },
            ].map(({ n, icon: Icon, title, body }) => (
              <div
                key={n}
                className="relative rounded-lg border border-border bg-card p-5"
                data-testid={`process-step-${n}`}
              >
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-cyan-500 text-background font-bold flex items-center justify-center text-sm">
                  {n}
                </div>
                <Icon className="h-6 w-6 text-cyan-400 mb-3" />
                <div className="font-semibold mb-1">{title}</div>
                <p className="text-xs text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section
        id="catalogo"
        className="border-t border-border bg-card/20"
      >
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
          <div className="text-center">
            <Badge
              variant="outline"
              className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 mb-3"
            >
              Catálogo
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Todos los módulos disponibles
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
              Demos sin precio se descargan gratis por 30 días. Los módulos
              cotizables los arma JARVIS y te llegan por correo en PDF.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                data-testid="filter-all"
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={filter === "paid" ? "default" : "outline"}
                onClick={() => setFilter("paid")}
                data-testid="filter-paid"
              >
                Cotizables
              </Button>
              <Button
                size="sm"
                variant={filter === "free" ? "default" : "outline"}
                onClick={() => setFilter("free")}
                data-testid="filter-free"
              >
                Demos gratis
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">
                Industria
              </span>
              <Button
                size="sm"
                variant={industryFilter === "all" ? "default" : "outline"}
                onClick={() => setIndustryFilter("all")}
                data-testid="industry-filter-all"
              >
                Todas
              </Button>
              {industriesList.map((slug) => (
                <Button
                  key={slug}
                  size="sm"
                  variant={industryFilter === slug ? "default" : "outline"}
                  onClick={() => setIndustryFilter(slug)}
                  data-testid={`industry-filter-${slug}`}
                >
                  {industryLabel(slug)}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          {!modules && !error && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo...
            </div>
          )}

          {modules && filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No hay módulos con esos filtros. Probá con "Todos".
            </div>
          )}

          {modules &&
            Object.entries(grouped).map(([industry, items]) => {
              const meta = INDUSTRY_META[industry];
              const Icon = meta?.icon;
              return (
                <div key={industry} className="space-y-4">
                  <div className="flex items-center gap-3 pt-2">
                    {Icon && <Icon className="h-5 w-5 text-cyan-400" />}
                    <h3 className="text-lg font-semibold">
                      {industryLabel(industry)}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({items.length})
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((m) => {
                      const isPaid = Number(m.monthlyPrice) > 0;
                      return (
                        <Card
                          key={m.id}
                          data-testid={`landing-module-${m.slug}`}
                          className="flex flex-col hover:border-cyan-500/40 transition"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base">
                                {m.name}
                              </CardTitle>
                              {isPaid ? (
                                <Badge
                                  variant="outline"
                                  className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 whitespace-nowrap"
                                >
                                  Cotizable
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 whitespace-nowrap"
                                >
                                  Demo gratis
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-cyan-300/90 font-medium">
                              {fmtPrice(m.monthlyPrice, m.currency)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 flex-1 flex flex-col">
                            {m.description && (
                              <p className="text-sm text-muted-foreground flex-1">
                                {m.description}
                              </p>
                            )}
                            <Link
                              href={
                                session
                                  ? "/mis-modulos"
                                  : "/login?tab=register"
                              }
                            >
                              <Button
                                size="sm"
                                variant={isPaid ? "default" : "outline"}
                                className="w-full"
                                data-testid={`landing-cta-${m.slug}`}
                              >
                                {isPaid
                                  ? "Cotizar con un asesor"
                                  : "Probar demo gratis"}
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* PAGO YAPE */}
      <section id="pago" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-300 border-purple-500/30 mb-3"
              >
                Pago seguro
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                Pagás por Yape, activamos en minutos
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Aceptás la cotización dentro del portal, depositás por Yape al
                titular y JARVIS activa tus módulos casi al instante. Sin
                tarjetas, sin trámites bancarios, sin tiempos muertos.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                  <span>
                    Titular: <strong>Miguel Angel Montero Garcia</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                  <span>
                    Yape: <strong className="font-mono">991 740 590</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                  <span>
                    Avisanos por el chat de JARVIS y activamos en el momento.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                  <span>
                    Toda cotización trae IGV 18 % incluido y comprobante en PDF.
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <YapeQR size={200} showCaption={false} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-border bg-gradient-to-b from-cyan-500/5 to-background">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <Headphones className="h-10 w-10 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            ¿Listo para automatizar tu negocio?
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Crea tu cuenta gratis y conversá con JARVIS ahora. Sin compromiso,
            sin tarjeta. Si no encontrás el módulo que buscás, lo armamos para
            tu rubro.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login?tab=register">
              <Button size="lg" data-testid="cta-final-register">
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <a href="#catalogo">
              <Button size="lg" variant="outline" data-testid="cta-final-catalog">
                Explorar catálogo
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="text-base font-bold tracking-tight text-cyan-400 mb-2">
              AXYNTRAX
            </div>
            <p className="text-xs text-muted-foreground">
              Automation · Arequipa, Perú. IA aplicada al negocio peruano,
              módulo por módulo.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Producto
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#industrias" className="hover:text-cyan-400">
                  Industrias
                </a>
              </li>
              <li>
                <a href="#catalogo" className="hover:text-cyan-400">
                  Catálogo
                </a>
              </li>
              <li>
                <a href="#proceso" className="hover:text-cyan-400">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#pago" className="hover:text-cyan-400">
                  Cómo pagar
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Cuenta
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/login" className="hover:text-cyan-400">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link
                  href="/login?tab=register"
                  className="hover:text-cyan-400"
                >
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link href="/mis-modulos" className="hover:text-cyan-400">
                  Mis módulos
                </Link>
              </li>
              <li>
                <Link
                  href="/mis-cotizaciones"
                  className="hover:text-cyan-400"
                >
                  Mis cotizaciones
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Contacto
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>Miguel Angel Montero Garcia</li>
              <li>
                <a
                  href="mailto:axyntraxautomation@gmail.com"
                  className="hover:text-cyan-400"
                >
                  axyntraxautomation@gmail.com
                </a>
              </li>
              <li className="font-mono">Yape · 991 740 590</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-4 text-[11px] text-muted-foreground flex flex-wrap justify-between gap-2">
            <div>© {new Date().getFullYear()} AXYNTRAX AUTOMATION</div>
            <div>Hecho con IA en Arequipa, Perú</div>
          </div>
        </div>
      </footer>

      <SalesBotWidget scope="public" />
    </div>
  );
}
