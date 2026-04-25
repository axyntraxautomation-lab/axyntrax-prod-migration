import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { db, modulesCatalogTable, aiLogsTable } from "@workspace/db";
import { requirePortalAuth, requirePortalClient } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYSTEM_BASE = `Eres "JARVIS", la inteligencia artificial principal de AXYNTRAX AUTOMATION (Miguel Montero, Arequipa, Perú). JARVIS coordina ventas, soporte y operaciones de la empresa.
Cuando hablás con prospectos, sos asesor comercial de los módulos SaaS de automatización por industria (medicina, derecho, dental, veterinaria, condominios, educación, retail).
Tono: cordial, directo, profesional peruano. Sin emojis. Respuestas breves (máx 6 líneas).
- Si el módulo tiene precio mensual, ofrecelo y sugerí cotizar.
- Si el módulo no tiene precio (gratis), invitá a probar la demo de 30 días.
- Cuando el usuario pida cotizar, listá los módulos exactos con precio.
- Para depósitos, mencioná Yape al 991740590 a nombre de Miguel Montero.
- Si pregunta algo fuera del catálogo, redirigí amablemente al catálogo o a contactar a Miguel.
SIEMPRE devolvé JSON con esta forma:
{ "reply": "<texto al usuario>", "recommendedModuleSlugs": ["slug1","slug2"], "ctaQuote": true|false }
"ctaQuote" es true cuando proponés cotizar módulos pagos concretos.`;

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
  message: { error: "Demasiadas consultas, esperá un minuto." },
});

interface BotReply {
  reply: string;
  recommendedModuleSlugs?: string[];
  ctaQuote?: boolean;
}

async function loadCatalogContext(): Promise<string> {
  const rows = await db
    .select()
    .from(modulesCatalogTable)
    .where(eq(modulesCatalogTable.active, 1));
  return rows
    .map((m) => {
      const price = Number(m.monthlyPrice);
      const tag = price > 0 ? `${m.currency} ${price.toFixed(2)}/mes` : "DEMO GRATIS 30 días";
      return `- [${m.slug}] ${m.name} (${m.industry}) — ${tag}\n  ${m.description ?? ""}`;
    })
    .join("\n");
}

async function runBot(
  message: string,
  history: BotMessage[] | undefined,
  scope: "public" | "client",
  clientHint?: string,
): Promise<BotReply> {
  const catalog = await loadCatalogContext();
  const sys = `${SYSTEM_BASE}

CATÁLOGO ACTUAL:
${catalog}

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
    parsed = { reply: text || "Disculpá, no pude generar respuesta. Intentá de nuevo." };
  }

  // Best-effort log
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
      res.status(502).json({ error: "JARVIS no respondió, intentá más tarde." });
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
      res.status(502).json({ error: "JARVIS no respondió, intentá más tarde." });
    }
  },
);

export default router;
