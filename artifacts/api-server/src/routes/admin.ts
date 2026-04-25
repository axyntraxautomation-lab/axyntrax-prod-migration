import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import {
  db,
  usersTable,
  clientsTable,
  licensesTable,
  conversationsTable,
  messagesTable,
  financesTable,
  paymentsTable,
  gmailTemplatesTable,
  auditLogTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { audit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/admin/backup",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const [
      users,
      clients,
      licenses,
      conversations,
      messages,
      finances,
      payments,
      templates,
    ] = await Promise.all([
      db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          role: usersTable.role,
          twofaEnabled: usersTable.twofaEnabled,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable),
      db.select().from(clientsTable),
      db.select().from(licensesTable),
      db.select().from(conversationsTable),
      db.select().from(messagesTable),
      db.select().from(financesTable),
      db.select().from(paymentsTable),
      db.select().from(gmailTemplatesTable),
    ]);
    await audit(req, {
      action: "admin.backup",
      meta: {
        users: users.length,
        clients: clients.length,
        licenses: licenses.length,
        conversations: conversations.length,
        messages: messages.length,
        finances: finances.length,
        payments: payments.length,
        templates: templates.length,
      },
    });
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="axyntrax-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    );
    res.json({
      generatedAt: new Date().toISOString(),
      schemaVersion: 1,
      data: {
        users,
        clients,
        licenses,
        conversations,
        messages,
        finances,
        payments,
        templates,
      },
    });
  },
);

router.get(
  "/admin/audit",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const rows = await db
      .select()
      .from(auditLogTable)
      .orderBy(desc(auditLogTable.createdAt))
      .limit(limit);
    res.json(
      rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        ip: r.ip,
        userAgent: r.userAgent,
        meta: r.meta,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  },
);

export default router;
