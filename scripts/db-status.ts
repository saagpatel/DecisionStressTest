import { appDataDir, backupsDir, databasePath } from "../src/lib/config/paths";
import { getDatabaseStatus } from "../src/lib/db/backup";

async function main() {
  const status = getDatabaseStatus();

  console.log("Decision Stress Test database status");
  console.log(`App data directory: ${appDataDir}`);
  console.log(`Database path: ${databasePath}`);
  console.log(`Backups directory: ${backupsDir}`);
  console.log(
    status.database.exists
      ? `Database quick check: ${status.database.quickCheck}`
      : "Database quick check: database file not created yet",
  );

  if (status.latestBackup) {
    console.log(`Latest backup: ${status.latestBackup.filename}`);
    console.log(`Latest backup time: ${status.latestBackup.createdAt}`);
  } else {
    console.log("Latest backup: none yet");
  }

  if (status.database.exists && !status.database.readable) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
