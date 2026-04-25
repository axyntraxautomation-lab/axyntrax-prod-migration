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
import { Loader2, CheckCircle2, Clock, XCircle, Info, AlertTriangle } from "lucide-react";
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
};

function fmtPrice(n: string, c: string) {
  return `${c} ${Number(n).toFixed(2)}`;
}

export default function ClientModulesPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [mine, setMine] = useState<ClientModuleRow[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogModule[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

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

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Mis módulos</h2>
        {mine.length === 0 ? (
          <Card>
            <CardContent className="py-8 flex items-center gap-3 text-muted-foreground">
              <Info className="h-5 w-5" />
              <span>
                Todavía no tenés módulos activos. Explorá el catálogo abajo y
                solicitá los que necesités.
              </span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((row) => {
              const cfg = STATUS_BADGE[row.status] ?? STATUS_BADGE.pendiente;
              const Icon = cfg.icon;
              return (
                <Card key={row.id} data-testid={`my-module-${row.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {row.moduleName}
                        </CardTitle>
                        <CardDescription>
                          {row.moduleIndustry} · {fmtPrice(row.monthlyPrice, row.currency)} / mes
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={cfg.className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    {row.activatedAt && (
                      <div>
                        Activado: {new Date(row.activatedAt).toLocaleDateString("es-PE")}
                      </div>
                    )}
                    {row.expiresAt && (
                      <div>
                        Vence: {new Date(row.expiresAt).toLocaleDateString("es-PE")}
                      </div>
                    )}
                    {row.notes && <div>Notas: {row.notes}</div>}
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
                    {m.industry} · {fmtPrice(m.monthlyPrice, m.currency)} / mes
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
                    {blocked ? "Ya solicitado" : "Solicitar activación"}
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
