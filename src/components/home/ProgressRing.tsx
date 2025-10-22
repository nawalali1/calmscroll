"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import cn from "classnames";

type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  fillColor?: string;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ProgressRing({
  value,
  size = 140,
  stroke = 12,
  trackColor = "rgba(255,255,255,0.25)",
  fillColor = "#A7C8FF",
  className,
}: ProgressRingProps) {
  const reducedMotion = useReducedMotion();
  const clampedValue = clamp(Math.round(value), 0, 100);

  const { radius, circumference, dashOffset } = useMemo(() => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return {
      radius: r,
      circumference: c,
      dashOffset: c * (1 - clampedValue / 100),
    };
  }, [clampedValue, size, stroke]);

  const accentArcs = useMemo(
    () => [
      { angle: 0.05, color: "rgba(255,255,255,0.55)" },
      { angle: 0.45, color: "rgba(168,237,255,0.65)" },
      { angle: 0.78, color: "rgba(255,214,245,0.55)" },
    ],
    []
  );

  const accentLength = circumference * 0.08;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "rounded-full bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_60px_-25px_rgba(12,53,120,0.6)]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-white/15 to-transparent blur-2xl" aria-hidden />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="ring-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fillColor} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ring-fill)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          {...(!reducedMotion
            ? {
                initial: { strokeDashoffset: circumference },
                animate: { strokeDashoffset: dashOffset },
                transition: { duration: 0.8, ease: "easeInOut" },
              }
            : {})}
        />
        {accentArcs.map((arc, index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius + stroke * 0.25}
            stroke={arc.color}
            strokeWidth={stroke * 0.35}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${accentLength} ${circumference}`}
            strokeDashoffset={circumference * (1 - arc.angle) - accentLength / 2}
            opacity={0.9}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-semibold tracking-tight">{clampedValue}</span>
        <span className="text-xs uppercase tracking-[0.2em] text-white/70">%</span>
      </div>
    </div>
  );
}

export default ProgressRing;
