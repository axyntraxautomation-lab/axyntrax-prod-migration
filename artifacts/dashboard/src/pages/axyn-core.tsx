import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send } from "lucide-react";

interface Message {
  id: number;
  from: "user" | "core";
  text: string;
  timestamp: Date;
}

const SEED: Message[] = [
  {
    id: 1,
    from: "core",
    text: "Hola Miguel. Soy AXYN CORE, el agente central de tu agencia. En esta fase estoy corriendo en modo demo — la conexión a Claude Sonnet y Gemini se activa en la próxima fase. Mientras tanto, puedo ayudarte a explorar el dashboard.",
    timestamp: new Date(),
  },
];

export default function AxynCore() {
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const userMsg: Message = {
      id: Date.now(),
      from: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        from: "core",
        text: "Recibido. La inteligencia conversacional (Claude Sonnet + Gemini) se conectará en la fase de IA. Por ahora estoy en modo de eco. Si querés, andá a /crm para revisar tus prospectos o a /keygen para emitir una licencia.",
        timestamp: new Date(),
      };
      setMessages((m) => [...m, reply]);
    }, 700);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-180px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="rounded-md bg-primary text-primary-foreground h-7 w-7 inline-flex items-center justify-center font-bold text-xs">
              A
            </span>
            AXYN CORE
          </h1>
          <p className="text-muted-foreground">
            Inteligencia central de la agencia · Claude Sonnet · Gemini
          </p>
        </div>
        <Badge variant="outline" className="border-amber-500/50 text-amber-400">
          Modo demo
        </Badge>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Conversación
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  m.from === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.from === "core" && (
                  <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
                    AXYN CORE
                  </div>
                )}
                <p>{m.text}</p>
                <div className="text-[10px] opacity-50 mt-1">
                  {m.timestamp.toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Escribí a AXYN CORE..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
