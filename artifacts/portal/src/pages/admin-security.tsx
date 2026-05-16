import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import {
  portalApi,
  type SecurityAlertRow,
  type IpBlockRow,
  type LockdownState,
} from "@/lib/portal-api";

function severityBadge(s: string) {
  if (s === "critical") return "destructive";
  if (s === "high") return "destructive";
  if (s === "medium") return "default";
  return "secondary";
}

export default function AdminSecurityPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SecurityAlertRow[]>([]);
  const [blocks, setBlocks] = useState<IpBlockRow[]>([]);
  const [lockdown, setLockdown] = useState<LockdownState | null>(null);
  const [filter, setFilter] = useState<"open" | "ack" | "all">("open");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [a, b, l] = await Promise.all([
        portalApi.adminAlerts(filter),
        portalApi.adminBlocks(),
        portalApi.adminGetLockdown(),
      ]);
      setAlerts(a);
      setBlocks(b);
      setLockdown(l);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo cargar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function ack(id: number) {
    try {
      await portalApi.adminAckAlert(id);
      toast({ title: "Alerta marcada como atendida" });
      void load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Falló",
        variant: "destructive",
      });
    }
  }

  async function unblock(ip: string) {
    try {
      await portalApi.adminDeleteBlock(ip);
      toast({ title: "IP desbloqueada" });
      void load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Falló",
        variant: "destructive",
      });
    }
  }

  async function toggleLockdown(active: boolean) {
    setSaving(true);
    try {
      const reason = active
        ? window.prompt("Motivo del modo blindaje (opcional):") ?? undefined
        : undefined;
      const next = await portalApi.adminSetLockdown(active, reason);
      setLockdown(next);
      toast({
        title: active ? "Modo blindaje activado" : "Modo blindaje desactivado",
        description: active
          ? "El portal queda bloqueado para todos los clientes."
          : "El portal vuelve a estar disponible.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Falló",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seguridad y blindaje</h1>
        <p className="text-sm text-muted-foreground">
          Monitor de intrusiones, IPs bloqueadas y modo blindaje del portal.
        </p>
      </div>

      <Card data-testid="card-lockdown">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {lockdown?.active ? (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-primary" />
            )}
            Modo blindaje
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm">
              {lockdown?.active
                ? "Activo: clientes ven mensaje de mantenimiento."
                : "Inactivo: portal abierto para clientes."}
            </div>
            {lockdown?.reason && (
              <div className="text-xs text-muted-foreground">
                Motivo: {lockdown.reason}
              </div>
            )}
            {lockdown?.enabledAt && (
              <div className="text-xs text-muted-foreground">
                Cambio: {new Date(lockdown.enabledAt).toLocaleString("es-PE")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              data-testid="switch-lockdown"
              checked={!!lockdown?.active}
              onCheckedChange={toggleLockdown}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-alerts">
        <CardHeader>
          <CardTitle>Alertas de seguridad</CardTitle>
          <div className="flex gap-2">
            {(["open", "ack", "all"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                data-testid={`filter-${f}`}
              >
                {f === "open" ? "Abiertas" : f === "ack" ? "Atendidas" : "Todas"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              No hay alertas en este filtro.
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="border rounded-md p-3 flex items-start justify-between gap-3"
                  data-testid={`alert-${a.id}`}
                >
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityBadge(a.severity) as "default" | "secondary" | "destructive" | "outline"}>
                        {a.severity}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {a.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("es-PE")}
                      </span>
                    </div>
                    <div>{a.message}</div>
                    {(a.ip || a.email) && (
                      <div className="text-xs text-muted-foreground">
                        {a.ip && <span>IP: {a.ip} </span>}
                        {a.email && <span>· Email: {a.email}</span>}
                      </div>
                    )}
                  </div>
                  {a.ackBy == null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => ack(a.id)}
                      data-testid={`btn-ack-${a.id}`}
                    >
                      Atender
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-blocks">
        <CardHeader>
          <CardTitle>IPs bloqueadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? null : blocks.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              No hay IPs bloqueadas actualmente.
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="border rounded-md p-3 flex items-center justify-between gap-3 text-sm"
                  data-testid={`block-${b.id}`}
                >
                  <div>
                    <div className="font-mono">{b.ip}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.reason ?? "sin motivo"} · vence{" "}
                      {new Date(b.expiresAt).toLocaleString("es-PE")}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unblock(b.ip)}
                    data-testid={`btn-unblock-${b.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
