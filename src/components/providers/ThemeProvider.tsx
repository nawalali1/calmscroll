"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "calmscroll_theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    return getSystemTheme();
  }
  return preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load stored preference
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const initialPreference: ThemePreference = stored ?? "system";

    // Apply initial theme
    applyThemeToDOM(resolveTheme(initialPreference));
    setThemePreference(initialPreference);
    setResolvedTheme(resolveTheme(initialPreference));

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentPreference = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if ((currentPreference ?? "system") === "system") {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
        applyThemeToDOM(newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const applyThemeToDOM = (resolved: ResolvedTheme) => {
    if (typeof document === "undefined") return;

    // Update data attribute
    document.documentElement.dataset.theme = resolved;

    // Add or remove the 'dark' class that Tailwind uses
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const applyTheme = (preference: ThemePreference) => {
    setThemePreference(preference);
    const resolved = resolveTheme(preference);
    setResolvedTheme(resolved);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, preference);
    }

    applyThemeToDOM(resolved);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "light" ? "dark" : "light";
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
        setTheme: applyTheme,
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
