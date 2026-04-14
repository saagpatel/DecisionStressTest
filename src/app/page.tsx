import Link from "next/link";

import { DecisionList } from "@/features/decisions/components/decision-list";
import { ProviderStatusStrip } from "@/features/decisions/components/provider-status-strip";
import { StarterExampleLinks } from "@/features/decisions/components/starter-example-links";
import { aiConfigIssues, env } from "@/lib/config/env";
import { listDecisions } from "@/lib/db/repositories";
import { deriveProviderStatus } from "@/features/decisions/lib/provider-status";
import { starterExamples } from "@/features/decisions/lib/starter-examples";

export default async function Home() {
  const decisions = await listDecisions();
  const providerStatus = deriveProviderStatus({
    provider: env.AI_PROVIDER,
    aiEnabled: env.AI_ENABLED,
    issues: aiConfigIssues,
  });
  return (
    <main id="page-content" tabIndex={-1} className="grid flex-1 gap-8">
      <section className="grid gap-6 rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(11,26,45,0.92),rgba(17,24,39,0.78))] px-8 py-10 shadow-[0_30px_120px_-45px_rgba(242,193,78,0.45)]">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="grid gap-5">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Decision workbench</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Stress-test the decision from both directions before you commit.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Turn one medium-stakes professional choice into a recommendation, a risk register, evidence thresholds,
              kill criteria, and a memo you can actually act on.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/decisions/new"
                className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                Start a decision
              </Link>
              <Link
                href="/decisions"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View saved work
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-6">
            <h2 className="text-lg font-semibold text-white">What this app produces</h2>
            <ul className="grid gap-3 text-sm leading-6 text-slate-300">
              <li>- Recommendation label with confidence</li>
              <li>- Risk and assumptions register</li>
              <li>- Regret and opportunity-cost summary</li>
              <li>- Mitigation checklist and reversible next step</li>
              <li>- Evidence thresholds and kill criteria</li>
            </ul>
          </div>
        </div>
        <ProviderStatusStrip status={providerStatus} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-6">
          <div className="grid gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">How to use this locally</p>
            <h2 className="text-2xl font-semibold text-white">A good first run takes four steps</h2>
          </div>
          <ol className="grid gap-3 text-sm leading-6 text-slate-300">
            <li>1. Start from blank or use one of the built-in examples.</li>
            <li>2. Create the decision and run the staged analysis.</li>
            <li>3. Review the memo, recommendation, and risk register.</li>
            <li>4. Revisit history when the intake changes or the decision evolves.</li>
          </ol>
          <p className="text-sm leading-6 text-slate-400">
            Mock mode is enough for local work. No OpenAI key is required unless you explicitly switch to live analysis.
          </p>
        </section>

        <StarterExampleLinks examples={starterExamples} />
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div className="grid gap-1">
            <h2 className="text-2xl font-semibold text-white">Recent decisions</h2>
            <p className="text-sm text-slate-400">Saved history stays on disk so the second use is better than the first.</p>
          </div>
        </div>

        <DecisionList
          decisions={decisions}
          emptyCopy="No decisions saved yet. Create one to generate the first workbench artifact set."
        />
      </section>
    </main>
  );
}
