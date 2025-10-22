"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import TabBar from "@/components/TabBar";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading, status } = useSession();
  const pathname = usePathname();

  const onAuthRoute = pathname?.startsWith("/auth");

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!session && onAuthRoute) {
    // allow auth pages
    return <>{children}</>;
  }

  // Allow pages to render even if not authenticated; components should handle status gracefully.

  return (
    <div className="relative flex min-h-svh flex-col bg-transparent">
      <div
        data-auth-debug
        className="pointer-events-none fixed right-3 top-3 z-50 rounded-md bg-slate-900/60 px-3 py-1 text-xs font-semibold text-white"
      >
        status: {status}
      </div>
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col gap-6 px-4 pt-6 pb-24">
        {children}
      </main>
      <TabBar />
    </div>
  );
}

export default AppShell;
