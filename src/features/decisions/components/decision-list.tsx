import Link from "next/link";

import { decisionTypeLabels } from "@/features/decisions/lib/options";
import {
  decisionStatusToneClassName,
  deriveRecommendationStatus,
  describeStageForList,
} from "@/features/decisions/lib/decision-status";
import type { StageName } from "@/lib/domain/decision";

type DecisionListItem = {
  id: string;
  title: string;
  decisionType: string;
  currentStage: string;
  updatedAt: string;
  snapshotCount: number;
  recommendationLabel: string | null;
  confidenceLevel: string | null;
  isStaleRecommendation: boolean;
};

export function DecisionList({
  decisions,
  emptyCopy,
}: {
  decisions: DecisionListItem[];
  emptyCopy: string;
}) {
  if (!decisions.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/40 p-8 text-sm text-slate-400">
        {emptyCopy}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {decisions.map((decision) => (
        <Link
          key={decision.id}
          href={`/decisions/${decision.id}`}
          className="grid gap-3 rounded-[28px] border border-white/10 bg-slate-950/55 p-6 transition hover:border-amber-300/30 hover:bg-slate-950/70"
        >
          {(() => {
            const recommendationStatus = deriveRecommendationStatus({
              hasCurrentRecommendation: Boolean(decision.recommendationLabel),
              hasHistoricalRecommendation: decision.isStaleRecommendation,
            });

            return (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/60">
                {decisionTypeLabels[decision.decisionType as keyof typeof decisionTypeLabels] ?? decision.decisionType}
              </p>
              <h3 className="text-xl font-semibold text-white">{decision.title}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                {describeStageForList(decision.currentStage as StageName)}
              </span>
              <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                v{decision.snapshotCount}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${decisionStatusToneClassName(
                  recommendationStatus.tone,
                )}`}
              >
                {recommendationStatus.badge}
              </span>
            </div>
          </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span>
                    Recommendation:{" "}
                    <span className="font-medium text-white">
                      {decision.recommendationLabel ?? "Pending"}
                    </span>
                  </span>
                  {decision.confidenceLevel ? (
                    <span className="text-slate-400">Confidence: {decision.confidenceLevel}</span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-400">{recommendationStatus.title}</p>
                <p className="text-sm text-slate-400">Updated {new Date(decision.updatedAt).toLocaleString()}</p>
              </>
            );
          })()}
        </Link>
      ))}
    </div>
  );
}
