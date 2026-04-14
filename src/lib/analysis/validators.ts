import {
  normalizedDecisionSchema,
  premortemAnalysisSchema,
  regretAnalysisSchema,
  synthesisDraftSchema,
  type NormalizedDecision,
  type PremortemAnalysis,
  type RegretAnalysis,
  type SynthesisDraft,
} from "@/lib/domain/decision";

import { SemanticValidationError } from "./errors";

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new SemanticValidationError(`${label} must not contain duplicates.`);
  }
}

export function validateNormalizedDecision(payload: unknown) {
  const normalized = normalizedDecisionSchema.parse(payload);
  assertUnique(normalized.successCriteria, "Normalized success criteria");
  return normalized satisfies NormalizedDecision;
}

export function validatePremortem(payload: unknown) {
  const premortem = premortemAnalysisSchema.parse(payload);
  const riskTitles = premortem.risks.map((risk) => risk.title);
  assertUnique(
    riskTitles,
    "Premortem risk titles",
  );
  for (const mitigation of premortem.mitigations) {
    if (!riskTitles.includes(mitigation.riskTitle)) {
      throw new SemanticValidationError(
        `Mitigation riskTitle must reference a known risk: ${mitigation.riskTitle}`,
      );
    }
  }
  return premortem satisfies PremortemAnalysis;
}

export function validateRegret(payload: unknown) {
  const regret = regretAnalysisSchema.parse(payload);
  assertUnique(
    regret.regretFactors.map((factor) => factor.title),
    "Regret factor titles",
  );
  assertUnique(
    regret.evidenceThresholds.map((threshold) => threshold.statement),
    "Evidence threshold statements",
  );
  assertUnique(
    regret.killCriteria.map((criterion) => criterion.statement),
    "Kill criteria statements",
  );
  return regret satisfies RegretAnalysis;
}

export function validateSynthesis(payload: unknown) {
  const synthesis = synthesisDraftSchema.parse(payload);
  assertUnique(synthesis.recommendedGuardrails, "Synthesis guardrails");
  assertUnique(synthesis.evidenceNeeded, "Synthesis evidence needed");
  return synthesis satisfies SynthesisDraft;
}
