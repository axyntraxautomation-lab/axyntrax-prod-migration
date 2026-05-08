import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { apiGet, type CeciliaMessage, type FaqItem } from "@/lib/api";
import {
  findFaqMatch,
  getCachedFaqs,
  setCachedFaqs,
} from "@/lib/faq-cache";
import { useTenantReady } from "@/providers/TenantProvider";

type ChatTurn = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  source?: "faq" | "cecilia";
};

type FaqsPayload = { faqs: FaqItem[] };

export function CeciliaFloatingChat() {
  const me = useTenantReady();
  const tenantId = me.tenant.id;
  const persona = me.rubro?.cecilia_persona ?? "asistente de tu negocio";
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [faqs, setFaqs] = useState<FaqItem[]>(() => getCachedFaqs(tenantId) ?? []);
  const conversationRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Carga FAQs una vez (cache LRU 1h).
  useEffect(() => {
    let cancelled = false;
    if (faqs.length > 0) return;
    apiGet<FaqsPayload>("/api/tenant/faqs")
      .then((data) => {
        if (cancelled) return;
        setCachedFaqs(tenantId, data.faqs);
        setFaqs(data.faqs);
      })
      .catch(() => {
        // Sin FAQs no es bloqueante: el chat seguirá llamando al modelo.
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, faqs.length]);

  // Saludo inicial cuando se abre por primera vez sin historial.
  useEffect(() => {
    if (!open || turns.length > 0) return;
    setTurns([
      {
        id: "welcome",
        role: "assistant",
        content: `Hola, soy Cecilia, ${persona} de ${me.tenant.nombreEmpresa}. ¿En qué te apoyo hoy?`,
        source: "cecilia",
      },
    ]);
  }, [open, turns.length, persona, me.tenant.nombreEmpresa]);

  // Auto-scroll al final tras cada turn nuevo.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, streaming]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text || streaming) return;
      const userTurn: ChatTurn = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
      };
      setTurns((prev) => [...prev, userTurn]);

      // Atajo via cache de FAQs (sin llamar al modelo).
      const match = findFaqMatch(text, faqs, 0.5);
      if (match) {
        setTurns((prev) => [
          ...prev,
          {
            id: `f-${Date.now()}`,
            role: "assistant",
            content: match.faq.respuesta,
            source: "faq",
          },
        ]);
        return;
      }

      // Stream desde el endpoint disfrazado de api-server.
      setStreaming(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const turnId = `a-${Date.now()}`;
      setTurns((prev) => [
        ...prev,
        { id: turnId, role: "assistant", content: "", source: "cecilia" },
      ]);
      try {
        const res = await fetch("/api/tenant/cecilia", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            message: text,
            conversation_id: conversationRef.current ?? undefined,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const json = trimmed.slice(5).trim();
            if (!json) continue;
            try {
              const parsed = JSON.parse(json) as {
                content?: string;
                conversation_id?: string;
                error?: string;
                done?: boolean;
              };
              if (parsed.conversation_id) {
                conversationRef.current = parsed.conversation_id;
              }
              if (parsed.content) {
                setTurns((prev) =>
                  prev.map((t) =>
                    t.id === turnId
                      ? { ...t, content: t.content + parsed.content }
                      : t,
                  ),
                );
              }
              if (parsed.error) {
                setTurns((prev) =>
                  prev.map((t) =>
                    t.id === turnId
                      ? {
                          ...t,
                          content:
                            t.content ||
                            "Cecilia no pudo responder en este momento. Intenta de nuevo.",
                        }
                      : t,
                  ),
                );
              }
            } catch {
              // chunk malformado, lo ignoramos
            }
          }
        }
      } catch (err) {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  content:
                    t.content || "No se pudo contactar con Cecilia. Revisa tu conexión.",
                }
              : t,
          ),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, faqs],
  );

  const handleSend = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text) return;
      setInput("");
      void sendMessage(text);
    },
    [input, sendMessage],
  );

  // Sugerencias proactivas: las primeras 3 FAQs disponibles. Se muestran
  // arriba del input mientras no haya mensajes del usuario, así Cecilia
  // ofrece respuestas antes de que el cliente tenga que escribir.
  const suggestedFaqs = useMemo(() => faqs.slice(0, 3), [faqs]);
  const hasUserTurn = turns.some((t) => t.role === "user");
  const showSuggestions = !hasUserTurn && !streaming && suggestedFaqs.length > 0;

  const headerStyle = useMemo(
    () => ({
      background:
        "linear-gradient(135deg, var(--color-primario), var(--color-secundario))",
    }),
    [],
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir chat con Cecilia"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105 active:scale-95"
        style={headerStyle}
        data-testid="cecilia-fab"
      >
        <span className="text-base font-bold">C</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Chat con Cecilia"
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:left-auto sm:max-w-sm sm:rounded-2xl sm:border"
      data-testid="cecilia-chat"
    >
      <header
        className="flex items-center gap-3 rounded-t-2xl px-4 py-3 text-white"
        style={headerStyle}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
          C
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Cecilia</div>
          <div className="text-[11px] opacity-90">{persona}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            abortRef.current?.abort();
            setOpen(false);
          }}
          aria-label="Cerrar chat"
          className="ml-auto rounded-full bg-white/15 px-2 py-1 text-xs hover:bg-white/25"
        >
          Cerrar
        </button>
      </header>
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        data-testid="cecilia-scroller"
      >
        <ul className="space-y-2">
          {turns.map((t) => (
            <li
              key={t.id}
              className={
                t.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl px-3 py-2 text-sm text-white"
                  : "mr-auto max-w-[85%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-900"
              }
              style={
                t.role === "user"
                  ? { background: "var(--color-primario)" }
                  : undefined
              }
            >
              {t.content || (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:240ms]" />
                </span>
              )}
              {t.source === "faq" ? (
                <div className="mt-1 text-[10px] uppercase tracking-wider opacity-60">
                  respuesta de FAQs
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      {showSuggestions ? (
        <div
          className="border-t border-gray-100 px-3 pt-2"
          data-testid="cecilia-suggestions"
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Preguntas frecuentes
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {suggestedFaqs.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => void sendMessage(f.pregunta)}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  data-testid={`cecilia-suggestion-${f.id}`}
                >
                  {f.pregunta}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          aria-label="Mensaje para Cecilia"
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "var(--color-primario)" } as CSSProperties}
          disabled={streaming}
          data-testid="cecilia-input"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: "var(--color-primario)" }}
          data-testid="cecilia-send"
        >
          {streaming ? "…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}

// Helper exportado para hidratar historial desde el server (no usado aún).
export type { CeciliaMessage };
