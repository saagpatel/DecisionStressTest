import { defineConfig, devices } from "@playwright/test";

const e2ePort = 3100;
const e2eRunId = `${process.pid}`;
const e2eDataDir = `.tmp/e2e-app-data-${e2eRunId}`;
const e2eDatabasePath = `.tmp/e2e-${e2eRunId}.sqlite`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      `mkdir -p ${e2eDataDir} && ` +
      `APP_ENV=test AI_PROVIDER=mock AI_ENABLED=false DATA_DIR=${e2eDataDir} DATABASE_PATH=${e2eDatabasePath} npm run build && ` +
      `APP_ENV=test AI_PROVIDER=mock AI_ENABLED=false DATA_DIR=${e2eDataDir} DATABASE_PATH=${e2eDatabasePath} npm run db:migrate && ` +
      `APP_ENV=test AI_PROVIDER=mock AI_ENABLED=false DATA_DIR=${e2eDataDir} DATABASE_PATH=${e2eDatabasePath} next start --hostname 127.0.0.1 --port ${e2ePort}`,
    port: e2ePort,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
