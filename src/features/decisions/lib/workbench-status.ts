import { executableStages, type ExecutableStageName, type StageName } from "@/lib/domain/decision";

import { stageCopy } from "./options";

export const workbenchStageStatuses = [
  "complete",
  "ready",
  "blocked",
  "missing",
  "failed_with_stale_output",
  "failed_without_output",
] as const;

export type WorkbenchStageStatus = (typeof workbenchStageStatuses)[number];

export type LatestStageFailure = {
  status: "failed";
  errorCode: string | null;
  errorMessage: string | null;
  refusalReason: string | null;
  provider: string;
} | null;

export type WorkbenchStageState = {
  stage: ExecutableStageName;
  title: string;
  status: WorkbenchStageStatus;
  badgeLabel: string;
  statusMessage: string;
  actionLabel: string;
  canRun: boolean;
  disabledReason: string | null;
  hasArtifact: boolean;
};

const prerequisites: Record<ExecutableStageName, ExecutableStageName | null> = {
  normalization: null,
  premortem: "normalization",
  regret: "premortem",
  synthesis: "regret",
};

function activeExecutableStage(currentStage: StageName) {
  if (currentStage === "intake") {
    return "normalization" satisfies ExecutableStageName;
  }

  if (currentStage === "memo") {
    return null;
  }

  return currentStage;
}

function statusLabel(status: WorkbenchStageStatus) {
  switch (status) {
    case "complete":
      return "Complete";
    case "ready":
      return "Ready";
    case "blocked":
      return "Blocked";
    case "missing":
      return "Missing";
    case "failed_with_stale_output":
      return "Retry needed";
    case "failed_without_output":
      return "Failed";
  }
}

function blockedReason(stage: ExecutableStageName) {
  const prerequisite = prerequisites[stage];

  if (!prerequisite) {
    return null;
  }

  return `Run ${stageCopy[prerequisite].title.toLowerCase()} on the latest snapshot first.`;
}

function stageStatusMessage(params: {
  stage: ExecutableStageName;
  status: WorkbenchStageStatus;
  disabledReason: string | null;
}) {
  switch (params.status) {
    case "complete":
      return "Fresh for the latest snapshot.";
    case "ready":
      return "Ready to run for the latest snapshot.";
    case "blocked":
      return params.disabledReason ?? "A prerequisite stage is still missing on the latest snapshot.";
    case "missing":
      return "No output exists for the latest snapshot yet.";
    case "failed_with_stale_output":
      return "The last successful output is still shown below until a fresh run succeeds.";
    case "failed_without_output":
      return "The latest run failed before this stage produced a usable output.";
  }
}

export function deriveWorkbenchStageStates(params: {
  currentStage: StageName;
  artifacts: Record<ExecutableStageName, boolean>;
  latestFailures: Record<ExecutableStageName, LatestStageFailure>;
}) {
  const activeStage = activeExecutableStage(params.currentStage);

  return executableStages.map((stage) => {
    const prerequisite = prerequisites[stage];
    const prerequisiteComplete = prerequisite ? params.artifacts[prerequisite] : true;
    const hasArtifact = params.artifacts[stage];
    const hasFailure = Boolean(params.latestFailures[stage]);

    let status: WorkbenchStageStatus;
    if (hasArtifact && hasFailure) {
      status = "failed_with_stale_output";
    } else if (hasArtifact) {
      status = "complete";
    } else if (hasFailure) {
      status = "failed_without_output";
    } else if (!prerequisiteComplete) {
      status = "blocked";
    } else if (activeStage === stage) {
      status = "ready";
    } else {
      status = "missing";
    }

    const disabledReason = status === "blocked" ? blockedReason(stage) : null;

    return {
      stage,
      title: stageCopy[stage].title,
      status,
      badgeLabel: statusLabel(status),
      statusMessage: stageStatusMessage({
        stage,
        status,
        disabledReason,
      }),
      actionLabel:
        status === "complete" || status === "failed_with_stale_output"
          ? `Rerun ${stage}`
          : `Run ${stage}`,
      canRun: status !== "blocked",
      disabledReason,
      hasArtifact,
    } satisfies WorkbenchStageState;
  });
}

export function deriveWorkbenchAlerts(params: {
  currentStage: StageName;
  snapshotVersion: number;
  hasHistoricalRecommendation: boolean;
  stageStates: WorkbenchStageState[];
}) {
  const synthesisState = params.stageStates.find((stage) => stage.stage === "synthesis");
  const hasCurrentRecommendation = synthesisState?.hasArtifact ?? false;

  return {
    invalidationSummary:
      params.snapshotVersion > 1 && params.currentStage === "intake"
        ? "Latest intake revision saved. Normalization must run first; downstream stages are waiting on the latest snapshot."
        : null,
    staleRecommendation:
      !hasCurrentRecommendation && params.hasHistoricalRecommendation
        ? "The latest intake changed. Re-run downstream stages before relying on the previous recommendation."
        : null,
  };
}

export function deriveSnapshotReviewStageStates(params: {
  artifacts: Record<ExecutableStageName, boolean>;
  latestFailures: Record<ExecutableStageName, LatestStageFailure>;
}) {
  return executableStages.map((stage) => {
    const hasArtifact = params.artifacts[stage];
    const hasFailure = Boolean(params.latestFailures[stage]);

    let status: WorkbenchStageStatus;
    if (hasArtifact && hasFailure) {
      status = "failed_with_stale_output";
    } else if (hasArtifact) {
      status = "complete";
    } else if (hasFailure) {
      status = "failed_without_output";
    } else {
      status = "missing";
    }

    const statusMessage =
      status === "complete"
        ? "This stage is available on this snapshot."
        : status === "failed_with_stale_output"
          ? "The last successful output is still shown for this snapshot until a new run succeeds."
          : status === "failed_without_output"
            ? "The last run for this snapshot failed before a usable output was produced."
            : "This stage was not generated for this snapshot.";

    return {
      stage,
      title: stageCopy[stage].title,
      status,
      badgeLabel: statusLabel(status),
      statusMessage,
      actionLabel: `Run ${stage}`,
      canRun: false,
      disabledReason: null,
      hasArtifact,
    } satisfies WorkbenchStageState;
  });
}
