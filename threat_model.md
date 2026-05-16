# Threat Model

## Project Overview

AXYNTRAX is a pnpm monorepo with a primary Express 5 API (`artifacts/api-server`), two React/Vite frontends (`artifacts/dashboard` for internal staff and `artifacts/portal` for clients), and shared database/codegen libraries under `lib/`. The repository also contains a lightweight legacy Express server under `server/` for local repl runs and older Meta webhook handling, but current autoscale deployment configuration points production at `@workspace/api-server`.

Production assumptions for this scan:
- `NODE_ENV` is `production` when deployed.
- Replit-managed TLS protects client/server traffic in production.
- `artifacts/mockup-sandbox` is dev-only and should not be treated as production-reachable unless proven otherwise.
- `server/` is treated as dev-only / legacy by default because `.replit [deployment].run` starts `@workspace/api-server`; findings there should only be reported if separate production reachability is demonstrated.

## Assets

- **Internal staff accounts and sessions** — dashboard users authenticate with JWT cookies and mandatory 2FA. Compromise gives access to operational, financial, CRM, and messaging data.
- **Portal client accounts and sessions** — client cookies grant access to quotes, module requests, licenses, and profile data. Account takeover can expose customer records and business transactions.
- **Client CRM records** — names, emails, phones, notes, stages, module associations, quotes, and linked conversations. These are commercially sensitive and often contain personal data.
- **Licenses, quotes, and payment records** — license keys, activation windows, quote status, payment status, and finance ledgers directly affect revenue recognition and service entitlement.
- **Inbound and outbound conversation history** — WhatsApp, Facebook, Instagram, Gmail, and web lead messages may contain PII and commercial data.
- **Application secrets and integration credentials** — JWT signing secret, encryption key, Meta tokens/secrets, Gmail connector access, Culqi secrets, and AI provider keys.
- **Encrypted field data** — client phone numbers, notes, and license keys rely on AES-GCM field encryption for confidentiality at rest.

## Trust Boundaries

- **Public browser / portal client to API** — all `/api/portal/public/*`, portal auth, quote, and module-request endpoints receive untrusted input and must enforce authentication and authorization server-side.
- **Internal dashboard user to API** — staff sessions cross into sensitive internal routes for clients, conversations, finances, licenses, payments, security controls, and backups. Roles must be enforced server-side, not just in UI.
- **Public webhook senders to API** — Meta, WhatsApp, Culqi, and web-form ingress endpoints accept traffic from the internet and must authenticate origin before mutating state.
- **API to database** — Express routes have broad write access to business records; authorization failures or forged webhooks can directly alter production data.
- **API to third-party services** — Meta Graph, Gmail, Culqi, Anthropic, and Gemini calls use high-value server-side credentials and must not be triggerable in unsafe ways.
- **Production vs dev-only artifacts** — `artifacts/mockup-sandbox/**` and legacy `server/**` are out of scope unless a production route or deployment path proves reachability.

## Scan Anchors

- **Primary production API:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/index.ts`
- **Primary auth / session code:** `artifacts/api-server/src/lib/auth.ts`, `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/routes/portal.ts`, `artifacts/api-server/src/routes/twofa.ts`
- **Webhook / external integration surfaces:** `artifacts/api-server/src/routes/webhooks.ts`, `artifacts/api-server/src/routes/payments.ts`, `artifacts/api-server/src/lib/culqi.ts`
- **Sensitive business data routes:** `artifacts/api-server/src/routes/clients.ts`, `licenses.ts`, `finances.ts`, `modules.ts`, `quotes.ts`, `security.ts`, `admin.ts`
- **Dev-only areas usually ignored:** `artifacts/mockup-sandbox/**`, `server/**`

## Threat Categories

### Spoofing

The application accepts staff sessions, portal client sessions, and multiple webhook channels. Protected routes must reject forged or stale JWTs, portal identities must only be issued to the rightful client/admin, and every webhook that changes state must verify origin with a real secret or signature. Public routes must never reveal secret material that helps an attacker impersonate a trusted sender or operator.

### Tampering

Payment, finance, quote, license, module, and conversation records are all mutable through HTTP endpoints. The system must ensure only authorized actors can create or modify those records, must make state transitions idempotent where webhooks can retry, and must not allow public or low-privilege users to mark payments successful, alter financial ledgers, or change another customer’s resources.

### Information Disclosure

The codebase stores client PII, license keys, conversation content, and integration secrets. Public endpoints must not expose secrets, verification tokens, internal config state, or excessive customer data. Internal routes should return only what the authenticated role is allowed to see, and encrypted fields must remain unreadable to unauthorized users.

### Denial of Service

Public auth, bot, and webhook endpoints can be hit directly from the internet. The application must keep unauthenticated or attacker-controlled requests from causing unbounded downstream work (AI calls, email sends, third-party API calls, or large DB fan-out), and public endpoints should retain practical rate limits or fail-fast controls where abuse would be expensive.

### Elevation of Privilege

The project has multiple privilege tiers: public, portal client, portal admin, internal staff, supervisor, and admin. Server-side code must enforce those tiers consistently on every sensitive route. Default or low-privilege users must not gain access to customer-wide data, financial controls, security controls, backup exports, or other customers’ portal data through missing role checks, record-claim flows, or ID-based access.
