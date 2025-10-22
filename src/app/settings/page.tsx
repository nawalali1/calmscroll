"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";

type Theme = "light" | "dark";

const THEME_KEY = "calmscroll-theme";

export default function SettingsPage() {
  const router = useRouter();
  const { session } = useSession();
  const [theme, setTheme] = useState<Theme>("light");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const email = session?.user.email ?? "Unknown user";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
    } else {
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.replace("/auth");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/90 p-6 shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tune CalmScroll to match your mood and comfort.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Theme</p>
              <p className="text-xs text-slate-500">
                {theme === "light" ? "Soft pastel glow" : "Midnight calm"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              onClick={toggleTheme}
              className={`flex h-10 w-20 items-center rounded-full px-1 transition ${
                theme === "dark" ? "bg-indigo-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`h-8 w-8 rounded-full bg-white shadow transition ${
                  theme === "dark" ? "translate-x-10" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/80 p-6 shadow-md backdrop-blur">
        <p className="text-sm font-medium text-slate-500">
          Signed in as <span className="font-semibold text-slate-700">{email}</span>
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-6 w-full rounded-2xl bg-rose-500 py-3 text-base font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-400 disabled:opacity-70"
        >
          {isSigningOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </section>
  );
}
