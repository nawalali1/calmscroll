"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

type GreetingToastProps = {
  firstName: string;
  open: boolean;
  onDismiss: () => void;
};

const variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.21, 0.72, 0.42, 1] },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export function GreetingToast({ firstName, open, onDismiss }: GreetingToastProps) {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(onDismiss, 2500);
    return () => window.clearTimeout(timeout);
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-auto"
        >
          <div className="mx-auto w-full max-w-[320px] rounded-3xl border border-[var(--card-border)] bg-white px-5 py-4 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 text-left">
                <p className="text-sm font-semibold text-[var(--ink-muted)]">Welcome back</p>
                <p className="text-lg font-semibold text-[var(--ink)]">{firstName}</p>
                <p className="text-xs text-[var(--ink-muted)]">A calm space to reset and move with intention.</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Dismiss greeting"
                className="min-h-[32px] p-0 text-[var(--ink-muted)]"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export default GreetingToast;
