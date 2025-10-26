"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type ReminderSettings = {
  id: string;
  user_id: string;
  nudges_enabled: boolean;
  nudge_after_seconds: number;
  created_at: string;
  updated_at: string;
};

const DEFAULT_REMINDER_SETTINGS: Omit<ReminderSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  nudges_enabled: true,
  nudge_after_seconds: 300, // 5 minutes default
};

export function useReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        setSettings(null);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("reminder_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (queryError) throw queryError;

      // If no settings exist, create default ones
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("reminder_settings")
          .insert({
            user_id: session.user.id,
            ...DEFAULT_REMINDER_SETTINGS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error("Error fetching reminder settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load reminder settings");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const updateSettings = useCallback(
    async (updates: Partial<Pick<ReminderSettings, "nudges_enabled" | "nudge_after_seconds">>): Promise<void> => {
      try {
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) throw new Error("Please sign in to update reminder settings.");

        const { data, error: updateError } = await supabase
          .from("reminder_settings")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", session.user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setSettings(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update reminder settings";
        setError(message);
        throw err;
      }
    },
    [supabase]
  );

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}
