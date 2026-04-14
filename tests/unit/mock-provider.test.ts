import { describe, expect, test } from "vitest";

import { mockProvider } from "@/lib/ai/mock-provider";
import type { DecisionIntake } from "@/lib/domain/decision";

const projectInput: DecisionIntake = {
  title: "Launch the analytics pilot",
  decisionType: "project_side_project",
  primaryOption: "Launch a paid pilot to five design partners next month",
  baselineAlternative: "Keep the add-on internal until Q3",
  whyThisMatters: "This could become the next revenue wedge if the pilot stays bounded.",
  decisionDeadline: "2026-05-01",
  timeHorizon: "3 months",
  constraints: ["No more than one day per week of founder time", "Do not delay core roadmap work"],
  stakesLevel: "medium",
  successDefinition: "Secure three paying pilot users and repeat usage without custom work.",
  biggestKnownUncertainties: ["Will design partners pay this early?", "How much support the first cohort needs"],
};

const careerInput: DecisionIntake = {
  title: "Take the principal product engineering role",
  decisionType: "career_professional",
  primaryOption: "Accept the principal product engineering role at the growth-stage company",
  baselineAlternative: "Stay in the current senior staff IC role for another year",
  whyThisMatters: "The move increases scope and compensation without forcing a management-heavy track.",
  decisionDeadline: "2026-05-02",
  timeHorizon: "12 months",
  constraints: ["No relocation", "Keep people management under 20 percent of time"],
  stakesLevel: "high",
  successDefinition: "Increase scope, compensation, and product ownership while still shipping technical work.",
  biggestKnownUncertainties: ["How much cross-functional alignment the role needs", "How political the team is"],
};

describe("mock provider", () => {
  test("generates a normalization frame that reflects the actual decision input", async () => {
    const normalized = await mockProvider.normalize(projectInput);

    expect(normalized.decisionFrame).toContain("Launch the analytics pilot");
    expect(normalized.decisionFrame).toContain("No more than one day per week of founder time");
    expect(normalized.keyUncertainties).toContain("Will design partners pay this early?");
  });

  test("produces category-aware premortem risks and regret factors", async () => {
    const normalized = await mockProvider.normalize(careerInput);
    const premortem = await mockProvider.premortem({
      intake: careerInput,
      normalized,
    });
    const regret = await mockProvider.regret({
      intake: careerInput,
      normalized,
      premortem,
    });

    expect(premortem.risks.map((risk) => risk.title)).toContain("Role drift");
    expect(premortem.failureNarrative).toContain("role");
    expect(regret.regretFactors.map((factor) => factor.title)).toContain("Missed career window");
    expect(regret.opportunityCostSummary).toContain("career upside");
  });

  test("generates synthesis guidance that reflects risk and evidence quality", async () => {
    const normalized = await mockProvider.normalize(projectInput);
    const premortem = await mockProvider.premortem({
      intake: projectInput,
      normalized,
    });
    const regret = await mockProvider.regret({
      intake: projectInput,
      normalized,
      premortem,
    });
    const synthesis = await mockProvider.synthesize({
      intake: projectInput,
      normalized,
      premortem,
      regret,
    });

    expect(synthesis.coreRationale.length).toBeGreaterThan(80);
    expect(synthesis.recommendedNextStep).toContain("reversible");
    expect(synthesis.recommendedGuardrails[0]).toContain("one day per week");
    expect(synthesis.evidenceNeeded[0]).toContain("Will design partners pay this early?");
  });
});
