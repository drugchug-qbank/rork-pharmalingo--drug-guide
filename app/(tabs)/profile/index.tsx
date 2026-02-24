import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Target,
  BookOpen,
  Award,
  Heart,
  Coins,
  TrendingUp,
  RotateCcw,
  GraduationCap,
  ChevronRight,
  X,
  Search,
  Check,
  Bell,
  BellOff,
  Trophy,
  LogOut,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProgress } from '@/contexts/ProgressContext';
import { useAuth } from '@/contexts/AuthContext';
import { useXpSync } from '@/contexts/XpSyncContext';
import { chapters } from '@/constants/chapters';
import { schools, School } from '@/constants/schoolsData';
import ProgressBar from '@/components/ProgressBar';
import MascotAnimated from '@/components/MascotAnimated';
import StreakFlameIcon from '@/components/StreakFlameIcon';

type StreakStatus = 'extended' | 'at_risk' | 'lost';

interface StreakStatusRow {
  status: StreakStatus | string;
  streak_current: number;
  streak_longest: number;
  streak_last_day: string | null;
  streak_last_at: string | null;
  deadline_at: string | null;
  seconds_left: number | null;
}

type ProfessionRow = {
  profession_id: number;
  profession_name: string;
  profession_code: string;
  emoji: string;
  total_donated: number;
  rank: number;
  is_my_profession: boolean;
  my_donated: number;
  my_eligible: boolean;
  my_coins: number;
  month_start: string;
  month_end: string;
};

function safeNumber(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const days = Math.floor(s / 86400);
  const rem = s % 86400;
  const hours = Math.floor(rem / 3600);
  const minutes = Math.floor((rem % 3600) / 60);
  const seconds = rem % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (days > 0) return `${days}d ${hh}:${mm}:${ss}`;
  return `${hh}:${mm}:${ss}`;
}

function formatMonthEnd(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    progress,
    accuracy,
    totalLessonsCompleted,
    getChapterProgress,
    resetProgress,
    selectSchool,
    toggleReminders,
    endWeekNow,
  } = useProgress();
  const { profile, signOut, refreshProfile } = useAuth();
  const { pendingCount, isSyncing } = useXpSync();

  const [togglingReminders, setTogglingReminders] = useState<boolean>(false);

  // School modal
  const [schoolModalVisible, setSchoolModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [schoolUpdating, setSchoolUpdating] = useState<boolean>(false);

  // Profession modal
  const [professionModalVisible, setProfessionModalVisible] = useState<boolean>(false);
  const [professionSearchQuery, setProfessionSearchQuery] = useState<string>('');
  const [professionRows, setProfessionRows] = useState<ProfessionRow[]>([]);
  const [professionLoading, setProfessionLoading] = useState<boolean>(false);
  const [professionUpdating, setProfessionUpdating] = useState<boolean>(false);
  const [professionError, setProfessionError] = useState<string>('');

  const [debugOutput, setDebugOutput] = useState<Record<string, string>>({});
  const [debugLoading, setDebugLoading] = useState<Record<string, boolean>>({});

  // ---------------------------
  // Streak status (server truth)
  // ---------------------------
  const [streakStatus, setStreakStatus] = useState<StreakStatusRow | null>(null);
  const [streakStatusLoading, setStreakStatusLoading] = useState<boolean>(false);
  const [streakStatusError, setStreakStatusError] = useState<string>('');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const fetchStreakStatus = useCallback(async () => {
    if (!profile?.id) return;

    setStreakStatusLoading(true);
    setStreakStatusError('');
    try {
      const { data, error } = await supabase.rpc('get_my_streak_status');
      if (error) throw error;

      const row: any = Array.isArray(data) ? data?.[0] : data;

      if (!row) {
        setStreakStatus(null);
        return;
      }

      setStreakStatus({
        status: String(row.status ?? 'lost'),
        streak_current: safeNumber(row.streak_current, 0),
        streak_longest: safeNumber(row.streak_longest, 0),
        streak_last_day: row.streak_last_day ?? null,
        streak_last_at: row.streak_last_at ?? null,
        deadline_at: row.deadline_at ?? null,
        seconds_left: row.seconds_left != null ? safeNumber(row.seconds_left) : null,
      });
    } catch (e: any) {
      console.log('[Profile] get_my_streak_status error:', e);
      setStreakStatusError(e?.message ?? String(e));
    } finally {
      setStreakStatusLoading(false);
    }
  }, [profile?.id]);

  const fetchProfessionRows = useCallback(async () => {
    if (!profile?.id) return;

    setProfessionLoading(true);
    setProfessionError('');
    try {
      const { data, error } = await supabase.rpc('get_profession_leaderboard');
      if (error) throw error;

      const rowsRaw: any[] = Array.isArray(data) ? data : [];
      const parsed: ProfessionRow[] = rowsRaw.map((r: any) => ({
        profession_id: safeNumber(r.profession_id, 0),
        profession_name: String(r.profession_name ?? ''),
        profession_code: String(r.profession_code ?? ''),
emoji: String(r.emoji ?? '👤'),
total_donated: safeNumber(r.total_donated, 0),
rank: safeNumber(r.rank, 0),
is_my_profession: !!r.is_my_profession,
my_donated: safeNumber(r.my_donated, 0),
my_eligible: !!r.my_eligible,
my_coins: safeNumber(r.my_coins, 0),
month_start: String(r.month_start ?? ''),
month_end: String(r.month_end ?? ''),
      }));
      setProfessionRows(parsed);
    } catch (e: any) {
      console.log('[Profile] get_profession_leaderboard error:', e);
      setProfessionError(e?.message ?? String(e));
      setProfessionRows([]);
    } finally {
      setProfessionLoading(false);
    }
  }, [profile?.id]);

  // Tick for countdown UI
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Initial fetch + refresh when coming back to app
  useEffect(() => {
    fetchStreakStatus();
    fetchProfessionRows();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchStreakStatus();
        fetchProfessionRows();
      }
    });

    return () => sub.remove();
  }, [fetchStreakStatus, fetchProfessionRows]);

  // If XP sync finishes, refresh streak from server
  useEffect(() => {
    if (!profile?.id) return;
    if (!isSyncing && pendingCount === 0) fetchStreakStatus();
  }, [pendingCount, isSyncing, profile?.id, fetchStreakStatus]);

  const totalParts = chapters.reduce((sum, c) => sum + c.parts.length, 0);
  const overallProgress =
    totalParts > 0 ? Math.round((totalLessonsCompleted / totalParts) * 100) : 0;

  const filteredSchools = searchQuery.trim()
    ? schools.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : schools;

  const myProfession = useMemo(() => {
    return professionRows.find((r) => r.is_my_profession) ?? null;
  }, [professionRows]);

  const donatedThisMonth = useMemo(() => {
  return safeNumber(professionRows?.[0]?.my_donated, 0);
  }, [professionRows]);

  const professionLocked = donatedThisMonth > 0;

  const monthEndLabel = useMemo(() => {
    return formatMonthEnd(professionRows?.[0]?.month_end ?? null);
  }, [professionRows]);

  const filteredProfessions = useMemo(() => {
    const q = professionSearchQuery.trim().toLowerCase();
    if (!q) return professionRows;
    return professionRows.filter((p) => {
      return (
        p.profession_name.toLowerCase().includes(q) ||
        p.profession_code.toLowerCase().includes(q)
      );
    });
  }, [professionRows, professionSearchQuery]);

  /**
   * ✅ FIX:
   * We DO NOT write school_id from the local list (values like "sch3") to Supabase.
   * Instead we only write school_name (text), and the Supabase trigger sync_profile_school
   * converts it into a real UUID and sets school_id automatically.
   */
  const handleSelectSchool = useCallback(
    async (school: School) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!profile?.id) {
        Alert.alert('Error', 'You must be signed in to select a school.');
        return;
      }

      if (!school?.name || !school.name.trim()) {
        Alert.alert('Error', 'Invalid school selection.');
        return;
      }

      setSchoolUpdating(true);

      try {
        console.log('[Profile] Updating school_name in Supabase:', school.name, 'for user:', profile.id);

        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update({ school_name: school.name })
          .eq('id', profile.id)
          .select('school_id, school_name')
          .single();

        if (error) {
          console.log('[Profile] School update error:', JSON.stringify(error, null, 2));
          Alert.alert('School Update Failed', JSON.stringify(error, null, 2));
          return;
        }

        selectSchool(updatedProfile?.school_id ?? null, updatedProfile?.school_name ?? school.name);

        await refreshProfile();

        setSchoolModalVisible(false);
        setSearchQuery('');
      } catch (e: any) {
        console.log('[Profile] School update exception:', e);
        Alert.alert('School Update Failed', e?.message ?? String(e));
      } finally {
        setSchoolUpdating(false);
      }
    },
    [selectSchool, profile, refreshProfile]
  );

  const handleToggleReminders = useCallback(
    async (value: boolean) => {
      if (togglingReminders) return;
      setTogglingReminders(true);
      try {
        const success = await toggleReminders(value);
        if (!success && value) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive reminders.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.log('[Profile] Error toggling reminders:', error);
      } finally {
        setTogglingReminders(false);
      }
    },
    [toggleReminders, togglingReminders]
  );

  const handleClearSchool = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!profile?.id) {
      selectSchool(null, null);
      setSchoolModalVisible(false);
      setSearchQuery('');
      return;
    }

    setSchoolUpdating(true);

    try {
      console.log('[Profile] Clearing school in Supabase for user:', profile.id);

      const { error } = await supabase
        .from('profiles')
        .update({ school_id: null, school_name: null })
        .eq('id', profile.id);

      if (error) {
        console.log('[Profile] School clear error:', JSON.stringify(error, null, 2));
        Alert.alert('School Update Failed', JSON.stringify(error, null, 2));
        return;
      }

      selectSchool(null, null);
      await refreshProfile();
      setSchoolModalVisible(false);
      setSearchQuery('');
    } catch (e: any) {
      console.log('[Profile] School clear exception:', e);
      Alert.alert('School Update Failed', e?.message ?? String(e));
    } finally {
      setSchoolUpdating(false);
    }
  }, [selectSchool, profile, refreshProfile]);

  const renderSchoolItem = useCallback(
    ({ item }: { item: School }) => {
      const isSelected =
        !!progress.stats.selectedSchoolName &&
        progress.stats.selectedSchoolName.trim().toLowerCase() === item.name.trim().toLowerCase();

      return (
        <Pressable
          style={[styles.schoolListItem, isSelected && styles.schoolListItemSelected]}
          onPress={() => handleSelectSchool(item)}
          disabled={schoolUpdating}
        >
          <GraduationCap size={18} color={isSelected ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.schoolListName, isSelected && styles.schoolListNameSelected]} numberOfLines={2}>
            {item.name}
          </Text>
          {isSelected && <Check size={18} color={Colors.primary} />}
        </Pressable>
      );
    },
    [progress.stats.selectedSchoolName, handleSelectSchool, schoolUpdating]
  );

  const doChangeProfession = useCallback(
    async (p: ProfessionRow) => {
      if (!profile?.id) {
        Alert.alert('Error', 'You must be signed in to change profession.');
        return;
      }
      if (professionUpdating) return;

      setProfessionUpdating(true);
      try {
        const { error } = await supabase.rpc('set_my_profession', {
          p_profession_code: p.profession_code,
        });

        if (error) throw error;

        await refreshProfile();
        await fetchProfessionRows();

        setProfessionModalVisible(false);
        setProfessionSearchQuery('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e: any) {
        console.log('[Profile] set_my_profession error:', e);
        Alert.alert('Could not change profession', e?.message ?? String(e));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setProfessionUpdating(false);
      }
    },
    [profile?.id, professionUpdating, refreshProfile, fetchProfessionRows]
  );

  const handleSelectProfession = useCallback(
    (p: ProfessionRow) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const isSelected = !!p.is_my_profession || (myProfession?.profession_id ?? -1) === p.profession_id;
      if (isSelected) {
        setProfessionModalVisible(false);
        setProfessionSearchQuery('');
        return;
      }

      if (professionLocked) {
        Alert.alert(
          'Profession locked',
          `Your profession is locked for this month because you've already donated ${donatedThisMonth} coin${donatedThisMonth === 1 ? '' : 's'}.\n\nYou can change again after ${monthEndLabel ?? 'month end'}.`
        );
        return;
      }

      Alert.alert(
        'Change profession?',
        `Switch your profession to ${p.emoji} ${p.profession_name}?\n\nYou can change freely until you donate coins in the Profession Leaderboard for the month.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Change', onPress: () => doChangeProfession(p) },
        ]
      );
    },
    [doChangeProfession, donatedThisMonth, monthEndLabel, myProfession?.profession_id, professionLocked]
  );

  // ✅ This is the function your app said was missing
  const renderProfessionItem = useCallback(
    ({ item }: { item: ProfessionRow }) => {
      const isSelected =
        item.is_my_profession || (myProfession?.profession_id ?? -1) === item.profession_id;

      return (
        <Pressable
          style={[styles.schoolListItem, isSelected && styles.schoolListItemSelected]}
          onPress={() => handleSelectProfession(item)}
          disabled={professionUpdating}
          testID={`profession-${item.profession_code}`}
        >
          <Text style={styles.professionEmoji}>{item.emoji}</Text>
          <Text style={[styles.schoolListName, isSelected && styles.schoolListNameSelected]} numberOfLines={2}>
            {item.profession_name}
          </Text>
          {isSelected && <Check size={18} color={Colors.primary} />}
        </Pressable>
      );
    },
    [handleSelectProfession, myProfession?.profession_id, professionUpdating]
  );

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
        },
      },
    ]);
  }, [signOut]);

  // ---------------------------
  // Banner copy (derived)
  // ---------------------------
  const streakCurrent = useMemo(() => {
    const serverVal = streakStatus?.streak_current;
    if (Number.isFinite(serverVal as any)) return Number(serverVal);
    return Number(progress.stats.streakCurrent ?? 0);
  }, [streakStatus?.streak_current, progress.stats.streakCurrent]);

  const streakLongest = useMemo(() => {
    const serverVal = streakStatus?.streak_longest;
    return Number.isFinite(serverVal as any) ? Number(serverVal) : 0;
  }, [streakStatus?.streak_longest]);

  const secondsUntilReset = useMemo(() => {
    const now = new Date(nowTick);
    const nextUtcMidnight = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    );
    return Math.max(0, Math.floor((nextUtcMidnight - nowTick) / 1000));
  }, [nowTick]);

  const secondsLeft = useMemo(() => {
    if (streakStatus?.seconds_left != null && Number.isFinite(streakStatus.seconds_left as any)) {
      return Math.max(0, Number(streakStatus.seconds_left));
    }
    if (streakStatus?.deadline_at) {
      const t = new Date(streakStatus.deadline_at).getTime();
      if (Number.isFinite(t)) {
        return Math.max(0, Math.floor((t - nowTick) / 1000));
      }
    }
    return 0;
  }, [streakStatus?.seconds_left, streakStatus?.deadline_at, nowTick]);

  const banner = useMemo(() => {
    if (streakStatusLoading) {
      return {
        type: 'neutral' as const,
        title: 'Checking streak…',
        subtitle: 'Loading your streak status.',
        pill: '',
      };
    }
    if (streakStatusError) {
      return {
        type: 'neutral' as const,
        title: 'Streak',
        subtitle: 'Could not load streak status (pull to refresh later).',
        pill: '',
      };
    }

    const status = String(streakStatus?.status ?? '');

    if (status === 'extended') {
      return {
        type: 'good' as const,
        title: `Streak extended! 🔥 ${streakCurrent} day${streakCurrent === 1 ? '' : 's'}`,
        subtitle: `You're good for today. Come back in ${formatCountdown(secondsUntilReset)} to extend again (UTC reset).`,
        pill: formatCountdown(secondsUntilReset),
      };
    }

    if (status === 'at_risk') {
      return {
        type: 'warn' as const,
        title: `Keep your streak today`,
        subtitle: `Complete a lesson or quiz before the day ends to keep your ${streakCurrent}‑day streak.`,
        pill: formatCountdown(secondsLeft),
      };
    }

    return {
      type: 'bad' as const,
      title: streakLongest > 0 ? 'Streak paused' : 'Start your streak',
      subtitle:
        streakLongest > 0
          ? `Longest: ${streakLongest} days. Earn XP today to start again.`
          : 'Earn XP today to start your first streak.',
      pill: '',
    };
  }, [
    streakStatus?.status,
    streakStatusLoading,
    streakStatusError,
    streakCurrent,
    streakLongest,
    secondsUntilReset,
    secondsLeft,
  ]);

  const bannerColors = useMemo(() => {
    if (banner.type === 'good') {
      return {
        bg: Colors.surface,
        border: Colors.success + '55',
        icon: Colors.success,
        chip: Colors.successLight,
      };
    }
    if (banner.type === 'warn') {
      return {
        bg: Colors.surface,
        border: Colors.warning + '55',
        icon: Colors.warning,
        chip: Colors.warningLight,
      };
    }
    if (banner.type === 'bad') {
      return {
        bg: Colors.surface,
        border: Colors.error + '55',
        icon: Colors.error,
        chip: Colors.errorLight,
      };
    }
    return {
      bg: Colors.surface,
      border: Colors.surfaceAlt,
      icon: Colors.primaryDark,
      chip: Colors.primaryLight,
    };
  }, [banner.type]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.avatarContainer}>
          <MascotAnimated mood="happy" size={80} />
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{progress.level}</Text>
          </View>
        </View>
        <Text style={styles.profileTitle}>{profile?.display_name ?? profile?.username ?? 'Pharmacy Student'}</Text>
        <Text style={styles.profileSubtitle}>
          Level {progress.level} • {progress.stats.xpTotal} XP
        </Text>

        <View style={styles.headerStatsRow}>
          <View style={styles.headerStat}>
            <View style={styles.headerStatIcon}>
              <StreakFlameIcon size={20} />
            </View>
            <Text style={styles.headerStatValue}>{streakCurrent}</Text>
            <Text style={styles.headerStatLabel}>Streak</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <View style={styles.headerStatIcon}>
              <Target size={16} color={Colors.primaryDark} strokeWidth={2.6} />
            </View>
            <Text style={styles.headerStatValue}>{accuracy}%</Text>
            <Text style={styles.headerStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <View style={styles.headerStatIcon}>
              <BookOpen size={16} color="#8B5CF6" strokeWidth={2.6} />
            </View>
            <Text style={styles.headerStatValue}>{totalLessonsCompleted}</Text>
            <Text style={styles.headerStatLabel}>Lessons</Text>
          </View>
        </View>

        <View style={[styles.streakBanner, { backgroundColor: bannerColors.bg, borderColor: bannerColors.border }]}>
          <View style={styles.streakBannerLeft}>
            <View style={[styles.streakBannerIconBg, { backgroundColor: bannerColors.chip }]}>
              {streakStatusLoading ? (
                <ActivityIndicator size="small" color={bannerColors.icon} />
              ) : (
                <Clock size={18} color={bannerColors.icon} />
              )}
            </View>
            <View style={styles.streakBannerText}>
              <Text style={styles.streakBannerTitle}>{banner.title}</Text>
              <Text style={styles.streakBannerSubtitle}>{banner.subtitle}</Text>
            </View>
          </View>

          {banner.pill ? (
            <View style={[styles.streakBannerPill, { backgroundColor: bannerColors.chip }]}>
              <Text style={styles.streakBannerPillText}>{banner.pill}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profession */}
        <Pressable
          style={styles.schoolCard}
          onPress={() => {
            setProfessionModalVisible(true);
            fetchProfessionRows();
          }}
          testID="choose-profession-button"
        >
          <View style={styles.schoolCardIcon}>
            <Text style={styles.professionCardEmoji}>{myProfession?.emoji ?? '👤'}</Text>
          </View>
          <View style={styles.schoolCardInfo}>
            <Text style={styles.schoolCardLabel}>Profession</Text>
            <Text style={styles.schoolCardValue} numberOfLines={1}>
              {professionLoading ? 'Loading…' : myProfession?.profession_name ?? 'Tap to select your profession'}
            </Text>
            <Text
              style={professionLocked ? styles.professionLockedText : styles.professionHelperText}
              numberOfLines={1}
            >
              {professionLocked
                ? `Locked until ${monthEndLabel ?? 'month end'} • Donated ${donatedThisMonth}`
                : 'Sets which Profession you represent on the monthly leaderboard.'}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </Pressable>

        {/* School */}
        <Pressable
          style={styles.schoolCard}
          onPress={() => setSchoolModalVisible(true)}
          testID="choose-school-button"
        >
          <View style={styles.schoolCardIcon}>
            <GraduationCap size={22} color={progress.stats.selectedSchoolId ? Colors.primary : Colors.textSecondary} />
          </View>
          <View style={styles.schoolCardInfo}>
            <Text style={styles.schoolCardLabel}>
              {progress.stats.selectedSchoolId ? 'Your School' : 'Choose School'}
            </Text>
            <Text style={styles.schoolCardValue} numberOfLines={1}>
              {progress.stats.selectedSchoolName ?? 'Tap to select your school'}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </Pressable>

        {/* (rest of your screen unchanged) */}
        {/* ... */}
        <Pressable style={styles.signOutButton} onPress={handleSignOut} testID="sign-out-button">
          <LogOut size={18} color={Colors.textSecondary} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Profession Modal */}
      <Modal
        visible={professionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setProfessionModalVisible(false);
          setProfessionSearchQuery('');
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Profession</Text>
            <Pressable
              onPress={() => {
                setProfessionModalVisible(false);
                setProfessionSearchQuery('');
              }}
              style={styles.modalCloseBtn}
            >
              <X size={20} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Search size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search professions..."
              placeholderTextColor={Colors.textTertiary}
              value={professionSearchQuery}
              onChangeText={setProfessionSearchQuery}
              autoCorrect={false}
            />
          </View>

          <View style={styles.privacyBanner}>
            <Text style={styles.privacyBannerText}>
              {professionLocked
                ? `Locked: you donated ${donatedThisMonth} coin${donatedThisMonth === 1 ? '' : 's'} this month. Locked until ${monthEndLabel ?? 'month end'}.`
                : 'Pick the profession you represent on the monthly Profession Leaderboard. You can change anytime until you donate coins for the month.'}
            </Text>
          </View>

          {professionError ? (
            <View style={styles.smallErrorBanner}>
              <Text style={styles.smallErrorText}>{professionError}</Text>
            </View>
          ) : null}

          {professionLoading ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredProfessions}
              renderItem={renderProfessionItem}
              keyExtractor={(item) => String(item.profession_id)}
              contentContainerStyle={styles.schoolList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>No professions found</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* School Modal */}
      <Modal
        visible={schoolModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSchoolModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose School</Text>
            <Pressable
              onPress={() => {
                setSchoolModalVisible(false);
                setSearchQuery('');
              }}
              style={styles.modalCloseBtn}
            >
              <X size={20} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Search size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search schools..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>

          <View style={styles.privacyBanner}>
            <Text style={styles.privacyBannerText}>School is optional and only affects leaderboards.</Text>
          </View>

          <FlatList
            data={filteredSchools}
            renderItem={renderSchoolItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.schoolList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No schools found</Text>
              </View>
            }
          />

          {progress.stats.selectedSchoolId && (
            <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable style={styles.clearSchoolBtn} onPress={handleClearSchool} disabled={schoolUpdating}>
                <Text style={styles.clearSchoolText}>Remove School</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { alignItems: 'center', paddingBottom: 18, paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  levelText: { fontSize: 12, fontWeight: '900' as const, color: Colors.primaryDark },
  profileTitle: { fontSize: 24, fontWeight: '900' as const, color: '#FFFFFF' },
  profileSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: '700' as const },

  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    backgroundColor: 'rgba(240, 249, 255, 0.34)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.95)',
=======
    backgroundColor: 'rgba(240, 249, 255, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
>>>>>>> 886717ede766810c2c94fee0f788e2a965d02e87
    borderRadius: 20,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
  },
  headerStat: { flex: 1, alignItems: 'center', gap: 4 },
  headerStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
<<<<<<< HEAD
    backgroundColor: 'rgba(240, 249, 255, 0.26)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.90)',
=======
    backgroundColor: 'rgba(240, 249, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.70)',
>>>>>>> 886717ede766810c2c94fee0f788e2a965d02e87
  },
  headerStatValue: { fontSize: 20, fontWeight: '900' as const, color: '#FFFFFF' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.82)', fontWeight: '700' as const },
  headerStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },

  streakBanner: {
    marginTop: 12,
    width: '100%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  streakBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  streakBannerIconBg: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  streakBannerText: { flex: 1 },
  streakBannerTitle: { fontSize: 13, fontWeight: '900' as const, color: Colors.text },
  streakBannerSubtitle: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, marginTop: 2, lineHeight: 15 },
  streakBannerPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, minWidth: 82, alignItems: 'center', justifyContent: 'center' },
  streakBannerPillText: { fontSize: 12, fontWeight: '900' as const, color: Colors.text, fontVariant: ['tabular-nums'] as const },

  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },

  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  schoolCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolCardInfo: { flex: 1, marginLeft: 14 },
  schoolCardLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  schoolCardValue: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginTop: 2 },

  professionCardEmoji: { fontSize: 22 },
  professionHelperText: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' as const, marginTop: 4 },
  professionLockedText: { fontSize: 12, color: Colors.warning, fontWeight: '700' as const, marginTop: 4 },

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  signOutText: { fontSize: 15, fontWeight: '700' as const, color: Colors.textSecondary },

  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceAlt,
  },
  modalTitle: { fontSize: 20, fontWeight: '900' as const, color: Colors.text },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, fontWeight: '500' as const, color: Colors.text },

  privacyBanner: { marginHorizontal: 20, marginTop: 12, backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  privacyBannerText: { fontSize: 12, fontWeight: '600' as const, color: Colors.primary, textAlign: 'center' },

  smallErrorBanner: { marginHorizontal: 20, marginTop: 10, backgroundColor: Colors.errorLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.error },
  smallErrorText: { fontSize: 12, fontWeight: '700' as const, color: Colors.error, textAlign: 'center' },

  schoolList: { padding: 20, paddingBottom: 100 },
  schoolListItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.surfaceAlt },
  schoolListItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  schoolListName: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  schoolListNameSelected: { color: Colors.primary, fontWeight: '700' as const },

  professionEmoji: { fontSize: 18, width: 24, textAlign: 'center' },

  emptySearch: { alignItems: 'center', paddingVertical: 40 },
  emptySearchText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textTertiary },

  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
  },
  clearSchoolBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: Colors.error },
  clearSchoolText: { fontSize: 15, fontWeight: '700' as const, color: Colors.error },
});
