import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import {
  getSupabaseDb,
  rubrosRegistryTable,
  tenantFaqOverridesTable,
  tenantsTable,
  tenantWhatsappSessionsTable,
  tenantWhatsappMessagesTable,
  type RubroRegistry,
} from "@workspace/db-supabase";
import { db, clientsTable } from "@workspace/db";
import { requirePortalAuth, requirePortalClient } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase-admin";
import {
  CECILIA_DISGUISE_SYSTEM,
  sanitizeCeciliaText,
} from "../lib/cecilia-disguise";
import {
  getSessionState as workerGetState,
  isInternalRequestAuthorized,
  sendOutbound,
  startSession as workerStart,
  stopSession as workerStop,
} from "../lib/wa-worker-client";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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

// ---- FAQ fuzzy matching (Jaccard sobre tokens normalizados) ----

const STOPWORDS = new Set([
  "el","la","los","las","un","una","unos","unas","de","del","y","o","u","a","ante",
  "con","sin","por","para","que","qué","cómo","como","cuándo","cuando","dónde",
  "donde","es","son","ser","estoy","esta","está","están","mi","tu","su","sus","me",
  "te","se","lo","le","les","en","al","por","sobre","entre","hay","no","sí","si",
  "muy","más","menos","ya","aún","tan","ese","esa","este","esta","eso","esto",
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

interface FaqEntry {
  pregunta: string;
  respuesta: string;
}

async function findFaqMatch(
  tenantId: string,
  rubro: RubroRegistry | null,
  text: string,
  threshold = 0.5,
): Promise<{ respuesta: string; score: number; pregunta: string } | null> {
  const userTokens = new Set(tokenize(text));
  if (userTokens.size === 0) return null;
  const candidates: FaqEntry[] = [];
  // Base FAQs del rubro
  if (rubro && Array.isArray(rubro.faqs)) {
    for (const f of rubro.faqs as unknown[]) {
      if (
        f &&
        typeof f === "object" &&
        typeof (f as FaqEntry).pregunta === "string" &&
        typeof (f as FaqEntry).respuesta === "string"
      ) {
        candidates.push(f as FaqEntry);
      }
    }
  }
  // Overrides del tenant (tienen prioridad: se evalúan también y ganan por
  // score; un override con la misma pregunta tendrá igualdad de tokens y
  // ganará en el desempate por orden inverso).
  try {
    const sdb = getSupabaseDb();
    const overrides = await sdb
      .select()
      .from(tenantFaqOverridesTable)
      .where(
        and(
          eq(tenantFaqOverridesTable.tenantId, tenantId),
          eq(tenantFaqOverridesTable.activo, true),
        ),
      );
    for (const ov of overrides) {
      candidates.push({ pregunta: ov.pregunta, respuesta: ov.respuesta });
    }
  } catch (err) {
    logger.warn({ err, tenantId }, "faq overrides load failed");
  }

  let best: { respuesta: string; score: number; pregunta: string } | null = null;
  for (const c of candidates) {
    const tokens = new Set(tokenize(c.pregunta));
    const s = jaccard(userTokens, tokens);
    if (s >= threshold && (!best || s >= best.score)) {
      best = { respuesta: c.respuesta, score: s, pregunta: c.pregunta };
    }
  }
  return best;
}

// ---- Tenant-portal endpoints (called by the tenant frontend) ----

router.post(
  "/tenant/whatsapp/sesion/iniciar",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const r = await workerStart(ctx.tenant.id);
    if (!r.ok) {
      res
        .status(502)
        .json({ error: "wa_worker_unreachable", detail: r.error ?? null });
      return;
    }
    res.json(r.body);
  },
);

router.post(
  "/tenant/whatsapp/sesion/detener",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const r = await workerStop(ctx.tenant.id);
    if (!r.ok) {
      res
        .status(502)
        .json({ error: "wa_worker_unreachable", detail: r.error ?? null });
      return;
    }
    res.json({ ok: true });
  },
);

router.get(
  "/tenant/whatsapp/estado",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .select()
      .from(tenantWhatsappSessionsTable)
      .where(
        and(
          eq(tenantWhatsappSessionsTable.tenantId, ctx.tenant.id),
          eq(tenantWhatsappSessionsTable.provider, "baileys"),
        ),
      )
      .limit(1);
    let liveState: unknown = null;
    const w = await workerGetState(ctx.tenant.id);
    if (w.ok) liveState = w.body?.state ?? null;
    res.json({
      session: row
        ? {
            id: row.id,
            status: row.status,
            qr_code: row.qrCode,
            phone_number: row.phoneNumber,
            updated_at: row.updatedAt,
          }
        : null,
      live: liveState,
    });
  },
);

router.get(
  "/tenant/whatsapp/mensajes",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const sdb = getSupabaseDb();
    const limit = Math.min(Number(req.query["limit"]) || 50, 200);
    const rows = await sdb
      .select()
      .from(tenantWhatsappMessagesTable)
      .where(eq(tenantWhatsappMessagesTable.tenantId, ctx.tenant.id))
      .orderBy(desc(tenantWhatsappMessagesTable.createdAt))
      .limit(limit);
    res.json({
      messages: rows.map((r) => ({
        id: r.id,
        direccion: r.direccion,
        from: r.fromNumber,
        to: r.toNumber,
        body: r.body,
        estado: r.estado,
        created_at: r.createdAt,
      })),
    });
  },
);

const ManualSend = z.object({
  to: z.string().min(6),
  text: z.string().min(1).max(4096),
});

router.post(
  "/tenant/whatsapp/enviar",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await findTenantForPortalUser(req);
    if (!ctx) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const parsed = ManualSend.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Datos inválidos", issues: parsed.error.issues });
      return;
    }
    const r = await sendOutbound({
      tenantId: ctx.tenant.id,
      to: parsed.data.to,
      text: parsed.data.text,
    });
    if (!r.ok) {
      res.status(502).json({ ok: false, reason: r.body?.reason ?? r.error });
      return;
    }
    res.json({ ok: true });
  },
);

// ---- Internal endpoint (called by wa-worker) ----

const InternalCeciliaBody = z.object({
  tenant_id: z.string().uuid(),
  from: z.string().min(1),
  text: z.string().min(1).max(4000),
  canal: z.literal("whatsapp"),
  rubro: z.string().nullable().optional(),
});

router.post(
  "/internal/cecilia/whatsapp",
  async (req, res): Promise<void> => {
    if (!isInternalRequestAuthorized(req.header("x-wa-worker-token") ?? undefined)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: "supabase_not_configured" });
      return;
    }
    const parsed = InternalCeciliaBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body", issues: parsed.error.issues });
      return;
    }
    const sdb = getSupabaseDb();
    const [tenant] = await sdb
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, parsed.data.tenant_id))
      .limit(1);
    if (!tenant) {
      res.status(404).json({ error: "tenant_not_found" });
      return;
    }
    const rubro = await loadRubro(tenant.rubroId);

    // FAQ fuzzy match antes de Gemini: ahorra tokens y responde inmediato.
    const faqHit = await findFaqMatch(
      parsed.data.tenant_id,
      rubro,
      parsed.data.text,
    );
    if (faqHit) {
      const reply = sanitizeCeciliaText(faqHit.respuesta).slice(0, 1024);
      res.json({ reply, fromFaq: true, faqScore: faqHit.score });
      return;
    }

    const persona = rubro?.cecilia_persona ?? "asistente de negocio";
    const nombreRubro = rubro?.nombre ?? "tu rubro";
    const system = `${CECILIA_DISGUISE_SYSTEM}

CANAL: WhatsApp del negocio "${tenant.nombreEmpresa}".
RUBRO: ${nombreRubro}. Persona: ${persona}.
Cliente escribe desde ${parsed.data.from}.

ESTILO:
- Español neutral profesional, sin emojis, sin voseo.
- Respuesta breve (máx 3 frases). Orientada a la siguiente acción.
- Si te piden reservar, agendar o pedir, pide los datos mínimos uno por uno.
- Nunca reveles que eres una IA, ni menciones marcas tecnológicas.`;

    try {
      const result = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: parsed.data.text }] },
        ],
        config: { systemInstruction: system, maxOutputTokens: 512 },
      });
      const raw = result.text ?? "";
      const reply = sanitizeCeciliaText(raw).slice(0, 1024);
      res.json({ reply });
    } catch (err) {
      logger.warn(
        { err, tenantId: parsed.data.tenant_id },
        "internal cecilia whatsapp failed",
      );
      res.status(502).json({ error: "model_error" });
    }
  },
);

export default router;
