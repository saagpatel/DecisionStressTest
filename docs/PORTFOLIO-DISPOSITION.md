# Decision Stress Test — Portfolio Disposition

**Status:** Release Frozen (static-host, Next.js + SQLite) — Next.js
App Router + TypeScript + Tailwind + **SQLite + Drizzle ORM** +
**Server Actions** + Playwright + Vitest local-first decision
workbench on `origin/main`. Single substantive feat commit
(`cbc31d7 feat(decisions): ship local decision workbench`) on top
of a Create Next App scaffold. **Ninth static-host cluster member**;
**second Next.js+SQLite sub-shape member** (alongside Devil's
Advocate) — confirms that sub-shape is a real pattern, not one-off.
**Fourth cluster member with Playwright E2E pattern** (after
Premise, Signal & Noise, Sovereign) — Playwright recurrence
continues.

> Disposition uses strict `origin/main` verification.
> **Confirms Next.js+SQLite sub-shape** at 2 members.

---

## Verification posture

Only `origin` (`saagpatel/DecisionStressTest`). Clean.

`origin/main`:

- Tip: `cbc31d7` feat(decisions): ship local decision workbench
- Only 2 commits:
  - `cbc31d7` feat(decisions): ship local decision workbench
  - `1c5509f` Initial commit from Create Next App
- Tree: `next.config.ts`, `drizzle.config.ts`, `playwright.config.ts`,
  `eslint.config.mjs`, `postcss.config.mjs`, `package.json`, `src/`,
  `scripts/`, `docs/`, `public/`
- Default branch: `main`

The two-commit history is striking: Create Next App scaffold +
one monolithic feature commit. Like NetworkDecoder
(`f00362d feat: complete Network Protocol Decoder (Phases 0-4)`)
and LifeCadenceLedger (`389bc68 feat: Life Cadence Ledger v1.0`) —
**monolithic feat commit pattern**, now seen in 3 cluster
members across signing + static-host clusters. Worth recognizing
as a cluster-wide pattern.

---

## Current state in one paragraph

Decision Stress Test is a Next.js App Router + TypeScript +
SQLite + Drizzle ORM **local-first decision workbench for
medium-stakes professional choices**. Workflow: structured intake
(not blank text boxes) → server-side staged analysis (not one
giant prompt) → **frame + pre-mortem + regret analysis +
directional recommendation + Markdown decision memo**. Notable
architectural choices: **immutable snapshots and stage runs for
replayability**, read-only snapshot history for reviewing how
recommendations changed over time, deterministic recommendation
labels from structured factors, **local SQLite persistence with a
private app-data directory**, local backup creation plus CLI
restore support, Markdown export for the final memo. Server
Actions handle mutations (not API routes). Playwright + Vitest
verify the workflow.

---

## Why "Release Frozen (static-host, Next.js + SQLite)" — ninth cluster member, second Next.js+SQLite sub-shape

The Next.js + SQLite sub-shape introduced by Devil's Advocate
(R16.1) now has a second member, confirming the sub-shape is real:

| Member | SQLite library | Mutation style | E2E | Distribution blocker |
|---|---|---|---|---|
| Devil's Advocate | Raw SQLite | API routes | Vitest | **Vercel serverless** (SQLite incompatibility) |
| **Decision Stress Test** | **Drizzle ORM** | **Server Actions** | **Playwright + Vitest** | **Vercel serverless** (same incompatibility) |

Both share the **Vercel deployment blocker** — SQLite needs
persistent disk that Vercel serverless functions don't provide.
Both have the same three resolution paths:
- Stateful host (Railway / Fly / Render)
- LibSQL on Turso (drop-in SQLite-compatible)
- Migrate SQLite → Postgres (more effort)

The differences:
- DST uses **Drizzle ORM** (typed, migration-friendly) — easier
  Postgres migration path
- DST uses **Server Actions** (Next.js 13+ feature) — more
  cohesive Next.js idiomatic style
- DST has **Playwright E2E** (4th cluster member with this
  pattern)

The Next.js+SQLite sub-shape is now operationally trusted.
Future Next.js apps with local-first SQLite persistence batch
here.

---

## Cluster taxonomy update

| Cluster | Count | Sub-shapes |
|---|---|---|
| **Static-host (web)** | **9** | PWA / static SPA (5) / SSR+Supabase / **Next.js+SQLite (2)** |
| (others unchanged) | | |

Static-host cluster at 9. Next.js+SQLite sub-shape: 2 members.
Playwright E2E pattern: 4 of 9 cluster members (44% adoption).

---

## Unblock trigger (operator)

Same as Devil's Advocate (Next.js + SQLite sub-shape blocker):

1. **Decide SQLite deployment posture.** Recommended:
   - **LibSQL on Turso**: minimal code change (Drizzle ORM
     supports LibSQL via `drizzle-orm/libsql`); cheapest
     migration path.
   - **Stateful host** (Railway / Fly): keeps Drizzle SQLite
     adapter as-is; adds infrastructure cost.
   - **Postgres on Vercel Postgres / Supabase / Neon**:
     Drizzle has Postgres adapter; rewrites schema slightly;
     unlocks Vercel deploy.
2. **Local backup + CLI restore** — verify the documented backup
   path works on a fresh install.
3. **Markdown export** — verify Markdown memo output renders in
   common viewers (Obsidian, Notion, GitHub).
4. **Playwright E2E green** before announce.

Estimated operator time: ~4-6 hours (SQLite decision dominant).

---

## Portfolio operating system instructions

| Aspect | Posture |
|---|---|
| Portfolio status | `Release Frozen (static-host, Next.js + SQLite)` |
| Distribution channel | **Stateful web host** (NOT pure Vercel without SQLite migration) |
| Review cadence | Suspend overdue counting |
| Resurface conditions | (a) SQLite deployment decision, (b) Drizzle ORM major version, (c) Server Actions API change, (d) v1.1 scope |
| Co-batch with | Static-host cluster — **now 9 repos** |
| Sub-shape | **Next.js + local SQLite** (2nd member with this sub-shape; pattern confirmed) |
| Special concern | **SQLite + Vercel serverless incompatibility** — same as Devil's Advocate. Resolve before deploying. |
| Special concern | **Drizzle ORM migrations** — verify migration strategy for v1.1+ schema changes. |
| Special concern | **Local backup CLI restore** — verify path on fresh install. |
| Special concern | **Monolithic feat commit pattern** (`cbc31d7` ships entire workbench in one commit) — 3rd cluster member with this pattern (after NetworkDecoder + LifeCadenceLedger). |

---

## Reactivation procedure

1. Verify branch tracking.
2. Review stash `r17-dst-stash` (CLAUDE.md mod only).
3. **Decide SQLite deployment posture** before any further work.
4. Run Drizzle migration `drizzle-kit push` or equivalent.
5. Run Playwright E2E.
6. Run Vitest unit tests.
7. Test local backup + CLI restore on a fresh install.
8. Verify Markdown memo export renders in target viewer.

---

## Last known reference

| Field | Value |
|---|---|
| `origin/main` tip | `cbc31d7` feat(decisions): ship local decision workbench |
| Default branch | `main` |
| Build system | Next.js App Router + TypeScript + Tailwind + **Drizzle ORM** + SQLite + **Server Actions** + Playwright + Vitest |
| Phases shipped | Single monolithic feat commit (workbench) on Create Next App scaffold |
| Distribution channel | **Stateful host required** (not pure Vercel without SQLite migration) |
| Distinguishing tech | **Drizzle ORM** + **Server Actions** + **immutable snapshots** + staged analysis (frame + pre-mortem + regret + recommendation + Markdown memo) + local backup + CLI restore + deterministic recommendation labels |
| Blocker | **SQLite deployment posture decision** (same as Devil's Advocate) |
| Migration state | No `legacy-origin` remote |
| Distinguishing feature | **Ninth static-host cluster member; second Next.js+SQLite sub-shape member.** Confirms sub-shape is real pattern. Fourth cluster member with Playwright E2E (44% adoption). Third cluster member with monolithic feat commit pattern. |
