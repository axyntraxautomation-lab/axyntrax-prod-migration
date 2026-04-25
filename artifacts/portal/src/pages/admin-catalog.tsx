import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalApi, type CatalogModule } from "@/lib/portal-api";

function _fmtPrice_unused(n: string, c: string) {
  return `${c} ${Number(n).toFixed(2)}`;
}

export default function AdminCatalogPage() {
  const [rows, setRows] = useState<CatalogModule[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = async () => {
    setLoadError(null);
    try {
      setRows(await portalApi.adminCatalog());
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

  const grouped = rows.reduce<Record<string, CatalogModule[]>>((acc, r) => {
    (acc[r.industry] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Catálogo de módulos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Listado completo de módulos disponibles por industria.
        </p>
      </div>

      {Object.entries(grouped).map(([industry, mods]) => (
        <section key={industry} className="space-y-3">
          <h2 className="text-lg font-medium capitalize">{industry}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mods.map((m) => (
              <Card key={m.id} data-testid={`admin-catalog-${m.slug}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    {m.active === 1 ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      >
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </div>
                  <CardDescription>
                    Demo gratuita · 30 días
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {m.description ?? "—"}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
