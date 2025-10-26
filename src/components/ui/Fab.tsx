"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Plus } from "lucide-react";
import cn from "classnames";

export type FabProps = HTMLMotionProps<"button"> & {
  isOpen?: boolean;
};

export const Fab = forwardRef<HTMLButtonElement, FabProps>(function Fab(
  { className, isOpen = false, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex h-14 w-14 items-center justify-center rounded-full border text-white shadow-lg backdrop-blur-xl transition",
        "border-[var(--card-border)] bg-[linear-gradient(135deg,var(--bg-start),var(--bg-end))]",
        "hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      <Plus className={cn("h-6 w-6 transition-transform duration-200", isOpen ? "rotate-45" : "")} aria-hidden />
    </motion.button>
  );
});

export default Fab;
