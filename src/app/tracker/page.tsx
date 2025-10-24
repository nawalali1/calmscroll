"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Frown, Heart, Meh, Smile, Sparkles, Sun } from "lucide-react";
import GlassyCard from "@/components/GlassyCard";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabaseClient";

const DAILY_SCORE = 72;

const MOODS = [
  { label: "Very Low", icon: Frown },
  { label: "Low", icon: Activity },
  { label: "Balanced", icon: Meh },
  { label: "Aligned", icon: Smile },
  { label: "Elevated", icon: Sun },
] as const;

type WeekDay = { day: string; logged: boolean };

const WEEK_TEMPLATE: WeekDay[] = [
  { day: "Mon", logged: true },
  { day: "Tue", logged: true },
  { day: "Wed", logged: false },
  { day: "Thu", logged: true },
  { day: "Fri", logged: false },
  { day: "Sat", logged: true },
  { day: "Sun", logged: true },
];

function DailyScoreRing({ value, prefersReducedMotion }: { value: number; prefersReducedMotion: boolean }) {
  const radius = 56;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

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
        <circle cx="70" cy="70" r={radius} stroke="url(#ring-bg)" strokeWidth={strokeWidth} fill="none" className="opacity-35" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#ring-active)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          className={prefersReducedMotion ? "" : "transition-all duration-700 ease-out"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-semibold text-white">{clamped}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">Daily Score</span>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const [selectedMood, setSelectedMood] = useState(2);
  const [weekLog, setWeekLog] = useState<WeekDay[]>(() => WEEK_TEMPLATE.map((entry) => ({ ...entry })));
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const todayIndex = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  const markTodayLogged = useCallback(() => {
    setWeekLog((prev) =>
      prev.map((entry, entryIndex) => (entryIndex === todayIndex ? { ...entry, logged: true } : entry))
    );
  }, [todayIndex]);

  const handleMoodSelect = useCallback(
    async (index: number) => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return;

        const today = new Date().toISOString().split("T")[0];
        const moodScore = index + 1;

        const { error } = await supabase.from("metrics").upsert({
          user_id: session.user.id,
          date_key: today,
          mood_score: moodScore,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        setSelectedMood(index);
        markTodayLogged();
      } catch (error) {
        console.error("Failed to save mood:", error);
      }
    },
    [markTodayLogged]
  );

  const handleMoodKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedMood((previous) => (previous + 1) % MOODS.length);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedMood((previous) => (previous - 1 + MOODS.length) % MOODS.length);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void handleMoodSelect(index);
    }
  };

  return (
    <>
      <div className="page-shell">
        <div className="screen bg-[#F6F8FC] text-slate-900">
          <header className="relative overflow-hidden rounded-b-[42px] bg-[linear-gradient(160deg,#0B3B64_0%,#3864FF_55%,#FF8FC6_100%)] px-6 pb-20 pt-[calc(env(safe-area-inset-top,0px)+2.25rem)] text-white shadow-[0_30px_80px_-30px_rgba(30,64,160,0.55)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/75">Wellness Tracker</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Daily Score</h1>
                <p className="mt-3 max-w-sm text-sm text-white/75">
                  Tap how you feel, review weekly streaks, and celebrate the micro-wins that keep you grounded.
                </p>
              </div>
              <DailyScoreRing value={DAILY_SCORE} prefersReducedMotion={prefersReducedMotion} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-[-1px]" aria-hidden>
              <svg viewBox="0 0 375 60" xmlns="http://www.w3.org/2000/svg" className="h-12 w-full text-white/60">
                <path
                  fill="currentColor"
                  d="M0 40c30 12 90 32 150 28s120-36 180-40 96 20 96 20v32H0V40z"
                />
              </svg>
            </div>
          </header>

          <main className="flex-1 space-y-6 px-6 pb-[140px] pt-16">
            <GlassyCard className="space-y-5 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(30,64,160,0.45)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">How are you feeling?</h2>
                  <p className="text-sm text-slate-500">Tap the mood that mirrors your current energy.</p>
                </div>
                <Heart className="h-5 w-5 text-rose-400" aria-hidden />
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
                      onClick={() => {
                        void handleMoodSelect(index);
                      }}
                      onKeyDown={(event) => handleMoodKeyDown(event, index)}
                      className={`flex h-14 w-14 items-center justify-center rounded-full border text-slate-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                        active
                          ? "scale-105 border-transparent bg-gradient-to-br from-cyan-400 via-indigo-400 to-purple-400 text-white shadow-lg"
                          : "border-white/60 bg-white/70 hover:bg-white/90 active:scale-95"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      <span className="sr-only">{label}</span>
                    </button>
                  );
                })}
              </div>
            </GlassyCard>

            <GlassyCard className="space-y-4 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(30,64,160,0.45)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Focus</h2>
                <Sparkles className="h-5 w-5 text-indigo-400" aria-hidden />
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span>3-minute breathing reset</span>
                  <button type="button" className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    Start
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span>Log a gratitude spark</span>
                  <button type="button" className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    Capture
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span>Stretch it out break</span>
                  <button type="button" className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    Begin
                  </button>
                </div>
              </div>
            </GlassyCard>

            <GlassyCard className="space-y-4 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(30,64,160,0.45)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">This Week</h2>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">7 days</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide">
                {weekLog.map(({ day, logged }) => (
                  <div
                    key={day}
                    className={`flex h-16 flex-col items-center justify-center rounded-2xl border transition ${
                      logged
                        ? "border-transparent bg-gradient-to-br from-cyan-400 via-indigo-400 to-purple-400 text-white shadow"
                        : "border-dashed border-slate-200 bg-white/60 text-slate-500"
                    }`}
                  >
                    <span>{day}</span>
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden />
                  </div>
                ))}
              </div>
              {!weekLog.some((entry) => entry.logged) && (
                <p className="text-sm text-slate-500">No logs yet. Mark how you feel to watch your streak grow.</p>
              )}
            </GlassyCard>
          </main>

          <BottomNav />
        </div>
      </div>
    </>
  );
}
