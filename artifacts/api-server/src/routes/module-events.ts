import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  clientsTable,
  clientModulesTable,
  modulesCatalogTable,
  moduleEventsTable,
} from "@workspace/db";
import {
  requirePortalAuth,
  requirePortalClient,
  requirePortalAdmin,
} from "../lib/auth";
import { recordAlert } from "../lib/security";

const router: IRouter = Router();

const EventBody = z.object({
  type: z.string().min(1).max(64),
  severity: z.enum(["info", "warning", "error"]).optional(),
  message: z.string().max(2000).optional(),
  meta: z.record(z.unknown()).optional(),
});

// Client (or its installed module SDK) reports an event for a client_module.
router.post(
  "/portal/me/modules/:id/events",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const parsed = EventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const clientId = req.portal!.sub;
    const [cm] = await db
      .select()
      .from(clientModulesTable)
      .where(
        and(
          eq(clientModulesTable.id, id),
          eq(clientModulesTable.clientId, clientId),
        ),
      )
      .limit(1);
    if (!cm) {
      res.status(404).json({ error: "Módulo no encontrado" });
      return;
    }
    const [row] = await db
      .insert(moduleEventsTable)
      .values({
        clientModuleId: cm.id,
        clientId: cm.clientId,
        moduleId: cm.moduleId,
        type: parsed.data.type,
        severity: parsed.data.severity ?? "info",
        message: parsed.data.message ?? null,
        meta: parsed.data.meta ?? null,
      })
      .returning();
    if (parsed.data.severity === "error") {
      await recordAlert(req, {
        type: "module.error",
        severity: "warning",
        message: `Módulo ${cm.id} reportó error: ${parsed.data.message ?? parsed.data.type}`,
        meta: { clientModuleId: cm.id, type: parsed.data.type },
      });
    }
    res.status(201).json(row);
  },
);

router.get(
  "/portal/me/modules/:id/events",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const clientId = req.portal!.sub;
    const [cm] = await db
      .select({ id: clientModulesTable.id })
      .from(clientModulesTable)
      .where(
        and(
          eq(clientModulesTable.id, id),
          eq(clientModulesTable.clientId, clientId),
        ),
      )
      .limit(1);
    if (!cm) {
      res.status(404).json({ error: "Módulo no encontrado" });
      return;
    }
    const rows = await db
      .select()
      .from(moduleEventsTable)
      .where(eq(moduleEventsTable.clientModuleId, cm.id))
      .orderBy(desc(moduleEventsTable.createdAt))
      .limit(100);
    res.json(rows);
  },
);

router.get(
  "/portal/admin/module-events",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const limit = Math.min(Number(req.query.limit ?? 100) || 100, 500);
    const rows = await db
      .select({
        id: moduleEventsTable.id,
        clientModuleId: moduleEventsTable.clientModuleId,
        clientId: moduleEventsTable.clientId,
        moduleId: moduleEventsTable.moduleId,
        type: moduleEventsTable.type,
        severity: moduleEventsTable.severity,
        message: moduleEventsTable.message,
        meta: moduleEventsTable.meta,
        createdAt: moduleEventsTable.createdAt,
        clientName: clientsTable.name,
        moduleName: modulesCatalogTable.name,
      })
      .from(moduleEventsTable)
      .leftJoin(clientsTable, eq(moduleEventsTable.clientId, clientsTable.id))
      .leftJoin(
        modulesCatalogTable,
        eq(moduleEventsTable.moduleId, modulesCatalogTable.id),
      )
      .orderBy(desc(moduleEventsTable.createdAt))
      .limit(limit);
    res.json(rows);
  },
);

router.get(
  "/portal/admin/module-events/summary",
  requirePortalAuth,
  requirePortalAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        clientId: moduleEventsTable.clientId,
        clientName: clientsTable.name,
        total: sql<number>`count(*)::int`,
        errors: sql<number>`sum(case when ${moduleEventsTable.severity} = 'error' then 1 else 0 end)::int`,
        last: sql<Date>`max(${moduleEventsTable.createdAt})`,
      })
      .from(moduleEventsTable)
      .leftJoin(clientsTable, eq(moduleEventsTable.clientId, clientsTable.id))
      .groupBy(moduleEventsTable.clientId, clientsTable.name)
      .orderBy(sql`max(${moduleEventsTable.createdAt}) desc`)
      .limit(50);
    res.json(rows);
  },
);

export default router;
