import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { databasePath, ensureRuntimeDirectories } from "../src/lib/config/paths";
import { db } from "../src/lib/db/client";
import { createDecision, getDecisionById } from "../src/lib/db/repositories";
import { decisionIntakeSchema } from "../src/lib/domain/decision";
import { runStage } from "../src/lib/analysis/pipeline";
import { assertOpenAiSmokeConfiguration } from "../src/lib/ops/openai-smoke";

async function main() {
  assertOpenAiSmokeConfiguration();

  ensureRuntimeDirectories();
  const sqlite = new Database(databasePath, { fileMustExist: false });
  sqlite.close();
  migrate(db, { migrationsFolder: "./src/lib/db/migrations" });

  const input = decisionIntakeSchema.parse({
    title: "OpenAI smoke check decision",
    decisionType: "tool_workflow_adoption",
    primaryOption: "Adopt the new local release hardening workflow",
    baselineAlternative: "Keep using the existing manual release checklist",
    whyThisMatters: "The live provider path should prove that structured outputs still work in the real release flow.",
    decisionDeadline: "2026-05-01",
    timeHorizon: "2 weeks",
    constraints: ["Keep the test small", "Do not touch production data"],
    stakesLevel: "low",
    successDefinition: "Receive one valid normalized frame and one valid premortem.",
    biggestKnownUncertainties: ["How the live provider responds to the current prompt contracts"],
  });

  const decisionId = await createDecision(input);
  await runStage(decisionId, "normalization");
  await runStage(decisionId, "premortem");

  const detail = await getDecisionById(decisionId);
  if (!detail?.normalized || !detail.premortem) {
    throw new Error("OpenAI smoke test did not persist the expected stage outputs.");
  }

  console.log("OpenAI smoke test passed.");
  console.log(`Decision id: ${decisionId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
