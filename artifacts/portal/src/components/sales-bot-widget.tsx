import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { CeciliaAvatar } from "@/components/ui/jarvis-avatar";
import { ChatBubble, ChatTypingIndicator } from "@/components/ui/chat-bubble";
import {
  portalApi,
  type CatalogModule,
  type SalesBotReply,
} from "@/lib/portal-api";
import { useAuth } from "@/lib/auth-context";

type Msg = {
  role: "user" | "assistant";
  content: string;
  recommendedSlugs?: string[];
  ctaQuote?: boolean;
};

interface Props {
  scope: "public" | "client";
  initialOpen?: boolean;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hola, soy Cecilia, la asesora IA de AXYNTRAX. Cuéntame de tu negocio y te recomiendo módulos de automatización con cotización al instante. Si quieres reservar tu módulo, deposita por Yape al 991 740 590 (Miguel Montero).",
};

export function SalesBotWidget({ scope, initialOpen = false }: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [history, setHistory] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<CatalogModule[] | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    let cancelled = false;
    portalApi
      .catalog()
      .then((rows) => {
        if (!cancelled) setCatalog(rows);
      })
      .catch(() => {
        // Catalog optional; ignore failures here.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogBySlug = useMemo(() => {
    const map = new Map<string, CatalogModule>();
    for (const m of catalog ?? []) map.set(m.slug, m);
    return map;
  }, [catalog]);

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
        next
          .filter((m) => m !== GREETING)
          .map((m) => ({ role: m.role, content: m.content })),
      );
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: reply.reply || "(sin respuesta)",
          recommendedSlugs: reply.recommendedModuleSlugs ?? [],
          ctaQuote: !!reply.ctaQuote,
        },
      ]);
    } catch (err) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? `No pude responder: ${err.message}`
              : "No pude responder ahora, intenta más tarde.",
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
        Cecilia · Ventas
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
          <CeciliaAvatar size="md" pulse />
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold text-slate-50">
              Cecilia · Ventas AXYNTRAX
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
        {history.map((m, i) => {
          const recs = (m.recommendedSlugs ?? [])
            .map((s) => catalogBySlug.get(s))
            .filter((x): x is CatalogModule => !!x);
          return (
            <div key={i} className="space-y-2">
              <ChatBubble
                role={m.role}
                data-testid={m.role === "assistant" ? "bot-msg" : "user-msg"}
              >
                <span
                  data-testid={m.role === "assistant" ? "bot-msg" : "user-msg"}
                >
                  {m.content}
                </span>
              </ChatBubble>
              {m.role === "assistant" && recs.length > 0 && (
                <div
                  className="space-y-2 pl-2"
                  data-testid="bot-recommendations"
                >
                  {recs.map((mod) => {
                    const isPaid = Number(mod.monthlyPrice) > 0;
                    return (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.05] p-3"
                        data-testid={`bot-rec-${mod.slug}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-display text-xs font-semibold text-slate-50">
                            {mod.name}
                          </div>
                          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-200">
                            {isPaid ? "Cotizable" : "Demo"}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-cyan-200">
                          {isPaid
                            ? `${mod.currency} ${Number(mod.monthlyPrice).toFixed(2)} / mes`
                            : "Demo gratuita 30 días"}
                        </div>
                        {mod.description && (
                          <p className="mt-1 text-[11px] leading-snug text-slate-400">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {m.role === "assistant" && m.ctaQuote && (
                <div className="pl-2">
                  <Link
                    href={
                      session
                        ? scope === "client"
                          ? "/mis-modulos"
                          : "/mis-modulos"
                        : "/login?tab=register"
                    }
                  >
                    <GradientButton
                      size="sm"
                      variant="primary"
                      className="w-full"
                      data-testid="bot-cta-quote"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {session
                        ? "Ir a pedir cotización"
                        : "Crear cuenta y cotizar"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </GradientButton>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
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
            placeholder="Cuéntame qué hace tu negocio…"
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
