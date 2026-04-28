import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useListClients,
  useCreateClient,
  useDeleteClient,
  getListClientsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Users as UsersIcon,
} from "lucide-react";

const STAGES = [
  { value: "prospecto", label: "Prospecto" },
  { value: "demo_activa", label: "Demo Activa" },
  { value: "negociacion", label: "Negociación" },
  { value: "cliente", label: "Cliente" },
  { value: "renovacion", label: "Renovación" },
] as const;

const CHANNELS = [
  { value: "web", label: "Web" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "otro", label: "Otro" },
] as const;

function stageBadge(stage: string) {
  const variants: Record<string, string> = {
    prospecto: "bg-muted text-muted-foreground border-border",
    demo_activa: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    negociacion: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    cliente: "bg-primary/15 text-primary border-primary/30",
    renovacion: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const label = STAGES.find((s) => s.value === stage)?.label ?? stage;
  return (
    <Badge variant="outline" className={variants[stage] ?? ""}>
      {label}
    </Badge>
  );
}

export default function CRMList() {
  const { data: clients, isLoading } = useListClients();
  const createMutation = useCreateClient();
  const deleteMutation = useDeleteClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("todos");
  const [channelFilter, setChannelFilter] = useState<string>("todos");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    industry: "",
    email: "",
    phone: "",
    channel: "web",
    stage: "prospecto",
    score: 0,
    notes: "",
  });

  const filtered = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => {
      const q = search.toLowerCase();
      const match =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q);
      const stageOk = stageFilter === "todos" || c.stage === stageFilter;
      const channelOk = channelFilter === "todos" || c.channel === channelFilter;
      return match && stageOk && channelOk;
    });
  }, [clients, search, stageFilter, channelFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          name: form.name,
          company: form.company || null,
          industry: form.industry || null,
          email: form.email || null,
          phone: form.phone || null,
          channel: form.channel as never,
          stage: form.stage as never,
          score: form.score,
          notes: form.notes || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Cliente creado", description: form.name });
          setOpen(false);
          setForm({
            name: "",
            company: "",
            industry: "",
            email: "",
            phone: "",
            channel: "web",
            stage: "prospecto",
            score: 0,
            notes: "",
          });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "No se pudo crear",
            description: "Verifica los campos e intenta nuevamente.",
          }),
      },
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Cliente eliminado" });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Funnel de ventas y gestión de clientes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Agrega un cliente o prospecto al funnel.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industria</Label>
                  <Input
                    id="industry"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select
                    value={form.channel}
                    onValueChange={(v) => setForm({ ...form, channel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={form.stage}
                    onValueChange={(v) => setForm({ ...form, stage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Guardando..." : "Crear cliente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Clientes ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, empresa o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los canales</SelectItem>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
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
              <UsersIcon className="mx-auto h-10 w-10 opacity-30 mb-3" />
              No hay clientes que coincidan con los filtros.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.company ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs">
                          {c.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>{stageBadge(c.stage)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.score}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Link href={`/crm/${c.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c.id, c.name)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
