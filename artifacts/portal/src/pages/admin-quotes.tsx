import { useEffect, useState } from "react";
import { Loader2, FileDown, Inbox } from "lucide-react";
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
import { portalApi, type AdminQuoteRow } from "@/lib/portal-api";

const STATUS_BADGE: Record<string, string> = {
  enviada: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  aceptada: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rechazada: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  vencida: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export default function AdminQuotesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminQuoteRow[] | null>(null);

  useEffect(() => {
    portalApi
      .adminQuotes()
      .then(setRows)
      .catch((err) =>
        toast({
          variant: "destructive",
          title: "No se pudo cargar",
          description: err instanceof Error ? err.message : "Error",
        }),
      );
  }, [toast]);

  if (!rows) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todas las cotizaciones generadas por JARVIS. Cada una se envió por
          correo al cliente con el PDF adjunto.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Inbox className="h-6 w-6" />
            Sin cotizaciones todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((q) => {
            const name = `${q.clientFirstName ?? ""} ${q.clientLastName ?? ""}`.trim();
            const expired =
              q.status === "enviada" && new Date(q.validUntil) < new Date();
            const effectiveStatus = expired ? "vencida" : q.status;
            const cls = STATUS_BADGE[effectiveStatus] ?? "";
            return (
              <Card key={q.id} data-testid={`admin-quote-${q.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">
                        N° {String(q.id).padStart(6, "0")}{" "}
                        <span className="text-muted-foreground font-normal">·</span>{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {name || q.clientEmail || "Cliente"}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {q.clientEmail ?? "—"}
                        {q.clientPhone ? ` · ${q.clientPhone}` : ""}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={cls}>
                      {effectiveStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                    <span>
                      Total:{" "}
                      <span className="text-foreground tabular-nums">
                        {q.currency} {Number(q.total).toFixed(2)}
                      </span>
                    </span>
                    <span>
                      Emitida:{" "}
                      {new Date(q.createdAt).toLocaleString("es-PE")}
                    </span>
                    <span>
                      Válida hasta:{" "}
                      {new Date(q.validUntil).toLocaleDateString("es-PE")}
                    </span>
                    {q.acceptedAt && (
                      <span>
                        Aceptada:{" "}
                        {new Date(q.acceptedAt).toLocaleString("es-PE")}
                      </span>
                    )}
                  </div>
                  <a
                    href={portalApi.quotePdfUrl(q.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`admin-quote-pdf-${q.id}`}
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Ver PDF
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
