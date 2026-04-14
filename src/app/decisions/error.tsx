"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DecisionsError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="page-content" tabIndex={-1} className="grid gap-6 rounded-[32px] border border-rose-400/20 bg-slate-950/55 p-8">
      <div className="grid gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-200/70">Route recovery</p>
        <h1 className="text-3xl font-semibold text-white">This decision view did not load cleanly.</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          The local workbench hit an unexpected route error. Try the route again before trusting what should have appeared here.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => (unstable_retry ? unstable_retry() : reset())}
          className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Try this route again
        </button>
        <Link
          href="/decisions"
          className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Back to decision ledger
        </Link>
      </div>
    </main>
  );
}
