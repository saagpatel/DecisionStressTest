import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export function DecisionNav({
  decisionId,
  active,
  hasCurrentMemo,
}: {
  decisionId: string;
  active: "workbench" | "memo" | "history";
  hasCurrentMemo: boolean;
}) {
  const baseClassName =
    "rounded-full border px-4 py-2 text-sm font-medium transition";
  const activeClassName = "border-amber-300/30 bg-amber-300/15 text-amber-100";
  const idleClassName = "border-white/12 bg-white/5 text-slate-200 hover:bg-white/10";
  const memoAvailabilityMessageId = `decision-nav-memo-note-${decisionId}`;

  return (
    <nav className="flex flex-wrap gap-3" aria-label="Decision navigation">
      <Link
        href={`/decisions/${decisionId}`}
        aria-current={active === "workbench" ? "page" : undefined}
        className={cn(baseClassName, active === "workbench" ? activeClassName : idleClassName)}
      >
        Workbench
      </Link>
      {hasCurrentMemo ? (
        <Link
          href={`/decisions/${decisionId}/memo`}
          aria-current={active === "memo" ? "page" : undefined}
          className={cn(baseClassName, active === "memo" ? activeClassName : idleClassName)}
        >
          Memo
        </Link>
      ) : (
        <>
          <span
            aria-disabled="true"
            aria-describedby={memoAvailabilityMessageId}
            className={cn(baseClassName, "cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-500")}
          >
            Memo
          </span>
          <p id={memoAvailabilityMessageId} className="w-full text-xs text-slate-400">
            Memo becomes available after the latest snapshot completes synthesis and generates a fresh memo.
          </p>
        </>
      )}
      <Link
        href={`/decisions/${decisionId}/history`}
        aria-current={active === "history" ? "page" : undefined}
        className={cn(baseClassName, active === "history" ? activeClassName : idleClassName)}
      >
        History
      </Link>
    </nav>
  );
}
