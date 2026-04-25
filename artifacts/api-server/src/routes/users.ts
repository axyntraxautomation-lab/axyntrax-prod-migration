import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { ListUsersResponse } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

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

export default router;
