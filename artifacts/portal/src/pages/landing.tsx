import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, ArrowRight, Sparkles, ShieldCheck, Bot } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";

function fmtPrice(n: string, c: string) {
  const num = Number(n);
  if (!num) return "Demo gratuita";
  return `${c} ${num.toFixed(2)} / mes`;
}

export default function LandingPage() {
  const [modules, setModules] = useState<CatalogModule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portal/public/catalog")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((rows) => {
        if (!cancelled) setModules(rows as CatalogModule[]);
      })
      .catch(() => {
        // Si el endpoint público todavía no existe, intentamos el privado
        // pero solo si hay sesión.
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

  const grouped = (modules ?? []).reduce<Record<string, CatalogModule[]>>(
    (acc, m) => {
      acc[m.industry] = acc[m.industry] ? [...acc[m.industry], m] : [m];
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-cyan-400">
              AXYNTRAX
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground hidden sm:inline">
              Automation · Arequipa, Perú
            </span>
          </div>
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

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <Badge
          variant="outline"
          className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 mb-4"
        >
          IA aplicada al negocio peruano
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Automatizá tu consultorio, estudio o condominio
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Módulos listos para medicina, derecho, dental, veterinaria y
          condominios. Probá demos gratis o pedile a JARVIS, nuestra IA
          principal, una cotización al instante.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12 text-left">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-cyan-400 mt-1" />
            <div>
              <div className="font-medium">Cotización con IA</div>
              <div className="text-xs text-muted-foreground">
                JARVIS analiza tu rubro y arma la propuesta.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-cyan-400 mt-1" />
            <div>
              <div className="font-medium">Activación inmediata</div>
              <div className="text-xs text-muted-foreground">
                Aceptás la cotización y empezamos.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan-400 mt-1" />
            <div>
              <div className="font-medium">Datos protegidos</div>
              <div className="text-xs text-muted-foreground">
                Cifrado, auditoría y respaldo siempre activos.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalogo"
        className="max-w-6xl mx-auto px-6 py-12 space-y-8"
      >
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Catálogo de módulos
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Demos sin precio se descargan gratis por 30 días. Los pagos los
            cotiza JARVIS y te llegan por correo en PDF. Reservá depositando
            por Yape al 991 740 590 (Miguel Montero).
          </p>
        </div>

        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        {!modules && !error && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo...
          </div>
        )}

        {modules &&
          Object.entries(grouped).map(([industry, items]) => (
            <div key={industry} className="space-y-3">
              <h3 className="text-lg font-medium capitalize">{industry}</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => {
                  const isPaid = Number(m.monthlyPrice) > 0;
                  return (
                    <Card
                      key={m.id}
                      data-testid={`landing-module-${m.slug}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{m.name}</CardTitle>
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
                        <CardDescription>
                          {fmtPrice(m.monthlyPrice, m.currency)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {m.description && (
                          <p className="text-sm text-muted-foreground">
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
          ))}
      </section>

      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted-foreground flex flex-wrap gap-2 justify-between">
          <div>AXYNTRAX AUTOMATION · Arequipa, Perú</div>
          <div>Miguel Montero · contacto: axyntraxautomation@gmail.com</div>
        </div>
      </footer>

      <SalesBotWidget scope="public" />
    </div>
  );
}
