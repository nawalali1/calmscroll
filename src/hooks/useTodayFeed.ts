"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "./useSession";
import { getSupabaseClient } from "@/lib/supabase/client";
import { seedFeedItems } from "@/lib/seed";
import { todayKey } from "@/utils/dates";
import { logger, logEvent } from "@/utils/logger";

export type FeedPreviewItem = {
  id: string;
  kind: string;
  title: string;
  content: string;
  action?: string | null;
  created_at: string;
  isFavorite: boolean;
};

const MIN_FEED_COUNT = 3;
const MAX_FEED_COUNT = 3;

function shuffle<T>(array: readonly T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

async function seedFeed(dayKey: string, count: number) {
  const supabase = getSupabaseClient();
  if (count <= 0) return;
  const seeds = shuffle(seedFeedItems)
    .slice(0, Math.min(count, MAX_FEED_COUNT))
    .map((seed, index) => ({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${dayKey}-${index}`,
      day_key: dayKey,
      kind: seed.kind,
      title: seed.title,
      content: seed.content,
      action: seed.action ?? null,
      source: "seed",
      created_at: new Date(Date.now() - index * 60000).toISOString(),
    }));

  const { error } = await supabase.from("feed_items").insert(
    seeds.map((seed) => ({ ...seed, source: "seed" }))
  );
  if (error) {
    logger.warn("Seed insert failed, retrying without source column", { error: String(error) });
    const { error: fallback } = await supabase.from("feed_items").insert(seeds);
    if (fallback) {
      logger.error("Failed seeding feed items", { error: String(fallback) });
      throw fallback;
    }
  }
}

async function fetchTodayFeed(userId: string, dayKey: string): Promise<FeedPreviewItem[]> {
  const supabase = getSupabaseClient();
  const feedQuery = supabase
    .from("feed_items")
    .select("id, kind, title, content, action, created_at", { count: "exact" })
    .eq("day_key", dayKey)
    .order("created_at", { ascending: true })
    .limit(MAX_FEED_COUNT);

  const { data, error, count } = await feedQuery;
  if (error) {
    logger.error("Failed to fetch feed items", {
      error,
      code: error.code,
      status: (error as { status?: number }).status,
      message: error.message,
    });
    throw error;
  }

  const items = data ?? [];

  if ((count ?? 0) < MIN_FEED_COUNT) {
    const existing = count ?? 0;
    const toSeed = Math.max(0, MIN_FEED_COUNT - existing);
    await seedFeed(dayKey, toSeed);
    return fetchTodayFeed(userId, dayKey);
  }

  if (items.length === 0) {
    return [];
  }

  const ids = items.map((item) => item.id);

  if (ids.length === 0) return [];

  const { data: favoritesData, error: favoritesError } = await supabase
    .from("favorites")
    .select("feed_id")
    .eq("user_id", userId)
    .in("feed_id", ids);

  if (favoritesError) {
    logger.error("Failed to fetch favorites", { error: favoritesError, code: favoritesError.code });
    throw favoritesError;
  }

  const favoriteIds = new Set(favoritesData?.map((fav) => fav.feed_id) ?? []);

  return items.map((item) => ({
    ...item,
    isFavorite: favoriteIds.has(item.id),
  }));
}

export function useTodayFeed(dayKey: string = todayKey()) {
  const supabase = getSupabaseClient();
  const { session } = useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = ["feed", "today", userId, dayKey];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) throw new Error("User not available");
      return fetchTodayFeed(userId, dayKey);
    },
    enabled: Boolean(userId),
  });

  const toggleFavorite = useMutation({
    mutationFn: async (input: { id: string; isFavorite: boolean }) => {
      if (!userId) throw new Error("User not available");
      if (input.isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("feed_id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .upsert({ user_id: userId, feed_id: input.id }, { onConflict: "user_id,feed_id" });
        if (error) throw error;
      }
      logEvent("card_favorite_toggle", { id: input.id, active: !input.isFavorite });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FeedPreviewItem[]>(queryKey);
      queryClient.setQueryData<FeedPreviewItem[]>(queryKey, (prev) =>
        prev?.map((item) => (item.id === input.id ? { ...item, isFavorite: !input.isFavorite } : item)) ?? prev
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    toggleFavorite: (id: string, isFavorite: boolean) => toggleFavorite.mutateAsync({ id, isFavorite }),
  };
}
