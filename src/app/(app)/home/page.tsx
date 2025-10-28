"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import BottomNav from "@/components/BottomNav";
import UnwindProgressRing from "@/components/ui/UnwindProgressRing";
import { CheckCircle2, Clock, Flame, Pause, Play, Wind, X } from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Types & Constants
────────────────────────────────────────────────────────────── */
type Intention = {
  id: string;
  user_id: string;
  text: string;
  status: "active" | "done" | "snoozed";
  created_at: string;
  completed_at: string | null;
  snooze_until: string | null;
};

type Profile = { id: string; display_name: string | null };
type Dashboard = { completedToday: number; mindfulToday: number; streak: number };
type Toast = { id: number; message: string; type: "success" | "error" | "info" };

const UNWIND_DURATION_S = 60;
const TOAST_MS = 2800;

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function mmss(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

/* ──────────────────────────────────────────────────────────────
   Calm Toast Component
────────────────────────────────────────────────────────────── */
function Toasts({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex max-w-sm flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => {
          const bg =
            t.type === "error"
              ? "bg-red-600/85"
              : t.type === "success"
              ? "bg-emerald-600/85"
              : "bg-slate-600/85";
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              role="alert"
              aria-live={t.type === "error" ? "assertive" : "polite"}
              className={`${bg} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-3 pointer-events-auto backdrop-blur-sm border border-white/20`}
            >
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => onRemove(t.id)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Inline Skeleton Loader
────────────────────────────────────────────────────────────── */
function SkeletonMetric() {
  return (
    <motion.div
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ repeat: Infinity, duration: 1.8 }}
      className="rounded-2xl p-5 bg-slate-200 dark:bg-slate-700 h-28"
    />
  );
}

/* ──────────────────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const { theme } = useTheme();
  const reduced = useReducedMotion();

  // Auth & profile
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Dashboard
  const [dash, setDash] = useState<Dashboard>({ completedToday: 0, mindfulToday: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  // Intention
  const [activeIntention, setActiveIntention] = useState<Intention | null>(null);
  const [intentionText, setIntentionText] = useState("");

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_MS);
    return () => clearTimeout(timer);
  }, []);
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Unwind state...
  const [unwindActive, setUnwindActive] = useState(false);
  const [unwindPaused, setUnwindPaused] = useState(false);
  const [unwindProgress, setUnwindProgress] = useState(0);
  const [unwindRemaining, setUnwindRemaining] = useState(UNWIND_DURATION_S);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startedAtMsRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);

  /* ── Auth + profile ── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        const uid = data.user?.id ?? null;
        setUserId(uid);
        if (!uid) return;
        const { data: p } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("id", uid)
          .maybeSingle();
        if (mounted) setProfile(p ?? null);
      } catch (e) {
        console.error("auth/profile", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  /* ── Realtime profile updates ── */
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("profiles-home")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => setProfile(payload.new as Profile)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, userId]);

  /* ── Dashboard load ── */
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const { startISO, endISO } = todayRange();

    (async () => {
      setLoading(true);
      try {
        const [activeRes, doneCountRes, sessionsRes, streakRes] = await Promise.all([
          supabase
            .from("intentions")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .order("created_at", { ascending: true })
            .limit(1),
          supabase
            .from("intentions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "done")
            .gte("completed_at", startISO)
            .lte("completed_at", endISO),
          supabase
            .from("breath_sessions")
            .select("duration_seconds")
            .eq("user_id", userId)
            .eq("completed", true)
            .gte("completed_at", startISO)
            .lte("completed_at", endISO),
          supabase
            .from("metrics")
            .select("streak, updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const mindfulSec = (sessionsRes.data ?? []).reduce((s, r) => s + (r.duration_seconds ?? 0), 0);
        setActiveIntention(activeRes.data?.[0] ?? null);
        setDash({
          completedToday: doneCountRes.count ?? 0,
          mindfulToday: Math.floor(Math.max(0, mindfulSec) / 60),
          streak: streakRes.data?.streak ?? 0,
        });
      } catch (e) {
        console.error("dashboard", e);
        showToast("Failed to load dashboard", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, showToast]);

  /* ── Intention actions, Unwind helpers… (unchanged) ── */
  const handleCreateIntention = useCallback(async () => {
    const text = intentionText.trim();
    if (!userId) return showToast("Please sign in first", "error");
    if (!text) return showToast("Please enter an intention", "error");

    const optimistic: Intention = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      text,
      status: "active",
      created_at: new Date().toISOString(),
      completed_at: null,
      snooze_until: null,
    };
    setActiveIntention(optimistic);
    setIntentionText("");

    try {
      await supabase
        .from("intentions")
        .update({ status: "snoozed", snooze_until: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "active");

      const { data, error } = await supabase
        .from("intentions")
        .insert({ user_id: userId, text, status: "active" })
        .select("*")
        .single();

      if (error) throw error;
      setActiveIntention(data as Intention);
      showToast("Intention set", "success");
    } catch (e) {
      console.error("create intention", e);
      setActiveIntention(null);
      setIntentionText(text);
      showToast("Could not save intention", "error");
    }
  }, [intentionText, userId, supabase, showToast]);

  const handleCompleteIntention = useCallback(async () => {
    if (!activeIntention || !userId) return;
    try {
      await supabase
        .from("intentions")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", activeIntention.id)
        .eq("user_id", userId);
      setActiveIntention(null);
      setDash((d) => ({ ...d, completedToday: d.completedToday + 1 }));
      showToast("Nice work", "success");
    } catch (e) {
      console.error("complete intention", e);
      showToast("Could not complete intention", "error");
    }
  }, [activeIntention, userId, supabase, showToast]);

  const handleSnoozeIntention = useCallback(
    async (minutes = 5) => {
      if (!activeIntention || !userId) return;
      try {
        const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
        await supabase
          .from("intentions")
          .update({ status: "snoozed", snooze_until: until })
          .eq("id", activeIntention.id)
          .eq("user_id", userId);
        setActiveIntention(null);
        showToast(`Snoozed for ${minutes} min`, "info");
      } catch (e) {
        console.error("snooze intention", e);
        showToast("Could not snooze intention", "error");
      }
    },
    [activeIntention, userId, supabase, showToast]
  );

  // Unwind timers/utilities (unchanged)
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);
  useEffect(() => () => clearTimer(), [clearTimer]);

  const refreshMindfulMinutes = useCallback(
    async (uid: string) => {
      const { startISO, endISO } = todayRange();
      try {
        const { data } = await supabase
          .from("breath_sessions")
          .select("duration_seconds")
          .eq("user_id", uid)
          .eq("completed", true)
          .gte("completed_at", startISO)
          .lte("completed_at", endISO);
        const sec = (data ?? []).reduce((s, r) => s + (r.duration_seconds ?? 0), 0);
        setDash((d) => ({ ...d, mindfulToday: Math.floor(sec / 60) }));
      } catch (e) {
        console.error("refresh mindful", e);
      }
    },
    [supabase]
  );

  const finishSession = useCallback(
    async (uid: string) => {
      clearTimer();
      try {
        if (sessionIdRef.current) {
          await supabase
            .from("breath_sessions")
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq("id", sessionIdRef.current)
            .eq("user_id", uid);
        }
      } catch (e) {
        console.error("finish session", e);
      } finally {
        sessionIdRef.current = null;
        accumulatedMsRef.current = 0;
        startedAtMsRef.current = 0;
        setUnwindActive(false);
        setUnwindPaused(false);
        setUnwindProgress(100);
        showToast("Breathing complete", "success");
        await refreshMindfulMinutes(uid);
      }
    },
    [supabase, clearTimer, showToast, refreshMindfulMinutes]
  );

  const handleStartUnwind = useCallback(async () => {
    if (!userId) return showToast("Please sign in first", "error");
    try {
      const { data, error } = await supabase
        .from("breath_sessions")
        .insert({
          user_id: userId,
          duration_seconds: UNWIND_DURATION_S,
          completed: false,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error || !data?.id) throw error;

      sessionIdRef.current = data.id;
      setUnwindActive(true);
      setUnwindPaused(false);
      setUnwindProgress(0);
      setUnwindRemaining(UNWIND_DURATION_S);
      startedAtMsRef.current = Date.now();
      accumulatedMsRef.current = 0;

      timerRef.current = setInterval(() => {
        if (unwindPaused) return;
        const elapsed = Date.now() - startedAtMsRef.current + accumulatedMsRef.current;
        const total = UNWIND_DURATION_S * 1000;
        setUnwindProgress(Math.min(100, Math.round((elapsed / total) * 100)));
        setUnwindRemaining(Math.max(0, Math.ceil((total - elapsed) / 1000)));
        if (elapsed >= total) finishSession(userId);
      }, 120);
    } catch (e) {
      console.error("start unwind", e);
      showToast("Could not start breathing", "error");
    }
  }, [userId, supabase, showToast, finishSession, unwindPaused]);

  const handlePauseUnwind = useCallback(() => {
    if (!unwindActive || unwindPaused) return;
    clearTimer();
    accumulatedMsRef.current += Date.now() - startedAtMsRef.current;
    setUnwindPaused(true);
  }, [unwindActive, unwindPaused, clearTimer]);

  const handleResumeUnwind = useCallback(() => {
    if (!unwindActive || !unwindPaused) return;
    setUnwindPaused(false);
    startedAtMsRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtMsRef.current + accumulatedMsRef.current;
      const total = UNWIND_DURATION_S * 1000;
      setUnwindProgress(Math.min(100, Math.round((elapsed / total) * 100)));
      setUnwindRemaining(Math.max(0, Math.ceil((total - elapsed) / 1000)));
      if (elapsed >= total && userId) finishSession(userId);
    }, 120);
  }, [unwindActive, unwindPaused, userId, finishSession]);

  const handleCancelUnwind = useCallback(async () => {
    clearTimer();
    try {
      if (sessionIdRef.current && userId) {
        await supabase
          .from("breath_sessions")
          .delete()
          .eq("id", sessionIdRef.current)
          .eq("user_id", userId)
          .eq("completed", false);
      }
    } catch (e) {
      console.error("cancel session", e);
    } finally {
      sessionIdRef.current = null;
      accumulatedMsRef.current = 0;
      startedAtMsRef.current = 0;
      setUnwindActive(false);
      setUnwindPaused(false);
      setUnwindProgress(0);
      setUnwindRemaining(UNWIND_DURATION_S);
      showToast("Breathing cancelled", "info");
    }
  }, [clearTimer, supabase, userId, showToast]);

  const name = profile?.display_name ?? "";

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-start sm:items-center justify-center py-4">
      {/* MOBILE FRAME */}
      <div className="relative w-full max-w-[420px] rounded-[28px] border border-[var(--card-border)] bg-[var(--bg)] shadow-xl overflow-hidden">
        {/* Status bar spacer */}
        <div className="h-3 bg-[var(--bg)]" />

        {/* Toasts inside frame */}
        <Toasts toasts={toasts} onRemove={removeToast} />

        {/* CONTENT */}
        <motion.main
          initial={!reduced ? { opacity: 0, y: 8 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={!reduced ? { duration: 0.24 } : { duration: 0 }}
          className="relative min-h-[100dvh] w-full flex flex-col items-center px-4 pt-6 pb-[96px]"
        >
          <div className="w-full max-w-md flex flex-col gap-6">
            {/* Greeting */}
            <section className="text-center min-h-[80px] flex flex-col justify-center">
              {!profile ? (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className="h-7 w-40 bg-slate-300 dark:bg-slate-700 mx-auto rounded-lg"
                />
              ) : (
                <motion.div
                  initial={!reduced ? { opacity: 0, y: -8 } : { opacity: 1 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={!reduced ? { duration: 0.3 } : { duration: 0 }}
                >
                  <h1 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                    Welcome back{name && ","}{" "}
                    {name && <span className="font-semibold text-slate-700 dark:text-slate-200">{name}</span>}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Take a breath and refocus</p>
                </motion.div>
              )}
            </section>

            {/* Metrics */}
            <motion.section
              initial={!reduced ? { opacity: 0, y: 8 } : { opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={!reduced ? { duration: 0.3, delay: 0.05 } : { duration: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: "Completed", value: dash.completedToday, icon: CheckCircle2 },
                { label: "Mindful min", value: dash.mindfulToday, icon: Wind },
                { label: "Streak", value: dash.streak, icon: Flame },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4 backdrop-blur-md bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-200 text-center"
                >
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-5 bg-slate-300 dark:bg-slate-700 rounded mx-auto" />
                      <div className="h-6 w-8 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                    </div>
                  ) : (
                    <>
                      <Icon className="w-5 h-5 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                      <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
                    </>
                  )}
                </div>
              ))}
            </motion.section>

            {/* Intention section */}
            <motion.section
              initial={!reduced ? { opacity: 0, y: 8 } : { opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={!reduced ? { duration: 0.3, delay: 0.1 } : { duration: 0 }}
            >
              {!activeIntention ? (
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 p-6 space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Set intention</label>
                  <input
                    value={intentionText}
                    onChange={(e) => setIntentionText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateIntention()}
                    placeholder="What do you want to focus on?"
                    className="w-full rounded-xl px-4 py-3 bg-white dark:bg-white/10 text-sm border border-slate-200 dark:border-white/20 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  />
                  <button
                    onClick={handleCreateIntention}
                    disabled={!intentionText.trim()}
                    className="w-full bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    Set intention
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 p-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Active intention
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{activeIntention.text}</p>
                  </div>
                  <div className="h-px bg-white/20 dark:bg-white/10" />
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleCompleteIntention}
                      className="px-3 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Done
                    </button>
                    <button
                      onClick={() => handleSnoozeIntention(5)}
                      className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <Clock className="w-4 h-4" />
                      5m
                    </button>
                    <button
                      onClick={handleStartUnwind}
                      className="px-3 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      <Wind className="w-4 h-4" />
                      Breathe
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          </div>

          {/* Unwind Modal (scoped width) */}
          <AnimatePresence initial={false} mode="wait">
            {unwindActive && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close breathing"
                  onClick={handleCancelUnwind}
                  className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
                  initial={!reduced ? { opacity: 0 } : { opacity: 0.25 }}
                  animate={{ opacity: 0.25 }}
                  exit={{ opacity: 0 }}
                  transition={!reduced ? { duration: 0.15 } : { duration: 0 }}
                />
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[420px] rounded-t-3xl border-t border-x border-white/30 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-6 shadow-2xl"
                  initial={!reduced ? { y: "100%" } : { y: "0%" }}
                  animate={{ y: "0%" }}
                  exit={!reduced ? { y: "100%" } : { y: "0%" }}
                  transition={!reduced ? { type: "spring", stiffness: 260, damping: 24 } : { duration: 0 }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Breathe</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Follow your breath</p>
                    </div>
                    <button
                      onClick={handleCancelUnwind}
                      className="rounded-full p-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>

                  <div className="mb-6 text-center">
                    <motion.div
                      key={Math.floor(unwindRemaining)}
                      initial={!reduced ? { scale: 0.95, opacity: 0 } : {}}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={!reduced ? { scale: 0.95, opacity: 0 } : {}}
                      transition={!reduced ? { duration: 0.1 } : { duration: 0 }}
                      className="font-mono text-5xl font-semibold text-slate-900 dark:text-slate-50"
                    >
                      {mmss(unwindRemaining)}
                    </motion.div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {unwindPaused ? "Paused" : "..."}
                    </p>
                  </div>

                  <div className="mb-6 flex justify-center">
                    <UnwindProgressRing
                      duration={UNWIND_DURATION_S}
                      elapsed={UNWIND_DURATION_S - unwindRemaining}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {!unwindPaused ? (
                      <>
                        <button
                          onClick={handlePauseUnwind}
                          className="px-3 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        >
                          <Pause className="w-4 h-4" />
                          Pause
                        </button>
                        <button
                          onClick={handleCancelUnwind}
                          className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleResumeUnwind}
                          className="px-3 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        >
                          <Play className="w-4 h-4" />
                          Resume
                        </button>
                        <button
                          onClick={handleCancelUnwind}
                          className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>

                  {activeIntention && (
                    <div className="mt-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-4">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Remember</p>
                      <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{activeIntention.text}</p>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Bottom nav INSIDE frame */}
          <motion.nav
            initial={!reduced ? { opacity: 0, y: 8 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={!reduced ? { duration: 0.28, delay: 0.05 } : { duration: 0 }}
            className="absolute bottom-4 left-0 right-0 z-30 px-4"
          >
            <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm">
              <BottomNav />
            </div>
          </motion.nav>
        </motion.main>
      </div>
    </div>
  );
}
