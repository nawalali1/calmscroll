"use client";

import { useEffect, useState } from "react";

export type Status = "loading" | "authenticated" | "unauthenticated";

type Session = { user: { id: string } } | null;

export function useSession() {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    const read = () => {
      const authed =
        typeof window !== "undefined" && window.localStorage.getItem("calmscroll_session") === "1";
      return authed ? "authenticated" : "unauthenticated";
    };

    const statusNow = read();
    setStatus(statusNow);
    setSession(statusNow === "authenticated" ? { user: { id: "local" } } : null);

    const onStorage = (event: StorageEvent) => {
      if (event.key === "calmscroll_session") {
        const nextStatus = read();
        setStatus(nextStatus);
        setSession(nextStatus === "authenticated" ? { user: { id: "local" } } : null);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { status, session, loading: status === "loading" };
}

export default useSession;
