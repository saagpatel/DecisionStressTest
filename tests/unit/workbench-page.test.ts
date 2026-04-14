import { describe, expect, test } from "vitest";

import { deriveWorkbenchPageViewModel } from "@/features/decisions/lib/workbench-page";

describe("workbench page view model", () => {
  test("derives human-readable progress and stale recommendation alerts", () => {
    const viewModel = deriveWorkbenchPageViewModel({
      detail: {
        decision: {
          currentStage: "intake",
        },
        snapshot: {
          version: 2,
        },
        normalized: null,
        premortem: null,
        regret: null,
        synthesis: null,
        recommendation: null,
        hasHistoricalRecommendation: true,
        runs: [],
      } as never,
      providerStatus: {
        kind: "mock_ready",
        badge: "Mock mode",
        shortLabel: "Mock mode",
        title: "Mock mode",
        description: "Mock mode: deterministic local simulation. No OpenAI key required.",
        tone: "mock",
      },
    });

    expect(viewModel.progressSummary).toBe("Latest snapshot needs a fresh decision frame.");
    expect(viewModel.currentStageLabel).toBe("Intake revision");
    expect(viewModel.activeAlert).toBe(
      "The latest intake changed. Re-run downstream stages before relying on the previous recommendation.",
    );
    expect(viewModel.stageCards.map((stage) => stage.stage)).toEqual([
      "normalization",
      "premortem",
      "regret",
      "synthesis",
    ]);
  });
});
