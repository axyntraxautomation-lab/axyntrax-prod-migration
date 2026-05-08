import { Router, type IRouter } from "express";
import { sql, desc } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  financesTable,
  paymentsTable,
  aiLogsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/analytics/overview", requireAuth, async (_req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    convsByChannel,
    convsByStatus,
    msgsByDay,
    aiStats,
    financeByDay,
    paymentStats,
  ] = await Promise.all([
    db
      .select({
        channel: conversationsTable.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(conversationsTable)
      .groupBy(conversationsTable.channel),
    db
      .select({
        status: conversationsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(conversationsTable)
      .groupBy(conversationsTable.status),
    db
      .select({
        day: sql<string>`to_char(${messagesTable.sentAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
        inbound: sql<number>`count(*) filter (where ${messagesTable.direction} = 'inbound')::int`,
        outbound: sql<number>`count(*) filter (where ${messagesTable.direction} = 'outbound')::int`,
      })
      .from(messagesTable)
      .where(sql`${messagesTable.sentAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`to_char(${messagesTable.sentAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${messagesTable.sentAt}, 'YYYY-MM-DD')`),
    db
      .select({
        source: aiLogsTable.source,
        event: aiLogsTable.event,
        count: sql<number>`count(*)::int`,
      })
      .from(aiLogsTable)
      .where(sql`${aiLogsTable.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(aiLogsTable.source, aiLogsTable.event),
    db
      .select({
        day: sql<string>`to_char(${financesTable.date}, 'YYYY-MM-DD')`,
        ingreso: sql<number>`coalesce(sum(case when ${financesTable.type} = 'ingreso' then ${financesTable.amount} else 0 end), 0)::float`,
        egreso: sql<number>`coalesce(sum(case when ${financesTable.type} = 'egreso' then ${financesTable.amount} else 0 end), 0)::float`,
      })
      .from(financesTable)
      .where(sql`${financesTable.date} >= ${thirtyDaysAgo}`)
      .groupBy(sql`to_char(${financesTable.date}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${financesTable.date}, 'YYYY-MM-DD')`),
    db
      .select({
        status: paymentsTable.status,
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${paymentsTable.amount}), 0)::float`,
      })
      .from(paymentsTable)
      .groupBy(paymentsTable.status),
  ]);

  // Promedio tiempo de primera respuesta (en minutos) por canal últimos 30d
  const responseTimes = await db.execute(sql`
    WITH first_in AS (
      SELECT conversation_id, MIN(sent_at) AS first_in_at
      FROM ${messagesTable}
      WHERE direction = 'inbound' AND sent_at >= ${thirtyDaysAgo}
      GROUP BY conversation_id
    ),
    first_out AS (
      SELECT m.conversation_id, MIN(m.sent_at) AS first_out_at
      FROM ${messagesTable} m
      JOIN first_in fi ON fi.conversation_id = m.conversation_id
      WHERE m.direction = 'outbound' AND m.sent_at > fi.first_in_at
      GROUP BY m.conversation_id
    )
    SELECT c.channel,
           AVG(EXTRACT(EPOCH FROM (fo.first_out_at - fi.first_in_at)) / 60.0)::float AS avg_minutes,
           COUNT(*)::int AS samples
    FROM ${conversationsTable} c
    JOIN first_in fi ON fi.conversation_id = c.id
    JOIN first_out fo ON fo.conversation_id = c.id
    GROUP BY c.channel
  `);

  const recent = await db
    .select()
    .from(aiLogsTable)
    .orderBy(desc(aiLogsTable.createdAt))
    .limit(10);

  res.json({
    range: { from: thirtyDaysAgo.toISOString(), to: now.toISOString() },
    conversationsByChannel: convsByChannel,
    conversationsByStatus: convsByStatus,
    messagesByDay: msgsByDay,
    aiStats,
    financeByDay,
    paymentStats,
    responseTimesByChannel: (
      responseTimes.rows as Array<{
        channel: string;
        avg_minutes: number;
        samples: number;
      }>
    ).map((r) => ({
      channel: r.channel,
      avgMinutes: Number(r.avg_minutes ?? 0),
      samples: Number(r.samples ?? 0),
    })),
    recentAiActivity: recent.map((r) => ({
      id: r.id,
      source: r.source,
      event: r.event,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

export default router;
