"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import cn from "classnames";

type QuickActionPillProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  className?: string;
};

export function QuickActionPill({ icon, label, onClick, onKeyDown, className }: QuickActionPillProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "group inline-flex min-h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition",
        "hover:border-white/55 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        "active:scale-[0.98]",
        className
      )}
      whileTap={{ scale: 0.97 }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white" aria-hidden>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>
    </motion.button>
  );
}

export default QuickActionPill;
