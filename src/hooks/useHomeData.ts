"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserProfile = {
  display_name?: string | null;
};

type MetricsRow = {
  mood_score?: number | null;
};

export function useHomeData() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setUserProfile(null);
        setDailyProgress(0);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const today = new Date().toISOString().split("T")[0];
      const { data: metrics, error: metricsError } = await supabase
        .from("metrics")
        .select("mood_score")
        .eq("user_id", session.user.id)
        .eq("date_key", today)
        .maybeSingle<MetricsRow>();
      if (metricsError) throw metricsError;

      setUserProfile(profile ?? null);
      const progress = metrics?.mood_score ? (metrics.mood_score / 5) * 100 : 0;
      setDailyProgress(progress);
    } catch (error) {
      console.error("Error fetching home data:", error);
      setUserProfile(null);
      setDailyProgress(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHomeData();
  }, [fetchHomeData]);

  return { userProfile, dailyProgress, loading, refetch: fetchHomeData };
}

export default useHomeData;
