import { Router, type IRouter } from "express";
import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import {
  db,
  aiLogsTable,
  moduleEventsTable,
  quotesTable,
  licensesTable,
  conversationsTable,
  clientsTable,
  securityAlertsTable,
} from "@workspace/db";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../lib/auth";
import { buildJarvisKnowledge } from "../lib/jarvis-knowledge";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface FeedItem {
  id: string;
  source: string;
  kind: string;
  title: string;
  detail: string;
  severity: "info" | "ok" | "warn" | "error";
  at: string;
}

function isoOrNow(v: Date | string | null | undefined): string {
  if (!v) return new Date().toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
  return v.toISOString();
}

router.get("/jarvis/live-feed", requireAuth, async (_req, res): Promise<void> => {
  try {
    const limit = 30;

    const [aiRows, modRows, quoteRows, licRows, convRows, alertRows] =
      await Promise.all([
        db
          .select({
            id: aiLogsTable.id,
            source: aiLogsTable.source,
            event: aiLogsTable.event,
            message: aiLogsTable.message,
            createdAt: aiLogsTable.createdAt,
          })
          .from(aiLogsTable)
          .orderBy(desc(aiLogsTable.createdAt))
          .limit(limit),
        db
          .select({
            id: moduleEventsTable.id,
            type: moduleEventsTable.type,
            severity: moduleEventsTable.severity,
            message: moduleEventsTable.message,
            clientId: moduleEventsTable.clientId,
            createdAt: moduleEventsTable.createdAt,
          })
          .from(moduleEventsTable)
          .orderBy(desc(moduleEventsTable.createdAt))
          .limit(limit),
        db
          .select({
            id: quotesTable.id,
            status: quotesTable.status,
            total: quotesTable.total,
            currency: quotesTable.currency,
            clientId: quotesTable.clientId,
            createdAt: quotesTable.createdAt,
          })
          .from(quotesTable)
          .orderBy(desc(quotesTable.createdAt))
          .limit(limit),
        db
          .select({
            id: licensesTable.id,
            type: licensesTable.type,
            module: licensesTable.module,
            status: licensesTable.status,
            clientId: licensesTable.clientId,
            createdAt: licensesTable.createdAt,
          })
          .from(licensesTable)
          .orderBy(desc(licensesTable.createdAt))
          .limit(limit),
        db
          .select({
            id: conversationsTable.id,
            channel: conversationsTable.channel,
            status: conversationsTable.status,
            updatedAt: conversationsTable.updatedAt,
          })
          .from(conversationsTable)
          .orderBy(desc(conversationsTable.updatedAt))
          .limit(limit),
        db
          .select({
            id: securityAlertsTable.id,
            type: securityAlertsTable.type,
            severity: securityAlertsTable.severity,
            ip: securityAlertsTable.ip,
            message: securityAlertsTable.message,
            createdAt: securityAlertsTable.createdAt,
          })
          .from(securityAlertsTable)
          .orderBy(desc(securityAlertsTable.createdAt))
          .limit(limit),
      ]);

    const items: FeedItem[] = [];

    for (const r of aiRows) {
      items.push({
        id: `ai-${r.id}`,
        source: "JARVIS IA",
        kind: r.event,
        title: `${r.source} · ${r.event}`,
        detail: (r.message ?? "").slice(0, 240),
        severity: "info",
        at: isoOrNow(r.createdAt),
      });
    }
    for (const r of modRows) {
      items.push({
        id: `mod-${r.id}`,
        source: "Módulo",
        kind: r.type,
        title: `Módulo · ${r.type}`,
        detail: (r.message ?? `Cliente #${r.clientId}`).slice(0, 240),
        severity:
          r.severity === "error"
            ? "error"
            : r.severity === "warning"
              ? "warn"
              : "info",
        at: isoOrNow(r.createdAt),
      });
    }
    for (const r of quoteRows) {
      items.push({
        id: `q-${r.id}`,
        source: "Cotización",
        kind: r.status,
        title: `Cotización #${r.id} · ${r.status}`,
        detail: `Cliente #${r.clientId} · ${r.currency} ${r.total}`,
        severity: r.status === "aceptada" ? "ok" : "info",
        at: isoOrNow(r.createdAt),
      });
    }
    for (const r of licRows) {
      items.push({
        id: `lic-${r.id}`,
        source: "Licencia",
        kind: r.type,
        title: `Licencia ${r.type} · ${r.status}`,
        detail: `Cliente #${r.clientId}${r.module ? ` · ${r.module}` : ""}`,
        severity: r.status === "vencida" ? "warn" : "ok",
        at: isoOrNow(r.createdAt),
      });
    }
    for (const r of convRows) {
      items.push({
        id: `conv-${r.id}`,
        source: "Conversación",
        kind: r.channel ?? "web",
        title: `Conversación · ${r.channel ?? "web"}`,
        detail: `Estado: ${r.status ?? "abierta"}`,
        severity: "info",
        at: isoOrNow(r.updatedAt),
      });
    }
    for (const r of alertRows) {
      items.push({
        id: `sec-${r.id}`,
        source: "Seguridad",
        kind: r.type,
        title: `Seguridad · ${r.type}`,
        detail: `${r.message}${r.ip ? ` · IP ${r.ip}` : ""}`.slice(0, 240),
        severity:
          r.severity === "critical" || r.severity === "high"
            ? "error"
            : r.severity === "warning"
              ? "warn"
              : "info",
        at: isoOrNow(r.createdAt),
      });
    }

    items.sort((a, b) => (a.at < b.at ? 1 : -1));
    const top = items.slice(0, 60);

    const summary = {
      ai: aiRows.length,
      modules: modRows.length,
      quotes: quoteRows.length,
      licenses: licRows.length,
      conversations: convRows.length,
      alerts: alertRows.length,
    };

    res.json({ items: top, summary, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "jarvis live-feed failed");
    res.status(500).json({ error: "No se pudo construir el feed JARVIS." });
  }
});

const AskBody = z.object({
  message: z.string().min(1).max(1500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2500),
      }),
    )
    .max(20)
    .optional(),
});

const SYSTEM_PROMPT = `Eres "JARVIS", la inteligencia artificial principal de AXYNTRAX AUTOMATION, hablando con Miguel (CEO/admin) dentro del centro de mando interno.
Tu rol: informar y analizar TODO lo que pasa en la web, los clientes, módulos, cotizaciones, licencias, conversaciones, seguridad e ingresos.
Tono: directo, profesional peruano, sin emojis, sin markdown, máximo 8 líneas por respuesta.
- Cuando preguntan "¿qué pasó?" o "¿cómo va el negocio?", resumí los eventos recientes y métricas clave.
- Cuando preguntan por un cliente o módulo, contestá con cifras concretas si están en el contexto.
- Si algo es preocupante (alertas de seguridad, errores, cotizaciones vencidas), señalalo primero.
- Si no hay datos suficientes para responder, decilo y sugerí dónde encontrarlos en el dashboard.
- Nunca inventes números: usá solo lo que viene en el CONTEXTO ACTUAL.`;

router.post("/jarvis/ask", requireAuth, async (req, res): Promise<void> => {
  const parsed = AskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Mensaje inválido." });
    return;
  }

  try {
    const knowledge = await buildJarvisKnowledge();

    const [counts] = await db
      .select({
        clients: sql<number>`(SELECT COUNT(*) FROM ${clientsTable})`,
        quotes: sql<number>`(SELECT COUNT(*) FROM ${quotesTable})`,
        acceptedQuotes: sql<number>`(SELECT COUNT(*) FROM ${quotesTable} WHERE status='aceptada')`,
        activeLicenses: sql<number>`(SELECT COUNT(*) FROM ${licensesTable} WHERE status='activa')`,
        openConvs: sql<number>`(SELECT COUNT(*) FROM ${conversationsTable} WHERE status='abierta')`,
        alerts7d: sql<number>`(SELECT COUNT(*) FROM ${securityAlertsTable} WHERE created_at > NOW() - INTERVAL '7 days')`,
        revenueMonth: sql<number>`COALESCE((SELECT SUM(total::numeric) FROM ${quotesTable} WHERE status='aceptada' AND created_at > NOW() - INTERVAL '30 days'), 0)`,
      })
      .from(sql`(SELECT 1) AS x`);

    const recent = await db
      .select({
        id: moduleEventsTable.id,
        type: moduleEventsTable.type,
        severity: moduleEventsTable.severity,
        message: moduleEventsTable.message,
        createdAt: moduleEventsTable.createdAt,
      })
      .from(moduleEventsTable)
      .orderBy(desc(moduleEventsTable.createdAt))
      .limit(10);

    const recentText = recent
      .map(
        (r) =>
          `- ${isoOrNow(r.createdAt)} [${r.severity}] ${r.type}: ${r.message ?? ""}`,
      )
      .join("\n");

    const ctx = `CONTEXTO ACTUAL DEL SISTEMA AXYNTRAX (${new Date().toISOString()}):
- Clientes registrados: ${counts?.clients ?? 0}
- Cotizaciones totales: ${counts?.quotes ?? 0} (aceptadas: ${counts?.acceptedQuotes ?? 0})
- Licencias activas: ${counts?.activeLicenses ?? 0}
- Conversaciones abiertas: ${counts?.openConvs ?? 0}
- Alertas de seguridad últimos 7d: ${counts?.alerts7d ?? 0}
- Ingresos cotizaciones aceptadas últimos 30d: PEN ${Number(counts?.revenueMonth ?? 0).toFixed(2)}

EVENTOS DE MÓDULOS MÁS RECIENTES:
${recentText || "(sin eventos)"}

CONOCIMIENTO DEL NEGOCIO:
${knowledge}`;

    const contents: { role: string; parts: { text: string }[] }[] = [];
    for (const m of parsed.data.history ?? []) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }
    contents.push({ role: "user", parts: [{ text: parsed.data.message }] });

    const result = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\n${ctx}`,
        maxOutputTokens: 800,
      },
    });

    const reply = (result.text ?? "").trim() || "Sin respuesta de JARVIS en este momento.";

    await db
      .insert(aiLogsTable)
      .values({
        source: "jarvis-live",
        event: "ask",
        message: parsed.data.message.slice(0, 500),
        data: { reply: reply.slice(0, 500) },
      })
      .catch(() => {});

    res.json({ reply });
  } catch (err) {
    logger.error({ err }, "jarvis ask failed");
    res.status(500).json({ error: "JARVIS no pudo responder. Reintentá en unos segundos." });
  }
});

export default router;
