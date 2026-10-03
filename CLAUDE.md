@AGENTS.md

<!-- portfolio-context:start -->
# Portfolio Context

## What This Project Is

- Structured intake over blank text boxes
- Server-side staged analysis over one giant prompt
- Immutable snapshots and versioned stage runs for replayability
- Read-only snapshot history for reviewing how recommendations changed over time
- Deterministic recommendation labels from structured factors
- Local SQLite persistence with a private app-data directory
- Local backup creation plus CLI restore support
- Markdown export for the final memo

## Current State

Portfolio truth currently marks this project as `active` with `boilerplate` context. Phase 104 recovered minimum-viable context so future sessions can resume without rediscovery.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod
- SQLite + Drizzle ORM
- Server Actions for mutations
- Playwright + Vitest for verification

## How To Run

1. Install dependencies.
   ```bash
   npm install
   ```
2. Create `.env.local` if you want to override Next.js defaults. Standalone CLI scripts read the shell environment, so export any overrides before running them. Available variables are declared in `src/lib/config/env-schema.ts`.
3. Run migrations and optional seed data.
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Start the app.
   ```bash
   npm run dev
   ```

The app binds to `127.0.0.1` by default. Runtime data is stored outside the repo in a private app-data directory unless you override `DATA_DIR` or `DATABASE_PATH`.

When `APP_ENV=test`, the default app-data directory is `.tmp/app-data`; explicit `DATA_DIR` and `DATABASE_PATH` overrides still take precedence. Test scripts set `.tmp` database paths, and browser checks also set an isolated app-data directory.

## Known Risks

- Localhost-only runtime posture
- Single-user only
- Latest snapshot only for edits and reruns
- Historical snapshots are read-only
- Markdown export only

## Next Recommended Move

Use this context plus the README and supporting docs to resume the next active task, then promote the repo beyond minimum-viable by capturing a dedicated handoff, roadmap, or discovery artifact.

<!-- portfolio-context:end -->
