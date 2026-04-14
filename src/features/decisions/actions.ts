"use server";

import { revalidatePath } from "next/cache";

import { runStage } from "@/lib/analysis/pipeline";
import { createDatabaseBackup } from "@/lib/db/backup";
import { createDecision, updateDecisionIntake } from "@/lib/db/repositories";
import { decisionIntakeSchema, type DecisionIntake, type ExecutableStageName } from "@/lib/domain/decision";
import { assertLocalRequest } from "@/lib/security/local-access";
import {
  isStageExecutionError,
  recoveryActionLabel,
} from "@/lib/analysis/errors";

function failure(error: unknown) {
  if (isStageExecutionError(error)) {
    return {
      ok: false as const,
      error: error.details.message,
      failureType: error.details.type,
      retryable: error.details.retryable,
      recoveryAction: error.details.recoveryAction,
      recoveryText: recoveryActionLabel(error.details.recoveryAction),
      refusalReason: error.details.refusalReason ?? null,
    };
  }

  return {
    ok: false as const,
    error: error instanceof Error ? error.message : "Something went wrong.",
  };
}

export async function createDecisionAction(input: DecisionIntake) {
  try {
    await assertLocalRequest();
    const parsed = decisionIntakeSchema.parse(input);
    const decisionId = await createDecision(parsed);
    revalidatePath("/");
    revalidatePath("/decisions");
    return { ok: true as const, decisionId };
  } catch (error) {
    return failure(error);
  }
}

export async function updateDecisionAction(decisionId: string, input: DecisionIntake) {
  try {
    await assertLocalRequest();
    const parsed = decisionIntakeSchema.parse(input);
    await updateDecisionIntake(decisionId, parsed);
    revalidatePath(`/decisions/${decisionId}`);
    revalidatePath("/decisions");
    return { ok: true as const, decisionId };
  } catch (error) {
    return failure(error);
  }
}

export async function runStageAction(decisionId: string, stage: ExecutableStageName) {
  try {
    await assertLocalRequest();
    await runStage(decisionId, stage);
    revalidatePath(`/decisions/${decisionId}`);
    revalidatePath(`/decisions/${decisionId}/memo`);
    revalidatePath("/decisions");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function createBackupAction() {
  try {
    await assertLocalRequest();
    const backup = await createDatabaseBackup();
    revalidatePath("/decisions");
    return { ok: true as const, backup };
  } catch (error) {
    return failure(error);
  }
}
