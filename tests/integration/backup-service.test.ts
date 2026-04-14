import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { afterEach, describe, expect, test } from "vitest";

import {
  createDatabaseBackup,
  getLatestDatabaseBackup,
  getDatabaseStatus,
  restoreDatabaseBackup,
} from "@/lib/db/backup";

const tempDirectories: string[] = [];

function createTempDir() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dst-backup-test-"));
  tempDirectories.push(directory);
  return directory;
}

function createFixtureDatabase(filePath: string, value: string) {
  const sqlite = new Database(filePath);
  sqlite.exec("CREATE TABLE entries (value TEXT NOT NULL);");
  sqlite.prepare("INSERT INTO entries (value) VALUES (?)").run(value);
  sqlite.close();
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("database backup service", () => {
  test("creates a readable SQLite backup in the backup directory", async () => {
    const directory = createTempDir();
    const sourcePath = path.join(directory, "source.sqlite");
    const backupDirectory = path.join(directory, "backups");

    createFixtureDatabase(sourcePath, "fresh backup");

    const backup = await createDatabaseBackup({
      sourcePath,
      backupsDirectory: backupDirectory,
      now: new Date("2026-04-13T08:15:00.000Z"),
    });

    expect(fs.existsSync(backup.path)).toBe(true);
    expect(backup.filename).toContain("20260413T081500Z");
    expect(getLatestDatabaseBackup({ backupsDirectory: backupDirectory })?.filename).toBe(backup.filename);

    const restored = new Database(backup.path, { readonly: true, fileMustExist: true });
    try {
      const row = restored.prepare("SELECT value FROM entries").get() as { value: string };
      expect(row.value).toBe("fresh backup");
    } finally {
      restored.close();
    }
  });

  test("rejects backup creation when the database integrity check fails", async () => {
    const directory = createTempDir();
    const sourcePath = path.join(directory, "broken.sqlite");
    fs.writeFileSync(sourcePath, "not-a-sqlite-file");

    await expect(
      createDatabaseBackup({
        sourcePath,
        backupsDirectory: path.join(directory, "backups"),
      }),
    ).rejects.toThrow("Database integrity check failed");
  });

  test("rejects restore when the backup file is missing", async () => {
    const directory = createTempDir();
    const destinationPath = path.join(directory, "restored.sqlite");

    await expect(() =>
      restoreDatabaseBackup({
        sourcePath: path.join(directory, "missing.sqlite"),
        destinationPath,
      }),
    ).rejects.toThrow("Backup file not found");
  });

  test("rejects restore when the destination directory is missing", async () => {
    const directory = createTempDir();
    const backupDirectory = path.join(directory, "backups");
    const sourcePath = path.join(backupDirectory, "fixture.sqlite");

    fs.mkdirSync(backupDirectory, { recursive: true });
    createFixtureDatabase(sourcePath, "restored value");

    await expect(() =>
      restoreDatabaseBackup({
        sourcePath,
        destinationPath: path.join(directory, "missing", "restored.sqlite"),
        backupsDirectory: backupDirectory,
      }),
    ).rejects.toThrow("Destination directory does not exist");
  });

  test("restores a backup into the destination database path", async () => {
    const directory = createTempDir();
    const backupDirectory = path.join(directory, "backups");
    const sourcePath = path.join(backupDirectory, "fixture.sqlite");
    const destinationPath = path.join(directory, "live.sqlite");

    fs.mkdirSync(backupDirectory, { recursive: true });
    createFixtureDatabase(sourcePath, "restored value");
    createFixtureDatabase(destinationPath, "old value");

    const result = await restoreDatabaseBackup({
      sourcePath,
      destinationPath,
      backupsDirectory: backupDirectory,
    });

    expect(result.destinationPath).toBe(destinationPath);
    const sqlite = new Database(destinationPath, { readonly: true, fileMustExist: true });
    try {
      const row = sqlite.prepare("SELECT value FROM entries").get() as { value: string };
      expect(row.value).toBe("restored value");
    } finally {
      sqlite.close();
    }
  });

  test("creates a safety backup before replacing an existing destination database", async () => {
    const directory = createTempDir();
    const backupDirectory = path.join(directory, "backups");
    const sourcePath = path.join(backupDirectory, "fixture.sqlite");
    const destinationPath = path.join(directory, "live.sqlite");

    fs.mkdirSync(backupDirectory, { recursive: true });
    createFixtureDatabase(sourcePath, "restored value");
    createFixtureDatabase(destinationPath, "old value");

    const result = await restoreDatabaseBackup({
      sourcePath,
      destinationPath,
      backupsDirectory: backupDirectory,
    });

    expect(result.preRestoreBackup).toBeTruthy();
    expect(result.preRestoreBackup?.filename).toContain("pre-restore");
    expect(fs.existsSync(result.preRestoreBackup?.path ?? "")).toBe(true);

    const sqlite = new Database(result.preRestoreBackup?.path ?? "", {
      readonly: true,
      fileMustExist: true,
    });
    try {
      const row = sqlite.prepare("SELECT value FROM entries").get() as { value: string };
      expect(row.value).toBe("old value");
    } finally {
      sqlite.close();
    }
  });

  test("removes stale WAL sidecar files before replacing the destination database", async () => {
    const directory = createTempDir();
    const backupDirectory = path.join(directory, "backups");
    const sourcePath = path.join(backupDirectory, "fixture.sqlite");
    const destinationPath = path.join(directory, "live.sqlite");

    fs.mkdirSync(backupDirectory, { recursive: true });
    createFixtureDatabase(sourcePath, "restored value");
    createFixtureDatabase(destinationPath, "old value");
    fs.writeFileSync(`${destinationPath}-wal`, "stale wal");
    fs.writeFileSync(`${destinationPath}-shm`, "stale shm");

    await restoreDatabaseBackup({
      sourcePath,
      destinationPath,
      backupsDirectory: backupDirectory,
    });

    expect(fs.existsSync(`${destinationPath}-wal`)).toBe(false);
    expect(fs.existsSync(`${destinationPath}-shm`)).toBe(false);
  });

  test("reports database status with latest backup info", async () => {
    const directory = createTempDir();
    const sourcePath = path.join(directory, "source.sqlite");
    const backupDirectory = path.join(directory, "backups");

    createFixtureDatabase(sourcePath, "status check");
    const backup = await createDatabaseBackup({
      sourcePath,
      backupsDirectory: backupDirectory,
      now: new Date("2026-04-13T08:15:00.000Z"),
    });

    const status = getDatabaseStatus({
      sourcePath,
      backupsDirectory: backupDirectory,
    });

    expect(status.database.exists).toBe(true);
    expect(status.database.quickCheck).toBe("ok");
    expect(status.latestBackup?.filename).toBe(backup.filename);
  });
});
