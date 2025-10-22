"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronRight, Frown, Heart, Meh, Smile, Sun } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";
import BottomNav from "@/components/ui/BottomNav";

const DAILY_SCORE = 72;
const RING_RADIUS = 56;
const RING_STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const MOODS = [
  { label: "Very Low", icon: Frown },
  { label: "Low", icon: Activity },
  { label: "Balanced", icon: Meh },
  { label: "Aligned", icon: Smile },
  { label: "Elevated", icon: Sun },
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

type WeekDay = (typeof WEEK_TEMPLATE)[number];

function DailyScoreRing({ value, prefersReducedMotion }: { value: number; prefersReducedMotion: boolean }) {
  const progress = Math.min(100, Math.max(0, value));
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
        <defs>
          <linearGradient id="ring-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5f5" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="ring-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={RING_RADIUS} stroke="url(#ring-bg)" strokeWidth={RING_STROKE} fill="none" className="opacity-30" />
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
  const [selectedMood, setSelectedMood] = useState(2);
  const [weekLog, setWeekLog] = useState<WeekDay[]>(WEEK_TEMPLATE);
  const [isLoading, setIsLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => setIsLoading(false), 320);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", update);
    };
  }, []);

  const todayIndex = useMemo(() => {
    const day = new Date().getDay();
    // Map Sunday=0 to index 6, Monday=1 -> 0, etc.
    return day === 0 ? 6 : day - 1;
  }, []);

  const markTodayLogged = () => {
    setWeekLog((prev) =>
      prev.map((day, index) => (index === todayIndex ? { ...day, logged: true } : day))
    );
  };

  const handleMoodSelect = (index: number) => {
    setSelectedMood(index);
    markTodayLogged();
  };

  const handleMoodKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedMood((prev) => (prev + 1) % MOODS.length);
      markTodayLogged();
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedMood((prev) => (prev - 1 + MOODS.length) % MOODS.length);
      markTodayLogged();
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMoodSelect(index);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-calm-gradient py-12">
      <div className="page-shell">
        <div className="screen">
          <header className="bg-calm-gradient px-6 pt-16 pb-10 text-slate-900 dark:text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Tracker</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Wellness Tracker</h1>
            <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-300">
              Keep a gentle pulse on your mood and rituals. These snapshots add up to meaningful trends.
            </p>
          </header>

          <main className="flex-1 overflow-y-auto px-6 pb-28">
            {isLoading ? (
              <div className="space-y-6 pt-6">
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
              <div className="space-y-6 pt-6">
                <GlassyCard className="flex flex-col items-center gap-6 p-6 text-center">
                  <DailyScoreRing value={DAILY_SCORE} prefersReducedMotion={prefersReducedMotion} />
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-full border border-white/50 bg-[rgba(255,255,255,0.65)] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C6EF5] dark:border-white/15 dark:bg-[rgba(20,20,20,0.55)] dark:text-white"
                  >
                    View Past Logs
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Keep tapping your daily mood to build a calmer streak.
                  </p>
                </GlassyCard>

                <GlassyCard className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How are you feeling?</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-300">Tap the mood that best reflects right now.</p>
                    </div>
                    <Heart className="h-5 w-5 text-rose-400 dark:text-rose-300" aria-hidden />
                  </div>
                  <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="How are you feeling?">
                    {MOODS.map(({ label, icon: Icon }, index) => {
                      const active = selectedMood === index;
                      return (
                    <button
                      key={label}
                      type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => handleMoodSelect(index)}
                          onKeyDown={(event) => handleMoodKeyDown(event, index)}
                          className={`flex h-14 w-14 items-center justify-center rounded-full border text-slate-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-200 ${
                            active
                              ? "scale-105 border-transparent bg-gradient-to-br from-cyan-400 via-indigo-400 to-purple-400 text-white shadow-lg"
                              : "border-white/60 bg-white/70 hover:bg-white/90 active:scale-95 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
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
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-indigo-500"
                  >
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
                    {weekLog.map(({ day, logged }) => (
                      <div
                        key={day}
                        className={`flex h-16 flex-col items-center justify-center rounded-2xl border transition ${
                          logged
                            ? "border-transparent bg-gradient-to-br from-cyan-400 via-indigo-400 to-purple-400 text-white shadow"
                            : "border-dashed border-white/60 bg-white/30 text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        <span>{day}</span>
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden />
                      </div>
                    ))}
                  </div>
                  {!weekLog.some((day) => day.logged) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No logs yet. Log a feeling to spot trends.</p>
                  )}
                </GlassyCard>
              </div>
            )}
          </main>

          <BottomNav />
        </div>
      </div>
    </div>
  );
}
