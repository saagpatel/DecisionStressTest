import { notFound } from "next/navigation";

import { DecisionPageHeader } from "@/features/decisions/components/decision-page-header";
import { DecisionNav } from "@/features/decisions/components/decision-nav";
import { MemoSourcePanel } from "@/features/decisions/components/memo-source-panel";
import { ProviderStatusStrip } from "@/features/decisions/components/provider-status-strip";
import { SurfacePanel } from "@/features/decisions/components/surface-panel";
import { aiConfigIssues, env } from "@/lib/config/env";
import { getDecisionById, getDecisionSnapshotDetail } from "@/lib/db/repositories";
import { deriveAnalysisSource, deriveProviderStatus } from "@/features/decisions/lib/provider-status";

export const runtime = "nodejs";

export default async function DecisionMemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ decisionId: string }>;
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const { decisionId } = await params;
  const resolvedSearchParams = await searchParams;
  const snapshotParam = Array.isArray(resolvedSearchParams.snapshot)
    ? resolvedSearchParams.snapshot[0]
    : resolvedSearchParams.snapshot;
  const currentDetail = await getDecisionById(decisionId);
  const detail = snapshotParam
    ? await getDecisionSnapshotDetail(decisionId, snapshotParam)
    : currentDetail;

  if (!detail?.decision || !detail.memo || !detail.recommendation || !detail.premortem || !detail.regret) {
    notFound();
  }

  const isHistoricalSnapshot =
    detail.snapshot?.id !== currentDetail?.snapshot?.id;
  const historicalHistoryHref = detail.snapshot?.id
    ? `/decisions/${decisionId}/history?snapshot=${detail.snapshot.id}`
    : `/decisions/${decisionId}/history`;
  const providerStatus = deriveProviderStatus({
    provider: env.AI_PROVIDER,
    aiEnabled: env.AI_ENABLED,
    issues: aiConfigIssues,
  });
  const analysisSource = deriveAnalysisSource({
    runs: detail.runs,
    fallback: providerStatus,
  });

  return (
    <main id="page-content" tabIndex={-1} className="grid gap-8">
      <DecisionPageHeader
        backHref={isHistoricalSnapshot ? historicalHistoryHref : `/decisions/${decisionId}`}
        backLabel={isHistoricalSnapshot ? "← Back to history" : "← Back to workbench"}
        eyebrow="Decision memo"
        title={detail.decision.title}
        description={
          isHistoricalSnapshot
            ? "Review this older memo without replacing the current exportable decision memo."
            : "Use this as the current decision artifact for review, export, and follow-through."
        }
        action={
          isHistoricalSnapshot ? (
            <span className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-400">
              Export is available for the latest snapshot only
            </span>
          ) : (
            <a
              href={`/api/decisions/${decisionId}/export`}
              className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Export Markdown
            </a>
          )
        }
        nav={<DecisionNav decisionId={decisionId} active="memo" hasCurrentMemo={Boolean(currentDetail?.memo)} />}
        summary={
          <ProviderStatusStrip
            status={providerStatus}
            note="Mock mode is useful for product iteration and local proofing, but it is not identical to live model output."
          />
        }
      />

      <MemoSourcePanel
        isHistoricalSnapshot={isHistoricalSnapshot}
        historyHref={historicalHistoryHref}
        analysisSource={analysisSource}
      />

      <article className="grid gap-8 rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
        <SurfacePanel className="bg-white/[0.03] p-5 lg:grid-cols-3">
          <div className="grid gap-1">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70">Recommendation</p>
            <p className="text-lg font-semibold text-white">{detail.recommendation.label}</p>
          </div>
          <div className="grid gap-1">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70">Confidence</p>
            <p className="text-lg font-semibold capitalize text-white">{detail.recommendation.confidenceLevel}</p>
          </div>
          <div className="grid gap-1">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70">Next step</p>
            <p className="text-sm leading-6 text-slate-300">{detail.recommendation.recommendedNextStep}</p>
          </div>
        </SurfacePanel>

        <section className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Recommendation</p>
          <h2 className="text-3xl font-semibold text-white">{detail.recommendation.label}</h2>
          <p className="text-sm leading-7 text-slate-300">{detail.recommendation.coreRationale}</p>
        </section>

        <SurfacePanel className="bg-white/[0.03] p-5 lg:grid-cols-2">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-white">Key risks</h3>
            <ul className="grid gap-2 text-sm text-slate-300">
              {detail.premortem.risks.map((risk) => (
                <li key={risk.title}>- {risk.title}: {risk.description}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-white">Assumptions</h3>
            <ul className="grid gap-2 text-sm text-slate-300">
              {detail.premortem.assumptions.map((assumption) => (
                <li key={assumption.statement}>- {assumption.statement}</li>
              ))}
            </ul>
          </div>
        </SurfacePanel>

        <SurfacePanel className="bg-white/[0.03] p-5">
          <h3 className="text-lg font-semibold text-white">Regret / opportunity cost</h3>
          <p className="text-sm leading-7 text-slate-300">{detail.regret.opportunityCostSummary}</p>
        </SurfacePanel>

        <SurfacePanel className="bg-white/[0.03] p-5 lg:grid-cols-2">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-white">Mitigation checklist</h3>
            <ul className="grid gap-2 text-sm text-slate-300">
              {detail.premortem.mitigations.map((mitigation) => (
                <li key={mitigation.checklistItem}>- {mitigation.checklistItem}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-white">Evidence needed</h3>
            <ul className="grid gap-2 text-sm text-slate-300">
              {detail.regret.evidenceThresholds.map((threshold) => (
                <li key={threshold.statement}>- {threshold.thresholdText}</li>
              ))}
            </ul>
          </div>
        </SurfacePanel>

        <SurfacePanel className="bg-white/[0.03] p-5 lg:grid-cols-2">
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-white">Reversible next step</h3>
            <p className="text-sm leading-7 text-slate-300">{detail.recommendation.recommendedNextStep}</p>
          </div>
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-white">Kill criteria</h3>
            <ul className="grid gap-2 text-sm text-slate-300">
              {detail.regret.killCriteria.map((criterion) => (
                <li key={criterion.statement}>- {criterion.statement}</li>
              ))}
            </ul>
          </div>
        </SurfacePanel>

        <details className="grid gap-3 rounded-[24px] border border-white/10 bg-slate-950/40 p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">Show raw Markdown memo</summary>
          <pre className="overflow-x-auto rounded-[20px] border border-white/10 bg-slate-950/80 p-5 text-sm leading-7 text-slate-300">
            {detail.memo}
          </pre>
        </details>
      </article>
    </main>
  );
}
