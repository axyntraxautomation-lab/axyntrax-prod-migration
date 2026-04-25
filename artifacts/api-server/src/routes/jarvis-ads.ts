import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db, jarvisAdsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { generateAd } from "../lib/jarvis-ads-generator";

const router: IRouter = Router();

const ChannelEnum = z.enum(["fb", "ig", "both"]);
const StatusEnum = z.enum(["pendiente", "aprobado", "publicado", "descartado"]);

router.get(
  "/jarvis/ads",
  requireAuth,
  requireRole("admin"),
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(jarvisAdsTable)
      .orderBy(desc(jarvisAdsTable.createdAt))
      .limit(100);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(jarvisAdsTable);
    res.json({ rows, total: count });
  },
);

router.post(
  "/jarvis/ads/generate",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const body = z
      .object({
        channel: ChannelEnum.optional(),
        audience: z.string().min(1).max(100).optional(),
      })
      .safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: "Parámetros inválidos" });
      return;
    }
    const created = await generateAd({
      channel: body.data.channel,
      audience: body.data.audience,
      source: "manual",
    });
    if (!created) {
      res
        .status(503)
        .json({ error: "JARVIS no pudo generar el aviso, reintentá en unos segundos." });
      return;
    }
    res.status(201).json(created);
  },
);

router.patch(
  "/jarvis/ads/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const body = z
      .object({ status: StatusEnum })
      .safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: "estado inválido" });
      return;
    }
    const now = new Date();
    const patch: Record<string, unknown> = { status: body.data.status };
    if (body.data.status === "aprobado") patch.approvedAt = now;
    if (body.data.status === "publicado") patch.publishedAt = now;
    const [updated] = await db
      .update(jarvisAdsTable)
      .set(patch)
      .where(eq(jarvisAdsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "aviso no encontrado" });
      return;
    }
    res.json(updated);
  },
);

router.delete(
  "/jarvis/ads/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    await db.delete(jarvisAdsTable).where(eq(jarvisAdsTable.id, id));
    res.status(204).end();
  },
);

export default router;
