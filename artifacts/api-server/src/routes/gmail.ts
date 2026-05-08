import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { requireAuth } from "../lib/auth";
import { ingestInbound } from "../lib/inbox";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const connectors = new ReplitConnectors();

interface GmailHeader {
  name: string;
  value: string;
}
interface GmailMessageMeta {
  id: string;
  threadId: string;
}
interface GmailFullMessage {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
    parts?: Array<{
      mimeType?: string;
      body?: { data?: string };
      parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
    }>;
    body?: { data?: string };
  };
}

function header(headers: GmailHeader[] | undefined, name: string): string | null {
  if (!headers) return null;
  const lower = name.toLowerCase();
  for (const h of headers) {
    if (h.name.toLowerCase() === lower) return h.value;
  }
  return null;
}

function parseFromAddress(raw: string | null): {
  name: string | null;
  email: string | null;
} {
  if (!raw) return { name: null, email: null };
  const match = raw.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: null, email: raw.trim() };
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function extractPlainText(payload: GmailFullMessage["payload"]): string {
  if (!payload) return "";
  const collect = (parts: any[]): string => {
    for (const p of parts) {
      if (p.mimeType === "text/plain" && p.body?.data) {
        return decodeBase64Url(p.body.data);
      }
    }
    for (const p of parts) {
      if (p.parts) {
        const nested = collect(p.parts);
        if (nested) return nested;
      }
    }
    for (const p of parts) {
      if (p.mimeType === "text/html" && p.body?.data) {
        return decodeBase64Url(p.body.data).replace(/<[^>]+>/g, " ");
      }
    }
    return "";
  };
  if (payload.parts) return collect(payload.parts).trim();
  if (payload.body?.data) return decodeBase64Url(payload.body.data).trim();
  return "";
}

router.post("/inbox/gmail/sync", requireAuth, async (_req, res) => {
  let listResp: Response;
  try {
    listResp = (await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages?maxResults=20&q=is%3Ainbox",
      { method: "GET" },
    )) as unknown as Response;
  } catch (err) {
    res.status(503).json({
      error:
        "No se pudo contactar Gmail. ¿La conexión sigue autorizada en Replit?",
      detail: err instanceof Error ? err.message : String(err),
    });
    return;
  }
  if (!listResp.ok) {
    if (listResp.status === 403) {
      res.status(503).json({
        error:
          "La conexión Gmail de Replit autoriza solo enviar correos (gmail.send) y gestionar etiquetas. " +
          "Para recibir Gmail en la bandeja unificada hace falta una credencial OAuth con scope gmail.readonly o gmail.modify, " +
          "o configurar Gmail Push (Pub/Sub) en Google Cloud. Las respuestas a hilos Gmail sí se envían correctamente.",
      });
      return;
    }
    res
      .status(listResp.status)
      .json({ error: `Gmail list failed: HTTP ${listResp.status}` });
    return;
  }
  const list = (await listResp.json()) as { messages?: GmailMessageMeta[] };
  const ids = list.messages ?? [];
  let upsertedConversations = 0;
  let insertedMessages = 0;
  let skipped = 0;
  for (const meta of ids) {
    try {
      const detResp = (await connectors.proxy(
        "google-mail",
        `/gmail/v1/users/me/messages/${meta.id}?format=full`,
        { method: "GET" },
      )) as unknown as Response;
      if (!detResp.ok) {
        skipped += 1;
        continue;
      }
      const m = (await detResp.json()) as GmailFullMessage;
      const headers = m.payload?.headers ?? [];
      const subject = header(headers, "Subject") ?? "(sin asunto)";
      const from = parseFromAddress(header(headers, "From"));
      const text = extractPlainText(m.payload) || m.snippet || "";
      if (!text) {
        skipped += 1;
        continue;
      }
      const sentAt = m.internalDate
        ? new Date(Number(m.internalDate))
        : undefined;
      const result = await ingestInbound({
        channel: "gmail",
        externalConversationId: `gmail:${m.threadId}`,
        externalMessageId: `gmail-msg:${m.id}`,
        contactName: from.name,
        contactHandle: from.email,
        subject,
        content: text,
        sentAt,
      });
      if (result.message) insertedMessages += 1;
      else skipped += 1;
      upsertedConversations += 1;
    } catch (err) {
      logger.warn({ err, gmailId: meta.id }, "Gmail message sync failed");
      skipped += 1;
    }
  }
  res.json({
    fetched: ids.length,
    upsertedConversations,
    insertedMessages,
    skipped,
  });
});

export default router;
