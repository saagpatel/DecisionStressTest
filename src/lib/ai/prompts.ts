import type {
  DecisionIntake,
  NormalizedDecision,
  PremortemAnalysis,
  RegretAnalysis,
} from "@/lib/domain/decision";

export const promptVersions = {
  normalization: "2026-04-12-v1",
  premortem: "2026-04-12-v1",
  regret: "2026-04-12-v1",
  synthesis: "2026-04-12-v1",
} as const;

export function buildNormalizationPrompt(input: DecisionIntake) {
  return [
    "You are producing the normalized framing for a structured decision workbench.",
    "Stay operational and concrete. No therapy language. No motivational framing.",
    "Rewrite the input into a crisp professional decision frame.",
    `Decision title: ${input.title}`,
    `Primary option: ${input.primaryOption}`,
    `Baseline alternative: ${input.baselineAlternative}`,
    `Why this matters: ${input.whyThisMatters}`,
    `Time horizon: ${input.timeHorizon}`,
    `Constraints: ${input.constraints.join("; ")}`,
    `Success definition: ${input.successDefinition}`,
    `Known uncertainties: ${input.biggestKnownUncertainties.join("; ")}`,
  ].join("\n");
}

export function buildPremortemPrompt(input: {
  intake: DecisionIntake;
  normalized: NormalizedDecision;
}) {
  return [
    "You are generating a pre-mortem for the primary option.",
    "Focus on operational failure modes, assumptions, and mitigations.",
    "Avoid dramatic storytelling. Produce concise, practical risks.",
    `Problem statement: ${input.normalized.problemStatement}`,
    `Decision frame: ${input.normalized.decisionFrame}`,
    `Primary option: ${input.normalized.normalizedPrimaryOption}`,
    `Success criteria: ${input.normalized.successCriteria.join("; ")}`,
    `Constraints: ${input.normalized.constraintSummary.join("; ")}`,
    `Uncertainties: ${input.normalized.keyUncertainties.join("; ")}`,
  ].join("\n");
}

export function buildRegretPrompt(input: {
  intake: DecisionIntake;
  normalized: NormalizedDecision;
  premortem: PremortemAnalysis;
}) {
  return [
    "You are analyzing the regret and opportunity cost of not pursuing the primary option.",
    "Focus on missed upside, cost of delay, and what evidence should change the decision.",
    "Keep the output practical and bounded to medium-stakes professional decisions.",
    `Primary option: ${input.normalized.normalizedPrimaryOption}`,
    `Baseline alternative: ${input.normalized.normalizedBaselineAlternative}`,
    `Decision frame: ${input.normalized.decisionFrame}`,
    `Top risks already known: ${input.premortem.risks.map((risk) => risk.title).join("; ")}`,
  ].join("\n");
}

export function buildSynthesisPrompt(input: {
  intake: DecisionIntake;
  normalized: NormalizedDecision;
  premortem: PremortemAnalysis;
  regret: RegretAnalysis;
}) {
  return [
    "You are synthesizing a decision recommendation draft for a structured workbench.",
    "Do not choose the final label. Score the factors and produce rationale, guardrails, and evidence needed.",
    "Stay directional and concise.",
    `Decision frame: ${input.normalized.decisionFrame}`,
    `Primary option: ${input.normalized.normalizedPrimaryOption}`,
    `Baseline alternative: ${input.normalized.normalizedBaselineAlternative}`,
    `Failure narrative: ${input.premortem.failureNarrative}`,
    `Opportunity cost summary: ${input.regret.opportunityCostSummary}`,
  ].join("\n");
}
