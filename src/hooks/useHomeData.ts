"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type HomeFeedItem = {
  id: string;
  day_key: string;
  kind: "quote" | "breath" | "task" | "reflection" | null;
  content: string;
  created_at: string;
  title: string;
  action: string | null;
};

export type FavoriteFeedItem = {
  id: string;
  title: string;
  content: string;
  kind: string | null;
  created_at: string | null;
  action: string | null;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  theme: string | null;
};

export type MoodStreak = {
  current_streak: number;
  last_check_in_date: string | null;
  total_check_ins: number;
};

export type RecentReflection = {
  id: string;
  content: string;
  created_at: string;
  mood: string | null;
  title: string | null;
};

const generateTitle = (kind: string | null, content: string): string => {
  if (kind === "quote") return "Daily Wisdom";
  if (kind === "breath") return "Breathing Exercise";
  if (kind === "task") return "Mindful Task";
  if (kind === "reflection") return "Reflection Prompt";
  return content.length > 40 ? `${content.substring(0, 40)}...` : content;
};

const generateAction = (kind: string | null): string | null => {
  if (kind === "breath") return "/tracker/breathe";
  if (kind === "task") return "/tracker/task";
  if (kind === "reflection") return "/notes/new?type=reflection";
  return null;
};

export function useHomeData() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [feedItems, setFeedItems] = useState<HomeFeedItem[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteFeedItem[]>([]);
  const [moodStreak, setMoodStreak] = useState<MoodStreak>({
    current_streak: 0,
    last_check_in_date: null,
    total_check_ins: 0,
  });
  const [recentReflections, setRecentReflections] = useState<RecentReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Please sign in to view your personalized feed.");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      setUserProfile(profile);

      const today = new Date().toISOString().split("T")[0]?.replace(/-/g, "");
      const { data: metrics } = await supabase
        .from("metrics")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("date_key", today)
        .maybeSingle();

      const tasksCompleted = metrics?.tasks_done || 0;
      const cardsRead = metrics?.cards_read || 0;
      const totalActions = tasksCompleted + cardsRead;
      const progressPercent = Math.min(Math.round((totalActions / 10) * 100), 100);
      setDailyProgress(progressPercent);

      const { data: feed, error: feedError } = await supabase
        .from("feed_items")
        .select("*")
        .eq("day_key", today)
        .order("created_at", { ascending: true });

      if (feedError) throw feedError;

      const transformedFeed: HomeFeedItem[] = (feed || []).map((item) => ({
        ...item,
        title: generateTitle(item.kind, item.content),
        action: generateAction(item.kind),
      }));

      setFeedItems(transformedFeed);

      const { data: favorites } = await supabase
        .from("favorites")
        .select("feed_item_id")
        .eq("user_id", session.user.id)
        .is("deleted_at", null);

      const favoriteIds = (favorites || []).map((f) => f.feed_item_id);
      setUserFavorites(favoriteIds);

      if (favoriteIds.length > 0) {
        const { data: favItems } = await supabase
          .from("feed_items")
          .select("*")
          .in("id", favoriteIds);

        const transformedFavorites: FavoriteFeedItem[] = (favItems || []).map((item) => ({
          id: item.id,
          title: generateTitle(item.kind, item.content),
          content: item.content,
          kind: item.kind,
          created_at: item.created_at,
          action: generateAction(item.kind),
        }));

        setFavoriteItems(transformedFavorites);
      }

      // Fetch mood streak data
      const { data: streakData } = await supabase
        .from("mood_check_ins")
        .select("created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (streakData && streakData.length > 0) {
        const dates = streakData.map((item) => new Date(item.created_at).toDateString());
        const uniqueDates = [...new Set(dates)];
        const today = new Date().toDateString();

        let streak = 0;
        let lastCheckInDate = null;

        for (const date of uniqueDates) {
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - streak);

          if (date === expectedDate.toDateString()) {
            streak++;
            if (streak === 1) lastCheckInDate = date;
          } else {
            break;
          }
        }

        setMoodStreak({
          current_streak: streak,
          last_check_in_date: lastCheckInDate,
          total_check_ins: uniqueDates.length,
        });
      }

      // Fetch recent reflections
      const { data: reflections } = await supabase
        .from("notes")
        .select("id, content, created_at, mood, title")
        .eq("user_id", session.user.id)
        .eq("kind", "reflection")
        .order("created_at", { ascending: false })
        .limit(3);

      if (reflections) {
        setRecentReflections(reflections as RecentReflection[]);
      }

    } catch (err) {
      console.error("Error fetching home data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    void fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void fetchData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    userProfile,
    dailyProgress,
    feedItems,
    userFavorites,
    favoriteItems,
    moodStreak,
    recentReflections,
    loading,
    error,
    refetch: fetchData,
  };
}
