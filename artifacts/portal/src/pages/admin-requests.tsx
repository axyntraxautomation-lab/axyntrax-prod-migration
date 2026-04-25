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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, Inbox, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { portalApi, type AdminRequestRow } from "@/lib/portal-api";

function _fmtPrice_unused(n: string, c: string) {
  return `${c} ${Number(n).toFixed(2)}`;
}

function RequestList({ status }: { status: string }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminRequestRow[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = async () => {
    setLoadError(null);
    try {
      setRows(await portalApi.adminRequests(status));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error de carga");
    }
  };

  useEffect(() => {
    void reload();
  }, [status]);

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button size="sm" onClick={() => void reload()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!rows) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center gap-3 text-muted-foreground">
          <Inbox className="h-5 w-5" />
          <span>No hay solicitudes en estado "{status}".</span>
        </CardContent>
      </Card>
    );
  }

  const act = async (id: number, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      if (action === "approve") {
        await portalApi.adminApprove(id);
        toast({ title: "Módulo activado" });
      } else {
        await portalApi.adminReject(id);
        toast({ title: "Solicitud rechazada" });
      }
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Reintentá",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <Card key={r.id} data-testid={`request-${r.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-base">
                  {r.moduleName}{" "}
                  <span className="text-muted-foreground font-normal">·</span>{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {r.clientName}
                    {r.clientCompany ? ` (${r.clientCompany})` : ""}
                  </span>
                </CardTitle>
                <CardDescription>
                  {r.clientIndustry ?? "—"} · Demo gratuita · 30 días
                </CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">
                {r.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Solicitado: {new Date(r.requestedAt).toLocaleString("es-PE")}
              {r.notes ? ` · ${r.notes}` : ""}
            </div>
            {status === "pendiente" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busyId === r.id}
                  onClick={() => act(r.id, "approve")}
                  data-testid={`button-approve-${r.id}`}
                >
                  {busyId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Activar demo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === r.id}
                  onClick={() => act(r.id, "reject")}
                  data-testid={`button-reject-${r.id}`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminRequestsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Solicitudes de módulos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aprobá nuevas activaciones — todas las activaciones son demos
          gratuitas por 30 días, sin cobro al cliente.
        </p>
      </div>

      <Tabs defaultValue="pendiente" className="w-full">
        <TabsList>
          <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="activo">Activos</TabsTrigger>
          <TabsTrigger value="cancelado">Rechazados</TabsTrigger>
        </TabsList>
        <TabsContent value="pendiente" className="mt-4">
          <RequestList status="pendiente" />
        </TabsContent>
        <TabsContent value="activo" className="mt-4">
          <RequestList status="activo" />
        </TabsContent>
        <TabsContent value="cancelado" className="mt-4">
          <RequestList status="cancelado" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
