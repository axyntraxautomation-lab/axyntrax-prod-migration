import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  aiLogsTable,
  clientsTable,
  clientModulesTable,
  modulesCatalogTable,
  moduleEventsTable,
} from "@workspace/db";
import {
  requirePortalAuth,
  requirePortalClient,
} from "../lib/auth";
import { logger } from "../lib/logger";
import { ai as gemini } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

const supportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas consultas, espera un minuto." },
});

const Body = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
});

interface SupportReply {
  reply: string;
  steps?: string[];
  needsHuman?: boolean;
}

const SupportReplySchema = z.object({
  reply: z.string().max(4000).default(""),
  steps: z.array(z.string().max(500)).max(20).optional(),
  needsHuman: z.boolean().optional(),
});

function normalizeReply(raw: unknown): SupportReply {
  const parsed = SupportReplySchema.safeParse(raw);
  if (parsed.success) {
    return {
      reply: parsed.data.reply || "Listo, dame más detalle por favor.",
      steps: parsed.data.steps,
      needsHuman: parsed.data.needsHuman,
    };
  }
  if (typeof raw === "string") return { reply: raw.slice(0, 1000) };
  return { reply: "No pude generar una respuesta válida. Reintenta." };
}

const INDUSTRY_CONTEXT: Record<string, string> = {
  condo:
    "administración de condominios y edificios residenciales en Perú: cuotas mensuales, mora, reservas de áreas comunes, asambleas, comunicaciones a residentes",
  retail:
    "comercio minorista en Perú: ventas, inventario, caja, boletas/facturas SUNAT, fidelización",
  restaurant:
    "restaurantes y comida en Perú: comandas, mesas, delivery, menú, control de stock",
  health:
    "salud y consultorios: agenda, pacientes, recordatorios, historiales, cobranza",
  education:
    "educación y academias: cursos, alumnos, asistencia, pagos, notas",
  services:
    "servicios profesionales: clientes, agendas, cobranza, tickets de soporte",
  generic: "operaciones generales de pyme",
};

function systemPrompt(moduleName: string, industry: string): string {
  const ctx = INDUSTRY_CONTEXT[industry] ?? INDUSTRY_CONTEXT.generic;
  return [
    "Eres 'JARVIS Soporte', la IA principal de AXYNTRAX AUTOMATION (Arequipa, Perú) actuando como ingeniero TI senior con más de 20 años de experiencia.",
    `El cliente está usando el módulo "${moduleName}" en el rubro: ${ctx}.`,
    "Hablá en español rioplatense neutro/peruano, profesional, conciso, sin emojis.",
    "Resolvé problemas en línea: explicá con pasos numerados cuando aplique.",
    "Si el problema requiere intervención humana (acceso al servidor, datos del cliente, configuración manual), indicá needsHuman=true y resumí qué información necesita el equipo.",
    "Para depósitos o renovaciones, menciona Yape al 991740590 a nombre de Miguel Montero.",
    "Nunca pidas datos sensibles (contraseñas, tarjetas). Si el cliente reporta vulnerabilidad o intrusión, pide que contacte al admin inmediatamente.",
    'Devuelve SIEMPRE JSON válido con la forma {"reply":"...","steps":["..."],"needsHuman":false}. "steps" es opcional. No agregues nada fuera del JSON.',
  ].join("\n");
}

async function callGemini(
  contents: { role: string; parts: { text: string }[] }[],
): Promise<SupportReply> {
  const result = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });
  const text =
    result.text ??
    result.candidates?.[0]?.content?.parts?.[0]?.text ??
    "{}";
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = text;
  }
  return normalizeReply(raw);
}

router.post(
  "/portal/me/modules/:id/support",
  requirePortalAuth,
  requirePortalClient,
  supportLimiter,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Mensaje inválido" });
      return;
    }
    const clientId = req.portal!.sub;
    const [row] = await db
      .select({
        cmId: clientModulesTable.id,
        moduleId: clientModulesTable.moduleId,
        moduleName: modulesCatalogTable.name,
        moduleIndustry: modulesCatalogTable.industry,
        clientName: clientsTable.name,
      })
      .from(clientModulesTable)
      .leftJoin(
        modulesCatalogTable,
        eq(clientModulesTable.moduleId, modulesCatalogTable.id),
      )
      .leftJoin(clientsTable, eq(clientModulesTable.clientId, clientsTable.id))
      .where(
        and(
          eq(clientModulesTable.id, id),
          eq(clientModulesTable.clientId, clientId),
        ),
      )
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Módulo no encontrado" });
      return;
    }

    try {
      const sys = systemPrompt(row.moduleName ?? "Módulo", row.moduleIndustry ?? "generic");
      const messages: { role: string; parts: { text: string }[] }[] = [];
      messages.push({ role: "user", parts: [{ text: sys }] });
      messages.push({
        role: "model",
        parts: [{ text: '{"reply":"Listo, cuéntame qué pasa con tu módulo."}' }],
      });
      for (const m of parsed.data.history ?? []) {
        messages.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        });
      }
      messages.push({ role: "user", parts: [{ text: parsed.data.message }] });

      const reply = await callGemini(messages);

      // Log telemetry.
      await db.insert(aiLogsTable).values({
        source: "module-support",
        event: "reply",
        message: parsed.data.message.slice(0, 500),
        data: {
          clientModuleId: row.cmId,
          moduleId: row.moduleId,
          industry: row.moduleIndustry,
          needsHuman: !!reply.needsHuman,
        },
      });

      // Module event for the dashboard.
      await db.insert(moduleEventsTable).values({
        clientModuleId: row.cmId,
        clientId,
        moduleId: row.moduleId,
        type: "support.replied",
        severity: reply.needsHuman ? "warning" : "info",
        message: parsed.data.message.slice(0, 400),
        meta: { needsHuman: !!reply.needsHuman },
      });

      res.json(reply);
    } catch (err) {
      logger.error({ err }, "module-support failed");
      res
        .status(500)
        .json({ error: "No pude procesar tu consulta. Reintenta en unos segundos." });
    }
  },
);

export default router;
