import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import {
  getSessionState,
  startSession,
  stopSession,
  isMockMode,
} from "../lib/session-manager";
import { getInternalToken } from "../lib/internal-token";

const router = Router();

const tenantSchema = z.object({ tenant_id: z.string().uuid() });

function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  let expected: string;
  try {
    expected = getInternalToken();
  } catch {
    res.status(503).json({ error: "internal_token_not_configured" });
    return;
  }
  const got = req.header("x-wa-worker-token") ?? "";
  if (got !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

router.use(requireInternalToken);

router.post("/sesion/iniciar", async (req, res) => {
  const parse = tenantSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "invalid tenant_id" });
  }
  const state = await startSession(parse.data.tenant_id);
  return res.json({ ok: true, state });
});

router.post("/sesion/detener", async (req, res) => {
  const parse = tenantSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "invalid tenant_id" });
  }
  await stopSession(parse.data.tenant_id);
  return res.json({ ok: true });
});

router.get("/sesion/estado", (req, res) => {
  const tenantId = String(req.query["tenant_id"] ?? "");
  const parse = z.string().uuid().safeParse(tenantId);
  if (!parse.success) {
    return res.status(400).json({ error: "invalid tenant_id" });
  }
  const state = getSessionState(parse.data) ?? {
    status: "pending" as const,
    qrDataUrl: null,
    phone: null,
    mock: isMockMode(),
  };
  return res.json({ state });
});

export default router;
