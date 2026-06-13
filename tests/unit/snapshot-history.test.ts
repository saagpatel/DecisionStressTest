import { describe, expect, test } from "vitest";

import {
  deriveSnapshotComparison,
  deriveSnapshotHistoryRowSummary,
  deriveSnapshotSelectionStatus,
} from "@/features/decisions/lib/snapshot-history";
import type { DecisionIntake, Recommendation } from "@/lib/domain/decision";

const baseIntake: DecisionIntake = {
  title: "Launch the pilot",
  decisionType: "project_side_project",
  primaryOption: "Launch a paid pilot",
  baselineAlternative: "Wait until Q3",
  whyThisMatters: "This could create the next revenue wedge.",
  decisionDeadline: "2026-05-01",
  timeHorizon: "3 months",
  constraints: ["Keep founder time under one day per week"],
  stakesLevel: "medium",
  successDefinition: "Secure three paying pilot users.",
  biggestKnownUncertainties: ["Will customers pay this early?"],
};

const baseRecommendation: Recommendation = {
  label: "Proceed with guardrails",
  confidenceLevel: "medium",
  confidenceScore: 0.68,
  coreRationale: "The upside looks real, but the first test still needs clear guardrails.",
  keyAssumptions: ["The pilot can stay scoped."],
  keyRisks: ["Support load grows too quickly."],
  evidenceNeeded: ["Three paying pilot users."],
  killCriteria: ["Stop if support cost blows past the time cap."],
  recommendedNextStep: "Run a paid pilot with five design partners.",
  guardrails: ["Cap the pilot to five partners."],
  scoring: {
    reversibility: 4,
    evidenceQuality: 3,
    upsideMagnitude: 4,
    downsideSeverity: 3,
    mitigability: 4,
    costOfDelay: 3,
    assumptionFragility: 3,
    weightedScore: 2.1,
  },
};

describe("snapshot history helpers", () => {
  test("summarizes changed fields, lists, and recommendation deltas", () => {
    const comparison = deriveSnapshotComparison({
      current: {
        snapshotId: "snapshot_2",
        version: 2,
        intake: {
          ...baseIntake,
          whyThisMatters: "This could become the next revenue wedge if support stays bounded.",
          constraints: [...baseIntake.constraints, "Do not add custom work"],
          biggestKnownUncertainties: [...baseIntake.biggestKnownUncertainties, "How much support the first cohort needs"],
        },
        artifacts: {
          normalization: true,
          premortem: true,
          regret: true,
          synthesis: false,
          memo: false,
        },
        recommendation: null,
      },
      previous: {
        snapshotId: "snapshot_1",
        version: 1,
        intake: baseIntake,
        artifacts: {
          normalization: true,
          premortem: true,
          regret: true,
          synthesis: true,
          memo: true,
        },
        recommendation: baseRecommendation,
      },
    });

    expect(comparison.isOriginal).toBe(false);
    expect(comparison.topLineSummary).toContain("out of date");
    expect(comparison.intakeChanges.framing.map((field) => field.label)).toContain("Why this matters");
    expect(comparison.intakeChanges.constraints.added).toContain("Do not add custom work");
    expect(comparison.intakeChanges.uncertainties.added).toContain("How much support the first cohort needs");
    expect(comparison.decisionDelta.kind).toBe("pending_refresh");
    expect(comparison.workflowDelta.completedBefore).toContain("Synthesis");
    expect(comparison.workflowDelta.completedBefore).toContain("Memo");
    expect(comparison.workflowDelta.completedNow).not.toContain("Synthesis");
  });

  test("treats the first snapshot as original", () => {
    const comparison = deriveSnapshotComparison({
      current: {
        snapshotId: "snapshot_1",
        version: 1,
        intake: baseIntake,
        artifacts: {
          normalization: false,
          premortem: false,
          regret: false,
          synthesis: false,
        },
        recommendation: null,
      },
      previous: null,
    });

    expect(comparison.isOriginal).toBe(true);
    expect(comparison.topLineSummary).toContain("original version");
    expect(comparison.workflowDelta.memoStatus).toContain("not complete enough");
  });

  test("builds history row and selection summaries", () => {
    const rowSummary = deriveSnapshotHistoryRowSummary({
      isCurrentSnapshot: true,
      latestCompletedStage: "memo",
      recommendationLabel: "Proceed with guardrails",
      confidenceLevel: "medium",
      isStaleRecommendation: false,
    });
    const selectionStatus = deriveSnapshotSelectionStatus({
      isCurrentSnapshot: false,
      latestCompletedStage: "synthesis",
      hasMemo: true,
    });

    expect(rowSummary.snapshotBadge).toBe("Current");
    expect(rowSummary.stageLabel).toBe("Memo");
    expect(rowSummary.confidenceText).toBe("medium confidence");
    expect(selectionStatus.snapshotBadge).toBe("Historical snapshot");
    expect(selectionStatus.bannerTitle).toContain("historical snapshot");
    expect(selectionStatus.bannerBody).toContain("latest version");
    expect(selectionStatus.memoStatus).toContain("Memo available");
  });

  test("describes unchanged recommendations after a rerun", () => {
    const comparison = deriveSnapshotComparison({
      current: {
        snapshotId: "snapshot_3",
        version: 3,
        intake: baseIntake,
        artifacts: {
          normalization: true,
          premortem: true,
          regret: true,
          synthesis: true,
          memo: true,
        },
        recommendation: baseRecommendation,
      },
      previous: {
        snapshotId: "snapshot_2",
        version: 2,
        intake: baseIntake,
        artifacts: {
          normalization: true,
          premortem: true,
          regret: true,
          synthesis: true,
          memo: true,
        },
        recommendation: baseRecommendation,
      },
    });

    expect(comparison.topLineSummary).toContain("No meaningful change");
    expect(comparison.decisionDelta.kind).toBe("unchanged");
    expect(comparison.decisionDelta.confidenceSummary).toContain("stayed medium");
    expect(comparison.decisionDelta.nextStepSummary).toContain("stayed the same");
  });

  test("reports scoring deltas only when criterion scores change", () => {
    const changedScoring: Recommendation = {
      ...baseRecommendation,
      scoring: {
        ...baseRecommendation.scoring,
        reversibility: 2,
        evidenceQuality: 5,
      },
    };

    const buildComparison = (recommendation: Recommendation) =>
      deriveSnapshotComparison({
        current: {
          snapshotId: "snapshot_2",
          version: 2,
          intake: baseIntake,
          artifacts: {
            normalization: true,
            premortem: true,
            regret: true,
            synthesis: true,
            memo: true,
          },
          recommendation,
        },
        previous: {
          snapshotId: "snapshot_1",
          version: 1,
          intake: baseIntake,
          artifacts: {
            normalization: true,
            premortem: true,
            regret: true,
            synthesis: true,
            memo: true,
          },
          recommendation: baseRecommendation,
        },
      });

    const changed = buildComparison(changedScoring);
    expect(changed.scoringDeltas).toHaveLength(2);
    expect(changed.scoringDeltas).toEqual(
      expect.arrayContaining([
        { criterion: "reversibility", from: 4, to: 2 },
        { criterion: "evidenceQuality", from: 3, to: 5 },
      ]),
    );

    const identical = buildComparison(baseRecommendation);
    expect(identical.scoringDeltas).toEqual([]);
  });
});
