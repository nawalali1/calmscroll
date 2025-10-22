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
        "rounded-2xl border border-white/25 bg-white/20 text-slate-900 shadow-lg backdrop-blur-md transition",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export default GlassCard;
