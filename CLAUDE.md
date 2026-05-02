# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Kovrichat** — SaaS B2B CRM com atendimento multicanal.
Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL + NextAuth v5.

## Commands

```bash
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint

npm run db:generate  # regenerate Prisma client after schema changes
npm run db:push      # push schema to DB without migration (dev only)
npm run db:migrate   # create and apply migration
npm run db:studio    # Prisma Studio GUI
npm run db:seed      # seed demo org + pipeline (admin@demo.com / admin123)
```

## Architecture

### Auth (NextAuth v5)
- Config in `src/lib/auth.ts` — exports `{ handlers, auth, signIn, signOut }`
- Route handler at `src/app/api/auth/[...nextauth]/route.ts`
- Middleware at `src/middleware.ts` protects all routes except `/login`, `/register`, `/api/auth`
- JWT strategy: `organizationId` and `role` are added to token in `jwt` callback and forwarded to `session`
- Registration endpoint: `POST /api/register` (creates Organization + OWNER user atomically)

### Multi-tenancy
- Every data model has `organizationId`. All API routes must filter by `session.user.organizationId`.
- `Organization` stores integration credentials (Meta, Google Ads, Evolution API) per tenant.

### CRM Data Flow
```
Pipeline → Stages (ordered by `order` field) → Opportunities
Opportunity → Contact (1 contact, many opportunities)
Opportunity → Activities (append-only audit log)
```
- Moving a card between stages: PATCH `/api/opportunities/[id]` with `{ stageId, order }`
- Marking WON: POST `/api/opportunities/[id]/won` — logs activity + fires Meta CAPI + Google Ads
- `order` field on Opportunity determines card position within a stage for DnD

### Kanban (Phase 2)
- `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop
- Board state lives in Zustand store at `src/stores/kanban.store.ts`
- Optimistic updates: update store immediately, then PATCH API, rollback on error

### Integrations
| File | Purpose |
|------|---------|
| `src/lib/integrations/meta-capi.ts` | Meta Conversions API — hashes PII before sending |
| `src/lib/integrations/google-ads.ts` | Google Ads offline conversion upload (stub, needs OAuth2) |
| `src/lib/integrations/evolution.ts` | Evolution API client for WhatsApp (V2) |

### API Route conventions
- All routes validate input with Zod schemas from `src/lib/validations/`
- All routes call `rateLimit(req)` at the top — `auth` limiter (5 req/min) for auth endpoints, default `api` (60 req/min) elsewhere
- Auth check: `const session = await auth(); if (!session) return 401`
- Always scope DB queries with `organizationId: session.user.organizationId`

### Real-time (architecture ready, not implemented)
- Socket.io server will attach to the Next.js HTTP server via a custom server file
- `Conversation` + `Message` models are in the schema ready for V2 channels

## Key Files

| Path | What it is |
|------|-----------|
| `prisma/schema.prisma` | Full DB schema — source of truth |
| `src/lib/auth.ts` | NextAuth config with JWT callbacks |
| `src/middleware.ts` | Route protection |
| `src/lib/prisma.ts` | Prisma singleton (avoids hot-reload connections) |
| `src/lib/utils.ts` | `cn()`, `slugify()`, `formatCurrency()` |
| `src/lib/middleware/rate-limit.ts` | Three limiters: `auth`, `api`, `webhooks` |

## Environment Variables

Copy `.env.example` to `.env.local`. Required to run:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — full URL (e.g. `http://localhost:3000`)

Optional (integrations only activate when set):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth login
- `META_PIXEL_ID` / `META_ACCESS_TOKEN` — Meta CAPI conversions
- `GOOGLE_ADS_CONVERSION_ID` / `GOOGLE_ADS_CONVERSION_LABEL` — Google Ads
- `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` — WhatsApp via Evolution

## Security Rules
- Never expose `organizationId` filtering to the client to choose — always derive from session
- Webhook endpoint `POST /api/webhooks/evolution` must verify `HMAC-SHA256` signature against `EVOLUTION_WEBHOOK_SECRET`
- Passwords hashed with `bcrypt` (cost 12)
- All mutation endpoints require authenticated session
