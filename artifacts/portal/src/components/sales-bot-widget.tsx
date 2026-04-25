import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { portalApi, type SalesBotReply } from "@/lib/portal-api";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  scope: "public" | "client";
  initialOpen?: boolean;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hola, soy Cecilia, asesora de AXYNTRAX. Contame de tu negocio y te recomiendo módulos de automatización con cotización al instante.",
};

export function SalesBotWidget({ scope, initialOpen = false }: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [history, setHistory] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading, open]);

  async function send() {
    const msg = draft.trim();
    if (!msg || loading) return;
    setDraft("");
    const next: Msg[] = [...history, { role: "user", content: msg }];
    setHistory(next);
    setLoading(true);
    try {
      const fn =
        scope === "public" ? portalApi.publicSalesBot : portalApi.quoteBot;
      const reply: SalesBotReply = await fn(
        msg,
        next.filter((m) => m !== GREETING),
      );
      setHistory((h) => [
        ...h,
        { role: "assistant", content: reply.reply || "(sin respuesta)" },
      ]);
    } catch (err) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? `No pude responder: ${err.message}`
              : "No pude responder ahora, intentá más tarde.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium px-4 py-3 shadow-lg shadow-cyan-500/30"
        data-testid="sales-bot-toggle"
      >
        <MessageCircle className="h-5 w-5" />
        Cecilia ventas
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
      data-testid="sales-bot-panel"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-cyan-500/10">
        <div>
          <div className="text-sm font-semibold text-cyan-300">
            Cecilia · Asesora AXYNTRAX
          </div>
          <div className="text-xs text-muted-foreground">
            Te cotizo al toque
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          data-testid="sales-bot-close"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-sm"
      >
        {history.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-lg bg-cyan-500 text-slate-950 px-3 py-2 whitespace-pre-wrap"
                : "mr-auto max-w-[90%] rounded-lg bg-muted text-foreground px-3 py-2 whitespace-pre-wrap"
            }
            data-testid={m.role === "assistant" ? "bot-msg" : "user-msg"}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Cecilia está
            escribiendo...
          </div>
        )}
      </div>
      <div className="border-t border-border p-2 flex gap-2 items-end">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Contame qué hace tu negocio..."
          rows={2}
          className="resize-none"
          data-testid="sales-bot-input"
        />
        <Button
          size="sm"
          onClick={() => void send()}
          disabled={loading || !draft.trim()}
          data-testid="sales-bot-send"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
