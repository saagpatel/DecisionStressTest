import type { ExecutableStageName } from "@/lib/domain/decision";
import { executableStages } from "@/lib/domain/decision";

type StageRunRecord = {
  stage: string;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  refusalReason: string | null;
  provider: string;
};

export type LatestStageFailureRecord = {
  status: "failed";
  errorCode: string | null;
  errorMessage: string | null;
  refusalReason: string | null;
  provider: string;
} | null;

export function deriveLatestFailuresByStage(runs: StageRunRecord[]) {
  const latestRunByStage = new Map<string, StageRunRecord>();

  for (const run of runs) {
    if (!latestRunByStage.has(run.stage)) {
      latestRunByStage.set(run.stage, run);
    }
  }

  const failures = Object.fromEntries(
    executableStages.map((stage) => {
      const run = latestRunByStage.get(stage);

      if (!run || run.status !== "failed") {
        return [stage, null];
      }

      return [
        stage,
        {
          status: "failed" as const,
          errorCode: run.errorCode,
          errorMessage: run.errorMessage,
          refusalReason: run.refusalReason,
          provider: run.provider,
        },
      ];
    }),
  ) as Record<ExecutableStageName, LatestStageFailureRecord>;

  return failures;
}
