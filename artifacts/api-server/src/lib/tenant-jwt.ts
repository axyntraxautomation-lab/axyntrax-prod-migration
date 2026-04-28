import jwt from "jsonwebtoken";

/**
 * Firma un JWT HS256 con el secreto JWT del proyecto Supabase.
 * Este token lo va a leer Supabase para verificar identidad y aplicar RLS.
 *
 * Payload mínimo:
 *  - sub: identificador del usuario (email del cliente AXYNTRAX)
 *  - tenant_id: uuid del tenant en la tabla `tenants` (claim raíz para que
 *    las policies RLS lo lean directo desde `auth.jwt() ->> 'tenant_id'`)
 *  - role: 'tenant_owner' | 'tenant_staff' | 'tenant_viewer' (para granularidad
 *    futura de policies)
 *  - aud + role 'authenticated' para que Supabase lo trate como un usuario
 *    válido y no como anon
 *
 * TTL: 1 hora. El frontend tenant pide refresh llamando a /api/tenant/jwt
 * cuando se acerca el vencimiento, validando antes la cookie de sesión
 * AXYNTRAX.
 */

export type TenantJwtPayload = {
  sub: string;
  tenant_id: string;
  role: "tenant_owner" | "tenant_staff" | "tenant_viewer";
};

const TTL_SECONDS = 60 * 60; // 1 hora

function requireJwtSecret(): string {
  const s = process.env.SUPABASE_JWT_SECRET;
  if (!s) {
    throw new Error(
      "SUPABASE_JWT_SECRET no está configurado. Copia el JWT Secret del panel " +
        "Settings > API del proyecto Supabase y registra el secret en Replit.",
    );
  }
  return s;
}

export function signTenantJwt(payload: TenantJwtPayload): string {
  const secret = requireJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: payload.sub,
      tenant_id: payload.tenant_id,
      role: "authenticated",
      tenant_role: payload.role,
      iat: now,
      exp: now + TTL_SECONDS,
      aud: "authenticated",
    },
    secret,
    { algorithm: "HS256" },
  );
}

export function verifyTenantJwt(token: string): {
  sub: string;
  tenant_id: string;
  tenant_role: TenantJwtPayload["role"];
} | null {
  const secret = requireJwtSecret();
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      audience: "authenticated",
    }) as jwt.JwtPayload & {
      sub: string;
      tenant_id: string;
      tenant_role: TenantJwtPayload["role"];
    };
    if (!decoded.sub || !decoded.tenant_id || !decoded.tenant_role) return null;
    return {
      sub: String(decoded.sub),
      tenant_id: String(decoded.tenant_id),
      tenant_role: decoded.tenant_role,
    };
  } catch {
    return null;
  }
}

export function tenantJwtTtlSeconds(): number {
  return TTL_SECONDS;
}
