import Link from "next/link";

export function MemoSourcePanel({
  isHistoricalSnapshot,
  historyHref,
  analysisSource,
}: {
  isHistoricalSnapshot: boolean;
  historyHref: string;
  analysisSource: string;
}) {
  return (
    <div className="grid gap-3">
      {isHistoricalSnapshot ? (
        <div className="grid gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm text-amber-100">
          <p className="font-semibold">This is a historical snapshot memo.</p>
          <p>The memo is read-only and does not replace the latest exportable decision memo.</p>
          <Link href={historyHref} className="text-amber-50 underline underline-offset-4">
            Return to this snapshot in history
          </Link>
        </div>
      ) : (
        <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
          <p className="font-semibold text-white">This is the current snapshot memo.</p>
          <p>Use it as the active decision artifact for export and follow-through.</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
        <span className="text-xs uppercase tracking-[0.25em] text-amber-300/70">Analysis source</span>
        <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 font-medium text-white">
          {analysisSource}
        </span>
        <span className="text-slate-400">This is the provider source behind the memo you are reading.</span>
      </div>
    </div>
  );
}
