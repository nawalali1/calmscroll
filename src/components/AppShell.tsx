"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import TabBar from "@/components/TabBar";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const onAuthRoute = pathname?.startsWith("/auth");

  useEffect(() => {
    if (!loading && !session && !onAuthRoute) {
      router.replace("/auth");
    }
  }, [loading, session, onAuthRoute, router]);

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

  if (!session) {
    // guard in case redirect has not fired yet
    return null;
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-transparent">
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col gap-6 px-4 pt-6 pb-24">
        {children}
      </main>
      <TabBar />
    </div>
  );
}

export default AppShell;
