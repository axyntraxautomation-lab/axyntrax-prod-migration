import app from "./app";
import { logger } from "./lib/logger";
import { startAlertasWatcher } from "./lib/alertas-watcher";
import { restoreActiveSessions } from "./lib/session-manager";

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT env var is required");
}
const port = Number(rawPort);
if (!Number.isFinite(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "wa-worker failed to bind");
    process.exit(1);
  }
  logger.info({ port }, "wa-worker listening");
  try {
    startAlertasWatcher();
  } catch (err) {
    logger.warn({ err }, "alertas watcher not started");
  }
  // Boot-time rehydration of sessions that were marked active in DB. Failures
  // here are non-fatal: tenants can re-trigger /sesion/iniciar from the UI.
  void restoreActiveSessions().catch((err) =>
    logger.warn({ err }, "restoreActiveSessions threw"),
  );
});
