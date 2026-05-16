import { gzipSync } from "node:zlib";
import { sql } from "drizzle-orm";
import { getSupabaseDb } from "@workspace/db-supabase";

const TENANT_TABLES = [
  "tenants",
  "tenant_branding",
  "tenant_inventario",
  "tenant_servicios",
  "tenant_clientes_finales",
  "tenant_empleados",
  "tenant_citas_servicios",
  "tenant_finanzas_movimientos",
  "tenant_alertas",
  "tenant_chat_cecilia_messages",
  "tenant_whatsapp_sessions",
  "tenant_whatsapp_messages",
  "tenant_kpi_snapshots",
  "tenant_onboarding_state",
  "tenant_faq_overrides",
  "tenant_pagos_qr",
  "tenant_rubro_overrides",
  "tenant_backups",
] as const;

export interface ExportResult {
  payload: Buffer;
  rawBytes: number;
  rowCounts: Record<string, number>;
  tenantsIncluded: string[];
}

export async function exportTenantData(opts: {
  onlyTenantId?: string;
} = {}): Promise<ExportResult> {
  const sdb = getSupabaseDb();
  const data: Record<string, unknown[]> = {};
  const rowCounts: Record<string, number> = {};
  const tenantIds = new Set<string>();

  for (const table of TENANT_TABLES) {
    const where =
      opts.onlyTenantId && table !== "tenants"
        ? sql`WHERE tenant_id = ${opts.onlyTenantId}`
        : opts.onlyTenantId && table === "tenants"
          ? sql`WHERE id = ${opts.onlyTenantId}`
          : sql``;
    const q = sql`SELECT * FROM ${sql.identifier(table)} ${where}`;
    const result = await sdb.execute(q);
    const rows = (result as { rows?: unknown[] }).rows ?? [];
    data[table] = rows;
    rowCounts[table] = rows.length;
    if (table === "tenants") {
      for (const r of rows as Array<{ id?: string }>) {
        if (r?.id) tenantIds.add(String(r.id));
      }
    }
  }

  const envelope = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scope: opts.onlyTenantId ? "tenant" : "full",
    onlyTenantId: opts.onlyTenantId ?? null,
    rowCounts,
    data,
    notes: [
      "Las credenciales de WhatsApp NO están en este backup: viven cifradas en el bucket Supabase Storage 'wa-session-creds' y se respaldan aparte.",
      "Las claves de cifrado AES-256-GCM derivan de SESSION_SECRET y NO se exportan.",
    ],
  };

  const json = JSON.stringify(envelope);
  const rawBytes = Buffer.byteLength(json, "utf8");
  const payload = gzipSync(Buffer.from(json, "utf8"), { level: 9 });
  return {
    payload,
    rawBytes,
    rowCounts,
    tenantsIncluded: [...tenantIds],
  };
}

export const TENANT_BACKUP_TABLES = TENANT_TABLES;
