"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const pathname = usePathname();

  const onAuthRoute = pathname?.startsWith("/auth");
  const gradientBackground = {
    backgroundImage: "linear-gradient(160deg,var(--bg-start) 0%,var(--bg-mid) 55%,var(--bg-end) 100%)",
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-theme-gradient text-[var(--ink)] transition-colors" style={gradientBackground}>
        <div className="text-sm text-[var(--ink-muted)]">Loading…</div>
      </div>
    );
  }

  if (!session && onAuthRoute) {
    // allow auth pages
    return <>{children}</>;
  }

  return (
    <div className="min-h-svh bg-theme-gradient py-10 text-[var(--ink)] transition-colors" style={gradientBackground}>
      <main className="mx-auto flex w-full max-w-[460px] justify-center px-4">{children}</main>
    </div>
  );
}

export default AppShell;
