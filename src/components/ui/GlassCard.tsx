"use client";

import { forwardRef, HTMLAttributes } from "react";
import cn from "classnames";

type GlassCardProps = HTMLAttributes<HTMLDivElement>;

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--ink)] shadow-lg backdrop-blur-md transition",
        "dark:border-white/10 dark:bg-neutral-900/70 dark:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export default GlassCard;
