'use client';

import { useCallback, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import type { Tables } from '@/lib/supabase/database.types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

function profileToUser(profile: Tables<'profiles'>): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
  };
}

export function useAuth(): AuthState {
  const [state, setState] = useState<Omit<AuthState, 'refresh'>>({
    user: null,
    isLoading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setState({ user: null, isLoading: false, error: null });
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          setState({ user: null, isLoading: false, error: profileError.message });
          return;
        }

        setState({
          user: profileToUser(data as Tables<'profiles'>),
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setState({ user: null, isLoading: false, error: (err as Error).message });
      }
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [tick]);

  return { ...state, refresh };
}
