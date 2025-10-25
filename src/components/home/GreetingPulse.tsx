"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { TOAST_DURATIONS } from "@/config/timings";

const variants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.8, 0.25, 1] as [number, number, number, number] },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

type GreetingPulseProps = {
  firstName: string;
  open: boolean;
  onDismiss: () => void;
};

export function GreetingPulse({ firstName, open, onDismiss }: GreetingPulseProps) {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(onDismiss, TOAST_DURATIONS.GREETING);
    return () => window.clearTimeout(timeout);
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          className="pointer-events-auto"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex items-center gap-3 rounded-full border border-[var(--card-border)] bg-white/70 px-4 py-2 shadow-md backdrop-blur-sm">
            <span className="text-sm font-semibold text-[var(--ink)]">
              Welcome back, {firstName}
            </span>
            <Button
              type="button"
              aria-label="Dismiss welcome message"
              className="h-7 w-7 min-h-[28px] rounded-full border border-transparent bg-transparent p-0 text-[var(--ink-muted)] hover:bg-white/70"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default GreetingPulse;
