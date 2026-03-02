# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Payload CMS 3.77.0 headless CMS on Cloudflare Workers, using Next.js 15 (App Router), Cloudflare D1 (SQLite), and R2 (file storage). Requires **paid Workers plan** due to bundle size limits.

## Commands

| Task | Command |
|---|---|
| Dev server (port 3006) | `pnpm dev` |
| Clean dev (wipes .next/.open-next) | `pnpm devsafe` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| All tests | `pnpm test` |
| Integration tests (Vitest) | `pnpm test:int` |
| Single integration test | `pnpm test:int -- tests/int/api.int.spec.ts` |
| E2E tests (Playwright) | `pnpm test:e2e` |
| Single e2e test | `pnpm test:e2e -- tests/e2e/admin.e2e.spec.ts` |
| Generate types (Payload + Cloudflare) | `pnpm generate:types` |
| Generate Payload types only | `pnpm run generate:types:payload` |
| Regenerate import map | `pnpm generate:importmap` |
| Create migration | `pnpm payload migrate:create` |
| Deploy (migrations + app) | `pnpm run deploy` |
| TypeScript check | `npx tsc --noEmit` |
| Cloudflare auth | `pnpm wrangler login` |

## Architecture

### Route Groups

```
src/app/(frontend)/    # Public-facing pages (layout.tsx, page.tsx)
src/app/(payload)/     # Admin panel (auto-generated, /admin routes)
src/app/my-route/      # Example custom API route
```

### Collections

- **Users** (`src/collections/Users.ts`) — Auth-enabled, JWT authentication
- **Media** (`src/collections/Media.ts`) — R2 uploads, no crop/focal point (Workers limitation), public read access

### Data Flow

- `src/payload.config.ts` — Main config: D1 adapter, R2 storage, Lexical editor, custom Cloudflare logger (production only)
- `src/payload-types.ts` — Auto-generated types (run `generate:types` after schema changes)
- `src/app/(payload)/admin/importMap.js` — Auto-generated component map (run `generate:importmap` after adding/modifying components)

### Cloudflare Bindings (wrangler.jsonc)

- D1 database: `cloudbac-conto`
- R2 bucket: `cloudbac-conto`
- Environment accessed via `getCloudflareContext()` in payload.config.ts

### Testing

- **Integration** (`tests/int/*.int.spec.ts`): Vitest + jsdom, setup in `vitest.config.mts`
- **E2E** (`tests/e2e/*.e2e.spec.ts`): Playwright, Chromium only, tests against dev server
- **Helpers**: `tests/helpers/login.ts` (admin login), `tests/helpers/seedUser.ts` (test user seeding)

## Key Payload Patterns

### Security-Critical

1. **Local API bypasses access control by default** — always set `overrideAccess: false` when passing `user`
2. **Always pass `req` to nested operations in hooks** — maintains transaction atomicity
3. **Custom endpoints are NOT authenticated by default** — check `req.user` explicitly
4. **Use `context` flags to prevent infinite hook loops** when hooks trigger operations on the same collection

### Code Generation

- Run `pnpm generate:types` after any collection/global schema change
- Run `pnpm generate:importmap` after adding or modifying admin panel components
- Component paths in config are string file paths (not imports), relative to `importMap.baseDir`

### Admin Components

- All components are **Server Components by default** — add `'use client'` only when needed (state, effects, event handlers)
- Import from `@payloadcms/ui` in admin panel; use deep imports (`@payloadcms/ui/elements/Button`) in frontend

## Code Style

- **No semicolons**, single quotes, trailing commas, 100-char print width (see `.prettierrc.json`)
- ESLint flat config (`eslint.config.mjs`): extends `next/core-web-vitals` and `next/typescript`
- `@typescript-eslint` rules set to warn (not error) for `ban-ts-comment`, `no-explicit-any`, `no-unused-vars`
- Path aliases: `@/*` → `./src/*`, `@payload-config` → `./src/payload.config.ts`

## Cursor Rules Reference

Extensive Payload CMS development guides are available in `.cursor/rules/` covering collections, fields, access control, hooks, endpoints, components, queries, adapters, plugins, and security patterns. The `AGENTS.md` file at the repo root contains comprehensive Payload patterns and examples.
