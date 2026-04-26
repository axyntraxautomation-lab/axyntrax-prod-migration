import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLogout, useGetCurrentUser } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Users,
  Key,
  Wallet,
  Mail,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Megaphone,
  Cpu,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GradientButton } from "@/components/ui/gradient-button";
import { StatusPill } from "@/components/ui/status-pill";
import { JarvisAvatar } from "@/components/ui/jarvis-avatar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavSection = { title: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operaciones",
    items: [
      { href: "/", label: "Centro de mando", icon: LayoutDashboard },
      { href: "/inbox", label: "Bandeja JARVIS", icon: MessageSquare },
      { href: "/crm", label: "CRM", icon: Users },
    ],
  },
  {
    title: "Comercial",
    items: [
      { href: "/keygen", label: "KeyGen", icon: Key },
      { href: "/finanzas", label: "Finanzas", icon: Wallet },
      { href: "/email", label: "Email", icon: Mail },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/publicidad", label: "Publicidad", icon: Megaphone },
    ],
  },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const logoutMutation = useLogout();
  const { data: user } = useGetCurrentUser();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col gap-6 px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-1.5">
          <div className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
            {section.title}
          </div>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block"
                  onClick={onNavigate}
                  data-testid={`nav-${item.href.replace(/\//g, "-") || "home"}`}
                >
                  <div
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/15 via-cyan-500/8 to-transparent text-cyan-100 shadow-[inset_0_0_20px_rgba(34,211,238,0.12)]"
                        : "text-slate-400 hover:bg-white/[0.03] hover:text-cyan-100",
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-300 to-violet-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-cyan-300"
                          : "text-slate-500 group-hover:text-cyan-300",
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="space-y-1.5">
        <div className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-violet-300">
          Núcleo IA
        </div>
        <Link
          href="/axyn-core"
          className="block"
          onClick={onNavigate}
          data-testid="nav--axyn-core"
        >
          <div
            className={cn(
              "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-violet-400/25 px-3 py-3 transition-all duration-200",
              location === "/axyn-core"
                ? "bg-gradient-to-r from-violet-500/25 via-cyan-500/15 to-transparent shadow-[0_0_24px_-8px_rgba(168,85,247,0.5)]"
                : "bg-gradient-to-r from-violet-500/10 via-cyan-500/5 to-transparent hover:from-violet-500/20 hover:via-cyan-500/10",
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-mesh-cyan opacity-40"
            />
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg gradient-cyan-violet font-display text-[11px] font-bold text-slate-950 shadow-[0_4px_12px_-2px_rgba(34,211,238,0.5)]">
              A
            </span>
            <div className="relative leading-tight">
              <div className="font-display text-sm font-semibold text-slate-50">
                AXYN CORE
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-violet-200">
                Núcleo IA · principal
              </div>
            </div>
            <Cpu className="relative ml-auto h-4 w-4 text-violet-200" />
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-mesh-soft opacity-60"
      />

      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.04] bg-background/65 px-4 backdrop-blur-xl md:px-6">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-white/5 bg-slate-950/95 p-0 backdrop-blur-xl"
            >
              <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-cyan-violet font-display text-sm font-bold text-slate-950">
                  AX
                </span>
                <div className="leading-tight">
                  <div className="font-display text-sm font-semibold text-slate-50">
                    JARVIS
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                    Cabina IA
                  </div>
                </div>
              </div>
              <NavLinks />
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/" className="hidden items-center gap-3 md:flex">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-cyan-violet font-display text-sm font-bold text-slate-950 shadow-[0_8px_24px_-8px_rgba(34,211,238,0.5)]">
            AX
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"
            />
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight text-slate-50">
              JARVIS
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
              IA AXYNTRAX · Cabina
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="h-5 w-px bg-white/10" />
          <StatusPill tone="success" size="sm">
            Sistema operativo
          </StatusPill>
          <div className="hidden items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-1 text-[11px] xl:flex">
            <Wallet className="h-3 w-3 text-cyan-300" />
            <span className="text-slate-400">Yape:</span>
            <span className="font-mono font-semibold text-cyan-100">
              991 740 590
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2.5 md:flex">
            <JarvisAvatar size="sm" />
            <div className="text-right leading-tight">
              <div className="font-display text-sm font-semibold text-slate-50">
                {user?.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                {user?.role}
              </div>
            </div>
          </div>

          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-white/[0.04] hover:text-cyan-200"
              data-testid="link-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <GradientButton
            variant="outline"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </GradientButton>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.04] bg-slate-950/40 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex-1 overflow-y-auto py-2">
            <NavLinks />
          </div>
          <div className="border-t border-white/5 p-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-violet-500/5 to-transparent p-3">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-cyan-300" />
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-200">
                  Pulso operativo
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-display text-lg font-semibold text-slate-50">
                  99.9%
                </span>
                <span className="text-[10px] text-slate-400">uptime</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-900/80">
                <div className="h-full w-[99%] gradient-cyan-violet shimmer-overlay" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto min-h-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pt-8">
            {children}
          </div>
        </main>
      </div>

      {/* Global Footer */}
      <footer className="fixed bottom-0 z-20 w-full border-t border-white/[0.04] bg-background/80 px-6 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 text-[10px] text-slate-500 md:flex-row">
          <div className="font-mono uppercase tracking-[0.16em]">
            Miguel Montero · CEO · axyntrax-automation.com
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-3 w-3 text-cyan-300" />
            <span>Depósitos Yape · Miguel Montero ·</span>
            <span className="font-mono font-semibold text-cyan-100">
              991 740 590
            </span>
          </div>
          <div className="font-mono uppercase tracking-[0.16em]">
            JARVIS · © 2026 AXYNTRAX
          </div>
        </div>
      </footer>
    </div>
  );
}
