import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Info,
  AlertTriangle,
  Copy,
  Check,
  FileDown,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  portalApi,
  type CatalogModule,
  type ClientModuleRow,
  type CreateQuoteResult,
} from "@/lib/portal-api";
import { YapeQR } from "@/components/yape-qr";

const STATUS_BADGE: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  activo: {
    label: "Activo",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: Clock,
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    icon: XCircle,
  },
  vencido: {
    label: "Vencida",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: XCircle,
  },
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function ClientModulesPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [mine, setMine] = useState<ClientModuleRow[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogModule[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [createdQuote, setCreatedQuote] = useState<CreateQuoteResult | null>(
    null,
  );
  const [createdQuoteAccepted, setCreatedQuoteAccepted] = useState(false);
  const [acceptingCreated, setAcceptingCreated] = useState(false);
  const [supportFor, setSupportFor] = useState<ClientModuleRow | null>(null);
  const [supportHistory, setSupportHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [supportInput, setSupportInput] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [updates, setUpdates] = useState<
    {
      id: number;
      version: string;
      severity: string;
      releaseNotes: string;
      moduleName: string | null;
      status: string;
    }[]
  >([]);

  useEffect(() => {
    portalApi.myUpdates().then(setUpdates).catch(() => setUpdates([]));
  }, []);

  const selectedModules = useMemo(() => {
    if (!catalog) return [];
    const paidNow = catalog
      .filter(
        (m) =>
          !filter ||
          m.name.toLowerCase().includes(filter.toLowerCase()) ||
          m.industry.toLowerCase().includes(filter.toLowerCase()) ||
          m.slug.toLowerCase().includes(filter.toLowerCase()),
      )
      .filter((m) => Number(m.monthlyPrice) > 0);
    return paidNow.filter((m) => selectedIds.has(m.id));
  }, [catalog, filter, selectedIds]);

  const copyKey = async (id: number, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
      toast({
        title: "Clave copiada",
        description: "Pégala donde necesites activar el módulo.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "No se pudo copiar",
        description: "Copia manualmente la clave del módulo.",
      });
    }
  };

  const reload = async () => {
    setLoadError(null);
    try {
      const [m, c] = await Promise.all([
        portalApi.myModules(),
        portalApi.catalog(),
      ]);
      setMine(m);
      setCatalog(c);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error de carga");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  if (loadError) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button onClick={() => void reload()}>Reintentar</Button>
      </div>
    );
  }

  if (!mine || !catalog) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const blockedIds = new Set(
    mine
      .filter((r) => r.status === "activo" || r.status === "pendiente")
      .map((r) => r.moduleId),
  );

  const filtered = catalog.filter(
    (m) =>
      !filter ||
      m.name.toLowerCase().includes(filter.toLowerCase()) ||
      m.industry.toLowerCase().includes(filter.toLowerCase()) ||
      m.slug.toLowerCase().includes(filter.toLowerCase()),
  );

  const paid = filtered.filter((m) => Number(m.monthlyPrice) > 0);
  const free = filtered.filter((m) => Number(m.monthlyPrice) === 0);

  async function applyUpdate(id: number) {
    try {
      await portalApi.applyUpdate(id);
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      toast({ title: "Update aplicado" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo aplicar",
        description: err instanceof Error ? err.message : "Reintenta",
      });
    }
  }

  async function sendSupport() {
    if (!supportFor || !supportInput.trim()) return;
    const msg = supportInput.trim();
    setSupportInput("");
    const newHistory = [
      ...supportHistory,
      { role: "user" as const, content: msg },
    ];
    setSupportHistory(newHistory);
    setSupportSending(true);
    try {
      const r = await portalApi.moduleSupport(supportFor.id, msg, supportHistory);
      const reply = r.steps?.length
        ? `${r.reply}\n\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}${r.needsHuman ? "\n\nVamos a derivar este caso al equipo humano de AXYNTRAX." : ""}`
        : r.reply + (r.needsHuman ? "\n\nDerivado al equipo humano." : "");
      setSupportHistory([
        ...newHistory,
        { role: "assistant" as const, content: reply },
      ]);
    } catch (err) {
      setSupportHistory([
        ...newHistory,
        {
          role: "assistant" as const,
          content:
            err instanceof Error ? err.message : "No pude responder ahora.",
        },
      ]);
    } finally {
      setSupportSending(false);
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createQuote = async () => {
    if (selectedModules.length === 0) return;
    setCreatingQuote(true);
    try {
      const r = await portalApi.createQuote(selectedModules.map((m) => m.id));
      setCreatedQuote(r);
      setQuoteOpen(false);
      setSelectedIds(new Set());
      toast({
        title: "Cotización generada",
        description: r.emailSent
          ? "Te enviamos el PDF al correo."
          : "PDF listo para descargar (no se pudo enviar el correo).",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo cotizar",
        description: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setCreatingQuote(false);
    }
  };

  const requestModule = async (id: number) => {
    setBusyId(id);
    try {
      await portalApi.requestModule(id);
      toast({
        title: "Solicitud enviada",
        description: "El equipo de AXYNTRAX revisará y activará tu módulo pronto.",
      });
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo solicitar",
        description: err instanceof Error ? err.message : "Reintenta",
      });
    } finally {
      setBusyId(null);
    }
  };

  const clientName = session?.kind === "client" ? session.client.name : "";
  const clientCompany =
    session?.kind === "client" ? session.client.company : null;

  const expiringSoon = mine.filter((r) => {
    if (r.status !== "activo") return false;
    const d = daysUntil(r.expiresAt);
    return d !== null && d <= 3 && d >= 0;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {clientName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {clientCompany
            ? `${clientCompany} · Gestiona tus módulos AXYNTRAX`
            : "Gestiona tus módulos AXYNTRAX"}
        </p>
      </div>

      <div
        className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3"
        data-testid="banner-yape"
      >
        <div className="flex-1 min-w-[220px]">
          <div className="font-medium text-foreground">
            Para activar módulos pagos deposita por Yape
          </div>
          <div className="text-xs text-muted-foreground">
            Titular: Miguel Angel Montero Garcia · Después de pagar avísanos por
            el chat de JARVIS y activamos tu módulo en minutos.
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-foreground">
            Yape · 991 740 590
          </div>
        </div>
        <YapeQR size={88} />
      </div>

      {(() => {
        const pending = updates.filter((u) => u.status !== "applied");
        if (pending.length === 0) return null;
        return (
          <div
            className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 space-y-2"
            data-testid="banner-updates"
          >
            <div className="font-medium">
              Tienes {pending.length} actualización
              {pending.length === 1 ? "" : "es"} pendiente
              {pending.length === 1 ? "" : "s"}
            </div>
            <div className="space-y-2">
              {pending.map((u) => (
                <div
                  key={u.id}
                  className="flex items-start justify-between gap-3 border border-cyan-500/30 rounded p-2"
                  data-testid={`update-row-${u.id}`}
                >
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">
                        {u.moduleName ?? "Módulo"}
                      </span>{" "}
                      <span className="font-mono">v{u.version}</span> ·{" "}
                      <span className="uppercase">{u.severity}</span>
                    </div>
                    {u.releaseNotes ? (
                      <div className="text-cyan-200/80 whitespace-pre-wrap">
                        {u.releaseNotes}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyUpdate(u.id)}
                    data-testid={`btn-apply-update-${u.id}`}
                  >
                    Aplicar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {expiringSoon.length > 0 ? (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 flex gap-3"
          data-testid="banner-expiring-soon"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-medium">
              {expiringSoon.length === 1
                ? "Tienes 1 demo por vencer"
                : `Tienes ${expiringSoon.length} demos por vencer`}
            </div>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {expiringSoon.map((r) => {
                const d = daysUntil(r.expiresAt);
                return (
                  <li key={r.id}>
                    {r.moduleName} —{" "}
                    {d === 0
                      ? "vence hoy"
                      : d === 1
                        ? "vence mañana"
                        : `quedan ${d} días`}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Mis módulos</h2>
        {mine.length === 0 ? (
          <Card>
            <CardContent className="py-8 flex items-center gap-3 text-muted-foreground">
              <Info className="h-5 w-5" />
              <span>
                Todavía no tienes demos activas. Explora el catálogo abajo y
                solicita los módulos que quieres probar.
              </span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((row) => {
              const cfg = STATUS_BADGE[row.status] ?? STATUS_BADGE.pendiente;
              const Icon = cfg.icon;
              const days = daysUntil(row.expiresAt);
              const isActive = row.status === "activo";
              const isWarning = isActive && days !== null && days <= 3 && days >= 0;
              const countdownLabel =
                days === null
                  ? null
                  : days < 0
                    ? "Demo vencida"
                    : days === 0
                      ? "Vence hoy"
                      : days === 1
                        ? "Vence mañana"
                        : `Te quedan ${days} días`;
              return (
                <Card key={row.id} data-testid={`my-module-${row.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {row.moduleName}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {row.moduleIndustry} · Demo gratuita
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={cfg.className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    {row.activatedAt && (
                      <div>
                        Activada: {new Date(row.activatedAt).toLocaleDateString("es-PE")}
                      </div>
                    )}
                    {row.expiresAt && (
                      <div>
                        Vence: {new Date(row.expiresAt).toLocaleDateString("es-PE")}
                      </div>
                    )}
                    {countdownLabel && isActive ? (
                      <div
                        className={
                          isWarning
                            ? "flex items-center gap-1 font-medium text-amber-300"
                            : "flex items-center gap-1 text-emerald-300"
                        }
                        data-testid={`countdown-${row.id}`}
                      >
                        {isWarning ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {countdownLabel}
                        {isWarning ? " — te avisaremos cuando expire" : ""}
                      </div>
                    ) : null}
                    {row.notes && <div>Notas: {row.notes}</div>}
                    {row.status === "activo" && row.licenseKey ? (
                      <div className="pt-2 border-t border-border/60 space-y-1">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                          Clave de licencia
                        </div>
                        <div className="flex items-center gap-2">
                          <code
                            className="flex-1 truncate font-mono text-xs bg-muted/50 px-2 py-1 rounded text-foreground"
                            data-testid={`license-key-${row.id}`}
                          >
                            {row.licenseKey}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copyKey(row.id, row.licenseKey!)}
                            data-testid={`button-copy-key-${row.id}`}
                          >
                            {copiedId === row.id ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <a
                            href={portalApi.licensePdfUrl(row.id)}
                            target="_blank"
                            rel="noreferrer"
                            data-testid={`button-license-pdf-${row.id}`}
                          >
                            <Button type="button" size="sm" variant="outline">
                              <FileDown className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSupportFor(row)}
                            data-testid={`button-support-${row.id}`}
                          >
                            Soporte IA
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Usa esta clave para descargar y activar el módulo.
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-medium">Catálogo de módulos</h2>
          <Input
            placeholder="Buscar por nombre o industria"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
            data-testid="input-filter-catalog"
          />
        </div>

        {paid.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Módulos por suscripción
              </h3>
              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  onClick={() => setQuoteOpen(true)}
                  data-testid="button-open-quote"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Pedir cotización ({selectedIds.size})
                </Button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {paid.map((m) => {
                const blocked = blockedIds.has(m.id);
                const checked = selectedIds.has(m.id);
                return (
                  <Card key={m.id} data-testid={`catalog-${m.slug}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{m.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {m.industry}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                        >
                          Cotizable
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {m.description && (
                        <p className="text-sm text-muted-foreground">
                          {m.description}
                        </p>
                      )}
                      <div className="text-sm text-cyan-300 tabular-nums">
                        Desde {m.currency} {Number(m.monthlyPrice).toFixed(2)} / mes
                      </div>
                      <Button
                        size="sm"
                        variant={checked ? "secondary" : "default"}
                        className="w-full"
                        disabled={blocked}
                        onClick={() => toggleSelect(m.id)}
                        data-testid={`button-quote-${m.slug}`}
                      >
                        {blocked
                          ? "Ya tienes este módulo"
                          : checked
                            ? "Quitar de la cotización"
                            : "Agregar a cotización"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {free.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Demos gratuitas (30 días)
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {free.map((m) => {
                const blocked = blockedIds.has(m.id);
                return (
                  <Card key={m.id} data-testid={`catalog-${m.slug}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{m.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {m.industry} · Demo gratuita · 30 días
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        >
                          Demo gratis
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {m.description && (
                        <p className="text-sm text-muted-foreground">
                          {m.description}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={blocked || busyId === m.id}
                        onClick={() => requestModule(m.id)}
                        data-testid={`button-request-${m.slug}`}
                      >
                        {busyId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {blocked ? "Ya solicitado" : "Solicitar demo gratuita"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent data-testid="dialog-quote">
          <DialogHeader>
            <DialogTitle>Pedir cotización</DialogTitle>
            <DialogDescription>
              JARVIS generará una cotización formal con IGV (18%) y te
              enviará el PDF al correo registrado.
            </DialogDescription>
          </DialogHeader>
          <ul className="text-sm space-y-1 max-h-56 overflow-auto">
            {selectedModules.map((m) => (
              <li key={m.id} className="flex justify-between gap-3">
                <span>{m.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {m.currency} {Number(m.monthlyPrice).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuoteOpen(false)}
              disabled={creatingQuote}
            >
              Cancelar
            </Button>
            <Button
              onClick={createQuote}
              disabled={creatingQuote || selectedModules.length === 0}
              data-testid="button-confirm-quote"
            >
              {creatingQuote ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Generar cotización
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!createdQuote}
        onOpenChange={(o) => {
          if (!o) {
            setCreatedQuote(null);
            setCreatedQuoteAccepted(false);
          }
        }}
      >
        <DialogContent data-testid="dialog-quote-created">
          <DialogHeader>
            <DialogTitle>
              {createdQuoteAccepted
                ? "Cotización aceptada"
                : "Cotización lista"}
            </DialogTitle>
            <DialogDescription>
              {createdQuoteAccepted ? (
                <>
                  Solicitud creada. Paga ahora con Yape (escanea el QR o usa el
                  número 991 740 590) y avísanos por el chat de JARVIS para
                  activar los módulos en minutos.
                </>
              ) : (
                <>
                  Total mensual {createdQuote?.currency}{" "}
                  {createdQuote ? Number(createdQuote.total).toFixed(2) : ""}{" "}
                  (incluye IGV).
                  {createdQuote?.emailSent
                    ? " Te enviamos el PDF al correo."
                    : " No pudimos enviar el correo, igual puedes descargar el PDF acá."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {createdQuoteAccepted && (
            <div className="flex flex-col items-center gap-2 py-2">
              <YapeQR size={140} showCaption={false} />
              <p className="text-xs text-muted-foreground">
                Yape · Miguel Angel Montero Garcia · 991 740 590
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {createdQuote && (
              <a
                href={portalApi.quotePdfUrl(createdQuote.id)}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  variant="outline"
                  data-testid="button-download-created-pdf"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </a>
            )}
            {createdQuote && !createdQuoteAccepted && (
              <Button
                data-testid="button-accept-created-quote"
                disabled={acceptingCreated}
                onClick={async () => {
                  if (!createdQuote) return;
                  setAcceptingCreated(true);
                  try {
                    await portalApi.acceptQuote(createdQuote.id);
                    setCreatedQuoteAccepted(true);
                    await reload();
                    toast({
                      title: "Cotización aceptada",
                      description:
                        "Generamos las solicitudes pendientes en tus módulos.",
                    });
                  } catch (err) {
                    toast({
                      variant: "destructive",
                      title: "No se pudo aceptar",
                      description:
                        err instanceof Error ? err.message : "Intenta de nuevo",
                    });
                  } finally {
                    setAcceptingCreated(false);
                  }
                }}
              >
                {acceptingCreated ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Aceptar cotización
              </Button>
            )}
            <Link href="/mis-cotizaciones">
              <Button
                variant={createdQuoteAccepted ? "default" : "ghost"}
                data-testid="button-go-quotes"
              >
                Ver mis cotizaciones
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!supportFor}
        onOpenChange={(o) => {
          if (!o) {
            setSupportFor(null);
            setSupportHistory([]);
            setSupportInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Soporte IA · {supportFor?.moduleName}
            </DialogTitle>
            <DialogDescription>
              JARVIS Soporte, ingeniero TI senior, te ayuda en línea con este módulo.
            </DialogDescription>
          </DialogHeader>
          <div
            className="space-y-3 max-h-80 overflow-y-auto pr-1"
            data-testid="support-history"
          >
            {supportHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Cuéntale qué problema estás teniendo. No incluyas contraseñas.
              </p>
            ) : (
              supportHistory.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-sm"
                      : "mr-8 rounded-md bg-muted/40 border border-border px-3 py-2 text-sm whitespace-pre-wrap"
                  }
                  data-testid={`support-msg-${i}`}
                >
                  {m.content}
                </div>
              ))
            )}
            {supportSending ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> JARVIS está escribiendo...
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Input
              data-testid="input-support"
              placeholder="Describí el problema..."
              value={supportInput}
              onChange={(e) => setSupportInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendSupport();
                }
              }}
              disabled={supportSending}
            />
            <Button
              onClick={() => void sendSupport()}
              disabled={supportSending || !supportInput.trim()}
              data-testid="btn-send-support"
            >
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
