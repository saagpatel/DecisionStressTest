import type { StageName } from "@/lib/domain/decision";

import { stageCopy } from "./options";

export function describeDecisionProgress(stage: StageName) {
  switch (stage) {
    case "intake":
      return "Latest snapshot needs a fresh decision frame.";
    case "normalization":
      return "Decision frame is ready. Risk review is next.";
    case "premortem":
      return "Risk review is underway on the latest snapshot.";
    case "regret":
      return "Tradeoff review is underway on the latest snapshot.";
    case "synthesis":
      return "Recommendation synthesis is underway on the latest snapshot.";
    case "memo":
      return "Recommendation and memo are current for the latest snapshot.";
  }
}

export function summarizeStageForPeople(stage: StageName) {
  if (stage === "intake") {
    return "Intake revision";
  }

  if (stage === "memo") {
    return "Memo ready";
  }

  return stageCopy[stage].title;
}
