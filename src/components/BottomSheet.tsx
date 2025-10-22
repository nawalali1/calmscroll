"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
};

export function BottomSheet({ open, onClose, title, description, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    restoreFocusRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab" && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 px-4 pb-6" role="dialog" aria-modal="true">
      <button
        aria-label="Close sheet"
        className="absolute inset-0 cursor-default"
        type="button"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-md rounded-t-3xl bg-white p-6 text-slate-900 shadow-2xl transition-transform duration-200 ease-out dark:bg-neutral-900 dark:text-white"
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300 dark:bg-white/20" aria-hidden />
        {title ? <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2> : null}
        {description ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default BottomSheet;
