import { afterEach, describe, expect, test, vi } from "vitest";

import { StageExecutionError } from "@/lib/analysis/errors";
import { runStage } from "@/lib/analysis/pipeline";
import * as providerModule from "@/lib/ai/provider";
import { mockProvider } from "@/lib/ai/mock-provider";
import { createDecision, getDecisionById } from "@/lib/db/repositories";
import { decisionIntakeSchema } from "@/lib/domain/decision";

import { evalFixtures } from "../fixtures/eval-fixtures";

const requiredMemoSections = [
  "## Recommendation",
  "## Reasoning Summary",
  "## Risk Register",
  "## Assumptions Register",
  "## Regret / Opportunity Cost Summary",
  "## Mitigation Checklist",
  "## Reversible Next Step",
  "## Kill Criteria",
  "## Evidence Needed",
];

describe("fixture evals", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const fixture of evalFixtures) {
    test(`produces the expected memo and label for ${fixture.name}`, async () => {
      const decisionId = await createDecision(decisionIntakeSchema.parse(fixture.input));

      await runStage(decisionId, "normalization");
      await runStage(decisionId, "premortem");
      await runStage(decisionId, "regret");
      await runStage(decisionId, "synthesis");

      const detail = await getDecisionById(decisionId);

      expect(detail?.recommendation?.label).toBe(fixture.expectedLabel);
      expect(detail?.recommendation?.confidenceLevel).toBeTruthy();
      expect(detail?.normalized?.decisionFrame.trim().length).toBeGreaterThan(20);
      expect(detail?.premortem?.failureNarrative.trim().length).toBeGreaterThan(20);
      expect(detail?.regret?.opportunityCostSummary.trim().length).toBeGreaterThan(20);
      expect(detail?.synthesis?.coreRationale.trim().length).toBeGreaterThan(20);
      for (const section of requiredMemoSections) {
        expect(detail?.memo).toContain(section);
      }
    });
  }

  test("failed reruns do not erase the last successful artifact", async () => {
    const decisionId = await createDecision(decisionIntakeSchema.parse(evalFixtures[0]!.input));

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
    });

    await expect(runStage(decisionId, "regret")).rejects.toThrow(
      "The model request timed out before this stage completed.",
    );

    const detail = await getDecisionById(decisionId);
    const latestRegretRun = detail?.runs.find((run) => run.stage === "regret");

    expect(detail?.regret).toBeTruthy();
    expect(detail?.synthesis).toBeTruthy();
    expect(detail?.recommendation).toBeTruthy();
    expect(detail?.memo).toContain("## Recommendation");
    expect(latestRegretRun?.status).toBe("failed");
    expect(latestRegretRun?.errorCode).toBe("timeout");
  });
});
