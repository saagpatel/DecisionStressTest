import { z } from "zod";

export const decisionTypes = [
  "project_side_project",
  "career_professional",
  "tool_workflow_adoption",
] as const;

export const stakesLevels = ["low", "medium", "high"] as const;

export const stageNames = [
  "intake",
  "normalization",
  "premortem",
  "regret",
  "synthesis",
  "memo",
] as const;

export const executableStages = [
  "normalization",
  "premortem",
  "regret",
  "synthesis",
] as const;

export const stageRunStatuses = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "superseded",
] as const;

export const stageFailureTypes = [
  "refusal",
  "timeout",
  "provider_unavailable",
  "schema_invalid",
  "semantic_invalid",
  "prerequisite_missing",
  "unknown",
] as const;

export const recoveryActions = [
  "retry_stage",
  "edit_intake",
  "rerun_previous_stage",
  "check_ai_configuration",
  "switch_to_mock_provider",
  "review_prompt_contract",
] as const;

export const recommendationLabels = [
  "Proceed",
  "Proceed with guardrails",
  "Run a reversible test first",
  "Defer until evidence",
  "Do not pursue",
] as const;

export const confidenceLevels = ["low", "medium", "high"] as const;

const nonEmptyText = z.string().trim().min(1);
const boundedArray = (max: number) =>
  z.array(nonEmptyText).min(1).max(max).transform((values) => [...new Set(values)]);

export const decisionIntakeSchema = z.object({
  title: nonEmptyText.max(120),
  decisionType: z.enum(decisionTypes),
  primaryOption: nonEmptyText.max(240),
  baselineAlternative: nonEmptyText.max(240),
  whyThisMatters: nonEmptyText.max(1200),
  decisionDeadline: z.string().date(),
  timeHorizon: nonEmptyText.max(120),
  constraints: boundedArray(8),
  stakesLevel: z.enum(stakesLevels),
  successDefinition: nonEmptyText.max(1200),
  biggestKnownUncertainties: boundedArray(8),
});

export const normalizedDecisionSchema = z.object({
  problemStatement: nonEmptyText.max(400),
  decisionFrame: nonEmptyText.max(800),
  normalizedPrimaryOption: nonEmptyText.max(240),
  normalizedBaselineAlternative: nonEmptyText.max(240),
  reversibility: z.enum(["low", "medium", "high"]),
  timeHorizon: nonEmptyText.max(120),
  successCriteria: boundedArray(6),
  keyUncertainties: boundedArray(8),
  constraintSummary: boundedArray(8),
});

const score = z.number().int().min(1).max(5);

export const riskEntrySchema = z.object({
  title: nonEmptyText.max(140),
  description: nonEmptyText.max(600),
  severity: score,
  likelihood: score,
  detectability: score,
  timeToImpact: nonEmptyText.max(120),
  ownerScope: nonEmptyText.max(120),
});

export const mitigationEntrySchema = z.object({
  riskTitle: nonEmptyText.max(140),
  checklistItem: nonEmptyText.max(240),
  priority: z.enum(["low", "medium", "high"]),
  feasibility: score,
});

export const assumptionEntrySchema = z.object({
  statement: nonEmptyText.max(240),
  fragility: score,
  importance: score,
  testability: score,
});

export const premortemAnalysisSchema = z.object({
  failureNarrative: nonEmptyText.max(1600),
  risks: z.array(riskEntrySchema).min(3).max(8),
  assumptions: z.array(assumptionEntrySchema).min(2).max(8),
  mitigations: z.array(mitigationEntrySchema).min(2).max(10),
});

export const regretFactorSchema = z.object({
  title: nonEmptyText.max(140),
  description: nonEmptyText.max(400),
  impactType: z.enum([
    "missed_upside",
    "delay_cost",
    "capability_loss",
    "market_timing",
    "career_signal",
  ]),
  magnitude: score,
  timeSensitivity: score,
});

export const evidenceThresholdSchema = z.object({
  statement: nonEmptyText.max(240),
  direction: z.enum(["proceed", "walk_away"]),
  metricType: z.enum(["qualitative", "time", "money", "traction", "usage", "other"]),
  thresholdText: nonEmptyText.max(240),
});

export const killCriterionSchema = z.object({
  statement: nonEmptyText.max(240),
  triggerType: z.enum(["deadline", "budget", "traction", "adoption", "risk_event", "other"]),
  windowText: nonEmptyText.max(120),
});

export const regretAnalysisSchema = z.object({
  opportunityCostSummary: nonEmptyText.max(1200),
  regretFactors: z.array(regretFactorSchema).min(2).max(6),
  evidenceThresholds: z.array(evidenceThresholdSchema).min(2).max(6),
  killCriteria: z.array(killCriterionSchema).min(2).max(6),
});

export const synthesisDraftSchema = z.object({
  evidenceQuality: score,
  upsideMagnitude: score,
  downsideSeverity: score,
  mitigability: score,
  costOfDelay: score,
  assumptionFragility: score,
  coreRationale: nonEmptyText.max(1200),
  recommendedNextStep: nonEmptyText.max(240),
  recommendedGuardrails: boundedArray(6),
  evidenceNeeded: boundedArray(6),
});

export const recommendationSchema = z.object({
  label: z.enum(recommendationLabels),
  confidenceLevel: z.enum(confidenceLevels),
  confidenceScore: z.number().min(0).max(1),
  coreRationale: nonEmptyText.max(1200),
  keyAssumptions: boundedArray(6),
  keyRisks: boundedArray(6),
  evidenceNeeded: boundedArray(6),
  killCriteria: boundedArray(6),
  recommendedNextStep: nonEmptyText.max(240),
  guardrails: z.array(nonEmptyText.max(240)).max(6),
  scoring: z.object({
    reversibility: score,
    evidenceQuality: score,
    upsideMagnitude: score,
    downsideSeverity: score,
    mitigability: score,
    costOfDelay: score,
    assumptionFragility: score,
    weightedScore: z.number(),
  }),
});

export const decisionMemoSchema = z.object({
  decisionSummary: nonEmptyText,
  recommendationLabel: z.enum(recommendationLabels),
  reasoningSummary: nonEmptyText,
  riskRegister: z.array(riskEntrySchema),
  assumptionsRegister: z.array(assumptionEntrySchema),
  regretSummary: nonEmptyText,
  mitigationChecklist: z.array(mitigationEntrySchema),
  reversibleNextStep: nonEmptyText,
  killCriteria: z.array(killCriterionSchema),
  evidenceNeeded: z.array(evidenceThresholdSchema),
  markdown: nonEmptyText,
});

export type DecisionIntake = z.infer<typeof decisionIntakeSchema>;
export type NormalizedDecision = z.infer<typeof normalizedDecisionSchema>;
export type AssumptionEntry = z.infer<typeof assumptionEntrySchema>;
export type PremortemAnalysis = z.infer<typeof premortemAnalysisSchema>;
export type RegretAnalysis = z.infer<typeof regretAnalysisSchema>;
export type SynthesisDraft = z.infer<typeof synthesisDraftSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type DecisionMemo = z.infer<typeof decisionMemoSchema>;
export type DecisionType = (typeof decisionTypes)[number];
export type StageName = (typeof stageNames)[number];
export type StageRunStatus = (typeof stageRunStatuses)[number];
export type RecommendationLabel = (typeof recommendationLabels)[number];
export type ExecutableStageName = (typeof executableStages)[number];
export type StageFailureType = (typeof stageFailureTypes)[number];
export type RecoveryAction = (typeof recoveryActions)[number];

export function getNextStage(stage: ExecutableStageName): StageName {
  switch (stage) {
    case "normalization":
      return "premortem";
    case "premortem":
      return "regret";
    case "regret":
      return "synthesis";
    case "synthesis":
      return "memo";
  }
}
