import { describe, expect, test } from "vitest";

import playwrightConfig from "../../playwright.config";

describe("playwright release gate config", () => {
  test("uses an isolated local server for the canonical browser gate", () => {
    const webServer = Array.isArray(playwrightConfig.webServer)
      ? playwrightConfig.webServer[0]
      : playwrightConfig.webServer;

    expect(playwrightConfig.use?.baseURL).toBe("http://127.0.0.1:3100");
    expect(webServer?.port).toBe(3100);
    expect(webServer?.reuseExistingServer).toBe(false);
    expect(webServer?.command).toContain("mkdir -p .tmp/e2e-app-data-");
    expect(webServer?.command).toContain("DATA_DIR=.tmp/e2e-app-data-");
    expect(webServer?.command).toContain("DATABASE_PATH=.tmp/e2e-");
    expect(webServer?.command).toContain("npm run build");
    expect(webServer?.command).toContain("npm run db:migrate");
    expect(webServer?.command).toContain("next start --hostname 127.0.0.1 --port 3100");
  });
});
