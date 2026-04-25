import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, AlertTriangle, User } from "lucide-react";
import {
  portalApi,
  type AdminModuleEventRow,
  type ModuleEventSummary,
} from "@/lib/portal-api";

function severityVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "error") return "destructive";
  if (s === "warn") return "default";
  return "secondary";
}

export default function AdminTelemetryPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<ModuleEventSummary[]>([]);
  const [events, setEvents] = useState<AdminModuleEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, e] = await Promise.all([
          portalApi.adminModuleEventsSummary(),
          portalApi.adminModuleEvents({ limit: 80 }),
        ]);
        setSummary(s);
        setEvents(e);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "No se pudo cargar",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Telemetría de módulos</h1>
        <p className="text-sm text-muted-foreground">
          Eventos en vivo de los módulos vendidos a clientes.
        </p>
      </div>

      <Card data-testid="card-summary">
        <CardHeader>
          <CardTitle>Resumen por cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : summary.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Sin eventos registrados aún.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.map((s) => (
                <div
                  key={s.clientId}
                  className="border rounded-md p-3 space-y-1"
                  data-testid={`summary-${s.clientId}`}
                >
                  <div className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> {s.clientName ?? `Cliente ${s.clientId}`}
                  </div>
                  <div className="flex items-center gap-3 pt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-primary" /> {s.total}
                    </span>
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-4 w-4" /> {s.errors}
                    </span>
                  </div>
                  {s.last && (
                    <div className="text-xs text-muted-foreground">
                      Último: {new Date(s.last).toLocaleString("es-PE")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-events">
        <CardHeader>
          <CardTitle>Últimos 80 eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? null : events.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No hay eventos.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="border rounded-md p-3 text-sm"
                  data-testid={`event-${e.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant(e.severity)}>
                      {e.severity}
                    </Badge>
                    <span className="font-mono text-xs">{e.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString("es-PE")}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-muted-foreground">
                      {e.moduleName ?? "?"} · {e.clientName ?? "?"} ·{" "}
                    </span>
                    {e.message ?? "(sin mensaje)"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
