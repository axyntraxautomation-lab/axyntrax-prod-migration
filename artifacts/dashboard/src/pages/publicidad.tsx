import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, RefreshCw, Sparkles, Trash2 } from "lucide-react";

const API_BASE = `${import.meta.env.BASE_URL}api`;

interface JarvisAd {
  id: number;
  channel: string;
  audience: string | null;
  industry: string | null;
  title: string;
  body: string;
  hashtags: string | null;
  cta: string | null;
  imagePrompt: string | null;
  status: "pendiente" | "aprobado" | "publicado" | "descartado";
  source: string;
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
}

const fmt = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_LABEL: Record<JarvisAd["status"], string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  publicado: "Publicado",
  descartado: "Descartado",
};
const STATUS_VARIANT: Record<
  JarvisAd["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendiente: "outline",
  aprobado: "secondary",
  publicado: "default",
  descartado: "destructive",
};
const CHANNEL_LABEL: Record<string, string> = {
  fb: "Facebook",
  ig: "Instagram",
  both: "Facebook + Instagram",
};

export default function Publicidad() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<JarvisAd[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  function handleAuthError(res: Response): boolean {
    if (res.status === 401 || res.status === 403) {
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "Volvé a iniciar sesión en JARVIS.",
      });
      setLocation("/login");
      return true;
    }
    return false;
  }

  async function reload(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/jarvis/ads`, {
        credentials: "include",
      });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { rows: JarvisAd[]; total: number };
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudieron cargar los avisos",
        description: String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function generateNow(): Promise<void> {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/jarvis/ads/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (handleAuthError(res)) return;
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `status ${res.status}`);
      }
      const created = (await res.json()) as JarvisAd;
      toast({
        title: "Aviso generado",
        description: `JARVIS creó: ${created.title}`,
      });
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Falló la generación",
        description: String(err),
      });
    } finally {
      setGenerating(false);
    }
  }

  async function patchStatus(id: number, status: JarvisAd["status"]): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/jarvis/ads/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error(`status ${res.status}`);
      toast({ title: `Aviso marcado como ${STATUS_LABEL[status]}` });
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error actualizando aviso",
        description: String(err),
      });
    }
  }

  async function removeAd(id: number): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/jarvis/ads/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (handleAuthError(res)) return;
      if (!res.ok && res.status !== 204) throw new Error(`status ${res.status}`);
      toast({ title: "Aviso eliminado" });
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error eliminando aviso",
        description: String(err),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Publicidad JARVIS
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            JARVIS genera automáticamente un nuevo aviso para Facebook e
            Instagram cada hora. Cada texto es distinto del anterior. Aprobá los
            que quieras publicar y descartá el resto. Total acumulado:{" "}
            <span className="font-semibold text-foreground">{total}</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void reload()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
          <Button onClick={() => void generateNow()} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generar ahora
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            JARVIS aún no generó avisos. Apretá "Generar ahora" o esperá a la
            próxima ronda automática.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rows.map((ad) => (
            <Card key={ad.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">
                    {ad.title}
                  </CardTitle>
                  <Badge variant={STATUS_VARIANT[ad.status]}>
                    {STATUS_LABEL[ad.status]}
                  </Badge>
                </div>
                <CardDescription className="flex flex-wrap gap-2 text-xs">
                  <span>{CHANNEL_LABEL[ad.channel] ?? ad.channel}</span>
                  {ad.audience ? <span>· {ad.audience}</span> : null}
                  <span>· {fmt.format(new Date(ad.createdAt))}</span>
                  <span>· {ad.source}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-line">{ad.body}</p>
                {ad.cta ? (
                  <p className="text-sm font-semibold text-primary">{ad.cta}</p>
                ) : null}
                {ad.hashtags ? (
                  <p className="text-xs text-muted-foreground font-mono break-words">
                    {ad.hashtags}
                  </p>
                ) : null}
                {ad.imagePrompt ? (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Idea visual sugerida
                    </summary>
                    <p className="mt-1 text-muted-foreground">{ad.imagePrompt}</p>
                  </details>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {ad.status !== "aprobado" && ad.status !== "publicado" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void patchStatus(ad.id, "aprobado")}
                    >
                      Aprobar
                    </Button>
                  )}
                  {ad.status === "aprobado" && (
                    <Button
                      size="sm"
                      onClick={() => void patchStatus(ad.id, "publicado")}
                    >
                      Marcar publicado
                    </Button>
                  )}
                  {ad.status !== "descartado" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void patchStatus(ad.id, "descartado")}
                    >
                      Descartar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => void removeAd(ad.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
