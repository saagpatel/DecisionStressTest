import { describe, expect, test } from "vitest";

import { buildRecommendation } from "@/lib/recommendation/rubric";

describe("buildRecommendation", () => {
  test("forces a reversible test when evidence is weak but reversibility is moderate", () => {
    const recommendation = buildRecommendation({
      normalized: {
        problemStatement: "Decide whether to ship the paid beta.",
        decisionFrame: "Launch the beta or keep it private.",
        normalizedPrimaryOption: "Launch the beta",
        normalizedBaselineAlternative: "Keep it private",
        reversibility: "high",
        timeHorizon: "3 months",
        successCriteria: ["Get three paying users"],
        keyUncertainties: ["Will anyone pay"],
        constraintSummary: ["No more than one day per week"],
      },
      premortem: {
        failureNarrative: "The beta takes too much time without producing signal.",
        risks: [
          {
            title: "Execution cost overruns",
            description: "It takes more time than expected.",
            severity: 4,
            likelihood: 3,
            detectability: 3,
            timeToImpact: "2 weeks",
            ownerScope: "Founder",
          },
        ],
        assumptions: [
          {
            statement: "Users will pay for the beta.",
            fragility: 4,
            importance: 5,
            testability: 4,
          },
        ],
        mitigations: [
          {
            riskTitle: "Execution cost overruns",
            checklistItem: "Time-box the first test.",
            priority: "high",
            feasibility: 5,
          },
        ],
      },
      regret: {
        opportunityCostSummary: "Delay slows learning.",
        regretFactors: [
          {
            title: "Delayed learning",
            description: "Feedback arrives later.",
            impactType: "delay_cost",
            magnitude: 4,
            timeSensitivity: 4,
          },
        ],
        evidenceThresholds: [
          {
            statement: "Proceed if the beta can be run inside the time box.",
            direction: "proceed",
            metricType: "qualitative",
            thresholdText: "The test plan fits the time box.",
          },
        ],
        killCriteria: [
          {
            statement: "Stop if the first checkpoint fails.",
            triggerType: "traction",
            windowText: "First checkpoint",
          },
        ],
      },
      synthesis: {
        evidenceQuality: 2,
        upsideMagnitude: 4,
        downsideSeverity: 3,
        mitigability: 4,
        costOfDelay: 4,
        assumptionFragility: 4,
        coreRationale: "The upside is real but the evidence is still thin.",
        recommendedNextStep: "Run the smallest reversible test.",
        recommendedGuardrails: ["Keep the test time-boxed"],
        evidenceNeeded: ["A scoped test plan exists"],
      },
    });

    expect(recommendation.label).toBe("Run a reversible test first");
    expect(recommendation.confidenceLevel).toBeDefined();
  });
});
