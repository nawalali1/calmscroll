"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOAST_DURATIONS } from "@/config/timings";
import { TOAST_CONFIG } from "@/config/ui";

type ToastStatus = "default" | "success" | "error";

export type ToastOptions = {
  title: string;
  description?: string;
  status?: ToastStatus;
  duration?: number;
};

type ToastState = ToastOptions & { id: string };

type ToastContextValue = {
  notify: (options: ToastOptions) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastColors: Record<ToastStatus, string> = {
  default: "bg-white text-[var(--ink)] border border-[var(--card-border)]",
  success: "bg-emerald-500 text-white",
  error: "bg-[var(--danger)] text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ duration = TOAST_DURATIONS.DEFAULT, status = "default", ...rest }: ToastOptions) => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const toast: ToastState = { id, status, duration, ...rest };
      setToasts((current) => [toast, ...current].slice(0, TOAST_CONFIG.MAX_VISIBLE));
      window.setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const value = useMemo(() => ({ notify, remove }), [notify, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-28 left-0 right-0 z-[60] flex justify-center px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto mb-3 w-full max-w-sm rounded-[var(--radius-md)] px-4 py-3 shadow-sm ${toastColors[toast.status ?? "default"]}`}
              role="status"
              aria-live="polite"
            >
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description ? (
                <p className="mt-1 text-xs text-white/80">{toast.description}</p>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export default ToastProvider;
