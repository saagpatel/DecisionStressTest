import { AlertTriangle, Beaker, Compass, ShieldCheck } from "lucide-react";

import { SurfacePanel } from "@/features/decisions/components/surface-panel";
import { stageCopy } from "@/features/decisions/lib/options";
import {
  defaultRecoveryActionForFailure,
  failureTitle,
  recoveryActionLabel,
} from "@/lib/analysis/errors";
import type { WorkbenchStageState } from "@/features/decisions/lib/workbench-status";
import type {
  NormalizedDecision,
  PremortemAnalysis,
  Recommendation,
  RegretAnalysis,
  StageFailureType,
  SynthesisDraft,
  StageName,
} from "@/lib/domain/decision";
import { stageFailureTypes } from "@/lib/domain/decision";

const icons = {
  normalization: Compass,
  premortem: AlertTriangle,
  regret: Beaker,
  synthesis: ShieldCheck,
};

type Props = {
  stage: Exclude<StageName, "intake" | "memo">;
  normalized?: NormalizedDecision | null;
  premortem?: PremortemAnalysis | null;
  regret?: RegretAnalysis | null;
  synthesis?: SynthesisDraft | null;
  recommendation?: Recommendation | null;
  latestFailure?: {
    status: "failed";
    errorCode: string | null;
    errorMessage: string | null;
    refusalReason: string | null;
    provider: string;
  } | null;
  stageState?: WorkbenchStageState;
};

function badgeClassName(label: WorkbenchStageState["status"] | undefined) {
  switch (label) {
    case "complete":
      return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
    case "ready":
      return "border-sky-300/20 bg-sky-300/10 text-sky-100";
    case "blocked":
      return "border-slate-300/15 bg-slate-300/10 text-slate-200";
    case "missing":
      return "border-white/10 bg-white/5 text-slate-200";
    case "failed_with_stale_output":
    case "failed_without_output":
      return "border-rose-300/20 bg-rose-300/10 text-rose-100";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function StageCardShell({
  stage,
  stageState,
  children,
}: {
  stage: Props["stage"];
  stageState?: WorkbenchStageState;
  children: React.ReactNode;
}) {
  const Icon = icons[stage];
  const copy = stageCopy[stage];

  return (
    <SurfacePanel className="shadow-[0_18px_80px_-50px_rgba(245,158,11,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-200">
            <Icon className="h-5 w-5" />
          </div>
          <div className="grid gap-1">
            <h3 className="text-lg font-semibold text-white">{copy.title}</h3>
            <p className="text-sm leading-6 text-slate-300">{copy.description}</p>
            {stageState ? <p className="text-xs text-slate-400">{stageState.statusMessage}</p> : null}
          </div>
        </div>
        {stageState ? (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${badgeClassName(stageState.status)}`}
          >
            {stageState.badgeLabel}
          </span>
        ) : null}
      </div>
      {children}
    </SurfacePanel>
  );
}

function StageFailureNotice({
  latestFailure,
  failureType,
  failureRecoveryAction,
  hasArtifact,
  stage,
}: {
  latestFailure: NonNullable<Props["latestFailure"]>;
  failureType: StageFailureType | null;
  failureRecoveryAction: ReturnType<typeof defaultRecoveryActionForFailure> | null;
  hasArtifact: boolean;
  stage: Props["stage"];
}) {
  if (!failureType) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <p className="font-medium">{failureTitle(failureType)}</p>
      <p className="mt-1">{latestFailure.errorMessage}</p>
      {latestFailure.refusalReason ? <p className="mt-2 text-rose-100/90">{latestFailure.refusalReason}</p> : null}
      {failureRecoveryAction ? (
        <p className="mt-2 text-rose-100/90">{recoveryActionLabel(failureRecoveryAction)}</p>
      ) : null}
      {hasArtifact ? (
        <p className="mt-2 text-rose-100/90">
          The last successful {stage} output is still shown below until a new run succeeds.
        </p>
      ) : null}
    </div>
  );
}

function StageEmptyState({ stageState }: { stageState?: WorkbenchStageState }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
      {stageState?.status === "blocked"
        ? stageState.statusMessage
        : stageState?.status === "ready"
          ? stageState.statusMessage
          : "This stage has not been generated for the latest intake snapshot yet."}
    </p>
  );
}

function NormalizationBody({ normalized }: { normalized: NonNullable<Props["normalized"]> }) {
  return (
    <div className="grid gap-3 text-sm text-slate-200">
      <p>{normalized.decisionFrame}</p>
      <ul className="grid gap-2 text-slate-300">
        {normalized.successCriteria.map((criterion) => (
          <li key={criterion}>- {criterion}</li>
        ))}
      </ul>
    </div>
  );
}

function PremortemBody({ premortem }: { premortem: NonNullable<Props["premortem"]> }) {
  return (
    <div className="grid gap-4 text-sm">
      <p className="text-slate-200">{premortem.failureNarrative}</p>
      <div className="grid gap-2">
        {premortem.risks.map((risk) => (
          <div key={risk.title} className="rounded-2xl border border-white/8 bg-white/5 p-4 text-slate-200">
            <p className="font-semibold text-white">{risk.title}</p>
            <p className="mt-1 text-slate-300">{risk.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegretBody({ regret }: { regret: NonNullable<Props["regret"]> }) {
  return (
    <div className="grid gap-4 text-sm">
      <p className="text-slate-200">{regret.opportunityCostSummary}</p>
      <ul className="grid gap-2 text-slate-300">
        {regret.regretFactors.map((factor) => (
          <li key={factor.title}>- {factor.title}: {factor.description}</li>
        ))}
      </ul>
    </div>
  );
}

function SynthesisBody({
  recommendation,
}: {
  recommendation: NonNullable<Props["recommendation"]>;
}) {
  return (
    <div className="grid gap-4 text-sm text-slate-200">
      <p className="text-xl font-semibold text-white">{recommendation.label}</p>
      <p>{recommendation.coreRationale}</p>
      <ul className="grid gap-2 text-slate-300">
        {recommendation.guardrails.map((guardrail) => (
          <li key={guardrail}>- {guardrail}</li>
        ))}
      </ul>
    </div>
  );
}

export function StageCard(props: Props) {
  const failureType =
    props.latestFailure?.errorCode &&
    stageFailureTypes.includes(props.latestFailure.errorCode as StageFailureType)
      ? (props.latestFailure.errorCode as StageFailureType)
      : null;
  const failureRecoveryAction =
    failureType && props.latestFailure
      ? defaultRecoveryActionForFailure(failureType, props.latestFailure.provider)
      : null;
  const hasArtifact =
    (props.stage === "normalization" && Boolean(props.normalized)) ||
    (props.stage === "premortem" && Boolean(props.premortem)) ||
    (props.stage === "regret" && Boolean(props.regret)) ||
    (props.stage === "synthesis" && Boolean(props.synthesis));

  return (
    <StageCardShell stage={props.stage} stageState={props.stageState}>
      {props.stage === "normalization" && props.normalized ? <NormalizationBody normalized={props.normalized} /> : null}
      {props.stage === "premortem" && props.premortem ? <PremortemBody premortem={props.premortem} /> : null}
      {props.stage === "regret" && props.regret ? <RegretBody regret={props.regret} /> : null}
      {props.stage === "synthesis" && props.synthesis && props.recommendation ? (
        <SynthesisBody recommendation={props.recommendation} />
      ) : null}

      {props.latestFailure ? (
        <StageFailureNotice
          latestFailure={props.latestFailure}
          failureType={failureType}
          failureRecoveryAction={failureRecoveryAction}
          hasArtifact={hasArtifact}
          stage={props.stage}
        />
      ) : null}

      {((props.stage === "normalization" && !props.normalized) ||
        (props.stage === "premortem" && !props.premortem) ||
        (props.stage === "regret" && !props.regret) ||
        (props.stage === "synthesis" && !props.synthesis)) ? (
        <StageEmptyState stageState={props.stageState} />
      ) : null}
    </StageCardShell>
  );
}
