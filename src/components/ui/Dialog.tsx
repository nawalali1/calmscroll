"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
};

const dialogVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.21, 0.72, 0.42, 1] },
  },
  exit: { y: 8, opacity: 0, transition: { duration: 0.2 } },
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close dialog"
            className="fixed inset-0 z-40 bg-black/45"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "dialog-title" : undefined}
            aria-describedby={description ? "dialog-description" : undefined}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
          >
            <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-lg">
              {title ? (
                <h2 id="dialog-title" className="text-lg font-semibold text-[var(--ink)]">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id="dialog-description" className="mt-1 text-sm text-[var(--ink-muted)]">
                  {description}
                </p>
              ) : null}
              <div className="mt-4 text-sm text-[var(--ink)]">{children}</div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-full border border-[var(--card-border)] bg-transparent py-3 text-sm font-semibold text-[var(--ink-muted)] transition hover:bg-white/70"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className="flex-1 rounded-full bg-[var(--danger)] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export default Dialog;
