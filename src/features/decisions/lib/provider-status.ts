import type { ParsedEnv } from "@/lib/config/env-schema";

export const providerStatusKinds = [
  "mock_ready",
  "openai_ready",
  "openai_misconfigured",
] as const;

export type ProviderStatusKind = (typeof providerStatusKinds)[number];

export type ProviderStatusViewModel = {
  kind: ProviderStatusKind;
  badge: string;
  shortLabel: string;
  title: string;
  description: string;
  tone: "mock" | "live" | "warning";
};

export function deriveProviderStatus(params: {
  provider: ParsedEnv["AI_PROVIDER"];
  aiEnabled: boolean;
  issues: string[];
}): ProviderStatusViewModel {
  if (params.provider === "mock") {
    return {
      kind: "mock_ready",
      badge: "Mock mode",
      shortLabel: "Mock simulation",
      title: "Mock mode: deterministic local simulation. No OpenAI key required.",
      description: "Useful for product iteration and local checks. It stays deterministic and does not match live model behavior exactly.",
      tone: "mock",
    };
  }

  if (!params.aiEnabled || params.issues.length > 0) {
    return {
      kind: "openai_misconfigured",
      badge: "OpenAI setup incomplete",
      shortLabel: "OpenAI misconfigured",
      title: "OpenAI mode is selected but incomplete. The app needs OPENAI_API_KEY and AI_ENABLED=true.",
      description: params.issues.join(" "),
      tone: "warning",
    };
  }

  return {
    kind: "openai_ready",
    badge: "OpenAI mode",
    shortLabel: "OpenAI structured analysis",
    title: "OpenAI mode: live structured analysis is enabled.",
    description: "Live model output is active for staged analysis and recommendation artifacts.",
    tone: "live",
  };
}

export function providerToneClassName(tone: ProviderStatusViewModel["tone"]) {
  switch (tone) {
    case "mock":
      return "border-sky-300/20 bg-sky-300/10 text-sky-100";
    case "live":
      return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
    case "warning":
      return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
}

export function analysisSourceLabel(provider: string) {
  return provider === "openai" ? "OpenAI structured analysis" : "Mock simulation";
}

export function deriveAnalysisSource(params: {
  runs: Array<{
    status: string;
    stage: string;
    provider: string;
    completedAt: string | null;
    startedAt: string;
  }>;
  fallback: ProviderStatusViewModel;
}) {
  const succeededRuns = params.runs.filter((run) => run.status === "succeeded");

  const bestRun =
    succeededRuns
      .slice()
      .sort((left, right) => {
        const leftScore = left.stage === "synthesis" ? 1 : 0;
        const rightScore = right.stage === "synthesis" ? 1 : 0;
        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }

        const leftDate = left.completedAt ?? left.startedAt;
        const rightDate = right.completedAt ?? right.startedAt;
        return rightDate.localeCompare(leftDate);
      })[0] ?? null;

  return bestRun ? analysisSourceLabel(bestRun.provider) : params.fallback.shortLabel;
}
