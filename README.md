# Decision Stress Test

Decision Stress Test is a local-first decision workbench for medium-stakes professional choices. It is designed for structured clarity, not open-ended chat. The app turns one decision into a normalized frame, a pre-mortem, a regret analysis, a directional recommendation, and a Markdown decision memo.

## Product shape

- Structured intake over blank text boxes
- Server-side staged analysis over one giant prompt
- Immutable snapshots and stage runs for replayability
- Read-only snapshot history for reviewing how recommendations changed over time
- Deterministic recommendation labels from structured factors
- Local SQLite persistence with a private app-data directory
- Local backup creation plus CLI restore support
- Markdown export for the final memo

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod
- SQLite + Drizzle ORM
- Server Actions for mutations
- Playwright + Vitest for verification

## Local setup

1. Install dependencies.
   ```bash
   npm install
   ```
2. Create `.env.local` if you want to override defaults. Available variables are declared in `src/lib/config/env-schema.ts`.
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

When `APP_ENV=test`, runtime data is isolated under `.tmp/app-data` so tests and browser checks do not write into the real local app-data directory.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run eval:fixtures
npm run doctor
npm run release:check
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:backup
npm run db:status
npm run db:restore -- <backup-file>
npm run smoke:openai
```

## Architecture notes

- Intake revisions create new immutable snapshots.
- Each analysis stage creates an immutable stage run tied to one snapshot.
- Current decision state is projected from the latest snapshot plus the latest successful runs for that snapshot.
- Historical snapshots can be reviewed side by side without reactivating them as the live workbench.
- The workbench derives explicit stage states so blocked, stale, failed, and ready stages are visible in the UI.
- Local backups are written into the runtime backups directory and restores stay CLI-only.
- The app can use the mock provider by default, or OpenAI structured outputs when `AI_PROVIDER=openai` and `AI_ENABLED=true`.
- `npm run doctor` checks whether the local env, paths, and provider configuration are healthy enough to use.
- `npm run release:check` is the canonical local go/no-go gate before calling the app healthy. It now starts with `doctor`, then runs the code, eval, build, and browser checks in a hermetic local test environment.

## Local operator checklist

- Run `npm run doctor` before treating a new machine or env as ready.
- Run `npm run db:backup` before risky local changes or restore drills.
- Run `npm run db:status` to confirm the active SQLite file opens cleanly and to see the latest backup.
- Run `npm run release:check` before calling the local build release-ready.
- Run `npm run smoke:openai` only when you explicitly want to validate live structured-output behavior.

## Runtime data and recovery

- Database: the SQLite file lives in the private app-data directory unless `DATABASE_PATH` overrides it.
- Backups: timestamped SQLite backups live in the `backups` folder under the app-data directory.
- Exports: memo exports live under the runtime exports path when the browser downloads them locally.
- Logs: structured logs are emitted locally through the app process today; the runtime logs directory is reserved for future local file sinks.
- Restore stays CLI-only. Close the app first, then run `npm run db:restore -- <backup-file>`.
- Restore now creates a safety backup first when it replaces an existing live database file.
- The local ledger and its backups intentionally retain the full decision trail: raw intake, stage inputs and outputs, recommendation artifacts, and memo history.

## Provider modes

- Mock mode is the default for normal development, tests, evals, and release checks.
- You do not need an OpenAI key to use the app locally in mock mode.
- OpenAI mode is enabled only when `AI_PROVIDER=openai`, `AI_ENABLED=true`, and `OPENAI_API_KEY` is set.
- `npm run smoke:openai` does not fall back to mock. It fails clearly if the OpenAI env is incomplete.

## Intentional limits

- Localhost-only runtime posture
- Single-user only
- Latest snapshot only for edits and reruns
- Historical snapshots are read-only
- Markdown export only

## Verification

The main local quality gates are:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run eval:fixtures`
- `npm run build`
- `npm run test:e2e`
- `npm run release:check`

## Release readiness

- [Local operator checklist](docs/local-operator-checklist.md)
- [Release readiness checklist](docs/release-readiness-checklist.md)
- [Manual QA for repeated-use flows](docs/manual-qa-repeated-use.md)

## ADRs

- [0001-local-node-runtime](docs/adr/0001-local-node-runtime.md)
- [0002-immutable-run-ledger](docs/adr/0002-immutable-run-ledger.md)
- [Local operator checklist](docs/local-operator-checklist.md)
