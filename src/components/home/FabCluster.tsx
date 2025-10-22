"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, PlusCircle, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import cn from "classnames";

const miniActions = [
  {
    id: "add-habit",
    label: "Add habit",
    icon: PlusCircle,
    href: "/tracker",
    offset: { x: -68, y: -74 },
  },
  {
    id: "quick-note",
    label: "Quick note",
    icon: Pencil,
    href: "/notes",
    offset: { x: 68, y: -74 },
  },
];

export function FabCluster() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleAction = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center">
      <div className="pointer-events-auto relative mb-[calc(env(safe-area-inset-bottom)+6rem)]">
        <AnimatePresence>
          {open
            ? miniActions.map(({ id, label, icon: Icon, href, offset }) => (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => handleAction(href)}
                  className="absolute flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-[var(--blue-hero-b)] shadow-md transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-hero-c)]"
                  style={{ left: "50%", top: 0 }}
                  aria-label={label}
                  initial={reducedMotion ? undefined : { opacity: 0, scale: 0.6, x: 0, y: 0 }}
                  animate={reducedMotion ? undefined : { opacity: 1, scale: 1, x: offset.x, y: offset.y }}
                  exit={reducedMotion ? undefined : { opacity: 0, scale: 0.75, x: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                  <span className="sr-only">{label}</span>
                </motion.button>
              ))
            : null}
        </AnimatePresence>

        <button
          type="button"
          className={cn(
            "flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            "bg-[#2B5EFF] hover:bg-[#1F4ED8]"
          )}
          style={{ left: "50%", bottom: 0, position: "absolute" }}
          onClick={toggle}
          aria-label="Create"
          aria-expanded={open}
        >
          <Plus className={cn("h-6 w-6 transition-transform", open ? "rotate-45" : "")} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default FabCluster;
