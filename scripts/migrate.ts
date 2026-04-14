import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { ensureRuntimeDirectories } from "../src/lib/config/paths";
import { databasePath } from "../src/lib/config/paths";
import { db } from "../src/lib/db/client";

async function main() {
  ensureRuntimeDirectories();
  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.close();
  migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
