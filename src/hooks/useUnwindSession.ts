'use client';

import { getSupabaseClient } from '@/lib/supabase/client';

export function useUnwindSession() {
  const supabase = getSupabaseClient();

  const createBreathSession = async (duration: number, completed: boolean) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('breath_sessions')
        .insert({
          user_id: user.id,
          duration_seconds: duration,
          completed: completed,
          started_at: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : null,
        });

      if (error) throw error;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create breath session');
    }
  };

  return { createBreathSession };
}