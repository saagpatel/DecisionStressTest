import { describe, expect, test } from "vitest";

import { deriveHistoryPageViewModel } from "@/features/decisions/lib/history-page";

describe("history page view model", () => {
  test("groups current and historical snapshots and keeps stale recommendation context", () => {
    const snapshotOne = {
      snapshot: {
        id: "snapshot_1",
        version: 1,
        createdAt: "2026-04-13T10:00:00.000Z",
      },
      isCurrentSnapshot: false,
      latestCompletedStage: "memo",
      recommendationLabel: "Proceed",
      confidenceLevel: "high",
      hasMemo: true,
      artifacts: {
        normalization: true,
        premortem: true,
        regret: true,
        synthesis: true,
        memo: true,
      },
    } as const;

    const snapshotTwo = {
      snapshot: {
        id: "snapshot_2",
        version: 2,
        createdAt: "2026-04-13T11:00:00.000Z",
      },
      isCurrentSnapshot: true,
      latestCompletedStage: "intake",
      recommendationLabel: null,
      confidenceLevel: null,
      hasMemo: false,
      artifacts: {
        normalization: false,
        premortem: false,
        regret: false,
        synthesis: false,
        memo: false,
      },
    } as const;

    const viewModel = deriveHistoryPageViewModel({
      decisionId: "decision_1",
      history: {
        decision: {
          title: "Pilot launch",
        },
        snapshots: [snapshotTwo, snapshotOne],
      },
      currentDetail: null,
      selectedSummary: snapshotTwo,
      detail: {
        snapshot: {
          id: "snapshot_2",
          version: 2,
          rawIntakeJson: {
            title: "Pilot launch",
            decisionType: "project_side_project",
            primaryOption: "Launch a paid pilot",
            baselineAlternative: "Keep it internal",
            whyThisMatters: "Potential new wedge.",
            decisionDeadline: "2026-05-05",
            timeHorizon: "3 months",
            constraints: ["Stay inside one day per week"],
            stakesLevel: "medium",
            successDefinition: "Land three paying pilots.",
            biggestKnownUncertainties: ["Will people pay?"],
          },
        },
        normalized: null,
        premortem: null,
        regret: null,
        synthesis: null,
        memo: null,
        recommendation: null,
        runs: [],
      } as never,
      previousDetail: {
        snapshot: {
          id: "snapshot_1",
          version: 1,
          rawIntakeJson: {
            title: "Pilot launch",
            decisionType: "project_side_project",
            primaryOption: "Launch a paid pilot",
            baselineAlternative: "Keep it internal",
            whyThisMatters: "Potential new wedge.",
            decisionDeadline: "2026-05-01",
            timeHorizon: "3 months",
            constraints: ["Stay inside one day per week"],
            stakesLevel: "medium",
            successDefinition: "Land three paying pilots.",
            biggestKnownUncertainties: ["Will people pay?"],
          },
        },
        normalized: { decisionFrame: "Pilot launch", successCriteria: ["Three pilots"] },
        premortem: null,
        regret: null,
        synthesis: null,
        memo: "# memo",
        recommendation: {
          label: "Proceed",
          confidenceLevel: "high",
          coreRationale: "The upside is worth a bounded test.",
          recommendedNextStep: "Run a reversible pilot.",
          guardrails: ["Keep the pilot time-boxed."],
        },
        runs: [],
      } as never,
    });

    expect(viewModel.ledgerGroups[0]?.title).toBe("Current snapshot");
    expect(viewModel.ledgerGroups[1]?.title).toBe("Historical snapshots");
    expect(viewModel.selectedSnapshotLabel).toBe("Version 2");
    expect(viewModel.selectedStageLabel).toBe("Intake revision");
    expect(viewModel.hasOlderRecommendation).toBe(true);
    expect(viewModel.comparison.topLineSummary.length).toBeGreaterThan(0);
  });
});
