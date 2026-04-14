"use client";

import { useEffect } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

type SnapshotLedgerRow = {
  snapshotId: string;
  href: string;
  version: number;
  createdAt: string;
  summary: {
    snapshotBadge: string;
    stageLabel: string;
    recommendationText: string;
    confidenceText: string | null;
    staleText: string | null;
  };
};

type SnapshotLedgerGroup = {
  title: string;
  rows: SnapshotLedgerRow[];
};

export function SnapshotLedger({
  groups,
  selectedSnapshotId,
}: {
  groups: SnapshotLedgerGroup[];
  selectedSnapshotId: string;
}) {
  const totalRows = groups.reduce((count, group) => count + group.rows.length, 0);
  const isScrollable = totalRows > 6;

  useEffect(() => {
    const element = document.querySelector<HTMLElement>(`[data-snapshot-ledger-id="${selectedSnapshotId}"]`);
    element?.scrollIntoView?.({
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedSnapshotId]);

  return (
    <div
      data-testid="snapshot-ledger"
      className={cn("grid gap-4", isScrollable && "max-h-[34rem] overflow-y-auto pr-2")}
    >
      {groups.map((group) =>
        group.rows.length ? (
          <section key={group.title} className="grid gap-3">
            <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">{group.title}</p>
            </div>
            <div className="grid gap-3">
              {group.rows.map((row) => {
                const isSelected = row.snapshotId === selectedSnapshotId;

                return (
                  <Link
                    key={row.snapshotId}
                    href={row.href}
                    aria-current={isSelected ? "page" : undefined}
                    data-snapshot-ledger-id={row.snapshotId}
                    className={cn(
                      "grid gap-2 rounded-2xl border px-4 py-4 transition",
                      isSelected
                        ? "border-amber-200/70 bg-amber-300/15 shadow-[0_18px_60px_-42px_rgba(251,191,36,0.9)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/8",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">Version {row.version}</p>
                      <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                        {row.summary.snapshotBadge}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">
                      Recommendation: <span className="font-medium text-white">{row.summary.recommendationText}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Latest stage: {row.summary.stageLabel}</span>
                      {row.summary.confidenceText ? (
                        <span className="uppercase tracking-[0.2em]">{row.summary.confidenceText}</span>
                      ) : null}
                    </div>
                    {row.summary.staleText ? <p className="text-xs text-amber-100">{row.summary.staleText}</p> : null}
                    <p className="text-[11px] text-slate-500">{new Date(row.createdAt).toLocaleString()}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
