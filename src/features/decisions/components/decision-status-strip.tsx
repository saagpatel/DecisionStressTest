import { CompactSummaryRail } from "@/features/decisions/components/compact-summary-rail";
import type { ProviderStatusViewModel } from "@/features/decisions/lib/provider-status";
import {
  decisionStatusToneClassName,
  deriveRecommendationStatus,
} from "@/features/decisions/lib/decision-status";

export function DecisionStatusStrip({
  snapshotVersion,
  hasCurrentRecommendation,
  hasHistoricalRecommendation,
  providerStatus,
  nextActionTitle,
  nextActionDetail,
}: {
  snapshotVersion: number;
  hasCurrentRecommendation: boolean;
  hasHistoricalRecommendation: boolean;
  providerStatus: ProviderStatusViewModel;
  nextActionTitle?: string;
  nextActionDetail?: string;
}) {
  const recommendationStatus = deriveRecommendationStatus({
    hasCurrentRecommendation,
    hasHistoricalRecommendation,
  });

  return (
    <CompactSummaryRail
      items={[
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
        ...(nextActionTitle
          ? [
              {
                key: "next-action",
                label: "Next action",
                value: nextActionTitle,
                detail: nextActionDetail,
              },
            ]
          : []),
        {
          key: "snapshot",
          label: "Snapshot",
          value: `Version ${snapshotVersion}`,
          detail: "Latest active revision",
        },
        {
          key: "analysis-mode",
          label: "Analysis mode",
          value: providerStatus.shortLabel,
          detail:
            providerStatus.kind === "mock_ready"
              ? "Great for local iteration. Not identical to live model output."
              : providerStatus.kind === "openai_ready"
                ? "Live structured output is active for this environment."
                : "Provider setup needs attention before live analysis can run.",
        },
      ]}
    />
  );
}
