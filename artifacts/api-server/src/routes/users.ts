import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { ListUsersResponse } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { audit } from "../lib/audit";
// @ts-expect-error - JS helper sin tipos, ver lib/security-alerts.mjs
import { notifyAdminSensitiveAction } from "../lib/security-alerts.mjs";

const router: IRouter = Router();

router.get("/users", requireAuth, requireRole("admin", "supervisor"), async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      twofaEnabled: usersTable.twofaEnabled,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.id);
  const users = rows.map((u) => ({
    ...u,
    twofaEnabled: u.twofaEnabled === "true",
  }));
  res.json(ListUsersResponse.parse(users));
});

const ChangeRoleBody = z.object({
  role: z.enum(["admin", "supervisor", "agente"]),
});

router.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const parsed = ChangeRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    const previousRole = target.role;
    const nextRole = parsed.data.role;
    if (previousRole === nextRole) {
      res.json({
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        twofaEnabled: target.twofaEnabled === "true",
        createdAt: target.createdAt,
      });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({ role: nextRole })
      .where(eq(usersTable.id, targetId))
      .returning();
    await audit(req, {
      action: "user.role.change",
      entityType: "user",
      entityId: updated.id,
      meta: {
        targetEmail: updated.email,
        previousRole,
        newRole: nextRole,
      },
    });
    if (nextRole === "admin") {
      await notifyAdminSensitiveAction({
        action: "user.role.promoted_to_admin",
        operator: `${req.user.email} (id=${req.user.id})`,
        targetEmail: updated.email,
        targetRole: nextRole,
        extra: { previousRole },
      });
    }
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      twofaEnabled: updated.twofaEnabled === "true",
      createdAt: updated.createdAt,
    });
  },
);

export default router;
