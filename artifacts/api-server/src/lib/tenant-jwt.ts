import jwt from "jsonwebtoken";

/**
 * Firma un JWT HS256 con el secreto JWT del proyecto Supabase.
 * Este token lo va a leer Supabase para verificar identidad.
 *
 * Payload exacto exigido por el spec de SaaS Cecilia:
 *  - sub: identificador del cliente AXYNTRAX (client.id como string)
 *  - tenant_id: uuid del tenant en la tabla `tenants` (para que las
 *    policies RLS lo lean con `auth.jwt() ->> 'tenant_id'`)
 *  - role: 'tenant_owner' | 'tenant_staff' | 'tenant_viewer'
 *  - exp: now + 1h
 *
 * NO se inyectan claims extra (`aud`, `role: 'authenticated'`,
 * `tenant_role`) para mantener compatibilidad estricta con el contrato.
 * RLS aún no está activado (Tarea siguiente); cuando se prendan policies
 * éstas van a leer `tenant_id` y `role` directamente del JWT.
 *
 * TTL: 1 hora. El frontend tenant pide refresh llamando a /api/tenant/jwt
 * cuando se acerca el vencimiento, validando antes la cookie de sesión
 * AXYNTRAX.
 */

export type TenantRole = "tenant_owner" | "tenant_staff" | "tenant_viewer";

export type TenantJwtPayload = {
  sub: string;
  tenant_id: string;
  role: TenantRole;
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
      role: payload.role,
      iat: now,
      exp: now + TTL_SECONDS,
    },
    secret,
    { algorithm: "HS256" },
  );
}

export function verifyTenantJwt(token: string): TenantJwtPayload | null {
  const secret = requireJwtSecret();
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & {
      sub: string;
      tenant_id: string;
      role: TenantRole;
    };
    if (!decoded.sub || !decoded.tenant_id || !decoded.role) return null;
    return {
      sub: String(decoded.sub),
      tenant_id: String(decoded.tenant_id),
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function tenantJwtTtlSeconds(): number {
  return TTL_SECONDS;
}
