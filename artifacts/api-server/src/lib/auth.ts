import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required for JWT signing. Refusing to start without it.",
    );
  }
  return secret;
}
const SECRET: string = requireSessionSecret();
const TOKEN_TTL = "30d";
const COOKIE_NAME = "axyn_session";
const PORTAL_COOKIE_NAME = "axyn_portal";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email, role: user.role },
    SECRET,
    { expiresIn: TOKEN_TTL },
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload & {
      sub: number | string;
      name: string;
      email: string;
      role: string;
    };
    return {
      id: Number(decoded.sub),
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function getTokenFromRequest(req: Request): string | null {
  const cookieToken = (req as Request & { cookies?: Record<string, string> })
    .cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export function signPortalToken(payload: {
  kind: "client" | "admin";
  sub: number;
  name: string;
  role?: string;
}): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

export type PortalToken =
  | {
      kind: "client";
      sub: number;
      name: string;
    }
  | {
      kind: "admin";
      sub: number;
      name: string;
      role: string;
    };

export function verifyPortalToken(token: string): PortalToken | null {
  try {
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload &
      Partial<PortalToken> & { role?: string };
    if (decoded.kind === "client") {
      return {
        kind: "client",
        sub: Number(decoded.sub),
        name: String(decoded.name ?? ""),
      };
    }
    if (decoded.kind === "admin" && typeof decoded.role === "string") {
      return {
        kind: "admin",
        sub: Number(decoded.sub),
        name: String(decoded.name ?? ""),
        role: decoded.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setPortalCookie(res: Response, token: string): void {
  res.cookie(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearPortalCookie(res: Response): void {
  res.clearCookie(PORTAL_COOKIE_NAME, { path: "/" });
}

function getPortalToken(req: Request): string | null {
  const cookieToken = (req as Request & { cookies?: Record<string, string> })
    .cookies?.[PORTAL_COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authHeader = req.headers["x-portal-authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      portal?: PortalToken;
    }
  }
}

export async function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getPortalToken(req);
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const decoded = verifyPortalToken(token);
  if (!decoded) {
    clearPortalCookie(res);
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return;
  }

  // Re-validate against DB on every request to honor revocations / expiries.
  if (decoded.kind === "admin") {
    const { db, usersTable } = await import("@workspace/db");
    const { eq } = await import("drizzle-orm");
    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.sub))
      .limit(1);
    if (!user || user.role !== "admin") {
      clearPortalCookie(res);
      res.status(401).json({ error: "Sesión inválida" });
      return;
    }
  } else {
    const { db, clientsTable } = await import("@workspace/db");
    const { eq } = await import("drizzle-orm");
    const [client] = await db
      .select({
        id: clientsTable.id,
        passwordHash: clientsTable.passwordHash,
      })
      .from(clientsTable)
      .where(eq(clientsTable.id, decoded.sub))
      .limit(1);
    if (!client || !client.passwordHash) {
      clearPortalCookie(res);
      res.status(401).json({ error: "Cuenta no encontrada" });
      return;
    }
  }

  req.portal = decoded;
  next();
}

export function requirePortalClient(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.portal || req.portal.kind !== "client") {
    res.status(403).json({ error: "Acceso solo para clientes" });
    return;
  }
  next();
}

export function requirePortalAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.portal || req.portal.kind !== "admin" || req.portal.role !== "admin") {
    res.status(403).json({ error: "Acceso solo para administradores" });
    return;
  }
  next();
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Sesión inválida o vencida" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, decoded.id))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "El usuario ya no existe" });
    return;
  }
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  next();
}

export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ error: "Prohibido" });
      return;
    }
    next();
  };
}

export async function attachUserIfPresent(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getTokenFromRequest(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, decoded.id))
        .limit(1);
      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    }
  }
  next();
}
