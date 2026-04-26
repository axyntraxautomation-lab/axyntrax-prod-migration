import { Router, type IRouter } from "express";
import { eq, desc, and, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  quotesTable,
  quoteItemsTable,
  modulesCatalogTable,
  clientsTable,
  clientModulesTable,
} from "@workspace/db";
import {
  requirePortalAuth,
  requirePortalClient,
  requirePortalAdmin,
} from "../lib/auth";
import { audit } from "../lib/audit";
import { renderQuotePdf } from "../lib/pdf";
import { sendQuoteEmail } from "../lib/quote-mailer";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CreateQuoteBody = z.object({
  moduleIds: z.array(z.number().int().positive()).min(1).max(20),
  notes: z.string().max(500).optional(),
});

const IGV_RATE = 0.18;
const VALID_DAYS = 7;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

router.post(
  "/portal/quotes",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") return;
    const parsed = CreateQuoteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const clientId = req.portal.sub;
    const { moduleIds, notes } = parsed.data;

    const mods = await db
      .select()
      .from(modulesCatalogTable)
      .where(
        and(
          inArray(modulesCatalogTable.id, moduleIds),
          eq(modulesCatalogTable.active, 1),
        ),
      );
    if (mods.length === 0) {
      res.status(400).json({ error: "No se encontraron módulos válidos" });
      return;
    }

    const paid = mods.filter((m) => Number(m.monthlyPrice) > 0);
    if (paid.length === 0) {
      res
        .status(400)
        .json({ error: "Los módulos seleccionados son demos gratuitas" });
      return;
    }

    const currencies = new Set(paid.map((m) => m.currency));
    if (currencies.size > 1) {
      res.status(400).json({
        error:
          "No se puede cotizar módulos de monedas distintas en una sola cotización. Generá una cotización por moneda.",
        currencies: Array.from(currencies),
      });
      return;
    }
    const currency = paid[0].currency;
    let subtotal = 0;
    const items = paid.map((m) => {
      const unitPrice = Number(m.monthlyPrice);
      const lineTotal = round2(unitPrice * 1);
      subtotal += lineTotal;
      return {
        moduleId: m.id,
        moduleName: m.name,
        qty: 1,
        unitPrice,
        lineTotal,
      };
    });
    subtotal = round2(subtotal);
    const igv = round2(subtotal * IGV_RATE);
    const total = round2(subtotal + igv);
    const validUntil = new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000);

    const [client] = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.id, clientId));
    if (!client) {
      res.status(404).json({ error: "Cliente no encontrado" });
      return;
    }

    const created = await db.transaction(async (tx) => {
      const [q] = await tx
        .insert(quotesTable)
        .values({
          clientId,
          status: "enviada",
          currency,
          subtotal: subtotal.toFixed(2),
          igv: igv.toFixed(2),
          total: total.toFixed(2),
          validUntil,
          notes: notes ?? null,
        })
        .returning();
      await tx.insert(quoteItemsTable).values(
        items.map((it) => ({
          quoteId: q.id,
          moduleId: it.moduleId,
          moduleName: it.moduleName,
          qty: it.qty,
          unitPrice: it.unitPrice.toFixed(2),
          lineTotal: it.lineTotal.toFixed(2),
        })),
      );
      return q;
    });

    // Render PDF + try sending email (best-effort)
    let emailSent = false;
    try {
      const pdf = await renderQuotePdf({
        quoteId: created.id,
        createdAt: created.createdAt,
        validUntil,
        client: {
          name: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
            client.name ||
            client.email ||
            "Cliente",
          email: client.email ?? "",
          phone: client.phone ?? null,
        },
        items: items.map((it) => ({
          name: it.moduleName,
          qty: it.qty,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
        })),
        currency,
        subtotal,
        igv,
        total,
      });

      if (client.email) {
        const r = await sendQuoteEmail({
          to: client.email,
          subject: `Cotización AXYNTRAX N° ${String(created.id).padStart(6, "0")}`,
          bodyText: [
            `Hola ${client.firstName ?? "cliente"},`,
            "",
            "Adjunto te enviamos la cotización solicitada de los módulos AXYNTRAX.",
            `Total mensual: ${currency} ${total.toFixed(2)} (incluye IGV).`,
            `Esta cotización es válida hasta el ${validUntil.toLocaleDateString("es-PE")}.`,
            "",
            "Para activar el servicio podés aceptar la cotización desde el portal AXYNTRAX o respondernos por este medio.",
            "",
            "Equipo AXYNTRAX AUTOMATION",
            "Arequipa, Perú",
          ].join("\n"),
          pdf,
          pdfFilename: `cotizacion-axyntrax-${created.id}.pdf`,
        });
        emailSent = r.ok;
        if (!r.ok) {
          logger.warn(
            { quoteId: created.id, error: r.error },
            "quote email failed",
          );
        }
      }

      // Cache PDF in memory store (simple: regen on demand). For a quick
      // win we store the PDF bytes in module-level cache keyed by id.
      pdfCache.set(created.id, pdf);
      await db
        .update(quotesTable)
        .set({
          pdfPath: `cotizacion-${created.id}.pdf`,
          emailSentAt: emailSent ? new Date() : null,
        })
        .where(eq(quotesTable.id, created.id));
    } catch (err) {
      logger.error({ err, quoteId: created.id }, "quote pdf/email failed");
    }

    await audit(req, {
      action: "portal.quote.create",
      entityType: "quote",
      entityId: created.id,
      meta: { clientId, moduleIds, total, emailSent },
    });

    res.status(201).json({
      id: created.id,
      status: created.status,
      currency,
      subtotal,
      igv,
      total,
      validUntil: validUntil.toISOString(),
      emailSent,
      pdfUrl: `/api/portal/quotes/${created.id}/pdf`,
    });
  },
);

// Bounded LRU PDF cache. PDFs are deterministic from DB rows so we can
// regenerate on demand on miss; this just avoids re-rendering on the happy
// path. Eviction prevents unbounded heap growth across the lifetime of the
// process.
const PDF_CACHE_MAX = 100;
class LruPdfCache {
  private map = new Map<number, Buffer>();
  get(id: number): Buffer | undefined {
    const v = this.map.get(id);
    if (v !== undefined) {
      this.map.delete(id);
      this.map.set(id, v);
    }
    return v;
  }
  set(id: number, buf: Buffer): void {
    if (this.map.has(id)) this.map.delete(id);
    this.map.set(id, buf);
    while (this.map.size > PDF_CACHE_MAX) {
      const first = this.map.keys().next().value;
      if (first === undefined) break;
      this.map.delete(first);
    }
  }
}
const pdfCache = new LruPdfCache();

router.get(
  "/portal/quotes",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") return;
    const rows = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.clientId, req.portal.sub))
      .orderBy(desc(quotesTable.createdAt));
    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db
          .select()
          .from(quoteItemsTable)
          .where(inArray(quoteItemsTable.quoteId, ids))
      : [];
    const out = rows.map((q) => ({
      ...q,
      items: items.filter((i) => i.quoteId === q.id),
    }));
    res.json(out);
  },
);

async function regenPdfFromDb(quoteId: number): Promise<Buffer | null> {
  const [q] = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.id, quoteId));
  if (!q) return null;
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, q.clientId));
  if (!client) return null;
  const items = await db
    .select()
    .from(quoteItemsTable)
    .where(eq(quoteItemsTable.quoteId, quoteId));
  return await renderQuotePdf({
    quoteId: q.id,
    createdAt: q.createdAt,
    validUntil: q.validUntil,
    client: {
      name: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
        client.name ||
        client.email ||
        "Cliente",
      email: client.email ?? "",
      phone: client.phone ?? null,
    },
    items: items.map((it) => ({
      name: it.moduleName,
      qty: it.qty,
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    })),
    currency: q.currency,
    subtotal: Number(q.subtotal),
    igv: Number(q.igv),
    total: Number(q.total),
  });
}

router.get(
  "/portal/quotes/:id/pdf",
  requirePortalAuth,
  async (req, res): Promise<void> => {
    if (!req.portal) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const [q] = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.id, id));
    if (!q) {
      res.status(404).json({ error: "no existe" });
      return;
    }
    if (req.portal.kind === "client" && q.clientId !== req.portal.sub) {
      res.status(403).json({ error: "no autorizado" });
      return;
    }
    let pdf = pdfCache.get(id) ?? null;
    if (!pdf) {
      pdf = await regenPdfFromDb(id);
      if (!pdf) {
        res.status(500).json({ error: "no se pudo generar PDF" });
        return;
      }
      pdfCache.set(id, pdf);
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="cotizacion-axyntrax-${id}.pdf"`,
    );
    res.send(pdf);
  },
);

router.post(
  "/portal/quotes/:id/accept",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    type AcceptError =
      | { code: "no_existe" }
      | { code: "no_autorizado" }
      | { code: "estado_invalido"; status: string }
      | { code: "vencida" };
    class QuoteAcceptError extends Error {
      constructor(public detail: AcceptError) {
        super(detail.code);
      }
    }

    let result;
    try {
      result = await db.transaction(async (tx) => {
        const [q] = await tx
          .select()
          .from(quotesTable)
          .where(eq(quotesTable.id, id))
          .for("update");
        if (!q) throw new QuoteAcceptError({ code: "no_existe" });
        if (q.clientId !== req.portal!.sub)
          throw new QuoteAcceptError({ code: "no_autorizado" });
        if (q.status !== "enviada")
          throw new QuoteAcceptError({ code: "estado_invalido", status: q.status });
        if (q.validUntil < new Date()) throw new QuoteAcceptError({ code: "vencida" });

        const items = await tx
          .select()
          .from(quoteItemsTable)
          .where(eq(quoteItemsTable.quoteId, id));

        // Crear solicitudes de módulo pendientes para cada item, evitando
        // duplicados con módulos ya activos/pendientes.
        const existing = await tx
          .select({
            moduleId: clientModulesTable.moduleId,
            status: clientModulesTable.status,
          })
          .from(clientModulesTable)
          .where(eq(clientModulesTable.clientId, q.clientId));
        const blocked = new Set(
          existing
            .filter((e) => e.status === "activo" || e.status === "pendiente")
            .map((e) => e.moduleId),
        );
        const toInsert = items
          .filter((it) => !blocked.has(it.moduleId))
          .map((it) => ({
            clientId: q.clientId,
            moduleId: it.moduleId,
            status: "pendiente",
            notes: `Generado por cotización aceptada #${q.id}`,
          }));
        let createdRequests: number[] = [];
        if (toInsert.length) {
          const inserted = await tx
            .insert(clientModulesTable)
            .values(toInsert)
            .returning({ id: clientModulesTable.id });
          createdRequests = inserted.map((r) => r.id);
        }

        const [updated] = await tx
          .update(quotesTable)
          .set({ status: "aceptada", acceptedAt: new Date() })
          .where(eq(quotesTable.id, id))
          .returning();
        return {
          quote: updated,
          createdRequests,
          skipped: items.length - toInsert.length,
        };
      });
    } catch (err) {
      if (err instanceof QuoteAcceptError) {
        const map: Record<AcceptError["code"], { http: number; msg: string }> = {
          no_existe: { http: 404, msg: "La cotización no existe" },
          no_autorizado: { http: 403, msg: "No autorizado a aceptar esta cotización" },
          estado_invalido: {
            http: 409,
            msg: "La cotización no está en estado 'enviada'",
          },
          vencida: { http: 410, msg: "La cotización está vencida" },
        };
        const m = map[err.detail.code];
        res.status(m.http).json({ error: m.msg, code: err.detail.code, detail: err.detail });
        return;
      }
      logger.error({ err, quoteId: id }, "quote accept failed");
      res.status(500).json({ error: "No se pudo aceptar la cotización" });
      return;
    }

    await audit(req, {
      action: "portal.quote.accept",
      entityType: "quote",
      entityId: id,
      meta: {
        createdRequests: result.createdRequests,
        skipped: result.skipped,
      },
    });
    res.json(result);
  },
);

// Admin: list all quotes
router.get(
  "/portal/admin/quotes",
  requirePortalAuth,
  requirePortalAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        id: quotesTable.id,
        status: quotesTable.status,
        currency: quotesTable.currency,
        subtotal: quotesTable.subtotal,
        igv: quotesTable.igv,
        total: quotesTable.total,
        validUntil: quotesTable.validUntil,
        createdAt: quotesTable.createdAt,
        emailSentAt: quotesTable.emailSentAt,
        acceptedAt: quotesTable.acceptedAt,
        clientId: quotesTable.clientId,
        clientFirstName: clientsTable.firstName,
        clientLastName: clientsTable.lastName,
        clientEmail: clientsTable.email,
        clientPhone: clientsTable.phone,
      })
      .from(quotesTable)
      .leftJoin(clientsTable, eq(clientsTable.id, quotesTable.clientId))
      .orderBy(desc(quotesTable.createdAt));
    res.json(rows);
  },
);

export default router;
