# DASHBOARD SUPREMO AXYNTRAX

Enterprise dashboard for **AXYNTRAX AUTOMATION** (Miguel Montero, Arequipa, Perú).
Provides AXYN CORE (AI orchestration), unified inbox, CRM funnel, KeyGen license
management, finance (AXIA / Culqi / SUNAT), Gmail automation (Cecilia),
analytics, and admin tooling. UI is in Spanish, dark-mode by default, branded
with the AXYNTRAX logo throughout.

## Roadmap (8 phases)

| Phase  | Focus                                                                | Status        |
| ------ | -------------------------------------------------------------------- | ------------- |
| FASE 1 | Schema + auth + base UI + CRM/KeyGen + analytics                     | **Done**      |
| FASE 2 | 2FA, AES-256 of sensitive fields, AXYN CORE (Claude+Gemini) live     | Pending       |
| FASE 3 | Omnichannel inbox webhooks (FB / IG / WA / Web / Gmail)              | Pending       |
| FASE 4 | Finanzas: Culqi + SUNAT integration, AXIA assistant                  | Pending       |
| FASE 5 | Gmail automation (Cecilia), email orchestration                      | Pending       |
| FASE 6 | Advanced analytics + dashboards                                      | Pending       |
| FASE 7 | PWA + push notifications + offline                                   | Pending       |
| FASE 8 | Hardening, audit logs, deploy + rollout                              | Pending       |
| Rule   | "Ninguna implementación sin acuerdo consensuado" — confirm each fase | User-enforced |

## Stack

- **Monorepo tool**: pnpm workspaces (Node.js 24, TypeScript 5.9)
- **Frontend** (`artifacts/dashboard`): React 18 · Vite 7 · Wouter · TanStack Query · TailwindCSS · shadcn/ui · lucide-react
- **API** (`artifacts/api-server`): Express 5 · Drizzle ORM · `bcryptjs` · `jsonwebtoken` · `zod/v4` · `cookie-parser` · pino logger
- **Database**: Replit-provisioned PostgreSQL (`DATABASE_URL`)
- **API codegen**: Orval reads `lib/api-spec/openapi.yaml` and generates:
  - `@workspace/api-client-react` — typed React Query hooks
  - `@workspace/api-zod` — runtime Zod validators
  - `@workspace/api-types` — shared TS types

## Architecture

### Data model (`lib/db/src/schema`)

`usersTable`, `sessionsTable`, `clientsTable`, `licensesTable`,
`conversationsTable`, `messagesTable`, `paymentsTable`, `financesTable`,
`emailsTable`, `aiLogsTable`. `users.role` enum: `admin | supervisor | agente`.
`clients.stage` (funnel): `prospecto | demo_activa | negociacion | cliente | renovacion`.
`licenses.type`: `demo | plan_3m | plan_6m | plan_12m | plan_24m | addon`.
`licenses.status`: `activa | pendiente | vencida | cancelada`.

### Auth

- JWT in HttpOnly cookie `axyn_session` (30-day TTL, `SameSite=Lax`,
  `Secure` in production).
- Password hashing with `bcryptjs` (cost 10).
- `requireAuth` middleware loads the user from DB on each request.
- `requireRole(...allowed)` enforces RBAC (e.g. `/users` is `admin | supervisor`).
- `SESSION_SECRET` is **mandatory** at startup — server refuses to boot without it.
- Frontend cookie auth: `customFetch` defaults to `credentials: "include"`.

### Bootstrap

The first admin (`axyntraxautomation@gmail.com`) is seeded automatically only
if `ADMIN_BOOTSTRAP_PASSWORD` is set. Sample CRM clients and licenses are
seeded once when the table is empty (development convenience).

### Routes

- API: `/api/auth/*`, `/api/users`, `/api/clients[/:id]`, `/api/licenses[/:id]`, `/api/dashboard/*`
- Web: `/login`, `/`, `/inbox`, `/crm`, `/crm/:id`, `/keygen`, `/finanzas`, `/email`, `/analytics`, `/axyn-core`, `/settings`

## Branding

- Logo: `/axyntrax-logo.jpeg` (loaded in login, header, sidebar mobile sheet, loading splash).
- Footer (everywhere): `Miguel Montero — Fundador & CEO · axyntrax-automation.com · +51 991 740 590` and `© 2026 AXYNTRAX AUTOMATION`.
- Color: cyan/turquoise primary on dark canvas (Tailwind tokens via `index.css`).
- No emojis anywhere in the UI.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks/zod after editing `openapi.yaml`
- `pnpm --filter @workspace/db run push` — push schema changes (dev)
- Workflows (auto-managed): `artifacts/api-server: API Server`, `artifacts/dashboard: web`

## Required environment variables

| Var                         | Purpose                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`              | Replit-provisioned PostgreSQL                                          |
| `SESSION_SECRET`            | JWT signing secret. **Server refuses to start without it.**            |
| `ADMIN_BOOTSTRAP_PASSWORD`  | One-time admin seed password (unset after first run; rotate password). |

## See also

- `pnpm-workspace` skill for monorepo conventions.
