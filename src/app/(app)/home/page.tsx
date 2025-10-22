"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import GradientHeader from "@/components/ui/GradientHeader";
import ProgressRing from "@/components/ui/ProgressRing";
import QuickActionPill from "@/components/ui/QuickActionPill";
import GlassCard from "@/components/ui/GlassCard";
import Fab from "@/components/ui/Fab";
import BottomNav from "@/components/ui/BottomNav";
import Button from "@/components/ui/Button";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  ctaLabel: string;
  icon: ReactNode;
};

type FocusItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

const quickActions: QuickAction[] = [
  {
    key: "reflect",
    label: "Reflect",
    description: "Pause for one minute and jot down a single feeling to clear your mind.",
    ctaLabel: "Start Reflection",
    icon: <NotebookPen className="h-5 w-5" aria-hidden />,
  },
  {
    key: "breathe",
    label: "Breathe",
    description: "Follow a calming inhale and exhale pattern to reset your breathing rhythm.",
    ctaLabel: "Begin Breathing",
    icon: <Wind className="h-5 w-5" aria-hidden />,
  },
  {
    key: "stretch",
    label: "Stretch",
    description: "Release tension with three gentle stretches designed for your desk.",
    ctaLabel: "Start Stretch",
    icon: <StretchVertical className="h-5 w-5" aria-hidden />,
  },
];

const focusItems: FocusItem[] = [
  {
    title: "1-Minute Breathe",
    description: "Relax your shoulders and match the guided breath tempo.",
    href: "/tracker/breathe",
    icon: <Wind className="h-6 w-6" aria-hidden />,
  },
  {
    title: "Guided Reflection",
    description: "Capture two prompts to see how your mood shifts today.",
    href: "/notes/reflection",
    icon: <NotebookPen className="h-6 w-6" aria-hidden />,
  },
  {
    title: "Stretch Break",
    description: "Step away for three mindful stretches to open your posture.",
    href: "/tracker/stretch",
    icon: <StretchVertical className="h-6 w-6" aria-hidden />,
  },
];

const favoriteLabels = ["Morning Reset", "Focus Boost", "Lunchtime Pause", "Evening Wind Down", "Gentle Stretch"];

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
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

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

  const progressValue = useMemo(() => 62, []);

  return (
    <main className="relative min-h-svh bg-[linear-gradient(160deg,#0B3B64_0%,#5282FF_52%,#FFB3C7_100%)] pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] text-slate-900">
      <GradientHeader title="Dashboard" subtitle="Stay balanced with small, focused moments across your day.">
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
          <ProgressRing value={progressValue} label="Today" />
        </div>
      </GradientHeader>

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
                key={action.key}
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
              Today’s Focus
            </h2>
            <span className="text-xs uppercase tracking-[0.32em] text-white/55">Mindful picks</span>
          </div>

          <div className="space-y-3">
            {focusItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: 0.14 + index * 0.05 }}
              >
                <GlassCard className="flex items-center justify-between gap-4 border-white/25 bg-white/18 px-5 py-4 text-white shadow-[0_24px_60px_-40px_rgba(9,52,115,0.85)] backdrop-blur-lg">
                  <div className="flex items-start gap-4 text-left">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                      {item.icon}
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
                      <p className="text-sm text-white/70">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <ChevronRight className="h-5 w-5 text-white/55" aria-hidden />
                    <Link
                      href={item.href}
                      className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/75 transition hover:border-white/60 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Start
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
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
          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1">
            {favoriteLabels.map((label) => (
              <span
                key={label}
                className="inline-flex min-w-[9rem] items-center justify-between gap-3 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/70 backdrop-blur-md"
              >
                {label}
                <Flower className="h-4 w-4 text-white/50" aria-hidden />
              </span>
            ))}
          </div>
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
            key={activeAction.key}
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
                  onClick={() => setActiveAction(null)}
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
