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

export type PortalClient = {
  id: number;
  name: string;
  company: string | null;
  industry: string | null;
  licenseId: number;
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
  licenseId?: number;
  role?: string;
}): string {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

export type PortalToken =
  | {
      kind: "client";
      sub: number;
      name: string;
      licenseId: number;
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
      Partial<PortalToken>;
    if (decoded.kind === "client" && typeof decoded.licenseId === "number") {
      return {
        kind: "client",
        sub: Number(decoded.sub),
        name: String(decoded.name ?? ""),
        licenseId: decoded.licenseId,
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

export function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = getPortalToken(req);
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const decoded = verifyPortalToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return;
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
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, decoded.id))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "User no longer exists" });
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
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
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
