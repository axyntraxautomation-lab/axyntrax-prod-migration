import { Link, useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function PortalHeader() {
  const { session, logout } = useAuth();
  const [location] = useLocation();

  const isAdmin = session?.kind === "admin";
  const navItems = isAdmin
    ? [
        { href: "/admin", label: "Solicitudes" },
        { href: "/admin/clientes", label: "Clientes" },
        { href: "/admin/catalogo", label: "Catálogo" },
      ]
    : [
        { href: "/mis-modulos", label: "Mis módulos" },
        { href: "/catalogo", label: "Catálogo" },
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
    <header className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href={isAdmin ? "/admin" : "/mis-modulos"} className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}axyntrax-logo.jpeg`}
            alt="AXYNTRAX"
            className="h-9 w-9 rounded object-cover"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">AXYNTRAX AUTOMATION</div>
            <div className="text-xs text-muted-foreground">Portal de clientes</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((it) => {
            const active = location === it.href;
            return (
              <Link key={it.href} href={it.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={
                    active
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }
                  data-testid={`nav-${it.href.replace(/\//g, "-")}`}
                >
                  {it.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="text-right hidden sm:block"
            data-testid="header-user-info"
          >
            <div
              className="text-sm font-medium leading-tight"
              data-testid="header-user-name"
            >
              {displayName}
            </div>
            <div
              className="text-xs text-muted-foreground leading-tight"
              data-testid="header-user-email"
            >
              {subtitle}
            </div>
            {tertiary ? (
              <div
                className="text-xs text-muted-foreground leading-tight"
                data-testid="header-user-phone"
              >
                {tertiary}
              </div>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void logout().then(() => {
                window.location.href = `${import.meta.env.BASE_URL}login`.replace(/\/+/g, "/");
              });
            }}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
