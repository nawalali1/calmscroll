"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Wind, PenLine, Activity } from "lucide-react";
import cn from "classnames";

type FeatureTilesProps = {
  onBreathe: () => void;
  onReflect: () => void;
  onStretchStart?: () => void;
};

type StretchState = "idle" | "running" | "complete";

const gradients = [
  "from-[#E6CCFF] via-[#FFB3C7] to-[#FFD6A5]",
  "from-[#CDE6FF] via-[#FFE0F0] to-[#FFE7C7]",
  "from-[#CFFAFE] via-[#E0E7FF] to-[#FBCFE8]",
];

export function FeatureTiles({ onBreathe, onReflect, onStretchStart }: FeatureTilesProps) {
  const prefersReducedMotion = useReducedMotion();
  const [stretchState, setStretchState] = useState<StretchState>("idle");
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (stretchState !== "running") return;
    const total = 20;
    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Math.min(total, Math.round((Date.now() - startedAt) / 1000));
      setTimeLeft(total - elapsed);
      if (elapsed >= total) {
        setStretchState("complete");
        window.clearInterval(interval);
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [stretchState]);

  const tiles = useMemo(
    () => [
      {
        key: "breathe",
        title: "1-Minute Breathe",
        description: "Settle your mind in sixty gentle seconds.",
        Icon: Wind,
        gradient: gradients[0],
        onClick: onBreathe,
        detail: "Focus in, follow the guide.",
      },
      {
        key: "reflect",
        title: "Guided Reflection",
        description: "Get a fresh prompt inside your notes.",
        Icon: PenLine,
        gradient: gradients[1],
        onClick: onReflect,
        detail: "Capture what stands out today.",
      },
      {
        key: "stretch",
        title: "Stretch Break",
        description:
          stretchState === "complete"
            ? "Nice work. Ready for another reset?"
            : stretchState === "running"
            ? `Flowing — ${timeLeft}s left`
            : "Open your posture with a 20-second flow.",
        Icon: Activity,
        gradient: gradients[2],
        onClick: () => {
          if (stretchState === "running") return;
          setStretchState("running");
          setTimeLeft(20);
          onStretchStart?.();
        },
        detail:
          stretchState === "complete"
            ? "Restart whenever you need a lift."
            : "Hold each pose for a slow count of four.",
      },
    ],
    [onBreathe, onReflect, onStretchStart, stretchState, timeLeft]
  );

  useEffect(() => {
    if (stretchState === "complete") {
      const timeout = window.setTimeout(() => {
        setStretchState("idle");
        setTimeLeft(20);
      }, 6000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [stretchState]);

  return (
    <section className="space-y-3">
      {tiles.map((tile, index) => {
        const Icon = tile.Icon;
        const isStretch = tile.key === "stretch";
        const disabled = isStretch && stretchState === "running";

        return (
          <motion.button
            key={tile.key}
            type="button"
            onClick={tile.onClick}
            disabled={disabled}
            className={cn(
              "group flex w-full items-center justify-between rounded-3xl bg-gradient-to-r p-[1px] text-left shadow-md transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              tile.gradient,
              disabled ? "cursor-wait opacity-95" : "hover:-translate-y-0.5 hover:shadow-lg"
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05, ease: [0.21, 0.72, 0.42, 1] }}
            aria-label={tile.title}
          >
            <div className="flex flex-1 items-center justify-between rounded-3xl bg-white/70 px-4 py-4 backdrop-blur-[1px]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/60 text-[var(--ink)] shadow-sm" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1 text-[var(--ink)]">
                  <p className="text-base font-semibold">{tile.title}</p>
                  <p className="text-sm text-[var(--ink-muted)]">{tile.description}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{tile.detail}</p>
                </div>
              </div>
              <span className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--ink)] shadow-sm transition group-hover:translate-x-0.5 group-hover:shadow-md" aria-hidden>
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </motion.button>
        );
      })}
    </section>
  );
}

export default FeatureTiles;
