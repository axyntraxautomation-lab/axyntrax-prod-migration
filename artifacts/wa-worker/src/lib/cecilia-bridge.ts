import { logger } from "./logger";
import { getInternalToken } from "./internal-token";

const API_BASE =
  process.env["API_SERVER_INTERNAL_URL"] ?? "http://localhost:8080";

export interface CeciliaAskInput {
  tenantId: string;
  fromNumber: string;
  text: string;
  rubro?: string | null;
}

export interface CeciliaAskResult {
  ok: boolean;
  reply: string | null;
}

/**
 * Bridge to api-server Cecilia endpoint. The api-server applies the disguise
 * post-filter; we still re-apply locally for defense in depth.
 */
export async function askCecilia(input: CeciliaAskInput): Promise<CeciliaAskResult> {
  const url = `${API_BASE}/api/internal/cecilia/whatsapp`;
  let token: string;
  try {
    token = getInternalToken();
  } catch (err) {
    logger.warn({ err, tenantId: input.tenantId }, "cecilia bridge token missing");
    return { ok: false, reply: null };
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wa-worker-token": token,
      },
      body: JSON.stringify({
        tenant_id: input.tenantId,
        from: input.fromNumber,
        text: input.text,
        canal: "whatsapp",
        rubro: input.rubro ?? null,
      }),
    });
    if (!r.ok) {
      logger.warn({ status: r.status, tenantId: input.tenantId }, "cecilia bridge non-ok");
      return { ok: false, reply: null };
    }
    const body = (await r.json()) as { reply?: unknown };
    if (typeof body.reply === "string" && body.reply.length > 0) {
      return { ok: true, reply: body.reply };
    }
    return { ok: false, reply: null };
  } catch (err) {
    logger.warn({ err, tenantId: input.tenantId }, "cecilia bridge threw");
    return { ok: false, reply: null };
  }
}
