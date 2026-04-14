import { describe, expect, test } from "vitest";

import {
  deriveAnalysisSource,
  deriveProviderStatus,
} from "@/features/decisions/lib/provider-status";

describe("provider status", () => {
  test("derives mock mode as ready", () => {
    const status = deriveProviderStatus({
      provider: "mock",
      aiEnabled: false,
      issues: [],
    });

    expect(status.kind).toBe("mock_ready");
    expect(status.title).toContain("No OpenAI key required");
  });

  test("derives live OpenAI mode as ready", () => {
    const status = deriveProviderStatus({
      provider: "openai",
      aiEnabled: true,
      issues: [],
    });

    expect(status.kind).toBe("openai_ready");
    expect(status.shortLabel).toBe("OpenAI structured analysis");
  });

  test("surfaces incomplete OpenAI configuration", () => {
    const status = deriveProviderStatus({
      provider: "openai",
      aiEnabled: false,
      issues: ["Set OPENAI_API_KEY when AI_PROVIDER=openai."],
    });

    expect(status.kind).toBe("openai_misconfigured");
    expect(status.description).toContain("OPENAI_API_KEY");
  });

  test("prefers the latest successful synthesis run as the analysis source", () => {
    const source = deriveAnalysisSource({
      runs: [
        {
          status: "succeeded",
          stage: "premortem",
          provider: "mock",
          completedAt: "2026-04-13T08:00:00.000Z",
          startedAt: "2026-04-13T07:59:00.000Z",
        },
        {
          status: "succeeded",
          stage: "synthesis",
          provider: "openai",
          completedAt: "2026-04-13T08:05:00.000Z",
          startedAt: "2026-04-13T08:04:00.000Z",
        },
      ],
      fallback: deriveProviderStatus({
        provider: "mock",
        aiEnabled: false,
        issues: [],
      }),
    });

    expect(source).toBe("OpenAI structured analysis");
  });
});
