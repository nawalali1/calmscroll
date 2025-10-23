"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
};

const sheetVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.21, 0.72, 0.42, 1] as [number, number, number, number] },
  },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.2 } },
};

export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close sheet"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "sheet-title" : undefined}
            aria-describedby={description ? "sheet-description" : undefined}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[2rem] border border-[var(--card-border)] bg-white p-6 shadow-lg"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[var(--card-border)]" />
            {title ? (
              <h2 id="sheet-title" className="text-lg font-semibold text-[var(--ink)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id="sheet-description" className="mt-1 text-sm text-[var(--ink-muted)]">
                {description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export default Sheet;
