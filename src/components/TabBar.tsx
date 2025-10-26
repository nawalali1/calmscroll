"use client";
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, NotebookPen, LineChart, Settings } from "lucide-react";
import cn from "classnames";
import { useMemo } from "react";

type TabInfo = {
  href: string;
  label: string;
  Icon: typeof Home;
};

const tabs: TabInfo[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/notes", label: "Notes", Icon: NotebookPen },
  { href: "/tracker", label: "Tracker", Icon: LineChart },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function TabBar() {
  const pathname = usePathname();

  const activeIndex = useMemo(
    () => tabs.findIndex((tab) => (tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href))),
    [pathname]
  );

  return (
    <nav aria-label="Primary navigation" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
      <div className="pointer-events-auto w-full max-w-[420px] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-center justify-between gap-2 rounded-3xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] shadow-md transition">
          {tabs.map(({ href, label, Icon }, index) => {
            const active = index === activeIndex;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-2xl px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                  active ? "bg-[var(--card)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-muted)] hover:bg-[var(--card)]/70"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("h-5 w-5", active ? "text-[var(--ink)]" : "text-[var(--ink-muted)]")}
                  aria-hidden
                />
                <span className="mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
