import { afterEach, describe, expect, test, vi } from "vitest";
import { desc, eq } from "drizzle-orm";

import { StageExecutionError } from "@/lib/analysis/errors";
import { runStage } from "@/lib/analysis/pipeline";
import { db } from "@/lib/db/client";
import {
  createDecision,
  getDecisionById,
  getDecisionSnapshotDetail,
  getSnapshotById,
  getSnapshotStagePayloads,
  getLatestSnapshot,
  getPreviousSnapshotForDecision,
  listDecisionSnapshots,
  updateDecisionIntake,
} from "@/lib/db/repositories";
import { decisionMemos, decisionSnapshots } from "@/lib/db/schema";
import { decisionIntakeSchema } from "@/lib/domain/decision";
import * as providerModule from "@/lib/ai/provider";
import { mockProvider } from "@/lib/ai/mock-provider";

import { careerDecision } from "../fixtures/career-decision";

describe("decision pipeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("creates a replayable decision flow with a memo", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");
    await runStage(decisionId, "synthesis");

    const detail = await getDecisionById(decisionId);

    expect(detail?.normalized?.decisionFrame).toContain(careerDecision.whyThisMatters);
    expect(detail?.premortem?.risks.length).toBeGreaterThanOrEqual(3);
    expect(detail?.regret?.killCriteria.length).toBeGreaterThanOrEqual(2);
    expect(detail?.recommendation?.label).toBeTruthy();
    expect(detail?.memo).toContain("## Recommendation");
  });

  test("rerunning normalization invalidates downstream artifacts for the same snapshot", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");
    await runStage(decisionId, "synthesis");
    await runStage(decisionId, "normalization");

    const detail = await getDecisionById(decisionId);

    expect(detail?.decision.currentStage).toBe("premortem");
    expect(detail?.normalized).toBeTruthy();
    expect(detail?.premortem).toBeNull();
    expect(detail?.regret).toBeNull();
    expect(detail?.synthesis).toBeNull();
    expect(detail?.recommendation).toBeNull();
    expect(detail?.memo).toBeNull();

    const supersededRunsByStage = new Map(
      detail?.runs
        .filter((run) => run.status === "superseded")
        .map((run) => [run.stage, run]) ?? [],
    );

    expect(supersededRunsByStage.has("premortem")).toBe(true);
    expect(supersededRunsByStage.has("regret")).toBe(true);
    expect(supersededRunsByStage.has("synthesis")).toBe(true);
  });

  test("rerunning premortem clears only downstream artifacts for the same snapshot", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");
    await runStage(decisionId, "synthesis");
    await runStage(decisionId, "premortem");

    const detail = await getDecisionById(decisionId);
    const supersededRunsByStage = new Map(
      detail?.runs
        .filter((run) => run.status === "superseded")
        .map((run) => [run.stage, run]) ?? [],
    );

    expect(detail?.decision.currentStage).toBe("regret");
    expect(detail?.normalized).toBeTruthy();
    expect(detail?.premortem).toBeTruthy();
    expect(detail?.regret).toBeNull();
    expect(detail?.synthesis).toBeNull();
    expect(detail?.recommendation).toBeNull();
    expect(detail?.memo).toBeNull();
    expect(supersededRunsByStage.has("regret")).toBe(true);
    expect(supersededRunsByStage.has("synthesis")).toBe(true);
  });

  test("rerunning regret clears synthesis outputs for the same snapshot", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");
    await runStage(decisionId, "synthesis");
    await runStage(decisionId, "regret");

    const detail = await getDecisionById(decisionId);
    const supersededRunsByStage = new Map(
      detail?.runs
        .filter((run) => run.status === "superseded")
        .map((run) => [run.stage, run]) ?? [],
    );

    expect(detail?.decision.currentStage).toBe("synthesis");
    expect(detail?.normalized).toBeTruthy();
    expect(detail?.premortem).toBeTruthy();
    expect(detail?.regret).toBeTruthy();
    expect(detail?.synthesis).toBeNull();
    expect(detail?.recommendation).toBeNull();
    expect(detail?.memo).toBeNull();
    expect(supersededRunsByStage.has("synthesis")).toBe(true);
  });

  test("persists semantic-invalid stage failures without creating artifacts", async () => {
    const intake = decisionIntakeSchema.parse(careerDecision);
    const decisionId = await createDecision(intake);

    await runStage(decisionId, "normalization");

    const normalized = await mockProvider.normalize(intake);
    vi.spyOn(providerModule, "getAiProvider").mockReturnValue({
      ...mockProvider,
      async premortem() {
        const validPremortem = await mockProvider.premortem({ intake, normalized });
        return {
          ...validPremortem,
          mitigations: validPremortem.mitigations.map((mitigation, index) =>
            index === 0
              ? {
                  ...mitigation,
                  riskTitle: "Nonexistent risk",
                }
              : mitigation,
          ),
        };
      },
    });

    await expect(runStage(decisionId, "premortem")).rejects.toThrow(
      "The pre-mortem returned inconsistent risks, assumptions, or mitigations.",
    );

    const detail = await getDecisionById(decisionId);
    const latestPremortemRun = detail?.runs.find((run) => run.stage === "premortem");

    expect(detail?.premortem).toBeNull();
    expect(detail?.decision.currentStage).toBe("premortem");
    expect(latestPremortemRun?.status).toBe("failed");
    expect(latestPremortemRun?.errorCode).toBe("semantic_invalid");
  });

  test("keeps the previous successful artifact when a rerun fails", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");

    vi.spyOn(providerModule, "getAiProvider").mockReturnValue({
      ...mockProvider,
      async premortem() {
        throw new StageExecutionError({
          type: "timeout",
          message: "The model request timed out before this stage completed.",
          retryable: true,
          recoveryAction: "retry_stage",
        });
      },
    });

    await expect(runStage(decisionId, "premortem")).rejects.toThrow(
      "The model request timed out before this stage completed.",
    );

    const detail = await getDecisionById(decisionId);
    const premortemRuns = detail?.runs.filter((run) => run.stage === "premortem") ?? [];

    expect(detail?.premortem).toBeTruthy();
    expect(premortemRuns[0]?.status).toBe("failed");
    expect(premortemRuns[0]?.errorCode).toBe("timeout");
    expect(premortemRuns[1]?.status).toBe("succeeded");
  });

  test("keeps the previous successful regret and synthesis artifacts when reruns fail", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");
    await runStage(decisionId, "synthesis");

    vi.spyOn(providerModule, "getAiProvider").mockReturnValue({
      ...mockProvider,
      async regret() {
        throw new StageExecutionError({
          type: "timeout",
          message: "The model request timed out before this stage completed.",
          retryable: true,
          recoveryAction: "retry_stage",
        });
      },
      async synthesize() {
        throw new StageExecutionError({
          type: "provider_unavailable",
          message: "The OpenAI provider is unavailable right now.",
          retryable: true,
          recoveryAction: "check_ai_configuration",
        });
      },
    });

    await expect(runStage(decisionId, "regret")).rejects.toThrow(
      "The model request timed out before this stage completed.",
    );

    let detail = await getDecisionById(decisionId);
    const regretRuns = detail?.runs.filter((run) => run.stage === "regret") ?? [];

    expect(detail?.regret).toBeTruthy();
    expect(detail?.synthesis).toBeTruthy();
    expect(detail?.recommendation).toBeTruthy();
    expect(detail?.memo).toBeTruthy();
    expect(regretRuns[0]?.status).toBe("failed");
    expect(regretRuns[0]?.errorCode).toBe("timeout");

    await expect(runStage(decisionId, "synthesis")).rejects.toThrow(
      "The OpenAI provider is unavailable right now.",
    );

    detail = await getDecisionById(decisionId);
    const synthesisRuns = detail?.runs.filter((run) => run.stage === "synthesis") ?? [];

    expect(detail?.synthesis).toBeTruthy();
    expect(detail?.recommendation).toBeTruthy();
    expect(detail?.memo).toBeTruthy();
    expect(synthesisRuns[0]?.status).toBe("failed");
    expect(synthesisRuns[0]?.errorCode).toBe("provider_unavailable");
  });

  test("resetting intake creates a new snapshot and leaves prior snapshot artifacts intact", async () => {
    const originalInput = decisionIntakeSchema.parse(careerDecision);
    const decisionId = await createDecision(originalInput);

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");
    await runStage(decisionId, "synthesis");

    const beforeEdit = await getDecisionById(decisionId);
    const originalSnapshotId = beforeEdit?.snapshot?.id;

    const revisedInput = decisionIntakeSchema.parse({
      ...careerDecision,
      whyThisMatters: "The decision changes scope, compensation, and whether I stay close to product-building work.",
    });

    const newSnapshotId = await updateDecisionIntake(decisionId, revisedInput);

    const detail = await getDecisionById(decisionId);
    const latestSnapshot = await getLatestSnapshot(decisionId);
    const oldSnapshot = originalSnapshotId ? await getSnapshotById(originalSnapshotId) : null;
    const oldSnapshotPayloads = originalSnapshotId
      ? await getSnapshotStagePayloads(originalSnapshotId)
      : null;
    const newSnapshotPayloads = await getSnapshotStagePayloads(newSnapshotId);
    const snapshotRows = await db
      .select()
      .from(decisionSnapshots)
      .where(eq(decisionSnapshots.decisionId, decisionId))
      .orderBy(desc(decisionSnapshots.version));

    expect(detail?.decision.currentStage).toBe("intake");
    expect(detail?.snapshot?.id).toBe(newSnapshotId);
    expect(latestSnapshot?.id).toBe(newSnapshotId);
    expect(snapshotRows).toHaveLength(2);
    expect(oldSnapshot?.id).toBe(originalSnapshotId);
    expect(oldSnapshotPayloads?.normalized).toBeTruthy();
    expect(oldSnapshotPayloads?.premortem).toBeTruthy();
    expect(oldSnapshotPayloads?.regret).toBeTruthy();
    expect(oldSnapshotPayloads?.memo).toContain("## Recommendation");
    expect(newSnapshotPayloads.normalized).toBeNull();
    expect(newSnapshotPayloads.premortem).toBeNull();
    expect(newSnapshotPayloads.regret).toBeNull();
    expect(newSnapshotPayloads.synthesis).toBeNull();
    expect(newSnapshotPayloads.recommendation).toBeNull();
    expect(newSnapshotPayloads.memo).toBeNull();
  });

  test("memo export preconditions only appear after synthesis", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    let detail = await getDecisionById(decisionId);
    expect(detail?.memo).toBeNull();

    const memoRowsBefore = await db.select().from(decisionMemos).where(eq(decisionMemos.decisionId, decisionId));
    expect(memoRowsBefore).toHaveLength(0);

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");

    detail = await getDecisionById(decisionId);
    expect(detail?.memo).toBeNull();

    await runStage(decisionId, "synthesis");

    detail = await getDecisionById(decisionId);
    const memoRowsAfter = await db.select().from(decisionMemos).where(eq(decisionMemos.decisionId, decisionId));

    expect(detail?.memo).toContain("## Recommendation");
    expect(detail?.memo).toContain("## Risk Register");
    expect(detail?.memo).toContain("## Evidence Needed");
    expect(memoRowsAfter).toHaveLength(1);
  });

  test("lists snapshot history and resolves historical snapshot detail", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(careerDecision));

    await runStage(decisionId, "normalization");
    await runStage(decisionId, "premortem");
    await runStage(decisionId, "regret");
    await runStage(decisionId, "synthesis");

    const newSnapshotId = await updateDecisionIntake(
      decisionId,
      decisionIntakeSchema.parse({
        ...careerDecision,
        constraints: [...careerDecision.constraints, "Keep people management under 10 percent"],
      }),
    );

    const history = await listDecisionSnapshots(decisionId);
    const selected = await getDecisionSnapshotDetail(decisionId, newSnapshotId);
    expect(selected?.snapshot).toBeTruthy();
    if (!selected?.snapshot) {
      throw new Error("Expected the new snapshot detail to exist.");
    }
    const previous = await getPreviousSnapshotForDecision(decisionId, selected.snapshot.version);
    const previousDetail = previous ? await getDecisionSnapshotDetail(decisionId, previous.id) : null;

    expect(history?.snapshots).toHaveLength(2);
    expect(history?.snapshots[0]?.snapshot.id).toBe(newSnapshotId);
    expect(history?.snapshots[0]?.isCurrentSnapshot).toBe(true);
    expect(history?.snapshots[0]?.recommendationLabel).toBeNull();
    expect(history?.snapshots[0]?.latestCompletedStage).toBe("intake");
    expect(history?.snapshots[1]?.recommendationLabel).toBeTruthy();
    expect(selected?.snapshot.id).toBe(newSnapshotId);
    expect(selected?.recommendation).toBeNull();
    expect(previous?.version).toBe(1);
    expect(previousDetail?.memo).toContain("## Recommendation");
  });
});
