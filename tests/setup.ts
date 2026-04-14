import "@testing-library/jest-dom/vitest";
import fs from "node:fs";

process.env.APP_ENV = process.env.APP_ENV ?? "test";
process.env.AI_PROVIDER = process.env.AI_PROVIDER ?? "mock";
process.env.AI_ENABLED = process.env.AI_ENABLED ?? "false";
process.env.DATABASE_PATH = process.env.DATABASE_PATH ?? ".tmp/test.sqlite";
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "error";

const { db } = await import("../src/lib/db/client");
const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
const schema = await import("../src/lib/db/schema");

fs.mkdirSync(".tmp", { recursive: true });
migrate(db, { migrationsFolder: "./src/lib/db/migrations" });

beforeEach(() => {
  db.delete(schema.decisionMemos).run();
  db.delete(schema.recommendations).run();
  db.delete(schema.synthesisDrafts).run();
  db.delete(schema.regretAnalyses).run();
  db.delete(schema.premortemAnalyses).run();
  db.delete(schema.normalizedDecisions).run();
  db.delete(schema.stageRuns).run();
  db.delete(schema.decisionSnapshots).run();
  db.delete(schema.decisions).run();
});
