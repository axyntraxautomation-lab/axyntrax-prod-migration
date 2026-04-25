import { useMemo, useState } from "react";
import {
  useListModulesCatalog,
  useListIndustries,
  useListClients,
  useListClientModules,
  useListModuleRequests,
  useRequestModule,
  useApproveModule,
  useCancelModule,
  useGetCurrentUser,
  getListModulesCatalogQueryKey,
  getListClientModulesQueryKey,
  getListModuleRequestsQueryKey,
  type ModuleCatalog,
  type ClientModule,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Stethoscope,
  Scale,
  Smile,
  PawPrint,
  Building2,
  Tag,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  medical: Stethoscope,
  legal: Scale,
  dental: Smile,
  veterinary: PawPrint,
  condo: Building2,
  otro: Tag,
};

function statusBadge(status: string) {
  switch (status) {
    case "activo":
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Activo</Badge>;
    case "pendiente":
      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Pendiente</Badge>;
    case "cancelado":
      return <Badge variant="outline">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatPrice(amount: string | null | undefined, currency: string | null | undefined) {
  if (!amount) return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return `${currency ?? "PEN"} ${n.toFixed(2)}`;
}

export default function Modulos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser();
  const isAdmin = user?.role === "admin";

  const [industry, setIndustry] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const industriesQuery = useListIndustries();
  const catalogQuery = useListModulesCatalog(
    industry !== "all" ? { industry } : undefined,
    {
      query: {
        queryKey: getListModulesCatalogQueryKey(
          industry !== "all" ? { industry } : undefined,
        ),
      },
    },
  );
  const clientsQuery = useListClients();
  const requestsQuery = useListModuleRequests({
    query: {
      queryKey: getListModuleRequestsQueryKey(),
      enabled: isAdmin,
      refetchInterval: 30_000,
    },
  });
  const clientModulesQuery = useListClientModules(
    Number(selectedClientId) || 0,
    {
      query: {
        queryKey: getListClientModulesQueryKey(Number(selectedClientId) || 0),
        enabled: !!selectedClientId,
      },
    },
  );

  const requestMutation = useRequestModule();
  const approveMutation = useApproveModule();
  const cancelMutation = useCancelModule();

  const groupedCatalog = useMemo(() => {
    const out = new Map<string, ModuleCatalog[]>();
    for (const m of catalogQuery.data ?? []) {
      const arr = out.get(m.industry) ?? [];
      arr.push(m);
      out.set(m.industry, arr);
    }
    return out;
  }, [catalogQuery.data]);

  const handleRequest = (mod: ModuleCatalog) => {
    if (!selectedClientId) {
      toast({
        title: "Selecciona un cliente",
        description: "Primero elegí el cliente al que activar el módulo.",
        variant: "destructive",
      });
      return;
    }
    requestMutation.mutate(
      {
        data: { clientId: Number(selectedClientId), moduleId: mod.id },
      },
      {
        onSuccess: () => {
          toast({
            title: "Solicitud enviada",
            description: `${mod.name} quedó pendiente de aprobación.`,
          });
          queryClient.invalidateQueries({
            queryKey: getListClientModulesQueryKey(Number(selectedClientId)),
          });
          queryClient.invalidateQueries({
            queryKey: getListModuleRequestsQueryKey(),
          });
        },
        onError: (err: any) => {
          toast({
            title: "No se pudo solicitar",
            description: String(err?.message ?? err),
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleApprove = (cm: ClientModule, durationMonths = 1) => {
    approveMutation.mutate(
      { id: cm.id, data: { durationMonths, createPayment: true } },
      {
        onSuccess: () => {
          toast({
            title: "Módulo activado",
            description: `${cm.moduleName} activo por ${durationMonths} mes(es). Se generó un comprobante pendiente.`,
          });
          queryClient.invalidateQueries({
            queryKey: getListModuleRequestsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListClientModulesQueryKey(cm.clientId),
          });
        },
        onError: (err: any) => {
          toast({
            title: "No se pudo aprobar",
            description: String(err?.message ?? err),
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleCancel = (cm: ClientModule) => {
    cancelMutation.mutate(
      { id: cm.id },
      {
        onSuccess: () => {
          toast({
            title: "Módulo cancelado",
            description: `${cm.moduleName} fue cancelado.`,
          });
          queryClient.invalidateQueries({
            queryKey: getListClientModulesQueryKey(cm.clientId),
          });
          queryClient.invalidateQueries({
            queryKey: getListModuleRequestsQueryKey(),
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Módulos</h1>
        <p className="text-muted-foreground">
          Catálogo de módulos por industria. Cada cliente puede activar los que
          necesite y se aprueban con comprobante manual.
        </p>
      </div>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo" data-testid="tab-catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="cliente" data-testid="tab-client">Por cliente</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="solicitudes" data-testid="tab-requests">
              Solicitudes
              {(requestsQuery.data?.length ?? 0) > 0 && (
                <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {requestsQuery.data?.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Industria</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="w-56" data-testid="select-industry">
                  <SelectValue placeholder="Todas las industrias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las industrias</SelectItem>
                  {industriesQuery.data?.map((ind) => (
                    <SelectItem key={ind.slug} value={ind.slug}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Cliente para activar</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-72" data-testid="select-client">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientsQuery.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}{c.company ? ` — ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {catalogQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : (catalogQuery.data?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No hay módulos para esta industria.
              </CardContent>
            </Card>
          ) : (
            Array.from(groupedCatalog.entries()).map(([ind, items]) => {
              const Icon = INDUSTRY_ICONS[ind] ?? Package;
              const label =
                industriesQuery.data?.find((i) => i.slug === ind)?.label ?? ind;
              return (
                <div key={ind} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{label}</h3>
                    <span className="text-xs text-muted-foreground">
                      ({items.length} módulos)
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((mod) => (
                      <Card key={mod.id} data-testid={`card-module-${mod.slug}`}>
                        <CardHeader>
                          <CardTitle className="text-base">{mod.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {mod.description ?? ""}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Mensual:</span>{" "}
                            <span className="font-semibold text-primary">
                              {formatPrice(mod.monthlyPrice, mod.currency)}
                            </span>
                          </div>
                          <Button
                            className="w-full"
                            size="sm"
                            disabled={
                              !selectedClientId || requestMutation.isPending
                            }
                            onClick={() => handleRequest(mod)}
                            data-testid={`button-request-${mod.slug}`}
                          >
                            {requestMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Package className="h-4 w-4 mr-2" />
                            )}
                            Solicitar para cliente
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="cliente" className="space-y-4">
          <div className="space-y-1.5 max-w-md">
            <label className="text-xs text-muted-foreground">Cliente</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger data-testid="select-client-tab">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientsQuery.data?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}{c.company ? ` — ${c.company}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedClientId ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Selecciona un cliente para ver sus módulos.
              </CardContent>
            </Card>
          ) : clientModulesQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (clientModulesQuery.data?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Este cliente no tiene módulos solicitados.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {clientModulesQuery.data?.map((cm) => (
                <Card key={cm.id} data-testid={`row-client-module-${cm.id}`}>
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cm.moduleName}</span>
                        {statusBadge(cm.status)}
                        <span className="text-xs text-muted-foreground">
                          {cm.moduleIndustry}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <Clock className="h-3 w-3" />
                        Solicitado {new Date(cm.requestedAt).toLocaleDateString("es-PE")}
                        {cm.expiresAt && (
                          <>
                            · Vence {new Date(cm.expiresAt).toLocaleDateString("es-PE")}
                          </>
                        )}
                        · {formatPrice(cm.monthlyPrice, cm.currency)} / mes
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        {cm.status === "pendiente" && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(cm, 1)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${cm.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" /> Aprobar 1m
                          </Button>
                        )}
                        {cm.status !== "cancelado" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancel(cm)}
                            disabled={cancelMutation.isPending}
                            data-testid={`button-cancel-${cm.id}`}
                          >
                            <X className="h-4 w-4 mr-1" /> Cancelar
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="solicitudes" className="space-y-3">
            {requestsQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (requestsQuery.data?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No hay solicitudes pendientes.
                </CardContent>
              </Card>
            ) : (
              requestsQuery.data?.map((req) => (
                <Card key={req.id} data-testid={`row-request-${req.id}`}>
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{req.moduleName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({req.moduleIndustry})
                        </span>
                      </div>
                      <div className="text-sm">
                        Cliente: <span className="font-medium">{req.clientName}</span>
                        {req.clientCompany && (
                          <span className="text-muted-foreground">
                            {" "}— {req.clientCompany}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Solicitado{" "}
                        {new Date(req.requestedAt).toLocaleString("es-PE")} ·{" "}
                        {formatPrice(req.monthlyPrice, req.currency)} / mes
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req, 1)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-req-${req.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aprobar 1m
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(req, 12)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-12m-${req.id}`}
                      >
                        12 meses
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(req)}
                        disabled={cancelMutation.isPending}
                        data-testid={`button-reject-${req.id}`}
                      >
                        <X className="h-4 w-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
