"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import GlassyCard from "@/components/GlassyCard";
import BottomNav from "@/components/BottomNav";
import { getSupabaseClient } from "@/lib/supabase/client";

/* ──────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────── */
type RefocusTodayRow = { user_id: string; refocuses_today: number };
type MindfulTodayRow = { user_id: string; mindful_minutes_today: number };
type NudgeRow = { user_id: string; opened: number; total: number; open_rate_pct: number };
type StreakRow = { user_id: string; streak: number };
type WeekBarRow = { date_key: string; day_label: string; refocuses: number };

type BreathRow = {
  duration_seconds: number | null;
  completed: boolean | null;
  completed_at: string | null;
};

/* ──────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */
function parseSupabaseError(err: unknown): string {
  try {
    const e = err as any;
    return (
      e?.message ||
      e?.error_description ||
      e?.hint ||
      e?.details ||
      (typeof e === "string" ? e : JSON.stringify(e))
    );
  } catch {
    return "Unknown error";
  }
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getLondonToday(): Date {
  // client-side approximation for local day; DB views already use Europe/London
  return new Date(); // keep simple client-side; server-side views handle TZ correctly
}

/* Simple minutes-based ring scaled to user's 7-day baseline (no hard-codes) */
function MinutesRing({
  minutes,
  baseline,
  prefersReducedMotion,
  isLoading,
}: {
  minutes: number;
  baseline: number; // computed from last 7 days (excl today if available)
  prefersReducedMotion: boolean;
  isLoading: boolean;
}) {
  // Percent = minutes / max(1, baseline)
  const denom = Math.max(1, Math.round(baseline));
  const pct = Math.max(0, Math.min(100, Math.round((minutes / denom) * 100)));

  const radius = 56;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 140 140" className="-rotate-90">
        <defs>
          <linearGradient id="ring-track" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--card-border)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--card-border)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="ring-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#ring-track)"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-30"
        />

        {/* Active */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#ring-active)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isLoading ? circumference : offset}
          fill="none"
          className={prefersReducedMotion ? "" : "transition-all duration-700 ease-out"}
        />
      </svg>

      {/* Center numbers */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {isLoading ? (
          <span className="h-6 w-10 rounded bg-[var(--card-border)]/40 animate-pulse" />
        ) : (
          <>
            <span className="text-3xl font-semibold text-[var(--ink)]">{minutes}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              min today
            </span>
            <span className="mt-1 text-[10px] text-[var(--ink-muted)]">vs 7-day avg {Math.round(denom)}m</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */
export default function TrackerPage() {
  const supabase = getSupabaseClient();

  // Data
  const [refocusesToday, setRefocusesToday] = useState<number>(0);
  const [mindfulMinutesToday, setMindfulMinutesToday] = useState<number>(0);
  const [nudgeOpenRate, setNudgeOpenRate] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [weekBars, setWeekBars] = useState<WeekBarRow[]>([]);

  // Baseline for ring: user’s last 7 days average mindful minutes (excluding today if possible)
  const [avgMinutes7d, setAvgMinutes7d] = useState<number>(0);

  // UI
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const uid = userRes?.user?.id;
      if (!uid) {
        setIsLoading(false);
        return;
      }

      // Views: single roundtrip each
      const [
        { data: refocusRow, error: refErr },
        { data: mindfulRow, error: minErr },
        { data: nudgeRow, error: nudErr },
        { data: streakRow, error: strErr },
        { data: weekRows, error: wErr },
      ] = await Promise.all([
        supabase.from("v_refocuses_today").select("*").single<RefocusTodayRow>(),
        supabase.from("v_mindful_minutes_today").select("*").single<MindfulTodayRow>(),
        supabase.from("v_nudge_effectiveness_7d").select("*").single<NudgeRow>(),
        supabase.from("v_refocus_streak").select("*").single<StreakRow>(),
        supabase.from("v_week_refocus_bars").select("*").returns<WeekBarRow[]>(),
      ]);

      if (refErr) throw refErr;
      if (minErr) throw minErr;
      if (nudErr) throw nudErr;
      if (strErr) throw strErr;
      if (wErr) throw wErr;

      setRefocusesToday(refocusRow?.refocuses_today ?? 0);
      setMindfulMinutesToday(mindfulRow?.mindful_minutes_today ?? 0);
      setNudgeOpenRate(nudgeRow?.open_rate_pct ?? 0);
      setStreak(streakRow?.streak ?? 0);
      setWeekBars(weekRows ?? []);

      // Compute 7-day average mindful minutes from raw sessions (no hard-codes).
      // We only use completed sessions in the last 7 full days including today.
      const today = getLondonToday();
      const start = new Date(today);
      start.setDate(today.getDate() - 6); // last 7 days window
      const { data: breath, error: bErr } = await supabase
        .from("breath_sessions")
        .select("duration_seconds,completed,completed_at")
        .eq("user_id", uid)
        .eq("completed", true)
        .gte("completed_at", new Date(start.setHours(0, 0, 0, 0)).toISOString())
        .lte("completed_at", new Date(today.setHours(23, 59, 59, 999)).toISOString());

      if (bErr) throw bErr;

      // Aggregate minutes per date_key (ISO yyyy-mm-dd)
      const perDay: Record<string, number> = {};
      (breath as BreathRow[] | null)?.forEach((r) => {
        if (!r.completed_at || !r.duration_seconds) return;
        const key = toISODate(new Date(r.completed_at));
        perDay[key] = (perDay[key] ?? 0) + Math.max(0, Math.floor(r.duration_seconds / 60));
      });

      // Build 7 date keys (Mon..Sun or rolling 7? We use rolling 7 here)
      const avgWindowKeys: string[] = [];
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        avgWindowKeys.push(toISODate(d));
      }

      // Exclude "today" from baseline if there is at least 1 prior day; otherwise include it
      const todayKey = toISODate(new Date());
      const priorDays = avgWindowKeys.filter((k) => k !== todayKey);
      const useKeys = priorDays.length > 0 ? priorDays : avgWindowKeys;

      const sum = useKeys.reduce((s, k) => s + (perDay[k] ?? 0), 0);
      const avg = useKeys.length ? sum / useKeys.length : 0;
      setAvgMinutes7d(avg);
    } catch (err) {
      const msg = parseSupabaseError(err);
      console.error("Tracker load error:", err);
      setError(msg || "Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Week bars max for scaling (no hard code)
  const maxBar = useMemo(
    () => Math.max(1, ...weekBars.map((w) => w.refocuses)),
    [weekBars]
  );

  return (
    <>
      {/* sr-only live region for any future announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />

      <div className="min-h-screen bg-[var(--bg)] flex items-start justify-center py-4 px-4 transition-colors duration-300">
        {/* Mobile frame */}
        <div className="relative w-full max-w-[420px] rounded-2xl border border-[var(--card-border)] bg-[var(--bg)] shadow-lg overflow-hidden">
          {/* Header */}
          <header className="px-6 pt-6 pb-4 border-b border-[var(--card-border)]/50 bg-[var(--bg)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--ink-muted)] font-semibold">
                  Progress
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
                  Refocus Tracker
                </h1>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">How well you’re refocusing this week</p>
              </div>

              <MinutesRing
                minutes={mindfulMinutesToday}
                baseline={avgMinutes7d}
                prefersReducedMotion={prefersReducedMotion}
                isLoading={isLoading}
              />
            </div>
          </header>

          {/* Main */}
          <main className="px-6 pt-5 pb-[130px] text-[var(--ink)] space-y-4">
            {/* Loading skeletons */}
            {isLoading && (
              <>
                <GlassyCard className="h-24 w-full animate-pulse rounded-2xl bg-[var(--card)]/50" />
                <GlassyCard className="h-40 w-full animate-pulse rounded-2xl bg-[var(--card)]/50" />
                <GlassyCard className="h-36 w-full animate-pulse rounded-2xl bg-[var(--card)]/50" />
              </>
            )}

            {/* Error */}
            {!isLoading && error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3"
              >
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* Top stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <GlassyCard className="rounded-2xl bg-[var(--card)]/60 backdrop-blur-sm border border-[var(--card-border)] p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-[var(--ink-muted)] font-semibold">
                      Nudge effectiveness (7d)
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                      {nudgeOpenRate}
                      <span className="text-base text-[var(--ink-muted)]">%</span>
                    </p>
                  </GlassyCard>

                  <GlassyCard className="rounded-2xl bg-[var(--card)]/60 backdrop-blur-sm border border-[var(--card-border)] p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-[var(--ink-muted)] font-semibold">
                      Refocuses today
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{refocusesToday}</p>
                  </GlassyCard>
                </div>

                {/* Weekly bars */}
                <GlassyCard className="rounded-2xl bg-[var(--card)]/60 backdrop-blur-sm border border-[var(--card-border)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-[var(--ink)]">This week</h2>
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--ink-muted)]">
                      Mon–Sun
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-2 items-end h-28">
                    {weekBars.map((w) => {
                      const hPct = Math.round((w.refocuses / maxBar) * 100);
                      return (
                        <div key={w.date_key} className="flex flex-col items-center justify-end">
                          <div
                            aria-label={`${w.day_label}: ${w.refocuses} refocuses`}
                            className="w-6 rounded-full bg-[var(--card-border)]/30 overflow-hidden"
                            style={{ height: "100%" }}
                          >
                            <div
                              className="w-full bg-[var(--accent)] rounded-full transition-all duration-500"
                              style={{ height: `${hPct}%` }}
                            />
                          </div>
                          <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                            {w.day_label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </GlassyCard>

                {/* Streak */}
                <GlassyCard className="rounded-2xl bg-[var(--card)]/60 backdrop-blur-sm border border-[var(--card-border)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.15em] text-[var(--ink-muted)] font-semibold">
                      Streak
                    </p>
                    <p className="text-lg font-semibold text-[var(--ink)]">{streak} days</p>
                  </div>
                </GlassyCard>
              </>
            )}
          </main>

          {/* Bottom Nav */}
          <div className="absolute bottom-3 left-0 right-0 z-30 px-4">
            <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm">
              <BottomNav />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
