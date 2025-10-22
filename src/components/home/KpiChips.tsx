"use client";

import { Flame, Clock3, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { MetricsRow } from "@/lib/metrics";

const placeholders = [
  { label: "Streak", icon: <Flame className="h-5 w-5" />, field: "streak" as const },
  { label: "Minutes", icon: <Clock3 className="h-5 w-5" />, field: "minutes_read" as const },
  { label: "Cards", icon: <BookOpen className="h-5 w-5" />, field: "cards_read" as const },
];

type KpiChipsProps = {
  metrics: MetricsRow | null;
  isLoading?: boolean;
  onPress?: () => void;
};

export function KpiChips({ metrics, isLoading = false, onPress }: KpiChipsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {placeholders.map((item) => (
          <Skeleton key={item.label} className="h-[72px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {placeholders.map((item) => {
        const value = metrics?.[item.field] ?? 0;
        const ariaLabel = `${item.label} ${value}`;
        return (
          <Button
            key={item.label}
            type="button"
            variant={value > 0 ? "subtle" : "ghost"}
            className="flex h-full flex-col items-start gap-2 rounded-2xl border border-[var(--card-border)] bg-white px-4 py-3 text-left"
            onClick={onPress}
            aria-label={`Open tracker for ${ariaLabel}`}
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </span>
            <span className="text-lg font-semibold text-[var(--ink)]">{value}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default KpiChips;
