import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalApi, type AdminClientRow } from "@/lib/portal-api";

export default function AdminClientsPage() {
  const [rows, setRows] = useState<AdminClientRow[] | null>(null);
  const [filter, setFilter] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = async () => {
    setLoadError(null);
    try {
      setRows(await portalApi.adminClients());
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

  if (!rows) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = rows.filter(
    (r) =>
      !filter ||
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      (r.company ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      (r.industry ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vista resumen del portafolio de clientes y sus módulos.
          </p>
        </div>
        <Input
          placeholder="Buscar"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
          data-testid="input-filter-clients"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 flex items-center gap-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>No hay clientes que coincidan.</span>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} data-testid={`client-${c.id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <CardDescription>
                  {c.company ?? "Sin empresa"} · {c.industry ?? "—"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                >
                  {c.activeModules} activos
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-500/15 text-amber-300 border-amber-500/30"
                >
                  {c.pendingModules} pendientes
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
