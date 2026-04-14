"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { ExecutableStageName, StageName } from "@/lib/domain/decision";

import { runStageAction } from "../actions";
import type { WorkbenchStageState } from "../lib/workbench-status";

export function StageActions({
  decisionId,
  currentStage,
  stageStates,
  showIntro = true,
}: {
  decisionId: string;
  currentStage: StageName;
  stageStates: WorkbenchStageState[];
  showIntro?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<
    | {
        tone: "status";
        text: string;
      }
    | {
        tone: "error";
        error: string;
        recoveryText?: string;
        refusalReason?: string | null;
      }
    | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [pendingStage, setPendingStage] = useState<ExecutableStageName | null>(null);
  const blockedStages = stageStates.filter((stage) => stage.status === "blocked" && stage.disabledReason);
  const pendingStageState = pendingStage ? stageStates.find((stage) => stage.stage === pendingStage) : null;

  function run(stage: ExecutableStageName) {
    const stageTitle = stageStates.find((candidate) => candidate.stage === stage)?.title ?? "Stage";
    setMessage(null);
    setPendingStage(stage);
    startTransition(async () => {
      const result = await runStageAction(decisionId, stage);
      if (!result.ok) {
        setMessage({
          tone: "error",
          error: result.error,
          recoveryText: "recoveryText" in result ? result.recoveryText : undefined,
          refusalReason: "refusalReason" in result ? result.refusalReason : null,
        });
        setPendingStage(null);
        return;
      }
      setMessage({
        tone: "status",
        text: `${stageTitle} completed. Refreshing the latest decision view.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isPending && pendingStageState
          ? `Running ${pendingStageState.title}. Results will refresh when complete.`
          : message?.tone === "status"
            ? message.text
            : ""}
      </div>
      {showIntro ? (
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70">Next action</p>
          <p className="text-sm text-slate-300">
            Run the next ready stage or rerun a completed one for the latest snapshot.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3" aria-label="Stage actions">
        {stageStates.map((stage) => (
          <button
            key={stage.stage}
            type="button"
            onClick={() => run(stage.stage)}
            disabled={isPending || !stage.canRun}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && pendingStage === stage.stage ? `Running ${stage.title}...` : stage.actionLabel}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Current stage: <span className="font-medium text-slate-200">{currentStage}</span>
      </p>
      {blockedStages.length ? (
        <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
          {blockedStages.map((stage) => (
            <p key={stage.stage}>
              <span className="font-medium text-slate-100">{stage.title}:</span> {stage.disabledReason}
            </p>
          ))}
        </div>
      ) : null}
      {message?.tone === "error" ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
        >
          <p>{message.error}</p>
          {message.refusalReason ? <p className="mt-2 text-rose-100/90">{message.refusalReason}</p> : null}
          {message.recoveryText ? <p className="mt-2 text-rose-100/90">{message.recoveryText}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
