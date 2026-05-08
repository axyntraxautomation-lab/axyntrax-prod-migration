import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import {
  db,
  conversationsTable,
  messagesTable,
  gmailTemplatesTable,
  aiLogsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { audit } from "../lib/audit";

const router: IRouter = Router();

const CECILIA_SYSTEM = `Eres Cecilia, asistente ejecutiva de Miguel Montero (AXYNTRAX AUTOMATION, Arequipa, Perú).
Tu trabajo: leer correos en español/inglés, clasificarlos y proponer respuestas claras y profesionales en español neutro.
NO uses emojis. Estilo: directo, breve, cordial, en tono empresarial peruano.
Categorías permitidas: lead, soporte, factura, personal, spam, otro.
Prioridades permitidas: alta, media, baja.
Devuelve siempre JSON estricto cuando se te pida triage.`;

const TriageBody = z.object({
  conversationId: z.number().int().positive(),
});

interface TriageResult {
  category: "lead" | "soporte" | "factura" | "personal" | "spam" | "otro";
  priority: "alta" | "media" | "baja";
  summary: string;
  suggestedReply: string;
  language: "es" | "en";
}

async function loadConversationContext(
  id: number,
): Promise<{ subject: string | null; thread: string } | null> {
  const conv = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!conv[0]) return null;
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.sentAt);
  const thread = msgs
    .slice(-12)
    .map((m) => `[${m.direction}] ${m.content ?? ""}`)
    .join("\n---\n");
  return { subject: conv[0].subject, thread };
}

router.post("/gmail/cecilia/triage", requireAuth, async (req, res): Promise<void> => {
  const parsed = TriageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const ctx = await loadConversationContext(parsed.data.conversationId);
  if (!ctx) {
    res.status(404).json({ error: "Conversación no encontrada" });
    return;
  }
  const prompt = `Asunto: ${ctx.subject ?? "(sin asunto)"}
Hilo (más reciente al final):
${ctx.thread}

Devuelve SOLO un JSON con:
{"category":"...","priority":"...","summary":"...","suggestedReply":"...","language":"es|en"}`;
  try {
    const result = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: CECILIA_SYSTEM,
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    });
    const text = result.text ?? "";
    let triage: TriageResult;
    try {
      triage = JSON.parse(text) as TriageResult;
    } catch {
      res
        .status(502)
        .json({ error: "Cecilia devolvió un formato inesperado", raw: text });
      return;
    }
    await db.insert(aiLogsTable).values({
      source: "gemini",
      event: "cecilia_triage",
      message: `triage:${triage.category}:${triage.priority}`,
      data: {
        userId: req.user?.id,
        conversationId: parsed.data.conversationId,
        category: triage.category,
        priority: triage.priority,
      },
    });
    await audit(req, {
      action: "cecilia.triage",
      entityType: "conversation",
      entityId: parsed.data.conversationId,
      meta: { category: triage.category, priority: triage.priority },
    });
    res.json(triage);
  } catch (err) {
    res.status(502).json({
      error: "Cecilia no respondió",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

const DraftBody = z.object({
  conversationId: z.number().int().positive(),
  intent: z.string().max(500).optional(),
  tone: z.enum(["formal", "cordial", "directo"]).optional(),
});

router.post(
  "/gmail/cecilia/draft-reply",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = DraftBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const ctx = await loadConversationContext(parsed.data.conversationId);
    if (!ctx) {
      res.status(404).json({ error: "Conversación no encontrada" });
      return;
    }
    const intent = parsed.data.intent ?? "responder de forma profesional";
    const tone = parsed.data.tone ?? "cordial";
    const prompt = `Asunto: ${ctx.subject ?? "(sin asunto)"}
Hilo:
${ctx.thread}

Intención del usuario: ${intent}
Tono: ${tone}

Redacta SOLO el cuerpo del correo de respuesta en español neutro. Sin saludo redundante si ya hubo intercambio.`;
    try {
      const result = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: CECILIA_SYSTEM,
          maxOutputTokens: 2048,
        },
      });
      const reply = (result.text ?? "").trim();
      await db.insert(aiLogsTable).values({
        source: "gemini",
        event: "cecilia_draft",
        message: "draft-reply",
        data: {
          userId: req.user?.id,
          conversationId: parsed.data.conversationId,
          tone,
        },
      });
      res.json({ reply });
    } catch (err) {
      res.status(502).json({
        error: "Cecilia no pudo redactar",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  },
);

router.get("/gmail/cecilia/templates", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(gmailTemplatesTable)
    .where(eq(gmailTemplatesTable.ownerId, req.user!.id))
    .orderBy(gmailTemplatesTable.name);
  res.json(rows);
});

const TemplateBody = z.object({
  name: z.string().min(1).max(128),
  category: z.string().min(1).max(64).default("general"),
  subject: z.string().max(500).optional(),
  body: z.string().min(1),
});

router.post(
  "/gmail/cecilia/templates",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = TemplateBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(gmailTemplatesTable)
      .values({
        name: parsed.data.name,
        category: parsed.data.category,
        subject: parsed.data.subject ?? null,
        body: parsed.data.body,
        ownerId: req.user!.id,
      })
      .returning();
    await audit(req, {
      action: "cecilia.template.create",
      entityType: "gmail_template",
      entityId: row.id,
    });
    res.status(201).json(row);
  },
);

router.delete(
  "/gmail/cecilia/templates/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    await db
      .delete(gmailTemplatesTable)
      .where(
        and(
          eq(gmailTemplatesTable.id, id),
          eq(gmailTemplatesTable.ownerId, req.user!.id),
        ),
      );
    await audit(req, {
      action: "cecilia.template.delete",
      entityType: "gmail_template",
      entityId: id,
    });
    res.json({ ok: true });
  },
);

export default router;
