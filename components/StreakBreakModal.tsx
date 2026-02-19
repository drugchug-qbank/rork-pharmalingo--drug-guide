import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Flame, Shield, Coins, AlertTriangle, ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useStreakStatus } from '@/hooks/useStreakStatus';

interface StreakBreakModalProps {
  visible: boolean;
  streakCount: number;
  streakSaves: number;
  coins: number;
  onUseStreakSave: () => void;
  onBuyStreakSave: () => void;
  onAcceptBreak: () => void;
  onClose?: () => void;
}

export default React.memo(function StreakBreakModal({
  visible,
  streakCount,
  streakSaves,
  coins,
  onUseStreakSave,
  onBuyStreakSave,
  onAcceptBreak,
  onClose,
}: StreakBreakModalProps) {
  const router = useRouter();

  // ✅ Source of truth: server streak status
  // Option B: modal should only show when server says streak is LOST.
  const streakQuery = useStreakStatus({ enabled: visible });
  const serverStatus = streakQuery.streak?.status ?? null;
  const serverStreakCount = streakQuery.streak?.streak_current ?? null;

  // Only show the modal when server confirms the streak is actually lost.
  // (Also avoid showing while loading to prevent flicker/false positives.)
  const shouldShow = useMemo(() => {
    if (!visible) return false;
    if (!streakQuery.streak) return false;
    return serverStatus === 'lost' && (Number(serverStreakCount ?? 0) > 0);
  }, [visible, streakQuery.streak, serverStatus, serverStreakCount]);

  // If some old/local logic tries to open this modal while server says you're fine,
  // automatically close it so the parent clears its "visible" state.
  useEffect(() => {
    if (!visible) return;
    if (!streakQuery.streak) return;
    if (shouldShow) return;
    onClose?.();
  }, [visible, streakQuery.streak, shouldShow, onClose]);

  // Use server streak length when available so the badge/text is correct.
  const displayStreakCount = useMemo(() => {
    const n = Number(serverStreakCount);
    if (Number.isFinite(n) && n > 0) return n;
    return streakCount;
  }, [serverStreakCount, streakCount]);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flameAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shouldShow) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 80,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(flameAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(flameAnim, {
            toValue: 0.9,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      const shakeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 3, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -3, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 2, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -2, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.delay(2000),
        ])
      );
      shakeLoop.start();

      return () => {
        pulseLoop.stop();
        shakeLoop.stop();
      };
    }
  }, [shouldShow, scaleAnim, opacityAnim, flameAnim, shakeAnim]);

  const handleUseStreakSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUseStreakSave();
  }, [onUseStreakSave]);

  const handleBuyStreakSave = useCallback(() => {
    if (coins < 200) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBuyStreakSave();
  }, [coins, onBuyStreakSave]);

  const handleAcceptBreak = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAcceptBreak();
  }, [onAcceptBreak]);

  const canAffordBuy = coins >= 200;

  return (
    <Modal
      visible={shouldShow}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => onClose?.()}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.warningBadge}>
            <Animated.View style={{ transform: [{ scale: flameAnim }, { translateX: shakeAnim }] }}>
              <Flame size={48} color="#F59E0B" fill="#F59E0B" />
            </Animated.View>
          </View>

          <View style={styles.streakCountBadge}>
            <Flame size={16} color={Colors.accent} fill={Colors.accent} />
            <Text style={styles.streakCountText}>{displayStreakCount} day streak</Text>
          </View>

          <Text style={styles.title}>Your Streak Is About to Break!</Text>
          <Text style={styles.subtitle}>
            You missed a day of practice. Use a Streak Save to keep your {displayStreakCount}-day streak alive!
          </Text>

          {streakSaves > 0 ? (
            <Pressable
              onPress={handleUseStreakSave}
              style={styles.primaryButton}
              testID="use-streak-save"
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Use Streak Save</Text>
              <View style={styles.savesCountBadge}>
                <Text style={styles.savesCountText}>{streakSaves}</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleBuyStreakSave}
              style={[
                styles.primaryButton,
                !canAffordBuy && styles.primaryButtonDisabled,
              ]}
              testID="buy-streak-save"
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                Buy Streak Save
              </Text>
              <View style={styles.priceBadge}>
                <Coins size={14} color={Colors.gold} />
                <Text style={styles.priceText}>200</Text>
              </View>
            </Pressable>
          )}

          {!canAffordBuy && streakSaves <= 0 && (
            <>
              <View style={styles.insufficientRow}>
                <AlertTriangle size={14} color={Colors.warning} />
                <Text style={styles.insufficientText}>
                  Not enough coins ({coins}/200)
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onClose?.();
                  onAcceptBreak();
                  router.push('/shop');
                }}
                style={styles.buyCoinsButton}
                testID="buy-coins-button"
              >
                <ShoppingCart size={18} color={Colors.gold} />
                <Text style={styles.buyCoinsText}>Get More Coins</Text>
              </Pressable>
            </>
          )}

          <Pressable
            onPress={handleAcceptBreak}
            style={styles.secondaryButton}
            testID="accept-streak-break"
          >
            <Text style={styles.secondaryButtonText}>Accept Break</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  warningBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FDE68A',
  },
  streakCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  streakCountText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.accent,
  },
  title: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 24,
    fontWeight: '500' as const,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800' as const,
  },
  savesCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savesCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800' as const,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800' as const,
  },
  insufficientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  insufficientText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: Colors.surfaceAlt,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  buyCoinsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: '#FEF9E7',
    width: '100%',
  },
  buyCoinsText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
});

