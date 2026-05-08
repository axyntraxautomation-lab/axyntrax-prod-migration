import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, Loader2, Trash2, Square } from "lucide-react";

type Provider = "claude" | "gemini";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

const PROVIDER_LABEL: Record<Provider, string> = {
  claude: "Claude Sonnet 4.6",
  gemini: "Gemini 2.5 Flash",
};

const SEED_GREETING: ChatMsg = {
  id: 0,
  role: "assistant",
  content:
    "Hola Miguel. Soy AXYN CORE. Conectado a Claude Sonnet y Gemini, listo para asistirte en automatización, ventas, propuestas comerciales y operaciones de AXYNTRAX. ¿En qué te ayudo?",
};

export default function AxynCore() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([SEED_GREETING]);
  const [draft, setDraft] = useState("");
  const [provider, setProvider] = useState<Provider>("claude");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || streaming) return;

    const userMsg: ChatMsg = {
      id: Date.now(),
      role: "user",
      content: text,
    };
    const assistantMsg: ChatMsg = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      pending: true,
    };
    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setDraft("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          provider,
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(
          res.status === 401
            ? "Sesión expirada. Inicia sesión de nuevo."
            : `Error del servidor (${res.status}).`,
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = line.slice(6);
          try {
            const data = JSON.parse(payload) as {
              content?: string;
              done?: boolean;
              error?: string;
            };
            if (data.error) throw new Error(data.error);
            if (typeof data.content === "string") {
              acc += data.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: acc, pending: !data.done }
                    : m,
                ),
              );
            }
            if (data.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, pending: false } : m,
                ),
              );
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message)
              throw parseErr;
          }
        }
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: m.content || "(respuesta vacía)",
                pending: false,
              }
            : m,
        ),
      );
    } catch (err) {
      const aborted =
        err instanceof DOMException && err.name === "AbortError";
      const errMsg = aborted
        ? "Generación cancelada."
        : err instanceof Error
          ? err.message
          : "Error desconocido";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: aborted
                  ? `${m.content || ""}\n\n[${errMsg}]`.trim()
                  : `No pude completar la respuesta: ${errMsg}`,
                pending: false,
              }
            : m,
        ),
      );
      if (!aborted) {
        toast({
          variant: "destructive",
          title: "AXYN CORE no respondió",
          description: errMsg,
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const clearChat = () => {
    if (streaming) return;
    setMessages([SEED_GREETING]);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-180px)] flex flex-col">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="rounded-md bg-primary text-primary-foreground h-7 w-7 inline-flex items-center justify-center font-bold text-xs">
              A
            </span>
            AXYN CORE
          </h1>
          <p className="text-muted-foreground">
            Inteligencia central de la agencia · {PROVIDER_LABEL[provider]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border">
            En vivo
          </Badge>
          <Select
            value={provider}
            onValueChange={(v) => setProvider(v as Provider)}
            disabled={streaming}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude Sonnet 4.6</SelectItem>
              <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={clearChat}
            disabled={streaming}
            title="Limpiar conversación"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Conversación
          </CardTitle>
        </CardHeader>
        <CardContent
          className="flex-1 overflow-y-auto p-6 space-y-4"
          ref={scrollRef}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1 flex items-center gap-1">
                    AXYN CORE
                    {m.pending && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </div>
                )}
                <p>{m.content || (m.pending ? "…" : "")}</p>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2 items-end"
          >
            <Textarea
              placeholder="Escribe a AXYN CORE… (Enter para enviar, Shift+Enter para nueva línea)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              className="flex-1 resize-none"
              disabled={streaming}
            />
            {streaming ? (
              <Button
                type="button"
                variant="destructive"
                onClick={cancel}
                title="Detener generación"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
}
