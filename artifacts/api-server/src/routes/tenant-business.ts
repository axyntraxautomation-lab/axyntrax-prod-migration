import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import QRCode from "qrcode";
import {
  getSupabaseDb,
  tenantsTable,
  tenantInventarioTable,
  tenantServiciosTable,
  tenantClientesFinalesTable,
  tenantEmpleadosTable,
  tenantCitasServiciosTable,
  tenantFinanzasMovimientosTable,
  tenantAlertasTable,
  tenantPagosQrTable,
  tenantFaqOverridesTable,
} from "@workspace/db-supabase";
import { db, clientsTable } from "@workspace/db";
import { requirePortalAuth, requirePortalClient } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase-admin";
import { encryptField, decryptField, searchHash, normalizePhone } from "../lib/crypto";
import { sendOutbound } from "../lib/wa-worker-client";
import { logger as appLogger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Resuelve un número de WhatsApp para el cliente final asociado a la cita.
 * Prioridad: metadata.whatsappFrom (cliente nacido en wa-worker) > telefono
 * descifrado. Devuelve sólo dígitos. Null si no hay número usable.
 */
async function resolveClienteWhatsapp(
  clienteFinalId: string | null,
  tenantId: string,
): Promise<string | null> {
  if (!clienteFinalId) return null;
  try {
    const sdb = getSupabaseDb();
    const [c] = await sdb
      .select()
      .from(tenantClientesFinalesTable)
      .where(
        and(
          eq(tenantClientesFinalesTable.id, clienteFinalId),
          eq(tenantClientesFinalesTable.tenantId, tenantId),
        ),
      )
      .limit(1);
    if (!c) return null;
    const meta = (c.rubroData ?? {}) as Record<string, unknown>;
    const fromMeta =
      typeof meta["whatsappFrom"] === "string" ? (meta["whatsappFrom"] as string) : null;
    if (fromMeta) return fromMeta.replace(/\D+/g, "") || null;
    if (c.telefono) {
      try {
        const plain = await decryptField(c.telefono);
        if (plain) return plain.replace(/\D+/g, "") || null;
      } catch {
        // ignore - cipher unreadable
      }
    }
    return null;
  } catch (err) {
    appLogger.warn({ err, clienteFinalId, tenantId }, "resolveClienteWhatsapp failed");
    return null;
  }
}

/** Envia mensaje al cliente vía wa-worker; non-throwing. */
async function notifyCliente(
  tenantId: string,
  clienteFinalId: string | null,
  text: string,
): Promise<void> {
  const to = await resolveClienteWhatsapp(clienteFinalId, tenantId);
  if (!to) return;
  try {
    await sendOutbound({ tenantId, to, text });
  } catch (err) {
    appLogger.warn({ err, tenantId, to }, "auto outbound failed");
  }
}

const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas escrituras. Espera un momento." },
});

function gateSupabase(req: Request, res: Response, next: NextFunction): void {
  if (!isSupabaseConfigured()) {
    res.status(503).json({
      error: "El módulo SaaS Cecilia aún no está configurado en este entorno.",
      code: "supabase_not_configured",
    });
    return;
  }
  next();
}

async function findTenantForPortalUser(req: Request) {
  if (!req.portal || req.portal.kind !== "client") return null;
  const [client] = await db
    .select({ id: clientsTable.id, email: clientsTable.email })
    .from(clientsTable)
    .where(eq(clientsTable.id, req.portal.sub))
    .limit(1);
  if (!client?.email) return null;
  const sdb = getSupabaseDb();
  const ownerEmail = client.email.toLowerCase();
  const [tenant] = await sdb
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.ownerEmail, ownerEmail))
    .limit(1);
  if (!tenant) return null;
  return { tenant, ownerEmail, clientId: client.id };
}

async function requireTenantCtx(req: Request, res: Response) {
  const ctx = await findTenantForPortalUser(req);
  if (!ctx) {
    res
      .status(404)
      .json({ error: "Tenant no encontrado", code: "tenant_not_found" });
    return null;
  }
  return ctx;
}

function badRequest(res: Response, err: z.ZodError): void {
  const msg = err.issues[0]?.message ?? "Datos inválidos";
  res.status(400).json({ error: msg });
}

const UuidParam = z.object({ id: z.string().uuid("ID inválido") });

function num(v: unknown): string {
  return Number(v).toFixed(2);
}

function num3(v: unknown): string {
  return Number(v).toFixed(3);
}

// ----------------- INVENTARIO -----------------

const InventarioCreate = z.object({
  nombre: z.string().trim().min(1).max(160),
  sku: z.string().trim().max(64).optional().nullable(),
  categoria: z.string().trim().max(64).optional().nullable(),
  unidad: z.string().trim().max(16).default("unidad"),
  cantidad: z.number().min(0).default(0),
  minimoAlerta: z.number().min(0).default(0),
  precioCosto: z.number().min(0).optional().nullable(),
  precioVenta: z.number().min(0).optional().nullable(),
});

const InventarioUpdate = InventarioCreate.partial();

async function createStockAlertIfLow(args: {
  tenantId: string;
  itemId: string;
  nombre: string;
  cantidad: number;
  minimo: number;
}) {
  // Trigger estricto: alertamos sólo cuando stock_actual < stock_minimo
  // (igualdad NO dispara la alerta para evitar falsos positivos al
  // restock exacto al mínimo).
  if (!(args.minimo > 0 && args.cantidad < args.minimo)) return;
  const sdb = getSupabaseDb();
  // Evitar duplicados: ya hay alerta abierta no leída para este item
  const existing = await sdb
    .select({ id: tenantAlertasTable.id })
    .from(tenantAlertasTable)
    .where(
      and(
        eq(tenantAlertasTable.tenantId, args.tenantId),
        eq(tenantAlertasTable.tipo, "stock_bajo"),
        eq(tenantAlertasTable.leida, false),
        sql`(${tenantAlertasTable.payload}->>'item_id') = ${args.itemId}`,
      ),
    )
    .limit(1);
  if (existing.length > 0) return;
  await sdb.insert(tenantAlertasTable).values({
    tenantId: args.tenantId,
    tipo: "stock_bajo",
    severidad: args.cantidad <= 0 ? "critica" : "alta",
    titulo: `Stock bajo: ${args.nombre}`,
    detalle: `Quedan ${args.cantidad} unidades (mínimo ${args.minimo}).`,
    payload: {
      item_id: args.itemId,
      nombre: args.nombre,
      cantidad: args.cantidad,
      minimo: args.minimo,
    },
  });
}

router.get(
  "/tenant/inventario",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantInventarioTable)
      .where(eq(tenantInventarioTable.tenantId, ctx.tenant.id))
      .orderBy(asc(tenantInventarioTable.nombre));
    res.json({ items: rows });
  },
);

router.post(
  "/tenant/inventario",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = InventarioCreate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .insert(tenantInventarioTable)
      .values({
        tenantId: ctx.tenant.id,
        nombre: d.nombre,
        sku: d.sku ?? null,
        categoria: d.categoria ?? null,
        unidad: d.unidad ?? "unidad",
        cantidad: num3(d.cantidad ?? 0),
        minimoAlerta: num3(d.minimoAlerta ?? 0),
        precioCosto: d.precioCosto != null ? num(d.precioCosto) : null,
        precioVenta: d.precioVenta != null ? num(d.precioVenta) : null,
      })
      .returning();
    await createStockAlertIfLow({
      tenantId: ctx.tenant.id,
      itemId: row.id,
      nombre: row.nombre,
      cantidad: Number(row.cantidad),
      minimo: Number(row.minimoAlerta),
    });
    res.status(201).json(row);
  },
);

router.patch(
  "/tenant/inventario/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const parsed = InventarioUpdate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.nombre !== undefined) patch.nombre = d.nombre;
    if (d.sku !== undefined) patch.sku = d.sku ?? null;
    if (d.categoria !== undefined) patch.categoria = d.categoria ?? null;
    if (d.unidad !== undefined) patch.unidad = d.unidad ?? "unidad";
    if (d.cantidad !== undefined) patch.cantidad = num3(d.cantidad);
    if (d.minimoAlerta !== undefined) patch.minimoAlerta = num3(d.minimoAlerta);
    if (d.precioCosto !== undefined)
      patch.precioCosto = d.precioCosto != null ? num(d.precioCosto) : null;
    if (d.precioVenta !== undefined)
      patch.precioVenta = d.precioVenta != null ? num(d.precioVenta) : null;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .update(tenantInventarioTable)
      .set(patch)
      .where(
        and(
          eq(tenantInventarioTable.id, params.data.id),
          eq(tenantInventarioTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "Item no encontrado" });
      return;
    }
    await createStockAlertIfLow({
      tenantId: ctx.tenant.id,
      itemId: row.id,
      nombre: row.nombre,
      cantidad: Number(row.cantidad),
      minimo: Number(row.minimoAlerta),
    });
    res.json(row);
  },
);

router.delete(
  "/tenant/inventario/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .delete(tenantInventarioTable)
      .where(
        and(
          eq(tenantInventarioTable.id, params.data.id),
          eq(tenantInventarioTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning({ id: tenantInventarioTable.id });
    if (!row) {
      res.status(404).json({ error: "Item no encontrado" });
      return;
    }
    res.status(204).end();
  },
);

// ----------------- SERVICIOS / CATÁLOGO -----------------

const ServicioCreate = z.object({
  nombre: z.string().trim().min(1).max(160),
  descripcion: z.string().trim().max(2000).optional().nullable(),
  // tipo: 'servicio' (lavado, corte de pelo, consulta), 'producto' (insumo
  // vendible) o 'menu_item' (plato/bebida en restaurantes). Default 'servicio'.
  tipo: z.enum(["servicio", "producto", "menu_item"]).default("servicio"),
  categoria: z.string().trim().max(64).optional().nullable(),
  precio: z.number().min(0).default(0),
  moneda: z.string().trim().max(8).default("PEN"),
  duracionMinutos: z.number().int().min(0).max(24 * 60).optional().nullable(),
  activo: z.boolean().default(true),
});
const ServicioUpdate = ServicioCreate.partial();

router.get(
  "/tenant/servicios",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantServiciosTable)
      .where(eq(tenantServiciosTable.tenantId, ctx.tenant.id))
      .orderBy(asc(tenantServiciosTable.nombre));
    res.json({ items: rows });
  },
);

router.post(
  "/tenant/servicios",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = ServicioCreate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .insert(tenantServiciosTable)
      .values({
        tenantId: ctx.tenant.id,
        nombre: d.nombre,
        descripcion: d.descripcion ?? null,
        tipo: d.tipo ?? "servicio",
        categoria: d.categoria ?? null,
        precio: num(d.precio ?? 0),
        moneda: d.moneda ?? "PEN",
        duracionMinutos: d.duracionMinutos ?? null,
        activo: d.activo ?? true,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.patch(
  "/tenant/servicios/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const parsed = ServicioUpdate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.nombre !== undefined) patch.nombre = d.nombre;
    if (d.descripcion !== undefined) patch.descripcion = d.descripcion ?? null;
    if (d.categoria !== undefined) patch.categoria = d.categoria ?? null;
    if (d.precio !== undefined) patch.precio = num(d.precio);
    if (d.moneda !== undefined) patch.moneda = d.moneda;
    if (d.duracionMinutos !== undefined)
      patch.duracionMinutos = d.duracionMinutos ?? null;
    if (d.activo !== undefined) patch.activo = d.activo;
    if (d.tipo !== undefined) patch.tipo = d.tipo;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .update(tenantServiciosTable)
      .set(patch)
      .where(
        and(
          eq(tenantServiciosTable.id, params.data.id),
          eq(tenantServiciosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }
    res.json(row);
  },
);

router.delete(
  "/tenant/servicios/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .delete(tenantServiciosTable)
      .where(
        and(
          eq(tenantServiciosTable.id, params.data.id),
          eq(tenantServiciosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning({ id: tenantServiciosTable.id });
    if (!row) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }
    res.status(204).end();
  },
);

// ----------------- CLIENTES FINALES (CRM) -----------------

type ClienteRow = typeof tenantClientesFinalesTable.$inferSelect;

function decryptCliente(c: ClienteRow): Omit<ClienteRow, "telefonoHash"> {
  // No exponemos telefonoHash al frontend: es un índice interno de búsqueda.
  const { telefonoHash: _hash, ...rest } = c;
  return {
    ...rest,
    telefono: decryptField(c.telefono),
    notas: decryptField(c.notas),
  };
}

const ClienteCreate = z.object({
  nombre: z.string().trim().min(1).max(160),
  telefono: z.string().trim().max(32).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  documentoTipo: z.string().trim().max(16).optional().nullable(),
  documentoNumero: z.string().trim().max(32).optional().nullable(),
  notas: z.string().trim().max(2000).optional().nullable(),
});
const ClienteUpdate = ClienteCreate.partial();

router.get(
  "/tenant/clientes",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const sdb = getSupabaseDb();
    // El teléfono está cifrado, así que para buscar por número usamos el
    // hash determinístico (HMAC-SHA256 hex) del teléfono normalizado a sólo
    // dígitos. Si el query no parece un número, sólo busca en nombre/email/doc.
    const normalizedPhoneFromQuery = normalizePhone(q);
    const phoneHash = normalizedPhoneFromQuery
      ? searchHash(normalizedPhoneFromQuery)
      : null;
    const where = q
      ? and(
          eq(tenantClientesFinalesTable.tenantId, ctx.tenant.id),
          or(
            ilike(tenantClientesFinalesTable.nombre, `%${q}%`),
            ilike(tenantClientesFinalesTable.email, `%${q}%`),
            ilike(tenantClientesFinalesTable.documentoNumero, `%${q}%`),
            ...(phoneHash
              ? [eq(tenantClientesFinalesTable.telefonoHash, phoneHash)]
              : []),
          ),
        )
      : eq(tenantClientesFinalesTable.tenantId, ctx.tenant.id);
    const rows = await sdb
      .select()
      .from(tenantClientesFinalesTable)
      .where(where)
      .orderBy(asc(tenantClientesFinalesTable.nombre))
      .limit(500);

    // total_compras agregado: número de ingresos confirmados + monto acumulado
    // por cliente. Una sola query con GROUP BY mantiene la lista barata.
    const totales = await sdb
      .select({
        clienteFinalId: tenantFinanzasMovimientosTable.clienteFinalId,
        comprasCount: sql<number>`COUNT(*)`.as("compras_count"),
        comprasMonto: sql<string>`COALESCE(SUM(${tenantFinanzasMovimientosTable.monto}), 0)`.as(
          "compras_monto",
        ),
      })
      .from(tenantFinanzasMovimientosTable)
      .where(
        and(
          eq(tenantFinanzasMovimientosTable.tenantId, ctx.tenant.id),
          eq(tenantFinanzasMovimientosTable.tipo, "ingreso"),
        ),
      )
      .groupBy(tenantFinanzasMovimientosTable.clienteFinalId);
    const totalesById = new Map<
      string,
      { count: number; monto: string }
    >();
    for (const t of totales) {
      if (t.clienteFinalId) {
        totalesById.set(t.clienteFinalId, {
          count: Number(t.comprasCount ?? 0),
          monto: String(t.comprasMonto ?? "0"),
        });
      }
    }

    const items = rows.map((row) => {
      const base = decryptCliente(row);
      const tot = totalesById.get(row.id) ?? { count: 0, monto: "0" };
      return {
        ...base,
        comprasCount: tot.count,
        comprasMonto: tot.monto,
      };
    });
    res.json({ items });
  },
);

router.post(
  "/tenant/clientes",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = ClienteCreate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const sdb = getSupabaseDb();
    try {
      const [row] = await sdb
        .insert(tenantClientesFinalesTable)
        .values({
          tenantId: ctx.tenant.id,
          nombre: d.nombre,
          telefono: encryptField(normalizePhone(d.telefono) ?? null),
          telefonoHash: searchHash(normalizePhone(d.telefono) ?? null),
          email: d.email && d.email !== "" ? d.email : null,
          documentoTipo: d.documentoTipo ?? null,
          documentoNumero: d.documentoNumero ?? null,
          notas: encryptField(d.notas ?? null),
        })
        .returning();
      res.status(201).json(decryptCliente(row));
    } catch (err) {
      // 23505 = unique_violation. El índice único es por (tenant_id,
      // telefono_hash) — devolvemos 409 con copy en español PE en lugar de
      // un 500 con stack trace. Drizzle envuelve el pg error así que
      // chequeamos también `.cause.code`.
      const e = err as { code?: string; cause?: { code?: string } } | null;
      const code = e?.code ?? e?.cause?.code;
      if (code === "23505") {
        res.status(409).json({
          error: "Ya tienes un cliente registrado con ese número de teléfono.",
        });
        return;
      }
      throw err;
    }
  },
);

router.patch(
  "/tenant/clientes/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const parsed = ClienteUpdate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.nombre !== undefined) patch.nombre = d.nombre;
    if (d.telefono !== undefined) {
      const norm = normalizePhone(d.telefono);
      patch.telefono = encryptField(norm ?? null);
      patch.telefonoHash = searchHash(norm ?? null);
    }
    if (d.email !== undefined)
      patch.email = d.email && d.email !== "" ? d.email : null;
    if (d.documentoTipo !== undefined) patch.documentoTipo = d.documentoTipo ?? null;
    if (d.documentoNumero !== undefined)
      patch.documentoNumero = d.documentoNumero ?? null;
    if (d.notas !== undefined) patch.notas = encryptField(d.notas ?? null);
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .update(tenantClientesFinalesTable)
      .set(patch)
      .where(
        and(
          eq(tenantClientesFinalesTable.id, params.data.id),
          eq(tenantClientesFinalesTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.json(decryptCliente(row));
  },
);

router.delete(
  "/tenant/clientes/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .delete(tenantClientesFinalesTable)
      .where(
        and(
          eq(tenantClientesFinalesTable.id, params.data.id),
          eq(tenantClientesFinalesTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning({ id: tenantClientesFinalesTable.id });
    if (!row) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }
    res.status(204).end();
  },
);

// ----------------- EMPLEADOS -----------------

const EmpleadoCreate = z.object({
  nombre: z.string().trim().min(1).max(160),
  rol: z.string().trim().max(64).optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#?[0-9a-fA-F]{3,8}$/)
    .max(16)
    .optional(),
  activo: z.boolean().optional(),
});
const EmpleadoUpdate = EmpleadoCreate.partial();

router.get(
  "/tenant/empleados",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantEmpleadosTable)
      .where(eq(tenantEmpleadosTable.tenantId, ctx.tenant.id))
      .orderBy(asc(tenantEmpleadosTable.nombre));
    res.json({ items: rows });
  },
);

router.post(
  "/tenant/empleados",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = EmpleadoCreate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .insert(tenantEmpleadosTable)
      .values({
        tenantId: ctx.tenant.id,
        nombre: d.nombre,
        rol: d.rol ?? null,
        color: d.color ?? "#10b981",
        activo: d.activo ?? true,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.patch(
  "/tenant/empleados/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const parsed = EmpleadoUpdate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.nombre !== undefined) patch.nombre = d.nombre;
    if (d.rol !== undefined) patch.rol = d.rol ?? null;
    if (d.color !== undefined) patch.color = d.color;
    if (d.activo !== undefined) patch.activo = d.activo;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .update(tenantEmpleadosTable)
      .set(patch)
      .where(
        and(
          eq(tenantEmpleadosTable.id, params.data.id),
          eq(tenantEmpleadosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "Empleado no encontrado" });
      return;
    }
    res.json(row);
  },
);

router.delete(
  "/tenant/empleados/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .delete(tenantEmpleadosTable)
      .where(
        and(
          eq(tenantEmpleadosTable.id, params.data.id),
          eq(tenantEmpleadosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning({ id: tenantEmpleadosTable.id });
    if (!row) {
      res.status(404).json({ error: "Empleado no encontrado" });
      return;
    }
    res.status(204).end();
  },
);

// ----------------- AGENDA / CITAS -----------------

// Estados normalizados: pendiente (default al crear) → confirmado → en_curso →
// completado. "cancelado" cuando el cliente cancela; "no_asistio" cuando no se
// presentó.
const ESTADOS_CITA = [
  "pendiente",
  "confirmado",
  "en_curso",
  "completado",
  "cancelado",
  "no_asistio",
] as const;

const CitaCreate = z.object({
  clienteFinalId: z.string().uuid().optional().nullable(),
  servicioId: z.string().uuid().optional().nullable(),
  empleadoId: z.string().uuid().optional().nullable(),
  titulo: z.string().trim().max(200).optional().nullable(),
  fechaInicio: z.string().datetime({ offset: true }),
  fechaFin: z.string().datetime({ offset: true }).optional().nullable(),
  estado: z.enum(ESTADOS_CITA).default("pendiente"),
  notas: z.string().trim().max(2000).optional().nullable(),
});
const CitaUpdate = CitaCreate.partial();

router.get(
  "/tenant/citas",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const desde =
      typeof req.query.desde === "string" ? new Date(req.query.desde) : null;
    const hasta =
      typeof req.query.hasta === "string" ? new Date(req.query.hasta) : null;
    const filters = [eq(tenantCitasServiciosTable.tenantId, ctx.tenant.id)];
    if (desde && !Number.isNaN(desde.getTime()))
      filters.push(gte(tenantCitasServiciosTable.fechaInicio, desde));
    if (hasta && !Number.isNaN(hasta.getTime()))
      filters.push(lte(tenantCitasServiciosTable.fechaInicio, hasta));
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantCitasServiciosTable)
      .where(and(...filters))
      .orderBy(asc(tenantCitasServiciosTable.fechaInicio))
      .limit(500);
    res.json({ items: rows });
  },
);

router.post(
  "/tenant/citas",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = CitaCreate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .insert(tenantCitasServiciosTable)
      .values({
        tenantId: ctx.tenant.id,
        clienteFinalId: d.clienteFinalId ?? null,
        servicioId: d.servicioId ?? null,
        empleadoId: d.empleadoId ?? null,
        titulo: d.titulo ?? null,
        fechaInicio: new Date(d.fechaInicio),
        fechaFin: d.fechaFin ? new Date(d.fechaFin) : null,
        estado: d.estado,
        notas: d.notas ?? null,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.patch(
  "/tenant/citas/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const parsed = CitaUpdate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.clienteFinalId !== undefined)
      patch.clienteFinalId = d.clienteFinalId ?? null;
    if (d.servicioId !== undefined) patch.servicioId = d.servicioId ?? null;
    if (d.empleadoId !== undefined) patch.empleadoId = d.empleadoId ?? null;
    if (d.titulo !== undefined) patch.titulo = d.titulo ?? null;
    if (d.fechaInicio !== undefined) patch.fechaInicio = new Date(d.fechaInicio);
    if (d.fechaFin !== undefined)
      patch.fechaFin = d.fechaFin ? new Date(d.fechaFin) : null;
    if (d.estado !== undefined) patch.estado = d.estado;
    if (d.notas !== undefined) patch.notas = d.notas ?? null;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .update(tenantCitasServiciosTable)
      .set(patch)
      .where(
        and(
          eq(tenantCitasServiciosTable.id, params.data.id),
          eq(tenantCitasServiciosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "Cita no encontrada" });
      return;
    }
    // Auto-outbound al cliente cuando la cita transiciona a completado /
    // confirmado / cancelado. Non-blocking, errores se loguean.
    if (d.estado === "completado") {
      void notifyCliente(
        ctx.tenant.id,
        row.clienteFinalId,
        `Tu servicio fue completado. Gracias por confiar en ${ctx.tenant.nombreEmpresa}.`,
      );
    } else if (d.estado === "confirmado") {
      void notifyCliente(
        ctx.tenant.id,
        row.clienteFinalId,
        `Tu reserva fue confirmada. Te esperamos en ${ctx.tenant.nombreEmpresa}.`,
      );
    } else if (d.estado === "cancelado") {
      void notifyCliente(
        ctx.tenant.id,
        row.clienteFinalId,
        `Tu reserva fue cancelada. Si fue por error, escríbenos para reagendar.`,
      );
    }
    res.json(row);
  },
);

router.delete(
  "/tenant/citas/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .delete(tenantCitasServiciosTable)
      .where(
        and(
          eq(tenantCitasServiciosTable.id, params.data.id),
          eq(tenantCitasServiciosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning({ id: tenantCitasServiciosTable.id });
    if (!row) {
      res.status(404).json({ error: "Cita no encontrada" });
      return;
    }
    res.status(204).end();
  },
);

// ----------------- FINANZAS -----------------

const TIPOS_MOV = ["ingreso", "egreso"] as const;
const CANALES_MOV = [
  "yape",
  "plin",
  "efectivo",
  "transferencia",
  "tarjeta",
  "otro",
] as const;

const FinanzaCreate = z.object({
  tipo: z.enum(TIPOS_MOV),
  concepto: z.string().trim().max(200).optional().nullable(),
  monto: z.number().positive(),
  moneda: z.string().trim().max(8).default("PEN"),
  metodoPago: z.enum(CANALES_MOV).default("efectivo"),
  estado: z.string().trim().max(16).default("confirmado"),
  fecha: z.string().datetime({ offset: true }).optional(),
  clienteFinalId: z.string().uuid().optional().nullable(),
  citaId: z.string().uuid().optional().nullable(),
  // Datos extra capturados por el wizard rubro-adaptativo (placa, mesa,
  // diagnóstico, etc.). Se guardan tal cual en metadata.rubro para
  // poder reportarlos sin acoplar el schema a cada vertical.
  rubroData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

router.get(
  "/tenant/finanzas",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const tipo = typeof req.query.tipo === "string" ? req.query.tipo : null;
    const canal = typeof req.query.canal === "string" ? req.query.canal : null;
    const desde =
      typeof req.query.desde === "string" ? new Date(req.query.desde) : null;
    const hasta =
      typeof req.query.hasta === "string" ? new Date(req.query.hasta) : null;
    const filters = [
      eq(tenantFinanzasMovimientosTable.tenantId, ctx.tenant.id),
    ];
    if (tipo === "ingreso" || tipo === "egreso")
      filters.push(eq(tenantFinanzasMovimientosTable.tipo, tipo));
    if (canal && (CANALES_MOV as readonly string[]).includes(canal))
      filters.push(eq(tenantFinanzasMovimientosTable.metodoPago, canal));
    if (desde && !Number.isNaN(desde.getTime()))
      filters.push(gte(tenantFinanzasMovimientosTable.fecha, desde));
    if (hasta && !Number.isNaN(hasta.getTime()))
      filters.push(lte(tenantFinanzasMovimientosTable.fecha, hasta));
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantFinanzasMovimientosTable)
      .where(and(...filters))
      .orderBy(desc(tenantFinanzasMovimientosTable.fecha))
      .limit(500);
    res.json({ items: rows });
  },
);

router.post(
  "/tenant/finanzas",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = FinanzaCreate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const fecha = d.fecha ? new Date(d.fecha) : new Date();
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .insert(tenantFinanzasMovimientosTable)
      .values({
        tenantId: ctx.tenant.id,
        tipo: d.tipo,
        concepto: d.concepto ?? null,
        monto: num(d.monto),
        moneda: d.moneda ?? "PEN",
        metodoPago: d.metodoPago ?? "efectivo",
        estado: d.estado ?? "confirmado",
        fecha,
        clienteFinalId: d.clienteFinalId ?? null,
        metadata: {
          ...(d.citaId ? { cita_id: d.citaId } : {}),
          ...(d.rubroData && Object.keys(d.rubroData).length > 0
            ? { rubro: d.rubroData }
            : {}),
        },
      })
      .returning();
    res.status(201).json(row);
  },
);

// Update parcial de un movimiento ya registrado: corregir monto, concepto,
// canal o estado. No permitimos cambiar el tipo (ingreso/egreso) ni el
// tenant_id; eso se hace borrando y volviendo a crear.
const FinanzaUpdate = z.object({
  concepto: z.string().trim().max(200).optional().nullable(),
  monto: z.number().positive().optional(),
  metodoPago: z.enum(CANALES_MOV).optional(),
  estado: z.string().trim().max(16).optional(),
  fecha: z.string().datetime({ offset: true }).optional(),
  clienteFinalId: z.string().uuid().optional().nullable(),
  rubroData: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

router.patch(
  "/tenant/finanzas/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const parsed = FinanzaUpdate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const sdb = getSupabaseDb();
    const [existing] = await sdb
      .select()
      .from(tenantFinanzasMovimientosTable)
      .where(
        and(
          eq(tenantFinanzasMovimientosTable.id, params.data.id),
          eq(tenantFinanzasMovimientosTable.tenantId, ctx.tenant.id),
        ),
      )
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Movimiento no encontrado" });
      return;
    }
    const patch: Record<string, unknown> = {};
    if (d.concepto !== undefined) patch.concepto = d.concepto;
    if (d.monto !== undefined) patch.monto = num(d.monto);
    if (d.metodoPago !== undefined) patch.metodoPago = d.metodoPago;
    if (d.estado !== undefined) patch.estado = d.estado;
    if (d.fecha !== undefined) patch.fecha = new Date(d.fecha);
    if (d.clienteFinalId !== undefined) patch.clienteFinalId = d.clienteFinalId;
    if (d.rubroData !== undefined) {
      const prevMeta = (existing.metadata ?? {}) as Record<string, unknown>;
      patch.metadata = { ...prevMeta, rubro: d.rubroData };
    }
    if (Object.keys(patch).length === 0) {
      res.json(existing);
      return;
    }
    const [row] = await sdb
      .update(tenantFinanzasMovimientosTable)
      .set(patch)
      .where(
        and(
          eq(tenantFinanzasMovimientosTable.id, params.data.id),
          eq(tenantFinanzasMovimientosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    res.json(row);
  },
);

router.delete(
  "/tenant/finanzas/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .delete(tenantFinanzasMovimientosTable)
      .where(
        and(
          eq(tenantFinanzasMovimientosTable.id, params.data.id),
          eq(tenantFinanzasMovimientosTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning({ id: tenantFinanzasMovimientosTable.id });
    if (!row) {
      res.status(404).json({ error: "Movimiento no encontrado" });
      return;
    }
    res.status(204).end();
  },
);

router.get(
  "/tenant/finanzas/summary",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const sdb = getSupabaseDb();
    const now = new Date();
    const startDay = new Date(now);
    startDay.setHours(0, 0, 0, 0);
    const startWeek = new Date(startDay);
    startWeek.setDate(startWeek.getDate() - ((startWeek.getDay() + 6) % 7));
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tenantFilter = eq(
      tenantFinanzasMovimientosTable.tenantId,
      ctx.tenant.id,
    );

    const [agg] = await sdb
      .select({
        ingresoDia: sql<string | null>`coalesce(sum(${tenantFinanzasMovimientosTable.monto}) filter (where ${tenantFinanzasMovimientosTable.tipo} = 'ingreso' and ${tenantFinanzasMovimientosTable.fecha} >= ${startDay.toISOString()}), 0)`,
        egresoDia: sql<string | null>`coalesce(sum(${tenantFinanzasMovimientosTable.monto}) filter (where ${tenantFinanzasMovimientosTable.tipo} = 'egreso' and ${tenantFinanzasMovimientosTable.fecha} >= ${startDay.toISOString()}), 0)`,
        ingresoSemana: sql<string | null>`coalesce(sum(${tenantFinanzasMovimientosTable.monto}) filter (where ${tenantFinanzasMovimientosTable.tipo} = 'ingreso' and ${tenantFinanzasMovimientosTable.fecha} >= ${startWeek.toISOString()}), 0)`,
        egresoSemana: sql<string | null>`coalesce(sum(${tenantFinanzasMovimientosTable.monto}) filter (where ${tenantFinanzasMovimientosTable.tipo} = 'egreso' and ${tenantFinanzasMovimientosTable.fecha} >= ${startWeek.toISOString()}), 0)`,
        ingresoMes: sql<string | null>`coalesce(sum(${tenantFinanzasMovimientosTable.monto}) filter (where ${tenantFinanzasMovimientosTable.tipo} = 'ingreso' and ${tenantFinanzasMovimientosTable.fecha} >= ${startMonth.toISOString()}), 0)`,
        egresoMes: sql<string | null>`coalesce(sum(${tenantFinanzasMovimientosTable.monto}) filter (where ${tenantFinanzasMovimientosTable.tipo} = 'egreso' and ${tenantFinanzasMovimientosTable.fecha} >= ${startMonth.toISOString()}), 0)`,
      })
      .from(tenantFinanzasMovimientosTable)
      .where(tenantFilter);

    const canalRows = await sdb
      .select({
        canal: tenantFinanzasMovimientosTable.metodoPago,
        total: sql<string | null>`coalesce(sum(${tenantFinanzasMovimientosTable.monto}), 0)`,
      })
      .from(tenantFinanzasMovimientosTable)
      .where(
        and(
          tenantFilter,
          eq(tenantFinanzasMovimientosTable.tipo, "ingreso"),
          gte(tenantFinanzasMovimientosTable.fecha, startMonth),
        ),
      )
      .groupBy(tenantFinanzasMovimientosTable.metodoPago);

    const canalesMes: Record<string, number> = {};
    for (const c of CANALES_MOV) canalesMes[c] = 0;
    for (const r of canalRows) {
      const k = r.canal ?? "otro";
      canalesMes[k] = Number(r.total ?? 0);
    }

    const ingresoDia = Number(agg?.ingresoDia ?? 0);
    const egresoDia = Number(agg?.egresoDia ?? 0);
    const ingresoSemana = Number(agg?.ingresoSemana ?? 0);
    const egresoSemana = Number(agg?.egresoSemana ?? 0);
    const ingresoMes = Number(agg?.ingresoMes ?? 0);
    const egresoMes = Number(agg?.egresoMes ?? 0);

    res.json({
      dia: {
        ingreso: ingresoDia,
        egreso: egresoDia,
        balance: +(ingresoDia - egresoDia).toFixed(2),
      },
      semana: {
        ingreso: ingresoSemana,
        egreso: egresoSemana,
        balance: +(ingresoSemana - egresoSemana).toFixed(2),
      },
      mes: {
        ingreso: ingresoMes,
        egreso: egresoMes,
        balance: +(ingresoMes - egresoMes).toFixed(2),
      },
      canalesMes,
      moneda: "PEN",
    });
  },
);

// ----------------- ALERTAS -----------------

router.get(
  "/tenant/alertas",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const sdb = getSupabaseDb();
    const onlyOpen = req.query.leida === "false";
    const filters = [eq(tenantAlertasTable.tenantId, ctx.tenant.id)];
    if (onlyOpen) filters.push(eq(tenantAlertasTable.leida, false));
    const rows = await sdb
      .select()
      .from(tenantAlertasTable)
      .where(and(...filters))
      .orderBy(desc(tenantAlertasTable.createdAt))
      .limit(100);
    res.json({ items: rows });
  },
);

router.post(
  "/tenant/alertas/marcar-todas-leidas",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const sdb = getSupabaseDb();
    const rows = await sdb
      .update(tenantAlertasTable)
      .set({ leida: true, resueltaEn: new Date() })
      .where(
        and(
          eq(tenantAlertasTable.tenantId, ctx.tenant.id),
          eq(tenantAlertasTable.leida, false),
        ),
      )
      .returning({ id: tenantAlertasTable.id });
    res.json({ marcadas: rows.length });
  },
);

router.patch(
  "/tenant/alertas/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const body = z
      .object({ leida: z.boolean().optional() })
      .safeParse(req.body);
    if (!body.success) return badRequest(res, body.error);
    const patch: Record<string, unknown> = {};
    if (body.data.leida !== undefined) {
      patch.leida = body.data.leida;
      patch.resueltaEn = body.data.leida ? new Date() : null;
    }
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .update(tenantAlertasTable)
      .set(patch)
      .where(
        and(
          eq(tenantAlertasTable.id, params.data.id),
          eq(tenantAlertasTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "Alerta no encontrada" });
      return;
    }
    res.json(row);
  },
);

// ----------------- FAQ OVERRIDES -----------------

const FaqCreate = z.object({
  pregunta: z.string().trim().min(3).max(500),
  respuesta: z.string().trim().min(3).max(2000),
  categoria: z.string().trim().max(64).optional().nullable(),
  orden: z.number().int().min(0).default(0),
  activo: z.boolean().default(true),
});
const FaqUpdate = FaqCreate.partial();

router.get(
  "/tenant/faq-overrides",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantFaqOverridesTable)
      .where(eq(tenantFaqOverridesTable.tenantId, ctx.tenant.id))
      .orderBy(asc(tenantFaqOverridesTable.orden));
    res.json({ items: rows });
  },
);

router.post(
  "/tenant/faq-overrides",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = FaqCreate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .insert(tenantFaqOverridesTable)
      .values({
        tenantId: ctx.tenant.id,
        pregunta: d.pregunta,
        respuesta: d.respuesta,
        categoria: d.categoria ?? null,
        orden: d.orden ?? 0,
        activo: d.activo ?? true,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.patch(
  "/tenant/faq-overrides/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const parsed = FaqUpdate.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.pregunta !== undefined) patch.pregunta = d.pregunta;
    if (d.respuesta !== undefined) patch.respuesta = d.respuesta;
    if (d.categoria !== undefined) patch.categoria = d.categoria ?? null;
    if (d.orden !== undefined) patch.orden = d.orden;
    if (d.activo !== undefined) patch.activo = d.activo;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Sin cambios" });
      return;
    }
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .update(tenantFaqOverridesTable)
      .set(patch)
      .where(
        and(
          eq(tenantFaqOverridesTable.id, params.data.id),
          eq(tenantFaqOverridesTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning();
    if (!row) {
      res.status(404).json({ error: "FAQ no encontrada" });
      return;
    }
    res.json(row);
  },
);

router.delete(
  "/tenant/faq-overrides/:id",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const params = UuidParam.safeParse(req.params);
    if (!params.success) return badRequest(res, params.error);
    const sdb = getSupabaseDb();
    const [row] = await sdb
      .delete(tenantFaqOverridesTable)
      .where(
        and(
          eq(tenantFaqOverridesTable.id, params.data.id),
          eq(tenantFaqOverridesTable.tenantId, ctx.tenant.id),
        ),
      )
      .returning({ id: tenantFaqOverridesTable.id });
    if (!row) {
      res.status(404).json({ error: "FAQ no encontrada" });
      return;
    }
    res.status(204).end();
  },
);

// ----------------- PAGOS QR YAPE / PLIN -----------------

const METODOS_QR = ["yape", "plin"] as const;

const PagoQrGenerar = z.object({
  metodo: z.enum(METODOS_QR),
  monto: z.number().positive().max(99999),
  concepto: z.string().trim().max(200).optional().nullable(),
  clienteFinalId: z.string().uuid().optional().nullable(),
  citaId: z.string().uuid().optional().nullable(),
  // Datos extra del wizard rubro-adaptativo (placa, mesa, etc.).
  rubroData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const PagoQrConfirmar = z.object({
  pagoId: z.string().uuid(),
});

function buildDeeplink(args: {
  metodo: "yape" | "plin";
  destino: string;
  monto: number;
  concepto: string | null;
}): string {
  const params = new URLSearchParams({
    to: args.destino,
    amount: args.monto.toFixed(2),
  });
  if (args.concepto) params.set("note", args.concepto.slice(0, 80));
  return `${args.metodo}://pay?${params.toString()}`;
}

router.post(
  "/tenant/pagos-qr/generar",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = PagoQrGenerar.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const d = parsed.data;

    const meta = (ctx.tenant.metadata ?? {}) as Record<string, unknown>;
    const yapeNumero =
      typeof meta.yape_numero === "string" ? meta.yape_numero : null;
    const plinNumero =
      typeof meta.plin_numero === "string" ? meta.plin_numero : null;
    const destino =
      d.metodo === "yape" ? yapeNumero ?? plinNumero : plinNumero ?? yapeNumero;
    if (!destino) {
      res.status(400).json({
        error:
          "Configura tu número de Yape o Plin en el onboarding antes de cobrar.",
      });
      return;
    }

    const deeplink = buildDeeplink({
      metodo: d.metodo,
      destino,
      monto: d.monto,
      concepto: d.concepto ?? null,
    });
    let qrDataUrl: string;
    try {
      qrDataUrl = await QRCode.toDataURL(deeplink, {
        margin: 1,
        width: 320,
        errorCorrectionLevel: "M",
      });
    } catch {
      res.status(500).json({ error: "No se pudo generar el código QR." });
      return;
    }

    const sdb = getSupabaseDb();
    const [row] = await sdb
      .insert(tenantPagosQrTable)
      .values({
        tenantId: ctx.tenant.id,
        clienteFinalId: d.clienteFinalId ?? null,
        metodo: d.metodo,
        monto: num(d.monto),
        moneda: "PEN",
        concepto: d.concepto ?? null,
        qrDataUrl,
        estado: "pendiente",
        metadata: {
          deeplink,
          destino,
          cita_id: d.citaId ?? null,
          ...(d.rubroData && Object.keys(d.rubroData).length > 0
            ? { rubro: d.rubroData }
            : {}),
        },
      })
      .returning();
    res.status(201).json(row);
  },
);

router.post(
  "/tenant/pagos-qr/confirmar",
  writeLimiter,
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const parsed = PagoQrConfirmar.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const sdb = getSupabaseDb();
    const now = new Date();

    // Idempotente y race-safe: el UPDATE condicional sólo prospera la primera vez
    // (filtra por tenant_id + id + estado='pendiente'). Si otra request gana la
    // carrera o el pago ya está confirmado, devolvemos el estado existente sin
    // crear un movimiento duplicado.
    const [updated] = await sdb
      .update(tenantPagosQrTable)
      .set({ estado: "confirmado", confirmadoEn: now })
      .where(
        and(
          eq(tenantPagosQrTable.id, parsed.data.pagoId),
          eq(tenantPagosQrTable.tenantId, ctx.tenant.id),
          eq(tenantPagosQrTable.estado, "pendiente"),
        ),
      )
      .returning();

    if (!updated) {
      // O no existe (404) o ya estaba confirmado/anulado (devolvemos el estado actual)
      const [existing] = await sdb
        .select()
        .from(tenantPagosQrTable)
        .where(
          and(
            eq(tenantPagosQrTable.id, parsed.data.pagoId),
            eq(tenantPagosQrTable.tenantId, ctx.tenant.id),
          ),
        )
        .limit(1);
      if (!existing) {
        res.status(404).json({ error: "Pago no encontrado" });
        return;
      }
      // Buscar movimiento existente vinculado a este pago (idempotencia)
      const [existingMov] = await sdb
        .select()
        .from(tenantFinanzasMovimientosTable)
        .where(
          and(
            eq(tenantFinanzasMovimientosTable.tenantId, ctx.tenant.id),
            sql`(${tenantFinanzasMovimientosTable.metadata}->>'pago_qr_id') = ${existing.id}`,
          ),
        )
        .limit(1);
      res.json({ pago: existing, movimiento: existingMov ?? null, alreadyConfirmed: true });
      return;
    }

    const meta = (updated.metadata ?? {}) as Record<string, unknown>;
    const citaId = typeof meta.cita_id === "string" ? meta.cita_id : null;

    const [movimiento] = await sdb
      .insert(tenantFinanzasMovimientosTable)
      .values({
        tenantId: ctx.tenant.id,
        clienteFinalId: updated.clienteFinalId ?? null,
        tipo: "ingreso",
        concepto: updated.concepto ?? `Pago ${updated.metodo.toUpperCase()}`,
        monto: updated.monto,
        moneda: updated.moneda,
        metodoPago: updated.metodo,
        estado: "confirmado",
        fecha: now,
        metadata: {
          pago_qr_id: updated.id,
          cita_id: citaId,
        },
      })
      .returning();

    if (citaId) {
      const [citaRow] = await sdb
        .update(tenantCitasServiciosTable)
        .set({ estado: "completado" })
        .where(
          and(
            eq(tenantCitasServiciosTable.id, citaId),
            eq(tenantCitasServiciosTable.tenantId, ctx.tenant.id),
          ),
        )
        .returning();
      if (citaRow) {
        void notifyCliente(
          ctx.tenant.id,
          citaRow.clienteFinalId,
          `Recibimos tu pago. ¡Gracias! Tu servicio queda confirmado.`,
        );
      }
    } else if (updated.clienteFinalId) {
      void notifyCliente(
        ctx.tenant.id,
        updated.clienteFinalId,
        `Recibimos tu pago. ¡Gracias!`,
      );
    }

    res.json({ pago: updated, movimiento });
  },
);

router.get(
  "/tenant/pagos-qr",
  requirePortalAuth,
  requirePortalClient,
  gateSupabase,
  async (req, res): Promise<void> => {
    const ctx = await requireTenantCtx(req, res);
    if (!ctx) return;
    const estado = typeof req.query.estado === "string" ? req.query.estado : null;
    const filters = [eq(tenantPagosQrTable.tenantId, ctx.tenant.id)];
    if (estado === "pendiente" || estado === "confirmado" || estado === "anulado")
      filters.push(eq(tenantPagosQrTable.estado, estado));
    const sdb = getSupabaseDb();
    const rows = await sdb
      .select()
      .from(tenantPagosQrTable)
      .where(and(...filters))
      .orderBy(desc(tenantPagosQrTable.createdAt))
      .limit(200);
    res.json({ items: rows });
  },
);

export default router;
