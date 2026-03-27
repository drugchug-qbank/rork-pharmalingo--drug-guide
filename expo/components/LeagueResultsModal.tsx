import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { Trophy, TrendingUp, TrendingDown, Minus, Zap, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { LeagueWeekResult, LeagueTier } from '@/constants/types';

interface LeagueResultsModalProps {
  visible: boolean;
  result: LeagueWeekResult | null;
  onDismiss: () => void;
}

const TIER_CONFIG: Record<LeagueTier, { color: string; bg: string; emoji: string }> = {
  Bronze: { color: '#CD7F32', bg: '#FDF2E9', emoji: '🥉' },
  Silver: { color: '#9CA3AF', bg: '#F3F4F6', emoji: '🥈' },
  Gold: { color: '#F59E0B', bg: '#FFFBEB', emoji: '🥇' },
};

export default function LeagueResultsModal({ visible, result, onDismiss }: LeagueResultsModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible && result) {
      scaleAnim.setValue(0.5);
      fadeAnim.setValue(0);
      badgeScale.setValue(0);
      slideUp.setValue(40);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
          Animated.timing(slideUp, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();

      if (result.promoted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.demoted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [visible, result]);

  if (!result) return null;

  const newTierConfig = TIER_CONFIG[result.newTier];
  const prevTierConfig = TIER_CONFIG[result.previousTier];

  const getStatusText = () => {
    if (result.promoted) return 'Promoted!';
    if (result.demoted) return 'Demoted';
    return 'League Maintained';
  };

  const getStatusIcon = () => {
    if (result.promoted) return <TrendingUp size={24} color="#22C55E" />;
    if (result.demoted) return <TrendingDown size={24} color={Colors.error} />;
    return <Minus size={24} color={Colors.textSecondary} />;
  };

  const getStatusColor = () => {
    if (result.promoted) return '#22C55E';
    if (result.demoted) return Colors.error;
    return Colors.textSecondary;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.headerStrip, { backgroundColor: newTierConfig.color }]} />

          <View style={styles.content}>
            <Text style={styles.weekEndTitle}>Week Complete</Text>

            <Animated.View style={[styles.tierBadge, { backgroundColor: newTierConfig.bg, transform: [{ scale: badgeScale }] }]}>
              <Text style={styles.tierEmoji}>{newTierConfig.emoji}</Text>
              <Text style={[styles.tierName, { color: newTierConfig.color }]}>{result.newTier} League</Text>
            </Animated.View>

            <Animated.View style={[styles.statusRow, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
              {getStatusIcon()}
              <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
            </Animated.View>

            {(result.promoted || result.demoted) && (
              <Animated.View style={[styles.tierChange, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
                <View style={[styles.tierSmallBadge, { backgroundColor: prevTierConfig.bg }]}>
                  <Text style={styles.tierSmallEmoji}>{prevTierConfig.emoji}</Text>
                  <Text style={[styles.tierSmallText, { color: prevTierConfig.color }]}>{result.previousTier}</Text>
                </View>
                <Text style={styles.tierArrow}>→</Text>
                <View style={[styles.tierSmallBadge, { backgroundColor: newTierConfig.bg }]}>
                  <Text style={styles.tierSmallEmoji}>{newTierConfig.emoji}</Text>
                  <Text style={[styles.tierSmallText, { color: newTierConfig.color }]}>{result.newTier}</Text>
                </View>
              </Animated.View>
            )}

            <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
              <View style={styles.statItem}>
                <Shield size={18} color={Colors.primary} />
                <Text style={styles.statValue}>#{result.rank}</Text>
                <Text style={styles.statLabel}>Final Rank</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Zap size={18} color={Colors.gold} />
                <Text style={styles.statValue}>{result.xpEarned}</Text>
                <Text style={styles.statLabel}>Weekly XP</Text>
              </View>
            </Animated.View>

            <View style={styles.infoBox}>
              <Trophy size={14} color={Colors.textTertiary} />
              <Text style={styles.infoText}>
                {result.promoted
                  ? 'Great work! You earned your promotion by finishing in the Top 10.'
                  : result.demoted
                    ? 'Keep grinding next week to climb back up!'
                    : 'Stay consistent to move up next week. Top 10 promotes!'}
              </Text>
            </View>

            <Pressable
              style={[styles.continueBtn, { backgroundColor: newTierConfig.color }]}
              onPress={onDismiss}
              testID="league-result-continue"
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  headerStrip: {
    height: 6,
  },
  content: {
    padding: 28,
    alignItems: 'center',
  },
  weekEndTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  tierBadge: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 20,
    marginBottom: 16,
    minWidth: 180,
  },
  tierEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  tierName: {
    fontSize: 22,
    fontWeight: '900' as const,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  tierChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  tierSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tierSmallEmoji: {
    fontSize: 18,
  },
  tierSmallText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  tierArrow: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
