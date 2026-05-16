import { useState, useMemo } from "react";
import {
  useListLicenses,
  useListClients,
  useCreateLicense,
  getListLicensesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Copy, Plus } from "lucide-react";

const TYPES = [
  { value: "demo", label: "Demo (30d)" },
  { value: "plan_3m", label: "Plan 3 meses" },
  { value: "plan_6m", label: "Plan 6 meses" },
  { value: "plan_12m", label: "Plan 12 meses" },
  { value: "plan_24m", label: "Plan 24 meses" },
  { value: "addon", label: "Add-on" },
];

function statusBadge(s: string) {
  const map: Record<string, string> = {
    activa: "bg-primary/15 text-primary border-primary/30",
    pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    vencida: "bg-destructive/15 text-destructive border-destructive/30",
    cancelada: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={map[s] ?? ""}>
      {s}
    </Badge>
  );
}

export default function Keygen() {
  const { data: licenses, isLoading } = useListLicenses();
  const { data: clients } = useListClients();
  const createMutation = useCreateLicense();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");

  const [form, setForm] = useState({
    clientId: "",
    type: "demo",
    module: "",
    amount: "",
    currency: "PEN",
  });

  const filtered = useMemo(() => {
    if (!licenses) return [];
    return licenses.filter((l) => {
      const okStatus = statusFilter === "todos" || l.status === statusFilter;
      const okType = typeFilter === "todos" || l.type === typeFilter;
      return okStatus && okType;
    });
  }, [licenses, statusFilter, typeFilter]);

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast({ title: "Clave copiada", description: key });
    } catch {
      toast({
        variant: "destructive",
        title: "No se pudo copiar",
      });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) {
      toast({ variant: "destructive", title: "Selecciona un cliente" });
      return;
    }
    createMutation.mutate(
      {
        data: {
          clientId: parseInt(form.clientId, 10),
          type: form.type as never,
          module: form.module || null,
          amount: form.amount ? parseFloat(form.amount) : null,
          currency: form.currency || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLicensesQueryKey() });
          toast({ title: "Licencia generada" });
          setOpen(false);
          setForm({
            clientId: "",
            type: "demo",
            module: "",
            amount: "",
            currency: "PEN",
          });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "No se pudo generar la licencia",
          }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KeyGen</h1>
          <p className="text-muted-foreground">
            Generación y control de licencias para clientes.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generar Licencia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Nueva Licencia</DialogTitle>
              <DialogDescription>
                La fecha de vencimiento se calcula según el tipo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.company ? `· ${c.company}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Módulo</Label>
                <Input
                  placeholder="crm, axia, finanzas, ..."
                  value={form.module}
                  onChange={(e) => setForm({ ...form, module: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => setForm({ ...form, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Generando..." : "Generar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Licencias ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Key className="mx-auto h-10 w-10 opacity-30 mb-3" />
              No hay licencias todavía. Genera la primera con el botón superior.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <button
                          onClick={() => handleCopy(l.key)}
                          className="font-mono text-xs flex items-center gap-1 hover:text-primary transition-colors"
                          title="Copiar clave"
                        >
                          {l.key}
                          <Copy className="h-3 w-3 opacity-50" />
                        </button>
                      </TableCell>
                      <TableCell>{l.clientName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {l.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.module ?? "—"}
                      </TableCell>
                      <TableCell>{statusBadge(l.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(l.endDate).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {l.amount != null
                          ? `${l.currency ?? ""} ${Number(l.amount).toFixed(2)}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
