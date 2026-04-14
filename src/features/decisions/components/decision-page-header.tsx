import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type DecisionPageHeaderProps = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  nav?: ReactNode;
  summary?: ReactNode;
  className?: string;
};

export function DecisionPageHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  description,
  action,
  nav,
  summary,
  className,
}: DecisionPageHeaderProps) {
  return (
    <header className={cn("grid gap-4 rounded-[32px] border border-white/10 bg-slate-950/55 p-8", className)}>
      <Link href={backHref} className="text-sm text-amber-200/80 transition hover:text-amber-100">
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">{eyebrow}</p>
          <h1 className="text-4xl font-semibold text-white">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {action ? <div className="flex shrink-0 items-start">{action}</div> : null}
      </div>
      {nav ? <div>{nav}</div> : null}
      {summary ? <div>{summary}</div> : null}
    </header>
  );
}
