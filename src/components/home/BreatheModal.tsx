"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Sheet from "@/components/ui/Sheet";
import Button from "@/components/ui/Button";

const TOTAL_SECONDS = 60;

type BreatheModalProps = {
  open: boolean;
  onClose: () => void;
};

export function BreatheModal({ open, onClose }: BreatheModalProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      setIsRunning(false);
      return;
    }
    setElapsed(0);
    setIsRunning(false);
  }, [open]);

  useEffect(() => {
    if (!isRunning) return;
    const startedAt = Date.now() - elapsed * 1000;
    const interval = window.setInterval(() => {
      const diff = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(Math.min(diff, TOTAL_SECONDS));
    }, 250);
    return () => window.clearInterval(interval);
  }, [elapsed, isRunning]);

  const progress = useMemo(() => elapsed / TOTAL_SECONDS, [elapsed]);
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);

  useEffect(() => {
    if (elapsed >= TOTAL_SECONDS && open) {
      setIsRunning(false);
      const timeout = window.setTimeout(onClose, 1200);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [elapsed, open, onClose]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (1 - progress);

  return (
    <Sheet
      open={open}
      onClose={() => {
        setIsRunning(false);
        onClose();
      }}
      title="One-minute breathe"
      description="Inhale gently for four counts, hold for four, exhale for four."
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              className="text-[var(--card-border)]"
              fill="transparent"
            />
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#grad)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
              initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 0.25 }}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-ink)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">Remaining</span>
            <span className="text-3xl font-semibold text-[var(--ink)]">{remaining}s</span>
          </div>
        </div>
        {elapsed >= TOTAL_SECONDS ? (
          <div className="rounded-2xl bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]">
            Complete — notice how you feel.
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">
            Follow the rhythm: inhale, hold, exhale, pause.
          </p>
        )}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className={`flex-1 transition ${
              isRunning
                ? "border border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent)]/10"
                : "bg-[var(--accent)] text-white hover:brightness-110"
            }`}
            onClick={() => setIsRunning((prev) => !prev)}
          >
            {isRunning ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
          </Button>
          <Button
            type="button"
            className="flex-1 border border-[var(--accent)]/20 bg-white/80 text-[var(--accent-ink)] hover:bg-white"
            onClick={() => {
              setIsRunning(false);
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

export default BreatheModal;
