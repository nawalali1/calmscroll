"use client";

import { useEffect, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
};

export default function BottomSheet({ open, onClose, title, description, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px]
                   rounded-t-2xl bg-white/80 backdrop-blur-md dark:bg-neutral-900/70
                   p-4 pb-6 shadow-[0_-8px_30px_rgba(0,0,0,0.2)]"
      >
        {title ? <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3> : null}
        {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
        <div className="mt-3 space-y-3">{children}</div>
      </div>
    </div>
  );
}
