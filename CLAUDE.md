# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About this project

<PROJECT_DESCRIPTION>

## Next.js 16 — read the bundled docs first

This repo runs **Next.js 16** with breaking changes from earlier versions. Conventions, file names, and APIs may differ from training data. Before writing or modifying any Next.js code, read the relevant guide in `apps/web/node_modules/next/dist/docs/`. Heed deprecation notices.

Notable rename: `middleware.ts` is now `proxy.ts` (`apps/web/src/proxy.ts`). Do not recreate `middleware.ts`.

## UI components

Use **shadcn/ui** components for all UI work. Before building a custom component, check whether shadcn already has one (`apps/web/src/components/ui/`). Add missing shadcn components with `npx shadcn@latest add <component>` from inside `apps/web/`.

## Layout

- `apps/web/` — the Next.js app (App Router, Turbopack). The only workspace.
- `infrastructure/` — Terraform managing Auth0 resources.
- `apps/web/CLAUDE.md` and `apps/web/AGENTS.md` — additional rules scoped to the web app.

npm workspaces: root `package.json` declares `apps/*`. Most root scripts proxy into `apps/web` via `-w`.

## Common commands

Run from the repo root unless noted:

```bash
make bootstrap-repo       # one-time: substitutes <APP_NAME>, <APP_NAME_DISPLAY>, <APP_DOMAIN>, <AUTH0_DOMAIN>
npm install
npm run db:up             # docker compose up -d (local Postgres)
npm run db:migrate        # prisma migrate dev (in apps/web)
npm run db:generate       # prisma generate
npm run db:studio
npm run dev               # next dev on $WEB_PORT (default 3000)
npm run build             # builds all workspaces
npm run infra:up:prod     # terraform apply with prod tfvars
```

Lint runs inside the workspace: `npm run lint -w apps/web`. There is **no test runner configured** — do not assume one.

## Environment

`.env` lives at the **repo root**, not in `apps/web/`. Both `apps/web/next.config.ts` and `apps/web/prisma.config.ts` explicitly load `../../.env` via `dotenv`. Adding new env vars means setting them in the root `.env`; nothing under `apps/web` will pick them up otherwise.

See `.env.example` for required vars (Auth0 credentials, `AUTH_SECRET`, `DATABASE_URL`).

## Auth flow (next-auth v5 + Auth0)

- `apps/web/src/auth.ts` — `NextAuth({...})` config. The `callbacks.authorized` callback is what enforces auth: it returns `true` for authenticated requests or a `NextResponse.redirect(...)` to the login route for everyone else.
- `apps/web/src/proxy.ts` — minimal `export { auth as proxy }` passthrough plus a matcher (`/dashboard/:path*`). The redirect logic is **not** here; it's in `authorized`. Don't move it back.
- `apps/web/src/app/api/auth/login/route.ts` — calls `signIn('auth0', { redirectTo: callbackUrl })`. The proxy's `authorized` callback redirects unauthenticated traffic here, preserving the original path as `?callbackUrl=`.
- `apps/web/src/app/api/auth/[...nextauth]/route.ts` — standard next-auth handlers.

## Database / Prisma

- Schema: `apps/web/prisma/schema.prisma`.
- The Prisma client is generated to `apps/web/src/generated/prisma` (custom output path) and imported as `@/generated/prisma` — not from `@prisma/client`. After cloning or schema changes, run `npm run db:generate` or imports will fail to resolve.
- `apps/web/src/lib/db.ts` exports a singleton `db`, with the standard Next.js dev-mode `globalThis` cache to avoid multiple clients during HMR.

## TypeScript config quirk

The **root `tsconfig.json` sets `"declaration": true`** (library-style). `apps/web/tsconfig.json` deliberately overrides this with `"declaration": false`. Keep the override: `next-auth` does not re-export some internal types referenced in inferred signatures of `auth`, so declaration emit fails on `apps/web/src/auth.ts` and re-exports of it. If you see errors like *"The inferred type of X cannot be named without a reference to ..."*, check that this override is intact rather than casting.

## Infrastructure

`infrastructure/` is Terraform managing Auth0 (provider configured in `main.tf`). It depends on a hand-created Auth0 Machine-to-Machine app with Management API scopes — see the README for the exact scope list. Outputs (`AUTH_AUTH0_ID`, `AUTH_AUTH0_ISSUER`) feed back into the root `.env`. The client secret is only available in the Auth0 dashboard.
