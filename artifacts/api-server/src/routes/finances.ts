import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  db,
  financesTable,
  paymentsTable,
  licensesTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

function serializeFinance(f: typeof financesTable.$inferSelect) {
  return {
    ...f,
    amount: Number(f.amount),
    date: f.date.toISOString(),
    createdAt: f.createdAt.toISOString(),
  };
}

router.get("/finances", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const filters = [];
  const type = typeof req.query.type === "string" ? req.query.type : null;
  if (type === "ingreso" || type === "egreso") {
    filters.push(eq(financesTable.type, type));
  }
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;
  if (from && !Number.isNaN(from.getTime())) {
    filters.push(gte(financesTable.date, from));
  }
  if (to && !Number.isNaN(to.getTime())) {
    filters.push(lte(financesTable.date, to));
  }
  const rows = await db
    .select()
    .from(financesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(financesTable.date));
  res.json(rows.map(serializeFinance));
});

router.post("/finances", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const type = body.type;
  const amount = Number(body.amount);
  if (type !== "ingreso" && type !== "egreso") {
    res.status(400).json({ error: "type debe ser ingreso o egreso" });
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "amount debe ser numérico positivo" });
    return;
  }
  const dateRaw = typeof body.date === "string" ? new Date(body.date) : new Date();
  const [row] = await db
    .insert(financesTable)
    .values({
      type,
      amount: amount.toFixed(2),
      currency: typeof body.currency === "string" ? body.currency : "PEN",
      category: typeof body.category === "string" ? body.category : null,
      description:
        typeof body.description === "string" ? body.description : null,
      clientId:
        typeof body.clientId === "number" ? body.clientId : null,
      date: Number.isNaN(dateRaw.getTime()) ? new Date() : dateRaw,
    })
    .returning();
  res.status(201).json(serializeFinance(row));
});

router.delete("/finances/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id inválido" });
    return;
  }
  await db.delete(financesTable).where(eq(financesTable.id, id));
  res.status(204).end();
});

router.get("/finances/summary", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ ingresoMes }] = await db
    .select({
      ingresoMes: sql<string | null>`coalesce(sum(${financesTable.amount}) filter (where ${financesTable.type} = 'ingreso'), 0)`,
    })
    .from(financesTable)
    .where(gte(financesTable.date, startOfMonth));

  const [{ egresoMes }] = await db
    .select({
      egresoMes: sql<string | null>`coalesce(sum(${financesTable.amount}) filter (where ${financesTable.type} = 'egreso'), 0)`,
    })
    .from(financesTable)
    .where(gte(financesTable.date, startOfMonth));

  const [{ mrr }] = await db
    .select({
      mrr: sql<string | null>`coalesce(sum(${licensesTable.amount}), 0)`,
    })
    .from(licensesTable)
    .where(eq(licensesTable.status, "activa"));

  const [{ pendientes }] = await db
    .select({
      pendientes: sql<number>`cast(count(*) as int)`,
    })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "pendiente"));

  const [{ exitososMes }] = await db
    .select({
      exitososMes: sql<number>`cast(count(*) as int)`,
    })
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.status, "exitoso"),
        gte(paymentsTable.createdAt, startOfMonth),
      ),
    );

  const ing = Number(ingresoMes ?? 0);
  const egr = Number(egresoMes ?? 0);
  res.json({
    ingresoMes: ing,
    egresoMes: egr,
    balanceMes: +(ing - egr).toFixed(2),
    mrrActivo: Number(mrr ?? 0),
    pagosPendientes: pendientes,
    pagosExitososMes: exitososMes,
  });
});

export default router;
