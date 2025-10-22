"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Sunrise, MoonStar, Focus, RefreshCcw, Sparkles, Info } from "lucide-react";
import { GradientHeader } from "@/components/ui/GradientHeader";
import { QuickActionPill } from "@/components/ui/QuickActionPill";
import { ProgressRing } from "@/components/ui/ProgressRing";
import GlassyCard from "@/components/GlassyCard";
import IconButton from "@/components/IconButton";
import { Button } from "@/components/ui/Button";
import { Fab } from "@/components/ui/Fab";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/ui/BottomNav";

const REFLECTIONS_KEY = "calmscroll_reflections";

type QuickActionId = "morning" | "evening" | "focus" | "reset";

type QuickActionDetail = {
  label: string;
  description: string;
  prompt: string;
  actionLabel: string;
  icon: JSX.Element;
};

const quickActionDetails: Record<QuickActionId, QuickActionDetail> = {
  morning: {
    label: "Morning Calm",
    description: "Set your anchor before the scroll begins.",
    prompt: "Take three breaths. What feeling do you want to keep today?",
    actionLabel: "Begin Reflection",
    icon: <Sunrise className="h-4 w-4" aria-hidden />,
  },
  evening: {
    label: "Evening Wind Down",
    description: "Ease into a softer rhythm.",
    prompt: "Name one thing you’re releasing tonight and why.",
    actionLabel: "Start Wind Down",
    icon: <MoonStar className="h-4 w-4" aria-hidden />,
  },
  focus: {
    label: "Focus Flow",
    description: "Dial into a single task with intent.",
    prompt: "What deserves your full attention for the next 20 minutes?",
    actionLabel: "Enter Focus Flow",
    icon: <Focus className="h-4 w-4" aria-hidden />,
  },
  reset: {
    label: "Quick Reset",
    description: "Shake off the scroll and reset your posture.",
    prompt: "Stand tall, stretch overhead, and list two sensations you notice.",
    actionLabel: "Quick Reset",
    icon: <RefreshCcw className="h-4 w-4" aria-hidden />,
  },
};

const focusCards = [
  {
    id: "focus-breathe",
    title: "1-Minute Breathe",
    description: "Follow a calming cadence to steady your breath.",
  },
  {
    id: "focus-reflection",
    title: "Guided Reflection",
    description: "Note one win and one insight from today.",
  },
  {
    id: "focus-stretch",
    title: "Stretch Break",
    description: "Ease upper-body tension in under two minutes.",
  },
] as const;

const favorites = ["Morning Journal", "Gratitude List", "Calm Playlist", "Reset Breath", "Mini Stretch"] as const;

export default function HomePage() {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [lastReflection, setLastReflection] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(REFLECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { body: string; createdAt: string; updatedAt?: string }[];
        if (parsed.length > 0) {
          const [latest] = [...parsed].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
          setLastReflection(latest.body);
        }
      }
    } catch {
      // ignore
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const accentStyle = useMemo(() => ({ "--accent": "#4C6EF5" } as CSSProperties), []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-calm-gradient py-12">
      <div className="page-shell">
        <div className="screen">
          <GradientHeader
            title="A calmer scroll starts here."
            subtitle="Choose a micro-practice to stay present today."
          />

          <main className="flex-1 space-y-6 px-4 pb-32 pt-6">
            <section aria-label="Quick actions">
              <div className="rounded-[2rem] border border-white/40 bg-white/65 p-5 backdrop-blur-[12px] shadow-[0_20px_50px_-35px_rgba(76,110,245,0.35)] dark:border-white/10 dark:bg-[rgba(20,20,20,0.55)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">1 min each</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.keys(quickActionDetails).map((key) => {
                    const id = key as QuickActionId;
                    const detail = quickActionDetails[id];
                    return (
                      <QuickActionPill
                        key={id}
                        icon={detail.icon}
                        label={detail.label}
                        onClick={() => setActiveAction(id)}
                        className="flex-1 min-w-[140px] !text-slate-900 dark:!text-white"
                      />
                    );
                  })}
                </div>
              </div>
            </section>

            <section aria-label="Today’s Focus" className="space-y-3">
              {focusCards.map((card, index) => (
                <GlassyCard
                  key={card.id}
                  className={`flex flex-col gap-4 border border-white/40 bg-white/70 p-5 text-slate-900 shadow-[0_18px_45px_-30px_rgba(76,110,245,0.35)] transition dark:border-white/10 dark:bg-[rgba(20,20,20,0.55)] dark:text-white ${
                    prefersReducedMotion ? "" : "opacity-100"
                  }`}
                  style={{ transitionDelay: prefersReducedMotion ? undefined : `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">{card.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{card.description}</p>
                    </div>
                    <Sparkles className="mt-1 h-5 w-5 text-indigo-400 dark:text-indigo-300" aria-hidden />
                  </div>
                  <Button
                    type="button"
                    style={accentStyle}
                    className="self-start rounded-full px-5 py-2 text-xs uppercase tracking-[0.25em]"
                  >
                    Start
                  </Button>
                </GlassyCard>
              ))}
              <GlassyCard className="flex items-start justify-between gap-4 border border-white/40 bg-white/70 p-5 text-slate-900 shadow-[0_18px_45px_-30px_rgba(76,110,245,0.35)] dark:border-white/10 dark:bg-[rgba(20,20,20,0.55)] dark:text-white">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Last Reflection</p>
                  <h3 className="text-lg font-semibold">
                    {lastReflection ? "Most recent note" : "No reflections yet"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {lastReflection || "Tap the plus to add your first calm reflection."}
                  </p>
                </div>
                <IconButton
                  aria-label="Open reflections"
                  icon={Info}
                  onClick={() => router.push("/notes")}
                  className="bg-white/80 text-indigo-500 hover:bg-white dark:bg-white/10 dark:text-indigo-300"
                />
              </GlassyCard>
            </section>

            <section aria-label="Progress">
              <GlassyCard className="flex flex-col items-center gap-6 border border-white/40 bg-white/60 p-6 text-center text-slate-900 shadow-[0_20px_50px_-35px_rgba(76,110,245,0.35)] dark:border-white/10 dark:bg-[rgba(20,20,20,0.55)] dark:text-white">
                <ProgressRing value={72} label="Today" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your mindful momentum is steady. Celebrate each micro-step.
                </p>
              </GlassyCard>
            </section>

            <section aria-label="Favorites" className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">
                Favorites
              </h2>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
                {favorites.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="min-h-[44px] shrink-0 rounded-full border border-white/40 bg-white/70 px-4 text-sm font-semibold text-slate-900 shadow-[0_18px_35px_-25px_rgba(76,110,245,0.3)] backdrop-blur-md transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C6EF5] dark:border-white/10 dark:bg-[rgba(20,20,20,0.55)] dark:text-white dark:hover:bg-white/10"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </main>

          <Fab
            onClick={() => setCreateSheetOpen(true)}
            className="absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom,16px)+104px)] -translate-x-1/2 bg-gradient-to-br from-[#A5C7FF] via-[#D0B8FF] to-[#FFB3D1]"
          />

          <BottomNav />
        </div>
      </div>

      <BottomSheet
        open={Boolean(activeAction)}
        onClose={() => setActiveAction(null)}
        title={activeAction ? quickActionDetails[activeAction].label : undefined}
        description={activeAction ? quickActionDetails[activeAction].description : undefined}
      >
        {activeAction ? (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {quickActionDetails[activeAction].prompt}
            </p>
            <Button type="button" onClick={() => setActiveAction(null)} className="w-full rounded-full">
              {quickActionDetails[activeAction].actionLabel}
            </Button>
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        title="What would you like to do?"
      >
        <Button
          type="button"
          onClick={() => router.push("/notes/new?kind=free")}
          className="w-full rounded-full"
        >
          Free Reflection
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/notes/new?kind=prompt")}
          className="w-full rounded-full"
        >
          Choose a Prompt
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/notes/new?kind=checkin")}
          className="w-full rounded-full"
        >
          Check-in
        </Button>
      </BottomSheet>
    </div>
  );
}
