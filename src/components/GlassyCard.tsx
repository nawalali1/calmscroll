"use client";

import { forwardRef, HTMLAttributes } from "react";
import cn from "classnames";

export type GlassyCardProps = HTMLAttributes<HTMLDivElement>;

export const GlassyCard = forwardRef<HTMLDivElement, GlassyCardProps>(function GlassyCard(
  { className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn("glass transition-all duration-200 hover:-translate-y-0.5 focus-within:-translate-y-0.5", className)} {...props}>
      {children}
    </div>
  );
});

export default GlassyCard;
