import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { ensureVapidKeys, sendPushToUser } from "../lib/push";
import { audit } from "../lib/audit";

const router: IRouter = Router();

router.get("/push/vapid-key", async (_req, res) => {
  const keys = await ensureVapidKeys();
  res.json({ publicKey: keys.publicKey });
});

const SubscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

router.post("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const parsed = SubscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { endpoint, keys } = parsed.data;
  const userId = req.user!.id;
  const userAgent = req.headers["user-agent"] ?? null;
  const existing = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));
  if (existing[0]) {
    await db
      .update(pushSubscriptionsTable)
      .set({
        userId,
        p256dh: keys.p256dh,
        authKey: keys.auth,
        userAgent,
      })
      .where(eq(pushSubscriptionsTable.id, existing[0].id));
    res.json({ ok: true, id: existing[0].id, updated: true });
    return;
  }
  const [row] = await db
    .insert(pushSubscriptionsTable)
    .values({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      authKey: keys.auth,
      userAgent,
    })
    .returning();
  await audit(req, {
    action: "push.subscribe",
    entityType: "push_subscription",
    entityId: row.id,
  });
  res.json({ ok: true, id: row.id, updated: false });
});

router.post("/push/unsubscribe", requireAuth, async (req, res): Promise<void> => {
  const endpoint = (req.body?.endpoint as string) ?? "";
  if (!endpoint) {
    res.status(400).json({ error: "Endpoint requerido" });
    return;
  }
  await db
    .delete(pushSubscriptionsTable)
    .where(
      and(
        eq(pushSubscriptionsTable.endpoint, endpoint),
        eq(pushSubscriptionsTable.userId, req.user!.id),
      ),
    );
  res.json({ ok: true });
});

router.post(
  "/push/test",
  requireAuth,
  requireRole(["admin"]),
  async (req, res) => {
    const result = await sendPushToUser(req.user!.id, {
      title: "AXYNTRAX",
      body: "Notificación de prueba: la conexión push funciona.",
      url: "/dashboard",
      tag: "test",
    });
    res.json(result);
  },
);

export default router;
