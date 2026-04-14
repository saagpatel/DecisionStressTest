import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { ensureRuntimeDirectories, databasePath } from "@/lib/config/paths";

import * as schema from "./schema";

declare global {
  var __decisionStressDb__: ReturnType<typeof createDatabase> | undefined;
}

function createDatabase() {
  ensureRuntimeDirectories();
  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  return drizzle(sqlite, { schema });
}

export function getDb() {
  if (!globalThis.__decisionStressDb__) {
    globalThis.__decisionStressDb__ = createDatabase();
  }

  return globalThis.__decisionStressDb__;
}

export const db = new Proxy({} as ReturnType<typeof createDatabase>, {
  get(_target, property, receiver) {
    const liveDb = getDb();
    const value = Reflect.get(liveDb, property, receiver);
    return typeof value === "function" ? value.bind(liveDb) : value;
  },
});
