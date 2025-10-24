"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ensureTodayMetrics, MetricsRow, updateMetrics } from "@/lib/metrics";
import { todayKey } from "@/utils/dates";

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

type HomeProfile = {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
};

export type HomeFeedItem = {
  id: string;
  title: string;
  content: string;
  kind?: string | null;
  action?: string | null;
  created_at: string;
  isFavorite: boolean;
};

export type FavoriteItem = {
  id: string;
  feed_id: string;
  title: string;
  kind: string;
  content: string;
  created_at: string | null;
};

type HomeState = {
  userProfile: HomeProfile | null;
  metrics: MetricsRow | null;
  dailyProgress: number;
  feedItems: HomeFeedItem[];
  favorites: FavoriteItem[];
  loading: boolean;
  error: string | null;
};

const initialState: HomeState = {
  userProfile: null,
  metrics: null,
  dailyProgress: 0,
  feedItems: [],
  favorites: [],
  loading: true,
  error: null,
};

function deriveProgress(metrics: MetricsRow | null): number {
  if (!metrics) return 0;
  const tasks = metrics.tasks_done ?? 0;
  const cards = metrics.cards_read ?? 0;
  const minutes = metrics.minutes_read ?? 0;

  // A simple blended score: tasks and cards weigh more, minutes gives a lighter contribution.
  const score = tasks * 25 + cards * 15 + Math.min(minutes, 20) * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function useHomeExperience() {
  const [state, setState] = useState<HomeState>(initialState);
  const sessionRef = useRef<Session | null>(null);
  const metricsRef = useRef<MetricsRow | null>(null);
  const dayKey = useMemo(() => todayKey(), []);

  const hydrateMetrics = useCallback(
    async (userId: string): Promise<MetricsRow | null> => {
      try {
        const row = await ensureTodayMetrics(userId, dayKey);
        metricsRef.current = row;
        setState((prev) => ({
          ...prev,
          metrics: row,
          dailyProgress: deriveProgress(row),
        }));
        return row;
      } catch (err) {
        console.error("Error ensuring metrics row:", err);
        return null;
      }
    },
    [dayKey]
  );

  const fetchHomeData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        sessionRef.current = null;
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      sessionRef.current = session;
      const userId = session.user.id;

      const profilePromise = supabase
        .from("profiles")
        .select("id, display_name, full_name, first_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      const feedPromise = supabase
        .from("feed_items")
        .select("id, title, content, kind, action, created_at")
        .eq("day_key", dayKey)
        .order("created_at", { ascending: false })
        .limit(10);

      const favoritesPromise = supabase
        .from("favorites")
        .select("id, feed_id, created_at, feed_items:feed_items(id, title, kind, content, created_at)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const [profileResult, feedResult, favoritesResult] = await Promise.all([
        profilePromise,
        feedPromise,
        favoritesPromise,
      ]);

      if (profileResult.error) throw profileResult.error;
      if (feedResult.error) throw feedResult.error;
      if (favoritesResult.error) throw favoritesResult.error;

      const metricsRow = await hydrateMetrics(userId);
      const favoriteIds = new Set<string>(
        (favoritesResult.data ?? [])
          .map((fav) => {
            const rawFeed = Array.isArray(fav.feed_items) ? fav.feed_items[0] : fav.feed_items;
            return rawFeed?.id ? String(rawFeed.id) : null;
          })
          .filter((id): id is string => Boolean(id))
      );

      const feedItems: HomeFeedItem[] = (feedResult.data ?? []).map((item) => ({
        id: String(item.id),
        title: String(item.title ?? ""),
        content: String(item.content ?? ""),
        kind: item.kind ?? null,
        action: item.action ?? null,
        created_at: item.created_at ?? "",
        isFavorite: favoriteIds.has(String(item.id)),
      }));

      const favoriteEntries: FavoriteItem[] = (favoritesResult.data ?? [])
        .map((fav) => {
          const rawFeed = Array.isArray(fav.feed_items) ? fav.feed_items[0] : fav.feed_items;
          if (!rawFeed) return null;

          return {
            id: String(fav.id),
            feed_id: String(rawFeed.id ?? ""),
            title: String(rawFeed.title ?? ""),
            kind: String(rawFeed.kind ?? "Favorite"),
            content: String(rawFeed.content ?? ""),
            created_at: rawFeed.created_at ?? null,
          };
        })
        .filter((entry): entry is FavoriteItem => Boolean(entry));

      setState((prev) => ({
        ...prev,
        userProfile: profileResult.data ?? null,
        feedItems,
        favorites: favoriteEntries,
        metrics: metricsRow,
        dailyProgress: deriveProgress(metricsRow),
        loading: false,
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load home data";
      console.error("Error fetching home data:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [dayKey, hydrateMetrics]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const applyMetricsDelta = useCallback(
    async (patcher: (current: MetricsRow) => Partial<Pick<MetricsRow, "cards_read" | "tasks_done" | "minutes_read">>) => {
      const session = sessionRef.current;
      if (!session) return null;

      const userId = session.user.id;
      const base = metricsRef.current ?? (await hydrateMetrics(userId));
      if (!base) return null;

      const patch = patcher(base);
      try {
        const next = await updateMetrics(userId, dayKey, patch);
        metricsRef.current = next;
        setState((prev) => ({
          ...prev,
          metrics: next,
          dailyProgress: deriveProgress(next),
        }));
        return next;
      } catch (error) {
        console.error("Failed to update metrics:", error);
        throw error;
      }
    },
    [dayKey, hydrateMetrics]
  );

  const logQuickAction = useCallback(
    async (actionId: string) => {
      await applyMetricsDelta((current) => ({
        tasks_done: (current.tasks_done ?? 0) + 1,
      }));
      console.info("Logged quick action", { actionId });
    },
    [applyMetricsDelta]
  );

  const logActivityStart = useCallback(
    async (feedId: string) => {
      await applyMetricsDelta((current) => ({
        cards_read: (current.cards_read ?? 0) + 1,
      }));
      console.info("Logged activity start", { feedId });
    },
    [applyMetricsDelta]
  );

  const toggleFavorite = useCallback(
    async (feedId: string, item?: HomeFeedItem) => {
      const session = sessionRef.current;
      if (!session) return;
      const userId = session.user.id;
      const isFavorited = state.favorites.some((favorite) => favorite.feed_id === feedId);

      try {
        if (isFavorited) {
          await supabase.from("favorites").delete().eq("user_id", userId).eq("feed_id", feedId);
          setState((prev) => ({
            ...prev,
            favorites: prev.favorites.filter((fav) => fav.feed_id !== feedId),
            feedItems: prev.feedItems.map((feed) =>
              feed.id === feedId ? { ...feed, isFavorite: false } : feed
            ),
          }));
        } else {
          const { data, error } = await supabase
            .from("favorites")
            .insert({ user_id: userId, feed_id: feedId })
            .select("id, feed_id, created_at, feed_items:feed_items(id, title, kind, content, created_at)")
            .single();

          if (error) throw error;

          const rawFeed = data && "feed_items" in data ? (data.feed_items as unknown) : null;
          const normalizedFeed =
            rawFeed && Array.isArray(rawFeed) ? rawFeed[0] ?? null : (rawFeed as Record<string, unknown> | null);

          const favoriteEntry: FavoriteItem | null = normalizedFeed
            ? {
                id: String(data.id),
                feed_id: String(feedId),
                title: String((normalizedFeed?.title as string | undefined) ?? item?.title ?? ""),
                kind: String((normalizedFeed?.kind as string | undefined) ?? item?.kind ?? "Favorite"),
                content: String((normalizedFeed?.content as string | undefined) ?? item?.content ?? ""),
                created_at: (normalizedFeed?.created_at as string | undefined) ?? data.created_at ?? null,
              }
            : item
            ? {
                id: String(data.id),
                feed_id: String(feedId),
                title: item.title,
                kind: item.kind ?? "Favorite",
                content: item.content,
                created_at: item.created_at ?? null,
              }
            : null;

          setState((prev) => ({
            ...prev,
            favorites: favoriteEntry ? [favoriteEntry, ...prev.favorites] : prev.favorites,
            feedItems: prev.feedItems.map((feed) =>
              feed.id === feedId ? { ...feed, isFavorite: true } : feed
            ),
          }));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update favorites";
        console.error("Failed to toggle favorite:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [state.favorites]
  );

  return {
    userProfile: state.userProfile,
    dailyProgress: state.dailyProgress,
    feedItems: state.feedItems,
    favorites: state.favorites,
    loading: state.loading,
    error: state.error,
    refetch: fetchHomeData,
    logQuickAction,
    logActivityStart,
    toggleFavorite,
  };
}

export default useHomeExperience;
