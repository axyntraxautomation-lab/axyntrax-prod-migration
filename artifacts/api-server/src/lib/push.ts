import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db, appSettingsTable, pushSubscriptionsTable } from "@workspace/db";
import { logger } from "./logger";

let cached: { publicKey: string; privateKey: string } | null = null;

export async function ensureVapidKeys(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  if (cached) return cached;
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, "vapid_keys"));
  if (rows[0]) {
    try {
      const parsed = JSON.parse(rows[0].value) as {
        publicKey: string;
        privateKey: string;
      };
      cached = parsed;
      webpush.setVapidDetails(
        "mailto:axyntraxautomation@gmail.com",
        parsed.publicKey,
        parsed.privateKey,
      );
      return parsed;
    } catch {
      // fall through and regenerate
    }
  }
  const generated = webpush.generateVAPIDKeys();
  await db
    .insert(appSettingsTable)
    .values({ key: "vapid_keys", value: JSON.stringify(generated) })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value: JSON.stringify(generated), updatedAt: new Date() },
    });
  cached = generated;
  webpush.setVapidDetails(
    "mailto:axyntraxautomation@gmail.com",
    generated.publicKey,
    generated.privateKey,
  );
  return generated;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(
  userId: number,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  await ensureVapidKeys();
  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userId));
  let sent = 0;
  let removed = 0;
  const json = JSON.stringify(payload);
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.authKey },
        },
        json,
      );
      sent += 1;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await db
          .delete(pushSubscriptionsTable)
          .where(eq(pushSubscriptionsTable.id, s.id));
        removed += 1;
      } else {
        logger.warn({ err, endpoint: s.endpoint }, "Push send failed");
      }
    }
  }
  return { sent, removed };
}
