import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { sendText } from "../lib/session-manager";
import { getSupabase } from "../lib/supabase";
import { getInternalToken } from "../lib/internal-token";

const router = Router();

const sendSchema = z.object({
  tenant_id: z.string().uuid(),
  to: z.string().min(6),
  text: z.string().min(1).max(4096),
});

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

router.post("/enviar", requireInternalToken, async (req, res) => {
  const parse = sendSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "invalid body", issues: parse.error.issues });
  }
  const { tenant_id, to, text } = parse.data;
  const r = await sendText(tenant_id, to, text);
  if (!r.ok) {
    return res.status(502).json({ ok: false, reason: r.reason ?? "unknown" });
  }
  // Log outbound message
  const supabase = getSupabase();
  const { data: sess } = await supabase
    .from("tenant_whatsapp_sessions")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("provider", "baileys")
    .maybeSingle();
  await supabase.from("tenant_whatsapp_messages").insert({
    tenant_id,
    session_id: sess?.id ?? null,
    direccion: "out",
    from_number: null,
    to_number: to,
    tipo: "text",
    body: text,
    estado: "enviado",
    metadata: { source: "api" },
  });
  return res.json({ ok: true });
});

export default router;
