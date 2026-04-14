"use client";

import { useState, useTransition } from "react";

import type { DatabaseBackupSummary } from "@/lib/db/backup";

import { createBackupAction } from "../actions";

export function BackupPanel({
  appDataPath,
  latestBackup,
}: {
  appDataPath: string;
  latestBackup: DatabaseBackupSummary | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentBackup, setCurrentBackup] = useState(latestBackup);

  function createBackup() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await createBackupAction();

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setCurrentBackup(result.backup);
      setMessage(`Created backup ${result.backup.filename}.`);
    });
  }

  return (
    <section className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isPending ? "Creating a local backup of the decision ledger." : ""}
      </div>
      <div className="grid gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Local safety</p>
        <h2 className="text-2xl font-semibold text-white">Back up the local decision ledger</h2>
        <p className="text-sm leading-6 text-slate-300">
          Use this page as the local safety control center. Backups stay on this machine, and restore remains CLI-only so
          replacing the active database stays explicit.
        </p>
      </div>

      <div className="grid gap-2 text-sm text-slate-300">
        <p>
          <span className="font-medium text-white">Data directory:</span>{" "}
          <code className="rounded bg-white/5 px-2 py-1 text-xs text-amber-100">{appDataPath}</code>
        </p>
        <p>
          <span className="font-medium text-white">Latest backup:</span>{" "}
          {currentBackup ? (
            <>
              <code className="rounded bg-white/5 px-2 py-1 text-xs text-amber-100">{currentBackup.filename}</code>{" "}
              <span className="text-slate-400">created {new Date(currentBackup.createdAt).toLocaleString()}</span>
            </>
          ) : (
            <span className="text-slate-400">No backup created yet.</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={createBackup}
          disabled={isPending}
          className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating backup..." : "Create local backup"}
        </button>
        <p className="text-xs text-slate-400">Restore later with <code>npm run db:restore -- &lt;backup-file&gt;</code>.</p>
      </div>

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100"
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
        >
          {error}
        </div>
      ) : null}
    </section>
  );
}
