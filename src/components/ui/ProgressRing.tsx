"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import cn from "classnames";

type ProgressRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ProgressRing({ value, size = 128, strokeWidth = 10, label = "Today", className }: ProgressRingProps) {
  const reducedMotion = useReducedMotion();
  const progress = clamp(value, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const arcStops = useMemo(
    () => [
      { id: "arc-a", stopColor: "#7FB9FF", offset: "0%" },
      { id: "arc-b", stopColor: "#FFB3C7", offset: "100%" },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
      className={cn(
        "relative flex items-center justify-center rounded-[2.5rem] bg-white/10 p-4 text-white shadow-[0_25px_60px_-40px_rgba(11,59,100,0.9)] backdrop-blur-2xl",
        className
      )}
      style={{ width: size + 32, height: size + 32 }}
      role="img"
      aria-label={`${progress}% complete for ${label}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {arcStops.map((stop) => (
              <stop key={stop.id} offset={stop.offset} stopColor={stop.stopColor} />
            ))}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          {...(!reducedMotion
            ? {
                initial: { strokeDashoffset: circumference },
                animate: { strokeDashoffset: offset },
                transition: { duration: 0.6, ease: "easeInOut" },
              }
            : {})}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold leading-none">{Math.round(progress)}</span>
        <span className="text-xs uppercase tracking-[0.3em] text-white/70">%</span>
        <span className="mt-3 rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

export default ProgressRing;
