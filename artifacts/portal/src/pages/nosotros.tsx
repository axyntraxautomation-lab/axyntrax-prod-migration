import { Link } from "wouter";
import {
  ArrowRight,
  Sparkles,
  Target,
  Compass,
  ShieldCheck,
  Heart,
  Lightbulb,
  Users,
  Bot,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import { BlueprintBackdrop } from "@/components/ui/blueprint-backdrop";

const VALORES = [
  {
    icon: Heart,
    title: "Cliente primero",
    body: "Cada módulo nace de un dolor real del negocio peruano. Si no resuelve, no se vende.",
  },
  {
    icon: ShieldCheck,
    title: "Transparencia total",
    body: "Cotizaciones formales con IGV, sin letra chica. Lo que ves es lo que pagás.",
  },
  {
    icon: Lightbulb,
    title: "Innovación útil",
    body: "Usamos IA donde mejora la operación, no como adorno. Cada función pasa la prueba del día a día.",
  },
  {
    icon: Bot,
    title: "Automatización con humanidad",
    body: "JARVIS atiende 24/7, pero el dueño del proyecto siempre es una persona accesible: Miguel.",
  },
  {
    icon: Users,
    title: "Soporte cercano",
    body: "Atención directa por WhatsApp y email. Sin tickets infinitos ni call centers despersonalizados.",
  },
  {
    icon: CheckCircle2,
    title: "Resultados medibles",
    body: "Cada módulo entrega métricas claras: ahorro de tiempo, ingresos, retención de clientes.",
  },
];

const HITOS = [
  {
    year: "2025",
    title: "Fundación",
    body: "Miguel Angel Montero Garcia funda AXYNTRAX en Arequipa con la idea de llevar IA aplicada al pequeño y mediano negocio peruano.",
  },
  {
    year: "2026",
    title: "JARVIS y catálogo modular",
    body: "Lanzamiento del centro de mando JARVIS y los primeros módulos para clínicas, consultorios dentales, veterinarias, estudios legales y administraciones de condominios.",
  },
  {
    year: "Hoy",
    title: "Operación 24/7",
    body: "Portal en producción, WhatsApp Cloud API integrado, cotizaciones y demos automáticas, soporte vía Yape para depósitos.",
  },
];

export default function Nosotros() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* HEADER simple para esta página */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-background/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-cyan-violet font-display text-sm font-bold text-slate-950 shadow-[0_8px_24px_-8px_rgba(34,211,238,0.5)]">
              AX
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"
              />
            </span>
            <div className="leading-tight">
              <div className="font-display text-base font-semibold tracking-tight text-slate-50">
                AXYNTRAX
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Automation OS
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-cyan-200"
              data-testid="nav-inicio"
            >
              Inicio
            </Link>
            <Link
              href="/nosotros"
              className="rounded-full px-3 py-1.5 text-sm text-cyan-200 bg-white/[0.04]"
              data-testid="nav-nosotros"
            >
              Nosotros
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <GradientButton variant="ghost" size="sm">
                Ingresar
              </GradientButton>
            </Link>
            <Link href="/login?tab=register">
              <GradientButton variant="primary" size="sm">
                Crear cuenta
                <ArrowRight className="h-3.5 w-3.5" />
              </GradientButton>
            </Link>
          </div>
        </div>
      </header>

      {/* INICIO / HERO */}
      <BlueprintBackdrop
        intensity="default"
        animated
        className="border-b border-white/5"
      >
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-20 sm:pt-24">
          <div className="flex flex-col items-center text-center gap-6">
            <StatusPill tone="info" size="md">
              <Sparkles className="h-3.5 w-3.5" />
              Nosotros · AXYNTRAX AUTOMATION
            </StatusPill>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl md:text-[3.4rem] max-w-3xl">
              Automatización con{" "}
              <span className="gradient-text-cyan-violet">IA peruana</span>,
              hecha por gente que entiende el negocio local.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              AXYNTRAX nació en Arequipa con una premisa clara: la inteligencia
              artificial tiene que servir al negocio del barrio, no solo a las
              corporaciones. Construimos JARVIS y un catálogo modular para que
              clínicas, estudios legales, consultorios dentales, veterinarias y
              administraciones de condominios tengan un centro de operaciones
              que nunca duerme.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/login?tab=register">
                <GradientButton size="lg" variant="primary">
                  Probar AXYNTRAX
                  <ArrowRight className="h-4 w-4" />
                </GradientButton>
              </Link>
              <a
                href="mailto:axyntraxautomation@gmail.com"
                className="text-sm text-slate-400 transition-colors hover:text-cyan-200"
              >
                Hablar con Miguel directamente →
              </a>
            </div>
          </div>
        </div>
      </BlueprintBackdrop>

      {/* MISIÓN + VISIÓN */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard id="mision" className="p-8 scroll-mt-24">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
                <Target className="h-5 w-5 text-cyan-300" />
              </span>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                  Misión
                </div>
                <h2 className="font-display text-2xl font-semibold text-slate-50">
                  Para qué existimos
                </h2>
              </div>
            </div>
            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Hacer accesible la automatización con inteligencia artificial al
              negocio peruano, módulo por módulo, sin contratos eternos ni jerga
              técnica. Que cualquier profesional pueda activar un asistente IA
              en minutos, pagar lo justo y crecer con tecnología que entiende
              cómo se trabaja en Perú.
            </p>
          </GlassCard>

          <GlassCard id="vision" className="p-8 scroll-mt-24">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/10">
                <Compass className="h-5 w-5 text-violet-300" />
              </span>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300">
                  Visión
                </div>
                <h2 className="font-display text-2xl font-semibold text-slate-50">
                  A dónde vamos
                </h2>
              </div>
            </div>
            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Convertirnos en el sistema operativo de automatización por defecto
              del profesional independiente y la pyme peruana. Que JARVIS sea
              tan natural como WhatsApp para gestionar pacientes, expedientes,
              comunicaciones y operaciones diarias. Empezamos en Arequipa,
              pensamos en todo el país.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* VALORES */}
      <section
        id="valores"
        className="border-y border-white/[0.04] bg-white/[0.01] scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <StatusPill tone="info" size="sm" className="mx-auto">
              Valores
            </StatusPill>
            <h2 className="mt-4 font-display text-3xl font-semibold text-slate-50 sm:text-4xl">
              Cómo trabajamos cada día
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-slate-400">
              Seis principios que guían cada módulo, cada cotización y cada
              conversación con clientes.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {VALORES.map((v) => {
              const Icon = v.icon;
              return (
                <GlassCard key={v.title} className="p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06]">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-50">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {v.body}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* HISTORIA / HITOS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <StatusPill tone="info" size="sm" className="mx-auto">
            Nuestra historia
          </StatusPill>
          <h2 className="mt-4 font-display text-3xl font-semibold text-slate-50 sm:text-4xl">
            De una idea en Arequipa al centro de mando JARVIS
          </h2>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/40 via-violet-400/30 to-transparent md:left-1/2" />
          <div className="space-y-8">
            {HITOS.map((h, i) => (
              <div
                key={h.year}
                className={`relative flex flex-col gap-4 md:flex-row md:items-start ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="md:w-1/2 md:px-8">
                  <GlassCard className="p-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                      {h.year}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-slate-50">
                      {h.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {h.body}
                    </p>
                  </GlassCard>
                </div>
                <div className="absolute left-4 top-3 h-3 w-3 rounded-full border-2 border-cyan-300 bg-background md:left-1/2 md:-translate-x-1/2" />
                <div className="md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDADOR / CONTACTO */}
      <section className="border-t border-white/[0.04] bg-white/[0.01]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-[1fr_1fr] items-center">
            <div>
              <StatusPill tone="info" size="sm">
                Fundador & CEO
              </StatusPill>
              <h2 className="mt-4 font-display text-3xl font-semibold text-slate-50 sm:text-4xl">
                Miguel Angel Montero Garcia
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Detrás de AXYNTRAX hay una persona, no un call center. Miguel
                lidera producto, ventas y soporte. Si tenés dudas, lo escribís
                directo a él. Esa es nuestra ventaja: rapidez de un equipo
                chico con tecnología de empresa grande.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <MapPin className="h-4 w-4 text-cyan-300" />
                  Arequipa, Perú
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Mail className="h-4 w-4 text-cyan-300" />
                  <a
                    href="mailto:axyntraxautomation@gmail.com"
                    className="transition-colors hover:text-cyan-200"
                  >
                    axyntraxautomation@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Phone className="h-4 w-4 text-cyan-300" />
                  <span className="font-mono">
                    Yape · WhatsApp 991 740 590
                  </span>
                </div>
              </div>
            </div>
            <GlassCard className="p-8">
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                Industrias que atendemos hoy
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  Medicina & clínicas
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  Odontología
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  Veterinaria
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  Estudios legales
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 col-span-2">
                  Administración de condominios
                </li>
              </ul>
              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  Modelo híbrido
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Módulos con precio mensual se cotizan formalmente con IGV 18 %
                  vía PDF + email. Módulos sin precio se prueban gratis 30 días.
                  Pago por Yape al titular, depósito directo, activación en
                  minutos.
                </p>
              </div>
            </GlassCard>
          </div>
          <div className="mt-12 flex justify-center">
            <Link href="/login?tab=register">
              <GradientButton size="lg" variant="primary">
                Empezá con AXYNTRAX
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER mínimo */}
      <footer className="border-t border-white/[0.04]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} AXYNTRAX AUTOMATION · Todos los
            derechos reservados
          </div>
          <Link
            href="/"
            className="text-slate-400 transition-colors hover:text-cyan-200"
          >
            Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
