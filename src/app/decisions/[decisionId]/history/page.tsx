import Link from "next/link";
import { notFound } from "next/navigation";

import { CompactSummaryRail } from "@/features/decisions/components/compact-summary-rail";
import { DecisionPageHeader } from "@/features/decisions/components/decision-page-header";
import { DecisionNav } from "@/features/decisions/components/decision-nav";
import { SnapshotLedger } from "@/features/decisions/components/snapshot-ledger";
import { StageCard } from "@/features/decisions/components/stage-card";
import { SurfacePanel } from "@/features/decisions/components/surface-panel";
import { deriveHistoryPageViewModel } from "@/features/decisions/lib/history-page";
import {
  getDecisionById,
  getDecisionSnapshotDetail,
  getPreviousSnapshotForDecision,
  listDecisionSnapshots,
} from "@/lib/db/repositories";
import { cn } from "@/lib/utils/cn";

export const runtime = "nodejs";

export default async function DecisionHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ decisionId: string }>;
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const { decisionId } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedSnapshotParam = Array.isArray(resolvedSearchParams.snapshot)
    ? resolvedSearchParams.snapshot[0]
    : resolvedSearchParams.snapshot;

  const [history, currentDetail] = await Promise.all([listDecisionSnapshots(decisionId), getDecisionById(decisionId)]);

  if (!history?.decision || !history.snapshots.length) {
    notFound();
  }

  const selectedSummary =
    history.snapshots.find((snapshot) => snapshot.snapshot.id === selectedSnapshotParam) ?? history.snapshots[0];
  const detail = await getDecisionSnapshotDetail(decisionId, selectedSummary.snapshot.id);

  if (!detail?.decision || !detail.snapshot) {
    notFound();
  }

  const previousSnapshot = await getPreviousSnapshotForDecision(decisionId, detail.snapshot.version);
  const previousDetail = previousSnapshot
    ? await getDecisionSnapshotDetail(decisionId, previousSnapshot.id)
    : null;
  const viewModel = deriveHistoryPageViewModel({
    decisionId,
    history,
    currentDetail,
    selectedSummary,
    detail,
    previousDetail,
  });

  return (
    <main id="page-content" tabIndex={-1} className="grid gap-8">
      <DecisionPageHeader
        backHref={`/decisions/${decisionId}`}
        backLabel="← Back to workbench"
        eyebrow="Decision history"
        title={history.decision.title}
        description="Review how the decision changed over time without reactivating older snapshots. The active workbench still runs only on the latest snapshot."
        nav={<DecisionNav decisionId={decisionId} active="history" hasCurrentMemo={Boolean(currentDetail?.memo)} />}
        summary={<CompactSummaryRail testId="history-summary-rail" items={viewModel.summaryItems} />}
      />

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.25fr]">
        <SurfacePanel as="aside">
          <div className="grid gap-1">
            <h2 className="text-xl font-semibold text-white">Snapshot ledger</h2>
            <p className="text-sm leading-6 text-slate-300">
              Select any snapshot to inspect it in place. The active version stays separate from read-only historical
              revisions.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
            Current stays tied to the active workbench. Historical stays read-only. A stale note means the last complete
            recommendation still belongs to an older version.
          </div>
          <SnapshotLedger groups={viewModel.ledgerGroups} selectedSnapshotId={selectedSummary.snapshot.id} />
        </SurfacePanel>

        <div className="grid gap-6">
          <div data-testid="selected-snapshot-panel">
            <SurfacePanel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-1">
                  <h2 className="text-2xl font-semibold text-white">{viewModel.selectedSnapshotLabel}</h2>
                  <p className="text-sm text-slate-400">Latest completed: {viewModel.selectedStageLabel}</p>
                </div>
                {detail.memo ? (
                  <Link
                    href={
                      selectedSummary.isCurrentSnapshot
                        ? `/decisions/${decisionId}/memo`
                        : `/decisions/${decisionId}/memo?snapshot=${detail.snapshot.id}`
                    }
                    className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {selectedSummary.isCurrentSnapshot ? "Open current memo" : "Open snapshot memo"}
                  </Link>
                ) : null}
              </div>
              <div
                className={cn(
                  "grid gap-2 rounded-2xl border px-4 py-4 text-sm",
                  selectedSummary.isCurrentSnapshot
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
                    : "border-amber-300/20 bg-amber-300/10 text-amber-100",
                )}
              >
                <p className="font-semibold">{viewModel.selectionStatus.bannerTitle}</p>
                <p className="leading-6">{viewModel.selectionStatus.bannerBody}</p>
              </div>
              {viewModel.hasOlderRecommendation ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  The latest snapshot has not been synthesized yet, so the last completed recommendation lives on an older
                  version.
                </div>
              ) : null}
            </SurfacePanel>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {viewModel.stageCards.map((stage) => (
              <StageCard
                key={stage}
                stage={stage}
                normalized={detail.normalized}
                premortem={detail.premortem}
                regret={detail.regret}
                synthesis={detail.synthesis}
                recommendation={detail.recommendation}
                latestFailure={viewModel.latestFailures[stage]}
                stageState={viewModel.stageStateByName.get(stage)}
              />
            ))}
          </div>

          <div data-testid="snapshot-comparison-panel">
            <SurfacePanel>
              <div className="grid gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">What changed</p>
                <h2 className="text-2xl font-semibold text-white">Snapshot comparison</h2>
              </div>
              <div className="grid gap-5 text-sm text-slate-300">
                <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="leading-6 text-slate-200">{viewModel.comparison.topLineSummary}</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium text-white">Recommendation and workflow</p>
                    <ul className="grid gap-3">
                      <li>
                        <span className="font-medium text-white">Decision movement:</span>{" "}
                        {viewModel.comparison.decisionDelta.summaryLabel}
                      </li>
                      <li>
                        <span className="font-medium text-white">Recommendation:</span>{" "}
                        {viewModel.comparison.decisionDelta.previousLabel ?? "None yet"} {"->"}{" "}
                        {viewModel.comparison.decisionDelta.currentLabel ?? "Pending refresh"}
                      </li>
                      <li>{viewModel.comparison.decisionDelta.confidenceSummary}</li>
                      <li>{viewModel.comparison.decisionDelta.nextStepSummary}</li>
                      <li>{viewModel.comparison.workflowDelta.summary}</li>
                      <li>{viewModel.comparison.workflowDelta.memoStatus}</li>
                    </ul>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium text-white">Intake changes</p>
                    {viewModel.comparison.intakeChanges.framing.length ? (
                      <ul className="grid gap-1">
                        {viewModel.comparison.intakeChanges.framing.map((field) => (
                          <li key={field.field}>- {field.label}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No decision-framing fields changed.</p>
                    )}
                    <p>{viewModel.comparison.intakeChanges.constraints.summary}</p>
                    <p>{viewModel.comparison.intakeChanges.uncertainties.summary}</p>
                  </div>
                </div>
              </div>
            </SurfacePanel>
          </div>
        </div>
      </section>
    </main>
  );
}
