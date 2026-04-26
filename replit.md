# DASHBOARD SUPREMO AXYNTRAX

## GOLDEN BASELINE — AXYNTRAX JARVIS

> **Estado base GUARDADO el 26 de abril de 2026.**
> Nombre del baseline: **AXYNTRAX JARVIS**
> Commit: `0938839` ("Restrict module requests to only allow free demos")
> Tag git: `axyntrax-jarvis-gold-v1`
>
> A partir de este punto, este proyecto es la **única fuente de verdad** para la
> página web pública (portal) y el dashboard interno (JARVIS · IA AXYNTRAX) de
> AXYNTRAX AUTOMATION. Toda modificación de UI, branding, módulos, bots de
> ventas, cotizaciones, 2FA y panel admin se hace **aquí**, sobre este baseline.
>
> Para volver a este estado se puede:
> - Restaurar el checkpoint `0938839ba…` desde el panel del proyecto.
> - O ejecutar `git checkout axyntrax-jarvis-gold-v1` para inspeccionar el árbol.

## Overview

AXYNTRAX DASHBOARD SUPREMO is an enterprise dashboard designed to centralize and streamline business operations for AXYNTRAX AUTOMATION. It integrates AI orchestration, omnichannel communication, CRM, license management, finance, email automation, and analytics. The project's main purpose is to provide a unified platform for managing client interactions, sales, financial transactions, and AI-driven tasks within a secure, user-friendly interface. The business vision is to offer a comprehensive solution for companies to manage their entire operational workflow efficiently, leveraging AI and robust communication tools.

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
- **Color Scheme:** Cyan/turquoise primary color on a dark canvas, using TailwindCSS tokens. Features a unified visual language of "aerospace cockpit / AI operations room" with specific tokens for canvas, signature cyan, plasma violet, and display fonts (Space Grotesk, JetBrains Mono).
- **Language:** UI is entirely in Spanish.
- **No Emojis:** Emojis are explicitly excluded from the UI.
- **Frontend Framework:** React 18 with Vite 7, Wouter for routing, TanStack Query for data fetching, TailwindCSS for styling, shadcn/ui for components, and lucide-react for icons. PWA features are included.
- **Shared Primitives:** Custom `GlassCard`, `GradientButton`, `BlueprintBackdrop`, `SectionHeader`, `StatusPill`, `KpiTile`, `JarvisAvatar`, `ChatBubble`, `ChatTypingIndicator`, and `EmptyPremium` components apply a consistent premium look across the public portal and internal dashboard.

**Technical Implementations & Design Choices:**
- **API Server:** Express 5, Drizzle ORM, `bcryptjs` for password hashing, `jsonwebtoken` for JWTs, `zod/v4` for validation, `cookie-parser`, and pino for logging.
- **API Codegen:** Orval generates typed React Query hooks, Zod validators, and shared TS types from `lib/api-spec/openapi.yaml`.
- **Authentication:** JWTs in HttpOnly cookies, 30-day TTL. `bcryptjs` (cost 10) for password hashing. Role-Based Access Control (RBAC) via `requireRole` middleware.
- **Two-Factor Authentication (2FA):** TOTP (RFC 6238) using `otplib` for JARVIS dashboard access, with setup flow including QR code generation. Optional 2FA for client portal admins. Includes an email-OTP fallback (`/api/auth/2fa/email/request`, 6 codes/hour rate limit, `crypto.randomInt` 6-digit code, 10-minute TTL, sha256 + timing-safe verify) delivered via Gmail integration when the user loses access to their authenticator app.
- **JARVIS Dashboard:** Internal rebrand as **JARVIS · IA AXYNTRAX**, serving as the central command for bots, modules, finance, telemetry, and advertising.
- **Advertising Management:** `jarvis_ads` table stores ad campaigns. AI (`lib/jarvis-ads-generator.ts` using Gemini 2.5 Flash) generates ad copy, normalized to JSON. A scheduler (`startJarvisAdScheduler`) runs hourly.
- **CTA Yape:** Direct deposit details for "Yape · Miguel Montero · 991 740 590" are prominently displayed across the dashboard and public portal for all payments.
- **Field-Level Encryption:** AES-256-GCM (`lib/crypto.ts`) encrypts sensitive fields (e.g., client phone numbers, license keys).
- **AXYN CORE (AI Chat):** SSE endpoint for streaming responses from Claude Sonnet 4.6 and Gemini 2.5 Flash. System prompt defines AXYNTRAX persona. `ai_logs` stores hashed prompt details.
- **Omnichannel Inbox:** Manages conversations from web, Meta (Facebook Messenger, Instagram DM), and WhatsApp. `conversationsTable` and `messagesTable` store data. Webhook receivers handle incoming messages with signature verification.
- **JARVIS WhatsApp Auto-reply:** Automatically responds to WhatsApp text messages using Gemini 2.5 Flash, incorporating dynamic knowledge from the `modules_catalog`.
- **Dynamic JARVIS Knowledge:** `lib/jarvis-knowledge.ts` provides `BUSINESS_FACTS` and dynamically built knowledge from the active `modules_catalog`, injected into AXYN CORE, public sales bot, quote bot, and JARVIS WhatsApp.
- **Cecilia Suite (Module Management):** Manages industry-specific modules. Offers 30-day free demos (only for modules with `monthlyPrice = 0` — basic modules) with automated license key generation and expiration tracking; the countdown starts at `activatedAt` and `expiresAt = activatedAt + 30 days`, displayed to clients as "Te quedan X días" with `expireOverdueClientModules` lazily flipping expired rows to status `vencido`. Both the client-side request endpoint (`POST /portal/me/modules/request`) and the admin demo-approval endpoint (`POST /portal/admin/requests/:id/approve`) reject any module with `monthlyPrice > 0` so paid modules are forced through the quote flow. Uses Gemini `gemini-2.5-flash` for classification in Gmail automation.
- **Analytics:** Provides overviews of conversations, messages, financial data, AI usage, and response times, visualized with Recharts.
- **Security:** Helmet for HTTP headers, rate limiting (general and auth-specific), audit logging (`lib/audit.ts`). Features IP blocklist, admin lockout recovery, and a global maintenance mode (`kv_settings.lockdown`).
- **Public Portal:** Separate artifact for client module activation and a lightweight admin section. Includes client accounts with self-service registration, per-module licenses, and PDF license certificate generation.
- **Hybrid Sales Model (Quotes):** Modules with `monthlyPrice > 0` require formal quotation (PDF generation with 18% IGV, single-currency enforcement, optional email delivery via Gmail integration with PDF attachment, in-memory LRU PDF cache, accept-flow generates pending `client_modules` rows in a row-locked transaction). Free 30-day demos for `monthlyPrice = 0`. Public landing includes a `SalesBotWidget` (JARVIS Ventas, public, 20 req/min limit) that renders module recommendation cards and a "Crear cuenta y cotizar" CTA when `ctaQuote` is true; client portal has a `QuoteBot`. Admin tab `/admin/cotizaciones` lists all quotes.
- **JARVIS Live Monitor:** New internal dashboard page with a live event feed (from `ai_logs`, `module_events`, `quotes`, `licenses`, `conversations`, `security_alerts`) and a JARVIS chat that provides real-time context.
- **KeyGen:** Generates 30-character alphanumeric license keys.
- **Module Updates Fanout:** Admin can publish module updates, which are fanned out to active client modules with push notifications.
- **JARVIS Support:** AI-powered support for modules via Gemini 2.5 Flash, with persona tailored per industry.

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
- **Payment Gateway:** Culqi (planned).
- **Tax Authority:** SUNAT (Peru's tax authority, planned).