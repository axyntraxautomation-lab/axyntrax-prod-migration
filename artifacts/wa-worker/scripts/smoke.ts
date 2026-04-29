import { createHash } from "node:crypto";

const WA_BASE = process.env["WA_WORKER_URL"] ?? "http://localhost:8099";
const API_BASE = process.env["API_BASE"] ?? "http://localhost:80";

function deriveToken(): string | null {
  const explicit = process.env["WA_WORKER_INTERNAL_TOKEN"];
  if (explicit && explicit.length > 0) return explicit;
  const seed = process.env["SESSION_SECRET"];
  if (!seed) return null;
  return createHash("sha256").update(seed).update("wa-worker").digest("hex");
}

interface Check {
  name: string;
  expected: number;
  got: number;
  ok: boolean;
}

async function head(method: "GET" | "POST", url: string, headers: Record<string, string> = {}, body?: unknown): Promise<number> {
  try {
    const r = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return r.status;
  } catch (err) {
    console.error(`[smoke] fetch ${method} ${url} threw:`, err);
    return 0;
  }
}

async function main() {
  const checks: Check[] = [];

  const healthz = await head("GET", `${WA_BASE}/healthz`);
  checks.push({ name: "wa-worker healthz", expected: 200, got: healthz, ok: healthz === 200 });

  const enviarNoToken = await head("POST", `${WA_BASE}/wa/enviar`, {}, {
    tenant_id: "00000000-0000-0000-0000-000000000000",
    to: "51999",
    text: "smoke",
  });
  checks.push({
    name: "wa/enviar without token rejected",
    expected: 401,
    got: enviarNoToken,
    ok: enviarNoToken === 401,
  });

  const estadoNoToken = await head(
    "GET",
    `${WA_BASE}/wa/sesion/estado?tenant_id=00000000-0000-0000-0000-000000000000`,
  );
  checks.push({
    name: "wa/sesion/estado without token rejected",
    expected: 401,
    got: estadoNoToken,
    ok: estadoNoToken === 401,
  });

  const ceciliaInvalid = await head(
    "POST",
    `${API_BASE}/api/internal/cecilia/whatsapp`,
    { "x-wa-worker-token": "definitely-invalid" },
    {
      tenant_id: "00000000-0000-0000-0000-000000000000",
      from: "51999",
      text: "hola",
      canal: "whatsapp",
    },
  );
  checks.push({
    name: "internal/cecilia/whatsapp with invalid token rejected",
    expected: 401,
    got: ceciliaInvalid,
    ok: ceciliaInvalid === 401,
  });

  const token = deriveToken();
  if (token) {
    const estadoAuthed = await head(
      "GET",
      `${WA_BASE}/wa/sesion/estado?tenant_id=00000000-0000-0000-0000-000000000000`,
      { "x-wa-worker-token": token },
    );
    checks.push({
      name: "wa/sesion/estado with token responds (200 or 503)",
      expected: 200,
      got: estadoAuthed,
      ok: estadoAuthed === 200 || estadoAuthed === 404 || estadoAuthed === 503,
    });
  } else {
    console.warn("[smoke] no SESSION_SECRET / WA_WORKER_INTERNAL_TOKEN — skipping authed check");
  }

  let failed = 0;
  for (const c of checks) {
    const tag = c.ok ? "PASS" : "FAIL";
    console.log(`[${tag}] ${c.name} expected=${c.expected} got=${c.got}`);
    if (!c.ok) failed += 1;
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${checks.length} checks passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
