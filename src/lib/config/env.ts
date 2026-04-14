import { aiConfigurationIssues, isAiConfigurationUsable, parseEnvironment } from "./env-schema";

const parsed = parseEnvironment(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export const aiConfigIssues = aiConfigurationIssues(env);

export const isAiConfigured = isAiConfigurationUsable(env);
