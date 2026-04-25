import { useMemo, useState } from "react";
import {
  useListConversations,
  useListGmailTemplates,
  useCeciliaTriage,
  useCeciliaDraftReply,
  useReplyConversation,
  useSyncGmail,
  useCreateGmailTemplate,
  useDeleteGmailTemplate,
  getListGmailTemplatesQueryKey,
  getListConversationsQueryKey,
  type Conversation,
  type CeciliaTriageResult,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Mail,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Plus,
  AlertTriangle,
} from "lucide-react";

const PRIORITY_VARIANT: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  alta: "destructive",
  media: "default",
  baja: "secondary",
};

const CATEGORY_LABEL: Record<string, string> = {
  lead: "Lead",
  soporte: "Soporte",
  factura: "Factura",
  personal: "Personal",
  spam: "Spam",
  otro: "Otro",
};

export default function Email() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [intent, setIntent] = useState("");
  const [tone, setTone] = useState<"formal" | "cordial" | "directo">("cordial");
  const [triage, setTriage] = useState<CeciliaTriageResult | null>(null);
  const [showTpl, setShowTpl] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplCategory, setTplCategory] = useState("general");
  const [tplBody, setTplBody] = useState("");

  const conversationsQuery = useListConversations(
    { channel: "gmail" },
    {
      query: {
        queryKey: getListConversationsQueryKey({ channel: "gmail" }),
        refetchInterval: 30_000,
      },
    },
  );
  const templatesQuery = useListGmailTemplates();
  const triageMutation = useCeciliaTriage();
  const draftMutation = useCeciliaDraftReply();
  const replyMutation = useReplyConversation();
  const syncMutation = useSyncGmail();
  const createTpl = useCreateGmailTemplate();
  const deleteTpl = useDeleteGmailTemplate();

  const conversations = useMemo<Conversation[]>(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  async function handleTriage() {
    if (!selectedId) return;
    setTriage(null);
    try {
      const r = await triageMutation.mutateAsync({
        data: { conversationId: selectedId },
      });
      setTriage(r);
      setDraft(r.suggestedReply);
      toast({ title: "Cecilia analizó el correo", description: r.summary });
    } catch (err) {
      toast({
        title: "Cecilia no pudo analizar",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  }

  async function handleDraft() {
    if (!selectedId) return;
    try {
      const r = await draftMutation.mutateAsync({
        data: { conversationId: selectedId, intent, tone },
      });
      setDraft(r.reply);
      toast({ title: "Borrador listo" });
    } catch (err) {
      toast({
        title: "Cecilia no pudo redactar",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  }

  async function handleSend() {
    if (!selectedId || !draft.trim()) return;
    try {
      await replyMutation.mutateAsync({
        id: selectedId,
        data: { content: draft },
      });
      toast({ title: "Respuesta enviada" });
      setDraft("");
      conversationsQuery.refetch();
    } catch (err) {
      toast({
        title: "No se pudo enviar",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  }

  async function handleSync() {
    try {
      const r = await syncMutation.mutateAsync();
      toast({
        title: "Gmail sincronizado",
        description: `Mensajes nuevos: ${r.insertedMessages ?? 0}`,
      });
      conversationsQuery.refetch();
    } catch (err) {
      toast({
        title: "Sync fallido",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  }

  async function handleCreateTpl() {
    if (!tplName.trim() || !tplBody.trim()) return;
    try {
      await createTpl.mutateAsync({
        data: {
          name: tplName,
          category: tplCategory,
          body: tplBody,
        },
      });
      setTplName("");
      setTplBody("");
      qc.invalidateQueries({ queryKey: getListGmailTemplatesQueryKey() });
      toast({ title: "Plantilla creada" });
    } catch (err) {
      toast({
        title: "Error creando plantilla",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email · Cecilia</h1>
          <p className="text-muted-foreground">
            Cecilia clasifica, prioriza y redacta respuestas automáticas para tu
            bandeja Gmail.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTpl((v) => !v)}
            data-testid="button-toggle-templates"
          >
            <Mail className="h-4 w-4 mr-2" />
            Plantillas ({templatesQuery.data?.length ?? 0})
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            data-testid="button-sync-gmail"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar Gmail
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Conversaciones Gmail</CardTitle>
            <CardDescription>
              {conversations.length} hilos detectados
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              {conversationsQuery.isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Cargando…
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  Conecta Gmail desde Replit (scope gmail.readonly o
                  gmail.modify) para empezar a recibir correos.
                </div>
              ) : (
                <ul>
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => {
                          setSelectedId(c.id);
                          setTriage(null);
                          setDraft("");
                        }}
                        className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 ${
                          selectedId === c.id ? "bg-muted" : ""
                        }`}
                        data-testid={`gmail-conv-${c.id}`}
                      >
                        <div className="text-sm font-medium truncate">
                          {c.contactName ?? c.contactHandle ?? "Sin remitente"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.subject ?? "(sin asunto)"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {c.lastMessagePreview}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Cecilia
            </CardTitle>
            <CardDescription>
              {selected
                ? `Hilo: ${selected.subject ?? selected.contactName ?? selected.id}`
                : "Selecciona un hilo de Gmail para que Cecilia lo analice."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleTriage}
                disabled={!selectedId || triageMutation.isPending}
                data-testid="button-triage"
              >
                {triageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Analizar y proponer respuesta
              </Button>
            </div>

            {triage && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{CATEGORY_LABEL[triage.category] ?? triage.category}</Badge>
                  <Badge
                    variant={
                      PRIORITY_VARIANT[triage.priority] ?? "outline"
                    }
                  >
                    Prioridad: {triage.priority}
                  </Badge>
                  <Badge variant="outline">
                    {triage.language === "es" ? "Español" : "Inglés"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {triage.summary}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Input
                placeholder="Intención (ej: agendar reunión esta semana)"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                data-testid="input-intent"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={tone}
                  onValueChange={(v) =>
                    setTone(v as "formal" | "cordial" | "directo")
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="cordial">Cordial</SelectItem>
                    <SelectItem value="directo">Directo</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={handleDraft}
                  disabled={!selectedId || draftMutation.isPending}
                  data-testid="button-draft"
                >
                  {draftMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Redactar borrador
                </Button>
              </div>
            </div>

            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="El borrador de Cecilia aparecerá aquí. Puedes editarlo antes de enviar."
              rows={10}
              data-testid="textarea-draft"
            />

            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={
                  !selectedId || !draft.trim() || replyMutation.isPending
                }
                data-testid="button-send"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar respuesta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showTpl && (
        <Card>
          <CardHeader>
            <CardTitle>Plantillas de Cecilia</CardTitle>
            <CardDescription>
              Respuestas tipo reutilizables para acelerar la atención.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder="Nombre"
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                data-testid="input-tpl-name"
              />
              <Input
                placeholder="Categoría"
                value={tplCategory}
                onChange={(e) => setTplCategory(e.target.value)}
                data-testid="input-tpl-category"
              />
              <Button
                onClick={handleCreateTpl}
                disabled={createTpl.isPending}
                data-testid="button-create-tpl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear
              </Button>
            </div>
            <Textarea
              placeholder="Cuerpo de la plantilla"
              value={tplBody}
              onChange={(e) => setTplBody(e.target.value)}
              rows={4}
              data-testid="textarea-tpl-body"
            />
            <div className="space-y-2">
              {(templatesQuery.data ?? []).map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between border rounded-md p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.category}
                    </div>
                    <div className="text-xs mt-1 line-clamp-2">{t.body}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDraft(t.body)}
                      data-testid={`button-use-tpl-${t.id}`}
                    >
                      Usar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        deleteTpl
                          .mutateAsync({ id: t.id })
                          .then(() =>
                            qc.invalidateQueries({
                              queryKey: getListGmailTemplatesQueryKey(),
                            }),
                          )
                      }
                      data-testid={`button-delete-tpl-${t.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
