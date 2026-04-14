import Link from "next/link";

import type { StarterExample } from "@/features/decisions/lib/starter-examples";

export function StarterExampleLinks({
  examples,
}: {
  examples: readonly StarterExample[];
}) {
  return (
    <section className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-6">
      <div className="grid gap-1">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Starter examples</p>
        <h2 className="text-2xl font-semibold text-white">Start from a realistic decision</h2>
        <p className="text-sm leading-6 text-slate-300">
          Use one of these examples to see the full flow before writing your own decision from scratch.
        </p>
      </div>
      <div className="grid gap-3">
        {examples.map((example) => (
          <Link
            key={example.id}
            href={`/decisions/new?example=${example.id}`}
            className="grid gap-1 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-amber-300/30 hover:bg-white/[0.05]"
          >
            <span className="text-sm font-semibold text-white">{example.title}</span>
            <span className="text-sm leading-6 text-slate-300">{example.description}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Start from example</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
