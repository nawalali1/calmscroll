"use client";

import { useMemo } from "react";
import { Bike, Footprints, Moon } from "lucide-react";
import cn from "classnames";
import ProgressRing from "./ProgressRing";

type TrackerHeroProps = {
  firstName?: string | null;
  progressValue: number;
  stats?: Array<{ label: string; value: string }>;
};

const quickActions = [
  { id: "sleep", label: "Sleep", Icon: Moon, href: "/tracker?sleep" },
  { id: "walking", label: "Walking", Icon: Footprints, href: "/tracker?walking" },
  { id: "cycling", label: "Cycling", Icon: Bike, href: "/tracker?cycling" },
];

export function TrackerHero({ firstName, progressValue, stats = [] }: TrackerHeroProps) {
  const greeting = useMemo(() => {
    if (firstName && firstName.trim().length > 0) return firstName.trim();
    return "Friend";
  }, [firstName]);

  return (
    <section
      aria-labelledby="tracker-hero-heading"
      className={cn(
        "relative isolate overflow-hidden",
        "bg-gradient-to-b from-[var(--blue-hero-a)] via-[var(--blue-hero-b)] to-[var(--blue-hero-c)]",
        "text-white shadow-[0_30px_80px_-40px_rgba(11,59,100,0.8)]"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_60%)] mix-blend-soft-light"
        aria-hidden
      />
      <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[rgba(123,200,255,0.25)] blur-3xl" aria-hidden />
      <div className="absolute -left-16 bottom-10 h-48 w-48 rounded-full bg-[rgba(126,180,255,0.28)] blur-3xl" aria-hidden />

      <div className="relative px-6 pb-10 pt-12 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <header>
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/70">Good day,</p>
              <h1 id="tracker-hero-heading" className="mt-2 text-[1.75rem] font-semibold leading-tight">
                {greeting}
              </h1>
            </header>

            {stats.length > 0 ? (
              <dl className="mt-6 grid grid-cols-3 gap-3 max-[380px]:grid-cols-2">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/10 px-3 py-3 text-left shadow-inner shadow-[rgba(255,255,255,0.1)] backdrop-blur-md"
                  >
                    <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-white/70">{stat.label}</dt>
                    <dd className="mt-1 text-base font-semibold">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {quickActions.map(({ id, label, Icon, href }) => (
                <a
                  key={id}
                  href={href}
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white/90 transition hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[180px] sm:mx-0">
            <ProgressRing value={progressValue} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrackerHero;
