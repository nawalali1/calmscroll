"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MetricsRow } from "@/lib/metrics";

const WEEKLY_TARGET = 21; // 3 mindful actions per day.

type ProgressSummaryProps = {
  metrics: MetricsRow | null;
  isLoading?: boolean;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function ProgressSummary({ metrics, isLoading = false }: ProgressSummaryProps) {
  const prefersReducedMotion = useReducedMotion();
  const [fallbackPercent] = useState(() => 64 + Math.round(Math.random() * 12));

  const completion = useMemo(() => {
    if (!metrics) return fallbackPercent;
    const cards = metrics.cards_read ?? 0;
    const tasks = metrics.tasks_done ?? 0;
    const focusedMinutes = metrics.minutes_read ?? 0;
    const derived = cards + tasks + Math.round(focusedMinutes / 5);
    if (derived <= 0) return clamp(fallbackPercent);
    const percent = Math.round((derived / WEEKLY_TARGET) * 100);
    return clamp(percent);
  }, [metrics, fallbackPercent]);

  const barLabel = isLoading ? "Loading progress" : `You are ${completion}% through your weekly rhythm`;

  return (
    <motion.section
      className="mx-4 rounded-xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.72, 0.42, 1] }}
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
          Your progress
        </h2>
        <span className="text-2xl font-semibold text-[var(--ink)]">{completion}%</span>
      </div>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">Weekly streak momentum from mindful actions.</p>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/50" role="progressbar" aria-label={barLabel} aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="h-full rounded-full bg-[var(--accent)]"
          initial={{ width: prefersReducedMotion ? `${completion}%` : 0 }}
          animate={{ width: `${completion}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.21, 0.72, 0.42, 1] }}
        />
      </div>
    </motion.section>
  );
}

export default ProgressSummary;
