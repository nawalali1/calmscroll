"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

type AppProvidersProps = {
  children: ReactNode;
};

focusManager.setEventListener((handleFocus) => {
  if (typeof window === "undefined") return () => undefined;

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      handleFocus();
    }
  };

  window.addEventListener("visibilitychange", onVisibility, false);
  window.addEventListener("focus", handleFocus, false);

  return () => {
    window.removeEventListener("visibilitychange", onVisibility, false);
    window.removeEventListener("focus", handleFocus, false);
  };
});

export function AppProviders({ children }: AppProvidersProps) {
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 30,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
