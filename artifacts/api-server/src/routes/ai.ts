import { Router, type IRouter } from "express";
import { createHash } from "node:crypto";
import { db, aiLogsTable } from "@workspace/db";
import { AiChatBody } from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYSTEM_PROMPT = `Eres AXYN CORE, el asistente de inteligencia artificial empresarial de AXYNTRAX AUTOMATION (Arequipa, Perú), fundada por Miguel Montero. Tu propósito es asistir al equipo en automatización, ventas, soporte al cliente, generación de leads, gestión CRM, redacción de propuestas comerciales y operaciones del negocio. Respondes siempre en español neutral profesional, sin emojis. Eres directo, conciso y orientado a la acción. Cuando convenga, propones próximos pasos concretos.`;

function hashContent(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

router.post("/ai/chat", requireAuth, async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const provider = parsed.data.provider ?? "claude";
  const messages = parsed.data.messages.filter((m) => m.role !== "system");
  const userId = req.user?.id ?? null;
  const startedAt = Date.now();
  const abortController = new AbortController();
  let clientAborted = false;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const onClose = () => {
    if (!res.writableEnded) {
      clientAborted = true;
      abortController.abort();
    }
  };
  req.on("close", onClose);

  const send = (data: Record<string, unknown>) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let fullResponse = "";
  let errorMessage: string | null = null;
  let chunkCount = 0;

  try {
    if (provider === "gemini") {
      const stream = await gemini.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: {
          maxOutputTokens: 8192,
          systemInstruction: SYSTEM_PROMPT,
          abortSignal: abortController.signal,
        },
      });
      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;
        const text = chunk.text;
        if (text) {
          chunkCount += 1;
          fullResponse += text;
          send({ content: text });
        }
      }
    } else {
      const stream = anthropic.messages.stream(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        },
        { signal: abortController.signal },
      );
      for await (const event of stream) {
        if (abortController.signal.aborted) break;
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          chunkCount += 1;
          fullResponse += event.delta.text;
          send({ content: event.delta.text });
        }
      }
    }
    if (!clientAborted) send({ done: true });
  } catch (err) {
    if (!clientAborted) {
      errorMessage = err instanceof Error ? err.message : String(err);
      send({ error: errorMessage });
    }
  } finally {
    req.off("close", onClose);
    if (!res.writableEnded) res.end();

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const promptHash = lastUser ? hashContent(lastUser.content) : null;
    const eventName = clientAborted
      ? "chat_aborted"
      : errorMessage
        ? "chat_error"
        : "chat_completed";

    try {
      await db.insert(aiLogsTable).values({
        source: provider === "gemini" ? "gemini" : "anthropic",
        event: eventName,
        message: `${provider}:${eventName}`,
        data: {
          userId,
          model:
            provider === "gemini" ? "gemini-2.5-flash" : "claude-sonnet-4-6",
          promptHash,
          promptChars: lastUser?.content.length ?? 0,
          chunkCount,
          responseLength: fullResponse.length,
          latencyMs: Date.now() - startedAt,
          aborted: clientAborted,
          errorMessage,
        },
      });
    } catch (logErr) {
      logger.warn(
        { err: logErr, event: eventName, provider },
        "Failed to persist ai_logs entry",
      );
    }
  }
});

export default router;
