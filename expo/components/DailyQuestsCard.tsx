import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Swords, Coins, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DailyQuest } from '@/constants/types';

type Props = {
  quests: DailyQuest[];
  onClaim: (questId: number) => boolean;
};

// Enable LayoutAnimation on Android (safe no-op elsewhere)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function Dot({ filled }: { filled: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: filled ? Colors.success : Colors.border },
      ]}
    />
  );
}

export default function DailyQuestsCard({ quests, onClaim }: Props) {
  const completedCount = useMemo(() => quests.filter(q => q.completed).length, [quests]);
  const allCompleted = useMemo(() => quests.length > 0 && completedCount === quests.length, [quests.length, completedCount]);

  const claimableCount = useMemo(
    () => quests.filter(q => q.completed && !q.claimed).length,
    [quests]
  );

  const hasAnyCollapsed = useMemo(
    () => quests.some(q => q.completed && q.claimed),
    [quests]
  );

  // When false, completed+claimed rows collapse.
  const [showCompletedDetails, setShowCompletedDetails] = useState<boolean>(false);

  // If user has something to claim, we force details open so claim buttons remain visible.
  useEffect(() => {
    if (claimableCount > 0) {
      setShowCompletedDetails(true);
    }
  }, [claimableCount]);

  const headerSubtitle = useMemo(() => {
    if (claimableCount > 0) return `You have ${claimableCount} reward${claimableCount === 1 ? '' : 's'} to claim`;
    if (allCompleted) return showCompletedDetails ? 'All complete! Come back tomorrow' : 'All complete • Tap to expand';
    return 'Complete quests to earn bonus coins';
  }, [claimableCount, allCompleted, showCompletedDetails]);

  const toggleCompletedDetails = useCallback(() => {
    if (!hasAnyCollapsed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCompletedDetails(prev => !prev);
  }, [hasAnyCollapsed]);

  const handleClaim = useCallback(
    (questId: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ok = onClaim(questId);
      if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    [onClaim]
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <Pressable
        onPress={toggleCompletedDetails}
        disabled={!hasAnyCollapsed}
        style={({ pressed }) => [
          styles.headerRow,
          pressed && hasAnyCollapsed && { opacity: 0.9 },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Swords size={18} color={Colors.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Daily Quests</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.dotsRow}>
            <Dot filled={completedCount >= 1} />
            <Dot filled={completedCount >= 2} />
            <Dot filled={completedCount >= 3} />
          </View>

          {hasAnyCollapsed ? (
            <View style={styles.chevronWrap}>
              {showCompletedDetails ? (
                <ChevronUp size={18} color={Colors.textSecondary} />
              ) : (
                <ChevronDown size={18} color={Colors.textSecondary} />
              )}
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* Quest rows */}
      <View style={styles.rows}>
        {quests.map((q, idx) => {
          const isCollapsedRow = q.completed && q.claimed && !showCompletedDetails;

          return (
            <View
              key={q.id}
              style={[
                styles.row,
                idx !== quests.length - 1 && styles.rowDivider,
                isCollapsedRow && styles.rowCompact,
              ]}
            >
              {/* Left status icon */}
              <View style={[
                styles.statusIcon,
                q.completed ? styles.statusIconDone : styles.statusIconTodo,
              ]}>
                {q.completed ? (
                  <CheckCircle2 size={18} color={Colors.success} />
                ) : (
                  <Circle size={18} color={Colors.textTertiary} />
                )}
              </View>

              {/* Main content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.questTitle,
                    q.completed && q.claimed && !showCompletedDetails && { color: Colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {q.title}
                </Text>

                {!isCollapsedRow ? (
                  <>
                    <Text style={styles.questDesc} numberOfLines={2}>
                      {q.description}
                    </Text>

                    <View style={styles.progressRow}>
                      <Text style={styles.progressText}>
                        {Math.min(q.current, q.target)}/{q.target}
                      </Text>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min((q.current / q.target) * 100, 100)}%`,
                              backgroundColor: q.completed ? Colors.success : Colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Right actions */}
              <View style={styles.rightCol}>
                {q.completed && !q.claimed ? (
                  <Pressable
                    onPress={() => handleClaim(q.id)}
                    style={({ pressed }) => [
                      styles.claimBtn,
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                    testID={`quest-claim-${q.id}`}
                  >
                    <Coins size={14} color={Colors.gold} />
                    <Text style={styles.claimText}>+{q.reward}</Text>
                  </Pressable>
                ) : q.claimed ? (
                  <View style={styles.claimedPill}>
                    <CheckCircle2 size={14} color={Colors.success} />
                    <Text style={styles.claimedText}>Claimed</Text>
                  </View>
                ) : (
                  <View style={styles.rewardPill}>
                    <Coins size={14} color={Colors.gold} />
                    <Text style={styles.rewardText}>+{q.reward}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Small helper (only when collapsed rows exist) */}
      {hasAnyCollapsed ? (
        <Text style={styles.footerHint}>
          {showCompletedDetails ? 'Hide completed quests to save space' : 'Tap to show completed quest details'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rows: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rowCompact: {
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceAlt,
  },

  statusIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconDone: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  statusIconTodo: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  questTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  questDesc: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  progressText: {
    width: 44,
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textTertiary,
    textAlign: 'right' as const,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },

  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#92400E',
  },

  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  claimText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },

  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.success,
  },

  footerHint: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
});
