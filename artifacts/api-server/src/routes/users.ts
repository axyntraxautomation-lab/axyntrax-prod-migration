import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { ListUsersResponse } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", requireAuth, requireRole("admin", "supervisor"), async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.id);
  res.json(ListUsersResponse.parse(users));
});

export default router;
