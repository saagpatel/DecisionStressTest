import type { ExecutableStageName } from "@/lib/domain/decision";

import { logger } from "@/lib/config/logger";
import type { DecisionIntake } from "@/lib/domain/decision";
import { decisionMemoSchema } from "@/lib/domain/decision";
import { renderDecisionMemoMarkdown } from "@/lib/export/markdown";
import { buildRecommendation } from "@/lib/recommendation/rubric";

import { getAiProvider } from "../ai/provider";
import { promptVersions } from "../ai/prompts";
import {
  beginStageRun,
  completeStageRun,
  failStageRun,
  getDecisionById,
  getLatestSnapshot,
  getSnapshotStagePayloads,
} from "../db/repositories";
import {
  validateNormalizedDecision,
  validatePremortem,
  validateRegret,
  validateSynthesis,
} from "./validators";
import {
  normalizeStageExecutionError,
  prerequisiteMissingError,
} from "./errors";

export async function runStage(decisionId: string, stage: ExecutableStageName) {
  const provider = getAiProvider();
  const detail = await getDecisionById(decisionId);
  const snapshot = await getLatestSnapshot(decisionId);

  if (!detail?.decision || !snapshot) {
    throw new Error("Decision not found.");
  }

  const intake = snapshot.rawIntakeJson as DecisionIntake;
  const current = await getSnapshotStagePayloads(snapshot.id);

  if (stage === "normalization") {
    const runId = await beginStageRun({
      decisionId,
      snapshotId: snapshot.id,
      stage,
      provider: provider.name,
      model: provider.model,
      promptVersion: promptVersions.normalization,
      inputJson: intake,
    });

    try {
      const normalized = validateNormalizedDecision(await provider.normalize(intake));
      await completeStageRun({
        decisionId,
        snapshotId: snapshot.id,
        runId,
        stage,
        output: normalized,
      });
      return;
    } catch (error) {
      const failure = normalizeStageExecutionError(error, {
        semanticMessage: "Normalization returned a structurally valid result that did not make decision sense.",
        schemaMessage: "Normalization returned malformed structured output.",
        unknownMessage: "Normalization failed.",
      });
      await failStageRun({
        runId,
        decisionId,
        errorCode: failure.details.type,
        errorMessage: failure.details.message,
        refusalReason: failure.details.refusalReason,
      });
      throw failure;
    }
  }

  if (!current.normalized) {
    throw prerequisiteMissingError(stage);
  }

  if (stage === "premortem") {
    const runId = await beginStageRun({
      decisionId,
      snapshotId: snapshot.id,
      stage,
      provider: provider.name,
      model: provider.model,
      promptVersion: promptVersions.premortem,
      inputJson: { intake, normalized: current.normalized },
    });

    try {
      const premortem = validatePremortem(
        await provider.premortem({ intake, normalized: current.normalized }),
      );
      await completeStageRun({
        decisionId,
        snapshotId: snapshot.id,
        runId,
        stage,
        output: premortem,
      });
      return;
    } catch (error) {
      const failure = normalizeStageExecutionError(error, {
        semanticMessage:
          "The pre-mortem returned inconsistent risks, assumptions, or mitigations.",
        schemaMessage: "The pre-mortem returned malformed structured output.",
        unknownMessage: "Premortem failed.",
      });
      await failStageRun({
        runId,
        decisionId,
        errorCode: failure.details.type,
        errorMessage: failure.details.message,
        refusalReason: failure.details.refusalReason,
      });
      throw failure;
    }
  }

  if (!current.premortem) {
    throw prerequisiteMissingError(stage);
  }

  if (stage === "regret") {
    const runId = await beginStageRun({
      decisionId,
      snapshotId: snapshot.id,
      stage,
      provider: provider.name,
      model: provider.model,
      promptVersion: promptVersions.regret,
      inputJson: { intake, normalized: current.normalized, premortem: current.premortem },
    });

    try {
      const regret = validateRegret(
        await provider.regret({
          intake,
          normalized: current.normalized,
          premortem: current.premortem,
        }),
      );
      await completeStageRun({
        decisionId,
        snapshotId: snapshot.id,
        runId,
        stage,
        output: regret,
      });
      return;
    } catch (error) {
      const failure = normalizeStageExecutionError(error, {
        semanticMessage:
          "The regret analysis returned inconsistent opportunity-cost or evidence thresholds.",
        schemaMessage: "The regret analysis returned malformed structured output.",
        unknownMessage: "Regret analysis failed.",
      });
      await failStageRun({
        runId,
        decisionId,
        errorCode: failure.details.type,
        errorMessage: failure.details.message,
        refusalReason: failure.details.refusalReason,
      });
      throw failure;
    }
  }

  if (!current.regret) {
    throw prerequisiteMissingError(stage);
  }

  if (stage === "synthesis") {
    const runId = await beginStageRun({
      decisionId,
      snapshotId: snapshot.id,
      stage,
      provider: provider.name,
      model: provider.model,
      promptVersion: promptVersions.synthesis,
      inputJson: {
        intake,
        normalized: current.normalized,
        premortem: current.premortem,
        regret: current.regret,
      },
    });

    try {
      const draft = validateSynthesis(
        await provider.synthesize({
          intake,
          normalized: current.normalized,
          premortem: current.premortem,
          regret: current.regret,
        }),
      );
      const recommendation = buildRecommendation({
        normalized: current.normalized,
        premortem: current.premortem,
        regret: current.regret,
        synthesis: draft,
      });

      const memoDraft = buildDecisionMemo({
        title: detail.decision.title,
        normalized: current.normalized,
        premortem: current.premortem,
        regret: current.regret,
        recommendation,
      });

      await completeStageRun({
        decisionId,
        snapshotId: snapshot.id,
        runId,
        stage,
        output: {
          draft,
          recommendation,
          memo: memoDraft,
        },
      });
      return;
    } catch (error) {
      const failure = normalizeStageExecutionError(error, {
        semanticMessage:
          "The synthesis returned a recommendation draft that failed the recommendation contract.",
        schemaMessage: "The synthesis returned malformed structured output.",
        unknownMessage: "Synthesis failed.",
      });
      await failStageRun({
        runId,
        decisionId,
        errorCode: failure.details.type,
        errorMessage: failure.details.message,
        refusalReason: failure.details.refusalReason,
      });
      throw failure;
    }
  }

  logger.warn("unsupported_stage_requested", { decisionId, stage });
  throw new Error(`Unsupported stage: ${stage}`);
}

export function buildDecisionMemo(params: {
  title: string;
  normalized: NonNullable<Awaited<ReturnType<typeof getSnapshotStagePayloads>>["normalized"]>;
  premortem: NonNullable<Awaited<ReturnType<typeof getSnapshotStagePayloads>>["premortem"]>;
  regret: NonNullable<Awaited<ReturnType<typeof getSnapshotStagePayloads>>["regret"]>;
  recommendation: NonNullable<Awaited<ReturnType<typeof getSnapshotStagePayloads>>["recommendation"]>;
}) {
  const memoWithoutMarkdown = {
    decisionSummary: params.title,
    recommendationLabel: params.recommendation.label,
    reasoningSummary: params.recommendation.coreRationale,
    riskRegister: params.premortem.risks,
    assumptionsRegister: params.premortem.assumptions,
    regretSummary: params.regret.opportunityCostSummary,
    mitigationChecklist: params.premortem.mitigations,
    reversibleNextStep: params.recommendation.recommendedNextStep,
    killCriteria: params.regret.killCriteria,
    evidenceNeeded: params.regret.evidenceThresholds,
  };

  const markdown = renderDecisionMemoMarkdown(memoWithoutMarkdown);
  return decisionMemoSchema.parse({
    ...memoWithoutMarkdown,
    markdown,
  });
}
