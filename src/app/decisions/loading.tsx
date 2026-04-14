export default function DecisionsLoading() {
  return (
    <main id="page-content" tabIndex={-1} className="grid gap-8" aria-busy="true" aria-live="polite">
      <section className="grid gap-4 rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Loading</p>
          <h1 className="text-3xl font-semibold text-white">Loading decision view...</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            The local decision workspace is responding. This route will fill in as soon as the latest decision data is ready.
          </p>
        </div>
        <div className="h-4 w-40 rounded-full bg-white/10" />
        <div className="h-12 w-3/4 rounded-2xl bg-white/10" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-white/8" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-6">
          <div className="h-6 w-48 rounded-full bg-white/10" />
          <div className="h-24 rounded-[24px] bg-white/[0.04]" />
          <div className="h-24 rounded-[24px] bg-white/[0.04]" />
        </div>
        <div className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-6">
          <div className="h-6 w-40 rounded-full bg-white/10" />
          <div className="h-56 rounded-[24px] bg-white/[0.04]" />
        </div>
      </section>
    </main>
  );
}
