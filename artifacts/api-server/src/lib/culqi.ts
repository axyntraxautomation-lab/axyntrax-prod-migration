import { logger } from "./logger";

export type CulqiChargeInput = {
  amountCents: number;
  currency: string;
  email: string;
  description: string;
  token?: string | null;
};

export type CulqiChargeResult = {
  ok: boolean;
  externalId: string;
  status: "exitoso" | "fallido" | "procesando";
  raw?: unknown;
  stub: boolean;
  error?: string;
};

const CULQI_BASE = "https://api.culqi.com/v2";

export async function createCulqiCharge(
  input: CulqiChargeInput,
): Promise<CulqiChargeResult> {
  const secret = process.env.CULQI_SECRET_KEY;
  if (!secret) {
    const externalId = `stub_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    logger.warn(
      { externalId, amountCents: input.amountCents },
      "CULQI_SECRET_KEY no configurada — usando cargo stub",
    );
    return {
      ok: true,
      externalId,
      status: "exitoso",
      stub: true,
    };
  }

  if (!input.token) {
    return {
      ok: false,
      externalId: "",
      status: "fallido",
      stub: false,
      error: "Falta culqiToken (genéralo en frontend con Culqi.js).",
    };
  }

  try {
    const response = await fetch(`${CULQI_BASE}/charges`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountCents,
        currency_code: input.currency,
        email: input.email,
        source_id: input.token,
        description: input.description.slice(0, 80),
      }),
    });
    const body = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      return {
        ok: false,
        externalId: String(body.id ?? ""),
        status: "fallido",
        raw: body,
        stub: false,
        error:
          (body.user_message as string | undefined) ??
          (body.merchant_message as string | undefined) ??
          `Culqi HTTP ${response.status}`,
      };
    }
    return {
      ok: true,
      externalId: String(body.id ?? ""),
      status: "exitoso",
      raw: body,
      stub: false,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ err: error }, "Fallo al llamar a Culqi");
    return {
      ok: false,
      externalId: "",
      status: "fallido",
      stub: false,
      error,
    };
  }
}

export function verifyCulqiSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.CULQI_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;
  try {
    const { createHmac, timingSafeEqual } = require("crypto") as typeof import("crypto");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const actualBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
