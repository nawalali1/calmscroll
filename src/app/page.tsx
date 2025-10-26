"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  NotebookPen,
  Sparkles,
  Wind,
  StretchVertical,
  Heart,
  Leaf,
  Flower,
  ChevronRight,
  MoonStar,
  StickyNote,
  ClipboardList,
} from "lucide-react";
import { QuickActionPill } from "@/components/ui/QuickActionPill";
import GlassyCard from "@/components/GlassyCard";
import { Button } from "@/components/ui/Button";
import { Fab } from "@/components/ui/Fab";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/BottomNav";
import { useHomeData } from "@/hooks/useHomeData";
import { QUICK_ACTIONS } from "@/config/content";
import { GREETING_TIME_RANGES } from "@/config/timings";
import { METRICS, PROGRESS_CONFIG } from "@/config/ui";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { HomeFeedItem, FavoriteFeedItem } from "@/hooks/useHomeData";

type QuickAction = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  actionLabel: string;
  icon: ReactNode;
};

const sheetMotion = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: "0%", opacity: 1 },
  exit: { y: "100%", opacity: 0 },
};

const resolveActionHref = (action?: string | null, kind?: string | null) => {
  if (!action) return `/tracker/${kind ?? "focus"}`;
  if (action.startsWith("/notes/new")) {
    const [, query = ""] = action.split("?");
    return `/notes${query ? `?${query}` : ""}`;
  }
  return action;
};

export default function HomePage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const { userProfile, dailyProgress, feedItems, userFavorites, favoriteItems, loading, error, refetch } = useHomeData();

  const userDisplayName = userProfile?.display_name?.trim() || "Friend";
  const progressValue = Math.round(
    Math.max(PROGRESS_CONFIG.MIN_VALUE, Math.min(PROGRESS_CONFIG.MAX_VALUE, dailyProgress || METRICS.DEFAULT_DAILY_PROGRESS))
  );
  const progressCircumference = PROGRESS_CONFIG.CIRCUMFERENCE_MULTIPLIER * 50;
  const progressOffset = progressCircumference * (1 - progressValue / PROGRESS_CONFIG.MAX_VALUE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeAction) setActiveAction(null);
        else if (createSheetOpen) setCreateSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeAction, createSheetOpen]);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= GREETING_TIME_RANGES.MORNING.start && hour < GREETING_TIME_RANGES.MORNING.end) return "Good Morning";
    if (hour >= GREETING_TIME_RANGES.AFTERNOON.start && hour < GREETING_TIME_RANGES.AFTERNOON.end)
      return "Good Afternoon";
    return "Good Evening";
  }, []);

  const favoriteSet = useMemo(() => new Set(userFavorites), [userFavorites]);

  const favoriteDisplay = useMemo<FavoriteFeedItem[]>(() => {
    if (favoriteItems.length > 0) return favoriteItems;
    return feedItems
      .filter((item) => favoriteSet.has(item.id))
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        kind: item.kind ?? null,
        created_at: item.created_at ?? null,
        action: item.action ?? null,
      }));
  }, [favoriteItems, feedItems, favoriteSet]);

  const logMetricDelta = useCallback(
    async (delta: { tasks_done?: number; cards_read?: number }) => {
      if (typeof delta.tasks_done !== "number" && typeof delta.cards_read !== "number") return;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in to track progress.");

      const today = new Date().toISOString().split("T")[0]?.replace(/-/g, "") ?? "";
      const { data: existing, error: existingError } = await supabase
        .from("metrics")
        .select("tasks_done, cards_read")
        .eq("user_id", session.user.id)
        .eq("date_key", today)
        .maybeSingle();
      if (existingError) throw existingError;

      const patch: Record<string, string | number> = {
        user_id: session.user.id,
        date_key: today,
        updated_at: new Date().toISOString(),
      };

      if (typeof delta.tasks_done === "number") {
        patch.tasks_done = (existing?.tasks_done ?? 0) + delta.tasks_done;
      }
      if (typeof delta.cards_read === "number") {
        patch.cards_read = (existing?.cards_read ?? 0) + delta.cards_read;
      }

      const { error: upsertError } = await supabase.from("metrics").upsert(patch, {
        onConflict: "user_id,date_key",
      });
      if (upsertError) throw upsertError;
    },
    [supabase]
  );

  const handleQuickActionStart = async (action: QuickAction | null) => {
    if (!action) return;
    try {
      await logMetricDelta({ tasks_done: 1 });
      setNotice({ tone: "success", text: `${action.label} completed. Great work!` });
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to log that action.";
      setNotice({ tone: "error", text: message });
    } finally {
      setActiveAction(null);
    }
  };

  const handleStartActivity = async () => {
    try {
      await logMetricDelta({ cards_read: 1 });
      setNotice({ tone: "success", text: "Activity recorded. Keep going!" });
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to track activity.";
      setNotice({ tone: "error", text: message });
    }
  };

  const handleToggleFavorite = async (item: HomeFeedItem) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in to manage favorites.");

      const isFavorited = favoriteSet.has(item.id);
      if (isFavorited) {
        const { error: deleteError } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", session.user.id)
          .eq("feed_item_id", item.id);
        if (deleteError) throw deleteError;
        setNotice({ tone: "success", text: "Removed from favorites." });
      } else {
        const { error: insertError } = await supabase
          .from("favorites")
          .insert({ user_id: session.user.id, feed_item_id: item.id, saved_at: new Date().toISOString() });
        if (insertError) throw insertError;
        setNotice({ tone: "success", text: "Saved to favorites!" });
      }
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update favorites.";
      setNotice({ tone: "error", text: message });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(165deg,#0B3B64_0%,#5282FF_55%,#FFB3C7_100%)]">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/80">Loading your calm space…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-shell">
        <div className="screen bg-[#F6F8FC] text-slate-900">
          <header className="relative overflow-hidden rounded-b-[42px] bg-[linear-gradient(145deg,#103A8A_0%,#3F6BFF_55%,#FF8CC4_100%)] px-6 pb-20 pt-[calc(env(safe-area-inset-top,0px)+2.25rem)] text-white shadow-[0_30px_80px_-30px_rgba(30,64,160,0.55)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/75">{greeting}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{userDisplayName}</h1>
              </div>
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-md" aria-hidden />
                <svg viewBox="0 0 120 120" className="h-16 w-16 rotate-[-90deg]">
                  <defs>
                    <linearGradient id="progress-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7FC9FF" />
                      <stop offset="100%" stopColor="#FF9ACB" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.25)" strokeWidth="8" fill="none" />
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
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionPill
                  key={action.id}
                  icon={action.icon}
                  label={action.label}
                  onClick={() => setActiveAction(action)}
                  className="flex-1 min-w-[120px] border-white/30 bg-white/15 text-sm font-semibold tracking-tight text-white/95"
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-[-1px]" aria-hidden>
              <svg viewBox="0 0 375 60" xmlns="http://www.w3.org/2000/svg" className="h-12 w-full text-white/65">
                <path fill="currentColor" d="M0 40c30 12 90 32 150 28s120-36 180-40 96 20 96 20v32H0V40z" />
              </svg>
            </div>
          </header>

          {(error || notice) && (
            <div className="mx-auto mt-6 w-full max-w-xl px-6">
              {error && (
                <div className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-medium text-slate-900 backdrop-blur-md">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white transition hover:bg-slate-700"
                  >
                    Retry
                  </button>
                </div>
              )}
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-md ${
                    notice.tone === "error"
                      ? "border-rose-200/40 bg-rose-200/20 text-rose-900"
                      : "border-emerald-200/40 bg-emerald-200/20 text-emerald-900"
                  }`}
                >
                  {notice.text}
                </motion.div>
              )}
            </div>
          )}

          <main className="flex-1 space-y-6 px-6 pb-[140px] pt-16">
            <motion.section
              aria-labelledby="focus-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="focus-section" className="text-lg font-semibold text-slate-800">
                    Today&apos;s Focus
                  </h2>
                  <p className="text-sm text-slate-500">Mindful moments curated for you</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#8CA8FF]" aria-hidden />
              </div>

              <div className="space-y-3">
                {feedItems.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center text-slate-500">
                    <p className="text-sm">No focus items for today yet. Check back soon!</p>
                  </div>
                ) : (
                  feedItems.map((item, index) => {
                    const isFavorite = favoriteSet.has(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut", delay: 0.12 + index * 0.05 }}
                      >
                        <GlassyCard className="flex items-center justify-between gap-4 rounded-[24px] border-white/80 bg-white p-4 shadow-[0_25px_80px_-45px_rgba(30,64,160,0.55)]">
                          <div className="flex flex-1 items-start gap-4 text-left">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#86B7FF] to-[#B39CFF] text-white shadow-[0_10px_25px_-12px_rgba(15,23,42,0.6)]">
                              {item.kind === "breath" ? (
                                <Wind className="h-6 w-6" aria-hidden />
                              ) : item.kind === "reflection" ? (
                                <NotebookPen className="h-6 w-6" aria-hidden />
                              ) : item.kind === "task" ? (
                                <StretchVertical className="h-6 w-6" aria-hidden />
                              ) : (
                                <Sparkles className="h-6 w-6" aria-hidden />
                              )}
                            </span>
                            <div className="flex-1 space-y-1">
                              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                {item.kind ?? "Mindful moment"}
                              </span>
                              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                              <p className="text-sm text-slate-600 line-clamp-2">{item.content}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                void handleToggleFavorite(item);
                              }}
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                                isFavorite
                                  ? "border-rose-300 bg-rose-50 text-rose-500"
                                  : "border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                              }`}
                              aria-pressed={isFavorite}
                              aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
                            >
                              <Heart className="h-4 w-4" aria-hidden fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleStartActivity();
                              }}
                              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-sm hover:brightness-110 transition"
                            >
                              Start
                              <ChevronRight className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                        </GlassyCard>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.section>

            <motion.section
              aria-labelledby="favorites-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <Leaf className="h-5 w-5 text-slate-500" aria-hidden />
                <h2 id="favorites-section" className="text-base font-semibold">
                  Your Favorites
                </h2>
              </div>
              {favoriteDisplay.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Tap the heart icon on any activity to save it here for quick access.
                </p>
              ) : (
                <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-1 scrollbar-none">
                  {favoriteDisplay.map((favorite) => (
                    <button
                      key={favorite.id}
                      type="button"
                      onClick={() => {
                        void handleStartActivity();
                      }}
                      className="inline-flex min-w-[10rem] flex-col items-start justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_18px_45px_-40px_rgba(30,64,160,0.55)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_50px_-35px_rgba(30,64,160,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF]"
                    >
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        <Flower className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        {favorite.kind ?? "Favorite"}
                      </span>
                      <p className="line-clamp-2 text-sm font-medium text-slate-700">{favorite.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.section>
          </main>

          <Fab
            onClick={() => setCreateSheetOpen(true)}
            className="absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom,0px)+108px)] -translate-x-1/2 bg-gradient-to-br from-[#85B6FF] via-[#B99BFF] to-[#FF8FC6] shadow-[0_25px_45px_-25px_rgba(255,142,200,0.6)]"
          />

          <BottomNav />
        </div>
      </div>

      <AnimatePresence>
        {activeAction && (
          <motion.div
            key={activeAction.id}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-labelledby="quick-action-sheet-title"
            aria-modal="true"
            role="dialog"
            onClick={() => setActiveAction(null)}
          >
            <motion.div
              {...sheetMotion}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-2xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                    <MoonStar className="h-4 w-4" aria-hidden />
                    Mindful Moment
                  </div>
                  <h3 id="quick-action-sheet-title" className="text-xl font-semibold tracking-tight">
                    {activeAction.label}
                  </h3>
                  <p className="max-w-sm text-sm text-slate-600">{activeAction.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  aria-label="Close"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ×
                  </span>
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm text-slate-600">{activeAction.prompt}</p>
                <Button
                  type="button"
                  onClick={() => {
                    void handleQuickActionStart(activeAction);
                  }}
                  className="w-full rounded-full bg-slate-900 text-white hover:brightness-105"
                >
                  {activeAction.actionLabel}
                </Button>
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="text-sm font-semibold text-slate-500 underline-offset-4 hover:underline"
                >
                  Not now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet open={createSheetOpen} onClose={() => setCreateSheetOpen(false)} title="Create New">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setCreateSheetOpen(false);
              router.push("/notes/new?kind=free");
            }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <StickyNote className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Free Reflection</p>
              <p className="text-xs text-slate-500">Write your thoughts freely</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateSheetOpen(false);
              router.push("/notes/new?kind=prompt");
            }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <NotebookPen className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Guided Prompt</p>
              <p className="text-xs text-slate-500">Answer a reflection question</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateSheetOpen(false);
              router.push("/tracker/new");
            }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Check-In</p>
              <p className="text-xs text-slate-500">Track your mood and energy</p>
            </div>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
