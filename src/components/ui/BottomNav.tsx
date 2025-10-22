"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { type LucideIcon, Home, NotebookPen, Activity, Settings2 } from "lucide-react";
import cn from "classnames";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/tracker", label: "Tracker", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none fixed inset-x-0 bottom-2 z-40 flex justify-center px-4"
    >
      <div className="pointer-events-auto relative w-full max-w-[420px] rounded-[2rem] border border-white/30 bg-[rgba(255,255,255,0.4)] px-4 py-2 backdrop-blur-[12px] shadow-[0_28px_60px_-28px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[rgba(20,20,20,0.5)]">
        <ul className="flex items-center justify-between gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="flex flex-1 justify-center">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex w-full flex-col items-center gap-1 rounded-[1.5rem] px-3 py-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C6EF5]/80",
                    isActive
                      ? "text-[#4C6EF5] dark:text-[#8ca8ff]"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="bottom-nav-highlight"
                      className="absolute inset-x-1 inset-y-0 -z-10 rounded-[1.25rem] bg-white/90 shadow-sm dark:bg-[#4C6EF5]/20"
                      transition={{ type: "spring", stiffness: 250, damping: 25 }}
                    />
                  ) : null}
                  <Icon className="h-7 w-7" aria-hidden />
                  <span className="text-[11px] tracking-wide">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[-0.5rem] h-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
          aria-hidden
        />
      </div>
    </nav>
  );
}

export default BottomNav;
