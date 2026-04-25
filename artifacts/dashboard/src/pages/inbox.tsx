import { useEffect, useMemo, useRef, useState } from "react";
import {
  useListConversations,
  useGetConversation,
  useReplyConversation,
  useAssignConversation,
  useSetConversationStatus,
  useLinkConversationClient,
  useSyncGmail,
  useListUsers,
  useListClients,
  type Conversation,
  type Message,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  Send,
  Loader2,
  RefreshCw,
  MessageSquare,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Phone,
  Search,
} from "lucide-react";

const CHANNELS = [
  { value: "all", label: "Todos los canales" },
  { value: "web", label: "Web" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "gmail", label: "Gmail" },
];

const STATUSES = [
  { value: "all", label: "Todos los estados" },
  { value: "nuevo", label: "Nuevo" },
  { value: "en_curso", label: "En curso" },
  { value: "esperando", label: "Esperando" },
  { value: "resuelto", label: "Resuelto" },
  { value: "archivado", label: "Archivado" },
];

const STATUS_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  en_curso: "En curso",
  esperando: "Esperando",
  resuelto: "Resuelto",
  archivado: "Archivado",
};

function ChannelIcon({ channel }: { channel: string }) {
  const cls = "h-4 w-4";
  switch (channel) {
    case "gmail":
      return <Mail className={cls} />;
    case "facebook":
      return <Facebook className={cls} />;
    case "instagram":
      return <Instagram className={cls} />;
    case "whatsapp":
      return <Phone className={cls} />;
    case "web":
      return <Globe className={cls} />;
    default:
      return <MessageSquare className={cls} />;
  }
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export default function Inbox() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const detailRef = useRef<HTMLDivElement | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (channel !== "all") p.channel = channel;
    if (status !== "all") p.status = status;
    return p as { channel?: string; status?: string };
  }, [channel, status]);

  const conversationsQuery = useListConversations(params, {
    query: { refetchInterval: 15000 },
  });
  const usersQuery = useListUsers();
  const clientsQuery = useListClients();
  const detailQuery = useGetConversation(selectedId ?? 0, {
    query: { enabled: !!selectedId, refetchInterval: 10000 },
  });

  const replyMutation = useReplyConversation();
  const assignMutation = useAssignConversation();
  const statusMutation = useSetConversationStatus();
  const linkMutation = useLinkConversationClient();
  const gmailSync = useSyncGmail();

  const filteredList = useMemo(() => {
    const list = conversationsQuery.data ?? [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (c) =>
        (c.contactName ?? "").toLowerCase().includes(s) ||
        (c.contactHandle ?? "").toLowerCase().includes(s) ||
        (c.subject ?? "").toLowerCase().includes(s) ||
        (c.lastMessagePreview ?? "").toLowerCase().includes(s),
    );
  }, [conversationsQuery.data, search]);

  useEffect(() => {
    if (!selectedId && filteredList.length > 0) {
      setSelectedId(filteredList[0].id);
    }
  }, [filteredList, selectedId]);

  useEffect(() => {
    detailRef.current?.scrollTo({
      top: detailRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [detailQuery.data?.messages.length]);

  const detail = detailQuery.data;
  const conversation: Conversation | undefined = detail?.conversation;
  const messages: Message[] = detail?.messages ?? [];
  const users = usersQuery.data ?? [];
  const clients = clientsQuery.data ?? [];

  function refreshAll() {
    qc.invalidateQueries({ queryKey: ["/api/conversations"] });
    if (selectedId)
      qc.invalidateQueries({ queryKey: [`/api/conversations/${selectedId}`] });
  }

  async function handleReply() {
    if (!selectedId || !draft.trim()) return;
    try {
      await replyMutation.mutateAsync({
        id: selectedId,
        data: { content: draft.trim() },
      });
      setDraft("");
      refreshAll();
    } catch (err) {
      toast({
        title: "Error al enviar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    }
  }

  async function handleAssign(value: string) {
    if (!selectedId) return;
    const agentId = value === "none" ? null : parseInt(value, 10);
    try {
      await assignMutation.mutateAsync({ id: selectedId, data: { agentId } });
      refreshAll();
    } catch (err) {
      toast({
        title: "Error al asignar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    }
  }

  async function handleStatus(value: string) {
    if (!selectedId) return;
    try {
      await statusMutation.mutateAsync({
        id: selectedId,
        data: { status: value as any },
      });
      refreshAll();
    } catch (err) {
      toast({
        title: "Error al cambiar estado",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    }
  }

  async function handleLinkClient(value: string) {
    if (!selectedId) return;
    const clientId = value === "none" ? null : parseInt(value, 10);
    try {
      await linkMutation.mutateAsync({ id: selectedId, data: { clientId } });
      refreshAll();
    } catch (err) {
      toast({
        title: "Error al vincular cliente",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    }
  }

  async function handleGmailSync() {
    try {
      const result = await gmailSync.mutateAsync();
      toast({
        title: "Sincronización de Gmail",
        description: `Mensajes nuevos: ${result.insertedMessages} · Conversaciones: ${result.upsertedConversations}`,
      });
      refreshAll();
    } catch (err) {
      toast({
        title: "No se pudo sincronizar Gmail",
        description:
          err instanceof Error
            ? err.message
            : "Verifica que la conexión esté autorizada",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bandeja Unificada
          </h1>
          <p className="text-muted-foreground">
            Web · Facebook · Instagram · WhatsApp · Gmail
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGmailSync}
            disabled={gmailSync.isPending}
            data-testid="button-sync-gmail"
          >
            {gmailSync.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Sincronizar Gmail
          </Button>
          <Button
            variant="outline"
            onClick={refreshAll}
            data-testid="button-refresh-inbox"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-220px)]">
        {/* List pane */}
        <Card className="flex flex-col overflow-hidden">
          <CardContent className="p-3 flex flex-col gap-2 border-b">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, contacto o asunto"
                className="pl-8"
                data-testid="input-inbox-search"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger data-testid="select-inbox-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-inbox-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <ScrollArea className="flex-1">
            {conversationsQuery.isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">
                Cargando…
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                Aún no hay conversaciones en este filtro.
              </div>
            ) : (
              <ul>
                {filteredList.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left p-3 border-b hover-elevate ${
                        selectedId === c.id ? "bg-accent" : ""
                      }`}
                      data-testid={`conv-item-${c.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <ChannelIcon channel={c.channel} />
                          <span className="font-medium truncate">
                            {c.contactName ?? c.contactHandle ?? "(sin nombre)"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {fmtTime(c.lastMessageAt)}
                        </span>
                      </div>
                      {c.subject && (
                        <div className="text-xs text-muted-foreground truncate">
                          {c.subject}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {c.lastMessagePreview ?? ""}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                        {c.unreadCount > 0 && (
                          <Badge className="text-xs">{c.unreadCount}</Badge>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </Card>

        {/* Detail pane */}
        <Card className="flex flex-col overflow-hidden">
          {!conversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Selecciona una conversación
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ChannelIcon channel={conversation.channel} />
                      <h2
                        className="text-lg font-semibold truncate"
                        data-testid="text-conv-name"
                      >
                        {conversation.contactName ??
                          conversation.contactHandle ??
                          "(sin nombre)"}
                      </h2>
                    </div>
                    {conversation.contactHandle && (
                      <div className="text-xs text-muted-foreground">
                        {conversation.contactHandle}
                      </div>
                    )}
                    {conversation.subject && (
                      <div className="text-sm mt-1 font-medium">
                        {conversation.subject}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {conversation.channel}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select
                    value={conversation.status}
                    onValueChange={handleStatus}
                  >
                    <SelectTrigger data-testid="select-conv-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.filter((s) => s.value !== "all").map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={
                      conversation.assignedAgentId
                        ? String(conversation.assignedAgentId)
                        : "none"
                    }
                    onValueChange={handleAssign}
                  >
                    <SelectTrigger data-testid="select-conv-agent">
                      <SelectValue placeholder="Asignar agente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={
                      conversation.clientId
                        ? String(conversation.clientId)
                        : "none"
                    }
                    onValueChange={handleLinkClient}
                  >
                    <SelectTrigger data-testid="select-conv-client">
                      <SelectValue placeholder="Vincular CRM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin vincular</SelectItem>
                      {clients.map((cl) => (
                        <SelectItem key={cl.id} value={String(cl.id)}>
                          {cl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div ref={detailRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-12">
                    Sin mensajes en este hilo todavía.
                  </div>
                ) : (
                  messages.map((m) => {
                    if (m.direction === "system") {
                      return (
                        <div
                          key={m.id}
                          className="text-xs text-muted-foreground text-center"
                        >
                          {m.content} · {fmtTime(m.sentAt)}
                        </div>
                      );
                    }
                    const isOut = m.direction === "outbound";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                        data-testid={`msg-${m.id}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            isOut
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {m.senderName && (
                            <div className="text-xs opacity-70 mb-1">
                              {m.senderName}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-sm">
                            {m.content}
                          </div>
                          <div className="text-[10px] opacity-60 mt-1 text-right">
                            {fmtTime(m.sentAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t p-3 flex flex-col gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe una respuesta…"
                  rows={2}
                  className="resize-none"
                  data-testid="textarea-reply"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void handleReply();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Cmd/Ctrl + Enter para enviar
                  </span>
                  <Button
                    onClick={handleReply}
                    disabled={!draft.trim() || replyMutation.isPending}
                    data-testid="button-send-reply"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
