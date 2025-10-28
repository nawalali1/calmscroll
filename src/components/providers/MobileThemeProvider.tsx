'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface MobileThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const MobileThemeContext = createContext<MobileThemeContextType | null>(null);

const THEME_KEY = 'calmscroll-mobile-theme';

export function MobileThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <MobileThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </MobileThemeContext.Provider>
  );
}

export function useMobileTheme() {
  const context = useContext(MobileThemeContext);
  if (!context) {
    return { theme: 'light' as Theme, setTheme: () => {} };
  }
  return context;
}
