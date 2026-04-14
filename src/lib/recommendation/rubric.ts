import type {
  AssumptionEntry,
  NormalizedDecision,
  PremortemAnalysis,
  Recommendation,
  RegretAnalysis,
  SynthesisDraft,
} from "@/lib/domain/decision";
import { recommendationSchema } from "@/lib/domain/decision";

function average(values: number[]) {
  if (!values.length) {
    return 3;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeReversibility(normalized: NormalizedDecision) {
  return normalized.reversibility === "high"
    ? 5
    : normalized.reversibility === "medium"
      ? 3
      : 1;
}

function confidenceLevel(score: number) {
  if (score >= 0.72) {
    return "high" as const;
  }
  if (score >= 0.48) {
    return "medium" as const;
  }
  return "low" as const;
}

export function buildRecommendation(params: {
  normalized: NormalizedDecision;
  premortem: PremortemAnalysis;
  regret: RegretAnalysis;
  synthesis: SynthesisDraft;
}) {
  const { normalized, premortem, regret, synthesis } = params;
  const reversibility = computeReversibility(normalized);
  const keyRisks = premortem.risks
    .slice()
    .sort((left, right) => right.severity + right.likelihood - (left.severity + left.likelihood))
    .slice(0, 4)
    .map((risk) => risk.title);
  const keyAssumptions = premortem.assumptions
    .slice()
    .sort((left, right) => right.importance + right.fragility - (left.importance + left.fragility))
    .slice(0, 4)
    .map((assumption) => assumption.statement);

  const weightedScore =
    reversibility * 0.15 +
    synthesis.evidenceQuality * 0.15 +
    synthesis.upsideMagnitude * 0.2 +
    synthesis.mitigability * 0.15 +
    synthesis.costOfDelay * 0.1 -
    synthesis.downsideSeverity * 0.15 -
    synthesis.assumptionFragility * 0.1;

  const normalizedScore = Math.max(0, Math.min(1, (weightedScore + 0.75) / 3.75));

  let label: Recommendation["label"];
  if (
    synthesis.downsideSeverity >= 4 &&
    reversibility <= 2 &&
    synthesis.mitigability <= 2
  ) {
    label = "Do not pursue";
  } else if (synthesis.evidenceQuality <= 2 && synthesis.costOfDelay <= 3) {
    label = "Defer until evidence";
  } else if (synthesis.evidenceQuality <= 3 && reversibility >= 3) {
    label = "Run a reversible test first";
  } else if (normalizedScore >= 0.7 && synthesis.downsideSeverity <= 3) {
    label = "Proceed";
  } else if (normalizedScore >= 0.5) {
    label = "Proceed with guardrails";
  } else if (reversibility >= 3) {
    label = "Run a reversible test first";
  } else {
    label = "Defer until evidence";
  }

  const recommendation = recommendationSchema.parse({
    label,
    confidenceLevel: confidenceLevel(normalizedScore),
    confidenceScore: Number(normalizedScore.toFixed(2)),
    coreRationale: synthesis.coreRationale,
    keyAssumptions,
    keyRisks,
    evidenceNeeded: synthesis.evidenceNeeded,
    killCriteria: regret.killCriteria.map((criterion) => criterion.statement),
    recommendedNextStep: synthesis.recommendedNextStep,
    guardrails:
      label === "Proceed" ? synthesis.recommendedGuardrails.slice(0, 3) : synthesis.recommendedGuardrails,
    scoring: {
      reversibility,
      evidenceQuality: synthesis.evidenceQuality,
      upsideMagnitude: synthesis.upsideMagnitude,
      downsideSeverity: synthesis.downsideSeverity,
      mitigability: synthesis.mitigability,
      costOfDelay: synthesis.costOfDelay,
      assumptionFragility: synthesis.assumptionFragility,
      weightedScore: Number(weightedScore.toFixed(2)),
    },
  });

  return recommendation;
}

export function scoreAssumptionFragility(assumptions: AssumptionEntry[]) {
  return Math.round(average(assumptions.map((assumption) => assumption.fragility)));
}
