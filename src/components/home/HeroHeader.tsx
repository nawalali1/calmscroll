"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";

type HeroHeaderProps = {
  firstName?: string | null;
  onReflect?: () => void;
};

export function HeroHeader({ firstName, onReflect }: HeroHeaderProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const safeName = firstName?.trim() ? firstName.trim() : "there";

  useEffect(() => {
    // Preload notes route for snappier navigation.
    router.prefetch?.("/notes");
  }, [router]);

  const handleReflect = () => {
    if (onReflect) onReflect();
    else router.push("/notes");
  };

  return (
    <motion.section
      className="mx-auto max-w-md px-4"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.72, 0.42, 1] }}
    >
      <div className="space-y-2 rounded-xl border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Hello, {safeName}</h1>
        <h2 className="text-sm text-[var(--ink-muted)]">How do you feel about your current emotions?</h2>
        <button
          type="button"
          onClick={handleReflect}
          className="inline-flex w-full items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-sm text-[var(--ink-muted)] shadow-[0_1px_0_rgba(15,23,42,0.05)] transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white cursor-text"
          aria-label="Open notes to reflect on your emotions"
        >
          Your reflection.
        </button>
      </div>
    </motion.section>
  );
}

export default HeroHeader;
