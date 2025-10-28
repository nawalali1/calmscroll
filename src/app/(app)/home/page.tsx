"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";
import BottomNav from "@/components/BottomNav";
import UnwindProgressRing from "@/components/ui/UnwindProgressRing";
import { CheckCircle2, Clock, Flame, Pause, Play, Wind, X } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";

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

function CalmToast({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex max-w-sm flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`px-4 py-2 rounded-lg text-sm font-medium pointer-events-auto cursor-pointer ${
            t.type === "success"
              ? "bg-emerald-500 text-white"
              : t.type === "error"
              ? "bg-rose-500 text-white"
              : "bg-blue-500 text-white"
          }`}
          onClick={() => onDismiss(t.id)}
        >
          {t.message}
        </motion.div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const reduced = useReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard>({
    completedToday: 0,
    mindfulToday: 0,
    streak: 0,
  });
  const [activeIntention, setActiveIntention] = useState<Intention | null>(null);
  const [unwindActive, setUnwindActive] = useState(false);
  const [unwindRemaining, setUnwindRemaining] = useState(UNWIND_DURATION_S);
  const [unwindPaused, setUnwindPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const unwindTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_MS);
    },
    []
  );

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    loadUser();
    setMounted(true);
  }, []);

  // Load profile
  useEffect(() => {
    if (!userId) return;
    const loadProfile = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", userId)
        .single();
      if (data) setProfile(data);
    };
    loadProfile();
  }, [userId]);

  // Load intentions
  useEffect(() => {
    if (!userId) return;
    const loadIntentions = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("intentions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (data) setIntentions(data);
    };
    loadIntentions();
  }, [userId]);

  const handleStartUnwind = useCallback(() => {
    setUnwindActive(true);
    setUnwindRemaining(UNWIND_DURATION_S);
    setUnwindPaused(false);

    unwindTimerRef.current = setInterval(() => {
      setUnwindRemaining((prev) => {
        if (prev <= 1) {
          setUnwindActive(false);
          if (unwindTimerRef.current) clearInterval(unwindTimerRef.current);
          showToast("Unwind session complete!", "success");
          return UNWIND_DURATION_S;
        }
        return prev - 1;
      });
    }, 1000);
  }, [showToast]);

  const handlePauseUnwind = useCallback(() => {
    setUnwindPaused(true);
    if (unwindTimerRef.current) clearInterval(unwindTimerRef.current);
  }, []);

  const handleResumeUnwind = useCallback(() => {
    setUnwindPaused(false);
    unwindTimerRef.current = setInterval(() => {
      setUnwindRemaining((prev) => {
        if (prev <= 1) {
          setUnwindActive(false);
          if (unwindTimerRef.current) clearInterval(unwindTimerRef.current);
          showToast("Unwind session complete!", "success");
          return UNWIND_DURATION_S;
        }
        return prev - 1;
      });
    }, 1000);
  }, [showToast]);

  const handleCancelUnwind = useCallback(() => {
    setUnwindActive(false);
    setUnwindRemaining(UNWIND_DURATION_S);
    setUnwindPaused(false);
    if (unwindTimerRef.current) clearInterval(unwindTimerRef.current);
  }, []);

  const handleCompleteIntention = useCallback(
    async (intentionId: string) => {
      if (!userId) return;
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("intentions")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", intentionId);
      if (error) {
        showToast("Failed to complete intention", "error");
      } else {
        showToast("Intention completed!", "success");
        setIntentions((prev) =>
          prev.filter((i) => i.id !== intentionId)
        );
      }
    },
    [userId, showToast]
  );

  if (!mounted) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500">Loading...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="bg-gradient-to-b from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900">
      <CalmToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      
      <div className="w-full h-full flex flex-col p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {profile?.display_name ? `Welcome, ${profile.display_name}` : "Welcome"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartUnwind}
            disabled={unwindActive}
            className="flex items-center justify-center gap-2 p-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition"
          >
            <Wind className="w-5 h-5" />
            Breathe
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition"
          >
            <Flame className="w-5 h-5" />
            Focus
          </motion.button>
        </div>

        {/* Active Intention */}
        {activeIntention && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Current Intention</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white mt-2">{activeIntention.text}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCompleteIntention(activeIntention.id)}
              className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition"
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Complete
            </motion.button>
          </motion.div>
        )}

        {/* Unwind Session */}
        <AnimatePresence>
          {unwindActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center"
            >
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Unwind Session</p>
              <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">
                {mmss(unwindRemaining)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {unwindPaused ? "Paused" : "Breathing..."}
              </p>
              <div className="mb-6 flex justify-center mt-6">
                <UnwindProgressRing
                  duration={UNWIND_DURATION_S}
                  elapsed={UNWIND_DURATION_S - unwindRemaining}
                />
              </div>
              <div className="w-full grid grid-cols-2 gap-2">
                {!unwindPaused ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePauseUnwind}
                      className="px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium"
                    >
                      <Pause className="w-4 h-4 inline mr-1" />
                      Pause
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancelUnwind}
                      className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Cancel
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResumeUnwind}
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium"
                    >
                      <Play className="w-4 h-4 inline mr-1" />
                      Resume
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancelUnwind}
                      className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Cancel
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intentions List */}
        {intentions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Active Intentions</p>
            {intentions.map((intention) => (
              <motion.div
                key={intention.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">{intention.text}</p>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCompleteIntention(intention.id)}
                  className="text-emerald-500 hover:text-emerald-600"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
