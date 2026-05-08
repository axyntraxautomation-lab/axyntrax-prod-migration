// Smoke test del módulo backup. Verifica:
//  - exporter genera payload gzip no vacío y rowCounts incluye todas las tablas.
//  - endpoint POST /api/tenant/backup/ahora exige sesión admin.
//  - endpoint GET /api/tenant/backup/historial exige sesión admin.
//
// Ejecutar:
//   API_BASE=http://localhost:80 pnpm --filter @workspace/api-server run smoke-backup

import { exportTenantData, TENANT_BACKUP_TABLES } from "../src/lib/backup/exporter";

const API_BASE = process.env["API_BASE"] || "http://localhost:80";
type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];
let failed = 0;

function record(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  if (!ok) failed += 1;
  const tag = ok ? "[PASS]" : "[FAIL]";
  console.log(`${tag} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function checkExporter(): Promise<void> {
  let exported;
  try {
    exported = await exportTenantData();
  } catch (err) {
    record("exporter runs without throw", false, err instanceof Error ? err.message : String(err));
    return;
  }
  record(
    "exporter returns Buffer payload",
    Buffer.isBuffer(exported.payload),
    `bytes=${exported.payload?.length ?? 0}`,
  );
  record("exporter payload non-empty", (exported.payload?.length ?? 0) > 16);
  const expected = new Set<string>(TENANT_BACKUP_TABLES);
  const got = new Set<string>(Object.keys(exported.rowCounts ?? {}));
  const missing = [...expected].filter((t) => !got.has(t));
  record(
    "exporter covers all tenant_* tables",
    missing.length === 0,
    missing.length ? `missing=${missing.join(",")}` : `tables=${got.size}`,
  );
}

async function probeEndpoint(
  name: string,
  method: string,
  path: string,
  expectedStatus: number,
): Promise<void> {
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
    });
    record(name, r.status === expectedStatus, `expected=${expectedStatus} got=${r.status}`);
  } catch (err) {
    record(name, false, err instanceof Error ? err.message : String(err));
  }
}

async function main(): Promise<void> {
  await checkExporter();
  await probeEndpoint(
    "POST /api/tenant/backup/ahora without admin cookie rejected",
    "POST",
    "/api/tenant/backup/ahora",
    401,
  );
  await probeEndpoint(
    "GET /api/tenant/backup/historial without admin cookie rejected",
    "GET",
    "/api/tenant/backup/historial",
    401,
  );
  console.log("");
  if (failed === 0) {
    console.log(`All ${results.length} checks passed`);
    process.exit(0);
  } else {
    console.log(`${failed} of ${results.length} checks FAILED`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("smoke crashed:", err);
  process.exit(2);
});
