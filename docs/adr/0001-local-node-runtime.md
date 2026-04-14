# ADR 0001: Local Node Runtime Only

## Status
Accepted

## Context
The product stores medium-stakes professional decision data locally and uses SQLite plus server-side analysis orchestration. Edge runtimes and remote-first assumptions would complicate storage, trust boundaries, and operational clarity.

## Decision
- Run all storage and analysis paths on the Next.js `nodejs` runtime.
- Bind local development and local production to `127.0.0.1`.
- Reject non-local requests unless the unsafe override flag is explicitly enabled.

## Consequences
- SQLite and other Node-only dependencies remain viable.
- The app stays aligned with the v1 single-user, local-first posture.
- Hosted deployment is intentionally deferred until a later decision point.
