import { Router, type IRouter } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import {
  db,
  clientsTable,
  licensesTable,
  paymentsTable,
  conversationsTable,
} from "@workspace/db";
import {
  GetDashboardKpisResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/kpis", requireAuth, async (_req, res): Promise<void> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const in15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const [{ count: totalClients }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(clientsTable);

  const [{ count: leadsToday }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(clientsTable)
    .where(gte(clientsTable.createdAt, startOfDay));

  const [{ count: activeDemos }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(licensesTable)
    .where(and(eq(licensesTable.type, "demo"), eq(licensesTable.status, "activa")));

  const [{ count: activeLicenses }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(licensesTable)
    .where(eq(licensesTable.status, "activa"));

  const [{ count: expiringLicenses }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(licensesTable)
    .where(
      and(eq(licensesTable.status, "activa"), sql`${licensesTable.endDate} <= ${in15Days}`),
    );

  const [{ total: salesMonth }] = await db
    .select({
      total: sql<string | null>`coalesce(sum(${paymentsTable.amount}), 0)`,
    })
    .from(paymentsTable)
    .where(gte(paymentsTable.createdAt, startOfMonth));

  const [{ total: mrrTotal }] = await db
    .select({
      total: sql<string | null>`coalesce(sum(${licensesTable.amount}), 0)`,
    })
    .from(licensesTable)
    .where(eq(licensesTable.status, "activa"));

  const channelRows = await db
    .select({
      channel: clientsTable.channel,
      leads: sql<number>`cast(count(*) as int)`,
      conversions: sql<number>`cast(count(*) filter (where ${clientsTable.stage} in ('cliente','renovacion')) as int)`,
    })
    .from(clientsTable)
    .groupBy(clientsTable.channel);

  const conversionsByChannel = channelRows.map((r) => ({
    channel: r.channel as
      | "web"
      | "facebook"
      | "instagram"
      | "whatsapp"
      | "email"
      | "otro",
    leads: r.leads,
    conversions: r.conversions,
  }));

  const now = new Date();
  const botStatuses = [
    { name: "Bot Web", channel: "web" as const, status: "online" as const, lastSeen: now },
    { name: "Bot Messenger", channel: "facebook" as const, status: "online" as const, lastSeen: now },
    { name: "Bot Instagram", channel: "instagram" as const, status: "online" as const, lastSeen: now },
    { name: "Bot WhatsApp", channel: "whatsapp" as const, status: "online" as const, lastSeen: now },
    { name: "Cecilia (Gmail)", channel: "email" as const, status: "online" as const, lastSeen: now },
  ];

  res.json(
    GetDashboardKpisResponse.parse({
      leadsToday,
      salesMonth: Number(salesMonth ?? 0),
      activeDemos,
      activeLicenses,
      expiringLicenses,
      totalClients,
      mrr: Number(mrrTotal ?? 0),
      conversionsByChannel,
      botStatuses,
    }),
  );
});

router.get(
  "/dashboard/recent-activity",
  requireAuth,
  async (_req, res): Promise<void> => {
    const recentClients = await db
      .select()
      .from(clientsTable)
      .orderBy(sql`${clientsTable.createdAt} desc`)
      .limit(5);

    const recentLicenses = await db
      .select({
        id: licensesTable.id,
        key: licensesTable.key,
        type: licensesTable.type,
        createdAt: licensesTable.createdAt,
        clientName: clientsTable.name,
      })
      .from(licensesTable)
      .leftJoin(clientsTable, eq(clientsTable.id, licensesTable.clientId))
      .orderBy(sql`${licensesTable.createdAt} desc`)
      .limit(5);

    const recentMessages = await db
      .select()
      .from(conversationsTable)
      .orderBy(sql`${conversationsTable.createdAt} desc`)
      .limit(5);

    const items: {
      id: number;
      type: "lead" | "message" | "payment" | "license" | "alert";
      title: string;
      description: string | null;
      channel:
        | "web"
        | "facebook"
        | "instagram"
        | "whatsapp"
        | "email"
        | "otro"
        | null;
      timestamp: Date;
    }[] = [];

    for (const c of recentClients) {
      items.push({
        id: c.id * 10 + 1,
        type: "lead",
        title: `Nuevo lead: ${c.name}`,
        description: c.company ?? null,
        channel: c.channel as
          | "web"
          | "facebook"
          | "instagram"
          | "whatsapp"
          | "email"
          | "otro",
        timestamp: c.createdAt,
      });
    }
    for (const l of recentLicenses) {
      items.push({
        id: l.id * 10 + 2,
        type: "license",
        title: `Licencia ${l.type} emitida`,
        description: l.clientName ? `Cliente: ${l.clientName}` : l.key,
        channel: null,
        timestamp: l.createdAt,
      });
    }
    for (const m of recentMessages) {
      items.push({
        id: m.id * 10 + 3,
        type: "message",
        title: `Mensaje en ${m.channel}`,
        description: m.message.slice(0, 80),
        channel: m.channel as
          | "web"
          | "facebook"
          | "instagram"
          | "whatsapp"
          | "email"
          | "otro",
        timestamp: m.createdAt,
      });
    }

    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    res.json(GetRecentActivityResponse.parse(items.slice(0, 12)));
  },
);

export default router;
