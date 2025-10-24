"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const PUBLIC_PATHS = ["/login", "/auth", "/signup", "/register"];

const isPublicPath = (pathname: string | null) => {
  if (!pathname) return false;
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        const publicRoute = isPublicPath(pathname);

        if (!session && !publicRoute) {
          setLoading(true);
          router.replace("/login");
        } else if (session && publicRoute) {
          setLoading(true);
          router.replace("/");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (active) setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!active) return;

      const publicRoute = isPublicPath(pathname);

      if (!session && !publicRoute) {
        setLoading(true);
        router.replace("/login");
      } else if (session && publicRoute) {
        setLoading(true);
        router.replace("/");
      } else {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-500 border-b-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
