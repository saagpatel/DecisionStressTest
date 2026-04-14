import { describe, expect, test } from "vitest";

import {
  deriveWorkbenchAlerts,
  deriveWorkbenchStageStates,
} from "@/features/decisions/lib/workbench-status";

describe("workbench status model", () => {
  test("marks the next executable stage as ready and downstream stages as blocked", () => {
    const stageStates = deriveWorkbenchStageStates({
      currentStage: "premortem",
      artifacts: {
        normalization: true,
        premortem: false,
        regret: false,
        synthesis: false,
      },
      latestFailures: {
        normalization: null,
        premortem: null,
        regret: null,
        synthesis: null,
      },
    });

    expect(stageStates.find((stage) => stage.stage === "normalization")?.status).toBe("complete");
    expect(stageStates.find((stage) => stage.stage === "premortem")?.status).toBe("ready");
    expect(stageStates.find((stage) => stage.stage === "regret")?.status).toBe("blocked");
    expect(stageStates.find((stage) => stage.stage === "synthesis")?.disabledReason).toContain("regret");
  });

  test("surfaces stale-output and failed-without-output statuses", () => {
    const stageStates = deriveWorkbenchStageStates({
      currentStage: "regret",
      artifacts: {
        normalization: true,
        premortem: true,
        regret: false,
        synthesis: false,
      },
      latestFailures: {
        normalization: null,
        premortem: {
          status: "failed",
          errorCode: "timeout",
          errorMessage: "timed out",
          refusalReason: null,
          provider: "mock",
        },
        regret: {
          status: "failed",
          errorCode: "semantic_invalid",
          errorMessage: "invalid",
          refusalReason: null,
          provider: "mock",
        },
        synthesis: null,
      },
    });

    expect(stageStates.find((stage) => stage.stage === "premortem")?.status).toBe("failed_with_stale_output");
    expect(stageStates.find((stage) => stage.stage === "regret")?.status).toBe("failed_without_output");
  });

  test("marks prior recommendations as stale after a new intake revision", () => {
    const stageStates = deriveWorkbenchStageStates({
      currentStage: "intake",
      artifacts: {
        normalization: false,
        premortem: false,
        regret: false,
        synthesis: false,
      },
      latestFailures: {
        normalization: null,
        premortem: null,
        regret: null,
        synthesis: null,
      },
    });

    const alerts = deriveWorkbenchAlerts({
      currentStage: "intake",
      snapshotVersion: 2,
      hasHistoricalRecommendation: true,
      stageStates,
    });

    expect(alerts.invalidationSummary).toContain("Normalization must run first");
    expect(alerts.staleRecommendation).toContain("Re-run downstream stages");
  });
});
