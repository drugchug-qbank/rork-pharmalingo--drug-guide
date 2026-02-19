import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

export type StreakStatusRow = {
  streak_current: number;
  streak_longest: number;
  streak_last_day: string | null;
  status: 'extended' | 'at_risk' | 'lost';
  seconds_left: number;
  deadline_at: string; // ISO
};

function normalizeStreakRpc(data: any): StreakStatusRow | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    streak_current: Number(row.streak_current ?? 0),
    streak_longest: Number(row.streak_longest ?? 0),
    streak_last_day: row.streak_last_day ?? null,
    status: (row.status ?? 'lost') as 'extended' | 'at_risk' | 'lost',
    seconds_left: Number(row.seconds_left ?? 0),
    deadline_at: String(row.deadline_at ?? ''),
  };
}

/**
 * Shared streak hook (single source of truth in the app)
 *
 * - Reads from Supabase RPC: get_my_streak_status()
 * - Shares cache across screens via React Query
 * - Provides an "effectiveStreak" (0 if lost)
 */
export function useStreakStatus(options?: { enabled?: boolean; invalidateOnAppActive?: boolean }) {
  const enabled = options?.enabled ?? true;
  const invalidateOnAppActive = options?.invalidateOnAppActive ?? true;

  const queryClient = useQueryClient();

  const q = useQuery<StreakStatusRow | null>({
    queryKey: ['streak', 'status'],
    enabled,
    staleTime: 10_000,
    refetchOnMount: 'always',
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_streak_status');
      if (error) throw error;
      return normalizeStreakRpc(data);
    },
  });

  useEffect(() => {
    if (!invalidateOnAppActive) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        queryClient.invalidateQueries({ queryKey: ['streak'] });
      }
    });
    return () => sub.remove();
  }, [invalidateOnAppActive, queryClient]);

  const effectiveStreak = useMemo(() => {
    const row = q.data;
    if (!row) return 0;
    return row.status === 'lost' ? 0 : row.streak_current;
  }, [q.data]);

  return {
    ...q,
    streak: q.data,
    effectiveStreak,
  };
}
