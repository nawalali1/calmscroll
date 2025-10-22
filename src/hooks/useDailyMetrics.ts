"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "./useSession";
import { ensureTodayMetrics, incrementCardsRead, MetricsRow } from "@/lib/metrics";
import { todayKey } from "@/utils/dates";
import { logEvent, logger } from "@/utils/logger";

type UseDailyMetricsResult = {
  metrics: MetricsRow | null;
  isLoading: boolean;
  error: unknown;
  markCardRead: (feed: { id: string; kind?: string }) => Promise<void>;
  refetch: () => Promise<MetricsRow | null>;
};

export function useDailyMetrics(dayKey: string = todayKey()): UseDailyMetricsResult {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const queryClient = useQueryClient();

  const queryKey = ["metrics", "daily", userId, dayKey];

  const { data, isLoading, refetch, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) throw new Error("User not available");
      try {
        return await ensureTodayMetrics(userId, dayKey);
      } catch (err) {
        const maybe = err as { status?: number; message?: string };
        logger.error("Failed to fetch metrics row", {
          error: err,
          status: maybe?.status,
          message: maybe?.message,
        });
        throw err;
      }
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (userId) {
      logEvent("home_open", { dayKey });
    }
  }, [userId, dayKey]);

  const markCardReadMutation = useMutation({
    mutationFn: async (feed: { id: string; kind?: string }) => {
      if (!userId) throw new Error("User not available");
      await incrementCardsRead(userId, dayKey);
      logEvent("card_read", { id: feed.id, kind: feed.kind, dayKey });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MetricsRow | null>(queryKey);
      queryClient.setQueryData<MetricsRow | null>(queryKey, (prev) =>
        prev
          ? {
              ...prev,
              cards_read: (prev.cards_read ?? 0) + 1,
            }
          : prev
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      const maybe = error as { status?: number; message?: string };
      logger.error("Failed to update cards_read", {
        error,
        status: maybe?.status,
        message: maybe?.message,
      });
      queryClient.setQueryData(queryKey, context?.previous ?? null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    metrics: data ?? null,
    isLoading,
    error,
    markCardRead: markCardReadMutation.mutateAsync,
    refetch: () => refetch().then((res) => res.data ?? null),
  };
}
