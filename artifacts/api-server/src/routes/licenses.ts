import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, clientsTable, licensesTable } from "@workspace/db";
import { ListLicensesResponse, CreateLicenseBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { decryptField, encryptField } from "../lib/crypto";

const router: IRouter = Router();

const TYPE_TO_DAYS: Record<string, number> = {
  demo: 30,
  plan_3m: 90,
  plan_6m: 180,
  plan_12m: 365,
  plan_24m: 730,
  addon: 365,
};

function generateKey(prefix: string): string {
  const part = randomBytes(6).toString("hex").toUpperCase();
  return `AXYN-${prefix.toUpperCase()}-${part}`;
}

router.get("/licenses", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: licensesTable.id,
      clientId: licensesTable.clientId,
      clientName: clientsTable.name,
      key: licensesTable.key,
      type: licensesTable.type,
      module: licensesTable.module,
      status: licensesTable.status,
      startDate: licensesTable.startDate,
      endDate: licensesTable.endDate,
      amount: licensesTable.amount,
      currency: licensesTable.currency,
      createdAt: licensesTable.createdAt,
    })
    .from(licensesTable)
    .leftJoin(clientsTable, eq(clientsTable.id, licensesTable.clientId))
    .orderBy(desc(licensesTable.createdAt));

  const mapped = rows.map((r) => ({
    ...r,
    key: decryptField(r.key) ?? r.key,
    amount: r.amount == null ? null : Number(r.amount),
  }));
  res.json(ListLicensesResponse.parse(mapped));
});

router.post("/licenses", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, parsed.data.clientId))
    .limit(1);
  if (!client) {
    res.status(400).json({ error: "Cliente no existe" });
    return;
  }

  const days = TYPE_TO_DAYS[parsed.data.type] ?? 30;
  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const prefix = client.name.split(" ")[0]?.slice(0, 6) || "CLI";

  const plainKey = generateKey(prefix);
  const [lic] = await db
    .insert(licensesTable)
    .values({
      clientId: parsed.data.clientId,
      key: encryptField(plainKey) ?? plainKey,
      type: parsed.data.type,
      module: parsed.data.module ?? null,
      status: "activa",
      startDate: start,
      endDate: end,
      amount:
        parsed.data.amount == null ? null : String(parsed.data.amount),
      currency: parsed.data.currency ?? "PEN",
    })
    .returning();

  res.status(201).json({
    id: lic.id,
    clientId: lic.clientId,
    clientName: client.name,
    key: plainKey,
    type: lic.type,
    module: lic.module,
    status: lic.status,
    startDate: lic.startDate,
    endDate: lic.endDate,
    amount: lic.amount == null ? null : Number(lic.amount),
    currency: lic.currency,
    createdAt: lic.createdAt,
  });
});

export default router;
