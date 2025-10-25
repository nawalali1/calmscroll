"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/utils/logger";
import { seedFeedItems } from "@/lib/seed";
import { toDayKey } from "@/utils/dates";

type FeedItem = {
  id: string;
  day_key: string;
  kind: string;
  title: string;
  content: string;
  action?: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
  favorites?: { id: string }[];
};

type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

const PAGE_SIZE = 15;
const MIN_ITEMS = 15;

async function fetchFeedPage(dayKey: string, cursor?: string | null): Promise<FeedPage> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("feed_items")
    .select("id, day_key, kind, title, content, action, created_at, metadata, favorites(id)", {
      count: "exact",
    })
    .eq("day_key", dayKey)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error, count } = await query;
  if (error) {
    logger.error("Failed to fetch feed items", { error: String(error) });
    throw error;
  }

  if (!cursor && (count ?? 0) < MIN_ITEMS) {
    await seedFeedIfNeeded(dayKey, count ?? 0);
    return fetchFeedPage(dayKey, cursor);
  }

  const items = data ?? [];
  return {
    items,
    nextCursor: items.length === PAGE_SIZE ? items[items.length - 1]?.created_at ?? null : null,
  };
}

async function seedFeedIfNeeded(dayKey: string, existingCount: number) {
  const supabase = getSupabaseClient();
  const missing = MIN_ITEMS - existingCount;
  if (missing <= 0) return;

  const now = new Date();
  const payload = seedFeedItems.slice(0, missing).map((seed, index) => ({
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${dayKey}-${index}`,
    day_key: dayKey,
    kind: seed.kind,
    title: seed.title,
    content: seed.content,
    action: seed.action ?? null,
    created_at: new Date(now.getTime() - index * 60000).toISOString(),
  }));

  const { error } = await supabase.from("feed_items").insert(payload);
  if (error) {
    logger.warn("Failed to seed feed items; falling back to client-only seeds", {
      error: String(error),
    });
  }
}

export function useFeed(dayKey?: string) {
  const supabase = getSupabaseClient();
  const key = dayKey ?? toDayKey(new Date());

  const query = useInfiniteQuery({
    queryKey: ["feed", key],
    queryFn: ({ pageParam }) => fetchFeedPage(key, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationKey: ["feed", "favorite"],
    mutationFn: async (feedId: string) => {
      const { error } = await supabase.from("favorites").upsert({ feed_id: feedId });
      if (error) throw error;
      logger.info("Favorited feed item", { feedId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed", key] });
    },
  });

  const markReadMutation = useMutation({
    mutationKey: ["feed", "mark-read"],
    mutationFn: async (feedId: string) => {
      const { error } = await supabase
        .from("metrics")
        .upsert({ feed_id: feedId, cards_read: 1 }, { onConflict: "feed_id" });
      if (error) throw error;
      logger.debug("Marked feed card as read", { feedId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed", key] });
    },
  });

  return {
    ...query,
    favorite: favoriteMutation.mutateAsync,
    markAsRead: markReadMutation.mutateAsync,
  };
}
