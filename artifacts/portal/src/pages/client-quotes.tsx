import { useEffect, useState } from "react";
import {
  Loader2,
  FileDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { portalApi, type QuoteRow } from "@/lib/portal-api";

const STATUS_BADGE: Record<string, string> = {
  enviada: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  aceptada: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rechazada: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  vencida: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

function fmtMoney(n: string, c: string) {
  return `${c} ${Number(n).toFixed(2)}`;
}

export default function ClientQuotesPage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<QuoteRow[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    try {
      const r = await portalApi.myQuotes();
      setQuotes(r);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar",
        description: err instanceof Error ? err.message : "Error",
      });
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function accept(id: number) {
    setBusyId(id);
    try {
      const r = await portalApi.acceptQuote(id);
      toast({
        title: "Cotización aceptada",
        description:
          r.createdRequests.length > 0
            ? `Se generaron ${r.createdRequests.length} solicitud(es) para activar.`
            : "Los módulos ya estaban activos o pendientes.",
      });
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo aceptar",
        description: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (!quotes) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Mis cotizaciones
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cotizaciones enviadas por JARVIS. Podés descargar el PDF, aceptar
          para activar los módulos o esperar a que venza la validez.
        </p>
      </div>

      <div
        className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3"
        data-testid="banner-yape"
      >
        <div>
          <div className="font-medium text-foreground">
            Pago de cotizaciones
          </div>
          <div className="text-xs text-muted-foreground">
            Aceptá la cotización y depositá el monto por Yape al titular Miguel
            Montero. Avisanos por el chat de JARVIS para activar tus módulos.
          </div>
        </div>
        <div className="font-mono text-base font-semibold text-foreground">
          Yape · 991 740 590
        </div>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Todavía no tenés cotizaciones. Pedile una a JARVIS desde el
            catálogo o desde el chat de la página principal.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {quotes.map((q) => {
            const expired =
              q.status === "enviada" && new Date(q.validUntil) < new Date();
            const effectiveStatus = expired ? "vencida" : q.status;
            const cls = STATUS_BADGE[effectiveStatus] ?? "";
            return (
              <Card key={q.id} data-testid={`quote-${q.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">
                        Cotización N° {String(q.id).padStart(6, "0")}
                      </CardTitle>
                      <CardDescription>
                        Emitida {new Date(q.createdAt).toLocaleDateString("es-PE")}
                        {" · válida hasta "}
                        {new Date(q.validUntil).toLocaleDateString("es-PE")}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={cls}>
                      {effectiveStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {q.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-3">
                        <span>{it.moduleName}</span>
                        <span className="tabular-nums">
                          {fmtMoney(it.lineTotal, q.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border pt-2 text-sm flex flex-col gap-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="tabular-nums">
                        {fmtMoney(q.subtotal, q.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>IGV (18%)</span>
                      <span className="tabular-nums">
                        {fmtMoney(q.igv, q.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-cyan-300">
                      <span>Total mensual</span>
                      <span
                        className="tabular-nums"
                        data-testid={`quote-total-${q.id}`}
                      >
                        {fmtMoney(q.total, q.currency)}
                      </span>
                    </div>
                  </div>
                  {q.emailSentAt && (
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Enviada por correo {new Date(q.emailSentAt).toLocaleString("es-PE")}
                    </div>
                  )}
                  {expired && (
                    <div className="text-xs text-amber-400 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Esta cotización venció. Pedí una nueva a JARVIS.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={portalApi.quotePdfUrl(q.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`quote-pdf-${q.id}`}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </a>
                    {q.status === "enviada" && !expired && (
                      <Button
                        size="sm"
                        disabled={busyId === q.id}
                        onClick={() => accept(q.id)}
                        data-testid={`quote-accept-${q.id}`}
                      >
                        {busyId === q.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Aceptar y activar módulos
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
