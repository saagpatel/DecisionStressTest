import Link from "next/link";
import { notFound } from "next/navigation";

import { CompactSummaryRail } from "@/features/decisions/components/compact-summary-rail";
import { DecisionPageHeader } from "@/features/decisions/components/decision-page-header";
import { DecisionNav } from "@/features/decisions/components/decision-nav";
import { DecisionIntakeForm } from "@/features/decisions/components/decision-intake-form";
import { StageActions } from "@/features/decisions/components/stage-actions";
import { StageCard } from "@/features/decisions/components/stage-card";
import { SurfacePanel } from "@/features/decisions/components/surface-panel";
import { decisionTypeLabels } from "@/features/decisions/lib/options";
import { deriveWorkbenchPageViewModel } from "@/features/decisions/lib/workbench-page";
import { aiConfigIssues, env } from "@/lib/config/env";
import { getDecisionById } from "@/lib/db/repositories";
import { deriveProviderStatus } from "@/features/decisions/lib/provider-status";

export const runtime = "nodejs";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = await params;
  const detail = await getDecisionById(decisionId);

  if (!detail?.decision || !detail.snapshot) {
    notFound();
  }

  const providerStatus = deriveProviderStatus({
    provider: env.AI_PROVIDER,
    aiEnabled: env.AI_ENABLED,
    issues: aiConfigIssues,
  });
  const viewModel = deriveWorkbenchPageViewModel({
    detail,
    providerStatus,
  });

  return (
    <main id="page-content" tabIndex={-1} className="grid gap-8">
      <DecisionPageHeader
        backHref="/decisions"
        backLabel="← Back to decision history"
        eyebrow={
          decisionTypeLabels[detail.decision.decisionType as keyof typeof decisionTypeLabels] ??
          detail.decision.decisionType
        }
        title={detail.decision.title}
        description={viewModel.progressSummary}
        action={
          detail.recommendation ? (
            <Link
              href={`/decisions/${decisionId}/memo`}
              className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Open memo
            </Link>
          ) : null
        }
        nav={<DecisionNav decisionId={decisionId} active="workbench" hasCurrentMemo={Boolean(detail.memo)} />}
        summary={<CompactSummaryRail testId="workbench-summary-rail" items={viewModel.summaryItems} />}
      />

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="grid gap-6">
          <div data-testid="next-action-panel">
            <SurfacePanel className="gap-3 bg-white/[0.03] p-4">
              <div className="grid gap-2">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70">Next action</p>
                <h2 className="text-xl font-semibold text-white">{viewModel.nextAction.title}</h2>
                <p className="text-sm leading-6 text-slate-300">{viewModel.nextAction.detail}</p>
              </div>
              {viewModel.activeAlert ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  {viewModel.activeAlert}
                </div>
              ) : null}
              <StageActions
                decisionId={decisionId}
                currentStage={detail.decision.currentStage}
                stageStates={viewModel.stageStates}
                showIntro={false}
              />
            </SurfacePanel>
          </div>
          {viewModel.stageCards.map((stageCard) => (
            <StageCard
              key={stageCard.stage}
              stage={stageCard.stage}
              normalized={detail.normalized}
              premortem={detail.premortem}
              regret={detail.regret}
              synthesis={detail.synthesis}
              recommendation={detail.recommendation}
              latestFailure={stageCard.latestFailure}
              stageState={viewModel.stageStateByName.get(stageCard.stage)}
            />
          ))}
        </div>

        <aside className="grid gap-6">
          <SurfacePanel>
            <h2 className="text-xl font-semibold text-white">Edit the latest intake snapshot</h2>
            <p className="text-sm leading-6 text-slate-300">
              Save a new intake revision when the decision framing changes. The workbench will keep the older trail, but
              the downstream stages will need a fresh run for the latest snapshot.
            </p>
            <DecisionIntakeForm decisionId={decisionId} initialValue={detail.snapshot.rawIntakeJson} />
          </SurfacePanel>
        </aside>
      </section>
    </main>
  );
}
