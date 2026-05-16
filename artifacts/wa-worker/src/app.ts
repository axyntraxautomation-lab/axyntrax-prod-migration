import express from "express";
import pinoHttp from "pino-http";
import qrRoutes from "./routes/qr";
import enviarRoutes from "./routes/enviar";
import { logger } from "./lib/logger";

const app = express();
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// All endpoints are internal — only the api-server should call this worker.
app.use("/wa", qrRoutes);
app.use("/wa", enviarRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.path });
});

export default app;
