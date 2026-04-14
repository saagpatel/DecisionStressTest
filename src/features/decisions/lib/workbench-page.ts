import type { CompactSummaryRailItem } from "@/features/decisions/components/compact-summary-rail";
import type { DecisionSnapshotView } from "@/lib/db/repositories";
import type { ProviderStatusViewModel } from "@/features/decisions/lib/provider-status";
import type { ExecutableStageName } from "@/lib/domain/decision";

import { decisionStatusToneClassName, deriveRecommendationStatus } from "./decision-status";
import { describeDecisionProgress, summarizeStageForPeople } from "./route-summaries";
import { deriveLatestFailuresByStage } from "./stage-failures";
import { deriveWorkbenchAlerts, deriveWorkbenchStageStates } from "./workbench-status";

type WorkbenchDetail = DecisionSnapshotView & {
  hasHistoricalRecommendation: boolean;
};

function nextActionCopy(params: {
  stageStates: ReturnType<typeof deriveWorkbenchStageStates>;
  hasCurrentRecommendation: boolean;
}) {
  const readyStage = params.stageStates.find((stage) => stage.status === "ready");

  if (readyStage) {
    return {
      title: readyStage.actionLabel,
      detail: readyStage.statusMessage,
    };
  }

  const retryStage = params.stageStates.find(
    (stage) => stage.status === "failed_with_stale_output" || stage.status === "failed_without_output",
  );

  if (retryStage) {
    return {
      title: retryStage.actionLabel,
      detail: retryStage.statusMessage,
    };
  }

  if (params.hasCurrentRecommendation) {
    return {
      title: "Review the memo or rerun a stage",
      detail: "The latest snapshot already has a current recommendation.",
    };
  }

  return {
    title: "Review the latest stage outputs",
    detail: "No new run is required right now.",
  };
}

export function deriveWorkbenchPageViewModel(params: {
  detail: WorkbenchDetail;
  providerStatus: ProviderStatusViewModel;
}) {
  const latestFailures = deriveLatestFailuresByStage(params.detail.runs);
  const stageStates = deriveWorkbenchStageStates({
    currentStage: params.detail.decision.currentStage,
    artifacts: {
      normalization: Boolean(params.detail.normalized),
      premortem: Boolean(params.detail.premortem),
      regret: Boolean(params.detail.regret),
      synthesis: Boolean(params.detail.synthesis),
    },
    latestFailures,
  });
  const stageStateByName = new Map(stageStates.map((state) => [state.stage, state]));
  const alerts = deriveWorkbenchAlerts({
    currentStage: params.detail.decision.currentStage,
    snapshotVersion: params.detail.snapshot?.version ?? 1,
    hasHistoricalRecommendation: params.detail.hasHistoricalRecommendation,
    stageStates,
  });
  const recommendationStatus = deriveRecommendationStatus({
    hasCurrentRecommendation: Boolean(params.detail.recommendation),
    hasHistoricalRecommendation: params.detail.hasHistoricalRecommendation,
  });
  const nextAction = nextActionCopy({
    stageStates,
    hasCurrentRecommendation: Boolean(params.detail.recommendation),
  });

  return {
    latestFailures,
    stageStates,
    stageStateByName,
    alerts,
    recommendationStatus,
    progressSummary: describeDecisionProgress(params.detail.decision.currentStage),
    currentStageLabel: summarizeStageForPeople(params.detail.decision.currentStage),
    activeAlert:
      alerts.staleRecommendation ??
      alerts.invalidationSummary,
    nextAction,
    summaryItems: [
      {
        key: "recommendation",
        label: "Recommendation",
        value: recommendationStatus.title,
        featured: true,
        badge: {
          label: recommendationStatus.badge,
          className: decisionStatusToneClassName(recommendationStatus.tone),
        },
      },
      {
        key: "next-action",
        label: "Next action",
        value: nextAction.title,
        detail: nextAction.detail,
      },
      {
        key: "snapshot",
        label: "Snapshot",
        value: `Version ${params.detail.snapshot?.version ?? 1}`,
        detail: "Latest active revision",
      },
      {
        key: "analysis-mode",
        label: "Analysis mode",
        value: params.providerStatus.shortLabel,
        detail:
          params.providerStatus.kind === "mock_ready"
            ? "Great for local iteration. Not identical to live model output."
            : params.providerStatus.kind === "openai_ready"
              ? "Live structured output is active for this environment."
              : "Provider setup needs attention before live analysis can run.",
      },
    ] satisfies CompactSummaryRailItem[],
    stageCards: [
      {
        stage: "normalization" as const,
        latestFailure: latestFailures.normalization,
      },
      {
        stage: "premortem" as const,
        latestFailure: latestFailures.premortem,
      },
      {
        stage: "regret" as const,
        latestFailure: latestFailures.regret,
      },
      {
        stage: "synthesis" as const,
        latestFailure: latestFailures.synthesis,
      },
    ] satisfies Array<{
      stage: ExecutableStageName;
      latestFailure: ReturnType<typeof deriveLatestFailuresByStage>[ExecutableStageName];
    }>,
  };
}
