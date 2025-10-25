"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  NotebookPen,
  Wind,
  StretchVertical,
  Sparkles,
  ChevronRight,
  Leaf,
  Flower,
  MoonStar,
  StickyNote,
  ClipboardList,
  Heart,
} from "lucide-react";
import GradientHeader from "@/components/ui/GradientHeader";
import ProgressRing from "@/components/ui/ProgressRing";
import QuickActionPill from "@/components/ui/QuickActionPill";
import GlassCard from "@/components/ui/GlassCard";
import Fab from "@/components/ui/Fab";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/ui/Button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useHomeData, type FavoriteFeedItem, type HomeFeedItem } from "@/hooks/useHomeData";

type QuickAction = {
  id: string;
  label: string;
  description: string;
  ctaLabel: string;
  icon: ReactNode;
};

const quickActions: QuickAction[] = [
  {
    id: "reflect",
    label: "Reflect",
    description: "Pause for one minute and jot down a single feeling to clear your mind.",
    ctaLabel: "Start Reflection",
    icon: <NotebookPen className="h-5 w-5" aria-hidden />,
  },
  {
    id: "breathe",
    label: "Breathe",
    description: "Follow a calming inhale and exhale pattern to reset your breathing rhythm.",
    ctaLabel: "Begin Breathing",
    icon: <Wind className="h-5 w-5" aria-hidden />,
  },
  {
    id: "stretch",
    label: "Stretch",
    description: "Release tension with three gentle stretches designed for your desk.",
    ctaLabel: "Start Stretch",
    icon: <StretchVertical className="h-5 w-5" aria-hidden />,
  },
];

const resolveActionHref = (action?: string | null, kind?: string | null) => {
  if (!action) return `/tracker/${kind ?? "focus"}`;
  if (action.startsWith("/notes/new")) {
    const [, query = ""] = action.split("?");
    return `/notes${query ? `?${query}` : ""}`;
  }
  return action;
};

const fabOptions = [
  { label: "New note", href: "/notes/new", icon: <StickyNote className="h-5 w-5" aria-hidden /> },
  { label: "New check in", href: "/tracker/new", icon: <ClipboardList className="h-5 w-5" aria-hidden /> },
];

const sheetMotion = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: "0%", opacity: 1 },
  exit: { y: "100%", opacity: 0 },
};

export default function HomePage() {
  const supabase = getSupabaseClient();
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const {
    userProfile,
    dailyProgress,
    feedItems,
    userFavorites,
    favoriteItems,
    loading,
    error,
    refetch,
  } = useHomeData();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeAction) {
          setActiveAction(null);
        } else if (fabOpen) {
          setFabOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeAction, fabOpen]);

  const favoriteSet = useMemo(() => new Set(userFavorites), [userFavorites]);

  const favoriteDisplay = useMemo<FavoriteFeedItem[]>(() => {
    if (favoriteItems.length > 0) {
      return favoriteItems;
    }
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

  const displayName = useMemo(() => {
    if (!userProfile) return null;
    if (userProfile.display_name) return userProfile.display_name;
    return null;
  }, [userProfile]);

  const headerTitle = displayName ? `Welcome back, ${displayName}` : "Welcome to CalmScroll";
  const headerSubtitle =
    "Stay grounded with quick pauses, reflections, and mindful movement tailored to your day.";

  const logMetricDelta = useCallback(
    async (delta: { tasks_done?: number; cards_read?: number }) => {
      if (typeof delta.tasks_done !== "number" && typeof delta.cards_read !== "number") {
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in to continue tracking your progress.");

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
      setNotice({ tone: "success", text: `${action.label} logged. Nice work keeping your streak!` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to log that action right now.";
      setNotice({ tone: "error", text: message });
    } finally {
      setActiveAction(null);
    }
  };

  const handleStartActivity = async () => {
    try {
      await logMetricDelta({ cards_read: 1 });
      setNotice({ tone: "success", text: "Activity recorded. Keep up the calm momentum." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to track this activity.";
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
        setNotice({ tone: "success", text: "Saved to favorites for quick access." });
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
    <main className="relative min-h-svh bg-[linear-gradient(160deg,#0B3B64_0%,#5282FF_52%,#FFB3C7_100%)] pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] text-slate-900">
      <GradientHeader title={headerTitle} subtitle={headerSubtitle}>
        <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-4">
            <div className="inline-flex max-w-xs items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-white/75">
              <Sparkles className="h-4 w-4" aria-hidden />
              Guided Flow
            </div>
            <p className="max-w-md text-sm text-white/75">
              Track mindful streaks and revisit your calm routines with gentle nudges tailored for the moment.
            </p>
          </div>
          <ProgressRing value={dailyProgress} label="Today" />
        </div>
      </GradientHeader>

      {(error || notice) && (
        <div className="mx-auto mt-6 w-full max-w-xl px-6">
          {error ? (
            <div className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/80 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Retry
              </button>
            </div>
          ) : null}
          {notice ? (
            <div
              className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-md ${
                notice.tone === "error"
                  ? "border-rose-200/40 bg-rose-200/20 text-rose-50"
                  : "border-emerald-200/40 bg-emerald-200/20 text-emerald-50"
              }`}
              role={notice.tone === "error" ? "alert" : "status"}
            >
              {notice.text}
            </div>
          ) : null}
        </div>
      )}

      <section aria-labelledby="quick-actions-heading" className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.08 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 id="quick-actions-heading" className="text-base font-semibold text-white">
              Quick actions
            </h2>
            <span className="text-xs font-medium uppercase tracking-[0.28em] text-white/60">Just a minute</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {quickActions.map((action) => (
              <QuickActionPill
                key={action.id}
                label={action.label}
                icon={action.icon}
                onClick={() => setActiveAction(action)}
                className="w-full"
              />
            ))}
          </div>
        </motion.div>

        <motion.section
          aria-labelledby="focus-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.12 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 id="focus-heading" className="text-lg font-semibold text-white">
              Today&apos;s Focus
            </h2>
            <span className="text-xs uppercase tracking-[0.32em] text-white/55">Mindful picks</span>
          </div>

          <div className="space-y-3">
            {feedItems.length === 0 ? (
              <div className="rounded-3xl border border-white/25 bg-white/15 px-6 py-8 text-center text-white/75 backdrop-blur-lg">
                Nothing queued yet. Check back later for fresh mindful prompts.
              </div>
            ) : (
              feedItems.map((item, index) => {
                const isFavorite = favoriteSet.has(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut", delay: 0.14 + index * 0.05 }}
                  >
                    <GlassCard className="flex items-center justify-between gap-4 border-white/30 bg-white/18 px-5 py-4 text-white shadow-[0_24px_60px_-40px_rgba(9,52,115,0.85)] backdrop-blur-lg">
                      <div className="flex items-start gap-4 text-left">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
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
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                            {item.kind ?? "Mindful moment"}
                          </span>
                          <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
                          <p className="text-sm text-white/70 line-clamp-2">{item.content}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            void handleToggleFavorite(item);
                          }}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition ${
                            isFavorite
                              ? "border-white/80 bg-white/70 text-rose-500"
                              : "border-white/30 bg-white/10 text-white/80 hover:border-white/60 hover:bg-white/20"
                          }`}
                          aria-pressed={isFavorite}
                          aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
                        >
                          <Heart className="h-4 w-4" aria-hidden fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                        <ChevronRight className="h-5 w-5 text-white/55" aria-hidden />
                        <Link
                          href={resolveActionHref(item.action, item.kind)}
                          onClick={() => {
                            void handleStartActivity();
                          }}
                          className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/75 transition hover:border-white/60 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          Start
                        </Link>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        <motion.section
          aria-labelledby="favorites-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-white">
            <Leaf className="h-5 w-5 text-white/70" aria-hidden />
            <h2 id="favorites-heading" className="text-base font-semibold">
              Favorites
            </h2>
          </div>
          {favoriteDisplay.length === 0 ? (
            <p className="text-sm text-white/70">Mark an activity with the heart icon to pin it here for later.</p>
          ) : (
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1">
              {favoriteDisplay.map((favorite) => (
                <button
                  key={favorite.id}
                  type="button"
                  onClick={() => {
                    void handleStartActivity();
                  }}
                  className="inline-flex min-w-[10rem] flex-col items-start justify-between gap-2 rounded-2xl border border-white/25 bg-white/12 px-4 py-3 text-left text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                    <Flower className="h-3.5 w-3.5 text-white/60" aria-hidden />
                    {favorite.kind ?? "Favorite"}
                  </span>
                  <p className="line-clamp-2 text-sm font-medium text-white/90">{favorite.title}</p>
                </button>
              ))}
            </div>
          )}
        </motion.section>
      </section>

      <Fab
        aria-label="Create new"
        isOpen={fabOpen}
        onClick={() => setFabOpen((previous) => !previous)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-6 z-40"
      />

      <BottomNav />

      <AnimatePresence>
        {activeAction ? (
          <motion.div
            key={activeAction.id}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-labelledby="quick-action-sheet-title"
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              {...sheetMotion}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                    <MoonStar className="h-4 w-4" aria-hidden />
                    Flow
                  </div>
                  <h3 id="quick-action-sheet-title" className="text-xl font-semibold tracking-tight">
                    {activeAction.label}
                  </h3>
                  <p className="max-w-sm text-sm text-slate-600">{activeAction.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  aria-label="Close quick action"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ×
                  </span>
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    void handleQuickActionStart(activeAction);
                  }}
                  className="w-full rounded-full bg-slate-900 text-white hover:brightness-105"
                >
                  {activeAction.ctaLabel}
                </Button>
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="text-sm font-semibold text-slate-500 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  Not now
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {fabOpen ? (
          <motion.div
            key="fab-menu"
            className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Create new item"
            onClick={() => setFabOpen(false)}
          >
            <motion.div
              {...sheetMotion}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-xs space-y-3 rounded-3xl border border-white/20 bg-white/95 p-4 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              {fabOptions.map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  onClick={() => setFabOpen(false)}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                    {option.icon}
                  </span>
                  {option.label}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
