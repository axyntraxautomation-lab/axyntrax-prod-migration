import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFinances,
  useGetFinanceSummary,
  useListPayments,
  useCreateFinance,
  useDeleteFinance,
  useCreatePayment,
  useCulqiCharge,
  useGenerateSunatComprobante,
  getListFinancesQueryKey,
  getGetFinanceSummaryQueryKey,
  getListPaymentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  CreditCard,
  Trash2,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Square,
} from "lucide-react";

type Provider = "claude" | "gemini";

interface AxiaMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

const PEN = (v: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(v);

function statusBadge(status: string) {
  const variants: Record<string, string> = {
    pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    procesando: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    exitoso: "bg-primary/15 text-primary border-primary/30",
    fallido: "bg-destructive/15 text-destructive border-destructive/30",
    reembolsado: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return (
    <Badge variant="outline" className={variants[status] ?? ""}>
      {status}
    </Badge>
  );
}

export default function Finanzas() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: summary, isLoading: loadingSummary } = useGetFinanceSummary({
    query: {
      queryKey: getGetFinanceSummaryQueryKey(),
      refetchInterval: 30_000,
    },
  });
  const { data: finances, isLoading: loadingFinances } = useListFinances();
  const { data: payments, isLoading: loadingPayments } = useListPayments();

  const createFinance = useCreateFinance();
  const deleteFinance = useDeleteFinance();
  const createPayment = useCreatePayment();
  const culqiCharge = useCulqiCharge();
  const sunatComprobante = useGenerateSunatComprobante();

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveForm, setMoveForm] = useState({
    type: "ingreso",
    amount: "",
    currency: "PEN",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
  });

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    currency: "PEN",
    description: "",
    email: "",
    method: "culqi",
    clientId: "",
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: getListFinancesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
  };

  const handleCreateMove = async () => {
    const amount = Number(moveForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Monto inválido",
        description: "Ingresa un monto positivo.",
      });
      return;
    }
    await createFinance.mutateAsync({
      data: {
        type: moveForm.type as "ingreso" | "egreso",
        amount,
        currency: moveForm.currency,
        category: moveForm.category || null,
        description: moveForm.description || null,
        date: moveForm.date ? new Date(moveForm.date).toISOString() : null,
      },
    });
    toast({ title: "Movimiento creado" });
    setMoveOpen(false);
    setMoveForm({
      type: "ingreso",
      amount: "",
      currency: "PEN",
      category: "",
      description: "",
      date: new Date().toISOString().slice(0, 16),
    });
    refreshAll();
  };

  const handleDeleteFinance = async (id: number) => {
    await deleteFinance.mutateAsync({ id });
    refreshAll();
  };

  const handleCreatePayment = async () => {
    const amount = Number(payForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Monto inválido",
        description: "Ingresa un monto positivo.",
      });
      return;
    }
    try {
      if (payForm.method === "culqi") {
        await culqiCharge.mutateAsync({
          data: {
            amount,
            currency: payForm.currency,
            description: payForm.description || "Cobro AXYNTRAX",
            email: payForm.email || null,
            clientId: payForm.clientId ? Number(payForm.clientId) : null,
          },
        });
        toast({
          title: "Cobro Culqi enviado",
          description:
            "Si CULQI_SECRET_KEY no está configurada, se registró como cargo stub exitoso.",
        });
      } else {
        await createPayment.mutateAsync({
          data: {
            amount,
            currency: payForm.currency,
            method: payForm.method,
            status: "exitoso",
            description: payForm.description || null,
            clientId: payForm.clientId ? Number(payForm.clientId) : null,
          },
        });
        toast({ title: "Pago registrado" });
      }
      setPayOpen(false);
      setPayForm({
        amount: "",
        currency: "PEN",
        description: "",
        email: "",
        method: "culqi",
        clientId: "",
      });
      refreshAll();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo procesar el pago",
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSunat = async (paymentId: number, tipo: "boleta" | "factura") => {
    try {
      const result = await sunatComprobante.mutateAsync({
        id: paymentId,
        data: { tipo },
      });
      const blob = new Blob([result.xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.serie}-${String(result.correlativo).padStart(8, "0")}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: `Comprobante ${tipo} generado`,
        description: result.sunatNote ?? "XML descargado.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo generar el comprobante",
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const kpiCards = useMemo(
    () => [
      {
        icon: TrendingUp,
        label: "Ingresos del mes",
        value: PEN(summary?.ingresoMes ?? 0),
        accent: "text-primary",
      },
      {
        icon: TrendingDown,
        label: "Egresos del mes",
        value: PEN(summary?.egresoMes ?? 0),
        accent: "text-destructive",
      },
      {
        icon: Wallet,
        label: "Balance del mes",
        value: PEN(summary?.balanceMes ?? 0),
        accent: (summary?.balanceMes ?? 0) >= 0 ? "text-primary" : "text-destructive",
      },
      {
        icon: CreditCard,
        label: "MRR licencias activas",
        value: PEN(summary?.mrrActivo ?? 0),
        accent: "text-primary",
      },
    ],
    [summary],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
            <p className="text-muted-foreground">
              AXIA · Pagos Culqi · Comprobantes SUNAT (UBL 2.1).
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-new-finance">
                  <Plus className="h-4 w-4 mr-2" /> Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo movimiento</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={moveForm.type}
                      onValueChange={(v) => setMoveForm((p) => ({ ...p, type: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso</SelectItem>
                        <SelectItem value="egreso">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Monto</Label>
                      <Input
                        inputMode="decimal"
                        value={moveForm.amount}
                        onChange={(e) =>
                          setMoveForm((p) => ({ ...p, amount: e.target.value }))
                        }
                        data-testid="input-finance-amount"
                      />
                    </div>
                    <div>
                      <Label>Moneda</Label>
                      <Select
                        value={moveForm.currency}
                        onValueChange={(v) => setMoveForm((p) => ({ ...p, currency: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEN">PEN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Input
                      value={moveForm.category}
                      onChange={(e) =>
                        setMoveForm((p) => ({ ...p, category: e.target.value }))
                      }
                      placeholder="ej. servicios, software, salarios"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={moveForm.description}
                      onChange={(e) =>
                        setMoveForm((p) => ({ ...p, description: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Fecha</Label>
                    <Input
                      type="datetime-local"
                      value={moveForm.date}
                      onChange={(e) =>
                        setMoveForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateMove}
                    disabled={createFinance.isPending}
                    data-testid="button-save-finance"
                  >
                    {createFinance.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={payOpen} onOpenChange={setPayOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-payment">
                  <CreditCard className="h-4 w-4 mr-2" /> Cobrar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo cobro</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Método</Label>
                    <Select
                      value={payForm.method}
                      onValueChange={(v) => setPayForm((p) => ({ ...p, method: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="culqi">Culqi (tarjeta · Yape · Plin)</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Monto</Label>
                      <Input
                        inputMode="decimal"
                        value={payForm.amount}
                        onChange={(e) =>
                          setPayForm((p) => ({ ...p, amount: e.target.value }))
                        }
                        data-testid="input-payment-amount"
                      />
                    </div>
                    <div>
                      <Label>Moneda</Label>
                      <Select
                        value={payForm.currency}
                        onValueChange={(v) => setPayForm((p) => ({ ...p, currency: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEN">PEN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Email del cliente</Label>
                    <Input
                      type="email"
                      value={payForm.email}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="cliente@empresa.com"
                    />
                  </div>
                  <div>
                    <Label>Cliente ID (opcional)</Label>
                    <Input
                      type="number"
                      value={payForm.clientId}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, clientId: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      rows={2}
                      value={payForm.description}
                      onChange={(e) =>
                        setPayForm((p) => ({ ...p, description: e.target.value }))
                      }
                    />
                  </div>
                  {payForm.method === "culqi" && (
                    <p className="text-xs text-muted-foreground">
                      Si CULQI_SECRET_KEY no está configurada, el cargo se registra
                      en modo stub para pruebas (status exitoso, prefijo
                      <code className="mx-1 px-1 rounded bg-muted">stub_</code>).
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreatePayment}
                    disabled={createPayment.isPending || culqiCharge.isPending}
                    data-testid="button-save-payment"
                  >
                    {(createPayment.isPending || culqiCharge.isPending)
                      ? "Procesando..."
                      : "Procesar cobro"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((k) => (
            <Card key={k.label} className="bg-card">
              <CardContent className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </p>
                  <p className={`text-2xl font-bold mt-1 truncate ${k.accent}`}>
                    {loadingSummary ? <Skeleton className="h-7 w-24" /> : k.value}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <k.icon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments" data-testid="tab-payments">
              Pagos ({payments?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="movements" data-testid="tab-movements">
              Movimientos ({finances?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <Skeleton className="h-32" />
                ) : !payments || payments.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    No hay pagos aún. Creá un cobro para empezar.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Comprobante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                          <TableCell className="font-mono text-xs">#{p.id}</TableCell>
                          <TableCell className="font-semibold">
                            {p.currency} {Number(p.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{statusBadge(p.status)}</TableCell>
                          <TableCell className="max-w-[260px] truncate">
                            {p.description ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.status === "exitoso" ? (
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSunat(p.id, "boleta")}
                                  disabled={sunatComprobante.isPending}
                                  data-testid={`button-boleta-${p.id}`}
                                >
                                  <FileText className="h-3 w-3 mr-1" /> Boleta
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSunat(p.id, "factura")}
                                  disabled={sunatComprobante.isPending}
                                  data-testid={`button-factura-${p.id}`}
                                >
                                  <FileText className="h-3 w-3 mr-1" /> Factura
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" /> Movimientos financieros
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFinances ? (
                  <Skeleton className="h-32" />
                ) : !finances || finances.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    Sin movimientos registrados.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finances.map((f) => (
                        <TableRow key={f.id} data-testid={`row-finance-${f.id}`}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                f.type === "ingreso"
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : "bg-destructive/15 text-destructive border-destructive/30"
                              }
                            >
                              {f.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {f.currency} {Number(f.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {f.category ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate">
                            {f.description ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(f.date).toLocaleDateString("es-PE")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFinance(f.id)}
                              data-testid={`button-delete-finance-${f.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AxiaPanel summary={summary} />
    </div>
  );
}

function AxiaPanel({
  summary,
}: {
  summary?: {
    ingresoMes: number;
    egresoMes: number;
    balanceMes: number;
    mrrActivo: number;
    pagosPendientes: number;
    pagosExitososMes: number;
  };
}) {
  const { toast } = useToast();
  const [provider, setProvider] = useState<Provider>("claude");
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const seed = useMemo<AxiaMsg>(
    () => ({
      id: 0,
      role: "assistant",
      content:
        "Soy AXIA, tu asistente financiero. Tengo acceso al estado actual de ingresos, egresos, MRR y pagos. Pedime un análisis del mes, una proyección, o consejos para mejorar tu flujo de caja.",
    }),
    [],
  );
  const [messages, setMessages] = useState<AxiaMsg[]>([seed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async () => {
    const text = draft.trim();
    if (!text || streaming) return;
    const userMsg: AxiaMsg = { id: Date.now(), role: "user", content: text };
    const reply: AxiaMsg = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      pending: true,
    };
    const history = [...messages, userMsg];
    setMessages([...history, reply]);
    setDraft("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/axia", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          provider,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const d = JSON.parse(line.slice(6)) as {
              content?: string;
              done?: boolean;
              error?: string;
            };
            if (d.error) throw new Error(d.error);
            if (typeof d.content === "string") {
              acc += d.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === reply.id ? { ...m, content: acc, pending: !d.done } : m,
                ),
              );
            }
            if (d.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === reply.id ? { ...m, pending: false } : m,
                ),
              );
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message) throw parseErr;
          }
        }
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === reply.id
            ? { ...m, content: m.content || "(respuesta vacía)", pending: false }
            : m,
        ),
      );
    } catch (err) {
      const aborted =
        err instanceof DOMException && err.name === "AbortError";
      const errMsg = aborted
        ? "Cancelado."
        : err instanceof Error
          ? err.message
          : "Error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === reply.id
            ? {
                ...m,
                content: aborted
                  ? `${m.content}\n\n[${errMsg}]`.trim()
                  : `AXIA no respondió: ${errMsg}`,
                pending: false,
              }
            : m,
        ),
      );
      if (!aborted) {
        toast({
          variant: "destructive",
          title: "AXIA falló",
          description: errMsg,
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <Card className="bg-card sticky top-4 self-start max-h-[calc(100vh-2rem)] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" /> AXIA
          </CardTitle>
          <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude Sonnet</SelectItem>
              <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {summary && (
          <p className="text-xs text-muted-foreground">
            Balance mes {PEN(summary.balanceMes)} · MRR {PEN(summary.mrrActivo)} ·{" "}
            {summary.pagosPendientes} pagos pendientes
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[280px]"
          data-testid="axia-thread"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm rounded-lg px-3 py-2 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary/15 text-foreground ml-6"
                  : "bg-muted text-foreground mr-6"
              }`}
            >
              {m.content || (m.pending ? "..." : "")}
            </div>
          ))}
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
          }}
          rows={2}
          placeholder="Pídele a AXIA un análisis financiero..."
          disabled={streaming}
          data-testid="input-axia"
        />
        <div className="flex justify-end">
          {streaming ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => abortRef.current?.abort()}
              data-testid="button-axia-stop"
            >
              <Square className="h-3 w-3 mr-1" /> Detener
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={send}
              disabled={!draft.trim()}
              data-testid="button-axia-send"
            >
              {streaming ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
              Enviar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
