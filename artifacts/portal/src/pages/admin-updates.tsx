import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import {
  portalApi,
  type ModuleUpdateRow,
  type CatalogModule,
} from "@/lib/portal-api";

export default function AdminUpdatesPage() {
  const { toast } = useToast();
  const [modules, setModules] = useState<CatalogModule[]>([]);
  const [updates, setUpdates] = useState<ModuleUpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleId, setModuleId] = useState<string>("");
  const [version, setVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [severity, setSeverity] = useState<"normal" | "important" | "critical">("normal");
  const [publishing, setPublishing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [m, u] = await Promise.all([
        portalApi.adminCatalog(),
        portalApi.adminListUpdates(),
      ]);
      setModules(m);
      setUpdates(u);
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
  }, []);

  async function publish() {
    if (!moduleId || !version || !releaseNotes.trim()) {
      toast({
        title: "Faltan datos",
        description: "Módulo, versión y notas son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    setPublishing(true);
    try {
      const { update: next, fanout } = await portalApi.adminPublishUpdate({
        moduleId: Number(moduleId),
        version,
        releaseNotes,
        severity,
      });
      toast({
        title: "Update publicado",
        description: `v${next.version} (${next.severity}) · enviado a ${fanout} cliente(s)`,
      });
      setVersion("");
      setReleaseNotes("");
      setSeverity("normal");
      void load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Falló",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Actualizaciones de módulos</h1>
        <p className="text-sm text-muted-foreground">
          Publicá una nueva versión y los clientes con ese módulo activo recibirán la
          notificación inmediatamente.
        </p>
      </div>

      <Card data-testid="card-publish">
        <CardHeader>
          <CardTitle>Publicar nuevo update</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Módulo</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger data-testid="select-module">
                <SelectValue placeholder="Elige un módulo" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name} ({m.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Versión</Label>
            <Input
              data-testid="input-version"
              placeholder="1.4.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notas de la versión (changelog)</Label>
            <Textarea
              data-testid="input-notes"
              rows={4}
              placeholder="Mejoras y correcciones incluidas en esta versión..."
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Severidad</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
              <SelectTrigger data-testid="select-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="important">Importante</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              data-testid="btn-publish"
              onClick={publish}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publicar y notificar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-updates">
        <CardHeader>
          <CardTitle>Updates publicados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : updates.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Sin updates publicados.
            </div>
          ) : (
            <div className="space-y-2">
              {updates.map((u) => (
                <div
                  key={u.id}
                  className="border rounded-md p-3 text-sm"
                  data-testid={`update-${u.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{u.severity}</Badge>
                    <span className="font-medium">
                      {u.moduleName ?? `Módulo ${u.moduleId}`}
                    </span>
                    <span className="font-mono text-xs">v{u.version}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleString("es-PE")}
                    </span>
                    {typeof u.applied === "number" && (
                      <Badge variant="outline">
                        {u.applied} aplicado · {u.pending ?? 0} pendiente
                      </Badge>
                    )}
                  </div>
                  {u.releaseNotes && (
                    <div className="mt-1 text-muted-foreground whitespace-pre-wrap">
                      {u.releaseNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
