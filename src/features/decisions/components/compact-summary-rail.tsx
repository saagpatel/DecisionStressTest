import { cn } from "@/lib/utils/cn";

export type CompactSummaryRailItem = {
  key: string;
  label: string;
  value: string;
  detail?: string;
  featured?: boolean;
  badge?: {
    label: string;
    className: string;
  };
};

export function CompactSummaryRail({
  items,
  testId,
}: {
  items: CompactSummaryRailItem[];
  testId?: string;
}) {
  return (
    <section data-testid={testId} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.key}
          className={cn(
            "grid gap-2 rounded-[24px] border border-white/10 bg-white/[0.03] p-4",
            item.featured && "md:col-span-2",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70">{item.label}</p>
            {item.badge ? (
              <span
                className={cn(
                  "inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]",
                  item.badge.className,
                )}
              >
                {item.badge.label}
              </span>
            ) : null}
          </div>
          <p className={cn("font-semibold text-white", item.featured ? "text-base leading-7" : "text-sm")}>
            {item.value}
          </p>
          {item.detail ? <p className="text-sm leading-6 text-slate-300">{item.detail}</p> : null}
        </article>
      ))}
    </section>
  );
}
