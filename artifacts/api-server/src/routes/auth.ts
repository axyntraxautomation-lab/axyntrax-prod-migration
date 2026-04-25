import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  GetCurrentUserResponse,
} from "@workspace/api-zod";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signToken,
  verifyPassword,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = signToken(safeUser);
  setSessionCookie(res, token);

  res.json(
    LoginResponse.parse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    }),
  );
});

router.post("/auth/logout", (_req, res): void => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(
    GetCurrentUserResponse.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }),
  );
});

export default router;
