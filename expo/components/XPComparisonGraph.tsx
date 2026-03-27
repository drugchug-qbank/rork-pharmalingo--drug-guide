import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/utils/supabase';

type XpInput = number[] | number | null | undefined;

interface XPComparisonGraphProps {
  yourXp: XpInput;      // can be number OR number[]
  friendXp: XpInput;    // can be number OR number[]
  friendName: string;   // we will treat this as username or display_name
}

function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sum(arr: number[]): number {
  return arr.reduce((acc, v) => acc + safeNum(v), 0);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatMMDD(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

function makeLastNDaysLabels(n: number): { dow: string; mmdd: string }[] {
  // Oldest -> newest, ending today (LOCAL days)
  const labels: { dow: string; mmdd: string }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (n - 1));

  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    labels.push({
      dow: DAY_NAMES[d.getDay()] ?? '',
      mmdd: formatMMDD(d),
    });
  }
  return labels;
}

export default React.memo(function XPComparisonGraph({
  yourXp,
  friendXp,
  friendName,
}: XPComparisonGraphProps) {
  const animProgress = useRef(new Animated.Value(0)).current;

  // If we are NOT receiving arrays, we will fetch last-7-days from Supabase.
  const needsRemoteDaily = !(Array.isArray(yourXp) && Array.isArray(friendXp));

  const [remote, setRemote] = useState<{
    labels: { dow: string; mmdd: string }[];
    yourSeries: number[];
    friendSeries: number[];
  } | null>(null);

  const [remoteLoading, setRemoteLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchDailyBreakdown() {
      if (!needsRemoteDaily) {
        // If caller already provides arrays, we don't need RPC.
        setRemote(null);
        return;
      }

      const raw = (friendName ?? '').trim();
      const cleaned = raw.startsWith('@') ? raw.slice(1) : raw;

      if (!cleaned) {
        setRemote(null);
        return;
      }

      // Start = local midnight (today - 6 days)
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      const startISO = start.toISOString();

      // Build a stable 7-day axis (LOCAL dates) so the chart stays correct even if the
      // backend ever returns <7 rows or returns rows out of order.
      const axisLabels = makeLastNDaysLabels(7);

      // Map YYYY-MM-DD -> index (0..6)
      const dateKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const axisIndex = new Map<string, number>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const k = dateKey(d);
        axisIndex.set(k, i);
      }

      setRemoteLoading(true);

      try {
        const { data, error } = await supabase.rpc('get_xp_comparison_7d', {
          p_friend_username: cleaned,
          p_start: startISO,
        });

        if (error) throw error;

        const rows = Array.isArray(data) ? data : [];

        // Initialize to 0 for all 7 days
        const yourSeries = new Array<number>(7).fill(0);
        const friendSeries = new Array<number>(7).fill(0);

        for (const r of rows) {
          const ts = (r as any)?.day_start;
          const d = ts ? new Date(ts) : null;
          if (!d) continue;
          const idx = axisIndex.get(dateKey(d));
          if (idx == null) continue;
          yourSeries[idx] = safeNum((r as any)?.your_xp);
          friendSeries[idx] = safeNum((r as any)?.friend_xp);
        }

        if (!cancelled) {
          setRemote({ labels: axisLabels, yourSeries, friendSeries });
        }
      } catch (e: any) {
        console.log('[XPComparisonGraph] Daily breakdown RPC failed:', e?.message ?? e);
        if (!cancelled) setRemote(null);
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    }

    fetchDailyBreakdown();
    return () => { cancelled = true; };
  }, [friendName, needsRemoteDaily, yourXp, friendXp]);

  const { labels, yourSeries, friendSeries, yourTotal, friendTotal, isDaily } = useMemo(() => {
    // 1) Best: remote daily series (7 days)
    if (remote && remote.yourSeries.length === 7 && remote.friendSeries.length === 7) {
      const y = remote.yourSeries.map(safeNum);
      const f = remote.friendSeries.map(safeNum);
      return {
        labels: remote.labels.length === 7 ? remote.labels : makeLastNDaysLabels(7),
        yourSeries: y,
        friendSeries: f,
        yourTotal: sum(y),
        friendTotal: sum(f),
        isDaily: true,
      };
    }

    // 2) If arrays were passed in, show last 7 values with last-7-days labels
    if (Array.isArray(yourXp) && Array.isArray(friendXp)) {
      const n = Math.min(7, yourXp.length, friendXp.length);
      const y = yourXp.slice(-n).map(safeNum);
      const f = friendXp.slice(-n).map(safeNum);
      return {
        labels: makeLastNDaysLabels(n),
        yourSeries: y,
        friendSeries: f,
        yourTotal: sum(y),
        friendTotal: sum(f),
        isDaily: n > 1,
      };
    }

    // 3) Fallback: weekly totals (1 bar)
    const yTotal = Array.isArray(yourXp) ? sum(yourXp) : safeNum(yourXp);
    const fTotal = Array.isArray(friendXp) ? sum(friendXp) : safeNum(friendXp);

    return {
      labels: [{ dow: 'WEEK', mmdd: '' }],
      yourSeries: [yTotal],
      friendSeries: [fTotal],
      yourTotal: yTotal,
      friendTotal: fTotal,
      isDaily: false,
    };
  }, [remote, yourXp, friendXp]);

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [friendName, yourTotal, friendTotal, animProgress]);

  const allValues = [...yourSeries, ...friendSeries];
  const maxVal = Math.max(...allValues, 1);
  const maxBarHeight = 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {isDaily ? 'Daily XP (Last 7 Days)' : 'Weekly XP Comparison'}
          </Text>

          {remoteLoading && (
            <View style={styles.loadingPill}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Updating</Text>
            </View>
          )}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>You ({yourTotal})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
            <Text style={styles.legendText}>{friendName} ({friendTotal})</Text>
          </View>
        </View>
      </View>

      <View style={styles.graphArea}>
        {labels.map((label, i) => {
          const y = safeNum(yourSeries[i] ?? 0);
          const f = safeNum(friendSeries[i] ?? 0);

          const yourHeight = (y / maxVal) * maxBarHeight;
          const friendHeight = (f / maxVal) * maxBarHeight;

          const animatedYourHeight = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, yourHeight],
          });
          const animatedFriendHeight = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, friendHeight],
          });

          return (
            <View key={`${label.dow}-${label.mmdd}-${i}`} style={styles.barGroup}>
              <View style={styles.barsRow}>
                <Animated.View
                  style={[
                    styles.bar,
                    styles.yourBar,
                    { height: animatedYourHeight },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.bar,
                    styles.friendBar,
                    { height: animatedFriendHeight },
                  ]}
                />
              </View>

              {/* Two-line label: DOW then MM/DD */}
              <Text style={styles.dayLabelTop}>{label.dow}</Text>
              {!!label.mmdd && <Text style={styles.dayLabelBottom}>{label.mmdd}</Text>}
            </View>
          );
        })}
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, yourTotal >= friendTotal && styles.winnerCard]}>
          <Text style={styles.summaryLabel}>You</Text>
          <Text style={[styles.summaryValue, yourTotal >= friendTotal && styles.winnerValue]}>
            {yourTotal} XP
          </Text>
        </View>
        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <View style={[styles.summaryCard, friendTotal > yourTotal && styles.winnerCardFriend]}>
          <Text style={styles.summaryLabel}>{friendName}</Text>
          <Text style={[styles.summaryValue, friendTotal > yourTotal && styles.winnerValueFriend]}>
            {friendTotal} XP
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    flex: 1,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  graphArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 142, // a bit taller to fit the extra date line
    paddingTop: 20,
    marginBottom: 16,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    flex: 1,
  },
  bar: {
    width: 10,
    borderRadius: 4,
    minHeight: 4,
  },
  yourBar: {
    backgroundColor: Colors.primary,
  },
  friendBar: {
    backgroundColor: Colors.accent,
    opacity: 0.7,
  },
  dayLabelTop: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '800' as const,
    marginTop: 6,
  },
  dayLabelBottom: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontWeight: '700' as const,
    marginTop: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  winnerCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  winnerCardFriend: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.text,
    marginTop: 2,
  },
  winnerValue: {
    color: Colors.primary,
  },
  winnerValueFriend: {
    color: Colors.accent,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
});
