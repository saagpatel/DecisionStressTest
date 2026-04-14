import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { env } from "@/lib/config/env";
import { backupsDir, databasePath, ensureRuntimeDirectories } from "@/lib/config/paths";

export type DatabaseBackupSummary = {
  filename: string;
  path: string;
  createdAt: string;
  sizeBytes: number;
};

export type DatabaseHealth = {
  path: string;
  exists: boolean;
  quickCheck: "ok" | string;
  readable: boolean;
};

function sqliteSidecarPaths(filePath: string) {
  return [`${filePath}-wal`, `${filePath}-shm`];
}

function backupTimestamp(date: Date) {
  return date.toISOString().replaceAll(":", "").replaceAll("-", "").replace(/\.\d{3}Z$/, "Z");
}

function toSummary(filePath: string): DatabaseBackupSummary {
  const stats = fs.statSync(filePath);

  return {
    filename: path.basename(filePath),
    path: filePath,
    createdAt: stats.mtime.toISOString(),
    sizeBytes: stats.size,
  };
}

export function verifySqliteDatabase(filePath: string): DatabaseHealth {
  if (!fs.existsSync(filePath)) {
    return {
      path: filePath,
      exists: false,
      quickCheck: "missing",
      readable: false,
    };
  }

  let sqlite: InstanceType<typeof Database> | null = null;
  try {
    sqlite = new Database(filePath, { readonly: true, fileMustExist: true });
    sqlite.pragma("busy_timeout = 5000");
    const row = sqlite.pragma("quick_check(1)", { simple: true });
    const quickCheck = typeof row === "string" ? row : "unknown";

    return {
      path: filePath,
      exists: true,
      quickCheck,
      readable: quickCheck === "ok",
    };
  } catch (error) {
    return {
      path: filePath,
      exists: true,
      quickCheck: error instanceof Error ? error.message : "unknown",
      readable: false,
    };
  } finally {
    sqlite?.close();
  }
}

export function listDatabaseBackups(params?: {
  backupsDirectory?: string;
}) {
  const directory = params?.backupsDirectory ?? backupsDir;

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".sqlite"))
    .map((file) => path.join(directory, file))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs)
    .map((file) => toSummary(file));
}

export function getLatestDatabaseBackup(params?: {
  backupsDirectory?: string;
}) {
  return listDatabaseBackups(params)[0] ?? null;
}

export async function createDatabaseBackup(params?: {
  sourcePath?: string;
  backupsDirectory?: string;
  now?: Date;
  namePrefix?: string;
}) {
  ensureRuntimeDirectories();

  const sourcePath = params?.sourcePath ?? databasePath;
  const backupDirectory = params?.backupsDirectory ?? backupsDir;
  const createdAt = params?.now ?? new Date();

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Database not found at ${sourcePath}. Run a migration first.`);
  }

  const sourceHealth = verifySqliteDatabase(sourcePath);
  if (!sourceHealth.readable) {
    throw new Error(`Database integrity check failed for ${sourcePath} (${sourceHealth.quickCheck}).`);
  }

  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });

  const filename = `${params?.namePrefix ?? `decision-stress-test-${env.APP_ENV}`}-${backupTimestamp(createdAt)}.sqlite`;
  const destinationPath = path.join(backupDirectory, filename);

  const source = new Database(sourcePath, { fileMustExist: true });
  try {
    source.pragma("busy_timeout = 5000");
    await source.backup(destinationPath);
  } finally {
    source.close();
  }

  return toSummary(destinationPath);
}

function resolveRestoreSource(sourcePath: string, backupDirectory: string) {
  if (path.isAbsolute(sourcePath) || sourcePath.includes(path.sep)) {
    return sourcePath;
  }

  return path.join(backupDirectory, sourcePath);
}

export async function restoreDatabaseBackup(params: {
  sourcePath: string;
  destinationPath?: string;
  backupsDirectory?: string;
}) {
  const backupDirectory = params.backupsDirectory ?? backupsDir;
  const destination = params.destinationPath ?? databasePath;
  const source = resolveRestoreSource(params.sourcePath, backupDirectory);

  if (!fs.existsSync(source)) {
    throw new Error(`Backup file not found at ${source}.`);
  }

  const sourceHealth = verifySqliteDatabase(source);
  if (!sourceHealth.readable) {
    throw new Error(`Backup integrity check failed for ${source} (${sourceHealth.quickCheck}).`);
  }

  const destinationDirectory = path.dirname(destination);
  if (!fs.existsSync(destinationDirectory)) {
    throw new Error(`Destination directory does not exist: ${destinationDirectory}.`);
  }

  let preRestoreBackup: DatabaseBackupSummary | null = null;
  if (fs.existsSync(destination)) {
    preRestoreBackup = await createDatabaseBackup({
      sourcePath: destination,
      backupsDirectory: backupDirectory,
      now: new Date(),
      namePrefix: `decision-stress-test-${env.APP_ENV}-pre-restore`,
    });
  }

  const tempPath = path.join(
    destinationDirectory,
    `${path.basename(destination)}.restore-${crypto.randomUUID()}.tmp`,
  );

  try {
    fs.copyFileSync(source, tempPath);

    const verification = new Database(tempPath, { readonly: true, fileMustExist: true });
    try {
      verification.pragma("schema_version");
    } finally {
      verification.close();
    }

    for (const sidecarPath of sqliteSidecarPaths(destination)) {
      fs.rmSync(sidecarPath, { force: true });
    }

    fs.renameSync(tempPath, destination);
  } catch (error) {
    fs.rmSync(tempPath, { force: true });
    throw error;
  }

  return {
    restoredFrom: source,
    destinationPath: destination,
    restoredAt: new Date().toISOString(),
    preRestoreBackup,
  };
}

export function getDatabaseStatus(params?: {
  sourcePath?: string;
  backupsDirectory?: string;
}) {
  const sourcePath = params?.sourcePath ?? databasePath;
  const backupsDirectory = params?.backupsDirectory ?? backupsDir;

  return {
    database: verifySqliteDatabase(sourcePath),
    latestBackup: getLatestDatabaseBackup({ backupsDirectory }),
  };
}
