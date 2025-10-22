"use client";

import cn from "classnames";
import { ReactNode } from "react";

type ChipProps = {
  icon?: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  className?: string;
};

export function Chip({ icon, label, value, onClick, className }: ChipProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "min-h-[48px] min-w-[120px] rounded-[var(--radius-md)] border border-[var(--card-border)] bg-white px-4 py-3 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 hover:border-[var(--accent)]",
        onClick ? "active:scale-[0.99]" : "",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon ? <div className="text-[var(--accent)]">{icon}</div> : null}
        <div className="flex flex-1 flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            {label}
          </span>
          {value ? (
            <span className="text-lg font-semibold text-[var(--ink)]">{value}</span>
          ) : null}
        </div>
      </div>
    </Component>
  );
}

export default Chip;
