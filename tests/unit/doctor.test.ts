import path from "node:path";
import os from "node:os";

import { describe, expect, test } from "vitest";

import { runDoctor } from "@/lib/ops/doctor";

describe("local doctor", () => {
  test("passes in mock mode with writable local paths", () => {
    const tempRoot = path.join(os.tmpdir(), "dst-doctor-ok");
    const report = runDoctor({
      NODE_ENV: "test",
      APP_ENV: "test",
      AI_PROVIDER: "mock",
      AI_ENABLED: "false",
      DATA_DIR: tempRoot,
      DATABASE_PATH: path.join(tempRoot, "app.sqlite"),
      LOG_LEVEL: "info",
    });

    expect(report.environment.ok).toBe(true);
    expect(report.ai.ok).toBe(true);
    expect(report.ok).toBe(true);
  });

  test("reports exactly what is missing in openai mode", () => {
    const tempRoot = path.join(os.tmpdir(), "dst-doctor-openai");
    const report = runDoctor({
      NODE_ENV: "test",
      APP_ENV: "test",
      AI_PROVIDER: "openai",
      AI_ENABLED: "false",
      DATA_DIR: tempRoot,
      DATABASE_PATH: path.join(tempRoot, "app.sqlite"),
      LOG_LEVEL: "info",
    });

    expect(report.ai.ok).toBe(false);
    expect(report.ai.issues.join(" ")).toContain("AI_ENABLED=true");
    expect(report.ai.issues.join(" ")).toContain("OPENAI_API_KEY");
    expect(report.ok).toBe(false);
  });

  test("fails when localhost-only protections are explicitly disabled", () => {
    const tempRoot = path.join(os.tmpdir(), "dst-doctor-unsafe-host");
    const report = runDoctor({
      NODE_ENV: "development",
      APP_ENV: "development",
      AI_PROVIDER: "mock",
      AI_ENABLED: "false",
      DATA_DIR: tempRoot,
      DATABASE_PATH: path.join(tempRoot, "app.sqlite"),
      LOG_LEVEL: "info",
      UNSAFE_ALLOW_NONLOCALHOST: "true",
    });

    expect(report.safety.ok).toBe(false);
    expect(report.safety.issues.join(" ")).toContain("localhost-only guard");
    expect(report.ok).toBe(false);
  });

  test("fails when live data is configured inside the repo workspace", () => {
    const repoLocalDataDir = path.join(process.cwd(), ".tmp", "doctor-live-data");
    const report = runDoctor({
      NODE_ENV: "development",
      APP_ENV: "development",
      AI_PROVIDER: "mock",
      AI_ENABLED: "false",
      DATA_DIR: repoLocalDataDir,
      DATABASE_PATH: path.join(repoLocalDataDir, "development.sqlite"),
      LOG_LEVEL: "info",
    });

    expect(report.safety.ok).toBe(false);
    expect(report.safety.issues.join(" ")).toContain("inside the repo");
    expect(report.ok).toBe(false);
  });
});
