import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, clientsTable } from "@workspace/db";
import {
  ListClientsResponse,
  CreateClientBody,
  UpdateClientBody,
  GetClientParams,
  GetClientResponse,
  UpdateClientParams,
  UpdateClientResponse,
  DeleteClientParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { decryptField, encryptField } from "../lib/crypto";

const router: IRouter = Router();

type ClientRow = typeof clientsTable.$inferSelect;

function decryptClient(c: ClientRow): ClientRow {
  return {
    ...c,
    phone: decryptField(c.phone),
    notes: decryptField(c.notes),
  };
}

router.get("/clients", requireAuth, requireRole("admin", "supervisor"), async (_req, res): Promise<void> => {
  const clients = await db
    .select()
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt));
  res.json(ListClientsResponse.parse(clients.map(decryptClient)));
});

router.post("/clients", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { score, phone, notes, ...rest } = parsed.data;
  const [client] = await db
    .insert(clientsTable)
    .values({
      ...rest,
      phone: encryptField(phone ?? null),
      notes: encryptField(notes ?? null),
      score: score ?? 0,
      stage: parsed.data.stage ?? "prospecto",
    })
    .returning();
  res.status(201).json(GetClientResponse.parse(decryptClient(client)));
});

router.get("/clients/:id", requireAuth, requireRole("admin", "supervisor"), async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }
  res.json(GetClientResponse.parse(decryptClient(client)));
});

router.patch("/clients/:id", requireAuth, requireRole("admin", "supervisor"), async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    if (k === "phone" || k === "notes") {
      updates[k] = encryptField(v as string | null);
    } else if (v !== null) {
      updates[k] = v;
    }
  }
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Sin campos a actualizar" });
    return;
  }
  const [client] = await db
    .update(clientsTable)
    .set(updates)
    .where(eq(clientsTable.id, params.data.id))
    .returning();
  if (!client) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }
  res.json(UpdateClientResponse.parse(decryptClient(client)));
});

router.delete("/clients/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(clientsTable)
    .where(eq(clientsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }
  res.status(204).end();
});

export default router;
