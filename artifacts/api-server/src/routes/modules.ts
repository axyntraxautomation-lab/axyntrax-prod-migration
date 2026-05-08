import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  modulesCatalogTable,
  clientModulesTable,
  clientsTable,
  paymentsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { audit } from "../lib/audit";
import { getPromptByIndustry, INDUSTRY_PROMPTS } from "../lib/industry-prompts";

const router: IRouter = Router();

router.get("/modules/catalog", requireAuth, async (req, res) => {
  const industry = typeof req.query.industry === "string" ? req.query.industry : undefined;
  const rows = industry
    ? await db
        .select()
        .from(modulesCatalogTable)
        .where(
          and(
            eq(modulesCatalogTable.industry, industry),
            eq(modulesCatalogTable.active, 1),
          ),
        )
        .orderBy(modulesCatalogTable.name)
    : await db
        .select()
        .from(modulesCatalogTable)
        .where(eq(modulesCatalogTable.active, 1))
        .orderBy(modulesCatalogTable.industry, modulesCatalogTable.name);
  res.json(rows);
});

router.get("/modules/industries", requireAuth, async (_req, res) => {
  res.json(
    Object.entries(INDUSTRY_PROMPTS).map(([slug, value]) => ({
      slug,
      label: value.label,
      tips: value.tips,
    })),
  );
});

router.get("/modules/industry-prompt/:industry", requireAuth, async (req, res) => {
  const data = getPromptByIndustry(req.params.industry);
  res.json({ industry: req.params.industry, ...data });
});

router.get(
  "/modules/client/:clientId",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res): Promise<void> => {
    const clientId = Number(req.params.clientId);
    if (!Number.isFinite(clientId)) {
      res.status(400).json({ error: "clientId inválido" });
      return;
    }
    const rows = await db
      .select({
        id: clientModulesTable.id,
        clientId: clientModulesTable.clientId,
        moduleId: clientModulesTable.moduleId,
        status: clientModulesTable.status,
        notes: clientModulesTable.notes,
        requestedAt: clientModulesTable.requestedAt,
        activatedAt: clientModulesTable.activatedAt,
        expiresAt: clientModulesTable.expiresAt,
        cancelledAt: clientModulesTable.cancelledAt,
        moduleSlug: modulesCatalogTable.slug,
        moduleName: modulesCatalogTable.name,
        moduleIndustry: modulesCatalogTable.industry,
        monthlyPrice: modulesCatalogTable.monthlyPrice,
        currency: modulesCatalogTable.currency,
      })
      .from(clientModulesTable)
      .innerJoin(
        modulesCatalogTable,
        eq(modulesCatalogTable.id, clientModulesTable.moduleId),
      )
      .where(eq(clientModulesTable.clientId, clientId))
      .orderBy(desc(clientModulesTable.requestedAt));
    res.json(rows);
  },
);

router.get("/modules/requests", requireAuth, requireRole("admin"), async (_req, res) => {
  const rows = await db
    .select({
      id: clientModulesTable.id,
      clientId: clientModulesTable.clientId,
      moduleId: clientModulesTable.moduleId,
      status: clientModulesTable.status,
      requestedAt: clientModulesTable.requestedAt,
      notes: clientModulesTable.notes,
      moduleName: modulesCatalogTable.name,
      moduleSlug: modulesCatalogTable.slug,
      moduleIndustry: modulesCatalogTable.industry,
      monthlyPrice: modulesCatalogTable.monthlyPrice,
      currency: modulesCatalogTable.currency,
      clientName: clientsTable.name,
      clientCompany: clientsTable.company,
    })
    .from(clientModulesTable)
    .innerJoin(modulesCatalogTable, eq(modulesCatalogTable.id, clientModulesTable.moduleId))
    .innerJoin(clientsTable, eq(clientsTable.id, clientModulesTable.clientId))
    .where(eq(clientModulesTable.status, "pendiente"))
    .orderBy(desc(clientModulesTable.requestedAt));
  res.json(rows);
});

const RequestBody = z.object({
  clientId: z.number().int().positive(),
  moduleId: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

router.post(
  "/modules/request",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res): Promise<void> => {
    const parsed = RequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.id, parsed.data.clientId));
    if (!client) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    const [mod] = await db
      .select()
      .from(modulesCatalogTable)
      .where(eq(modulesCatalogTable.id, parsed.data.moduleId));
    if (!mod) {
      res.status(404).json({ error: "Módulo no encontrado" });
      return;
    }
    if (mod.active !== 1) {
      res.status(409).json({ error: "Módulo desactivado en el catálogo" });
      return;
    }
    let row: typeof clientModulesTable.$inferSelect | undefined;
    let conflict: string | null = null;
    await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(clientModulesTable)
        .where(
          and(
            eq(clientModulesTable.clientId, parsed.data.clientId),
            eq(clientModulesTable.moduleId, parsed.data.moduleId),
          ),
        )
        .for("update");
      if (existing.some((e) => e.status !== "cancelado")) {
        conflict = "El módulo ya está solicitado o activo";
        return;
      }
      const [inserted] = await tx
        .insert(clientModulesTable)
        .values({
          clientId: parsed.data.clientId,
          moduleId: parsed.data.moduleId,
          status: "pendiente",
          notes: parsed.data.notes ?? null,
          requestedById: req.user!.id,
        })
        .returning();
      row = inserted;
    });
    if (conflict) {
      res.status(409).json({ error: conflict });
      return;
    }
    if (!row) {
      res.status(500).json({ error: "No se pudo crear la solicitud" });
      return;
    }
    await audit(req, {
      action: "module.request",
      entityType: "client_module",
      entityId: row.id,
      meta: { clientId: parsed.data.clientId, moduleSlug: mod.slug },
    });
    res.status(201).json(row);
  },
);

const ApproveBody = z.object({
  durationMonths: z.number().int().positive().max(60).default(1),
  createPayment: z.boolean().default(true),
});

router.post(
  "/modules/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const parsed = ApproveBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [cm] = await db
      .select()
      .from(clientModulesTable)
      .where(eq(clientModulesTable.id, id));
    if (!cm) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }
    if (cm.status === "activo") {
      res.status(409).json({ error: "Ya está activo" });
      return;
    }
    if (cm.status === "cancelado") {
      res.status(409).json({ error: "La solicitud está cancelada" });
      return;
    }
    const [mod] = await db
      .select()
      .from(modulesCatalogTable)
      .where(eq(modulesCatalogTable.id, cm.moduleId));
    if (!mod) {
      res.status(404).json({ error: "Módulo no encontrado" });
      return;
    }
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + parsed.data.durationMonths * 30 * 24 * 60 * 60 * 1000,
    );
    const updated = await db.transaction(async (tx) => {
      let paymentId: number | null = null;
      if (parsed.data.createPayment) {
        const total = (
          Number(mod.monthlyPrice) * parsed.data.durationMonths
        ).toFixed(2);
        const [payment] = await tx
          .insert(paymentsTable)
          .values({
            clientId: cm.clientId,
            amount: total,
            currency: mod.currency,
            method: "manual",
            status: "pendiente",
            description: `Activación módulo ${mod.name} (${parsed.data.durationMonths} meses)`,
          })
          .returning();
        paymentId = payment.id;
      }
      const [row] = await tx
        .update(clientModulesTable)
        .set({
          status: "activo",
          approvedById: req.user!.id,
          activatedAt: now,
          expiresAt,
          paymentId,
        })
        .where(
          and(
            eq(clientModulesTable.id, id),
            eq(clientModulesTable.status, "pendiente"),
          ),
        )
        .returning();
      if (!row) {
        throw new Error("conflict");
      }
      return row;
    }).catch((err) => {
      if (err.message === "conflict") return null;
      throw err;
    });
    if (!updated) {
      res.status(409).json({ error: "La solicitud cambió de estado" });
      return;
    }
    await audit(req, {
      action: "module.approve",
      entityType: "client_module",
      entityId: id,
      meta: { clientId: cm.clientId, moduleSlug: mod.slug, durationMonths: parsed.data.durationMonths },
    });
    res.json(updated);
  },
);

router.post(
  "/modules/:id/cancel",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const [updated] = await db
      .update(clientModulesTable)
      .set({ status: "cancelado", cancelledAt: new Date() })
      .where(eq(clientModulesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "No encontrado" });
      return;
    }
    await audit(req, {
      action: "module.cancel",
      entityType: "client_module",
      entityId: id,
    });
    res.json(updated);
  },
);

export default router;
