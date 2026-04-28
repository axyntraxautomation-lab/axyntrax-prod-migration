import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, and } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import {
  getSupabaseDb,
  rubrosRegistryTable,
  tenantsTable,
  tenantChatCeciliaMessagesTable,
  tenantFaqOverridesTable,
  tenantBrandingTable,
  tenantOnboardingStateTable,
  type RubroRegistry,
} from "@workspace/db-supabase";
import { db, clientsTable } from "@workspace/db";
import { requirePortalAuth, requirePortalClient } from "../lib/auth";
import { isSupabaseConfigured, getSupabaseAdmin } from "../lib/supabase-admin";
import {
  CECILIA_DISGUISE_SYSTEM,
  sanitizeCeciliaText,
  makeStreamSanitizer,
} from "../lib/cecilia-disguise";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados mensajes a Cecilia. Espera un momento." },
});

const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas escrituras. Espera un momento." },
});

function gateSupabase(req: Request, res: Response, next: NextFunction): void {
  if (!isSupabaseConfigured()) {
    res.status(503).json({
      error: "El módulo SaaS Cecilia aún no está configurado en este entorno.",
      code: "supabase_not_configured",
    });
    return;
  }
  next();
}

async function findTenantForPortalUser(req: Request) {
  if (!req.portal || req.portal.kind !== "client") return null;
  const [client] = await db
    .select({ id: clientsTable.id, email: clientsTable.email })
    .from(clientsTable)
    .where(eq(clientsTable.id, req.portal.sub))
    .limit(1);
  if (!client?.email) return null;
  const sdb = getSupabaseDb();
  const ownerEmail = client.email.toLowerCase();
  const [tenant] = await sdb
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.ownerEmail, ownerEmail))
    .limit(1);
  if (!tenant) return null;
  return { tenant, ownerEmail, clientId: client.id };
}

async function loadRubro(rubroId: string): Promise<RubroRegistry | null> {
  const sdb = getSupabaseDb();
  const [r] = await sdb
    .select()
    .from(rubrosRegistryTable)
    .where(eq(rubrosRegistryTable.rubroId, rubroId))
    .limit(1);
  return r ?? null;
}

function buildSystemPrompt(args: {
  nombreEmpresa: string;
  rubro: RubroRegistry | null;
}): string {
  const persona = args.rubro?.cecilia_persona ?? "asistente de negocio";
  const nombre = args.rubro?.nombre ?? "tu rubro";
  const terminologia = (args.rubro?.terminologia as string[] | null) ?? [];
  const kpis = (args.rubro?.kpis as string[] | null) ?? [];
  const tipos = terminologia.length ? terminologia.join(", ") : "n/d";
  const kpisStr = kpis.length ? kpis.join(", ") : "n/d";
  return `${CECILIA_DISGUISE_SYSTEM}

CONTEXTO DEL NEGOCIO:
- Empresa: ${args.nombreEmpresa}
- Rubro: ${nombre}
- Tu rol: ${persona}
- Terminología propia: ${tipos}
- KPIs que vigilas: ${kpisStr}

ESTILO:
- Español neutral profesional, sin emojis.
- Respuestas concisas, orientadas a la acción.
- Moneda PEN (S/), zona horaria America/Lima.
- Cuando proceda, propón el siguiente paso concreto.`;
}

const ChatBody = z.object({
  message: z.string().trim().min(1).max(4000),
  conversation_id: z.string().uuid().optional(),
});

router.post(
  "/tenant/cecilia",
  chatLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const parsed = ChatBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
      return;
    }

    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "No se encontró el tenant del usuario.", code: "tenant_not_found" });
      return;
    }

    const rubro = await loadRubro(ctx.tenant.rubroId);
    const system = buildSystemPrompt({
      nombreEmpresa: ctx.tenant.nombreEmpresa,
      rubro,
    });

    const sdb = getSupabaseDb();
    // Persistimos el turno del usuario primero para dejar trazabilidad incluso si
    // el modelo falla a mitad del stream.
    const conversationId = parsed.data.conversation_id ?? crypto.randomUUID();
    await sdb.insert(tenantChatCeciliaMessagesTable).values({
      tenantId: ctx.tenant.id,
      conversationId,
      role: "user",
      content: parsed.data.message,
      metadata: {},
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const abortController = new AbortController();
    let clientAborted = false;
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

    // Enviamos el conversation_id antes que cualquier contenido para que el
    // cliente lo pueda persistir en el primer turno.
    send({ conversation_id: conversationId });

    const startedAt = Date.now();
    let fullSanitized = "";
    let chunkCount = 0;
    let errorMessage: string | null = null;
    const sanitizer = makeStreamSanitizer();

    try {
      const stream = await gemini.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: parsed.data.message }] }],
        config: {
          systemInstruction: system,
          maxOutputTokens: 2048,
          abortSignal: abortController.signal,
        },
      });
      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;
        const raw = chunk.text;
        if (!raw) continue;
        const safe = sanitizer.push(raw);
        if (safe) {
          chunkCount += 1;
          fullSanitized += safe;
          send({ content: safe });
        }
      }
      const tail = sanitizer.flush();
      if (tail) {
        fullSanitized += tail;
        send({ content: tail });
      }
      if (!clientAborted) send({ done: true });
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      logger.warn(
        { err, tenantId: ctx.tenant.id, conversationId },
        "tenant cecilia stream failed",
      );
      if (!clientAborted) {
        send({ error: "Cecilia no pudo responder en este momento." });
      }
    } finally {
      req.off("close", onClose);
      if (!res.writableEnded) res.end();
      try {
        // Sanitizamos otra vez por si el sanitizer perdió algo entre buffers.
        const finalText = sanitizeCeciliaText(fullSanitized);
        if (finalText && !clientAborted && !errorMessage) {
          await sdb.insert(tenantChatCeciliaMessagesTable).values({
            tenantId: ctx.tenant.id,
            conversationId,
            role: "assistant",
            content: finalText,
            // metadata interna para auditoría — NO se devuelve al frontend.
            metadata: {
              chunks: chunkCount,
              latency_ms: Date.now() - startedAt,
              chars: finalText.length,
            },
          });
        }
      } catch (logErr) {
        logger.warn({ err: logErr }, "Failed to persist cecilia assistant turn");
      }
    }
  },
);

router.get(
  "/tenant/cecilia/messages",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado", code: "tenant_not_found" });
      return;
    }
    const conversationId = typeof req.query.conversation_id === "string" ? req.query.conversation_id : null;
    const sdb = getSupabaseDb();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const where = conversationId
      ? and(
          eq(tenantChatCeciliaMessagesTable.tenantId, ctx.tenant.id),
          eq(tenantChatCeciliaMessagesTable.conversationId, conversationId),
        )
      : eq(tenantChatCeciliaMessagesTable.tenantId, ctx.tenant.id);
    const rows = await sdb
      .select({
        id: tenantChatCeciliaMessagesTable.id,
        conversation_id: tenantChatCeciliaMessagesTable.conversationId,
        role: tenantChatCeciliaMessagesTable.role,
        content: tenantChatCeciliaMessagesTable.content,
        created_at: tenantChatCeciliaMessagesTable.createdAt,
      })
      .from(tenantChatCeciliaMessagesTable)
      .where(where)
      .orderBy(desc(tenantChatCeciliaMessagesTable.createdAt))
      .limit(limit);
    // Defense-in-depth: sanitizamos también en la lectura para cubrir filas
    // antiguas que pudieron persistirse antes de un cambio de filtro.
    const sanitized = rows.reverse().map((m) => ({
      ...m,
      content: m.role === "assistant" ? sanitizeCeciliaText(m.content) : m.content,
    }));
    res.json({ messages: sanitized });
  },
);

router.get(
  "/tenant/faqs",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado", code: "tenant_not_found" });
      return;
    }
    const sdb = getSupabaseDb();
    const [rubro, overrides] = await Promise.all([
      loadRubro(ctx.tenant.rubroId),
      sdb
        .select({
          id: tenantFaqOverridesTable.id,
          pregunta: tenantFaqOverridesTable.pregunta,
          respuesta: tenantFaqOverridesTable.respuesta,
          categoria: tenantFaqOverridesTable.categoria,
          orden: tenantFaqOverridesTable.orden,
        })
        .from(tenantFaqOverridesTable)
        .where(
          and(
            eq(tenantFaqOverridesTable.tenantId, ctx.tenant.id),
            eq(tenantFaqOverridesTable.activo, true),
          ),
        )
        .orderBy(tenantFaqOverridesTable.orden),
    ]);
    const baseFaqs = ((rubro?.faqs as Array<{ pregunta: string; respuesta: string; categoria?: string }> | null) ?? []).map((f, i) => ({
      id: `base-${i}`,
      pregunta: f.pregunta,
      respuesta: f.respuesta,
      categoria: f.categoria ?? "general",
      origen: "rubro",
    }));
    const overrideFaqs = overrides.map((f) => ({
      id: f.id,
      pregunta: f.pregunta,
      respuesta: f.respuesta,
      categoria: f.categoria ?? "general",
      origen: "tenant",
    }));
    res.json({ faqs: [...overrideFaqs, ...baseFaqs] });
  },
);

const BrandingBody = z.object({
  color_primario: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  color_secundario: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  welcome_text: z.string().max(280).optional(),
  logo_url: z.string().url().nullable().optional(),
});

router.put(
  "/tenant/branding",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const parsed = BrandingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
      return;
    }
    const sdb = getSupabaseDb();
    const patch: Record<string, unknown> = {};
    if (parsed.data.color_primario !== undefined) patch.colorPrimario = parsed.data.color_primario;
    if (parsed.data.color_secundario !== undefined) patch.colorSecundario = parsed.data.color_secundario;
    if (parsed.data.welcome_text !== undefined) patch.welcomeText = parsed.data.welcome_text;
    if (parsed.data.logo_url !== undefined) patch.logoUrl = parsed.data.logo_url;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const [updated] = await sdb
      .update(tenantBrandingTable)
      .set(patch)
      .where(eq(tenantBrandingTable.tenantId, ctx.tenant.id))
      .returning();
    if (!updated) {
      // Si no existía branding row aún, lo creamos.
      const [created] = await sdb
        .insert(tenantBrandingTable)
        .values({ tenantId: ctx.tenant.id, ...patch })
        .returning();
      res.json({ branding: created });
      return;
    }
    res.json({ branding: updated });
  },
);

const OnboardingBody = z.object({
  current_step: z.number().int().min(0).max(20),
  total_steps: z.number().int().min(1).max(20).optional(),
  completados: z.array(z.string().max(64)).optional(),
  estado: z.enum(["en_progreso", "completado"]).optional(),
});

router.put(
  "/tenant/onboarding",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const parsed = OnboardingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
      return;
    }
    const sdb = getSupabaseDb();
    const patch: Record<string, unknown> = {
      currentStep: parsed.data.current_step,
    };
    if (parsed.data.total_steps !== undefined) patch.totalSteps = parsed.data.total_steps;
    if (parsed.data.completados !== undefined) patch.completados = parsed.data.completados;
    if (parsed.data.estado !== undefined) {
      patch.estado = parsed.data.estado;
      if (parsed.data.estado === "completado") {
        patch.completedAt = new Date();
      }
    }
    const [updated] = await sdb
      .update(tenantOnboardingStateTable)
      .set(patch)
      .where(eq(tenantOnboardingStateTable.tenantId, ctx.tenant.id))
      .returning();
    if (!updated) {
      const [created] = await sdb
        .insert(tenantOnboardingStateTable)
        .values({
          tenantId: ctx.tenant.id,
          currentStep: parsed.data.current_step,
          totalSteps: parsed.data.total_steps ?? 3,
          completados: parsed.data.completados ?? [],
          estado: parsed.data.estado ?? "en_progreso",
        })
        .returning();
      res.json({ onboarding: created });
      return;
    }
    res.json({ onboarding: updated });
  },
);

const TENANT_LOGOS_BUCKET = "tenant-logos";
let bucketEnsured = false;
async function ensureLogosBucket(): Promise<void> {
  if (bucketEnsured) return;
  try {
    const sb = getSupabaseAdmin();
    const { data: list } = await sb.storage.listBuckets();
    const exists = (list ?? []).some((b) => b.name === TENANT_LOGOS_BUCKET);
    if (!exists) {
      await sb.storage.createBucket(TENANT_LOGOS_BUCKET, {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
      });
    }
    bucketEnsured = true;
  } catch (err) {
    logger.warn({ err }, "ensureLogosBucket failed");
  }
}

const LogoBody = z.object({
  // base64 sin prefix data: (el frontend lo despoja).
  base64: z.string().min(32).max(3 * 1024 * 1024),
  mime: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
});

router.post(
  "/tenant/logo",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const parsed = LogoBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
      return;
    }
    await ensureLogosBucket();
    let buffer: Buffer;
    try {
      buffer = Buffer.from(parsed.data.base64, "base64");
    } catch {
      res.status(400).json({ error: "Imagen inválida" });
      return;
    }
    if (buffer.length > 2 * 1024 * 1024) {
      res.status(400).json({ error: "El logo no puede pesar más de 2 MB." });
      return;
    }
    const ext = parsed.data.mime === "image/svg+xml" ? "svg" : parsed.data.mime.split("/")[1];
    const key = `${ctx.tenant.id}/logo-${Date.now()}.${ext}`;
    const sb = getSupabaseAdmin();
    const { error: uploadErr } = await sb.storage
      .from(TENANT_LOGOS_BUCKET)
      .upload(key, buffer, {
        contentType: parsed.data.mime,
        upsert: true,
        cacheControl: "3600",
      });
    if (uploadErr) {
      logger.warn({ err: uploadErr, tenantId: ctx.tenant.id }, "logo upload failed");
      res.status(502).json({ error: "No se pudo subir el logo. Intenta de nuevo." });
      return;
    }
    const { data: pub } = sb.storage.from(TENANT_LOGOS_BUCKET).getPublicUrl(key);
    const logoUrl = pub.publicUrl;
    const sdb = getSupabaseDb();
    await sdb
      .update(tenantBrandingTable)
      .set({ logoUrl })
      .where(eq(tenantBrandingTable.tenantId, ctx.tenant.id));
    res.json({ logo_url: logoUrl });
  },
);

export default router;
