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
      <div className="pointer-events-auto relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-xl shadow-[0_20px_40px_-28px_rgba(11,59,100,0.9)]">
        <ul className="flex items-center justify-between gap-1 text-xs font-medium text-white/75">
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
                    "relative inline-flex w-full flex-col items-center gap-1 rounded-[1.5rem] px-3 py-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80",
                    isActive ? "text-white" : "text-white/70 hover:text-white"
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="bottom-nav-highlight"
                      className="absolute inset-x-1 inset-y-0 -z-10 rounded-[1.25rem] bg-white/20"
                      transition={{ type: "spring", stiffness: 250, damping: 25 }}
                    />
                  ) : null}
                  <Icon className="h-5 w-5" aria-hidden />
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
