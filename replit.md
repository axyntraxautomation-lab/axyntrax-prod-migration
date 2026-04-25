# DASHBOARD SUPREMO AXYNTRAX

## Overview

AXYNTRAX DASHBOARD SUPREMO is an enterprise dashboard for AXYNTRAX AUTOMATION, designed to centralize and streamline business operations. It integrates AI orchestration (AXYN CORE), omnichannel communication, CRM, license management, finance, email automation, and analytics. The project aims to provide a unified platform for managing client interactions, sales funnels, financial transactions, and AI-driven tasks, all within a secure and user-friendly interface. The UI is in Spanish, with a dark-mode default, and branded with the AXYNTRAX logo.

## User Preferences

- "Ninguna implementación sin acuerdo consensuado" — confirm each fase.
- Use simple language for explanations.
- I prefer an iterative development approach.
- Ask before making major changes.
- Do not make changes to folder `lib/db/src/schema`.

## System Architecture

The project is built as a pnpm monorepo using Node.js 24 and TypeScript 5.9.

**UI/UX Decisions:**
- **Branding:** AXYNTRAX logo is consistently displayed.
- **Color Scheme:** Cyan/turquoise primary color on a dark canvas, using TailwindCSS tokens.
- **Language:** UI is entirely in Spanish.
- **No Emojis:** Emojis are explicitly excluded from the UI.
- **Frontend Framework:** React 18 with Vite 7, Wouter for routing, TanStack Query for data fetching, TailwindCSS for styling, shadcn/ui for components, and lucide-react for icons.
- **PWA Features:** Includes `public/manifest.webmanifest`, `public/sw.js`, `use-push.ts` hook, and routes for push notifications.

**Technical Implementations & Design Choices:**
- **API Server:** Express 5, Drizzle ORM, `bcryptjs` for password hashing, `jsonwebtoken` for JWTs, `zod/v4` for validation, `cookie-parser`, and pino for logging.
- **API Codegen:** Orval generates typed React Query hooks (`@workspace/api-client-react`), runtime Zod validators (`@workspace/api-zod`), and shared TS types (`@workspace/api-types`) from `lib/api-spec/openapi.yaml`.
- **Authentication:** JWTs stored in HttpOnly cookies (`axyn_session`) with a 30-day TTL. `bcryptjs` (cost 10) for password hashing. Role-Based Access Control (RBAC) enforced via `requireRole` middleware. Requires `SESSION_SECRET` to start.
- **Two-Factor Authentication (2FA):** TOTP (RFC 6238) using `otplib`, with a base32 secret and QR data URL for setup.
- **Field-Level Encryption:** AES-256-GCM (`lib/crypto.ts`) encrypts sensitive fields like `clients.phone`, `clients.notes`, and `licenses.key`. Encryption key derived from `ENCRYPTION_KEY` (preferred) or `SESSION_SECRET`.
- **AXYN CORE (AI Chat):** SSE endpoint for streaming responses from Claude Sonnet 4.6 (Anthropic) and Gemini 2.5 Flash (Google) via Replit AI integrations. System prompt defines AXYNTRAX persona. `ai_logs` stores hashed prompt details for audit.
- **Omnichannel Inbox:** Manages conversations across `web`, `meta` (Facebook Messenger, Instagram DM), `whatsapp`, and `gmail` channels.
    - `conversationsTable` stores conversation metadata, and `messagesTable` stores individual messages.
    - Webhook receivers for `web`, `meta`, and `whatsapp` handle incoming messages, with signature verification for Meta and WhatsApp.
    - Gmail integration uses Replit's Google Mail integration for sending, but inbound polling is not supported due to scope limitations.
- **Cecilia Suite:** Industry-specific modules managed via `modulesCatalogTable` and `clientModulesTable`. **Demo-only model:** todas las activaciones son demos gratuitas por 30 días, sin cobro. Approval crea `payments` con `amount=0`, `method="demo"`, `status="exonerado"` solo para trazabilidad, asigna `licenseKey` (`AXYN-<MOD>-<HEX12>`) y setea `expires_at = now() + 30 días`. Helper `expireOverdueClientModules(clientId)` corre en `GET /portal/me/modules` y `POST /portal/me/modules/request` para mover demos vencidas a `status="vencido"` y permitir nuevas solicitudes. UI muestra cuenta regresiva por módulo y banner de aviso cuando faltan ≤3 días. Uses Gemini `gemini-2.5-flash` for classification in Gmail automation.
- **Analytics:** Provides an overview of conversations by channel/status, messages per day, financial data, AI usage, and response times, visualized with Recharts.
- **Security:** Implements helmet for HTTP headers, rate limiting (general and auth-specific), and audit logging (`lib/audit.ts`, `audit_log` table) with admin endpoints for backup and audit review.
- **Public Portal:** A separate web artifact (`artifacts/portal`) for client module activation and a lightweight admin section.
    - **Client accounts:** Self-service registration with email + password + first/last name + phone (`POST /portal/auth/register`). Bcrypt-hashed passwords stored on `clients.passwordHash`. Login via `POST /portal/auth/login` with `mode:"client"`.
    - **Admin login:** Email + password with optional TOTP 2FA enforcement (`mode:"admin"`).
    - **Per-module licenses:** Activation is per `clientModulesTable` row. On admin approval, the server generates a unique key (`AXYN-<MODULE>-<HEX12>`) stored in `clientModulesTable.licenseKey` (uniqueIndex). Clients see and copy their key from "Mis módulos". The legacy `licensesTable` is kept only for internal/manual payment tracking.
    - **License PDF certificate:** `lib/pdf.ts` exposes `renderLicensePdf` and the route `GET /portal/me/modules/:id/license-pdf` returns an A4 PDF with AXYNTRAX cyan header, client/module data, license key, expiration and footer signature for printable proof of activation.
    - **Session security:** HttpOnly `axyn_portal` cookie, JWT signed with `SESSION_SECRET`. `requirePortalAuth` re-validates the user/admin on every request and clears the cookie on revocation.
    - **Header:** Top-right shows the logged-in client's name, email and phone (or admin name + email).
- **Hybrid Sales Model (Cotizaciones):** Modules with `monthlyPrice > 0` go through formal quotation; modules with `monthlyPrice = 0` are free 30-day demos. Tables `quotes` + `quote_items`, IGV 18 %, A4 PDF generated by `pdfkit`, optional email delivery via Gmail integration. Endpoints: `POST /portal/quotes`, `GET /portal/quotes`, `GET /portal/quotes/:id/pdf`, `POST /portal/quotes/:id/accept`, `GET /portal/admin/quotes`. Public landing (`/portal/`) hosts a `<SalesBotWidget>` (Cecilia Ventas) backed by `POST /portal/public/sales-bot`; client portal exposes `POST /portal/quote-bot` for in-session quoting.
- **Blindaje y telemetría (admin):**
    - **Anti-brute-force + IP block:** `lib/security.ts` tracks failed logins in-memory keyed by IP/identifier; after 5 attempts in 15 min the IP is added to `ip_blocklist` and a `security_alerts` row is recorded. `getClientIp(req)` uses `req.ip` (Express trust-proxy aware) instead of raw `x-forwarded-for` to avoid spoofing. The in-memory `failedAttempts` map is bounded (10k entries hard cap, 60s sweeper that drops stale entries past the failed-window) to prevent unbounded growth under credential-stuffing storms. PDF buffers in `routes/quotes.ts` are stored in a 100-entry LRU cache rather than an unbounded map.
    - **Admin lockout recovery:** `blocklistGuard` verifies the `axyn_portal` JWT cookie and exempts admins reaching `/api/portal/admin/security*` so a locked-out admin can self-recover (unblock their IP). Brute-force login attempts on `/api/portal/auth/*` remain blocked with no exemption.
    - **Modo blindaje (lockdown):** `kv_settings.lockdown` toggles a global maintenance mode. While active, all `/portal/*` client traffic returns 503 with a Spanish maintenance message; admin routes remain accessible. Toggleable via `POST /portal/admin/security/lockdown`.
    - **Push alerts to admins:** `recordAlert({notifyAdmins:true})` sends a Web Push notification to every admin device subscribed via `push_subscriptions`.
    - **Admin pages:** `/portal/admin/seguridad` (alerts + IP blocks + lockdown switch), `/portal/admin/telemetria` (per-client/module event summary), `/portal/admin/actualizaciones` (publish module updates).
    - **Module updates fanout:** Admin publishes a `module_updates` row; backend fans out a `client_module_updates` entry per active `client_modules` for that module and pushes a notification. Clients see a banner on `/portal/mis-modulos` and apply via `POST /portal/me/updates/:id/apply`.
    - **Soporte IA por módulo (Cecilia Soporte):** `POST /portal/me/modules/:id/support` answers in-context support questions using Gemini 2.5 Flash via `@workspace/integrations-gemini-ai`. The system prompt picks an industry-specific senior-engineer persona; the response is validated with a Zod schema and normalized to `{ reply, steps?, needsHuman? }`. Each call is logged in `ai_logs` and emits a `module_events` row of type `support.replied` for telemetry.

## External Dependencies

- **Database:** Replit-provisioned PostgreSQL.
- **AI Integrations:**
    - Anthropic (Claude Sonnet 4.6) via Replit AI integration.
    - Google Gemini (Gemini 2.5 Flash) via Replit AI integration.
- **Communication Platforms:**
    - Facebook Messenger (via Meta webhooks).
    - Instagram Direct Messages (via Meta webhooks).
    - WhatsApp Cloud API (via WhatsApp webhooks).
    - Gmail (via Replit Google Mail integration).
- **Payment Gateway:** Culqi (planned integration).
- **Tax Authority:** SUNAT (Peru's tax authority, planned integration).
- **Libraries:**
    - `bcryptjs`
    - `jsonwebtoken`
    - `zod/v4`
    - `cookie-parser`
    - `pino`
    - `otplib`
    - `Recharts`