import { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/utils/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  school_id: string | null;
  school_name: string | null;
  profession_id: number | null;
  created_at: string;
}

function looksLikeEmail(value: string | null | undefined): boolean {
  const v = (value ?? '').trim();
  if (!v) return false;
  // Simple + safe: if it contains "@" we treat it as email-like.
  // We never want emails in username/display_name.
  return v.includes('@');
}

function isValidPublicUsername(value: string | null | undefined): boolean {
  const v = (value ?? '').trim();
  if (!v) return false;
  if (looksLikeEmail(v)) return false;

  // Basic sanity
  if (/\s/.test(v)) return false;
  if (!/^[A-Za-z0-9_.]+$/.test(v)) return false;
  if (v.length < 3 || v.length > 20) return false;

  return true;
}

function normalizeUsername(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;

  const noAt = raw.startsWith('@') ? raw.slice(1) : raw;
  const normalized = noAt.trim().toLowerCase();

  if (!normalized) return null;
  if (looksLikeEmail(normalized)) return null;

  return normalized;
}

function normalizeDisplayName(input: string | null | undefined): string | null {
  const v = (input ?? '').trim();
  if (!v) return null;
  // Never store email-looking strings as display names
  if (looksLikeEmail(v)) return null;
  return v;
}

function isProfileIncomplete(p: UserProfile | null): boolean {
  if (!p) return true;
  // Require a real username (NOT an email)
  if (!isValidPublicUsername(p.username)) return true;
  // Also treat email-like display_name as incomplete (force user to fix)
  if (looksLikeEmail(p.display_name)) return true;

  // ✅ Profession is required for leaderboards + monthly Profession Battle
  if (p.profession_id == null) return true;

  return false;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsProfile, setNeedsProfile] = useState<boolean>(false);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    console.log('[Auth] Fetching profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('[Auth] Profile fetch error:', error.message);
        if (error.code === 'PGRST116') {
          return null;
        }
        return null;
      }
      console.log('[Auth] Profile fetched:', data?.display_name);
      return data as UserProfile;
    } catch (err) {
      console.log('[Auth] Profile fetch exception:', err);
      return null;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    console.log('[Auth] Initializing auth...');
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        console.warn('[Auth] Supabase URL not configured, skipping auth init');
        setIsLoading(false);
        return;
      }

      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.log('[Auth] Session fetch error:', sessionError.message);
        if (
          sessionError.message?.includes('Refresh Token') ||
          sessionError.message?.includes('Invalid Refresh Token') ||
          sessionError.message?.includes('token is expired')
        ) {
          console.log('[Auth] Invalid refresh token detected, clearing session...');
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch (_e) {
            console.log('[Auth] Local signout cleanup error (ignored)');
          }
          setSession(null);
          setUser(null);
          setProfile(null);
          setNeedsProfile(false);
        }
        setIsLoading(false);
        return;
      }

      console.log('[Auth] Current session:', currentSession ? 'exists' : 'none');

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        const userProfile = await fetchProfile(currentSession.user.id);
        if (userProfile) setProfile(userProfile);

        // ✅ A profile is only "complete" if it has a real username (NOT an email)
        setNeedsProfile(isProfileIncomplete(userProfile));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError' || message.includes('signal is aborted')) {
        console.log('[Auth] Init aborted (signal cancelled), ignoring');
      } else {
        console.log('[Auth] Init error:', message);
        if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
          console.warn('[Auth] Network error during init — check Supabase URL and connectivity');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    initializeAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('[Auth] Auth state changed:', event);

        if (event === 'TOKEN_REFRESHED' && !newSession) {
          console.log('[Auth] Token refresh failed, signing out...');
          setSession(null);
          setUser(null);
          setProfile(null);
          setNeedsProfile(false);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);

          try {
            const userProfile = await fetchProfile(newSession.user.id);
            if (userProfile) setProfile(userProfile);
            setNeedsProfile(isProfileIncomplete(userProfile));
          } catch (err) {
            console.log('[Auth] Profile fetch in state change failed:', err);
            setNeedsProfile(true);
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setNeedsProfile(false);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      });
      subscription = data.subscription;
    } catch (err) {
      console.log('[Auth] Failed to set up auth listener:', err);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [initializeAuth, fetchProfile]);

  const signUp = useCallback(async (email: string, password: string): Promise<{ needsConfirmation: boolean }> => {
    console.log('[Auth] Signing up:', email);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.log('[Auth] Sign up error:', error.message);
      throw error;
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      setNeedsProfile(true);
      return { needsConfirmation: false };
    }

    return { needsConfirmation: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] Signing in:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.log('[Auth] Sign in error:', error.message);
      throw error;
    }

    setSession(data.session);
    setUser(data.user);

    const userProfile = await fetchProfile(data.user.id);
    if (userProfile) setProfile(userProfile);
    setNeedsProfile(isProfileIncomplete(userProfile));
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out');
    setSession(null);
    setUser(null);
    setProfile(null);
    setNeedsProfile(false);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.log('[Auth] Sign out error (ignored):', err);
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log('[Auth] Global sign out error (ignored):', err);
    }
  }, []);

  const completeProfile = useCallback(async (displayName: string, username: string | null, schoolName: string | null) => {
    if (!user) throw new Error('No user logged in');
    console.log('[Auth] Completing profile for:', user.id);

    const usernameNorm = normalizeUsername(username);
    if (!isValidPublicUsername(usernameNorm)) {
      throw new Error('Please choose a valid username (3–20 chars: letters, numbers, _ or .).');
    }

    const displayNameNorm = normalizeDisplayName(displayName) ?? usernameNorm;

    const profileData = {
      id: user.id,
      display_name: displayNameNorm,
      username: usernameNorm,
      school_name: schoolName || null,
    };

    console.log('[Auth] Profile data to save:', JSON.stringify(profileData));
    console.log('[Auth] Using upsert to save profile...');

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.log('[Auth] Profile save error:', error.message, error.details, error.hint, error.code);

      // Friendly message for duplicate username (unique constraint)
      if (error.code === '23505') {
        throw new Error('That username is already taken. Try another.');
      }

      throw new Error(error.message || 'Failed to save profile');
    }

    console.log('[Auth] Profile saved response:', JSON.stringify(data));

    const savedProfile: UserProfile = {
      id: user.id,
      display_name: (data as any)?.display_name ?? displayNameNorm,
      username: (data as any)?.username ?? usernameNorm,
      school_id: (data as any)?.school_id ?? null,
      school_name: (data as any)?.school_name ?? (schoolName ?? null),
      profession_id: (data as any)?.profession_id ?? null,
      created_at: (data as any)?.created_at ?? new Date().toISOString(),
    };

    setProfile(savedProfile);
    setNeedsProfile(isProfileIncomplete(savedProfile));
    console.log('[Auth] Profile completed successfully');
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const userProfile = await fetchProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
      setNeedsProfile(isProfileIncomplete(userProfile));
    }
  }, [user, fetchProfile]);

  const isAuthenticated = !!session && !!user;
  const isProfileComplete = !!profile && !needsProfile;
  const userId = user?.id ?? null;

  return {
    session,
    user,
    profile,
    userId,
    isLoading,
    isAuthenticated,
    isProfileComplete,
    needsProfile,
    signUp,
    signIn,
    signOut,
    completeProfile,
    refreshProfile,
  };
});
