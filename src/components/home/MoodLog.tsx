"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cloud, Minus, Heart, Sun, Star } from "lucide-react";
import cn from "classnames";

const MOOD_TIPS: Record<MoodValue, string> = {
  tired: "Feeling tired? Take a 1-minute breathe or a short stretch.",
  okay: "Feeling okay? Write a quick note to clear your mind.",
  calm: "Feeling calm? Capture a reflection before it fades.",
  energized: "Feeling energized? Tackle one small task with focus.",
  joyful: "Feeling joyful? Share the energy—plan a kind action.",
};

const moodOptions: Array<{
  value: MoodValue;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "tired", label: "Tired", Icon: Cloud },
  { value: "okay", label: "Okay", Icon: Minus },
  { value: "calm", label: "Calm", Icon: Heart },
  { value: "energized", label: "Energized", Icon: Sun },
  { value: "joyful", label: "Joyful", Icon: Star },
];

export type MoodValue = "tired" | "okay" | "calm" | "energized" | "joyful";

type MoodLogProps = {
  value: MoodValue | null;
  onSelect: (value: MoodValue) => void;
};

export function MoodLog({ value, onSelect }: MoodLogProps) {
  const prefersReducedMotion = useReducedMotion();
  const message = useMemo(() => (value ? MOOD_TIPS[value] : "Tap a mood to track how you feel."), [value]);

  return (
    <section className="mt-2 mb-1 px-4">
      <motion.div
        className="flex items-end justify-between gap-3"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.21, 0.72, 0.42, 1] }}
      >
        {moodOptions.map((option) => {
          const active = option.value === value;
          return (
            <div key={option.value} className="flex flex-col items-center">
              <button
                type="button"
                aria-label={`Feeling ${option.label}`}
                onClick={() => onSelect(option.value)}
                className={cn(
                  "rounded-full p-3 text-[var(--ink-muted)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  active
                    ? "bg-gradient-to-br from-rose-400 to-pink-300 text-white shadow-md"
                    : "bg-white/80 hover:bg-white"
                )}
              >
                <option.Icon className={cn("h-5 w-5", active ? "text-white" : "text-[var(--ink-muted)]")} aria-hidden />
              </button>
              <span className="mt-1 text-[11px] font-medium text-[var(--ink-muted)]" aria-hidden>
                {option.label}
              </span>
            </div>
          );
        })}
      </motion.div>
      <p className="mt-3 text-xs text-[var(--ink-muted)]">{message}</p>
    </section>
  );
}

export default MoodLog;
