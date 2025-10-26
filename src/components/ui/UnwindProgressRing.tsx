"use client";

import { motion, useReducedMotion } from "framer-motion";

interface UnwindProgressRingProps {
  duration: number;
  elapsed: number;
}

export default function UnwindProgressRing({ duration, elapsed }: UnwindProgressRingProps) {
  const reducedMotion = useReducedMotion();
  const progress = Math.min((elapsed / duration) * 100, 100);
  const remaining = Math.max(0, duration - elapsed);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg
        width="224"
        height="224"
        viewBox="0 0 224 224"
        className="rotate-[-90deg]"
      >
        {/* Background circle */}
        <circle
          cx="112"
          cy="112"
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth="10"
          opacity="0.5"
        />

        {/* Progress circle */}
        <motion.circle
          cx="112"
          cy="112"
          r={radius}
          fill="none"
          stroke="var(--success)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          {...(!reducedMotion
            ? {
                initial: { strokeDashoffset: circumference },
                animate: { strokeDashoffset },
                transition: { type: "tween", ease: "linear", duration: 1 },
              }
            : {})}
        />
      </svg>

      {/* Center countdown */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={!reducedMotion ? { opacity: 0, scale: 0.9 } : undefined}
        animate={!reducedMotion ? { opacity: 1, scale: 1 } : undefined}
        transition={!reducedMotion ? { duration: 0.3 } : undefined}
      >
        <div
          className="text-6xl font-bold tabular-nums"
          style={{ color: "var(--accent)" }}
        >
          {Math.ceil(remaining)}
        </div>
        <div
          className="text-sm font-medium mt-2"
          style={{ color: "var(--ink-muted)" }}
        >
          seconds
        </div>
      </motion.div>
    </div>
  );
}
