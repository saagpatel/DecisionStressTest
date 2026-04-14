import { env, isAiConfigured } from "@/lib/config/env";

export function assertOpenAiSmokeConfiguration() {
  if (env.AI_PROVIDER !== "openai" || !isAiConfigured) {
    throw new Error(
      "OpenAI smoke test requires OPENAI_API_KEY plus AI_PROVIDER=openai and AI_ENABLED=true.",
    );
  }
}
