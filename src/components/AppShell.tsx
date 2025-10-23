"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
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

  return (
    <div className="min-h-svh bg-[#F3F6FB] py-10">
      <main className="mx-auto flex w-full max-w-[460px] justify-center px-4">{children}</main>
    </div>
  );
}

export default AppShell;
