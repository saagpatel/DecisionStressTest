import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type SurfacePanelProps<T extends ElementType = "section"> = {
  as?: T;
  className?: string;
  children: ReactNode;
};

export function SurfacePanel<T extends ElementType = "section">({
  as,
  className,
  children,
}: SurfacePanelProps<T>) {
  const Component = as ?? "section";

  return (
    <Component className={cn("grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-6", className)}>
      {children}
    </Component>
  );
}
