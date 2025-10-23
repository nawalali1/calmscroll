"use client";

import { ReactNode } from "react";
import cn from "classnames";

type TabsRootProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

type TabsListProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

type TabsTriggerProps = {
  value: string;
  isActive: boolean;
  onSelect: (value: string) => void;
  children: ReactNode;
};

type TabsContentProps = {
  value: string;
  activeValue: string;
  children: ReactNode;
  className?: string;
};

export function TabsRoot({ value, children, className }: TabsRootProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} data-value={value}>
      {children}
    </div>
  );
}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "grid grid-cols-2 gap-2 rounded-full bg-white/60 p-1 text-sm font-medium",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, isActive, onSelect, children }: TabsTriggerProps) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`tab-${value}`}
      onClick={() => onSelect(value)}
      className={cn(
        "min-h-[44px] rounded-full px-3 py-2 transition",
        isActive
          ? "bg-white text-[var(--accent)] shadow-sm"
          : "text-[var(--ink-muted)] hover:bg-white/70"
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, activeValue, children, className }: TabsContentProps) {
  if (value !== activeValue) return null;
  return (
    <div role="tabpanel" id={`tab-${value}`} className={cn("rounded-[var(--radius-lg)]", className)}>
      {children}
    </div>
  );
}
