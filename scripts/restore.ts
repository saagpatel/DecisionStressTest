import { restoreDatabaseBackup } from "../src/lib/db/backup";

async function main() {
  const sourcePath = process.argv[2];

  if (!sourcePath) {
    throw new Error("Provide a backup filename or path. Example: npm run db:restore -- backup.sqlite");
  }

  console.log("WARNING: close the app before restore so the live SQLite file is not replaced while it is open.");
  const result = await restoreDatabaseBackup({ sourcePath });
  console.log(`Restored database from ${result.restoredFrom} to ${result.destinationPath}`);
  if (result.preRestoreBackup) {
    console.log(`Created a safety backup before restore: ${result.preRestoreBackup.path}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
