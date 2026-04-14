import { ZodError } from "zod";

import type { ExecutableStageName, RecoveryAction, StageFailureType } from "@/lib/domain/decision";

export type StageFailureDetails = {
  type: StageFailureType;
  message: string;
  retryable: boolean;
  recoveryAction: RecoveryAction;
  refusalReason?: string | null;
};

export class StageExecutionError extends Error {
  readonly details: StageFailureDetails;

  constructor(details: StageFailureDetails) {
    super(details.message);
    this.name = "StageExecutionError";
    this.details = details;
  }
}

export class SemanticValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SemanticValidationError";
  }
}

export function prerequisiteMissingError(stage: ExecutableStageName) {
  const previousStage =
    stage === "premortem"
      ? "normalization"
      : stage === "regret"
        ? "premortem"
        : "regret";

  return new StageExecutionError({
    type: "prerequisite_missing",
    message: `Run ${previousStage} first before starting ${stage}.`,
    retryable: false,
    recoveryAction: "rerun_previous_stage",
  });
}

export function isStageExecutionError(error: unknown): error is StageExecutionError {
  return error instanceof StageExecutionError;
}

export function normalizeStageExecutionError(
  error: unknown,
  fallback: {
    semanticMessage: string;
    schemaMessage: string;
    unknownMessage: string;
  },
) {
  if (error instanceof StageExecutionError) {
    return error;
  }

  if (error instanceof SemanticValidationError) {
    return new StageExecutionError({
      type: "semantic_invalid",
      message: fallback.semanticMessage,
      retryable: true,
      recoveryAction: "edit_intake",
    });
  }

  if (error instanceof ZodError) {
    return new StageExecutionError({
      type: "schema_invalid",
      message: fallback.schemaMessage,
      retryable: true,
      recoveryAction: "review_prompt_contract",
    });
  }

  return new StageExecutionError({
    type: "unknown",
    message: error instanceof Error ? error.message : fallback.unknownMessage,
    retryable: true,
    recoveryAction: "retry_stage",
  });
}

export function recoveryActionLabel(action: RecoveryAction) {
  switch (action) {
    case "retry_stage":
      return "Retry this stage.";
    case "edit_intake":
      return "Tighten the intake, constraints, or uncertainties, then rerun.";
    case "rerun_previous_stage":
      return "Complete the previous stage first, then rerun this one.";
    case "check_ai_configuration":
      return "Check the local AI provider configuration before retrying.";
    case "switch_to_mock_provider":
      return "Switch to the mock provider if you need a safe local fallback.";
    case "review_prompt_contract":
      return "Retry first. If it repeats, review the prompt and schema contract.";
  }
}

export function defaultRecoveryActionForFailure(type: StageFailureType, providerName?: string): RecoveryAction {
  switch (type) {
    case "refusal":
      return "edit_intake";
    case "timeout":
      return "retry_stage";
    case "provider_unavailable":
      return providerName === "openai" ? "check_ai_configuration" : "switch_to_mock_provider";
    case "schema_invalid":
      return "review_prompt_contract";
    case "semantic_invalid":
      return "edit_intake";
    case "prerequisite_missing":
      return "rerun_previous_stage";
    case "unknown":
      return "retry_stage";
  }
}

export function failureTitle(type: StageFailureType) {
  switch (type) {
    case "refusal":
      return "Model refused the request";
    case "timeout":
      return "The model request timed out";
    case "provider_unavailable":
      return "The AI provider is unavailable";
    case "schema_invalid":
      return "The model returned malformed structured output";
    case "semantic_invalid":
      return "The stage output failed semantic checks";
    case "prerequisite_missing":
      return "A previous stage is still required";
    case "unknown":
      return "The stage failed unexpectedly";
  }
}
