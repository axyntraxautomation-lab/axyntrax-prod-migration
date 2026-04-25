import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authenticator } from "otplib";
import {
  db,
  usersTable,
  clientsTable,
  modulesCatalogTable,
  clientModulesTable,
  paymentsTable,
} from "@workspace/db";
import {
  signPortalToken,
  setPortalCookie,
  clearPortalCookie,
  requirePortalAuth,
  requirePortalClient,
  requirePortalAdmin,
  verifyPassword,
  hashPassword,
} from "../lib/auth";
import { audit } from "../lib/audit";

const router: IRouter = Router();

// Phone: 7-20 digits, optionally a leading "+". Spaces / dashes are stripped.
const PHONE_RE = /^\+?\d{7,20}$/;

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

function generateLicenseKey(slug: string): string {
  const cleaned = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8) || "MOD";
  const rand = randomBytes(6).toString("hex").toUpperCase();
  return `AXYN-${cleaned}-${rand}`;
}

function publicClient(c: {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
}) {
  return {
    id: c.id,
    name: c.name,
    firstName: c.firstName,
    lastName: c.lastName,
    company: c.company,
    industry: c.industry,
    email: c.email,
    phone: c.phone,
  };
}

const LoginClientBody = z.object({
  mode: z.literal("client"),
  email: z.string().trim().email(),
  password: z.string().min(1),
});
const LoginAdminBody = z.object({
  mode: z.literal("admin"),
  email: z.string().trim().email(),
  password: z.string().min(1),
  twofaCode: z.string().trim().min(4).max(10).optional(),
});
const LoginBody = z.discriminatedUnion("mode", [LoginClientBody, LoginAdminBody]);

const RegisterBody = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(2).max(120),
  lastName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .transform((v) => normalizePhone(v))
    .refine((v) => PHONE_RE.test(v), {
      message: "Número de celular inválido",
    }),
});

router.post("/portal/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    res.status(400).json({
      error: first?.message ?? "Datos inválidos",
      field: first?.path?.join("."),
    });
    return;
  }
  const { email, password, firstName, lastName, phone } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await hashPassword(password);
  const fullName = `${firstName} ${lastName}`.trim();

  // Look up by case-insensitive email (matches the unique index).
  const [existing] = await db
    .select()
    .from(clientsTable)
    .where(sql`lower(${clientsTable.email}) = ${normalizedEmail}`)
    .limit(1);

  let client: typeof clientsTable.$inferSelect;
  let claimed = false;

  if (existing) {
    if (existing.passwordHash) {
      // Already a real account — block.
      res.status(409).json({
        error: "Ya existe una cuenta con ese correo",
        field: "email",
      });
      return;
    }
    // Legacy CRM contact (no password yet) → claim the account.
    const [updated] = await db
      .update(clientsTable)
      .set({
        name: fullName,
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        passwordHash,
        channel: existing.channel ?? "portal",
      })
      .where(eq(clientsTable.id, existing.id))
      .returning();
    client = updated;
    claimed = true;
  } else {
    try {
      const [created] = await db
        .insert(clientsTable)
        .values({
          name: fullName,
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          passwordHash,
          channel: "portal",
          stage: "prospecto",
        })
        .returning();
      client = created;
    } catch (err) {
      // Race-condition fallback: unique index hit between SELECT and INSERT.
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        res.status(409).json({
          error: "Ya existe una cuenta con ese correo",
          field: "email",
        });
        return;
      }
      throw err;
    }
  }

  const token = signPortalToken({
    kind: "client",
    sub: client.id,
    name: client.name,
  });
  setPortalCookie(res, token);

  await audit(req, {
    action: claimed ? "portal.register.claim" : "portal.register",
    entityType: "client",
    entityId: client.id,
  });

  res.status(201).json({
    kind: "client",
    client: publicClient(client),
    claimed,
  });
});

router.post("/portal/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  if (parsed.data.mode === "client") {
    const email = parsed.data.email.toLowerCase();
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.email, email))
      .limit(1);

    if (!client || !client.passwordHash) {
      await audit(req, {
        action: "portal.login.fail",
        entityType: "client",
        meta: { reason: "not_found" },
      });
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }
    const ok = await verifyPassword(parsed.data.password, client.passwordHash);
    if (!ok) {
      await audit(req, {
        action: "portal.login.fail",
        entityType: "client",
        entityId: client.id,
        meta: { reason: "bad_password" },
      });
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const token = signPortalToken({
      kind: "client",
      sub: client.id,
      name: client.name,
    });
    setPortalCookie(res, token);

    await audit(req, {
      action: "portal.login.client",
      entityType: "client",
      entityId: client.id,
    });

    res.json({
      kind: "client",
      client: publicClient(client),
    });
    return;
  }

  // admin mode
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
    await audit(req, {
      action: "portal.login.fail",
      entityType: "user",
      entityId: user.id,
      meta: { reason: "bad_password" },
    });
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Solo administradores" });
    return;
  }

  const twofaEnabled = user.twofaEnabled === "true" && !!user.twofaSecret;
  if (twofaEnabled) {
    const code = parsed.data.twofaCode?.trim();
    if (!code) {
      res.status(401).json({
        error: "Se requiere código de verificación 2FA",
        requiresTwofa: true,
      });
      return;
    }
    const valid = authenticator.verify({
      token: code,
      secret: user.twofaSecret as string,
    });
    if (!valid) {
      await audit(req, {
        action: "portal.login.fail",
        entityType: "user",
        entityId: user.id,
        meta: { reason: "bad_2fa" },
      });
      res.status(401).json({
        error: "Código 2FA inválido",
        requiresTwofa: true,
      });
      return;
    }
  }

  const token = signPortalToken({
    kind: "admin",
    sub: user.id,
    name: user.name,
    role: user.role,
  });
  setPortalCookie(res, token);

  await audit(req, {
    action: "portal.login.admin",
    entityType: "user",
    entityId: user.id,
  });

  res.json({
    kind: "admin",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

router.post("/portal/auth/logout", (_req, res): void => {
  clearPortalCookie(res);
  res.status(204).end();
});

router.get("/portal/auth/me", requirePortalAuth, async (req, res): Promise<void> => {
  if (!req.portal) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  if (req.portal.kind === "client") {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.id, req.portal.sub))
      .limit(1);
    if (!client) {
      clearPortalCookie(res);
      res.status(401).json({ error: "Sesión inválida" });
      return;
    }
    res.json({
      kind: "client",
      client: publicClient(client),
    });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.portal.sub))
    .limit(1);
  if (!user) {
    clearPortalCookie(res);
    res.status(401).json({ error: "Sesión inválida" });
    return;
  }
  res.json({
    kind: "admin",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// =========================
// Client endpoints
// =========================

async function expireOverdueClientModules(clientId: number): Promise<void> {
  await db
    .update(clientModulesTable)
    .set({ status: "vencido" })
    .where(
      and(
        eq(clientModulesTable.clientId, clientId),
        eq(clientModulesTable.status, "activo"),
        sql`${clientModulesTable.expiresAt} is not null`,
        sql`${clientModulesTable.expiresAt} < now()`,
      ),
    );
}

router.get(
  "/portal/me/modules",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") return;

    await expireOverdueClientModules(req.portal.sub);

    const rows = await db
      .select({
        id: clientModulesTable.id,
        moduleId: clientModulesTable.moduleId,
        status: clientModulesTable.status,
        licenseKey: clientModulesTable.licenseKey,
        notes: clientModulesTable.notes,
        requestedAt: clientModulesTable.requestedAt,
        activatedAt: clientModulesTable.activatedAt,
        expiresAt: clientModulesTable.expiresAt,
        cancelledAt: clientModulesTable.cancelledAt,
        moduleSlug: modulesCatalogTable.slug,
        moduleName: modulesCatalogTable.name,
        moduleDescription: modulesCatalogTable.description,
        moduleIndustry: modulesCatalogTable.industry,
        monthlyPrice: modulesCatalogTable.monthlyPrice,
        currency: modulesCatalogTable.currency,
      })
      .from(clientModulesTable)
      .innerJoin(
        modulesCatalogTable,
        eq(modulesCatalogTable.id, clientModulesTable.moduleId),
      )
      .where(eq(clientModulesTable.clientId, req.portal.sub))
      .orderBy(desc(clientModulesTable.requestedAt));
    res.json(rows);
  },
);

// Public catalog (no auth) for the landing page.
router.get("/portal/public/catalog", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(modulesCatalogTable)
    .where(eq(modulesCatalogTable.active, 1))
    .orderBy(modulesCatalogTable.industry, modulesCatalogTable.name);
  res.json(rows);
});

router.get(
  "/portal/catalog",
  requirePortalAuth,
  async (req, res): Promise<void> => {
    const industry =
      typeof req.query.industry === "string" ? req.query.industry : undefined;
    const rows = industry
      ? await db
          .select()
          .from(modulesCatalogTable)
          .where(
            and(
              eq(modulesCatalogTable.industry, industry),
              eq(modulesCatalogTable.active, 1),
            ),
          )
          .orderBy(modulesCatalogTable.name)
      : await db
          .select()
          .from(modulesCatalogTable)
          .where(eq(modulesCatalogTable.active, 1))
          .orderBy(modulesCatalogTable.industry, modulesCatalogTable.name);
    res.json(rows);
  },
);

const RequestModuleBody = z.object({
  moduleId: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

router.post(
  "/portal/me/modules/request",
  requirePortalAuth,
  requirePortalClient,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "client") return;
    const parsed = RequestModuleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const clientId = req.portal.sub;
    const { moduleId, notes } = parsed.data;

    // Normalize: cualquier demo activa vencida pasa a "vencido" antes
    // del check de bloqueo, así una demo expirada no impide pedir otra.
    await expireOverdueClientModules(clientId);

    try {
      const inserted = await db.transaction(async (tx) => {
        const [mod] = await tx
          .select()
          .from(modulesCatalogTable)
          .where(eq(modulesCatalogTable.id, moduleId))
          .for("update")
          .limit(1);
        if (!mod) throw new Error("Módulo no existe");
        if (mod.active !== 1) throw new Error("Módulo inactivo");

        const existing = await tx
          .select({ id: clientModulesTable.id, status: clientModulesTable.status })
          .from(clientModulesTable)
          .where(
            and(
              eq(clientModulesTable.clientId, clientId),
              eq(clientModulesTable.moduleId, moduleId),
            ),
          );
        const blocked = existing.find(
          (r) => r.status === "activo" || r.status === "pendiente",
        );
        if (blocked) {
          throw new Error(`Ya existe una solicitud ${blocked.status}`);
        }

        const [row] = await tx
          .insert(clientModulesTable)
          .values({
            clientId,
            moduleId,
            status: "pendiente",
            notes: notes ?? null,
          })
          .returning();
        return row;
      });

      await audit(req, {
        action: "portal.module.request",
        entityType: "client_module",
        entityId: inserted.id,
        meta: { clientId, moduleId },
      });
      res.status(201).json(inserted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      res.status(400).json({ error: msg });
    }
  },
);

// =========================
// Admin endpoints (portal)
// =========================

router.get(
  "/portal/admin/catalog",
  requirePortalAuth,
  requirePortalAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(modulesCatalogTable)
      .orderBy(modulesCatalogTable.industry, modulesCatalogTable.name);
    res.json(rows);
  },
);

router.get(
  "/portal/admin/requests",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const status =
      typeof req.query.status === "string" ? req.query.status : "pendiente";
    const rows = await db
      .select({
        id: clientModulesTable.id,
        clientId: clientModulesTable.clientId,
        moduleId: clientModulesTable.moduleId,
        status: clientModulesTable.status,
        licenseKey: clientModulesTable.licenseKey,
        notes: clientModulesTable.notes,
        requestedAt: clientModulesTable.requestedAt,
        activatedAt: clientModulesTable.activatedAt,
        clientName: clientsTable.name,
        clientEmail: clientsTable.email,
        clientPhone: clientsTable.phone,
        clientCompany: clientsTable.company,
        clientIndustry: clientsTable.industry,
        moduleSlug: modulesCatalogTable.slug,
        moduleName: modulesCatalogTable.name,
        monthlyPrice: modulesCatalogTable.monthlyPrice,
        currency: modulesCatalogTable.currency,
      })
      .from(clientModulesTable)
      .innerJoin(clientsTable, eq(clientsTable.id, clientModulesTable.clientId))
      .innerJoin(
        modulesCatalogTable,
        eq(modulesCatalogTable.id, clientModulesTable.moduleId),
      )
      .where(eq(clientModulesTable.status, status))
      .orderBy(desc(clientModulesTable.requestedAt));
    res.json(rows);
  },
);

router.post(
  "/portal/admin/requests/:id/approve",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    if (!req.portal || req.portal.kind !== "admin") return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const adminId = req.portal.sub;
    try {
      const result = await db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(clientModulesTable)
          .where(eq(clientModulesTable.id, id))
          .for("update")
          .limit(1);
        if (!row) throw new Error("Solicitud no existe");
        if (row.status !== "pendiente") {
          throw new Error(`No se puede aprobar (estado: ${row.status})`);
        }
        const [mod] = await tx
          .select()
          .from(modulesCatalogTable)
          .where(eq(modulesCatalogTable.id, row.moduleId))
          .limit(1);
        if (!mod || mod.active !== 1) throw new Error("Módulo inactivo");

        // Demo gratuita: el módulo se activa sin venta. Mantenemos un
        // registro en `payments` con monto 0 + método "demo" + estado
        // "exonerado" para conservar trazabilidad sin reflejarlo como cobro.
        const [payment] = await tx
          .insert(paymentsTable)
          .values({
            clientId: row.clientId,
            amount: "0.00",
            currency: mod.currency,
            method: "demo",
            status: "exonerado",
            description: `Activación demo módulo ${mod.name}`,
          })
          .returning();

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Retry license key generation on the (very rare) unique collision.
        let updated: typeof row | undefined;
        let lastErr: unknown;
        for (let attempt = 0; attempt < 5; attempt++) {
          const licenseKey =
            row.licenseKey ?? generateLicenseKey(mod.slug);
          try {
            [updated] = await tx
              .update(clientModulesTable)
              .set({
                status: "activo",
                approvedById: adminId,
                paymentId: payment.id,
                activatedAt: now,
                expiresAt,
                licenseKey,
              })
              .where(eq(clientModulesTable.id, id))
              .returning();
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            const code = (err as { code?: string }).code;
            // 23505 = unique_violation — try a fresh key, but only when the
            // request didn't already have one assigned.
            if (code === "23505" && !row.licenseKey) {
              continue;
            }
            throw err;
          }
        }
        if (!updated) {
          throw lastErr ?? new Error("No se pudo emitir la clave de licencia");
        }
        return { row: updated, payment };
      });

      await audit(req, {
        action: "portal.module.approve",
        entityType: "client_module",
        entityId: id,
        meta: { paymentId: result.payment.id },
      });
      res.json(result.row);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      res.status(400).json({ error: msg });
    }
  },
);

router.post(
  "/portal/admin/requests/:id/reject",
  requirePortalAuth,
  requirePortalAdmin,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    try {
      const updated = await db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(clientModulesTable)
          .where(eq(clientModulesTable.id, id))
          .for("update")
          .limit(1);
        if (!row) throw new Error("Solicitud no existe");
        if (row.status !== "pendiente") {
          throw new Error(`No se puede rechazar (estado: ${row.status})`);
        }
        const [u] = await tx
          .update(clientModulesTable)
          .set({ status: "cancelado", cancelledAt: new Date() })
          .where(eq(clientModulesTable.id, id))
          .returning();
        return u;
      });
      await audit(req, {
        action: "portal.module.reject",
        entityType: "client_module",
        entityId: id,
      });
      res.json(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      res.status(400).json({ error: msg });
    }
  },
);

router.get(
  "/portal/admin/clients",
  requirePortalAuth,
  requirePortalAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        id: clientsTable.id,
        name: clientsTable.name,
        company: clientsTable.company,
        industry: clientsTable.industry,
        email: clientsTable.email,
        activeModules: sql<number>`count(case when ${clientModulesTable.status} = 'activo' then 1 end)::int`,
        pendingModules: sql<number>`count(case when ${clientModulesTable.status} = 'pendiente' then 1 end)::int`,
      })
      .from(clientsTable)
      .leftJoin(
        clientModulesTable,
        eq(clientModulesTable.clientId, clientsTable.id),
      )
      .groupBy(clientsTable.id)
      .orderBy(clientsTable.name);
    res.json(rows);
  },
);

export default router;
