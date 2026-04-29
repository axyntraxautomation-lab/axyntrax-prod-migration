import app from "./app";
import { logger } from "./lib/logger";
import { startAlertasWatcher } from "./lib/alertas-watcher";

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
});
