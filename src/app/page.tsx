"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { useSession } from "@/hooks/useSession";
import { GradientHeader } from "@/components/ui/GradientHeader";
import { QuickActionPill } from "@/components/ui/QuickActionPill";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Fab } from "@/components/ui/Fab";
import { Sheet } from "@/components/ui/Sheet";
import {
  Activity,
  ChevronRight,
  Home as HomeIcon,
  NotebookPen,
  PenLine,
  Settings2,
  Sun,
  Wind,
} from "lucide-react";

type QuickActionType = "reflect" | "breathe" | "stretch";

const quickActionDetails: Record<
  QuickActionType,
  { title: string; description: string; prompt: string; actionLabel: string }
> = {
  reflect: {
    title: "Reflect",
    description: "Capture a mindful note to ground your thoughts.",
    prompt: "List three thoughts that feel loud right now. Acknowledge each, then thank them for sharing.",
    actionLabel: "Begin Reflection",
  },
  breathe: {
    title: "Breathe",
    description: "Reset your rhythm with a paced cycle.",
    prompt: "Inhale for 4, hold for 2, exhale for 4. Repeat for ten slow breaths.",
    actionLabel: "Start Breathing",
  },
  stretch: {
    title: "Stretch",
    description: "Release shoulder and neck tension quickly.",
    prompt: "Roll shoulders back five times, then tilt each ear toward its shoulder with deep breaths.",
    actionLabel: "Start Stretch",
  },
};

const focusCards = [
  {
    title: "1-Minute Breathe",
    description: "Follow a calming cadence to steady your breath.",
  },
  {
    title: "Guided Reflection",
    description: "Note one win and one insight from today.",
  },
  {
    title: "Stretch Break",
    description: "Ease upper-body tightness in under two minutes.",
  },
] as const;

const favorites = ["Morning Journal", "Gratitude List", "Calm Playlist", "Reset Breath", "Mini Stretch"] as const;

const bottomNavItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/tracker", label: "Tracker", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export default function HomePage() {
  const [activeQuickAction, setActiveQuickAction] = useState<QuickActionType | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const pathname = usePathname();
  const accentStyle = { "--accent": "#5282FF" } as CSSProperties;
  const { status } = useSession();

  const quickActionDetail = activeQuickAction ? quickActionDetails[activeQuickAction] : null;

  return (
    <div className="relative min-h-svh overflow-hidden bg-[linear-gradient(140deg,#0B3B64_0%,#5282FF_55%,#FFB3C7_100%)] pb-[calc(env(safe-area-inset-bottom,0px)+140px)]">
      <div
        data-auth-debug
        className="pointer-events-none fixed right-3 top-[64px] z-40 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white"
      >
        status: {status}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white/12" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col text-slate-900">
        <GradientHeader title="Welcome back" subtitle="Choose a micro-practice to stay present today." />

        <main className="flex flex-1 flex-col gap-8 px-4 pb-16 pt-6">
          <section aria-label="Quick actions">
            <div className="rounded-[2rem] border border-white/30 bg-white/20 p-5 backdrop-blur-md shadow-[0_30px_60px_-35px_rgba(11,59,100,0.55)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-600">1 min each</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <QuickActionPill
                  icon={<PenLine className="h-4 w-4" aria-hidden />}
                  label="Reflect"
                  onClick={() => setActiveQuickAction("reflect")}
                  className="flex-1 min-w-[100px] !text-slate-900 !border-white/40 !bg-white/60 !text-sm !font-semibold hover:!bg-white/80"
                />
                <QuickActionPill
                  icon={<Wind className="h-4 w-4" aria-hidden />}
                  label="Breathe"
                  onClick={() => setActiveQuickAction("breathe")}
                  className="flex-1 min-w-[100px] !text-slate-900 !border-white/40 !bg-white/60 !text-sm !font-semibold hover:!bg-white/80"
                />
                <QuickActionPill
                  icon={<Sun className="h-4 w-4" aria-hidden />}
                  label="Stretch"
                  onClick={() => setActiveQuickAction("stretch")}
                  className="flex-1 min-w-[100px] !text-slate-900 !border-white/40 !bg-white/60 !text-sm !font-semibold hover:!bg-white/80"
                />
              </div>
            </div>
          </section>

          <section aria-label="Progress" className="flex justify-center">
            <GlassCard className="flex w-full max-w-[260px] justify-center border-white/35 bg-white/20 p-4 backdrop-blur-md">
              <ProgressRing value={72} label="Today" />
            </GlassCard>
          </section>

          <section aria-labelledby="focus-heading" className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="focus-heading" className="text-lg font-semibold">
                Today&apos;s Focus
              </h2>
              <span className="text-xs uppercase tracking-[0.28em] text-slate-600">3 sessions</span>
            </div>

            <div className="flex flex-col gap-4">
              {focusCards.map((card) => (
                <GlassCard
                  key={card.title}
                  className="flex flex-col gap-4 rounded-3xl border-white/35 bg-white/20 p-5 backdrop-blur-md shadow-[0_35px_60px_-35px_rgba(11,59,100,0.6)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">{card.title}</h3>
                      <p className="text-sm text-slate-600">{card.description}</p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 text-slate-500" aria-hidden />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    style={accentStyle}
                    className="self-start px-5 py-2 text-xs uppercase tracking-[0.28em]"
                  >
                    Start
                  </Button>
                </GlassCard>
              ))}
            </div>
          </section>

          <section aria-labelledby="favorites-heading" className="space-y-3">
            <h2 id="favorites-heading" className="text-lg font-semibold">
              Favorites
            </h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {favorites.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="min-h-[44px] shrink-0 rounded-full border border-white/35 bg-white/20 px-4 text-sm font-semibold text-slate-900 shadow-[0_18px_35px_-25px_rgba(11,59,100,0.8)] backdrop-blur-md transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

      <Fab
        isOpen={isFabOpen}
        onClick={() => setIsFabOpen((prev) => !prev)}
        aria-expanded={isFabOpen}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,16px)+104px)] right-5 z-40 shadow-[0_25px_45px_-25px_rgba(11,59,100,0.8)]"
      />

      <Sheet
        open={Boolean(quickActionDetail)}
        onClose={() => setActiveQuickAction(null)}
        title={quickActionDetail?.title}
        description={quickActionDetail?.description}
      >
        {quickActionDetail ? (
          <>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4 text-slate-700">
              <p className="text-sm font-medium">{quickActionDetail.prompt}</p>
            </div>
            <Button
              type="button"
              style={accentStyle}
              onClick={() => setActiveQuickAction(null)}
            >
              {quickActionDetail.actionLabel}
            </Button>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={isFabOpen}
        onClose={() => setIsFabOpen(false)}
        title="Create"
        description="Add something uplifting to keep your momentum."
      >
        <Link
          href="/notes"
          className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
          onClick={() => setIsFabOpen(false)}
        >
          New note
          <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden />
        </Link>
        <Link
          href="/tracker"
          className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
          onClick={() => setIsFabOpen(false)}
        >
          New check in
          <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden />
        </Link>
      </Sheet>

      <nav
        aria-label="Primary navigation"
        className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4"
      >
        <div className="pointer-events-auto w-full max-w-md rounded-[2rem] border border-white/25 bg-white/15 px-3 py-2 backdrop-blur-xl shadow-[0_25px_60px_-35px_rgba(11,59,100,0.9)]">
          <ul className="flex items-center justify-between text-xs font-medium text-white/80">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.href} className="flex flex-1 justify-center">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className="relative inline-flex w-full flex-col items-center gap-1 rounded-[1.5rem] px-3 py-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="home-bottom-nav-highlight"
                        className="absolute inset-x-1 inset-y-0 -z-10 rounded-[1.25rem] bg-white/25"
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                      />
                    ) : null}
                    <Icon className={isActive ? "h-5 w-5 text-white" : "h-5 w-5 text-white/70"} aria-hidden />
                    <span className={isActive ? "text-[11px] text-white" : "text-[11px] text-white/75"}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div data-version="home-v2" hidden />
    </div>
  );
}
