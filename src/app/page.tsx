"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Sparkles, StretchVertical, Wind } from "lucide-react";
import { QuickActionPill } from "@/components/ui/QuickActionPill";
import GlassyCard from "@/components/GlassyCard";
import { Button } from "@/components/ui/Button";
import { Fab } from "@/components/ui/Fab";
import BottomSheet from "@/components/BottomSheet";
import BottomNav from "@/components/BottomNav";

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

const FOCUS_CARDS = [
  {
    id: "focus-breathe",
    title: "1-Minute Breathe",
    description: "Reset your mind with a guided breathing session.",
    accent: "from-[#86B7FF] to-[#B39CFF]",
    icon: Wind,
  },
  {
    id: "focus-reflection",
    title: "Guided Reflection",
    description: "Take a moment to check in with yourself.",
    accent: "from-[#BF9FFF] to-[#FF9ACB]",
    icon: NotebookPen,
  },
  {
    id: "focus-stretch",
    title: "Stretch Break",
    description: "Release tension with gentle movement prompts.",
    accent: "from-[#8DD2FF] to-[#A78BFA]",
    icon: StretchVertical,
  },
] as const;

const FAVORITES = ["Morning Journal", "Gratitude List", "Calm Playlist", "Reset Breath", "Mini Stretch"] as const;

export default function HomePage() {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  return (
    <>
      <div className="page-shell">
        <div className="screen bg-[#F6F8FC] text-slate-900">
          <header className="relative overflow-hidden rounded-b-[42px] bg-[linear-gradient(145deg,#103A8A_0%,#3F6BFF_55%,#FF8CC4_100%)] px-6 pb-20 pt-[calc(env(safe-area-inset-top,0px)+2.25rem)] text-white shadow-[0_30px_80px_-30px_rgba(30,64,160,0.55)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/75">{greeting}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Nawal</h1>
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
                    strokeDasharray={Math.PI * 100}
                    strokeDashoffset={Math.PI * 100 * 0.22}
                    fill="none"
                    className={prefersReducedMotion ? "" : "transition-all duration-700 ease-out"}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-semibold leading-none">78%</span>
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
                <path
                  fill="currentColor"
                  d="M0 40c30 12 90 32 150 28s120-36 180-40 96 20 96 20v32H0V40z"
                />
              </svg>
            </div>
          </header>

          <main className="flex-1 space-y-6 px-6 pb-[140px] pt-16">
            <section aria-labelledby="focus-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="focus-section" className="text-lg font-semibold text-slate-800">
                    Today&apos;s Focus
                  </h2>
                  <p className="text-sm text-slate-500">Take a moment to check in.</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#8CA8FF]" aria-hidden />
              </div>

              <div className="space-y-3">
                {FOCUS_CARDS.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <GlassyCard
                      key={card.id}
                      className="flex items-center justify-between gap-4 rounded-[24px] border-white/80 bg-white p-4 shadow-[0_25px_80px_-45px_rgba(30,64,160,0.55)]"
                      style={{ transitionDelay: prefersReducedMotion ? undefined : `${index * 40}ms` }}
                    >
                      <div className="flex flex-1 items-center gap-4 text-left">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_25px_-12px_rgba(15,23,42,0.6)] ${card.accent}`}
                          aria-hidden
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                          <p className="text-sm text-slate-500">{card.description}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        className="rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-sm hover:brightness-110"
                      >
                        Start
                      </Button>
                    </GlassyCard>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="favorites-section" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="favorites-section" className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                  Favorites
                </h2>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">Always here</span>
              </div>
              <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-1 scrollbar-none">
                {FAVORITES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="inline-flex min-w-[9rem] items-center justify-between gap-3 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-[0_18px_45px_-40px_rgba(30,64,160,0.55)] transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7EA7FF]"
                  >
                    {item}
                    <span className="h-2 w-2 rounded-full bg-gradient-to-br from-[#7EA7FF] to-[#FF8DC5]" aria-hidden />
                  </button>
                ))}
              </div>
            </section>
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
            <p className="text-sm text-slate-600">{activeAction.prompt}</p>
            <Button type="button" onClick={() => setActiveAction(null)} className="w-full rounded-full bg-slate-900 text-white">
              {activeAction.actionLabel}
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
          className="w-full rounded-full bg-slate-900 text-white"
        >
          Free Reflection
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/notes/new?kind=prompt")}
          className="w-full rounded-full bg-slate-900 text-white"
        >
          Choose a Prompt
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/notes/new?kind=checkin")}
          className="w-full rounded-full bg-slate-900 text-white"
        >
          Check-in
        </Button>
      </BottomSheet>
    </>
  );
}
