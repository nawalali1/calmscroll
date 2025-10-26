'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

type User = {
  id: string;
  display_name: string | null;
  email?: string;
};

export function useUser() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authUser) throw new Error('Not authenticated');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        setUser({
          id: authUser.id,
          display_name: profile?.display_name || authUser.email?.split('@')[0] || 'Friend',
          email: authUser.email,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [supabase]);

  return { user, loading, error };
}