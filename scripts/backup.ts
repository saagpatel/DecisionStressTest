import { createDatabaseBackup } from "../src/lib/db/backup";

async function main() {
  const backup = await createDatabaseBackup();
  console.log(`Created verified backup at ${backup.path}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
