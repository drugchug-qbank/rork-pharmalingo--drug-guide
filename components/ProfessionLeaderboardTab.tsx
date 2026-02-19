import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Crown, Medal, Coins, Sparkles, Timer, RefreshCw } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';

const ELIGIBILITY_MIN = 100;

type ProfessionRow = {
  profession_id: number;
  profession_code: string;
  profession_name: string;
  emoji: string | null;
  total_donated: number;
  rank: number;
  is_my_profession: boolean;
};

type MyDonationRow = {
  month_start: string;
  profession_id: number | null;
  profession_code: string | null;
  profession_name: string | null;
  my_total_donated: number;
  profession_total_donated: number;
};

function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatEndsInToMonthEnd(): string {
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1); // next month start (exclusive)
  const diff = monthEnd.getTime() - now.getTime();

  if (diff <= 0) return 'Ends soon';

  const totalMins = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;

  if (days > 0) return `Ends in ${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `Ends in ${hours}h ${mins}m`;
  return `Ends in ${mins}m`;
}

/**
 * Slider that works on iOS/Android/Web without extra deps.
 * Drag anywhere on the track.
 */
function CoinSlider({
  max,
  value,
  onChange,
  disabled,
}: {
  max: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [trackWidth, setTrackWidth] = useState(0);

  const pct = useMemo(() => {
    if (!max) return 0;
    return Math.min(1, Math.max(0, value / max));
  }, [value, max]);

  const fillWidth = useMemo(() => {
    return trackWidth * pct;
  }, [trackWidth, pct]);

  const updateFromTouch = useCallback(
    (evt: any) => {
      if (disabled) return;
      if (trackWidth <= 0 || max <= 0) return;

      const x = safeNum(evt?.nativeEvent?.locationX);
      const clamped = Math.min(trackWidth, Math.max(0, x));
      const next = Math.round((clamped / trackWidth) * max);
      onChange(next);
    },
    [disabled, trackWidth, max, onChange]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: (_evt, g) => {
          if (disabled) return false;
          // capture mostly-horizontal drags so ScrollView still scrolls vertically
          return Math.abs(g.dx) > Math.abs(g.dy);
        },
        onPanResponderGrant: (evt) => updateFromTouch(evt),
        onPanResponderMove: (evt) => updateFromTouch(evt),
      }),
    [disabled, updateFromTouch]
  );

  return (
    <View
      style={[styles.sliderTrack, disabled && { opacity: 0.5 }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={[styles.sliderFill, { width: fillWidth }]} />
      <View style={[styles.sliderThumb, { left: fillWidth }]} />
    </View>
  );
}

export default function ProfessionLeaderboardTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  // Use "as any" so this file won’t break if your context typings differ
  const progressCtx = useProgress() as any;
  const progress = progressCtx.progress;
  const spendCoins: undefined | ((amount: number, reason?: string) => void) = progressCtx.spendCoins;

  const coinsAvailable = Math.max(0, safeNum(progress?.stats?.coins));

  const [endsIn, setEndsIn] = useState<string>(formatEndsInToMonthEnd());
  const [donateAmount, setDonateAmount] = useState<number>(0);
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setEndsIn(formatEndsInToMonthEnd()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // keep slider value valid if coins change
    if (donateAmount > coinsAvailable) setDonateAmount(coinsAvailable);
  }, [coinsAvailable, donateAmount]);

  const leaderboardQuery = useQuery<ProfessionRow[]>({
    queryKey: ['profession', 'leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profession_leaderboard');
      if (error) throw error;
      return (data ?? []) as any;
    },
    enabled: !!session,
    staleTime: 15_000,
    retry: 1,
  });

  const myDonationQuery = useQuery<MyDonationRow | null>({
    queryKey: ['profession', 'my_donation'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_profession_month_donation');
      if (error) throw error;
      return ((data as any)?.[0] ?? null) as any;
    },
    enabled: !!session,
    staleTime: 10_000,
    retry: 1,
  });

  const myProfessionName = myDonationQuery.data?.profession_name ?? null;
  const myTotalDonated = safeNum(myDonationQuery.data?.my_total_donated);
  const neededToQualify = Math.max(0, ELIGIBILITY_MIN - myTotalDonated);
  const eligible = myTotalDonated >= ELIGIBILITY_MIN;

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['profession'] });
  }, [queryClient]);

  const handleDonate = useCallback(async () => {
    if (!session) return;

    if (!myDonationQuery.data?.profession_id) {
      Alert.alert('Pick a profession', 'Choose your profession in Profile first.');
      router.push('/(tabs)/profile');
      return;
    }

    if (donateAmount <= 0) {
      Alert.alert('Donate coins', 'Move the slider to choose an amount > 0.');
      return;
    }

    if (donateAmount > coinsAvailable) {
      Alert.alert('Not enough coins', `You only have ${coinsAvailable} coins.`);
      return;
    }

    setDonating(true);
    try {
      const { data, error } = await supabase.rpc('donate_profession_coins', { p_amount: donateAmount });
      if (error) throw error;

      const ok = (data as any)?.ok === true;
      if (!ok) {
        Alert.alert('Donation failed', 'Please try again.');
        return;
      }

      // Update local coin UI (your app shows coins from ProgressContext)
      if (typeof spendCoins === 'function') {
        spendCoins(donateAmount, 'profession_donation');
      }

      setDonateAmount(0);
      refreshAll();
    } catch (e: any) {
      Alert.alert('Could not donate', e?.message ?? String(e));
    } finally {
      setDonating(false);
    }
  }, [session, myDonationQuery.data, donateAmount, coinsAvailable, router, refreshAll, spendCoins]);

  // ---------------- UI states ----------------
  if (leaderboardQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.centerText}>Loading Profession Battle…</Text>
      </View>
    );
  }

  if (leaderboardQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Couldn’t load Profession Battle</Text>
        <Text style={styles.errorSub}>{(leaderboardQuery.error as any)?.message ?? 'Unknown error'}</Text>

        <Pressable style={styles.retryBtn} onPress={() => leaderboardQuery.refetch()}>
          <RefreshCw size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const rows = leaderboardQuery.data ?? [];

  return (
    <View>
      {/* ===================== PROFESSION BATTLE CARD ===================== */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBadge}>
              <Briefcase size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Profession Battle</Text>
              <Text style={styles.cardSub}>Boost your profession’s monthly score</Text>
            </View>
          </View>

          <View style={styles.endsPill}>
            <Timer size={14} color={Colors.textSecondary} />
            <Text style={styles.endsText}>{endsIn}</Text>
          </View>
        </View>

        {/* Rewards (more gameified, fewer words) */}
        <View style={styles.rewardsRow}>
          <LinearGradient colors={['#FFE8A3', '#FFD36B']} style={styles.rewardTile}>
            <Crown size={18} color="#8A5A00" />
            <Text style={styles.rewardRank}>1st</Text>
            <View style={styles.rewardCoinsRow}>
              <Coins size={14} color="#8A5A00" />
              <Text style={styles.rewardCoinsText}>+500</Text>
            </View>
          </LinearGradient>

          <LinearGradient colors={['#E5E7EB', '#CBD5E1']} style={styles.rewardTile}>
            <Medal size={18} color="#374151" />
            <Text style={styles.rewardRank}>2nd</Text>
            <View style={styles.rewardCoinsRow}>
              <Coins size={14} color="#374151" />
              <Text style={styles.rewardCoinsText}>+250</Text>
            </View>
          </LinearGradient>

          <LinearGradient colors={['#F7D6B8', '#E9A97A']} style={styles.rewardTile}>
            <Sparkles size={18} color="#7C2D12" />
            <Text style={styles.rewardRank}>3rd</Text>
            <View style={styles.rewardCoinsRow}>
              <Coins size={14} color="#7C2D12" />
              <Text style={styles.rewardCoinsText}>+100</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.rewardHint}>Eligibility: donate at least {ELIGIBILITY_MIN} coins total this month.</Text>
      </View>

      {/* ===================== YOUR CONTRIBUTION ===================== */}
      <View style={[styles.card, styles.contributionCard]}>
        <View style={styles.contributionHeader}>
          <Text style={styles.sectionTitle}>Your Contribution</Text>

          <Pressable style={styles.pickProfBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.pickProfBtnText}>Pick profession in Profile</Text>
          </Pressable>
        </View>

        <Text style={styles.mutedSmall}>You represent</Text>
        <Text style={styles.bigName} numberOfLines={1}>
          {myProfessionName ?? '—'}
        </Text>

        <View style={styles.statPillsRow}>
          <View style={styles.statPill}>
            <Coins size={14} color={Colors.textSecondary} />
            <Text style={styles.statPillText}>{coinsAvailable} coins</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statPillText}>Donated: {myTotalDonated}</Text>
          </View>

          <View style={[styles.statPill, neededToQualify > 0 ? styles.needPill : styles.okPill]}>
            <Text style={[styles.statPillText, neededToQualify > 0 ? styles.needText : styles.okText]}>
              {neededToQualify > 0 ? `Need ${neededToQualify} more` : 'Eligible ✅'}
            </Text>
          </View>
        </View>

        {/* progress bar to eligibility */}
        <View style={styles.eligibilityBar}>
          <View
            style={[
              styles.eligibilityFill,
              { width: `${Math.min(100, (myTotalDonated / ELIGIBILITY_MIN) * 100)}%` },
              eligible && { backgroundColor: '#22C55E' },
            ]}
          />
        </View>

        <Text style={styles.sliderHint}>
          Slide to choose how many coins to donate (0 – {coinsAvailable}).
        </Text>

        <CoinSlider
          max={coinsAvailable}
          value={donateAmount}
          onChange={setDonateAmount}
          disabled={coinsAvailable <= 0 || !myDonationQuery.data?.profession_id}
        />

        <View style={styles.sliderMetaRow}>
          <Text style={styles.sliderMeta}>0</Text>
          <Text style={styles.sliderMeta}>Selected: {donateAmount}</Text>
          <Text style={styles.sliderMeta}>{coinsAvailable}</Text>
        </View>

        <Pressable
          style={[styles.donateBtn, (donateAmount <= 0 || donating) && { opacity: 0.6 }]}
          disabled={donateAmount <= 0 || donating}
          onPress={handleDonate}
        >
          {donating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Coins size={16} color="#fff" />
          )}
          <Text style={styles.donateBtnText}>Donate {donateAmount} coins</Text>
        </Pressable>
      </View>

      {/* ===================== RANKINGS ===================== */}
      <View style={styles.rankingsBlock}>
        <Text style={styles.sectionTitle}>Rankings</Text>

        {rows.map((r) => (
          <View
            key={r.profession_code ?? String(r.profession_id)}
            style={[styles.rankRow, r.is_my_profession && styles.rankRowMine]}
          >
            <View style={styles.rankLeft}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankCircleText}>{r.rank}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.rankName} numberOfLines={1}>
                  {r.emoji ? `${r.emoji} ` : ''}{r.profession_name}
                  {r.is_my_profession ? ' • You' : ''}
                </Text>
                <Text style={styles.rankSub}>{r.total_donated.toLocaleString()} donated</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  centerText: { fontSize: 13, fontWeight: '700' as const, color: Colors.textSecondary },
  errorTitle: { fontSize: 16, fontWeight: '900' as const, color: Colors.text },
  errorSub: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, textAlign: 'center' as const, paddingHorizontal: 18 },

  retryBtn: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '900' as const },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginBottom: 12,
  },

  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },

  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },

  cardTitle: { fontSize: 15, fontWeight: '900' as const, color: Colors.text },
  cardSub: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, marginTop: 2 },

  endsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  endsText: { fontSize: 12, fontWeight: '800' as const, color: Colors.textSecondary },

  rewardsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rewardTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  rewardRank: { fontSize: 12, fontWeight: '900' as const, color: '#111827' },
  rewardCoinsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rewardCoinsText: { fontSize: 14, fontWeight: '900' as const, color: '#111827' },
  rewardHint: { marginTop: 10, fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary },

  contributionCard: {
    borderColor: Colors.primary + '55',
    borderWidth: 1.5,
  },
  contributionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '900' as const, color: Colors.text },

  pickProfBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  pickProfBtnText: { fontSize: 11, fontWeight: '900' as const, color: Colors.primary },

  mutedSmall: { marginTop: 10, fontSize: 12, fontWeight: '700' as const, color: Colors.textTertiary },
  bigName: { marginTop: 2, fontSize: 18, fontWeight: '900' as const, color: Colors.text },

  statPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statPillText: { fontSize: 12, fontWeight: '800' as const, color: Colors.textSecondary },

  needPill: { borderColor: '#F59E0B55', backgroundColor: '#FFFBEB' },
  needText: { color: '#B45309' },
  okPill: { borderColor: '#22C55E55', backgroundColor: '#F0FDF4' },
  okText: { color: '#166534' },

  eligibilityBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: 10,
  },
  eligibilityFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },

  sliderHint: { marginTop: 12, fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary },

  sliderTrack: {
    marginTop: 10,
    height: 14,
    borderRadius: 999,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: '100%',
    backgroundColor: Colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.primary,
    top: -6,
    transform: [{ translateX: -12 }],
  },

  sliderMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sliderMeta: { fontSize: 12, fontWeight: '800' as const, color: Colors.textTertiary },

  donateBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  donateBtnText: { color: '#fff', fontWeight: '900' as const, fontSize: 14 },

  rankingsBlock: { marginTop: 4 },

  rankRow: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginTop: 8,
  },
  rankRowMine: {
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.primaryLight + '55',
  },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankCircleText: { fontSize: 12, fontWeight: '900' as const, color: Colors.textSecondary },

  rankName: { fontSize: 14, fontWeight: '900' as const, color: Colors.text },
  rankSub: { marginTop: 3, fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary },
});
