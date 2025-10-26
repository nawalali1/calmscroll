"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "calmscroll-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      document.documentElement.setAttribute("data-theme", nextTheme);
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
  }, []);

  const loadThemeFromDatabase = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.theme) {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          const dbTheme = profile.theme === "system" ? (prefersDark ? "dark" : "light") : profile.theme;
          applyTheme(dbTheme as Theme);
          return;
        }
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    } catch (error) {
      console.error("Error loading theme from database:", error);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }, [applyTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // First try to get theme from localStorage
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;

    // If no theme in localStorage, try to get from database
    if (!stored) {
      void loadThemeFromDatabase();
    } else {
      applyTheme(stored);
    }
  }, [applyTheme, loadThemeFromDatabase]);

  const setTheme = async (nextTheme: Theme) => {
    applyTheme(nextTheme);
    
    // Also save to database if user is logged in
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase.from("profiles").upsert({
          id: session.user.id,
          theme: nextTheme,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error saving theme to database:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
