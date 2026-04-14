# Local Operator Checklist

Use this checklist before treating the local build as healthy enough for real decision work.

## 1. Confirm local readiness

```bash
npm run doctor
```

This checks:

- environment parsing
- writable app-data and backup locations
- database parent path readiness
- provider configuration coherence
- local safety posture, including localhost-only enforcement and live data placement outside the repo

## 2. Protect the current ledger

```bash
npm run db:backup
npm run db:status
```

Use a backup before risky local changes, restore drills, or dependency upgrades.

`db:status` shows:

- app-data directory
- database path
- backups directory
- SQLite quick-check result
- latest backup timestamp

## 3. Run the local release gate

```bash
npm run release:check
```

This runs:

- `npm run doctor`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run eval:fixtures`
- `npm run build`
- `CI=1 npm run test:e2e`

## 4. Validate the live provider only when needed

```bash
npm run smoke:openai
```

This is optional and only for explicit live-provider validation.

Requirements:

- `AI_PROVIDER=openai`
- `AI_ENABLED=true`
- `OPENAI_API_KEY` set

The smoke path stays isolated in the test app-data area and does not silently fall back to mock.

## 5. Restore safely

```bash
npm run db:restore -- <backup-file>
```

Rules:

- close the app first
- use a known-good backup file
- restore remains CLI-only
- a safety backup is created before an existing live database is replaced

## Runtime notes

- Localhost-only by default
- Single-user only
- Historical snapshots are read-only
- Markdown export only
- Structured logs are local process output today
- The SQLite ledger and local backups retain the full decision trail unless you explicitly clear or replace the local data.
