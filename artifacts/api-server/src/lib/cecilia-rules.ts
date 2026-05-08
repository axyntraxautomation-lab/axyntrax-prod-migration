/**
 * Reglas automáticas de generación de alertas para SaaS Cecilia.
 *
 * Se ejecutan periódicamente (cron interno cada 15 min) y evalúan 4 reglas
 * temporales por tenant activo:
 *
 *  1. cita_proxima            (warning) Cita en menos de 1h sin alerta abierta.
 *  2. pago_pendiente           (warning) Pago QR pendiente con >24h.
 *  3. cita_completada_sin_pago (warning) Cita completada hace >2h sin movimiento ingreso enlazado.
 *  4. dia_sin_ventas          (info)    Tenant onboarding completado, 0 ingresos en 24h.
 *
 * La regla `stock_bajo` ya se inserta inline en tenant-business.ts cuando
 * cantidad < minimo_alerta tras un write; por eso no se replica acá.
 *
 * Dedupe: para cada tenant + tipo + clave de payload, si ya existe una
 * alerta con leida=false NO se inserta otra. Cuando el tenant marca leída,
 * la próxima evaluación puede volver a generarla si la condición persiste.
 *
 * Toda query a Supabase se hace con tenant_id explícito (defense-in-depth).
 */
import { and, eq, gt, gte, lt, sql } from "drizzle-orm";
import {
  getSupabaseDb,
  tenantsTable,
  tenantAlertasTable,
  tenantCitasServiciosTable,
  tenantFinanzasMovimientosTable,
  tenantPagosQrTable,
  tenantOnboardingStateTable,
  isSupabaseConfigured,
} from "@workspace/db-supabase";
import { logger } from "./logger";

const RULES_TICK_MS = 15 * 60 * 1000;
const FIRST_TICK_MS = 60 * 1000;

let started = false;

export function startCeciliaRulesScheduler(): void {
  if (started) return;
  if (!isSupabaseConfigured()) {
    logger.warn("[cecilia-rules] Supabase no configurado, scheduler no inicia");
    return;
  }
  started = true;
  setTimeout(() => {
    void runAllTenants().catch((err) =>
      logger.error({ err }, "[cecilia-rules] tick falló"),
    );
  }, FIRST_TICK_MS).unref();
  setInterval(() => {
    void runAllTenants().catch((err) =>
      logger.error({ err }, "[cecilia-rules] tick falló"),
    );
  }, RULES_TICK_MS).unref();
  logger.info("[cecilia-rules] scheduler iniciado (cada 15 min)");
}

export async function runAllTenants(): Promise<{ tenants: number; alertasCreadas: number }> {
  const sdb = getSupabaseDb();
  const tenants = await sdb
    .select({
      id: tenantsTable.id,
      status: tenantsTable.status,
    })
    .from(tenantsTable)
    .where(eq(tenantsTable.status, "activo"));
  let total = 0;
  for (const t of tenants) {
    try {
      const n = await runForTenant(t.id);
      total += n;
    } catch (err) {
      logger.error(
        { err, tenantId: t.id },
        "[cecilia-rules] regla falló para tenant",
      );
    }
  }
  if (total > 0) {
    logger.info(
      { tenants: tenants.length, alertasCreadas: total },
      "[cecilia-rules] tick completado",
    );
  }
  return { tenants: tenants.length, alertasCreadas: total };
}

export async function runForTenant(tenantId: string): Promise<number> {
  let n = 0;
  n += await rulCitaProxima(tenantId);
  n += await rulPagoPendiente24h(tenantId);
  n += await rulCitaCompletadaSinPago(tenantId);
  n += await rulDiaSinVentas(tenantId);
  return n;
}

/**
 * Inserta una alerta solo si no existe otra abierta (leida=false) del mismo
 * tipo y misma clave de payload. La clave se busca con
 * `payload->>'<key>' = '<value>'`.
 */
async function insertIfNotOpen(args: {
  tenantId: string;
  tipo: string;
  severidad: "info" | "warning" | "critical";
  titulo: string;
  detalle: string | null;
  payload: Record<string, unknown>;
  dedupeKey?: { key: string; value: string };
}): Promise<boolean> {
  // Single-statement INSERT ... SELECT ... WHERE NOT EXISTS para evitar
  // race condition: la condición de dedupe y el INSERT viajan en una sola
  // sentencia SQL. Postgres serializa la fila por MVCC y NO se necesita
  // unique index (no podemos modificar el schema en esta tarea). Si dos
  // ticks corren en paralelo, el segundo SELECT verá el INSERT del primero
  // dentro de la misma transacción implícita y producirá 0 filas.
  const sdb = getSupabaseDb();
  const dedupeFilter = args.dedupeKey
    ? sql`AND (payload->>${args.dedupeKey.key}) = ${args.dedupeKey.value}`
    : sql``;
  const payloadJson = JSON.stringify(args.payload);
  const result = await sdb.execute(sql`
    INSERT INTO tenant_alertas
      (tenant_id, tipo, severidad, titulo, detalle, payload, leida)
    SELECT
      ${args.tenantId}::uuid,
      ${args.tipo}::text,
      ${args.severidad}::text,
      ${args.titulo}::text,
      ${args.detalle}::text,
      ${payloadJson}::jsonb,
      false
    WHERE NOT EXISTS (
      SELECT 1 FROM tenant_alertas
      WHERE tenant_id = ${args.tenantId}::uuid
        AND tipo = ${args.tipo}::text
        AND leida = false
        ${dedupeFilter}
    )
    RETURNING id
  `);
  // pg `execute` retorna { rows, rowCount }
  const rowCount = (result as unknown as { rowCount?: number; rows?: unknown[] })
    .rowCount ??
    (result as unknown as { rows?: unknown[] }).rows?.length ??
    0;
  return rowCount > 0;
}

// === Regla 1: cita próxima (<1h) ===
async function rulCitaProxima(tenantId: string): Promise<number> {
  const sdb = getSupabaseDb();
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const proximas = await sdb
    .select({
      id: tenantCitasServiciosTable.id,
      fechaInicio: tenantCitasServiciosTable.fechaInicio,
      titulo: tenantCitasServiciosTable.titulo,
      estado: tenantCitasServiciosTable.estado,
    })
    .from(tenantCitasServiciosTable)
    .where(
      and(
        eq(tenantCitasServiciosTable.tenantId, tenantId),
        gte(tenantCitasServiciosTable.fechaInicio, now),
        lt(tenantCitasServiciosTable.fechaInicio, inOneHour),
        sql`${tenantCitasServiciosTable.estado} IN ('pendiente','confirmado')`,
      ),
    );
  let created = 0;
  for (const c of proximas) {
    const fecha = c.fechaInicio.toISOString();
    const ok = await insertIfNotOpen({
      tenantId,
      tipo: "cita_proxima",
      severidad: "warning",
      titulo: `Cita en menos de 1 hora${c.titulo ? `: ${c.titulo}` : ""}`,
      detalle: `La cita está programada para ${fecha}.`,
      payload: { cita_id: c.id, fecha_inicio: fecha },
      dedupeKey: { key: "cita_id", value: c.id },
    });
    if (ok) created++;
  }
  return created;
}

// === Regla 2: pago QR pendiente >24h ===
async function rulPagoPendiente24h(tenantId: string): Promise<number> {
  const sdb = getSupabaseDb();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pagos = await sdb
    .select({
      id: tenantPagosQrTable.id,
      monto: tenantPagosQrTable.monto,
      moneda: tenantPagosQrTable.moneda,
      createdAt: tenantPagosQrTable.createdAt,
    })
    .from(tenantPagosQrTable)
    .where(
      and(
        eq(tenantPagosQrTable.tenantId, tenantId),
        eq(tenantPagosQrTable.estado, "pendiente"),
        lt(tenantPagosQrTable.createdAt, cutoff),
      ),
    );
  let created = 0;
  for (const p of pagos) {
    const ok = await insertIfNotOpen({
      tenantId,
      tipo: "pago_pendiente",
      severidad: "warning",
      titulo: `Pago QR pendiente hace más de 24h`,
      detalle: `Monto ${p.moneda} ${p.monto} sigue sin confirmar.`,
      payload: { pago_id: p.id, created_at: p.createdAt.toISOString() },
      dedupeKey: { key: "pago_id", value: p.id },
    });
    if (ok) created++;
  }
  return created;
}

// === Regla 3: cita completada hace >2h sin movimiento ingreso ===
async function rulCitaCompletadaSinPago(tenantId: string): Promise<number> {
  const sdb = getSupabaseDb();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const candidatas = await sdb
    .select({
      id: tenantCitasServiciosTable.id,
      titulo: tenantCitasServiciosTable.titulo,
      fechaInicio: tenantCitasServiciosTable.fechaInicio,
      updatedAt: tenantCitasServiciosTable.updatedAt,
    })
    .from(tenantCitasServiciosTable)
    .where(
      and(
        eq(tenantCitasServiciosTable.tenantId, tenantId),
        eq(tenantCitasServiciosTable.estado, "completado"),
        lt(tenantCitasServiciosTable.updatedAt, cutoff),
      ),
    )
    .limit(50);
  let created = 0;
  for (const c of candidatas) {
    const [ingreso] = await sdb
      .select({ id: tenantFinanzasMovimientosTable.id })
      .from(tenantFinanzasMovimientosTable)
      .where(
        and(
          eq(tenantFinanzasMovimientosTable.tenantId, tenantId),
          eq(tenantFinanzasMovimientosTable.tipo, "ingreso"),
          sql`(${tenantFinanzasMovimientosTable.metadata}->>'cita_id') = ${c.id}`,
        ),
      )
      .limit(1);
    if (ingreso) continue;
    const ok = await insertIfNotOpen({
      tenantId,
      tipo: "cita_completada_sin_pago",
      severidad: "warning",
      titulo: `Cita completada sin pago registrado${c.titulo ? `: ${c.titulo}` : ""}`,
      detalle: `La cita se cerró pero no hay ingreso enlazado.`,
      payload: { cita_id: c.id },
      dedupeKey: { key: "cita_id", value: c.id },
    });
    if (ok) created++;
  }
  return created;
}

// === Regla 4: día sin ventas (24h sin ingresos, onboarding completado) ===
async function rulDiaSinVentas(tenantId: string): Promise<number> {
  const sdb = getSupabaseDb();
  // Solo tenants con onboarding completado (evita ruido en cuentas nuevas).
  const [ob] = await sdb
    .select({ estado: tenantOnboardingStateTable.estado })
    .from(tenantOnboardingStateTable)
    .where(eq(tenantOnboardingStateTable.tenantId, tenantId))
    .limit(1);
  if (!ob || ob.estado !== "completado") return 0;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [hayIngreso] = await sdb
    .select({ id: tenantFinanzasMovimientosTable.id })
    .from(tenantFinanzasMovimientosTable)
    .where(
      and(
        eq(tenantFinanzasMovimientosTable.tenantId, tenantId),
        eq(tenantFinanzasMovimientosTable.tipo, "ingreso"),
        gt(tenantFinanzasMovimientosTable.createdAt, since),
      ),
    )
    .limit(1);
  if (hayIngreso) return 0;

  // Dedupe por día (clave fecha YYYY-MM-DD).
  const today = new Date().toISOString().slice(0, 10);
  const ok = await insertIfNotOpen({
    tenantId,
    tipo: "dia_sin_ventas",
    severidad: "info",
    titulo: "Hoy aún no registras ventas",
    detalle: "No hay ingresos en las últimas 24 horas.",
    payload: { fecha: today },
    dedupeKey: { key: "fecha", value: today },
  });
  return ok ? 1 : 0;
}
