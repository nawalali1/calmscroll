"use client";

import { ReactNode } from "react";
import cn from "classnames";

type CardProps = {
  as?: "div" | "section" | "article";
  className?: string;
  children: ReactNode;
  elevated?: boolean;
};

export function Card({ as: Component = "section", className, children, elevated = true }: CardProps) {
  return (
    <Component
      className={cn(
        "rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-5 transition-shadow",
        elevated ? "shadow-sm" : "shadow-none",
        className
      )}
    >
      {children}
    </Component>
  );
}

export default Card;
