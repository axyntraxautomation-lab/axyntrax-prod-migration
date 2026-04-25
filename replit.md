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
| FASE 2 | 2FA, AES-256 of sensitive fields, AXYN CORE (Claude+Gemini) live     | **Done**      |
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
- **2FA (TOTP / RFC 6238, SHA1, 30 s, 6 digits)** via `otplib`. Setup endpoint
  returns a base32 secret + QR data URL; enable confirms a code; login with a
  2FA-enabled account responds `401 { requiresTwofa: true }` on first POST and
  expects `twofaCode` on retry. Frontend pivots to a one-time-code form.

### Field-level encryption

- AES-256-GCM helper (`lib/crypto.ts`): random 12-byte IV per write, 16-byte
  GCM auth tag, payload stored as `enc::<base64(iv+tag+ciphertext)>`.
- Key is derived from `ENCRYPTION_KEY` (preferred) or, with a startup warning,
  from `SESSION_SECRET`. Hardcoded fallback removed; missing key throws.
- Encrypted columns: `clients.phone`, `clients.notes`, `licenses.key`. Read
  paths in `routes/clients.ts` and `routes/licenses.ts` decrypt transparently;
  unencrypted legacy values pass through.

### AXYN CORE chat (`/api/ai/chat`)

- SSE endpoint streaming Claude Sonnet 4.6 (Anthropic) and Gemini 2.5 Flash
  (Google) via the Replit AI integrations proxy (no API keys handled).
- Provider switch in the UI; system prompt establishes the AXYNTRAX persona.
- Aborts: client disconnect (`req.on('close')`) cancels upstream provider
  stream; frontend sends `AbortController.signal` and exposes a Stop button.
- Audit: `ai_logs` rows store **hashed** prompt (16-char SHA-256 prefix +
  length), model, chunk count, response length, latency, abort flag, and
  error message — no plaintext prompt content.

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
| `ENCRYPTION_KEY`            | AES-256-GCM data key (recommended; falls back to SESSION_SECRET).      |
| `ADMIN_BOOTSTRAP_PASSWORD`  | One-time admin seed password (unset after first run; rotate password). |
| `ANTHROPIC_API_KEY`         | Auto-provisioned by the Replit Anthropic integration.                  |
| `GEMINI_API_KEY`            | Auto-provisioned by the Replit Gemini integration.                     |

## See also

- `pnpm-workspace` skill for monorepo conventions.
