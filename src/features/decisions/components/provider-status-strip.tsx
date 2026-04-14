import type { ReactNode } from "react";

import { providerToneClassName, type ProviderStatusViewModel } from "@/features/decisions/lib/provider-status";

export function ProviderStatusStrip({
  status,
  note,
}: {
  status: ProviderStatusViewModel;
  note?: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${providerToneClassName(
            status.tone,
          )}`}
        >
          {status.badge}
        </span>
        <p className="text-sm font-medium text-white">{status.title}</p>
      </div>
      <p className="text-sm leading-6 text-slate-300">{status.description}</p>
      {note ? <p className="text-xs leading-5 text-slate-400">{note}</p> : null}
    </section>
  );
}
