import type { CompactSummaryRailItem } from "@/features/decisions/components/compact-summary-rail";
import type { DecisionSnapshotView } from "@/lib/db/repositories";
import type { ExecutableStageName } from "@/lib/domain/decision";

import {
  deriveSnapshotComparison,
  deriveSnapshotHistoryRowSummary,
  deriveSnapshotSelectionStatus,
} from "./snapshot-history";
import { deriveLatestFailuresByStage } from "./stage-failures";
import { summarizeStageForPeople } from "./route-summaries";
import { deriveSnapshotReviewStageStates } from "./workbench-status";

function selectionToneClassName(isCurrentSnapshot: boolean) {
  return isCurrentSnapshot
    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
    : "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

function memoToneClassName(memoStatusTone: "available" | "missing") {
  return memoStatusTone === "available"
    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
    : "border-white/12 bg-white/5 text-slate-200";
}

type SnapshotSummary = {
  snapshot: {
    id: string;
    version: number;
    createdAt: string;
  };
  isCurrentSnapshot: boolean;
  latestCompletedStage: import("@/lib/domain/decision").StageName;
  recommendationLabel: string | null;
  confidenceLevel?: string | null;
  hasMemo: boolean;
  artifacts: {
    normalization: boolean;
    premortem: boolean;
    regret: boolean;
    synthesis: boolean;
    memo?: boolean;
  };
};

export function deriveHistoryPageViewModel(params: {
  decisionId: string;
  history: {
    decision: { title: string };
    snapshots: SnapshotSummary[];
  };
  currentDetail: (DecisionSnapshotView & { hasHistoricalRecommendation: boolean }) | null;
  selectedSummary: SnapshotSummary;
  detail: DecisionSnapshotView;
  previousDetail: DecisionSnapshotView | null;
}) {
  const comparison = deriveSnapshotComparison({
    current: {
      snapshotId: params.detail.snapshot!.id,
      version: params.detail.snapshot!.version,
      intake: params.detail.snapshot!.rawIntakeJson,
      artifacts: {
        ...params.selectedSummary.artifacts,
        memo: Boolean(params.detail.memo),
      },
      recommendation: params.detail.recommendation,
    },
    previous: params.previousDetail?.snapshot
      ? {
          snapshotId: params.previousDetail.snapshot.id,
          version: params.previousDetail.snapshot.version,
          intake: params.previousDetail.snapshot.rawIntakeJson,
          artifacts: {
            normalization: Boolean(params.previousDetail.normalized),
            premortem: Boolean(params.previousDetail.premortem),
            regret: Boolean(params.previousDetail.regret),
            synthesis: Boolean(params.previousDetail.synthesis),
            memo: Boolean(params.previousDetail.memo),
          },
          recommendation: params.previousDetail.recommendation,
        }
      : null,
  });
  const selectionStatus = deriveSnapshotSelectionStatus({
    isCurrentSnapshot: params.selectedSummary.isCurrentSnapshot,
    latestCompletedStage: params.selectedSummary.latestCompletedStage,
    hasMemo: params.selectedSummary.hasMemo,
  });
  const ledgerGroups = [
    {
      title: "Current snapshot",
      rows: params.history.snapshots
        .filter((snapshot) => snapshot.isCurrentSnapshot)
        .map((snapshot) => ({
          snapshotId: snapshot.snapshot.id,
          href: `/decisions/${params.decisionId}/history?snapshot=${snapshot.snapshot.id}`,
          version: snapshot.snapshot.version,
          createdAt: snapshot.snapshot.createdAt,
          summary: deriveSnapshotHistoryRowSummary({
            isCurrentSnapshot: snapshot.isCurrentSnapshot,
            latestCompletedStage: snapshot.latestCompletedStage,
            recommendationLabel: snapshot.recommendationLabel,
            confidenceLevel: snapshot.confidenceLevel,
            isStaleRecommendation:
              snapshot.isCurrentSnapshot &&
              !snapshot.recommendationLabel &&
              params.history.snapshots.some(
                (candidate) =>
                  candidate.snapshot.id !== snapshot.snapshot.id && Boolean(candidate.recommendationLabel),
              ),
          }),
        })),
    },
    {
      title: "Historical snapshots",
      rows: params.history.snapshots
        .filter((snapshot) => !snapshot.isCurrentSnapshot)
        .map((snapshot) => ({
          snapshotId: snapshot.snapshot.id,
          href: `/decisions/${params.decisionId}/history?snapshot=${snapshot.snapshot.id}`,
          version: snapshot.snapshot.version,
          createdAt: snapshot.snapshot.createdAt,
          summary: deriveSnapshotHistoryRowSummary({
            isCurrentSnapshot: snapshot.isCurrentSnapshot,
            latestCompletedStage: snapshot.latestCompletedStage,
            recommendationLabel: snapshot.recommendationLabel,
            confidenceLevel: snapshot.confidenceLevel,
            isStaleRecommendation: false,
          }),
        })),
    },
  ];
  const latestFailures = deriveLatestFailuresByStage(params.detail.runs);
  const stageStates = deriveSnapshotReviewStageStates({
    artifacts: params.selectedSummary.artifacts,
    latestFailures,
  });
  const stageStateByName = new Map(stageStates.map((stage) => [stage.stage, stage]));
  const hasOlderRecommendation =
    params.selectedSummary.isCurrentSnapshot &&
    !params.selectedSummary.recommendationLabel &&
    params.history.snapshots.some(
      (snapshot) =>
        snapshot.snapshot.id !== params.selectedSummary.snapshot.id && Boolean(snapshot.recommendationLabel),
    );

  return {
    comparison,
    selectionStatus,
    ledgerGroups,
    latestFailures,
    stageStateByName,
    hasOlderRecommendation,
    selectedSnapshotLabel: `Version ${params.detail.snapshot!.version}`,
    selectedStageLabel: summarizeStageForPeople(params.selectedSummary.latestCompletedStage),
    summaryItems: [
      {
        key: "selected-snapshot",
        label: "Selected snapshot",
        value: `Version ${params.detail.snapshot!.version}`,
        detail: `Latest completed: ${summarizeStageForPeople(params.selectedSummary.latestCompletedStage)}`,
        featured: true,
        badge: {
          label: selectionStatus.snapshotBadge,
          className: selectionToneClassName(params.selectedSummary.isCurrentSnapshot),
        },
      },
      {
        key: "decision-change",
        label: "Decision change",
        value: comparison.decisionDelta.summaryLabel,
        detail: comparison.topLineSummary,
      },
      {
        key: "memo",
        label: "Memo",
        value: selectionStatus.memoStatus,
        detail: params.selectedSummary.isCurrentSnapshot
          ? "Memo status for the active workbench version."
          : "Memo status for this read-only snapshot.",
        badge: {
          label: selectionStatus.memoStatusTone === "available" ? "Available" : "Pending",
          className: memoToneClassName(selectionStatus.memoStatusTone),
        },
      },
      {
        key: "working-rule",
        label: "Working rule",
        value: params.selectedSummary.isCurrentSnapshot
          ? "Active workbench version"
          : "Read-only historical view",
        detail: params.selectedSummary.isCurrentSnapshot
          ? "Older snapshots stay separate from the current workbench."
          : "Review older work here without reactivating it.",
      },
    ] satisfies CompactSummaryRailItem[],
    stageCards: [
      "normalization",
      "premortem",
      "regret",
      "synthesis",
    ] as ExecutableStageName[],
  };
}
