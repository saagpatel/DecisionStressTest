import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type {
  DecisionIntake,
  DecisionType,
  NormalizedDecision,
  PremortemAnalysis,
  Recommendation,
  RegretAnalysis,
  StageName,
  StageRunStatus,
  SynthesisDraft,
} from "@/lib/domain/decision";

export const decisions = sqliteTable(
  "decisions",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    decisionType: text("decision_type").$type<DecisionType>().notNull(),
    currentStage: text("current_stage").$type<StageName>().notNull(),
    latestSnapshotId: text("latest_snapshot_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("decisions_slug_idx").on(table.slug),
  }),
);

export const decisionSnapshots = sqliteTable(
  "decision_snapshots",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    rawIntakeJson: text("raw_intake_json", { mode: "json" }).$type<DecisionIntake>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    decisionVersionIdx: uniqueIndex("decision_snapshots_version_idx").on(table.decisionId, table.version),
  }),
);

export const stageRuns = sqliteTable(
  "stage_runs",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => decisionSnapshots.id, { onDelete: "cascade" }),
    stage: text("stage").$type<StageName>().notNull(),
    version: integer("version").notNull(),
    status: text("status").$type<StageRunStatus>().notNull(),
    inputJson: text("input_json", { mode: "json" }).notNull(),
    outputJson: text("output_json", { mode: "json" }),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    refusalReason: text("refusal_reason"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    supersededAt: text("superseded_at"),
  },
  (table) => ({
    decisionStageIdx: index("stage_runs_decision_snapshot_stage_idx").on(
      table.decisionId,
      table.snapshotId,
      table.stage,
    ),
    decisionStageVersionIdx: uniqueIndex("stage_runs_stage_version_idx").on(
      table.snapshotId,
      table.stage,
      table.version,
    ),
  }),
);

export const normalizedDecisions = sqliteTable(
  "normalized_decisions",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => decisionSnapshots.id, { onDelete: "cascade" }),
    stageRunId: text("stage_run_id")
      .notNull()
      .references(() => stageRuns.id, { onDelete: "cascade" }),
    payload: text("payload", { mode: "json" }).$type<NormalizedDecision>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    snapshotIdx: uniqueIndex("normalized_decisions_snapshot_idx").on(table.snapshotId),
  }),
);

export const premortemAnalyses = sqliteTable(
  "premortem_analyses",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => decisionSnapshots.id, { onDelete: "cascade" }),
    stageRunId: text("stage_run_id")
      .notNull()
      .references(() => stageRuns.id, { onDelete: "cascade" }),
    payload: text("payload", { mode: "json" }).$type<PremortemAnalysis>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    snapshotIdx: uniqueIndex("premortem_analyses_snapshot_idx").on(table.snapshotId),
  }),
);

export const regretAnalyses = sqliteTable(
  "regret_analyses",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => decisionSnapshots.id, { onDelete: "cascade" }),
    stageRunId: text("stage_run_id")
      .notNull()
      .references(() => stageRuns.id, { onDelete: "cascade" }),
    payload: text("payload", { mode: "json" }).$type<RegretAnalysis>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    snapshotIdx: uniqueIndex("regret_analyses_snapshot_idx").on(table.snapshotId),
  }),
);

export const synthesisDrafts = sqliteTable(
  "synthesis_drafts",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => decisionSnapshots.id, { onDelete: "cascade" }),
    stageRunId: text("stage_run_id")
      .notNull()
      .references(() => stageRuns.id, { onDelete: "cascade" }),
    payload: text("payload", { mode: "json" }).$type<SynthesisDraft>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    snapshotIdx: uniqueIndex("synthesis_drafts_snapshot_idx").on(table.snapshotId),
  }),
);

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => decisionSnapshots.id, { onDelete: "cascade" }),
    stageRunId: text("stage_run_id")
      .notNull()
      .references(() => stageRuns.id, { onDelete: "cascade" }),
    payload: text("payload", { mode: "json" }).$type<Recommendation>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    snapshotIdx: uniqueIndex("recommendations_snapshot_idx").on(table.snapshotId),
  }),
);

export const decisionMemos = sqliteTable(
  "decision_memos",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => decisionSnapshots.id, { onDelete: "cascade" }),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    markdown: text("markdown").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    snapshotIdx: uniqueIndex("decision_memos_snapshot_idx").on(table.snapshotId),
  }),
);
