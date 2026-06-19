import type { DecisionIntake, Recommendation, StageName } from "@/lib/domain/decision";

import { stageCopy } from "./options";

export type SnapshotArtifactFlags = {
  normalization: boolean;
  premortem: boolean;
  regret: boolean;
  synthesis: boolean;
  memo?: boolean;
};

export type SnapshotComparisonInput = {
  snapshotId: string;
  version: number;
  intake: DecisionIntake;
  artifacts: SnapshotArtifactFlags;
  recommendation: Recommendation | null;
};

export type SnapshotHistoryRowSummary = {
  snapshotBadge: string;
  stageLabel: string;
  recommendationText: string;
  confidenceText: string | null;
  staleText: string | null;
};

export type SnapshotSelectionStatus = {
  snapshotBadge: string;
  bannerTitle: string;
  bannerBody: string;
  memoStatus: string;
  memoStatusTone: "available" | "missing";
};

type SnapshotComparisonFieldChange = {
  field: string;
  label: string;
  previousValue: string;
  currentValue: string;
};

type ScoringDelta = {
  criterion: string;
  from: number | null;
  to: number | null;
};

const scoringCriteria = [
  "reversibility",
  "evidenceQuality",
  "upsideMagnitude",
  "downsideSeverity",
  "mitigability",
  "costOfDelay",
  "assumptionFragility",
] as const;

type RecommendationComparisonKind = "original" | "pending_refresh" | "introduced" | "changed" | "unchanged" | "none";

export type SnapshotComparisonViewModel = {
  isOriginal: boolean;
  topLineSummary: string;
  intakeChanges: {
    framing: SnapshotComparisonFieldChange[];
    constraints: {
      added: string[];
      removed: string[];
      summary: string;
    };
    uncertainties: {
      added: string[];
      removed: string[];
      summary: string;
    };
  };
  decisionDelta: {
    kind: RecommendationComparisonKind;
    summaryLabel: string;
    previousLabel: string | null;
    currentLabel: string | null;
    confidenceSummary: string;
    nextStepSummary: string;
  };
  scoringDeltas: ScoringDelta[];
  workflowDelta: {
    completedBefore: string[];
    completedNow: string[];
    summary: string;
    memoStatus: string;
  };
};

const intakeFieldLabels: Record<Exclude<keyof DecisionIntake, "constraints" | "biggestKnownUncertainties">, string> = {
  title: "Decision title",
  decisionType: "Decision type",
  primaryOption: "Primary option",
  baselineAlternative: "Baseline alternative",
  whyThisMatters: "Why this matters",
  decisionDeadline: "Decision deadline",
  timeHorizon: "Time horizon",
  stakesLevel: "Stakes level",
  successDefinition: "Success definition",
};

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

function diffList(current: string[], previous: string[]) {
  const previousSet = new Set(previous);
  const currentSet = new Set(current);

  return {
    added: current.filter((item) => !previousSet.has(item)),
    removed: previous.filter((item) => !currentSet.has(item)),
  };
}

export function snapshotStageLabel(stage: StageName) {
  if (stage === "intake") {
    return "Intake";
  }

  if (stage === "memo") {
    return "Memo";
  }

  return stageCopy[stage].title;
}

function summarizeListChange(params: {
  label: string;
  added: string[];
  removed: string[];
  emptyText: string;
}) {
  if (!params.added.length && !params.removed.length) {
    return params.emptyText;
  }

  const parts: string[] = [];
  if (params.added.length) {
    parts.push(`Added ${params.label.toLowerCase()}: ${params.added.join(", ")}.`);
  }
  if (params.removed.length) {
    parts.push(`Removed ${params.label.toLowerCase()}: ${params.removed.join(", ")}.`);
  }

  return parts.join(" ");
}

function describeConfidenceChange(
  previous: Recommendation | null,
  current: Recommendation | null,
) {
  if (!previous && !current) {
    return "Confidence will appear once a recommendation is complete.";
  }

  if (!previous && current) {
    return `Confidence is now ${current.confidenceLevel}.`;
  }

  if (previous && !current) {
    return `The previous confidence was ${previous.confidenceLevel}; the latest confidence is pending refresh.`;
  }

  if (!previous || !current) {
    return "Confidence will update after the next synthesis run.";
  }

  if (previous.confidenceLevel === current.confidenceLevel) {
    return `Confidence stayed ${current.confidenceLevel}.`;
  }

  return `Confidence changed from ${previous.confidenceLevel} to ${current.confidenceLevel}.`;
}

function describeNextStepChange(
  previous: Recommendation | null,
  current: Recommendation | null,
) {
  if (!previous && !current) {
    return "The reversible next step will appear once a recommendation is complete.";
  }

  if (!previous && current) {
    return "This is the first snapshot with a recommended next step.";
  }

  if (previous && !current) {
    return "The previous next step may no longer apply until this snapshot is synthesized again.";
  }

  if (!previous || !current) {
    return "The next step will update after the next synthesis run.";
  }

  if (previous.recommendedNextStep === current.recommendedNextStep) {
    return "The recommended next step stayed the same.";
  }

  return "The recommended next step changed.";
}

function describeWorkflowDelta(params: {
  completedBefore: string[];
  completedNow: string[];
  isOriginal: boolean;
}) {
  if (params.isOriginal) {
    return "This is the original workflow trail for the decision.";
  }

  const before = params.completedBefore.join(", ") || "None yet";
  const now = params.completedNow.join(", ") || "None yet";
  const coverageChanged =
    before !== now;

  return coverageChanged
    ? `Workflow coverage changed from ${before} to ${now}.`
    : `Workflow coverage stayed the same at ${now}.`;
}

function describeDecisionChangeLabel(kind: RecommendationComparisonKind) {
  switch (kind) {
    case "original":
      return "Original version";
    case "pending_refresh":
      return "Pending refresh";
    case "introduced":
      return "First recommendation";
    case "changed":
      return "Decision moved";
    case "unchanged":
      return "Direction held";
    case "none":
      return "No recommendation yet";
  }
}

function deriveScoringDeltas(
  previous: Recommendation | null,
  current: Recommendation | null,
): ScoringDelta[] {
  const previousScoring = previous?.scoring;
  const currentScoring = current?.scoring;

  return scoringCriteria.flatMap((criterion) => {
    const from = previousScoring ? previousScoring[criterion] : null;
    const to = currentScoring ? currentScoring[criterion] : null;

    if (from === to) {
      return [];
    }

    return [{ criterion, from, to }];
  });
}

export function deriveSnapshotHistoryRowSummary(params: {
  isCurrentSnapshot: boolean;
  latestCompletedStage: StageName;
  recommendationLabel: string | null;
  confidenceLevel?: string | null;
  isStaleRecommendation?: boolean;
}): SnapshotHistoryRowSummary {
  return {
    snapshotBadge: params.isCurrentSnapshot ? "Current" : "Historical",
    stageLabel: snapshotStageLabel(params.latestCompletedStage),
    recommendationText: params.recommendationLabel ?? "Recommendation pending",
    confidenceText: params.confidenceLevel ? `${params.confidenceLevel} confidence` : null,
    staleText: params.isStaleRecommendation ? "Stale recommendation" : null,
  };
}

export function deriveSnapshotSelectionStatus(params: {
  isCurrentSnapshot: boolean;
  latestCompletedStage: StageName;
  hasMemo: boolean;
}): SnapshotSelectionStatus {
  return {
    snapshotBadge: params.isCurrentSnapshot ? "Current snapshot" : "Historical snapshot",
    bannerTitle: params.isCurrentSnapshot
      ? "This is the active version used by the workbench."
      : "This is a historical snapshot.",
    bannerBody: params.isCurrentSnapshot
      ? `Latest completed stage: ${snapshotStageLabel(params.latestCompletedStage)}.`
      : "Edits and reruns apply only to the latest version.",
    memoStatus: params.hasMemo ? "Memo available" : "Memo not generated for this snapshot",
    memoStatusTone: params.hasMemo ? "available" : "missing",
  };
}

export function deriveSnapshotComparison(params: {
  current: SnapshotComparisonInput;
  previous: SnapshotComparisonInput | null;
}): SnapshotComparisonViewModel {
  const completedNow = Object.entries(params.current.artifacts)
    .filter(([, value]) => value)
    .map(([stage]) => snapshotStageLabel(stage as StageName));

  if (!params.previous) {
    return {
      isOriginal: true,
      topLineSummary: "This is the original version of the decision.",
      intakeChanges: {
        framing: [],
        constraints: {
          added: [],
          removed: [],
          summary: "No constraint changes yet. This is the starting point.",
        },
        uncertainties: {
          added: [],
          removed: [],
          summary: "No uncertainty changes yet. This is the starting point.",
        },
      },
      decisionDelta: {
        kind: "original",
        summaryLabel: describeDecisionChangeLabel("original"),
        previousLabel: null,
        currentLabel: params.current.recommendation?.label ?? null,
        confidenceSummary: describeConfidenceChange(null, params.current.recommendation),
        nextStepSummary: describeNextStepChange(null, params.current.recommendation),
      },
      scoringDeltas: deriveScoringDeltas(null, params.current.recommendation),
      workflowDelta: {
        completedBefore: [],
        completedNow,
        summary: describeWorkflowDelta({
          completedBefore: [],
          completedNow,
          isOriginal: true,
        }),
        memoStatus: params.current.artifacts.memo
          ? "This snapshot is complete enough to support a memo."
          : "This snapshot is not complete enough to support a memo yet.",
      },
    };
  }

  const framingChanges = Object.entries(intakeFieldLabels).flatMap(([field, label]) => {
    const currentValue = params.current.intake[field as keyof typeof intakeFieldLabels];
    const previousValue = params.previous?.intake[field as keyof typeof intakeFieldLabels];

    if (currentValue === previousValue) {
      return [];
    }

    return [
      {
        field,
        label,
        previousValue: String(previousValue ?? ""),
        currentValue: String(currentValue ?? ""),
      },
    ];
  });

  const constraintChanges = diffList(
    uniqueValues(params.current.intake.constraints),
    uniqueValues(params.previous.intake.constraints),
  );
  const uncertaintyChanges = diffList(
    uniqueValues(params.current.intake.biggestKnownUncertainties),
    uniqueValues(params.previous.intake.biggestKnownUncertainties),
  );

  const completedBefore = Object.entries(params.previous.artifacts)
    .filter(([, value]) => value)
    .map(([stage]) => snapshotStageLabel(stage as StageName));

  const recommendationLabelChanged =
    params.previous.recommendation?.label !== params.current.recommendation?.label;
  const confidenceChanged =
    params.previous.recommendation?.confidenceLevel !== params.current.recommendation?.confidenceLevel;
  const nextStepChanged =
    params.previous.recommendation?.recommendedNextStep !== params.current.recommendation?.recommendedNextStep;
  const hasFramingChanges = framingChanges.length > 0;
  const hasConstraintChanges = constraintChanges.added.length > 0 || constraintChanges.removed.length > 0;
  const hasUncertaintyChanges = uncertaintyChanges.added.length > 0 || uncertaintyChanges.removed.length > 0;
  const hasWorkflowChange = completedBefore.join("|") !== completedNow.join("|");
  const hasMeaningfulIntakeChange = hasFramingChanges || hasConstraintChanges || hasUncertaintyChanges;

  let topLineSummary = "No recommendation exists for either snapshot yet.";
  let decisionKind: RecommendationComparisonKind = "none";

  if (params.previous.recommendation && !params.current.recommendation) {
    decisionKind = "pending_refresh";
    topLineSummary =
      "The intake changed, but this snapshot has not been synthesized yet. Treat the previous recommendation as out of date until the latest version is refreshed.";
  } else if (!params.previous.recommendation && params.current.recommendation) {
    decisionKind = "introduced";
    topLineSummary = "This is the first snapshot with a completed recommendation and memo-ready decision trail.";
  } else if (params.previous.recommendation && params.current.recommendation) {
    if (recommendationLabelChanged) {
      decisionKind = "changed";
      topLineSummary = "The recommendation changed relative to the previous version of this decision.";
    } else if (confidenceChanged || nextStepChanged) {
      decisionKind = "changed";
      topLineSummary = "The direction stayed the same, but confidence or the recommended next step changed.";
    } else if (hasMeaningfulIntakeChange || hasWorkflowChange) {
      decisionKind = "unchanged";
      topLineSummary = "The latest revision did not change the overall recommendation.";
    } else {
      decisionKind = "unchanged";
      topLineSummary = "No meaningful change was introduced in this snapshot.";
    }
  }

  return {
    isOriginal: false,
    topLineSummary,
    intakeChanges: {
      framing: framingChanges,
      constraints: {
        added: constraintChanges.added,
        removed: constraintChanges.removed,
        summary: summarizeListChange({
          label: "Constraints",
          added: constraintChanges.added,
          removed: constraintChanges.removed,
          emptyText: "No constraint changes relative to the previous snapshot.",
        }),
      },
      uncertainties: {
        added: uncertaintyChanges.added,
        removed: uncertaintyChanges.removed,
        summary: summarizeListChange({
          label: "Uncertainties",
          added: uncertaintyChanges.added,
          removed: uncertaintyChanges.removed,
          emptyText: "No uncertainty changes relative to the previous snapshot.",
        }),
      },
    },
    decisionDelta: {
      kind: decisionKind,
      summaryLabel: describeDecisionChangeLabel(decisionKind),
      previousLabel: params.previous.recommendation?.label ?? null,
      currentLabel: params.current.recommendation?.label ?? null,
      confidenceSummary: describeConfidenceChange(params.previous.recommendation, params.current.recommendation),
      nextStepSummary: describeNextStepChange(params.previous.recommendation, params.current.recommendation),
    },
    scoringDeltas: deriveScoringDeltas(params.previous.recommendation, params.current.recommendation),
    workflowDelta: {
      completedBefore,
      completedNow,
      summary: describeWorkflowDelta({
        completedBefore,
        completedNow,
        isOriginal: false,
      }),
      memoStatus: params.current.artifacts.memo
        ? "This snapshot is complete enough to support a memo."
        : "This snapshot is not complete enough to support a memo yet.",
    },
  };
}
