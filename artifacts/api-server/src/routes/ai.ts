import { Router, type IRouter } from "express";
import { createHash } from "node:crypto";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import {
  db,
  aiLogsTable,
  financesTable,
  paymentsTable,
  licensesTable,
} from "@workspace/db";
import { AiChatBody } from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYSTEM_PROMPT = `Eres AXYN CORE, el asistente de inteligencia artificial empresarial de AXYNTRAX AUTOMATION (Arequipa, Perú), fundada por Miguel Montero. Tu propósito es asistir al equipo en automatización, ventas, soporte al cliente, generación de leads, gestión CRM, redacción de propuestas comerciales y operaciones del negocio. Respondes siempre en español neutral profesional, sin emojis. Eres directo, conciso y orientado a la acción. Cuando convenga, propones próximos pasos concretos.`;

const AXIA_SYSTEM_PROMPT = `Eres AXIA, el asistente financiero IA de AXYNTRAX AUTOMATION (Arequipa, Perú). Tu trabajo: analizar ingresos, egresos, flujo de caja, MRR, ARR, churn de licencias, riesgo de morosidad y proyecciones. Recibes en cada turno un resumen JSON del estado financiero actual del negocio (ingresoMes, egresoMes, balanceMes, mrrActivo, pagosPendientes, pagosExitososMes, últimas operaciones). Respondes siempre en español profesional sin emojis, en montos PEN salvo que el usuario indique otra moneda. Da recomendaciones accionables y números concretos.`;

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

async function buildAxiaContext(): Promise<string> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ ingreso }] = await db
    .select({
      ingreso: sql<string | null>`coalesce(sum(${financesTable.amount}) filter (where ${financesTable.type} = 'ingreso'), 0)`,
    })
    .from(financesTable)
    .where(gte(financesTable.date, startOfMonth));

  const [{ egreso }] = await db
    .select({
      egreso: sql<string | null>`coalesce(sum(${financesTable.amount}) filter (where ${financesTable.type} = 'egreso'), 0)`,
    })
    .from(financesTable)
    .where(gte(financesTable.date, startOfMonth));

  const [{ mrr }] = await db
    .select({
      mrr: sql<string | null>`coalesce(sum(${licensesTable.amount}), 0)`,
    })
    .from(licensesTable)
    .where(eq(licensesTable.status, "activa"));

  const [{ pendientes }] = await db
    .select({ pendientes: sql<number>`cast(count(*) as int)` })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "pendiente"));

  const [{ exitosos }] = await db
    .select({ exitosos: sql<number>`cast(count(*) as int)` })
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.status, "exitoso"),
        gte(paymentsTable.createdAt, startOfMonth),
      ),
    );

  const recientes = await db
    .select({
      id: financesTable.id,
      type: financesTable.type,
      amount: financesTable.amount,
      currency: financesTable.currency,
      category: financesTable.category,
      date: financesTable.date,
    })
    .from(financesTable)
    .orderBy(desc(financesTable.date))
    .limit(10);

  const ing = Number(ingreso ?? 0);
  const egr = Number(egreso ?? 0);

  return JSON.stringify(
    {
      ingresoMes: ing,
      egresoMes: egr,
      balanceMes: +(ing - egr).toFixed(2),
      mrrActivo: Number(mrr ?? 0),
      pagosPendientes: pendientes,
      pagosExitososMes: exitosos,
      ultimasOperaciones: recientes.map((r) => ({
        id: r.id,
        type: r.type,
        amount: Number(r.amount),
        currency: r.currency,
        category: r.category,
        date: r.date.toISOString(),
      })),
    },
    null,
    2,
  );
}

router.post("/ai/axia", requireAuth, async (req, res): Promise<void> => {
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
    const ctx = await buildAxiaContext();
    const system = `${AXIA_SYSTEM_PROMPT}\n\nESTADO ACTUAL (JSON):\n${ctx}`;
    if (provider === "gemini") {
      const stream = await gemini.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: {
          maxOutputTokens: 8192,
          systemInstruction: system,
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
          system,
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
      ? "axia_aborted"
      : errorMessage
        ? "axia_error"
        : "axia_completed";

    try {
      await db.insert(aiLogsTable).values({
        source: provider === "gemini" ? "gemini" : "anthropic",
        event: eventName,
        message: `axia:${provider}:${eventName}`,
        data: {
          userId,
          assistant: "axia",
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
        "Failed to persist axia ai_logs entry",
      );
    }
  }
});

export default router;
