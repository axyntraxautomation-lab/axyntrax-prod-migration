import { Link, useLocation } from "wouter";
import { LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

export function PortalHeader() {
  const { session, logout } = useAuth();
  const [location] = useLocation();

  const isAdmin = session?.kind === "admin";
  const navItems = isAdmin
    ? [
        { href: "/admin", label: "Solicitudes" },
        { href: "/admin/cotizaciones", label: "Cotizaciones" },
        { href: "/admin/clientes", label: "Clientes" },
        { href: "/admin/catalogo", label: "Catálogo" },
        { href: "/admin/seguridad", label: "Seguridad" },
        { href: "/admin/telemetria", label: "Telemetría" },
        { href: "/admin/actualizaciones", label: "Updates" },
      ]
    : [
        { href: "/mis-modulos", label: "Mis módulos" },
        { href: "/catalogo", label: "Catálogo" },
        { href: "/mis-cotizaciones", label: "Mis cotizaciones" },
      ];

  const displayName = isAdmin
    ? session.user.name
    : session?.kind === "client"
      ? session.client.name
      : "";

  const subtitle = isAdmin
    ? session.user.email
    : session?.kind === "client"
      ? session.client.email ?? "Cliente"
      : "";

  const tertiary =
    session?.kind === "client" ? session.client.phone ?? "" : "";

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-background/65 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <Link
          href={isAdmin ? "/admin" : "/mis-modulos"}
          className="flex items-center gap-3"
        >
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-cyan-violet font-display text-sm font-bold text-slate-950 shadow-[0_8px_24px_-8px_rgba(34,211,238,0.5)]">
            AX
            <span aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight text-slate-50">
              AXYNTRAX
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
              {isAdmin ? "Cabina admin" : "Portal cliente"}
            </div>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map((it) => {
            const active = location === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                data-testid={`nav-${it.href.replace(/\//g, "-")}`}
                className={cn(
                  "relative inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  active
                    ? "border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 shadow-[inset_0_0_18px_rgba(34,211,238,0.12)]"
                    : "border border-transparent text-slate-300 hover:bg-white/[0.04] hover:text-cyan-200",
                )}
              >
                {it.label}
                {active && (
                  <span
                    aria-hidden
                    className="ml-1.5 h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden text-right sm:block"
            data-testid="header-user-info"
          >
            <div
              className="font-display text-sm font-semibold leading-tight text-slate-50"
              data-testid="header-user-name"
            >
              {displayName}
            </div>
            <div
              className="text-[11px] leading-tight text-slate-400"
              data-testid="header-user-email"
            >
              {subtitle}
            </div>
            {tertiary ? (
              <div
                className="font-mono text-[10px] leading-tight text-slate-500"
                data-testid="header-user-phone"
              >
                {tertiary}
              </div>
            ) : null}
          </div>
          <StatusPill tone="success" size="sm" className="hidden md:inline-flex">
            En línea
          </StatusPill>
          <GradientButton
            variant="outline"
            size="sm"
            onClick={() => {
              void logout().then(() => {
                window.location.href = `${import.meta.env.BASE_URL}login`.replace(
                  /\/+/g,
                  "/",
                );
              });
            }}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </GradientButton>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="border-t border-white/[0.04] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 py-2">
          {navItems.map((it) => {
            const active = location === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-cyan-400/10 text-cyan-100 border border-cyan-400/30"
                    : "text-slate-400 hover:text-cyan-200",
                )}
              >
                {it.label}
                {active && <ChevronRight className="h-3 w-3" />}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
