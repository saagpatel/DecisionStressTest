import { env, isAiConfigured } from "@/lib/config/env";
import type {
  DecisionIntake,
  NormalizedDecision,
  PremortemAnalysis,
  RegretAnalysis,
  SynthesisDraft,
} from "@/lib/domain/decision";

import { mockProvider } from "./mock-provider";
import { openAiProvider } from "./openai-provider";

export type AiProvider = {
  name: string;
  model: string;
  normalize: (input: DecisionIntake) => Promise<NormalizedDecision>;
  premortem: (input: {
    intake: DecisionIntake;
    normalized: NormalizedDecision;
  }) => Promise<PremortemAnalysis>;
  regret: (input: {
    intake: DecisionIntake;
    normalized: NormalizedDecision;
    premortem: PremortemAnalysis;
  }) => Promise<RegretAnalysis>;
  synthesize: (input: {
    intake: DecisionIntake;
    normalized: NormalizedDecision;
    premortem: PremortemAnalysis;
    regret: RegretAnalysis;
  }) => Promise<SynthesisDraft>;
};

export function getAiProvider() {
  if (env.AI_PROVIDER === "openai" && isAiConfigured) {
    return openAiProvider satisfies AiProvider;
  }

  return mockProvider satisfies AiProvider;
}
