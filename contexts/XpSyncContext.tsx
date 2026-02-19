import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

const PENDING_XP_KEY = 'pharmalingo_pending_xp_events';
const MAX_XP_PER_EVENT = 99;

export interface PendingXpEvent {
  eventId: string;
  xp: number;
  source: string;
  createdAt: string;
}

function generateUUID(): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8];
    } else {
      uuid += hex[(Math.random() * 16) | 0];
    }
  }
  return uuid;
}

export const [XpSyncProvider, useXpSync] = createContextHook(() => {
  const { session } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<PendingXpEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const syncingRef = useRef<boolean>(false);
  const loadedRef = useRef<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(PENDING_XP_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PendingXpEvent[];
          console.log(`[XpSync] Loaded ${parsed.length} pending events from storage`);
          setPendingEvents(parsed);
        }
        loadedRef.current = true;
      } catch (err) {
        console.log('[XpSync] Failed to load pending events:', err);
        loadedRef.current = true;
      }
    };
    load();
  }, []);

  const savePending = useCallback(async (events: PendingXpEvent[]) => {
    try {
      await AsyncStorage.setItem(PENDING_XP_KEY, JSON.stringify(events));
    } catch (err) {
      console.log('[XpSync] Failed to save pending events:', err);
    }
  }, []);

  const flushQueue = useCallback(async (events: PendingXpEvent[]) => {
    if (!session || events.length === 0 || syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    console.log(`[XpSync] Flushing ${events.length} pending XP events`);

    const remaining: PendingXpEvent[] = [];

    for (const event of events) {
      if (event.xp <= 0) {
        console.warn(`[XpSync] Dropping invalid queued xp event: eventId=${event.eventId}, xp=${event.xp}`);
        continue;
      }
      const clampedXp = Math.min(Math.max(1, Math.round(event.xp)), MAX_XP_PER_EVENT);
      try {
        console.log('[XpSync] sending xpToSync=', clampedXp, '(original:', event.xp, ') source=', event.source, 'eventId=', event.eventId);
        const { error } = await supabase.rpc('log_xp', {
          p_xp: clampedXp,
          p_source: event.source,
        });

        if (error) {
          console.log(`[XpSync] Failed to sync event ${event.eventId}:`, error.message);
          remaining.push(event);
        } else {
          console.log(`[XpSync] Synced event ${event.eventId} (+${event.xp} XP)`);
        }
      } catch (err) {
        console.log(`[XpSync] Network error syncing event ${event.eventId}:`, err);
        remaining.push(event);
      }
    }

    setPendingEvents(remaining);
    await savePending(remaining);
    syncingRef.current = false;
    setIsSyncing(false);
    console.log(`[XpSync] Flush complete. ${remaining.length} events still pending`);
  }, [session, savePending]);

  useEffect(() => {
    if (loadedRef.current && session && pendingEvents.length > 0 && !syncingRef.current) {
      const timeout = setTimeout(() => {
        flushQueue(pendingEvents);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [session, pendingEvents, flushQueue]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && session && pendingEvents.length > 0 && !syncingRef.current) {
        console.log('[XpSync] App became active, retrying pending events');
        flushQueue(pendingEvents);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [session, pendingEvents, flushQueue]);

  const logXpEvent = useCallback(async (xp: number, source: string = 'lesson_complete') => {
    const eventId = generateUUID();
    const newEvent: PendingXpEvent = {
      eventId,
      xp,
      source,
      createdAt: new Date().toISOString(),
    };

    console.log(`[XpSync] Queuing XP event: ${eventId}, +${xp} XP, source=${source}`);

    if (xp <= 0) {
      console.warn(`[XpSync] Dropping invalid queued xp event: eventId=${eventId}, xp=${xp}`);
      return;
    }

    const clampedXp = Math.min(Math.max(1, Math.round(xp)), MAX_XP_PER_EVENT);
    const updated = [...pendingEvents, newEvent];
    setPendingEvents(updated);
    await savePending(updated);

    if (session) {
      try {
        console.log('[XpSync] sending xpToSync=', clampedXp, '(original:', xp, ') source=', source);
        const { error } = await supabase.rpc('log_xp', {
          p_xp: clampedXp,
          p_source: source,
        });

        if (error) {
          console.error(`[XpSync] log_xp RPC failed:`, JSON.stringify(error, null, 2));
          setLastError(JSON.stringify(error, null, 2));
        } else {
          console.log(`[XpSync] log_xp success: +${xp} XP, source=${source}`);
          const afterSuccess = updated.filter(e => e.eventId !== eventId);
          setPendingEvents(afterSuccess);
          await savePending(afterSuccess);
          return;
        }
      } catch (err: any) {
        console.error(`[XpSync] log_xp network error:`, err);
        setLastError(err?.message ?? String(err));
      }
    }

    if (!syncingRef.current && updated.length > 0) {
      setTimeout(() => {
        flushQueue(updated);
      }, 500);
    }
  }, [pendingEvents, session, savePending, flushQueue]);

  return {
    logXpEvent,
    pendingCount: pendingEvents.length,
    isSyncing,
    lastError,
  };
});
