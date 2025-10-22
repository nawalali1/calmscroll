"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Wind, PenLine, Activity } from "lucide-react";
import Button from "@/components/ui/Button";

type ProgramCardsProps = {
  onBreathe: () => void;
  onReflect: () => void;
};

type StretchState = "idle" | "running" | "complete";

export function ProgramCards({ onBreathe, onReflect }: ProgramCardsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [stretchState, setStretchState] = useState<StretchState>("idle");
  const [stretchProgress, setStretchProgress] = useState(0);

  useEffect(() => {
    if (stretchState !== "running") return;
    const total = 20;
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Math.min(total, Math.round((Date.now() - startedAt) / 1000));
      setStretchProgress(Math.floor((elapsed / total) * 100));
      if (elapsed >= total) {
        setStretchState("complete");
        window.clearInterval(interval);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [stretchState]);

  const cards = [
    {
      key: "breathe",
      icon: Wind,
      title: "1-Minute Breathe",
      subtitle: "Settle your mind with a single focused minute.",
      actionLabel: "Start breathe",
      onClick: () => onBreathe(),
      gradient: "from-violet-400 via-fuchsia-400 to-rose-400",
    },
    {
      key: "reflect",
      icon: PenLine,
      title: "Guided Reflection",
      subtitle: "Capture a calming prompt inside your notes.",
      actionLabel: "Write reflection",
      onClick: () => onReflect(),
      gradient: "from-fuchsia-400 via-rose-400 to-amber-300",
    },
    {
      key: "stretch",
      icon: Activity,
      title: "Stretch Break",
      subtitle: stretchState === "complete" ? "Great job. Feel the release." : "Reset posture with a 20-second flow.",
      actionLabel: stretchState === "running" ? `Stretching… ${stretchProgress}%` : stretchState === "complete" ? "Restart stretch" : "Begin stretch",
      onClick: () => {
        if (stretchState === "running") return;
        setStretchProgress(0);
        setStretchState("running");
      },
      gradient: "from-rose-400 via-pink-400 to-violet-400",
    },
  ] as const;

  return (
    <div className="space-y-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isStretch = card.key === "stretch";
        return (
          <motion.article
            key={card.key}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05, ease: [0.21, 0.72, 0.42, 1] }}
            className={`overflow-hidden rounded-3xl bg-gradient-to-br ${card.gradient} p-[1px] shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-md`}
          >
            <div className="rounded-3xl bg-white/5 px-5 py-6 text-white">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex-1 space-y-2 text-left">
                  <h3 className="text-lg font-medium text-white">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-white/80">
                    {isStretch && stretchState === "running"
                      ? "Inhale, reach tall. Exhale, gently fold. Keep the rhythm flowing."
                      : card.subtitle}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={card.onClick}
                    className="w-fit px-5 text-white hover:bg-white/20"
                    disabled={card.key === "stretch" && stretchState === "running"}
                  >
                    {card.actionLabel}
                  </Button>
                  {isStretch ? (
                    <div className="h-1.5 w-full rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${stretchState === "running" || stretchState === "complete" ? stretchProgress : 0}%` }}
                        aria-hidden
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export default ProgramCards;
