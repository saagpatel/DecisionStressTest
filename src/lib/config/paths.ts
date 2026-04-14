import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { env } from "./env";

function defaultDataDir() {
  if (env.DATA_DIR) {
    return env.DATA_DIR;
  }

  if (env.APP_ENV === "test") {
    return path.join(process.cwd(), ".tmp", "app-data");
  }

  const home = os.homedir();

  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "DecisionStressTest");
  }

  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? path.join(home, "AppData", "Roaming"), "DecisionStressTest");
  }

  return path.join(home, ".local", "share", "decision-stress-test");
}

export const appDataDir = defaultDataDir();
export const logsDir = path.join(appDataDir, "logs");
export const exportsDir = path.join(appDataDir, "exports");
export const backupsDir = path.join(appDataDir, "backups");
export const databasePath =
  env.DATABASE_PATH ?? path.join(appDataDir, `${env.APP_ENV}.sqlite`);

export function ensureRuntimeDirectories() {
  for (const dir of [appDataDir, logsDir, exportsDir, backupsDir, path.dirname(databasePath)]) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}
