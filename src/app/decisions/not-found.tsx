import Link from "next/link";

export default function DecisionsNotFound() {
  return (
    <main id="page-content" tabIndex={-1} className="grid gap-6 rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
      <div className="grid gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Not found</p>
        <h1 className="text-3xl font-semibold text-white">That decision or snapshot is not available.</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          The requested decision view could not be found. Open the decision ledger to pick an available decision or snapshot trail.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/decisions"
          className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Open decision ledger
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
