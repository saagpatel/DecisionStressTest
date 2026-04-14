import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq, max, ne } from "drizzle-orm";

import { logger } from "@/lib/config/logger";
import type {
  DecisionIntake,
  DecisionMemo,
  ExecutableStageName,
  NormalizedDecision,
  PremortemAnalysis,
  Recommendation,
  RegretAnalysis,
  StageName,
  SynthesisDraft,
} from "@/lib/domain/decision";
import { getNextStage } from "@/lib/domain/decision";

import { getDb } from "./client";
import * as schema from "./schema";
import {
  decisionMemos,
  decisions,
  decisionSnapshots,
  normalizedDecisions,
  premortemAnalyses,
  recommendations,
  regretAnalyses,
  stageRuns,
  synthesisDrafts,
} from "./schema";

export type DecisionSnapshotView = {
  decision: typeof decisions.$inferSelect;
  snapshot: typeof decisionSnapshots.$inferSelect | null;
  normalized: NormalizedDecision | null;
  premortem: PremortemAnalysis | null;
  regret: RegretAnalysis | null;
  synthesis: SynthesisDraft | null;
  recommendation: Recommendation | null;
  memo: string | null;
  runs: Array<typeof stageRuns.$inferSelect>;
  isCurrentSnapshot: boolean;
};

function now() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function latestCompletedStageFromPayloads(payloads: {
  normalized: NormalizedDecision | null;
  premortem: PremortemAnalysis | null;
  regret: RegretAnalysis | null;
  synthesis: SynthesisDraft | null;
  recommendation: Recommendation | null;
  memo: string | null;
}): StageName {
  if (payloads.memo) {
    return "memo";
  }

  if (payloads.synthesis || payloads.recommendation) {
    return "synthesis";
  }

  if (payloads.regret) {
    return "regret";
  }

  if (payloads.premortem) {
    return "premortem";
  }

  if (payloads.normalized) {
    return "normalization";
  }

  return "intake";
}

async function getDecisionRecord(decisionId: string) {
  const db = getDb();
  const [decision] = await db.select().from(decisions).where(eq(decisions.id, decisionId));
  return decision ?? null;
}

export async function listDecisions() {
  const db = getDb();
  const rows = await db.select().from(decisions).orderBy(desc(decisions.updatedAt));

  return Promise.all(
    rows.map(async (decision) => {
      const snapshots = await db
        .select({
          id: decisionSnapshots.id,
          version: decisionSnapshots.version,
        })
        .from(decisionSnapshots)
        .where(eq(decisionSnapshots.decisionId, decision.id))
        .orderBy(desc(decisionSnapshots.version));

      const latestSnapshotId = decision.latestSnapshotId ?? snapshots[0]?.id ?? null;
      const [currentRecommendation] = latestSnapshotId
        ? await db.select().from(recommendations).where(eq(recommendations.snapshotId, latestSnapshotId))
        : [];
      const [historicalRecommendation] = latestSnapshotId
        ? await db
            .select({ id: recommendations.id })
            .from(recommendations)
            .where(
              and(
                eq(recommendations.decisionId, decision.id),
                ne(recommendations.snapshotId, latestSnapshotId),
              ),
            )
            .limit(1)
        : [];

      return {
        ...decision,
        snapshotCount: snapshots.length,
        recommendationLabel: currentRecommendation?.payload.label ?? null,
        confidenceLevel: currentRecommendation?.payload.confidenceLevel ?? null,
        isStaleRecommendation: !currentRecommendation && Boolean(historicalRecommendation),
      };
    }),
  );
}

export async function getDecisionSnapshotDetail(decisionId: string, snapshotId: string): Promise<DecisionSnapshotView | null> {
  const db = getDb();
  const decision = await getDecisionRecord(decisionId);
  if (!decision) {
    return null;
  }

  const [snapshot] = await db
    .select()
    .from(decisionSnapshots)
    .where(and(eq(decisionSnapshots.id, snapshotId), eq(decisionSnapshots.decisionId, decisionId)));

  if (!snapshot) {
    return null;
  }

  const [normalized] = snapshot
    ? await db.select().from(normalizedDecisions).where(eq(normalizedDecisions.snapshotId, snapshot.id))
    : [];
  const [premortem] = snapshot
    ? await db.select().from(premortemAnalyses).where(eq(premortemAnalyses.snapshotId, snapshot.id))
    : [];
  const [regret] = snapshot
    ? await db.select().from(regretAnalyses).where(eq(regretAnalyses.snapshotId, snapshot.id))
    : [];
  const [synthesis] = snapshot
    ? await db.select().from(synthesisDrafts).where(eq(synthesisDrafts.snapshotId, snapshot.id))
    : [];
  const [recommendation] = snapshot
    ? await db.select().from(recommendations).where(eq(recommendations.snapshotId, snapshot.id))
    : [];
  const [memo] = snapshot
    ? await db.select().from(decisionMemos).where(eq(decisionMemos.snapshotId, snapshot.id))
    : [];

  const runs = snapshot
    ? await db
        .select()
        .from(stageRuns)
        .where(eq(stageRuns.snapshotId, snapshot.id))
        .orderBy(stageRuns.stage, desc(stageRuns.version))
    : [];

  return {
    decision,
    snapshot,
    normalized: normalized?.payload ?? null,
    premortem: premortem?.payload ?? null,
    regret: regret?.payload ?? null,
    synthesis: synthesis?.payload ?? null,
    recommendation: recommendation?.payload ?? null,
    memo: memo?.markdown ?? null,
    runs,
    isCurrentSnapshot: decision.latestSnapshotId === snapshot.id,
  };
}

export async function getDecisionById(decisionId: string): Promise<(DecisionSnapshotView & { hasHistoricalRecommendation: boolean }) | null> {
  const db = getDb();
  const decision = await getDecisionRecord(decisionId);
  if (!decision) {
    return null;
  }

  if (!decision.latestSnapshotId) {
    return {
      decision,
      snapshot: null,
      normalized: null,
      premortem: null,
      regret: null,
      synthesis: null,
      recommendation: null,
      memo: null,
      runs: [],
      isCurrentSnapshot: false,
      hasHistoricalRecommendation: false,
    };
  }

  const detail = await getDecisionSnapshotDetail(decisionId, decision.latestSnapshotId);
  if (!detail?.snapshot) {
    return detail
      ? {
          ...detail,
          hasHistoricalRecommendation: false,
        }
      : null;
  }

  const [historicalRecommendation] = await db
    .select({ id: recommendations.id })
    .from(recommendations)
    .where(
      and(
        eq(recommendations.decisionId, decisionId),
        ne(recommendations.snapshotId, detail.snapshot.id),
      ),
    )
    .limit(1);

  return {
    ...detail,
    hasHistoricalRecommendation: Boolean(historicalRecommendation),
  };
}

export async function listDecisionSnapshots(decisionId: string) {
  const db = getDb();
  const decision = await getDecisionRecord(decisionId);
  if (!decision) {
    return null;
  }

  const snapshots = await db
    .select()
    .from(decisionSnapshots)
    .where(eq(decisionSnapshots.decisionId, decisionId))
    .orderBy(desc(decisionSnapshots.version));

  const summaries = await Promise.all(
    snapshots.map(async (snapshot) => {
      const payloads = await getSnapshotStagePayloads(snapshot.id);

      return {
        snapshot,
        isCurrentSnapshot: decision.latestSnapshotId === snapshot.id,
        latestCompletedStage: latestCompletedStageFromPayloads(payloads),
        recommendationLabel: payloads.recommendation?.label ?? null,
        confidenceLevel: payloads.recommendation?.confidenceLevel ?? null,
        hasMemo: Boolean(payloads.memo),
        artifacts: {
          normalization: Boolean(payloads.normalized),
          premortem: Boolean(payloads.premortem),
          regret: Boolean(payloads.regret),
          synthesis: Boolean(payloads.synthesis),
        },
      };
    }),
  );

  return {
    decision,
    currentSnapshotId: decision.latestSnapshotId,
    snapshots: summaries,
  };
}

export async function getPreviousSnapshotForDecision(decisionId: string, version: number) {
  const db = getDb();
  if (version <= 1) {
    return null;
  }

  const [snapshot] = await db
    .select()
    .from(decisionSnapshots)
    .where(and(eq(decisionSnapshots.decisionId, decisionId), eq(decisionSnapshots.version, version - 1)))
    .limit(1);

  return snapshot ?? null;
}

export async function createDecision(input: DecisionIntake) {
  const db = getDb();
  const timestamp = now();
  const decisionId = newId("decision");
  const snapshotId = newId("snapshot");
  const slug = `${slugify(input.title)}-${decisionId.slice(-6)}`;

  db.transaction((tx) => {
    tx.insert(decisions).values({
      id: decisionId,
      slug,
      title: input.title,
      decisionType: input.decisionType,
      currentStage: "intake",
      latestSnapshotId: snapshotId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).run();

    tx.insert(decisionSnapshots).values({
      id: snapshotId,
      decisionId,
      version: 1,
      rawIntakeJson: input,
      createdAt: timestamp,
    }).run();
  });

  return decisionId;
}

export async function updateDecisionIntake(decisionId: string, input: DecisionIntake) {
  const db = getDb();
  const [current] = await db
    .select()
    .from(decisionSnapshots)
    .where(eq(decisionSnapshots.decisionId, decisionId))
    .orderBy(desc(decisionSnapshots.version))
    .limit(1);

  if (!current) {
    throw new Error("Decision snapshot not found");
  }

  const timestamp = now();
  const snapshotId = newId("snapshot");

  db.transaction((tx) => {
    tx.insert(decisionSnapshots).values({
      id: snapshotId,
      decisionId,
      version: current.version + 1,
      rawIntakeJson: input,
      createdAt: timestamp,
    }).run();

    tx
      .update(decisions)
      .set({
        title: input.title,
        decisionType: input.decisionType,
        currentStage: "intake",
        latestSnapshotId: snapshotId,
        updatedAt: timestamp,
      })
      .where(eq(decisions.id, decisionId))
      .run();
  });

  return snapshotId;
}

export async function beginStageRun(params: {
  decisionId: string;
  snapshotId: string;
  stage: StageName;
  provider: string;
  model: string;
  promptVersion: string;
  inputJson: unknown;
}) {
  const db = getDb();
  const [current] = await db
    .select({ version: max(stageRuns.version) })
    .from(stageRuns)
    .where(and(eq(stageRuns.snapshotId, params.snapshotId), eq(stageRuns.stage, params.stage)));

  const runId = newId("run");

  await db.insert(stageRuns).values({
    id: runId,
    decisionId: params.decisionId,
    snapshotId: params.snapshotId,
    stage: params.stage,
    version: (current?.version ?? 0) + 1,
    status: "running",
    inputJson: params.inputJson,
    outputJson: null,
    provider: params.provider,
    model: params.model,
    promptVersion: params.promptVersion,
    startedAt: now(),
  }).run();

  return runId;
}

function supersedeStageArtifacts(
  tx: BetterSQLite3Database<typeof schema>,
  snapshotId: string,
  stage: StageName,
) {
  if (stage === "normalization") {
    tx.delete(normalizedDecisions).where(eq(normalizedDecisions.snapshotId, snapshotId)).run();
    return;
  }
  if (stage === "premortem") {
    tx.delete(premortemAnalyses).where(eq(premortemAnalyses.snapshotId, snapshotId)).run();
    return;
  }
  if (stage === "regret") {
    tx.delete(regretAnalyses).where(eq(regretAnalyses.snapshotId, snapshotId)).run();
    return;
  }
  if (stage === "synthesis") {
    tx.delete(synthesisDrafts).where(eq(synthesisDrafts.snapshotId, snapshotId)).run();
    tx.delete(recommendations).where(eq(recommendations.snapshotId, snapshotId)).run();
    tx.delete(decisionMemos).where(eq(decisionMemos.snapshotId, snapshotId)).run();
  }
}

function downstreamStagesFor(stage: ExecutableStageName): StageName[] {
  switch (stage) {
    case "normalization":
      return ["premortem", "regret", "synthesis"];
    case "premortem":
      return ["regret", "synthesis"];
    case "regret":
      return ["synthesis"];
    case "synthesis":
      return [];
  }
}

function invalidateStageAndDownstream(
  tx: BetterSQLite3Database<typeof schema>,
  snapshotId: string,
  stage: ExecutableStageName,
  completedAt: string,
) {
  const affectedStages = [stage, ...downstreamStagesFor(stage)];

  for (const currentStage of affectedStages) {
    tx
      .update(stageRuns)
      .set({
        status: "superseded",
        supersededAt: completedAt,
      })
      .where(
        and(
          eq(stageRuns.snapshotId, snapshotId),
          eq(stageRuns.stage, currentStage),
          eq(stageRuns.status, "succeeded"),
        ),
      )
      .run();

    supersedeStageArtifacts(tx, snapshotId, currentStage);
  }
}

export async function completeStageRun(params:
  | {
      decisionId: string;
      snapshotId: string;
      runId: string;
      stage: "normalization";
      output: NormalizedDecision;
    }
  | {
      decisionId: string;
      snapshotId: string;
      runId: string;
      stage: "premortem";
      output: PremortemAnalysis;
    }
  | {
      decisionId: string;
      snapshotId: string;
      runId: string;
      stage: "regret";
      output: RegretAnalysis;
    }
    | {
      decisionId: string;
      snapshotId: string;
      runId: string;
      stage: "synthesis";
      output: { draft: SynthesisDraft; recommendation: Recommendation; memo: DecisionMemo };
    }) {
  const db = getDb();
  const completedAt = now();

  db.transaction((tx) => {
    invalidateStageAndDownstream(tx, params.snapshotId, params.stage, completedAt);

    tx
      .update(stageRuns)
      .set({
        status: "succeeded",
        outputJson: params.output,
        completedAt,
      })
      .where(eq(stageRuns.id, params.runId))
      .run();

    supersedeStageArtifacts(tx, params.snapshotId, params.stage);

    if (params.stage === "normalization") {
      tx.insert(normalizedDecisions).values({
        id: newId("normalized"),
        decisionId: params.decisionId,
        snapshotId: params.snapshotId,
        stageRunId: params.runId,
        payload: params.output,
        createdAt: completedAt,
      }).run();
    }

    if (params.stage === "premortem") {
      tx.insert(premortemAnalyses).values({
        id: newId("premortem"),
        decisionId: params.decisionId,
        snapshotId: params.snapshotId,
        stageRunId: params.runId,
        payload: params.output,
        createdAt: completedAt,
      }).run();
    }

    if (params.stage === "regret") {
      tx.insert(regretAnalyses).values({
        id: newId("regret"),
        decisionId: params.decisionId,
        snapshotId: params.snapshotId,
        stageRunId: params.runId,
        payload: params.output,
        createdAt: completedAt,
      }).run();
    }

    if (params.stage === "synthesis") {
      tx.insert(synthesisDrafts).values({
        id: newId("synthesis"),
        decisionId: params.decisionId,
        snapshotId: params.snapshotId,
        stageRunId: params.runId,
        payload: params.output.draft,
        createdAt: completedAt,
      }).run();

      const recommendationId = newId("recommendation");
      tx.insert(recommendations).values({
        id: recommendationId,
        decisionId: params.decisionId,
        snapshotId: params.snapshotId,
        stageRunId: params.runId,
        payload: params.output.recommendation,
        createdAt: completedAt,
      }).run();

      tx.insert(decisionMemos).values({
        id: newId("memo"),
        decisionId: params.decisionId,
        snapshotId: params.snapshotId,
        recommendationId,
        markdown: params.output.memo.markdown,
        createdAt: completedAt,
      }).run();
    }

    tx
      .update(decisions)
      .set({
        currentStage: getNextStage(params.stage),
        updatedAt: completedAt,
      })
      .where(eq(decisions.id, params.decisionId))
      .run();
  });
}

export async function failStageRun(params: {
  runId: string;
  decisionId: string;
  errorCode: string;
  errorMessage: string;
  refusalReason?: string | null;
}) {
  const db = getDb();
  logger.warn("stage_run_failed", {
    decisionId: params.decisionId,
    runId: params.runId,
    errorCode: params.errorCode,
  });

  await db
    .update(stageRuns)
    .set({
      status: "failed",
      completedAt: now(),
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      refusalReason: params.refusalReason ?? null,
    })
    .where(eq(stageRuns.id, params.runId))
    .run();
}

export async function getLatestSnapshot(decisionId: string) {
  const db = getDb();
  const [snapshot] = await db
    .select()
    .from(decisionSnapshots)
    .where(eq(decisionSnapshots.decisionId, decisionId))
    .orderBy(desc(decisionSnapshots.version))
    .limit(1);

  return snapshot ?? null;
}

export async function getSnapshotStagePayloads(snapshotId: string) {
  const db = getDb();
  const [normalized] = await db
    .select()
    .from(normalizedDecisions)
    .where(eq(normalizedDecisions.snapshotId, snapshotId));
  const [premortem] = await db
    .select()
    .from(premortemAnalyses)
    .where(eq(premortemAnalyses.snapshotId, snapshotId));
  const [regret] = await db
    .select()
    .from(regretAnalyses)
    .where(eq(regretAnalyses.snapshotId, snapshotId));
  const [synthesis] = await db
    .select()
    .from(synthesisDrafts)
    .where(eq(synthesisDrafts.snapshotId, snapshotId));
  const [recommendation] = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.snapshotId, snapshotId));
  const [memo] = await db
    .select()
    .from(decisionMemos)
    .where(eq(decisionMemos.snapshotId, snapshotId));

  return {
    normalized: normalized?.payload ?? null,
    premortem: premortem?.payload ?? null,
    regret: regret?.payload ?? null,
    synthesis: synthesis?.payload ?? null,
    recommendation: recommendation?.payload ?? null,
    memo: memo?.markdown ?? null,
  };
}

export async function getSnapshotById(snapshotId: string) {
  const db = getDb();
  const [snapshot] = await db
    .select()
    .from(decisionSnapshots)
    .where(eq(decisionSnapshots.id, snapshotId));
  return snapshot ?? null;
}
