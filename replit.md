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
| FASE 3 | Omnichannel inbox webhooks (FB / IG / WA / Web / Gmail)              | **Done**      |
| FASE 4 | Finanzas: Culqi + SUNAT integration, AXIA assistant                  | Pending       |
| FASE 5 | Gmail automation (Cecilia), email orchestration                      | Pending       |
| FASE 6 | Advanced analytics + dashboards                                      | Pending       |
| FASE 7 | PWA + push notifications + offline                                   | Pending       |
| FASE 8 | Hardening, audit logs, deploy + rollout                              | **Done**      |
| Rule   | "Ninguna implementación sin acuerdo consensuado" — confirm each fase | User-enforced |

### Cecilia Suite (modules-by-industry)

Phase-based extension layered inside the dashboard. Each industry (medical,
legal, dental, veterinary, condo, otro) has its own module catalog. Companies
(stored in `clientsTable`) request modules; admins approve, which auto-creates
a pending payment row and sets a 1- or 12-month expiry.

- `lib/db/src/schema/modules.ts` — `modulesCatalogTable` (13 seeded), `clientModulesTable`
- `artifacts/api-server/src/routes/modules.ts` — catalog, industries, request/approve/cancel
- `artifacts/api-server/src/lib/industry-prompts.ts` — Cecilia AI tone per industry
- Dashboard `/modulos` — Catálogo / Por cliente / Solicitudes (admin) tabs

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

### Omnichannel inbox (FASE 3)

- **Schema**: `conversationsTable` is one row per `(channel, externalId)` thread
  with `assignedAgentId`, `status`, `unreadCount`, `lastMessageAt`,
  `lastMessagePreview`, `subject`, `contactName`, `contactHandle`. Each
  `messagesTable` row is `inbound | outbound | system` with optional
  `externalMessageId` and unique-per-conversation index for idempotent replays.
- **Routes**: `GET /api/conversations` (filters: channel, status,
  assignedAgentId), `GET /api/conversations/:id` (returns
  `{conversation, messages}`, also resets `unreadCount`), `POST
  /api/conversations/:id/messages` (agent reply), `/assign`, `/status`,
  `/link-client`. All require auth.
- **Webhook receivers** (`/api/webhooks/*`):
  - `web` — bearer-token public ingress for site forms; body
    `{externalId, name, email, subject, content}`. Bearer:
    `Authorization: Bearer $WEB_FORM_TOKEN`.
  - `meta` — Facebook Messenger + Instagram DM. `GET` does Meta
    `hub.challenge` verification against `META_VERIFY_TOKEN`. `POST`
    requires `x-hub-signature-256` HMAC-SHA256 over the raw body using
    `META_APP_SECRET`. Normalises `entry[].messaging[]` and `entry[].changes[]`.
  - `whatsapp` — same scheme as Meta, env vars
    `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` (fall back to the Meta
    pair if unset).
- **Gmail**: handled via the Replit Google Mail integration. The granted
  scopes are `gmail.send` + `gmail.labels` only, so:
  - **Outbound replies on `channel = "gmail"` conversations are sent
    via `users.messages.send`** (RFC 822, base64url) — message stored
    with `status = "delivered"` and `externalMessageId = "gmail-msg:<id>"`.
  - **Inbound polling is NOT possible** with the current connector scopes.
    `POST /api/inbox/gmail/sync` returns HTTP 503 with a clear explanation;
    receiving Gmail requires either a custom OAuth client with
    `gmail.readonly`/`gmail.modify` or Gmail Push (Pub/Sub).
- **Frontend**: `/inbox` is a two-pane list+detail layout with channel and
  status filters, search, agent timeline (`inbound | outbound | system`),
  reply box (Cmd/Ctrl+Enter to send), assign-to-agent, status change, and
  link-to-CRM. List auto-refreshes every 15 s; open thread every 10 s.

### Bootstrap

The first admin (`axyntraxautomation@gmail.com`) is seeded automatically only
if `ADMIN_BOOTSTRAP_PASSWORD` is set. Sample CRM clients and licenses are
seeded once when the table is empty (development convenience).

### Routes

- API: `/api/auth/*`, `/api/users`, `/api/clients[/:id]`, `/api/licenses[/:id]`, `/api/dashboard/*`, `/api/conversations[/:id/{messages,assign,status,link-client}]`, `/api/webhooks/{web,meta,whatsapp}`, `/api/inbox/gmail/sync`
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
| `WEB_FORM_TOKEN`            | Bearer required by `POST /api/webhooks/web`. Auto-generated on FASE 3 setup. |
| `META_VERIFY_TOKEN`         | Token Meta calls back with on `GET /webhooks/meta?hub.verify_token=…`. |
| `META_APP_SECRET`           | App secret used to verify `x-hub-signature-256` from Meta.             |
| `WHATSAPP_VERIFY_TOKEN`     | Verify token for WhatsApp Cloud API webhook (falls back to META_VERIFY_TOKEN). |
| `WHATSAPP_APP_SECRET`       | HMAC secret for WhatsApp Cloud API (falls back to META_APP_SECRET).    |

## FASE 5-8 (FINAL)

- **FASE 5 — Cecilia (Gmail AI)**: `routes/cecilia.ts` con triage, draft-reply y CRUD de plantillas (owner-scoped). Usa Gemini `gemini-2.5-flash` con `responseMimeType: application/json` para clasificación. Prompts en español, sin emojis.
- **FASE 6 — Analytics avanzados**: `routes/analytics.ts` expone `/api/analytics/overview` con conversaciones por canal/estado, mensajes por día, finanzas por día (30 d), uso de IA y tiempos de respuesta. Página `analytics.tsx` reescrita con Recharts.
- **FASE 7 — PWA + Push**: `public/manifest.webmanifest`, `public/sw.js`, hook `use-push.ts`, `routes/push.ts` y `lib/push.ts`. VAPID se autogenera en `app_settings` la primera vez. Tarjeta de activación en `settings.tsx`.
- **FASE 8 — Seguridad**: helmet + rate-limit (general 600 req/15 min, auth 20 req/15 min), `lib/audit.ts`, tabla `audit_log`, endpoints admin `/api/admin/backup` (export JSON) y `/api/admin/audit` (sólo `requireRole('admin')`).
- **OpenAPI**: paths definidos sin `/api/` (orval añade `baseUrl: /api`); operaciones nuevas siguen la convención `operationId` + `${operationId}Response` evitando colisiones (`CeciliaTriageResult`, `CeciliaDraftResult`).

## See also

- `pnpm-workspace` skill for monorepo conventions.
