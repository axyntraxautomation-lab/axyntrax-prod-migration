import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Zap,
} from "lucide-react";

interface FeedItem {
  id: string;
  source: string;
  kind: string;
  title: string;
  detail: string;
  severity: "info" | "ok" | "warn" | "error";
  at: string;
}

interface FeedResponse {
  items: FeedItem[];
  summary: {
    ai: number;
    modules: number;
    quotes: number;
    licenses: number;
    conversations: number;
    alerts: number;
  };
  generatedAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

function severityIcon(s: FeedItem["severity"]) {
  switch (s) {
    case "error":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
    case "warn":
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
    case "ok":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    default:
      return <Info className="h-3.5 w-3.5 text-cyan-400" />;
  }
}

function severityChip(s: FeedItem["severity"]) {
  const map: Record<FeedItem["severity"], string> = {
    error: "border-red-500/40 bg-red-500/10 text-red-300",
    warn: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  };
  return map[s];
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function JarvisLive() {
  const { toast } = useToast();
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "JARVIS en línea. Centro de mando AXYNTRAX activo. Preguntame lo que pasa en la web, clientes, cotizaciones, módulos o seguridad.",
      at: new Date().toISOString(),
    },
  ]);
  const [chatBusy, setChatBusy] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const feedQuery = useQuery<FeedResponse>({
    queryKey: ["jarvis-live-feed"],
    queryFn: async () => {
      const res = await fetch("/api/jarvis/live-feed", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("feed");
      return (await res.json()) as FeedResponse;
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory.length, chatBusy]);

  const send = async () => {
    const msg = chatInput.trim();
    if (!msg || chatBusy) return;
    setChatInput("");
    const newUserMsg: ChatMessage = {
      role: "user",
      content: msg,
      at: new Date().toISOString(),
    };
    const nextHistory = [...chatHistory, newUserMsg];
    setChatHistory(nextHistory);
    setChatBusy(true);
    try {
      const res = await fetch("/api/jarvis/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          history: nextHistory.slice(-12).map((h) => ({
            role: h.role,
            content: h.content,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "fallo");
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "Sin respuesta.",
          at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "JARVIS no respondió",
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setChatBusy(false);
    }
  };

  const items = feedQuery.data?.items ?? [];
  const summary = feedQuery.data?.summary;

  const counters = useMemo(
    () => [
      { label: "Eventos IA", value: summary?.ai ?? 0, color: "text-cyan-300" },
      {
        label: "Módulos",
        value: summary?.modules ?? 0,
        color: "text-violet-300",
      },
      {
        label: "Cotizaciones",
        value: summary?.quotes ?? 0,
        color: "text-emerald-300",
      },
      {
        label: "Licencias",
        value: summary?.licenses ?? 0,
        color: "text-amber-300",
      },
      {
        label: "Charlas",
        value: summary?.conversations ?? 0,
        color: "text-blue-300",
      },
      {
        label: "Alertas",
        value: summary?.alerts ?? 0,
        color:
          (summary?.alerts ?? 0) > 0 ? "text-red-300" : "text-slate-400",
      },
    ],
    [summary],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-cyan-400" />
            JARVIS Live
          </h1>
          <p className="text-muted-foreground">
            Monitor en vivo y chat con JARVIS sobre todo lo que pasa en la web y
            sistemas.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => feedQuery.refetch()}
          disabled={feedQuery.isFetching}
          data-testid="button-refresh-feed"
        >
          {feedQuery.isFetching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {counters.map((c) => (
          <Card key={c.label} className="p-0">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">
                {c.label}
              </div>
              <div className={`text-2xl font-bold mt-1 ${c.color}`}>
                {c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed live */}
        <Card className="flex flex-col h-[640px]">
          <CardHeader className="border-b border-white/[0.06]">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Feed en vivo
              <Badge
                variant="outline"
                className="ml-auto text-[10px] border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
              >
                auto-refresh 10s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y divide-white/[0.05]">
                {feedQuery.isLoading && (
                  <div className="p-6 text-sm text-slate-400">
                    Cargando feed...
                  </div>
                )}
                {!feedQuery.isLoading && items.length === 0 && (
                  <div className="p-6 text-sm text-slate-400">
                    Sin eventos recientes. Cuando entren mensajes, cotizaciones
                    o se activen módulos, aparecerán acá.
                  </div>
                )}
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="px-4 py-3 hover:bg-white/[0.03] transition-colors"
                    data-testid={`feed-item-${it.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {severityIcon(it.severity)}
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {it.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${severityChip(it.severity)}`}
                        >
                          {it.source}
                        </Badge>
                        <span className="text-[10px] text-slate-500">
                          {timeAgo(it.at)}
                        </span>
                      </div>
                    </div>
                    {it.detail && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {it.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat JARVIS */}
        <Card className="flex flex-col h-[640px]">
          <CardHeader className="border-b border-white/[0.06]">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-400" />
              Chat con JARVIS
              <Badge
                variant="outline"
                className="ml-auto text-[10px] border-violet-500/30 bg-violet-500/10 text-violet-300"
              >
                contexto en vivo
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              {chatHistory.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-slate-100"
                        : "bg-white/[0.04] border border-white/[0.08] text-slate-200"
                    }`}
                    data-testid={`chat-msg-${i}`}
                  >
                    {m.role === "assistant" && (
                      <div className="text-[10px] uppercase tracking-wide text-cyan-400 mb-1">
                        JARVIS
                      </div>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              {chatBusy && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-slate-400 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    JARVIS pensando...
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/[0.06] p-3 flex items-center gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Pregúntale a JARVIS: ¿qué pasó hoy? ¿cuántos clientes activos? ¿alguna alerta?"
                disabled={chatBusy}
                data-testid="input-chat-jarvis"
              />
              <Button
                onClick={() => void send()}
                disabled={chatBusy || !chatInput.trim()}
                data-testid="button-send-jarvis"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
