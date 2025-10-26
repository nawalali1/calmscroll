"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type Intention = {
  id: string;
  user_id: string;
  text: string;
  status: "active" | "done" | "snoozed";
  snooze_until: string | null;
  created_at: string;
  updated_at: string;
};

export function useIntentions() {
  const [intention, setIntention] = useState<Intention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const fetchActiveIntention = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        setIntention(null);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("intentions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (queryError) throw queryError;
      setIntention(data);
    } catch (err) {
      console.error("Error fetching active intention:", err);
      setError(err instanceof Error ? err.message : "Failed to load intention");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const createIntention = useCallback(
    async (text: string): Promise<Intention | null> => {
      try {
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) throw new Error("Please sign in to set an intention.");

        // Mark any existing active intentions as done
        await supabase
          .from("intentions")
          .update({ status: "done", updated_at: new Date().toISOString() })
          .eq("user_id", session.user.id)
          .eq("status", "active");

        // Create new intention
        const { data, error: insertError } = await supabase
          .from("intentions")
          .insert({
            user_id: session.user.id,
            text,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setIntention(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create intention";
        setError(message);
        throw err;
      }
    },
    [supabase]
  );

  const markAsDone = useCallback(
    async (intentionId: string): Promise<void> => {
      try {
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) throw new Error("Please sign in to update intention.");

        const { error: updateError } = await supabase
          .from("intentions")
          .update({
            status: "done",
            updated_at: new Date().toISOString(),
          })
          .eq("id", intentionId)
          .eq("user_id", session.user.id);

        if (updateError) throw updateError;

        setIntention(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update intention";
        setError(message);
        throw err;
      }
    },
    [supabase]
  );

  const snoozeIntention = useCallback(
    async (intentionId: string, minutes: number): Promise<void> => {
      try {
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) throw new Error("Please sign in to snooze intention.");

        const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();

        const { error: updateError } = await supabase
          .from("intentions")
          .update({
            status: "snoozed",
            snooze_until: snoozeUntil,
            updated_at: new Date().toISOString(),
          })
          .eq("id", intentionId)
          .eq("user_id", session.user.id);

        if (updateError) throw updateError;

        setIntention(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to snooze intention";
        setError(message);
        throw err;
      }
    },
    [supabase]
  );

  useEffect(() => {
    void fetchActiveIntention();
  }, [fetchActiveIntention]);

  return {
    intention,
    loading,
    error,
    createIntention,
    markAsDone,
    snoozeIntention,
    refetch: fetchActiveIntention,
  };
}
