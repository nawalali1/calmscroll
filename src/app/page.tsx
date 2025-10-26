"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Sparkles, StretchVertical, Wind, Flame, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { QuickActionPill } from "@/components/ui/QuickActionPill";
import GlassyCard from "@/components/GlassyCard";
import { Button } from "@/components/ui/Button";
import { Fab } from "@/components/ui/Fab";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/BottomNav";
import { useHomeData } from "@/hooks/useHomeData";
import { fadeInUp, scaleIn } from "@/lib/motion";

type QuickActionId = "breathe" | "reflect" | "stretch";

type QuickAction = {
  id: QuickActionId;
  label: string;
  description: string;
  prompt: string;
  actionLabel: string;
  icon: ReactNode;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "breathe",
    label: "Breathe",
    description: "Reset your mind with a guided breathing session.",
    prompt: "Inhale slowly for four counts, exhale for six. What shifts for you after three rounds?",
    actionLabel: "Begin Breathing",
    icon: <Wind className="h-5 w-5" aria-hidden />,
  },
  {
    id: "reflect",
    label: "Reflect",
    description: "Take a moment to check in with yourself.",
    prompt: "Name one feeling you want to carry forward and one you can release.",
    actionLabel: "Start Reflection",
    icon: <NotebookPen className="h-5 w-5" aria-hidden />,
  },
  {
    id: "stretch",
    label: "Stretch",
    description: "Release tension with gentle movement prompts.",
    prompt: "Roll your shoulders back and stretch tall. Where do you notice space opening?",
    actionLabel: "Start Stretch",
    icon: <StretchVertical className="h-5 w-5" aria-hidden />,
  },
];

// Remove hardcoded FOCUS_CARDS and FAVORITES - will be generated from real data

export default function HomePage() {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { userProfile, dailyProgress, loading, error, moodStreak, recentReflections, favoriteItems } = useHomeData();
  const userDisplayName = userProfile?.display_name?.trim() || "Friend";
  const progressValue = Math.round(Math.max(0, Math.min(100, dailyProgress || 0)));
  const progressCircumference = Math.PI * 100;
  const progressOffset = progressCircumference * (1 - progressValue / 100);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-theme-gradient px-6 text-center text-sm font-medium text-[var(--ink)] transition-colors"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--ink)]/20 border-t-[var(--ink)]" />
        <p>Loading your dashboard...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-theme-gradient px-6 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Unable to Load Dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-slate-900 px-6 py-2 text-sm text-white"
        >
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="page-shell">
        <div className="screen text-[var(--ink)]">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-b-[42px] px-6 pb-20 pt-[calc(env(safe-area-inset-top,0px)+2.25rem)] text-white shadow-[0_30px_80px_-30px_rgba(30,64,160,0.55)]"
            style={{ backgroundImage: "linear-gradient(145deg,var(--bg-start) 0%,var(--bg-mid) 55%,var(--bg-end) 100%)" }}
          >
            {/* Greeting and User Info */}
            <div className="flex items-start justify-between gap-4">
              <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <p className="text-sm uppercase tracking-[0.3em] text-white/75">{greeting}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{userDisplayName}</h1>
              </motion.div>

              {/* Daily Progress Ring */}
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="relative flex h-20 w-20 shrink-0 items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-md" aria-hidden />
                <svg viewBox="0 0 120 120" className="h-16 w-16 rotate-[-90deg]">
                  <defs>
                    <linearGradient id="progress-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7FC9FF" />
                      <stop offset="100%" stopColor="#FF9ACB" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#progress-arc)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={progressCircumference}
                    strokeDashoffset={progressOffset}
                    fill="none"
                    className={prefersReducedMotion ? "" : "transition-all duration-700 ease-out"}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-semibold leading-none">{progressValue}%</span>
                  <span className="mt-1 text-[10px] uppercase tracking-[0.35em] text-white/70">Daily</span>
                </div>
              </motion.div>
            </div>

            {/* Mood Streak & Stats */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="mt-6 flex gap-4"
            >
              {/* Streak Counter */}
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Flame className="h-5 w-5 text-orange-300" aria-hidden />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Streak</p>
                  <p className="text-lg font-semibold text-white">{moodStreak.current_streak} days</p>
                </div>
              </div>

              {/* Check-ins Counter */}
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Clock className="h-5 w-5 text-blue-300" aria-hidden />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Check-ins</p>
                  <p className="text-lg font-semibold text-white">{moodStreak.total_check_ins}</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Action Pills */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              {QUICK_ACTIONS.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex-1"
                >
                  <QuickActionPill
                    icon={action.icon}
                    label={action.label}
                    onClick={() => setActiveAction(action)}
                    className="w-full border-white/30 bg-white/15 text-sm font-semibold tracking-tight text-white/95"
                  />
                </motion.div>
              ))}
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-[-1px]" aria-hidden>
              <svg viewBox="0 0 375 60" xmlns="http://www.w3.org/2000/svg" className="h-12 w-full text-white/65">
                <path
                  fill="currentColor"
                  d="M0 40c30 12 90 32 150 28s120-36 180-40 96 20 96 20v32H0V40z"
                />
              </svg>
            </div>
          </motion.header>

          <main className="flex-1 space-y-6 px-6 pb-[140px] pt-16">
            {/* Recent Reflections Section */}
            {recentReflections.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                aria-labelledby="reflections-section"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 id="reflections-section" className="text-lg font-semibold text-slate-800">
                      Recent Reflections
                    </h2>
                    <p className="text-sm text-slate-500">Your latest check-ins</p>
                  </div>
                  <NotebookPen className="h-5 w-5 text-[#8CA8FF]" aria-hidden />
                </div>

                <div className="space-y-3">
                  {recentReflections.map((reflection, index) => (
                    <motion.div
                      key={reflection.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <GlassyCard className="space-y-3 rounded-[24px] border-white/80 bg-white p-4 shadow-[0_25px_80px_-45px_rgba(30,64,160,0.55)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {reflection.title && (
                              <h3 className="text-base font-semibold text-slate-900 truncate">{reflection.title}</h3>
                            )}
                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{reflection.content}</p>
                          </div>
                          {reflection.mood && (
                            <div className="flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                              <span className="text-lg">{reflection.mood}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(reflection.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </GlassyCard>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Empty State for First Time Users */}
            {recentReflections.length === 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                aria-labelledby="welcome-section"
                className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 mx-auto">
                  <Sparkles className="h-6 w-6 text-[#8CA8FF]" aria-hidden />
                </div>
                <div>
                  <h2 id="welcome-section" className="text-lg font-semibold text-slate-900">
                    Start Your First Reflection
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Begin your mindfulness journey by checking in with your thoughts and feelings.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setCreateSheetOpen(true)}
                  className="mx-auto rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] px-6 py-2 text-sm font-semibold text-white"
                >
                  Create Reflection
                </Button>
              </motion.section>
            )}

            {/* Favorites Section */}
            {favoriteItems.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                aria-labelledby="favorites-section"
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 id="favorites-section" className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Favorites
                  </h2>
                  <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                    {favoriteItems.length} saved
                  </span>
                </div>
                <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-1 scrollbar-none">
                  {favoriteItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      type="button"
                      className="inline-flex min-w-[9rem] items-center justify-between gap-3 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-[0_18px_45px_-40px_rgba(30,64,160,0.55)] transition hover:text-slate-700 hover:shadow-[0_25px_45px_-35px_rgba(30,64,160,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF]"
                    >
                      {item.title || item.content.substring(0, 15)}
                      <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5]" aria-hidden />
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}
          </main>

          <Fab
            onClick={() => setCreateSheetOpen(true)}
            className="absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom,0px)+108px)] -translate-x-1/2 bg-gradient-to-br from-[#85B6FF] via-[#B99BFF] to-[#FF8FC6] shadow-[0_25px_45px_-25px_rgba(255,142,200,0.6)]"
          />

          <BottomNav />
        </div>
      </div>

      <BottomSheet
        open={Boolean(activeAction)}
        onClose={() => setActiveAction(null)}
        title={activeAction?.label}
        description={activeAction?.description}
      >
        {activeAction ? (
          <>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">{activeAction.prompt}</p>
              <Button
                type="button"
                onClick={() => {
                  setActiveAction(null);
                  // Route to appropriate activity
                  if (activeAction.id === 'reflect') {
                    router.push("/notes/new?kind=reflection");
                  } else if (activeAction.id === 'breathe') {
                    router.push("/tracker/breathe");
                  } else if (activeAction.id === 'stretch') {
                    router.push("/tracker/stretch");
                  }
                }}
                className="w-full rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] text-white hover:shadow-lg transition-shadow"
              >
                {activeAction.actionLabel}
              </Button>
            </div>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        title="What would you like to do?"
      >
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => {
              setCreateSheetOpen(false);
              router.push("/notes/new?kind=free");
            }}
            className="w-full rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] text-white hover:shadow-lg transition-shadow"
          >
            Free Reflection
          </Button>
          <Button
            type="button"
            onClick={() => {
              setCreateSheetOpen(false);
              router.push("/notes/new?kind=prompt");
            }}
            className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Choose a Prompt
          </Button>
          <Button
            type="button"
            onClick={() => {
              setCreateSheetOpen(false);
              router.push("/notes/new?kind=checkin");
            }}
            className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Check-in
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
