import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Info,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  portalApi,
  type CatalogModule,
  type ClientModuleRow,
} from "@/lib/portal-api";

const STATUS_BADGE: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  activo: {
    label: "Activo",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: Clock,
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    icon: XCircle,
  },
  vencido: {
    label: "Vencida",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: XCircle,
  },
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function ClientModulesPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [mine, setMine] = useState<ClientModuleRow[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogModule[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyKey = async (id: number, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
      toast({
        title: "Clave copiada",
        description: "Pegala donde necesités activar el módulo.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "No se pudo copiar",
        description: "Copiá manualmente la clave del módulo.",
      });
    }
  };

  const reload = async () => {
    setLoadError(null);
    try {
      const [m, c] = await Promise.all([
        portalApi.myModules(),
        portalApi.catalog(),
      ]);
      setMine(m);
      setCatalog(c);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error de carga");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  if (loadError) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button onClick={() => void reload()}>Reintentar</Button>
      </div>
    );
  }

  if (!mine || !catalog) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const blockedIds = new Set(
    mine
      .filter((r) => r.status === "activo" || r.status === "pendiente")
      .map((r) => r.moduleId),
  );

  const filtered = catalog.filter(
    (m) =>
      !filter ||
      m.name.toLowerCase().includes(filter.toLowerCase()) ||
      m.industry.toLowerCase().includes(filter.toLowerCase()) ||
      m.slug.toLowerCase().includes(filter.toLowerCase()),
  );

  const requestModule = async (id: number) => {
    setBusyId(id);
    try {
      await portalApi.requestModule(id);
      toast({
        title: "Solicitud enviada",
        description: "El equipo de AXYNTRAX revisará y activará tu módulo pronto.",
      });
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo solicitar",
        description: err instanceof Error ? err.message : "Reintentá",
      });
    } finally {
      setBusyId(null);
    }
  };

  const clientName = session?.kind === "client" ? session.client.name : "";
  const clientCompany =
    session?.kind === "client" ? session.client.company : null;

  const expiringSoon = mine.filter((r) => {
    if (r.status !== "activo") return false;
    const d = daysUntil(r.expiresAt);
    return d !== null && d <= 3 && d >= 0;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {clientName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {clientCompany
            ? `${clientCompany} · Gestioná tus módulos AXYNTRAX`
            : "Gestioná tus módulos AXYNTRAX"}
        </p>
      </div>

      {expiringSoon.length > 0 ? (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 flex gap-3"
          data-testid="banner-expiring-soon"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-medium">
              {expiringSoon.length === 1
                ? "Tenés 1 demo por vencer"
                : `Tenés ${expiringSoon.length} demos por vencer`}
            </div>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {expiringSoon.map((r) => {
                const d = daysUntil(r.expiresAt);
                return (
                  <li key={r.id}>
                    {r.moduleName} —{" "}
                    {d === 0
                      ? "vence hoy"
                      : d === 1
                        ? "vence mañana"
                        : `quedan ${d} días`}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Mis módulos</h2>
        {mine.length === 0 ? (
          <Card>
            <CardContent className="py-8 flex items-center gap-3 text-muted-foreground">
              <Info className="h-5 w-5" />
              <span>
                Todavía no tenés demos activas. Explorá el catálogo abajo y
                solicitá los módulos que querés probar.
              </span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((row) => {
              const cfg = STATUS_BADGE[row.status] ?? STATUS_BADGE.pendiente;
              const Icon = cfg.icon;
              const days = daysUntil(row.expiresAt);
              const isActive = row.status === "activo";
              const isWarning = isActive && days !== null && days <= 3 && days >= 0;
              const countdownLabel =
                days === null
                  ? null
                  : days < 0
                    ? "Demo vencida"
                    : days === 0
                      ? "Vence hoy"
                      : days === 1
                        ? "Vence mañana"
                        : `Te quedan ${days} días`;
              return (
                <Card key={row.id} data-testid={`my-module-${row.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {row.moduleName}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {row.moduleIndustry} · Demo gratuita
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={cfg.className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    {row.activatedAt && (
                      <div>
                        Activada: {new Date(row.activatedAt).toLocaleDateString("es-PE")}
                      </div>
                    )}
                    {row.expiresAt && (
                      <div>
                        Vence: {new Date(row.expiresAt).toLocaleDateString("es-PE")}
                      </div>
                    )}
                    {countdownLabel && isActive ? (
                      <div
                        className={
                          isWarning
                            ? "flex items-center gap-1 font-medium text-amber-300"
                            : "flex items-center gap-1 text-emerald-300"
                        }
                        data-testid={`countdown-${row.id}`}
                      >
                        {isWarning ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {countdownLabel}
                        {isWarning ? " — te avisaremos cuando expire" : ""}
                      </div>
                    ) : null}
                    {row.notes && <div>Notas: {row.notes}</div>}
                    {row.status === "activo" && row.licenseKey ? (
                      <div className="pt-2 border-t border-border/60 space-y-1">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                          Clave de licencia
                        </div>
                        <div className="flex items-center gap-2">
                          <code
                            className="flex-1 truncate font-mono text-xs bg-muted/50 px-2 py-1 rounded text-foreground"
                            data-testid={`license-key-${row.id}`}
                          >
                            {row.licenseKey}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copyKey(row.id, row.licenseKey!)}
                            data-testid={`button-copy-key-${row.id}`}
                          >
                            {copiedId === row.id ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Usá esta clave para descargar y activar el módulo.
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-medium">Catálogo de módulos</h2>
          <Input
            placeholder="Buscar por nombre o industria"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
            data-testid="input-filter-catalog"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const blocked = blockedIds.has(m.id);
            return (
              <Card key={m.id} data-testid={`catalog-${m.slug}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <CardDescription className="capitalize">
                    {m.industry} · Demo gratuita · 30 días
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {m.description && (
                    <p className="text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={blocked || busyId === m.id}
                    onClick={() => requestModule(m.id)}
                    data-testid={`button-request-${m.slug}`}
                  >
                    {busyId === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {blocked ? "Ya solicitado" : "Solicitar demo gratuita"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
