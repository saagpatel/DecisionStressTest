import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "test", "local-prod"]).default("development"),
  DATA_DIR: z.string().trim().optional(),
  DATABASE_PATH: z.string().trim().optional(),
  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  AI_MODEL: z.string().trim().min(1).default("gpt-4o-mini"),
  AI_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  OPENAI_API_KEY: z.string().trim().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  UNSAFE_ALLOW_NONLOCALHOST: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

export type ParsedEnv = z.infer<typeof envSchema>;

export function parseEnvironment(rawEnv: NodeJS.ProcessEnv) {
  return envSchema.safeParse(rawEnv);
}

export function aiConfigurationIssues(env: ParsedEnv) {
  if (env.AI_PROVIDER === "mock") {
    return [];
  }

  const issues: string[] = [];
  if (!env.AI_ENABLED) {
    issues.push("Set AI_ENABLED=true to enable live model calls.");
  }
  if (!env.OPENAI_API_KEY) {
    issues.push("Set OPENAI_API_KEY when AI_PROVIDER=openai.");
  }

  return issues;
}

export function isAiConfigurationUsable(env: ParsedEnv) {
  return env.AI_PROVIDER === "mock" || aiConfigurationIssues(env).length === 0;
}
