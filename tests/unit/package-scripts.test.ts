import packageJson from "../../package.json";
import { describe, expect, test } from "vitest";

describe("package scripts", () => {
  test("runs doctor before the canonical release gate", () => {
    expect(packageJson.scripts["release:check"]).toContain("APP_ENV=local-prod npm run doctor &&");
  });

  test("runs the browser suite in strict CI mode during release checks", () => {
    expect(packageJson.scripts["release:check"]).toContain("CI=1 npm run test:e2e");
  });

  test("cleans e2e runtime state before starting the browser suite", () => {
    expect(packageJson.scripts["test:e2e"]).toContain("rm -rf .tmp/e2e-app-data .tmp/e2e.sqlite");
  });
});
