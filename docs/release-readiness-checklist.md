# Release Readiness Checklist

Use this before calling the local build healthy enough for real decision work.

## Canonical gate

Run:

```bash
npm run doctor
npm run release:check
```

`release:check` now assumes:

- no existing local app server is needed
- the browser suite runs against an isolated E2E app-data and database path
- the localhost-only posture is still enforced

## What must be true

- `doctor` passes with no local-safety issues
- `release:check` passes cleanly from a fresh shell
- the decision routes show clear loading, error, and not-found states
- current versus historical memo state is obvious
- the decision ledger still exposes the backup workflow clearly
- mock mode remains fully usable without an OpenAI key

## Intentional limits

- localhost-only runtime
- single-user only
- latest snapshot only for edits and reruns
- historical snapshots stay read-only
- Markdown export only
- mock mode is the default local operating mode
