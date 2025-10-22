"use client";

import { useEffect, useMemo, useState } from "react";
import { Frown, Meh, Smile, Sun, Heart, Activity, ChevronRight } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";

const DAILY_SCORE = 72;
const RING_RADIUS = 56;
const RING_STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const MOODS = [
  { id: 0, label: "Very Low", icon: Frown },
  { id: 1, label: "Low", icon: Activity },
  { id: 2, label: "Balanced", icon: Meh },
  { id: 3, label: "Aligned", icon: Smile },
  { id: 4, label: "Elevated", icon: Sun },
] as const;

const WEEK_TEMPLATE = [
  { day: "Mon", logged: true },
  { day: "Tue", logged: true },
  { day: "Wed", logged: false },
  { day: "Thu", logged: true },
  { day: "Fri", logged: false },
  { day: "Sat", logged: true },
  { day: "Sun", logged: true },
] as const;

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function DailyScoreRing({ value }: { value: number }) {
  const progress = Math.min(100, Math.max(0, value));
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
        <circle
          cx="70"
          cy="70"
          r={RING_RADIUS}
          stroke="url(#ring-bg)"
          strokeWidth={RING_STROKE}
          fill="none"
          className="opacity-40"
        />
        <defs>
          <linearGradient id="ring-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="ring-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={RING_RADIUS}
          stroke="url(#ring-active)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          fill="none"
          className={prefersReducedMotion ? "" : "transition-all duration-700 ease-out"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-semibold text-slate-900 dark:text-white">{progress}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
          Daily Score
        </span>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const [selectedMood, setSelectedMood] = useState<number | null>(2);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, []);

  const weekData = useMemo(() => WEEK_TEMPLATE, []);
  const hasLogs = weekData.some((day) => day.logged);

  const handleMoodKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedMood((prev) => (prev == null ? index : Math.min(MOODS.length - 1, (prev + 1) % MOODS.length)));
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedMood((prev) =>
        prev == null ? index : (prev - 1 + MOODS.length * 2) % MOODS.length
      );
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedMood(index);
    }
  };

  return (
    <main className="min-h-screen bg-calm-gradient pb-28 text-slate-900 transition-colors dark:text-white">
      <header className="bg-calm-gradient px-5 pt-12 pb-6 shadow-[0_25px_60px_-25px_rgba(15,23,42,0.4)]">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Wellness Tracker</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-300">
          Keep a gentle pulse on your mood and rituals. These snapshots add up to meaningful trends.
        </p>
      </header>

      <section className="px-5 py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <GlassyCard className="flex flex-col items-center gap-6 bg-white/60 p-6 text-center dark:bg-white/10">
              <div className="animate-pulse rounded-full bg-white/70 dark:bg-white/5" style={{ height: 192, width: 192 }} />
              <div className="h-4 w-32 animate-pulse rounded-full bg-white/70 dark:bg-white/10" />
              <div className="h-3 w-48 animate-pulse rounded-full bg-white/60 dark:bg-white/10" />
            </GlassyCard>
            <GlassyCard className="animate-pulse bg-white/60 p-5 dark:bg-white/10">
              <div className="h-5 w-1/3 rounded-full bg-white/70 dark:bg-white/10" />
              <div className="mt-4 grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-12 rounded-full bg-white/70 dark:bg-white/5" />
                ))}
              </div>
            </GlassyCard>
            <GlassyCard className="animate-pulse bg-white/60 p-5 dark:bg-white/10">
              <div className="h-5 w-28 rounded-full bg-white/70 dark:bg-white/10" />
              <div className="mt-4 grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={idx} className="h-16 rounded-2xl bg-white/60 dark:bg-white/5" />
                ))}
              </div>
            </GlassyCard>
          </div>
        ) : (
          <>
            <GlassyCard className="flex flex-col items-center gap-6 bg-white/80 p-6 text-center dark:bg-white/10">
              <DailyScoreRing value={DAILY_SCORE} />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your mindful momentum is trending steady. Celebrate the follow-through.
              </p>
            </GlassyCard>

            <GlassyCard className="space-y-4 bg-white/85 p-5 dark:bg-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How are you feeling?</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Tap the mood that best reflects right now.</p>
                </div>
                <Heart className="h-5 w-5 text-rose-400 dark:text-rose-300" aria-hidden />
              </div>
              <div
                className="flex flex-wrap gap-3"
                role="radiogroup"
                aria-label="How are you feeling?"
              >
                {MOODS.map(({ id, label, icon: Icon }, index) => {
                  const active = selectedMood === index;
                  return (
                    <button
                      key={label}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedMood(index)}
                      onKeyDown={(event) => handleMoodKeyDown(event, index)}
                      className={`flex h-14 w-14 items-center justify-center rounded-full border text-slate-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-200 ${
                        active
                          ? "scale-105 border-transparent bg-gradient-to-br from-cyan-400 via-indigo-400 to-purple-400 text-white shadow-lg"
                          : "border-white/60 bg-white/70 hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      <span className="sr-only">{label}</span>
                    </button>
                  );
                })}
              </div>
            </GlassyCard>

            <GlassyCard className="space-y-4 bg-white/85 p-5 dark:bg-white/10">
              <button className="flex w-full items-center justify-between rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-indigo-500">
                View Past Logs
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </GlassyCard>

            <GlassyCard className="space-y-4 bg-white/85 p-5 dark:bg-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">This Week</h2>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  7 days
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide">
                {weekData.map(({ day, logged }) => (
                  <div
                    key={day}
                    className={`flex h-16 flex-col items-center justify-center rounded-2xl border text-xs transition ${
                      logged
                        ? "border-transparent bg-gradient-to-br from-cyan-400 via-indigo-400 to-purple-400 text-white shadow"
                        : "border-dashed border-white/50 bg-white/40 text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400"
                    }`}
                  >
                    <span>{day}</span>
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden />
                  </div>
                ))}
              </div>

              {!hasLogs && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  No logs yet. Log a feeling to start spotting weekly patterns.
                </p>
              )}
            </GlassyCard>
          </>
        )}
      </section>
    </main>
  );
}
