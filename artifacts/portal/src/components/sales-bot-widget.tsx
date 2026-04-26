import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { JarvisAvatar } from "@/components/ui/jarvis-avatar";
import { ChatBubble, ChatTypingIndicator } from "@/components/ui/chat-bubble";
import { portalApi, type SalesBotReply } from "@/lib/portal-api";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  scope: "public" | "client";
  initialOpen?: boolean;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hola, soy JARVIS, la IA principal de AXYNTRAX. Contame de tu negocio y te recomiendo módulos de automatización con cotización al instante. Si querés reservar tu módulo, depositá por Yape al 991 740 590 (Miguel Montero).",
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
        className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full gradient-cyan-violet px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_-12px_rgba(34,211,238,0.65)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-10px_rgba(34,211,238,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        data-testid="sales-bot-toggle"
      >
        <span className="relative inline-flex">
          <MessageCircle className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]" aria-hidden />
        </span>
        JARVIS ventas
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex h-[560px] max-h-[calc(100vh-2rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85 shadow-[0_30px_80px_-20px_rgba(34,211,238,0.45)] backdrop-blur-xl"
      data-testid="sales-bot-panel"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

      <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent px-4 py-3">
        <div className="flex items-center gap-3">
          <JarvisAvatar size="md" pulse />
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold text-slate-50">
              JARVIS · IA AXYNTRAX
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              En línea · Yape 991 740 590
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
          data-testid="sales-bot-close"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
      >
        <div className="mx-auto inline-flex w-full justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
            <Sparkles className="h-3 w-3" />
            Asistente IA en vivo
          </span>
        </div>
        {history.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role}
            data-testid={m.role === "assistant" ? "bot-msg" : "user-msg"}
          >
            <span data-testid={m.role === "assistant" ? "bot-msg" : "user-msg"}>
              {m.content}
            </span>
          </ChatBubble>
        ))}
        {loading && <ChatTypingIndicator />}
      </div>

      <div className="border-t border-white/5 bg-slate-950/60 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Contame qué hace tu negocio…"
            rows={2}
            className="min-h-[44px] resize-none rounded-xl border-white/10 bg-white/[0.03] text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
            data-testid="sales-bot-input"
          />
          <GradientButton
            size="sm"
            onClick={() => void send()}
            disabled={loading || !draft.trim()}
            data-testid="sales-bot-send"
            className="h-11 w-11 rounded-xl px-0"
            aria-label="Enviar"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </GradientButton>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-500">
          Enter para enviar · Shift + Enter salto de línea
        </p>
      </div>
    </div>
  );
}
