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

type MoodSelectorProps = {
  value: MoodValue | null;
  onSelect: (value: MoodValue) => void;
};

export function MoodSelector({ value, onSelect }: MoodSelectorProps) {
  const prefersReducedMotion = useReducedMotion();
  const message = useMemo(() => (value ? MOOD_TIPS[value] : "How do you feel today?"), [value]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--ink)]">How do you feel today?</h2>
        {value ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            {moodOptions.find((option) => option.value === value)?.label}
          </span>
        ) : null}
      </div>
      <motion.div
        className="grid grid-cols-5 gap-3 rounded-3xl border border-[var(--card-border)] bg-white/90 p-4"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.21, 0.72, 0.42, 1] }}
      >
        {moodOptions.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-label={`Feeling ${option.label}`}
              onClick={() => onSelect(option.value)}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-2 rounded-full border border-transparent bg-white/80 px-2 py-3 text-[var(--ink-muted)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                active
                  ? "bg-gradient-to-br from-rose-400 to-pink-300 text-white shadow-md"
                  : "hover:bg-[var(--bg-end)]/50"
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border border-transparent",
                  active ? "bg-white/20" : "bg-white"
                )}
                aria-hidden
              >
                <option.Icon className={cn("h-5 w-5", active ? "text-white" : "text-[var(--ink-muted)]")} />
              </span>
              <span className={cn("text-xs font-semibold", active ? "text-white" : "text-[var(--ink-muted)]")}
                aria-hidden
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </motion.div>
      <p className="text-sm text-[var(--ink-muted)]">{message}</p>
    </div>
  );
}

export default MoodSelector;
