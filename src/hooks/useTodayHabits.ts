"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "./useSession";
import type { HabitItem, HabitStatus } from "@/components/home/types";
import { BellRing, Bike, BookOpen, Footprints, LucideIcon, Moon, Sparkles } from "lucide-react";

type TaskRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  due_at?: string | null;
  kind?: string | null;
};

const statusMap: Record<string, HabitStatus> = {
  completed: "Completed",
  complete: "Completed",
  done: "Completed",
  pending: "Pending",
  todo: "Pending",
  active: "Pending",
  missed: "Missed",
  skipped: "Missed",
  failed: "Missed",
};

const iconMatchers: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /sleep|rest/i, icon: Moon },
  { test: /walk|step/i, icon: Footprints },
  { test: /cycle|bike/i, icon: Bike },
  { test: /read|book/i, icon: BookOpen },
  { test: /stretch|yoga|calm|meditat/i, icon: Sparkles },
];

const todayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

const formatTime = (value?: string | null) => {
  if (!value) return "--:--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--:--";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const resolveStatus = (status?: string | null): HabitStatus => {
  if (!status) return "Pending";
  return statusMap[status.toLowerCase()] ?? "Pending";
};

const resolveIcon = (title?: string | null, kind?: string | null): LucideIcon => {
  const source = [kind, title].filter(Boolean).join(" ");
  const match = iconMatchers.find(({ test }) => test.test(source));
  return match?.icon ?? BellRing;
};

export function useTodayHabits() {
  const { session } = useSession();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["tasks", "today", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) throw new Error("User not ready");
      const { start, end } = todayRange();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, status, due_at, kind")
        .eq("user_id", userId)
        .gte("due_at", start)
        .lte("due_at", end)
        .order("due_at", { ascending: true });

      if (error) return [];

      const rows = (data ?? []) as TaskRow[];

      return rows.map<HabitItem>((item) => ({
        id: item.id,
        title: item.title ?? item.description ?? "Untitled habit",
        status: resolveStatus(item.status),
        time: formatTime(item.due_at),
        icon: resolveIcon(item.title, item.kind),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  const items = useMemo(() => query.data ?? [], [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export default useTodayHabits;
