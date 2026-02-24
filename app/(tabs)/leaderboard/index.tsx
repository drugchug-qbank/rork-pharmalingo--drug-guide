import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
  ActivityIndicator,
  AppState,
  TextInput,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Trophy,
  Users,
  Crown,
  ChevronRight,
  GraduationCap,
  Shield,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  UserPlus,
  XCircle,
  CheckCircle2,
  Trash2,
  Briefcase,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useProgress } from '@/contexts/ProgressContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { LeagueTier } from '@/constants/types';
import XPComparisonGraph from '@/components/XPComparisonGraph';
import MascotAnimated from '@/components/MascotAnimated';
import LeagueWeekResultsModal from '@/components/LeagueResultsModal';
import ProfessionLeaderboardTab from '@/components/ProfessionLeaderboardTab';
import StreakFlameIcon from '@/components/StreakFlameIcon';
import XPIcon from '@/components/XPIcon';

interface LeagueRow {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  xp_this_week: number;
  level: number;
  streak: number;
  rank: number;
  is_me: boolean;
}

interface SchoolRow {
  school_id: string;
  school_name: string;
  total_weekly_xp: number;
  member_count: number;
  rank: number;
  is_user_school: boolean;
}

interface FriendRow {
  friend_user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  weekly_xp: number;
  streak: number;
  mutual_count?: number; // optional for backward compatibility
}


interface FriendRequestRow {
  request_id: string;
  direction: 'incoming' | 'outgoing';
  friend_user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}


interface SearchUserRow {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  relationship:
    | 'none'
    | 'already_friends'
    | 'outgoing_pending'
    | 'incoming_pending'
    | 'blocked'
    | 'declined'
    | string;
}

const TIER_CONFIG: Record<
  LeagueTier,
  { color: string; bg: string; emoji: string; gradient: [string, string] }
> = {
  Bronze: { color: '#CD7F32', bg: '#FDF2E9', emoji: '🥉', gradient: ['#CD7F32', '#A0522D'] },
  Silver: { color: '#9CA3AF', bg: '#F3F4F6', emoji: '🥈', gradient: ['#C0C0C0', '#9CA3AF'] },
  Gold: { color: '#F59E0B', bg: '#FFFBEB', emoji: '🥇', gradient: ['#FFD700', '#F59E0B'] },
};

type Tab = 'league' | 'friends' | 'school' | 'profession';

function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}


function normalizeHandle(input: string): string {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  const noAt = raw.startsWith('@') ? raw.slice(1) : raw;
  return noAt.trim().toLowerCase();
}


export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress, leagueRank, leagueWeekResult, dismissLeagueResult } = useProgress();
  const { session, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<Tab>('league');

  // Pull-to-refresh
  const [pullRefreshing, setPullRefreshing] = useState(false);

  // Friends state
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [addUsername, setAddUsername] = useState<string>('');
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [searchSendingUsername, setSearchSendingUsername] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const normalizedSearchInput = useMemo(() => normalizeHandle(addUsername), [addUsername]);

  // Debounce search to avoid spamming Supabase on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(normalizedSearchInput), 250);
    return () => clearTimeout(t);
  }, [normalizedSearchInput]);


  const contentFade = useRef(new Animated.Value(1)).current;
  const [weekCountdown, setWeekCountdown] = useState<string>('');
  const [daysLeft, setDaysLeft] = useState<number>(7);
  const urgencyPulse = useRef(new Animated.Value(1)).current;

  // Countdown (to next Monday 00:00 local time)
  useEffect(() => {
    const calcCountdown = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      setDaysLeft(daysUntilMonday);

      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + daysUntilMonday);
      endOfWeek.setHours(0, 0, 0, 0);

      const diff = endOfWeek.getTime() - now.getTime();
      if (diff <= 0) {
        setWeekCountdown('Ends soon!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours >= 24) {
        const d = Math.floor(hours / 24);
        const h = hours % 24;
        setWeekCountdown(`${d}d ${h}h ${minutes}m`);
      } else {
        setWeekCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    calcCountdown();
    const timer = setInterval(calcCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (daysLeft <= 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(urgencyPulse, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(urgencyPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [daysLeft, urgencyPulse]);

  // Refresh queries when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        queryClient.invalidateQueries({ queryKey: ['profession'] });
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  // Refresh when the Leaderboard tab/screen becomes focused (user returns from Learn/Practice/etc.)
  useEffect(() => {
    if (!isFocused || !session) return;
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['profession'] });
  }, [isFocused, session, queryClient]);

  // ---------------------------
  // League Query
  // ---------------------------
  const leagueQuery = useQuery<LeagueRow[]>({
    queryKey: ['leaderboard', 'league'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_league_leaderboard');
      if (error) throw error;

      const rows = (data ?? []).map((row: any) => {
        const xpValue = Number(row.xp_this_week ?? row.weekly_xp ?? row.xp ?? 0);
        return {
          user_id: row.user_id ?? row.id ?? '',
          display_name: row.display_name ?? row.username ?? 'Unknown',
          avatar_emoji: row.avatar_emoji ?? row.avatar ?? '👤',
          xp_this_week: isNaN(xpValue) ? 0 : xpValue,
          level: Number(row.level ?? row.lvl ?? 1),
          streak: Number(row.streak ?? row.current_streak ?? row.streak_days ?? 0),
          rank: Number(row.rank ?? row.position ?? 0),
          is_me: row.is_me ?? row.is_current_user ?? false,
        } as LeagueRow;
      });

      return rows;
    },
    enabled: !!session && isFocused && activeTab === 'league',
    staleTime: 30_000,
    refetchOnMount: 'always' as const,
    refetchInterval: isFocused && activeTab === 'league' ? 12_000 : false,
    retry: 2,
  });

  // ---------------------------
  // School Query
  // ---------------------------
  const schoolQuery = useQuery<SchoolRow[]>({
    queryKey: ['leaderboard', 'school'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_school_leaderboard');
      if (error) throw error;

      const rows = (data ?? []).map((row: any) => {
        const xpValue = Number(row.total_weekly_xp ?? row.weekly_xp ?? row.total_xp ?? row.xp ?? 0);
        return {
          school_id: row.school_id ?? row.id ?? '',
          school_name: row.school_name ?? row.name ?? 'Unknown School',
          total_weekly_xp: isNaN(xpValue) ? 0 : xpValue,
          member_count: Number(row.member_count ?? row.members ?? row.num_members ?? 0),
          rank: Number(row.rank ?? row.position ?? 0),
          is_user_school: row.is_user_school ?? row.is_my_school ?? false,
        } as SchoolRow;
      });

      return rows;
    },
    enabled: !!session && isFocused && activeTab === 'school',
    staleTime: 30_000,
    refetchOnMount: 'always' as const,
    refetchInterval: isFocused && activeTab === 'school' ? 20_000 : false,
    retry: 2,
  });

  // ---------------------------
  // Friends Queries
  // ---------------------------

  const searchUsersQuery = useQuery<SearchUserRow[]>({
    queryKey: ['friends', 'search', debouncedSearch],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_users', { p_query: debouncedSearch });
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      return rows.map((r: any) => ({
        user_id: String(r.user_id),
        username: String(r.username ?? ''),
        display_name: r.display_name ?? null,
        avatar_url: r.avatar_url ?? null,
        relationship: String(r.relationship ?? 'none'),
      })) as SearchUserRow[];
    },
    enabled: !!session && isFocused && activeTab === 'friends' && debouncedSearch.length >= 2,
    staleTime: 5_000,
    refetchOnMount: 'always' as const,
    retry: 0,
  });

  const friendsQuery = useQuery<FriendRow[]>({
    queryKey: ['friends', 'list'],
    queryFn: async () => {
      // Prefer v2 (includes mutual_count). Fallback to v1 if not deployed yet.
      const v2 = await supabase.rpc('get_my_friends_v2');
      if (!v2.error) {
        const rows = Array.isArray(v2.data) ? v2.data : [];
        return rows.map((r: any) => ({
          friend_user_id: String(r.friend_user_id),
          username: String(r.username ?? ''),
          display_name: String(r.display_name ?? r.username ?? 'Friend'),
          avatar_url: r.avatar_url ?? null,
          weekly_xp: safeNum(r.weekly_xp),
          streak: safeNum(r.streak),
          mutual_count: safeNum(r.mutual_count),
        })) as FriendRow[];
      }

      // v1 fallback
      const v1 = await supabase.rpc('get_my_friends');
      if (v1.error) throw v1.error;

      const rows = Array.isArray(v1.data) ? v1.data : [];
      return rows.map((r: any) => ({
        friend_user_id: String(r.friend_user_id),
        username: String(r.username ?? ''),
        display_name: String(r.display_name ?? r.username ?? 'Friend'),
        avatar_url: r.avatar_url ?? null,
        weekly_xp: safeNum(r.weekly_xp),
        streak: safeNum(r.streak),
        mutual_count: 0,
      })) as FriendRow[];
    },
    enabled: !!session && isFocused && activeTab === 'friends',
    staleTime: 15_000,
    refetchOnMount: 'always' as const,
    refetchInterval: isFocused && activeTab === 'friends' ? 15_000 : false,
    retry: 1,
  });

  const friendRequestsQuery = useQuery<FriendRequestRow[]>({
    queryKey: ['friends', 'requests'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_friend_requests');
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        request_id: String(r.request_id),
        direction: (r.direction ?? 'incoming') as 'incoming' | 'outgoing',
        friend_user_id: String(r.friend_user_id),
        username: String(r.username ?? ''),
        display_name: String(r.display_name ?? r.username ?? 'User'),
        avatar_url: r.avatar_url ?? null,
        created_at: String(r.created_at ?? ''),
      })) as FriendRequestRow[];
    },
    enabled: !!session && isFocused && activeTab === 'friends',
    staleTime: 10_000,
    refetchOnMount: 'always' as const,
    refetchInterval: isFocused && activeTab === 'friends' ? 15_000 : false,
    retry: 1,
  });

  const handlePullRefresh = useCallback(async () => {
    if (!session) return;
    setPullRefreshing(true);
    try {
      if (activeTab === 'league') {
        await leagueQuery.refetch();
      } else if (activeTab === 'school') {
        await schoolQuery.refetch();
      } else if (activeTab === 'friends') {
        await Promise.all([friendsQuery.refetch(), friendRequestsQuery.refetch()]);
      } else if (activeTab === 'profession') {
        // Profession tab lives in a child component; invalidating this key triggers it to refresh.
        await queryClient.invalidateQueries({ queryKey: ['profession'] });
      }
    } finally {
      setPullRefreshing(false);
    }
  }, [session, activeTab, leagueQuery, schoolQuery, friendsQuery, friendRequestsQuery, queryClient]);

  const incomingRequests = useMemo(
    () => (friendRequestsQuery.data ?? []).filter((r) => r.direction === 'incoming'),
    [friendRequestsQuery.data]
  );

  const outgoingRequests = useMemo(
    () => (friendRequestsQuery.data ?? []).filter((r) => r.direction === 'outgoing'),
    [friendRequestsQuery.data]
  );

  const selectedFriend = useMemo(
    () => (friendsQuery.data ?? []).find((f) => f.friend_user_id === selectedFriendId) ?? null,
    [friendsQuery.data, selectedFriendId]
  );

  const refreshFriends = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
  }, [queryClient]);

  // ---------------------------
  // Friends Actions
  // ---------------------------
  const handleSendRequest = useCallback(async () => {
    const username = normalizeHandle(addUsername);
    if (!username) {
      Alert.alert('Add Friend', 'Type a username like @Test31');
      return;
    }

    setSendingRequest(true);
    try {
      const { data, error } = await supabase.rpc('send_friend_request', { p_username: username });
      if (error) throw error;

      setAddUsername('');
      const status = (data as any)?.status;

      if (status === 'already_friends') {
        Alert.alert('Already friends', 'You are already friends with that user.');
      } else if (status === 'incoming_request_exists') {
        Alert.alert('Request already waiting', 'They already sent you a request. Accept it below.');
      } else if (status === 'already_sent') {
        Alert.alert('Request already sent', 'Your request is already pending.');
      } else {
        Alert.alert('Request sent', 'They will show up once they accept.');
      }

      refreshFriends();
      queryClient.invalidateQueries({ queryKey: ['friends', 'search'] });
    } catch (e: any) {
      Alert.alert('Could not send request', e?.message ?? String(e));
    } finally {
      setSendingRequest(false);
    }
  }, [addUsername, refreshFriends, queryClient]);

const handleSendRequestToUsername = useCallback(
    async (username: string) => {
      const handle = normalizeHandle(username);
      if (!handle) return;

      setSearchSendingUsername(handle);
      try {
        const { data, error } = await supabase.rpc('send_friend_request', { p_username: handle });
        if (error) throw error;

        // Quiet success UX (no alert), but refresh lists + suggestions.
        setAddUsername('');
        refreshFriends();
        queryClient.invalidateQueries({ queryKey: ['friends', 'search'] });

        // If it wasn't actually sent, give a minimal hint.
        const status = (data as any)?.status;
        if (status === 'already_friends') {
          Alert.alert('Already friends', 'You are already friends with that user.');
        } else if (status === 'incoming_request_exists') {
          Alert.alert('Request waiting', 'They already sent you a request. Accept it below.');
        }
      } catch (e: any) {
        Alert.alert('Could not send request', e?.message ?? String(e));
      } finally {
        setSearchSendingUsername(null);
      }
    },
    [refreshFriends, queryClient]
  );


  const handleRespondRequest = useCallback(
    async (requestId: string, accept: boolean) => {
      setActionBusyId(requestId);
      try {
        const { error } = await supabase.rpc('respond_friend_request', {
          p_request_id: requestId,
          p_accept: accept,
        });
        if (error) throw error;
        refreshFriends();
      } catch (e: any) {
        Alert.alert('Request failed', e?.message ?? String(e));
      } finally {
        setActionBusyId(null);
      }
    },
    [refreshFriends]
  );

  const handleCancelRequest = useCallback(
    async (requestId: string) => {
      setActionBusyId(requestId);
      try {
        const { error } = await supabase.rpc('cancel_friend_request', { p_request_id: requestId });
        if (error) throw error;
        refreshFriends();
      } catch (e: any) {
        Alert.alert('Cancel failed', e?.message ?? String(e));
      } finally {
        setActionBusyId(null);
      }
    },
    [refreshFriends]
  );

  const handleRemoveFriend = useCallback(
    async (friendUserId: string, label: string) => {
      Alert.alert('Remove friend?', `Remove ${label} from your friends list?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('remove_friend', { p_friend_user_id: friendUserId });
              if (error) throw error;
              setSelectedFriendId(null);
              refreshFriends();
            } catch (e: any) {
              Alert.alert('Remove failed', e?.message ?? String(e));
            }
          },
        },
      ]);
    },
    [refreshFriends]
  );

  const handleFindMyFriends = useCallback(() => {
    Alert.alert(
      'Find My Friends',
      'Coming soon!\n\nOnce contacts permissions are enabled in the TestFlight / Play Store build, this button will scan your phone contacts and show people you can add.\n\nFor now, add friends by username.'
    );
  }, []);

  // ---------------------------
  // UI Helpers
  // ---------------------------
  const switchTab = useCallback(
    (tab: Tab) => {
      contentFade.setValue(0);
      setActiveTab(tab);
      setSelectedFriendId(null);

      // Make the target tab feel “live” by forcing a fresh fetch right away.
      if (tab === 'league') queryClient.invalidateQueries({ queryKey: ['leaderboard', 'league'] });
      if (tab === 'school') queryClient.invalidateQueries({ queryKey: ['leaderboard', 'school'] });
      if (tab === 'friends') queryClient.invalidateQueries({ queryKey: ['friends'] });
      if (tab === 'profession') queryClient.invalidateQueries({ queryKey: ['profession'] });

      Animated.timing(contentFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [contentFade, queryClient]
  );

  const proximityMessage = useMemo(() => {
    const rows = leagueQuery.data ?? [];
    if (rows.length === 0) return null;
    const meRow = rows.find((r) => r.is_me);
    if (!meRow) return null;

    const myRank = meRow.rank;
    const myXp = meRow.xp_this_week;

    if (myRank <= 10) {
      const rank11 = rows.find((r) => r.rank === 11);
      if (rank11) {
        const lead = myXp - rank11.xp_this_week;
        if (lead <= 30) return { text: `Only ${lead} XP ahead of demotion zone!`, type: 'warning' as const };
      }
      return { text: `You're in the promotion zone! Keep it up!`, type: 'success' as const };
    }

    const rank10 = rows.find((r) => r.rank === 10);
    if (rank10) {
      const gap = rank10.xp_this_week - myXp;
      if (gap <= 50) return { text: `Only ${gap} XP from Top 10!`, type: 'urgent' as const };
      return { text: `${gap} XP to reach Top 10`, type: 'info' as const };
    }

    return null;
  }, [leagueQuery.data]);

  useEffect(() => {
    if (!isAuthenticated || !session) {
      router.replace('/auth/welcome');
    }
  }, [isAuthenticated, session, router]);

  if (!isAuthenticated || !session) return null;

  const currentTier: LeagueTier = progress.stats.leagueTier || 'Bronze';
  const tierConfig = TIER_CONFIG[currentTier];

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return Colors.textTertiary;
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const renderLeagueItem = (row: LeagueRow) => {
    const rank = row.rank;
    const isTop3 = rank <= 3;

    return (
      <View
        key={row.user_id}
        style={[
          styles.leaderItem,
          isTop3 && styles.leaderItemTop3,
          isTop3 && { borderLeftColor: getMedalColor(rank), borderLeftWidth: 3 },
          row.is_me && styles.leaderItemMe,
        ]}
      >
        <View style={styles.rankContainer}>
          {getMedalEmoji(rank) ? (
            <Text style={styles.medalEmoji}>{getMedalEmoji(rank)}</Text>
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </View>

        <View style={[styles.avatarCircle, isTop3 && { borderColor: getMedalColor(rank) }]}>
          <Text style={styles.avatarText}>{row.avatar_emoji || '👤'}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {row.display_name}
            {row.is_me ? ' (You)' : ''}
          </Text>
          <View style={styles.userMeta}>
            <XPIcon size={12} />
            <Text style={styles.userXp}>{(row.xp_this_week ?? 0).toLocaleString()} XP</Text>
            <Text style={styles.userLevel}>Lv.{row.level ?? 1}</Text>
          </View>
        </View>

        <View style={styles.streakBadge}>
          <StreakFlameIcon size={14} />
          <Text style={styles.streakText}>{row.streak ?? 0}</Text>
        </View>
      </View>
    );
  };

    
  const renderSearchSuggestion = (u: SearchUserRow) => {
    const label = String(u.display_name ?? u.username ?? 'User');
    const rel = String(u.relationship ?? 'none');
    const isSending = searchSendingUsername === normalizeHandle(u.username);

    const right = (() => {
      if (rel === 'already_friends') {
        return (
          <View style={styles.suggestPillOk}>
            <CheckCircle2 size={14} color={Colors.success} />
            <Text style={styles.suggestPillOkText}>Friends</Text>
          </View>
        );
      }

      if (rel === 'outgoing_pending') {
        return (
          <View style={styles.suggestPillMuted}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.suggestPillMutedText}>Requested</Text>
          </View>
        );
      }

      if (rel === 'incoming_pending') {
        return (
          <View style={styles.suggestPillWarn}>
            <AlertTriangle size={14} color={Colors.warning} />
            <Text style={styles.suggestPillWarnText}>Incoming</Text>
          </View>
        );
      }

      if (rel === 'blocked') {
        return (
          <View style={styles.suggestPillMuted}>
            <Shield size={14} color={Colors.textSecondary} />
            <Text style={styles.suggestPillMutedText}>Blocked</Text>
          </View>
        );
      }

      return (
        <Pressable
          style={[styles.suggestAddBtn, isSending && { opacity: 0.6 }]}
          disabled={isSending}
          onPress={() => handleSendRequestToUsername(u.username)}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <UserPlus size={16} color="#fff" />
          )}
        </Pressable>
      );
    })();

    return (
      <View key={u.user_id} style={styles.suggestRow}>
        <Pressable
          style={styles.suggestLeftPress}
          onPress={() => setAddUsername(`@${u.username}`)}
        >
          <View style={styles.avatarCircleSmall}>
            <Text style={styles.avatarTextSmall}>👤</Text>
          </View>
          <View style={styles.suggestInfo}>
            <Text style={styles.suggestName} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.suggestHandle}>@{u.username}</Text>
          </View>
        </Pressable>

        {right}
      </View>
    );
  };

const renderFriendItem = (friend: FriendRow, index: number) => {
    const isSelected = selectedFriendId === friend.friend_user_id;
    const label = friend.display_name || friend.username;

    const mutual = safeNum((friend as any).mutual_count);
    const mutualLabel = mutual === 1 ? '1 mutual' : `${mutual} mutual`;

    const renderRightActions = () => (
      <Pressable
        style={styles.swipeActionRemove}
        onPress={() => handleRemoveFriend(friend.friend_user_id, label)}
      >
        <Trash2 size={18} color="#fff" />
        <Text style={styles.swipeActionText}>Remove</Text>
      </Pressable>
    );

    return (
      <View key={friend.friend_user_id}>
        <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
          <Pressable
            style={[styles.friendItem, isSelected && styles.friendItemSelected]}
            onPress={() => setSelectedFriendId(isSelected ? null : friend.friend_user_id)}
          >
            <View style={styles.rankPill}>
              <Text style={styles.rankPillText}>{index + 1}</Text>
            </View>

            <View style={[styles.avatarCircle, { borderColor: Colors.primary }]}>
              <Text style={styles.avatarText}>👤</Text>
            </View>

            <View style={styles.friendInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {label}
              </Text>
              <Text style={styles.friendHandle}>@{friend.username}</Text>

              <View style={styles.badgeRow}>
                <View style={styles.badgePill}>
                  <XPIcon size={12} />
                  <Text style={styles.badgeText}>{friend.weekly_xp.toLocaleString()} XP</Text>
                </View>

                <View style={styles.badgePillMuted}>
                  <Users size={12} color={Colors.textSecondary} />
                  <Text style={styles.badgeTextMuted}>{mutualLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.friendRight}>
              <View style={styles.friendStreakBadgeLarge}>
                <StreakFlameIcon size={16} />
                <Text style={styles.friendStreakNumLarge}>{friend.streak}</Text>
                <Text style={styles.friendStreakSuffix}>d</Text>
              </View>

              <ChevronRight
                size={16}
                color={Colors.textTertiary}
                style={{ transform: [{ rotate: isSelected ? '90deg' : '0deg' }] }}
              />
            </View>
          </Pressable>
        </Swipeable>

        {isSelected && (
          <View style={styles.expandedSection}>
            <XPComparisonGraph
              yourXp={progress.stats.xpThisWeek ?? 0}
              friendXp={friend.weekly_xp ?? 0}
              friendName={`@${friend.username}`}
            />
          </View>
        )}
      </View>
    );
  };

  const renderRequestRow = (r: FriendRequestRow) => {
    const busy = actionBusyId === r.request_id;
    const label = r.display_name || r.username;

    if (r.direction === 'outgoing') {
      const renderRightActions = () => (
        <Pressable
          style={styles.swipeActionCancel}
          disabled={busy}
          onPress={() => handleCancelRequest(r.request_id)}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <XCircle size={18} color="#fff" />
          )}
          <Text style={styles.swipeActionText}>Cancel</Text>
        </Pressable>
      );

      return (
        <Swipeable
          key={r.request_id}
          renderRightActions={renderRightActions}
          overshootRight={false}
        >
          <View style={styles.requestRow}>
            <View style={styles.requestLeft}>
              <View style={[styles.avatarCircle, { borderColor: Colors.primary }]}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{label}</Text>
                <Text style={styles.requestHandle}>@{r.username}</Text>
              </View>
            </View>

            <View style={styles.pendingPill}>
              <Clock size={12} color={Colors.textSecondary} />
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          </View>
        </Swipeable>
      );
    }

    // Incoming
    return (
      <View key={r.request_id} style={styles.requestRow}>
        <View style={styles.requestLeft}>
          <View style={[styles.avatarCircle, { borderColor: Colors.primary }]}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{label}</Text>
            <Text style={styles.requestHandle}>@{r.username}</Text>
          </View>
        </View>

        <View style={styles.requestActionsCompact}>
          <Pressable
            accessibilityLabel={`Accept @${r.username}`}
            style={[styles.iconActionBtn, styles.iconActionAccept, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={() => handleRespondRequest(r.request_id, true)}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CheckCircle2 size={18} color="#fff" />
            )}
          </Pressable>

          <Pressable
            accessibilityLabel={`Decline @${r.username}`}
            style={[styles.iconActionBtn, styles.iconActionDecline, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={() => handleRespondRequest(r.request_id, false)}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <XCircle size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
    );
  };

const renderLoadingState = (label = 'Loading...') => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );

  const renderErrorState = (message: string, onRetry: () => void) => (
    <View style={styles.errorContainer}>
      <MascotAnimated mood="sad" size={80} />
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  const leagueRows = leagueQuery.data ?? [];
  const top3League = leagueRows.filter((r) => r.rank <= 3);
  const restLeague = leagueRows.filter((r) => r.rank > 3);
  const friends = friendsQuery.data ?? [];

  const TABS: Array<{ key: Tab; label: string; Icon: any }> = [
    { key: 'league', label: 'League', Icon: Trophy },
    { key: 'friends', label: 'Friends', Icon: Users },
    { key: 'school', label: 'School', Icon: GraduationCap },
    { key: 'profession', label: 'Profession', Icon: Briefcase },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <View style={styles.tierHeaderRow}>
              <Text style={styles.tierHeaderEmoji}>{tierConfig.emoji}</Text>
              <Text style={[styles.headerSub, { color: tierConfig.color }]}>{currentTier} League</Text>
            </View>
          </View>
          <MascotAnimated mood="waving" size={64} />
        </View>

        <Animated.View style={[styles.countdownCard, daysLeft <= 1 && { transform: [{ scale: urgencyPulse }] }]}>
          <Clock size={14} color={daysLeft <= 1 ? '#EF4444' : 'rgba(255,255,255,0.7)'} />
          <Text style={[styles.countdownText, daysLeft <= 1 && styles.countdownUrgent]}>
            {daysLeft <= 1 ? '⏰ LAST CHANCE • ' : 'Week ends in '}
            {weekCountdown}
          </Text>
        </Animated.View>

        <View style={styles.yourRankCard}>
          <View style={styles.yourRankLeft}>
            <Text style={styles.yourRankLabel}>League Rank</Text>
            <Text style={styles.yourRankValue}>#{leagueRank}</Text>
          </View>
          <View style={styles.yourRankDivider} />
          <View style={styles.yourRankRight}>
            <XPIcon size={16} />
            <Text style={styles.yourXpValue}>{progress.stats.xpThisWeek}</Text>
            <Text style={styles.yourXpLabel}>This Week</Text>
          </View>
          <View style={styles.yourRankDivider} />
          <View style={styles.yourRankRight}>
            <View style={styles.streakIconCircle}>
              <StreakFlameIcon size={18} />
            </View>
            <Text style={styles.yourXpValue}>{progress.stats.streakCurrent}</Text>
            <Text style={styles.yourXpLabel}>Streak</Text>
          </View>
        </View>

        {/* ✅ Tabs that POP (active tab is a bright pill) */}
        <View style={styles.tabBar}>
          {TABS.map(({ key, label, Icon }) => {
            const isActive = activeTab === key;
            const iconColor = isActive ? Colors.primaryDark : 'rgba(255,255,255,0.85)';
            const textColor = isActive ? Colors.primaryDark : 'rgba(255,255,255,0.85)';
            return (
              <Pressable
                key={key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => switchTab(key)}
              >
                <Icon size={18} color={iconColor} />
                <Text style={[styles.tabText, { color: textColor }, isActive && styles.tabTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: contentFade }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* ------------------- LEAGUE TAB ------------------- */}
          {activeTab === 'league' ? (
            leagueQuery.isLoading ? (
              renderLoadingState('Loading league...')
            ) : leagueQuery.isError ? (
              renderErrorState(`League error: ${(leagueQuery.error as any)?.message ?? 'Unknown error'}`, () =>
                leagueQuery.refetch()
              )
            ) : (
              <>
                {proximityMessage && (
                  <View
                    style={[
                      styles.callout,
                      proximityMessage.type === 'urgent' && styles.calloutUrgent,
                      proximityMessage.type === 'success' && styles.calloutSuccess,
                      proximityMessage.type === 'warning' && styles.calloutWarning,
                    ]}
                  >
                    <View
                      style={[
                        styles.calloutIcon,
                        proximityMessage.type === 'urgent' && { backgroundColor: Colors.errorLight },
                        proximityMessage.type === 'success' && { backgroundColor: Colors.successLight },
                        proximityMessage.type === 'warning' && { backgroundColor: Colors.warningLight },
                      ]}
                    >
                      <Target
                        size={18}
                        color={
                          proximityMessage.type === 'urgent'
                            ? Colors.error
                            : proximityMessage.type === 'success'
                              ? Colors.success
                              : proximityMessage.type === 'warning'
                                ? Colors.warning
                                : Colors.primary
                        }
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.calloutTitle}>{proximityMessage.text}</Text>
                    </View>
                  </View>
                )}

                <View style={[styles.callout, styles.calloutSuccess]}> 
                  <View style={[styles.calloutIcon, { backgroundColor: Colors.successLight }]}>
                    <TrendingUp size={18} color={Colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.calloutTitle}>Promotion</Text>
                    <Text style={styles.calloutSubtitle}>
                      Finish Top 10 to get promoted to{' '}
                      {currentTier === 'Gold' ? 'Gold (max)' : currentTier === 'Silver' ? 'Gold' : 'Silver'}.
                    </Text>
                  </View>
                </View>

                <View style={[styles.callout, styles.calloutUrgent]}> 
                  <View style={[styles.calloutIcon, { backgroundColor: Colors.errorLight }]}>
                    <AlertTriangle size={18} color={Colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.calloutTitle}>Demotion</Text>
                    <Text style={styles.calloutSubtitle}>
                      Bottom 5 get demoted{currentTier === 'Bronze' ? " (you're safe in Bronze)" : ''}.
                    </Text>
                  </View>
                </View>

                {top3League.length >= 3 && (
                  <View style={styles.podium}>
                    {[1, 0, 2].map((idx) => {
                      const u = top3League[idx];
                      if (!u) return null;
                      const rank = u.rank;
                      const podiumHeight = rank === 1 ? 80 : rank === 2 ? 60 : 45;

                      return (
                        <View key={u.user_id} style={styles.podiumItem}>
                          <View style={styles.podiumCard}>
                            <View style={[styles.podiumAvatar, { borderColor: getMedalColor(rank) }]}> 
                              <Text style={styles.podiumAvatarText}>{u.avatar_emoji || '👤'}</Text>
                              {rank === 1 && <Crown size={18} color="#FFD700" style={styles.crownIcon} />}
                            </View>
                            <Text style={styles.podiumName} numberOfLines={1}>
                              {u.display_name}
                              {u.is_me ? ' (You)' : ''}
                            </Text>
                            <Text style={styles.podiumXp}>{(u.xp_this_week ?? 0).toLocaleString()} XP</Text>
                            <View style={styles.podiumStreakBadge}>
                              <StreakFlameIcon size={14} />
                              <Text style={styles.podiumStreakText}>{u.streak ?? 0}</Text>
                            </View>
                          </View>

                          <LinearGradient
                            colors={
                              rank === 1
                                ? ['#FDE68A', '#F59E0B']
                                : rank === 2
                                  ? ['#E5E7EB', '#9CA3AF']
                                  : ['#FED7AA', '#CD7F32']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.podiumBar, { height: podiumHeight }]}
                          >
                            <View style={styles.podiumRankBadge}>
                              <Text style={styles.podiumRank}>{rank}</Text>
                            </View>
                          </LinearGradient>
                        </View>
                      );
                    })}
                  </View>
                )}

                {leagueRows.length === 0 && !leagueQuery.isLoading && (
                  <View style={styles.emptyState}>
                    <MascotAnimated mood="thinking" size={80} />
                    <Text style={styles.emptyTitle}>No League Data Yet</Text>
                    <Text style={styles.emptySubtitle}>Complete lessons to earn XP and join the rankings!</Text>
                  </View>
                )}

                {restLeague.map(renderLeagueItem)}
              </>
            )
          ) : null}

          {/* ------------------- FRIENDS TAB ------------------- */}
          {activeTab === 'friends' ? (
            friendsQuery.isLoading || friendRequestsQuery.isLoading ? (
              renderLoadingState('Loading friends...')
            ) : friendsQuery.isError || friendRequestsQuery.isError ? (
              renderErrorState(
                `Friends error: ${((friendsQuery.error as any)?.message ??
                  (friendRequestsQuery.error as any)?.message ??
                  'Unknown error')}`,
                () => {
                  friendsQuery.refetch();
                  friendRequestsQuery.refetch();
                }
              )
            ) : (
              <>
                
<View style={styles.addFriendCard}>
                  <View style={styles.addFriendTitleRow}>
                    <UserPlus size={18} color={Colors.primary} />
                    <Text style={styles.addFriendTitle}>Add Friends</Text>
                  </View>

                  <View style={styles.addFriendRow}>
                    <TextInput
                      style={styles.addFriendInput}
                      placeholder="@username"
                      placeholderTextColor={Colors.textTertiary}
                      value={addUsername}
                      onChangeText={setAddUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable
                      style={[styles.addFriendBtn, sendingRequest && { opacity: 0.6 }]}
                      onPress={handleSendRequest}
                      disabled={sendingRequest}
                    >
                      {sendingRequest ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.addFriendBtnText}>Send</Text>
                      )}
                    </Pressable>
                  </View>

                  {normalizedSearchInput.length > 0 ? (
                    <View style={styles.suggestBox}>
                      {normalizedSearchInput.length < 2 ? (
                        <Text style={styles.suggestHintText}>Type 2+ letters to search.</Text>
                      ) : searchUsersQuery.isLoading ? (
                        <View style={styles.suggestLoadingRow}>
                          <ActivityIndicator size="small" color={Colors.primary} />
                          <Text style={styles.suggestLoadingText}>Searching…</Text>
                        </View>
                      ) : searchUsersQuery.isError ? (
                        <View>
                          <Text style={styles.suggestErrorText}>
                            Search unavailable. If this is your first time, add the Supabase RPC{' '}
                            <Text style={{ fontWeight: '900' as const }}>search_users</Text>.
                          </Text>
                          {__DEV__ ? (
                            <Text style={styles.suggestErrorSubText}>
                              {String((searchUsersQuery.error as any)?.message ?? searchUsersQuery.error ?? '')}
                            </Text>
                          ) : null}
                        </View>
                      ) : (searchUsersQuery.data ?? []).length === 0 ? (
                        <Text style={styles.suggestEmptyText}>No users found.</Text>
                      ) : (
                        (searchUsersQuery.data ?? []).map(renderSearchSuggestion)
                      )}
                    </View>
                  ) : null}


                  <Pressable style={styles.findFriendsBtn} onPress={handleFindMyFriends}>
                    <Users size={16} color="#fff" />
                    <Text style={styles.findFriendsBtnText}>Find My Friends</Text>
                  </Pressable>

                  <Text style={styles.addFriendHint}>
                    Tip: Contact syncing will be enabled later (TestFlight / Play Store). For now, use usernames.
                  </Text>
                </View>

                {incomingRequests.length > 0 ? (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeader}>Incoming Requests</Text>
                    {incomingRequests.map(renderRequestRow)}
                  </View>
                ) : null}

                {outgoingRequests.length > 0 ? (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeader}>Pending Requests</Text>
                    <Text style={styles.sectionHintText}>Swipe left to cancel.</Text>
                    {outgoingRequests.map(renderRequestRow)}
                  </View>
                ) : null}

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeader}>Friends</Text>
                  <Text style={styles.sectionHintText}>Swipe left on a friend to remove.</Text>

                  {friends.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MascotAnimated mood="thinking" size={80} />
                      <Text style={styles.emptyTitle}>No Friends Yet</Text>
                      <Text style={styles.emptySubtitle}>Add a friend to start comparing weekly progress!</Text>
                    </View>
                  ) : (
                    friends.map((f, idx) => renderFriendItem(f, idx))
                  )}
                </View>
              </>
            )
          ) : null}

          {/* ------------------- SCHOOL TAB ------------------- */}
          {activeTab === 'school' ? (
            schoolQuery.isLoading ? (
              renderLoadingState('Loading schools...')
            ) : schoolQuery.isError ? (
              renderErrorState(
                `School error: ${(schoolQuery.error as any)?.message ?? 'Unknown error'}`,
                () => schoolQuery.refetch()
              )
            ) : (
              <>
                {progress.stats.selectedSchoolId ? (
                  <View style={styles.schoolHeaderCard}>
                    <View style={styles.schoolHeaderLeft}>
                      <GraduationCap size={22} color={Colors.primary} />
                      <View style={styles.schoolHeaderInfo}>
                        <Text style={styles.schoolHeaderName} numberOfLines={1}>
                          {progress.stats.selectedSchoolName}
                        </Text>
                        <Text style={styles.schoolHeaderRank}>Ranked this week</Text>
                      </View>
                    </View>
                    <View style={styles.schoolHeaderXpBadge}>
                      <XPIcon size={14} />
                      <Text style={styles.schoolHeaderXpText}>{progress.stats.xpThisWeek}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noSchoolCard}>
                    <MascotAnimated mood="thinking" size={60} />
                    <View style={styles.noSchoolInfo}>
                      <Text style={styles.noSchoolTitle}>No School Selected</Text>
                      <Text style={styles.noSchoolSub}>
                        Choose your school in Profile to contribute your XP to the rankings!
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.schoolSectionHeader}>
                  <Shield size={16} color={Colors.textSecondary} />
                  <Text style={styles.schoolSectionTitle}>Weekly School Rankings</Text>
                </View>

                {(schoolQuery.data ?? []).map((row: SchoolRow) => {
                  const rank = row.rank;
                  const isTop3 = rank <= 3;
                  const isUserSchool = row.is_user_school;

                  return (
                    <View
                      key={row.school_id}
                      style={[
                        styles.schoolItem,
                        isTop3 && { borderLeftColor: getMedalColor(rank), borderLeftWidth: 3 },
                        isUserSchool && styles.schoolItemHighlight,
                      ]}
                    >
                      <View style={styles.rankContainer}>
                        {getMedalEmoji(rank) ? (
                          <Text style={styles.medalEmoji}>{getMedalEmoji(rank)}</Text>
                        ) : (
                          <Text style={styles.rankNumber}>{rank}</Text>
                        )}
                      </View>

                      <View
                        style={[
                          styles.schoolIcon,
                          isTop3 && { borderColor: getMedalColor(rank) },
                          isUserSchool && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
                        ]}
                      >
                        <GraduationCap size={18} color={isUserSchool ? Colors.primary : Colors.textSecondary} />
                      </View>

                      <View style={styles.schoolInfo}>
                        <View style={styles.schoolNameRow}>
                          <Text style={[styles.schoolName, isUserSchool && { color: Colors.primary }]} numberOfLines={1}>
                            {row.school_name}
                          </Text>
                          {isUserSchool && (
                            <View style={styles.yourSchoolBadge}>
                              <Text style={styles.yourSchoolText}>YOU</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.schoolMeta}>
                          <Users size={11} color={Colors.textTertiary} />
                          <Text style={styles.schoolMembers}>{row.member_count ?? 0} members</Text>
                        </View>
                      </View>

                      <View style={styles.schoolXpContainer}>
                        <XPIcon size={13} />
                        <Text style={styles.schoolXp}>{(row.total_weekly_xp ?? 0).toLocaleString()}</Text>
                      </View>
                    </View>
                  );
                })}

                {(schoolQuery.data ?? []).length === 0 && !schoolQuery.isLoading && (
                  <View style={styles.emptyState}>
                    <MascotAnimated mood="thinking" size={80} />
                    <Text style={styles.emptyTitle}>No School Data Yet</Text>
                    <Text style={styles.emptySubtitle}>Schools will appear once students start earning XP!</Text>
                  </View>
                )}

                <View style={styles.privacyNote}>
                  <Text style={styles.privacyText}>
                    🔒 School is optional and only affects leaderboards. Your personal data is never shared.
                  </Text>
                </View>
              </>
            )
          ) : null}

          {/* ------------------- PROFESSION TAB ------------------- */}
          {activeTab === 'profession' ? (
            <View style={{ marginTop: 4 }}>
              <ProfessionLeaderboardTab />
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      <LeagueWeekResultsModal
        visible={leagueWeekResult !== null}
        result={leagueWeekResult}
        onDismiss={dismissLeagueResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '900' as const, color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' as const, marginTop: 2 },

  tierHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  tierHeaderEmoji: { fontSize: 16 },

  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(240, 249, 255, 0.22)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'] as const,
  },
  countdownUrgent: { color: '#FCA5A5', fontWeight: '800' as const },

  yourRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 249, 255, 0.22)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  yourRankLeft: { flex: 1, alignItems: 'center' },
  yourRankLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' as const },
  yourRankValue: { fontSize: 24, fontWeight: '900' as const, color: Colors.gold },
  yourRankDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 12 },
  yourRankRight: { flex: 1, alignItems: 'center', gap: 2 },
  streakIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240, 249, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.70)',
  },
  yourXpValue: { fontSize: 18, fontWeight: '900' as const, color: '#FFFFFF' },
  yourXpLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' as const },

  // ✅ Tabs POP more: active is a bright pill
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(240, 249, 255, 0.22)',
    borderRadius: 22,
    padding: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 249, 255, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.70)',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '900' as const,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    fontWeight: '900' as const,
  },

  content: { flex: 1 },
  scrollContent: { padding: 16 },

  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },

  errorContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  errorTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  errorText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  retryButton: { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryButtonText: { fontSize: 15, fontWeight: '700' as const, color: '#FFFFFF' },

  promoteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  promoteBannerText: { flex: 1, fontSize: 13, fontWeight: '700' as const, lineHeight: 18 },

  proximityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  proximityUrgent: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  proximitySuccess: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  proximityWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  proximityText: { flex: 1, fontSize: 14, fontWeight: '800' as const, color: Colors.primary },

  // Modern "callout" cards (replace the old highlighter banners)
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  calloutSuccess: { borderLeftColor: Colors.success },
  calloutWarning: { borderLeftColor: Colors.warning },
  calloutUrgent: { borderLeftColor: Colors.error },
  calloutIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '900' as const,
    color: Colors.text,
    lineHeight: 18,
  },
  calloutSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 18, paddingTop: 18, gap: 10 },
  podiumItem: { flex: 1, alignItems: 'center' },
  podiumCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  podiumAvatarText: { fontSize: 24 },
  crownIcon: { position: 'absolute', top: -14 },
  podiumName: { fontSize: 12, fontWeight: '700' as const, color: Colors.text, marginBottom: 2 },
  podiumXp: { fontSize: 11, fontWeight: '800' as const, color: Colors.textSecondary, marginBottom: 4 },
  podiumStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  podiumStreakText: { fontSize: 11, fontWeight: '800' as const, color: '#92400E' },
  podiumBar: {
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  podiumRankBadge: {
    backgroundColor: 'rgba(15,23,42,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  podiumRank: { fontSize: 18, fontWeight: '900' as const, color: '#FFFFFF' },

  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
  },
  leaderItemTop3: { borderLeftWidth: 3 },
  leaderItemMe: { borderColor: Colors.primary + '50', backgroundColor: Colors.primaryLight + '40' },

  rankContainer: { width: 30, alignItems: 'center' },
  medalEmoji: { fontSize: 20 },
  rankNumber: { fontSize: 16, fontWeight: '800' as const, color: Colors.textSecondary },

  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: Colors.surfaceAlt,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: { fontSize: 20 },

  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '800' as const, color: Colors.text },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  userXp: { fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary },
  userLevel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textTertiary, marginLeft: 6 },

  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: { fontSize: 12, fontWeight: '800' as const, color: '#92400E' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },

  friendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 18,
  },
  friendsHeaderText: { flex: 1 },
  friendsTitle: { fontSize: 15, fontWeight: '900' as const, color: Colors.text },
  friendsSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' as const },

  addFriendCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
  },
  addFriendTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  addFriendTitle: { fontSize: 15, fontWeight: '900' as const, color: Colors.text },

  addFriendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  addFriendInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  addFriendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendBtnText: { color: '#fff', fontWeight: '900' as const },

  // Search suggestions
  suggestBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  suggestLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  suggestLoadingText: { color: Colors.textSecondary, fontWeight: '700' as const, fontSize: 12 },

  suggestErrorText: { color: Colors.textTertiary, fontWeight: '700' as const, fontSize: 12, padding: 12 },
  suggestEmptyText: { color: Colors.textTertiary, fontWeight: '700' as const, fontSize: 12, padding: 12 },

  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  suggestLeftPress: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircleSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarTextSmall: { fontSize: 16 },
  suggestInfo: { flex: 1 },
  suggestName: { fontSize: 13, fontWeight: '900' as const, color: Colors.text },
  suggestHandle: { fontSize: 11, fontWeight: '700' as const, color: Colors.textTertiary, marginTop: 2 },

  suggestAddBtn: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  suggestPillMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  suggestPillMutedText: { fontSize: 11, fontWeight: '900' as const, color: Colors.textSecondary },

  suggestPillOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  suggestPillOkText: { fontSize: 11, fontWeight: '900' as const, color: Colors.success },

  suggestPillWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.14)',
  },
  suggestPillWarnText: { fontSize: 11, fontWeight: '900' as const, color: Colors.warning },


  findFriendsBtn: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  findFriendsBtnText: { color: '#fff', fontWeight: '900' as const },

  addFriendHint: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' as const, marginTop: 10 },

  sectionBlock: { marginTop: 10 },
  sectionHeader: { fontSize: 14, fontWeight: '900' as const, color: Colors.textSecondary, marginBottom: 8 },

  requestRow: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  requestLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 14, fontWeight: '900' as const, color: Colors.text },
  requestHandle: { fontSize: 12, fontWeight: '700' as const, color: Colors.textTertiary, marginTop: 2 },
  requestButtons: { flexDirection: 'row', gap: 8 },
  requestBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  requestBtnText: { color: '#fff', fontWeight: '900' as const },
  acceptBtn: { backgroundColor: '#16A34A' },
  declineBtn: { backgroundColor: '#DC2626' },
  cancelBtn: { backgroundColor: Colors.textTertiary },

  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
  },
  friendItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },

  rankPill: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rankPillText: { fontSize: 12, fontWeight: '900' as const, color: Colors.textSecondary },

  friendInfo: { flex: 1, marginLeft: 12 },
  friendMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  friendHandle: { fontSize: 11, color: Colors.textTertiary, fontWeight: '700' as const },

  friendRight: { alignItems: 'center', gap: 6 },
  friendStreakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.accentLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  friendStreakNum: { fontSize: 11, fontWeight: '900' as const, color: Colors.accent },

  expandedSection: { paddingHorizontal: 4, marginBottom: 12 },
  friendActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  removeFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  removeFriendText: { color: Colors.error, fontWeight: '900' as const },

  // School styles
  schoolHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  schoolHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  schoolHeaderInfo: { flex: 1 },
  schoolHeaderName: { fontSize: 15, fontWeight: '800' as const, color: Colors.text },
  schoolHeaderRank: { fontSize: 12, fontWeight: '600' as const, color: Colors.primary, marginTop: 2 },
  schoolHeaderXpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.goldLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  schoolHeaderXpText: { fontSize: 14, fontWeight: '900' as const, color: '#92400E' },

  noSchoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    borderStyle: 'dashed',
  },
  noSchoolInfo: { flex: 1 },
  noSchoolTitle: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
  noSchoolSub: { fontSize: 13, fontWeight: '500' as const, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },

  schoolSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  schoolSectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.textSecondary },

  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
  },
  schoolItemHighlight: { borderColor: Colors.primary + '50', backgroundColor: Colors.primaryLight + '80' },

  schoolIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.surfaceAlt,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  schoolInfo: { flex: 1, marginLeft: 12 },
  schoolNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  schoolName: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, flexShrink: 1 },

  yourSchoolBadge: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  yourSchoolText: { fontSize: 9, fontWeight: '900' as const, color: '#FFFFFF' },

  schoolMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  schoolMembers: { fontSize: 11, fontWeight: '600' as const, color: Colors.textTertiary },

  schoolXpContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.goldLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  schoolXp: { fontSize: 13, fontWeight: '800' as const, color: '#92400E' },

  privacyNote: { marginTop: 12, padding: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.surfaceAlt },
  privacyText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textTertiary, lineHeight: 18, textAlign: 'center' as const },

  // --- Friend polish (compact buttons, swipe actions, badges) ---
  sectionHintText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.goldLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgePillMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#92400E',
  },
  badgeTextMuted: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },

  friendStreakBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    gap: 6,
  },
  friendStreakNumLarge: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.accent,
  },
  friendStreakSuffix: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.accent,
  },

  requestActionsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionAccept: { backgroundColor: Colors.success },
  iconActionDecline: { backgroundColor: Colors.error },

  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.textSecondary,
  },

  swipeActionRemove: {
    width: 96,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
    borderRadius: 14,
  },
  swipeActionCancel: {
    width: 96,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
    borderRadius: 14,
  },
  swipeActionText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#fff',
  },

});
