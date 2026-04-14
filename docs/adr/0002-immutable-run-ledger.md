# ADR 0002: Immutable Snapshot and Stage Run Ledger

## Status
Accepted

## Context
The product's trust depends on showing how a recommendation was formed and allowing safe reruns after intake changes. Overwriting records would make the product harder to replay, audit, and debug.

## Decision
- Store intake revisions as immutable decision snapshots.
- Store each analysis execution as an immutable stage run tied to one snapshot.
- Project the current state from the latest snapshot and latest successful stage runs for that snapshot.
- Persist the final recommendation and memo as artifacts tied to the snapshot and stage run that produced them.

## Consequences
- Replay and rerun behavior stays inspectable.
- Downstream invalidation becomes explicit when intake changes.
- The schema is slightly larger, but the product stays more trustworthy.
