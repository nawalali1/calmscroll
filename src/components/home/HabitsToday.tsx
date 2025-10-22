"use client";

import { memo, useMemo } from "react";
import { SlidersHorizontal, Moon, Footprints, Bike } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import cn from "classnames";
import GlassCard from "@/components/ui/GlassCard";
import type { HabitItem, HabitStatus } from "./types";

type HabitsTodayProps = {
  items?: HabitItem[];
  isLoading?: boolean;
  onFilter?: () => void;
};

const statusStyles: Record<HabitStatus, { dot: string; labelColor: string }> = {
  Completed: { dot: "bg-emerald-500", labelColor: "text-emerald-200" },
  Pending: { dot: "bg-amber-500", labelColor: "text-amber-200" },
  Missed: { dot: "bg-rose-500", labelColor: "text-rose-200" },
};

const fallbackHabits: HabitItem[] = [
  { id: "mock-sleep", title: "Night Sleep", status: "Completed", time: "06:00 AM", icon: Moon },
  { id: "mock-walk", title: "Morning Walk", status: "Pending", time: "07:00 AM", icon: Footprints },
  { id: "mock-cycle", title: "Cycling", status: "Pending", time: "09:00 AM", icon: Bike },
];

export const HabitsToday = memo(function HabitsToday({ items, isLoading = false, onFilter }: HabitsTodayProps) {
  const reducedMotion = useReducedMotion();

  const list = useMemo(() => {
    if (items && items.length > 0) return items;
    if (isLoading) return [];
    return fallbackHabits;
  }, [items, isLoading]);

  return (
    <section aria-labelledby="habits-today-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="habits-today-heading" className="text-lg font-semibold text-white/90">
          Today’s Habits
        </h2>
        <button
          type="button"
          onClick={onFilter}
          aria-label="Filters"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition hover:border-white/50 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/20" />
          ))}
        </div>
      ) : null}

      {!isLoading && list.length === 0 ? (
        <p className="text-sm text-white/70">No habits for today.</p>
      ) : null}

      <div className="space-y-3">
        {list.map((item) => {
          const Icon = item.icon;
          const status = statusStyles[item.status];
          const motionProps = reducedMotion
            ? {}
            : {
                whileHover: { y: -2, boxShadow: "0 22px 40px -30px rgba(11,59,100,0.75)" },
                whileTap: { scale: 0.98 },
              };
          return (
            <motion.div key={item.id} {...motionProps} transition={{ duration: 0.2 }}>
              <GlassCard className="flex items-center justify-between gap-4 px-4 py-4 text-white/90">
                <div className="flex flex-1 items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-base font-semibold text-white">{item.title}</span>
                    <span className={cn("mt-1 flex items-center gap-2 text-xs font-medium", status.labelColor)}>
                      <span className={cn("inline-flex h-2.5 w-2.5 rounded-full", status.dot)} aria-hidden />
                      {item.status}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white/80">{item.time}</span>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
});

export default HabitsToday;
