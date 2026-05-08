import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetClient,
  useUpdateClient,
  getGetClientQueryKey,
  getListClientsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";

const STAGES = [
  "prospecto",
  "demo_activa",
  "negociacion",
  "cliente",
  "renovacion",
] as const;
const CHANNELS = [
  "web",
  "facebook",
  "instagram",
  "whatsapp",
  "email",
  "otro",
] as const;

interface Props {
  id?: string | number;
}

export default function CRMDetail({ id }: Props) {
  const numericId = Number(id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError } = useGetClient(numericId, {
    query: { enabled: !!numericId, queryKey: getGetClientQueryKey(numericId) },
  });
  const updateMutation = useUpdateClient();

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

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        company: data.company ?? "",
        industry: data.industry ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        channel: data.channel,
        stage: data.stage,
        score: data.score,
        notes: data.notes ?? "",
      });
    }
  }, [data]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        id: numericId,
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
          queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(numericId) });
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Cliente actualizado" });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "No se pudo guardar",
          }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No se encontró el cliente.</p>
          <Button onClick={() => setLocation("/crm")}>Volver al CRM</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/crm">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al CRM
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {data.company && <span>{data.company}</span>}
            <Badge variant="outline" className="uppercase text-xs">
              {data.channel}
            </Badge>
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Industria</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Notas</Label>
              <Textarea
                rows={5}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Score (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(e) =>
                  setForm({ ...form, score: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              Creado: {new Date(data.createdAt).toLocaleString("es-PE")}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
