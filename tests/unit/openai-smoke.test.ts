import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("openai smoke configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("fails clearly when the live provider env is incomplete", async () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("OPENAI_API_KEY", "");

    const { assertOpenAiSmokeConfiguration } = await import("@/lib/ops/openai-smoke");

    expect(() => assertOpenAiSmokeConfiguration()).toThrow(
      "OpenAI smoke test requires OPENAI_API_KEY plus AI_PROVIDER=openai and AI_ENABLED=true.",
    );
  });
});
