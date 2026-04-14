# Manual QA — Repeated-Use Flows

Run this checklist after the automated gate if you want a human confidence pass.

## 1. Clean start

- Open the home page.
- Confirm mock mode is visible.
- Confirm the skip link appears on keyboard focus.
- Confirm starter examples are available.

## 2. Create and complete one decision

- Start from an example or a blank decision.
- Complete all stages.
- Confirm the workbench shows the recommendation state clearly.
- Open the memo and confirm:
  - current snapshot state is explicit
  - analysis source is visible
  - export is available

## 3. Revise the intake and inspect history

- Save a new intake revision.
- Confirm the workbench makes the stale recommendation state obvious.
- Open history.
- Confirm:
  - current and historical snapshots are clearly separated
  - comparison wording is understandable
  - an older snapshot still reads as explicitly historical

## 4. Verify local safety controls

- Open the decision ledger page.
- Confirm the backup panel is easy to find.
- Create a local backup.
- Confirm the latest backup filename and time update on the page.

## 5. Check route-state behavior

- Navigate between decision pages and confirm there is meaningful loading feedback.
- Force a missing decision URL and confirm the not-found view is understandable.
- Confirm the decision navigation remains clear and the active destination is obvious.
