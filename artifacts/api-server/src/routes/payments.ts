import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  paymentsTable,
  financesTable,
  clientsTable,
  licensesTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { createCulqiCharge, verifyCulqiSignature } from "../lib/culqi";
import { emitirComprobante } from "../lib/sunat";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function serialize(p: typeof paymentsTable.$inferSelect) {
  return {
    ...p,
    amount: Number(p.amount),
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/payments", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const filters = [];
  if (typeof req.query.status === "string") {
    filters.push(eq(paymentsTable.status, req.query.status));
  }
  if (typeof req.query.clientId === "string") {
    const id = Number(req.query.clientId);
    if (Number.isInteger(id)) filters.push(eq(paymentsTable.clientId, id));
  }
  const rows = await db
    .select()
    .from(paymentsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(paymentsTable.createdAt));
  res.json(rows.map(serialize));
});

router.post("/payments", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "amount debe ser positivo" });
    return;
  }
  const status = "pendiente";
  const [row] = await db
    .insert(paymentsTable)
    .values({
      clientId: typeof body.clientId === "number" ? body.clientId : null,
      licenseId: typeof body.licenseId === "number" ? body.licenseId : null,
      amount: amount.toFixed(2),
      currency: typeof body.currency === "string" ? body.currency : "PEN",
      method: typeof body.method === "string" ? body.method : "manual",
      status,
      description:
        typeof body.description === "string" ? body.description : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      paidAt: status === "exitoso" ? new Date() : null,
    })
    .returning();

  if (status === "exitoso") {
    await db.insert(financesTable).values({
      type: "ingreso",
      amount: amount.toFixed(2),
      currency: row.currency,
      category: "pagos",
      description: row.description ?? `Pago manual #${row.id}`,
      clientId: row.clientId,
      paymentId: row.id,
      date: new Date(),
    });
  }

  res.status(201).json(serialize(row));
});

router.post("/payments/culqi/charge", requireAuth, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "amount debe ser positivo" });
    return;
  }
  const currency = typeof body.currency === "string" ? body.currency : "PEN";
  const description =
    typeof body.description === "string"
      ? body.description
      : "Cobro AXYNTRAX";
  const email =
    typeof body.email === "string" && body.email.length > 3
      ? body.email
      : "no-reply@axyntrax-automation.net";
  const culqi = await createCulqiCharge({
    amountCents: Math.round(amount * 100),
    currency,
    email,
    description,
    token: typeof body.culqiToken === "string" ? body.culqiToken : null,
  });

  const [row] = await db
    .insert(paymentsTable)
    .values({
      clientId: typeof body.clientId === "number" ? body.clientId : null,
      licenseId: typeof body.licenseId === "number" ? body.licenseId : null,
      amount: amount.toFixed(2),
      currency,
      method: culqi.stub ? "culqi-stub" : "culqi",
      status: culqi.status,
      externalId: culqi.externalId || null,
      description,
      notes: culqi.error ?? null,
      paidAt: culqi.status === "exitoso" ? new Date() : null,
    })
    .returning();

  if (culqi.status === "exitoso") {
    await db.insert(financesTable).values({
      type: "ingreso",
      amount: amount.toFixed(2),
      currency,
      category: "culqi",
      description,
      clientId: row.clientId,
      paymentId: row.id,
      date: new Date(),
    }).onConflictDoNothing();
  }

  if (!culqi.ok) {
    res.status(402).json({ ...serialize(row), error: culqi.error });
    return;
  }
  res.status(201).json(serialize(row));
});

router.post("/webhooks/culqi", async (req, res): Promise<void> => {
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
  const signature = req.headers["x-culqi-signature"] as string | undefined;
  if (!verifyCulqiSignature(rawBody?.toString("utf8") ?? "", signature)) {
    logger.warn({ signature }, "Webhook Culqi rechazado: firma inválida");
    res.status(401).json({ error: "Firma de webhook inválida" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const evento = typeof body.event === "string" ? body.event : "";
  const data = body.data as Record<string, unknown> | undefined;
  const externalId = data && typeof data.id === "string" ? data.id : null;
  if (!externalId) {
    res.status(400).json({ error: "evento sin id" });
    return;
  }
  const newStatus =
    evento === "charge.succeeded" || evento === "charge.creation.succeeded"
      ? "exitoso"
      : evento === "charge.failed"
        ? "fallido"
        : evento === "refund.creation.succeeded"
          ? "reembolsado"
          : null;
  if (!newStatus) {
    res.status(202).json({ ignored: true });
    return;
  }

  const [existing] = await db
    .select({ id: paymentsTable.id, status: paymentsTable.status })
    .from(paymentsTable)
    .where(eq(paymentsTable.externalId, externalId))
    .limit(1);

  const wasAlreadyExitoso = existing?.status === "exitoso";

  const [updated] = await db
    .update(paymentsTable)
    .set({
      status: newStatus,
      paidAt: newStatus === "exitoso" ? new Date() : undefined,
    })
    .where(eq(paymentsTable.externalId, externalId))
    .returning();

  if (updated && newStatus === "exitoso" && !wasAlreadyExitoso) {
    await db.insert(financesTable).values({
      type: "ingreso",
      amount: updated.amount,
      currency: updated.currency,
      category: "culqi-webhook",
      description: updated.description ?? `Cobro Culqi ${externalId}`,
      clientId: updated.clientId,
      paymentId: updated.id,
      date: new Date(),
    }).onConflictDoNothing();
  }
  logger.info({ evento, externalId, newStatus, wasAlreadyExitoso }, "Webhook Culqi procesado");
  res.json({ ok: true });
});

router.post(
  "/payments/:id/sunat-comprobante",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const [pago] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, id));
    if (!pago) {
      res.status(404).json({ error: "Pago no encontrado" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const tipo = body.tipo === "factura" ? "factura" : "boleta";
    const cliente = pago.clientId
      ? (
          await db
            .select()
            .from(clientsTable)
            .where(eq(clientsTable.id, pago.clientId))
        )[0]
      : null;
    const licencia = pago.licenseId
      ? (
          await db
            .select()
            .from(licensesTable)
            .where(eq(licensesTable.id, pago.licenseId))
        )[0]
      : null;

    const serie = tipo === "factura" ? "F001" : "B001";
    const correlativo = pago.id;
    const moneda = pago.currency;
    const importe = Number(pago.amount);
    const ivaIncluido = +(importe / 1.18).toFixed(2);

    const result = await emitirComprobante({
      tipo,
      serie,
      correlativo,
      emisor: {
        ruc: process.env.SUNAT_RUC ?? "20000000001",
        razonSocial: "AXYNTRAX AUTOMATION",
        direccion: "Arequipa, Perú",
      },
      receptor: {
        tipoDoc: tipo === "factura" ? "6" : "1",
        numDoc:
          (typeof body.rucCliente === "string" && body.rucCliente) ||
          (cliente?.email ?? "00000000"),
        razonSocial:
          (typeof body.razonSocial === "string" && body.razonSocial) ||
          cliente?.name ||
          "Consumidor Final",
      },
      items: [
        {
          descripcion:
            pago.description ??
            (licencia ? `Licencia ${licencia.type}` : "Servicio AXYNTRAX"),
          cantidad: 1,
          precioUnitario: ivaIncluido,
        },
      ],
      moneda,
      fechaEmision: pago.paidAt ?? pago.createdAt,
    });

    res.json({
      serie,
      correlativo,
      tipo,
      xml: result.xml,
      sentToSunat: result.sentToSunat,
      sunatNote: result.note,
    });
  },
);

export default router;
