import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { db, aiLogsTable } from "@workspace/db";
import { requirePortalAuth, requirePortalClient } from "../lib/auth";
import { logger } from "../lib/logger";
import { buildJarvisKnowledge } from "../lib/jarvis-knowledge";

const router: IRouter = Router();

const SYSTEM_BASE = `Eres "Cecilia", asesora comercial IA de AXYNTRAX AUTOMATION. Cecilia atiende a prospectos en el sitio público y los chats de los rubros (clínica, dental, legal, administraciones, etc.).
JARVIS es el sistema interno de operaciones que sólo se menciona si el cliente pregunta cómo funciona la cabina admin; nunca te presentes como JARVIS.
Tono: cordial, directo, profesional peruano. Sin emojis. Respuestas breves (máx 6 líneas).
- Si el módulo tiene precio mensual, ofrecelo y sugerí cotizar.
- Si el módulo no tiene precio (gratis), invitá a probar la demo de 30 días.
- Cuando el usuario pida cotizar, listá los módulos exactos con precio.
- Para depósitos, menciona Yape al 991 740 590 a nombre de Miguel Angel Montero Garcia.
- Si pregunta algo fuera del catálogo, redirigí amablemente al catálogo o a contactar a Miguel.
SIEMPRE devuelve JSON con esta forma:
{ "reply": "<texto al usuario>", "recommendedModuleSlugs": ["slug1","slug2"], "ctaQuote": true|false }
"ctaQuote" es true cuando proponés cotizar módulos pagos concretos.`;

const PLAIN_SYSTEM_BASE = `Eres "Cecilia", asesora comercial IA de AXYNTRAX AUTOMATION. Atendés WhatsApp, mensajería social y conversaciones de ventas con prospectos y clientes.
JARVIS es el sistema interno de la empresa; no te presentes como JARVIS bajo ningún concepto. Si te preguntan por el dashboard interno puedes mencionarlo, pero tu nombre es Cecilia.
Tono: cordial, directo, profesional peruano. Sin emojis. Máximo 5 líneas por respuesta.
- Si el módulo tiene precio mensual, ofrecelo y sugerí cotizar.
- Si el módulo no tiene precio, invitá a probar la demo gratuita de 30 días.
- Para pagos, menciona Yape al 991 740 590 a nombre de Miguel Angel Montero Garcia.
- Para crear cuenta y cotizar, derivá al portal www.axyntrax-automation.net.
- Si pregunta algo fuera del catálogo, ofrecé contactar a Miguel por el mismo Yape.
Responde SIEMPRE en texto plano, sin JSON, sin markdown, sin asteriscos.`;

interface BotMessage {
  role: "user" | "assistant";
  content: string;
}

const PublicBody = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(20)
    .optional(),
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas consultas, espera un minuto." },
});

interface BotReply {
  reply: string;
  recommendedModuleSlugs?: string[];
  ctaQuote?: boolean;
}

async function runBot(
  message: string,
  history: BotMessage[] | undefined,
  scope: "public" | "client",
  clientHint?: string,
): Promise<BotReply> {
  const knowledge = await buildJarvisKnowledge();
  const sys = `${SYSTEM_BASE}

CONOCIMIENTO DEL NEGOCIO:
${knowledge}

${clientHint ? `CLIENTE EN SESIÓN:\n${clientHint}` : ""}
`;

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of history ?? []) {
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  const result = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: sys,
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  });
  const text = result.text ?? "";
  let parsed: BotReply;
  try {
    parsed = JSON.parse(text) as BotReply;
  } catch {
    parsed = { reply: text || "Disculpá, no pude generar respuesta. Intenta de nuevo." };
  }

  try {
    await db.insert(aiLogsTable).values({
      source: scope === "public" ? "sales-bot-public" : "sales-bot-portal",
      event: "reply",
      message: parsed.reply.slice(0, 500),
      data: { ctaQuote: !!parsed.ctaQuote, recommended: parsed.recommendedModuleSlugs ?? [] },
    });
  } catch (err) {
    logger.warn({ err }, "ai_logs insert failed");
  }
  return parsed;
}

/**
 * Plain-text JARVIS reply (no JSON). Used by WhatsApp auto-reply and any
 * other channel that needs natural-language output.
 */
export async function runJarvisText(
  message: string,
  history: BotMessage[] | undefined,
  channel: "whatsapp" | "facebook" | "instagram" | "email" | "web",
  contactHint?: string,
): Promise<string> {
  let knowledge = "";
  try {
    knowledge = await buildJarvisKnowledge();
  } catch (err) {
    logger.warn({ err, channel }, "buildJarvisKnowledge failed in runJarvisText; using static fallback");
  }
  const sys = `${PLAIN_SYSTEM_BASE}

${knowledge ? `CONOCIMIENTO DEL NEGOCIO:\n${knowledge}\n` : ""}CANAL: ${channel}
${contactHint ? `CONTACTO: ${contactHint}` : ""}`;

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of history ?? []) {
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  let reply = "";
  try {
    const result = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { systemInstruction: sys, maxOutputTokens: 512 },
    });
    reply = (result.text ?? "").trim();
  } catch (err) {
    logger.warn({ err, channel }, "runJarvisText failed");
  }
  if (!reply) {
    reply =
      "Hola, soy Cecilia de AXYNTRAX. En un momento te respondo. Mientras, puedes ver módulos en www.axyntrax-automation.net o escribir a Miguel al 991 740 590 (Yape).";
  }

  try {
    await db.insert(aiLogsTable).values({
      source: `jarvis-${channel}`,
      event: "reply",
      message: reply.slice(0, 500),
      data: { channel, contactHint: contactHint ?? null },
    });
  } catch (err) {
    logger.warn({ err }, "ai_logs insert failed (text)");
  }
  return reply;
}

router.post(
  "/portal/public/sales-bot",
  publicLimiter,
  async (req, res): Promise<void> => {
    const parsed = PublicBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Mensaje inválido" });
      return;
    }
    try {
      const reply = await runBot(parsed.data.message, parsed.data.history, "public");
      res.json(reply);
    } catch (err) {
      logger.error({ err }, "public sales-bot failed");
      res.status(502).json({ error: "Cecilia no respondió, intenta más tarde." });
    }
  },
);

router.post(
  "/portal/quote-bot",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") return;
    const parsed = PublicBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Mensaje inválido" });
      return;
    }
    const hint = `id=${req.portal.sub}, email=${req.portal.email ?? ""}`;
    try {
      const reply = await runBot(
        parsed.data.message,
        parsed.data.history,
        "client",
        hint,
      );
      res.json(reply);
    } catch (err) {
      logger.error({ err }, "portal quote-bot failed");
      res.status(502).json({ error: "Cecilia no respondió, intenta más tarde." });
    }
  },
);

export default router;
