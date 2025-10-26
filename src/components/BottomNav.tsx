"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/notes", label: "Notes" },
  { href: "/tracker", label: "Tracker" },
  { href: "/settings", label: "Settings" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] px-4 pb-4">
      <div className="glass rounded-2xl px-3 py-2">
        <ul className="grid grid-cols-4">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} className="text-center">
                <Link
                  href={item.href}
                  className={`block py-2 text-sm transition ${
                    active ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
