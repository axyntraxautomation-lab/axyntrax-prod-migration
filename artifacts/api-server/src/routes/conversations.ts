import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  usersTable,
  clientsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { VALID_STATUSES } from "../lib/inbox";
import { sendGmail } from "../lib/gmail-client";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ELEVATED_ROLES = ["admin", "supervisor"];

function isElevated(role: string): boolean {
  return ELEVATED_ROLES.includes(role);
}

router.get("/conversations", requireAuth, async (req, res) => {
  const conditions = [];
  if (typeof req.query.channel === "string") {
    conditions.push(eq(conversationsTable.channel, req.query.channel));
  }
  if (typeof req.query.status === "string") {
    conditions.push(eq(conversationsTable.status, req.query.status));
  }

  if (!isElevated(req.user!.role)) {
    conditions.push(eq(conversationsTable.assignedAgentId, req.user!.id));
  } else if (typeof req.query.assignedAgentId === "string") {
    const agentId = parseInt(req.query.assignedAgentId, 10);
    if (Number.isFinite(agentId)) {
      conditions.push(eq(conversationsTable.assignedAgentId, agentId));
    }
  }

  const limit = Math.min(
    parseInt(String(req.query.limit ?? "100"), 10) || 100,
    500,
  );
  const rows = await db
    .select()
    .from(conversationsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(conversationsTable.lastMessageAt))
    .limit(limit);
  res.json(rows);
});

router.get("/conversations/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .limit(1);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  if (
    !isElevated(req.user!.role) &&
    conversation.assignedAgentId !== req.user!.id
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.sentAt));

  if (conversation.unreadCount > 0) {
    await db
      .update(conversationsTable)
      .set({ unreadCount: 0 })
      .where(eq(conversationsTable.id, id));
    conversation.unreadCount = 0;
  }
  res.json({ conversation, messages });
});

router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const content =
    typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) {
    res.status(400).json({ error: "content required" });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .limit(1);
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  if (!isElevated(req.user!.role) && conv.assignedAgentId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const sentAt = new Date();
  let status: "delivered" | "queued" | "failed" = "queued";
  let errorMessage: string | null = null;
  let externalMessageId: string | null = null;

  if (conv.channel === "gmail" && conv.contactHandle) {
    const threadId =
      conv.externalId && conv.externalId.startsWith("gmail:")
        ? conv.externalId.slice("gmail:".length)
        : null;
    const subject = conv.subject ?? "(sin asunto)";
    const sendResult = await sendGmail({
      to: conv.contactHandle,
      subject,
      body: content,
      threadId,
    });
    if (sendResult.ok) {
      status = "delivered";
      externalMessageId = sendResult.externalMessageId
        ? `gmail-msg:${sendResult.externalMessageId}`
        : null;
    } else {
      status = "failed";
      errorMessage = sendResult.error ?? "Gmail send failed";
      logger.warn(
        { conversationId: id, err: errorMessage },
        "Gmail send failed",
      );
    }
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId: id,
      direction: "outbound",
      senderUserId: req.user!.id,
      senderName: req.user!.name,
      content,
      status,
      errorMessage,
      externalMessageId,
      sentAt,
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({
      lastMessageAt: sentAt,
      lastMessagePreview: content.slice(0, 140),
      status: conv.status === "nuevo" ? "en_curso" : conv.status,
    })
    .where(eq(conversationsTable.id, id));

  res.status(201).json(message);
});

router.post(
  "/conversations/:id/assign",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const agentId = req.body?.agentId;
    if (agentId !== null && !Number.isFinite(Number(agentId))) {
      res.status(400).json({ error: "agentId must be integer or null" });
      return;
    }
    if (agentId !== null) {
      const [agent] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, Number(agentId)))
        .limit(1);
      if (!agent) {
        res.status(400).json({ error: "Agent not found" });
        return;
      }
    }
    const [updated] = await db
      .update(conversationsTable)
      .set({ assignedAgentId: agentId === null ? null : Number(agentId) })
      .where(eq(conversationsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.insert(messagesTable).values({
      conversationId: id,
      direction: "system",
      senderUserId: req.user!.id,
      senderName: req.user!.name,
      content:
        agentId === null
          ? "Conversación desasignada"
          : `Conversación asignada a agente #${Number(agentId)}`,
      status: "logged",
    });
    res.json(updated);
  },
);

router.post("/conversations/:id/status", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const status = req.body?.status;
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .limit(1);
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  if (!isElevated(req.user!.role) && conv.assignedAgentId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(conversationsTable)
    .set({ status })
    .where(eq(conversationsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.insert(messagesTable).values({
    conversationId: id,
    direction: "system",
    senderUserId: req.user!.id,
    senderName: req.user!.name,
    content: `Estado cambiado a "${status}"`,
    status: "logged",
  });
  res.json(updated);
});

router.post(
  "/conversations/:id/link-client",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const clientId = req.body?.clientId;
    if (clientId !== null && !Number.isFinite(Number(clientId))) {
      res.status(400).json({ error: "clientId must be integer or null" });
      return;
    }
    if (clientId !== null) {
      const [client] = await db
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.id, Number(clientId)))
        .limit(1);
      if (!client) {
        res.status(400).json({ error: "Client not found" });
        return;
      }
    }
    const [updated] = await db
      .update(conversationsTable)
      .set({ clientId: clientId === null ? null : Number(clientId) })
      .where(eq(conversationsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.insert(messagesTable).values({
      conversationId: id,
      direction: "system",
      senderUserId: req.user!.id,
      senderName: req.user!.name,
      content:
        clientId === null
          ? "Cliente CRM desvinculado"
          : `Vinculado al cliente CRM #${Number(clientId)}`,
      status: "logged",
    });
    res.json(updated);
  },
);

export default router;
