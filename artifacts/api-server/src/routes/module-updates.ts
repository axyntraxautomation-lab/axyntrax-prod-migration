import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  clientModulesTable,
  modulesCatalogTable,
  moduleUpdatesTable,
  clientModuleUpdatesTable,
} from "@workspace/db";
import {
  requirePortalAuth,
  requirePortalClient,
  requirePortalAdmin,
} from "../lib/auth";
import { audit } from "../lib/audit";
import { sendPushToUser } from "../lib/push";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PublishBody = z.object({
  moduleId: z.number().int().positive(),
  version: z.string().min(1).max(32),
  severity: z.enum(["normal", "important", "critical"]).optional(),
  releaseNotes: z.string().min(1).max(5000),
});

router.post(
  "/portal/admin/module-updates",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const parsed = PublishBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const userId = req.portal!.kind === "admin" ? req.portal!.sub : null;

    const [mod] = await db
      .select({ id: modulesCatalogTable.id, name: modulesCatalogTable.name })
      .from(modulesCatalogTable)
      .where(eq(modulesCatalogTable.id, parsed.data.moduleId))
      .limit(1);
    if (!mod) {
      res.status(404).json({ error: "Módulo no encontrado" });
      return;
    }

    const [upd] = await db
      .insert(moduleUpdatesTable)
      .values({
        moduleId: parsed.data.moduleId,
        version: parsed.data.version,
        severity: parsed.data.severity ?? "normal",
        releaseNotes: parsed.data.releaseNotes,
        publishedBy: userId,
      })
      .returning();

    // Fan-out to active client_modules.
    const targets = await db
      .select({ id: clientModulesTable.id, clientId: clientModulesTable.clientId })
      .from(clientModulesTable)
      .where(
        and(
          eq(clientModulesTable.moduleId, parsed.data.moduleId),
          eq(clientModulesTable.status, "activo"),
        ),
      );

    if (targets.length > 0) {
      await db
        .insert(clientModuleUpdatesTable)
        .values(
          targets.map((t) => ({ clientModuleId: t.id, updateId: upd!.id })),
        );

      // Fire-and-forget push to each client owner (clients have user accounts via clientsTable).
      for (const t of targets) {
        try {
          await sendPushToUser(t.clientId, {
            title: `Actualización ${parsed.data.version}: ${mod.name}`,
            body: parsed.data.releaseNotes.slice(0, 160),
            url: "/portal/mis-modulos",
            tag: `update-${upd!.id}`,
          });
        } catch (err) {
          logger.warn({ err, clientId: t.clientId }, "module-update push failed");
        }
      }
    }

    await audit(req, {
      action: "module.update.publish",
      entityType: "module",
      entityId: parsed.data.moduleId,
      meta: { updateId: upd!.id, version: parsed.data.version, fanout: targets.length },
    });

    res.status(201).json({ update: upd, fanout: targets.length });
  },
);

router.get(
  "/portal/admin/module-updates",
  requirePortalAuth,
  requirePortalAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        id: moduleUpdatesTable.id,
        moduleId: moduleUpdatesTable.moduleId,
        moduleName: modulesCatalogTable.name,
        version: moduleUpdatesTable.version,
        severity: moduleUpdatesTable.severity,
        releaseNotes: moduleUpdatesTable.releaseNotes,
        createdAt: moduleUpdatesTable.createdAt,
        applied: sql<number>`(
          select count(*)::int from ${clientModuleUpdatesTable}
          where ${clientModuleUpdatesTable.updateId} = ${moduleUpdatesTable.id}
            and ${clientModuleUpdatesTable.status} = 'applied'
        )`,
        pending: sql<number>`(
          select count(*)::int from ${clientModuleUpdatesTable}
          where ${clientModuleUpdatesTable.updateId} = ${moduleUpdatesTable.id}
            and ${clientModuleUpdatesTable.status} = 'pending'
        )`,
      })
      .from(moduleUpdatesTable)
      .leftJoin(
        modulesCatalogTable,
        eq(moduleUpdatesTable.moduleId, modulesCatalogTable.id),
      )
      .orderBy(desc(moduleUpdatesTable.createdAt))
      .limit(200);
    res.json(rows);
  },
);

// Pending updates for the current client (across all his client_modules).
router.get(
  "/portal/me/updates",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    const clientId = req.portal!.sub;
    const rows = await db
      .select({
        id: clientModuleUpdatesTable.id,
        clientModuleId: clientModuleUpdatesTable.clientModuleId,
        updateId: clientModuleUpdatesTable.updateId,
        status: clientModuleUpdatesTable.status,
        appliedAt: clientModuleUpdatesTable.appliedAt,
        notifiedAt: clientModuleUpdatesTable.notifiedAt,
        version: moduleUpdatesTable.version,
        severity: moduleUpdatesTable.severity,
        releaseNotes: moduleUpdatesTable.releaseNotes,
        publishedAt: moduleUpdatesTable.createdAt,
        moduleName: modulesCatalogTable.name,
        moduleId: modulesCatalogTable.id,
      })
      .from(clientModuleUpdatesTable)
      .innerJoin(
        clientModulesTable,
        eq(clientModuleUpdatesTable.clientModuleId, clientModulesTable.id),
      )
      .innerJoin(
        moduleUpdatesTable,
        eq(clientModuleUpdatesTable.updateId, moduleUpdatesTable.id),
      )
      .leftJoin(
        modulesCatalogTable,
        eq(moduleUpdatesTable.moduleId, modulesCatalogTable.id),
      )
      .where(eq(clientModulesTable.clientId, clientId))
      .orderBy(desc(moduleUpdatesTable.createdAt))
      .limit(100);
    res.json(rows);
  },
);

router.post(
  "/portal/me/updates/:id/apply",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const clientId = req.portal!.sub;
    // Authorize: ensure the client_module belongs to this client.
    const [row] = await db
      .select({
        id: clientModuleUpdatesTable.id,
        clientModuleId: clientModuleUpdatesTable.clientModuleId,
        rowClient: clientModulesTable.clientId,
      })
      .from(clientModuleUpdatesTable)
      .innerJoin(
        clientModulesTable,
        eq(clientModuleUpdatesTable.clientModuleId, clientModulesTable.id),
      )
      .where(eq(clientModuleUpdatesTable.id, id))
      .limit(1);
    if (!row || row.rowClient !== clientId) {
      res.status(404).json({ error: "Actualización no encontrada" });
      return;
    }
    const [updated] = await db
      .update(clientModuleUpdatesTable)
      .set({ status: "applied", appliedAt: new Date() })
      .where(eq(clientModuleUpdatesTable.id, id))
      .returning();
    res.json(updated);
  },
);

export default router;
