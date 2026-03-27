import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { Heart, Coins, ShoppingBag, Clock, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProgress } from '@/contexts/ProgressContext';
import MascotAnimated from '@/components/MascotAnimated';

interface OutOfHeartsModalProps {
  visible: boolean;
  onClose: () => void;
  onGoToShop: () => void;
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function OutOfHeartsModal({
  visible,
  onClose,
  onGoToShop,
}: OutOfHeartsModalProps) {
  const { progress, buyFullRefillWithCoins, heartCountdownSeconds } = useProgress();
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulse, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(heartPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      overlayAnim.setValue(0);
      slideAnim.setValue(300);
      heartPulse.setValue(1);
    }
  }, [visible, overlayAnim, slideAnim, heartPulse]);

  const handleRefillForCoins = useCallback(() => {
    if (progress.stats.coins < 100) {
      Alert.alert(
        'Not Enough Coins',
        `You need 100 coins but only have ${progress.stats.coins}. Visit the shop for more options!`
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    buyFullRefillWithCoins();
    onClose();
  }, [progress.stats.coins, buyFullRefillWithCoins, onClose]);

  const handleGoToShop = useCallback(() => {
    onClose();
    setTimeout(() => onGoToShop(), 150);
  }, [onClose, onGoToShop]);

  const emptyHearts = Array.from({ length: 5 });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.overlayBg, { opacity: overlayAnim }]}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Pressable onPress={onClose} style={styles.closeBtn} testID="close-hearts-modal">
            <X size={20} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.mascotWrap}>
            <MascotAnimated mood="sad" size={100} />
          </View>

          <Animated.View style={[styles.heartRow, { transform: [{ scale: heartPulse }] }]}>
            {emptyHearts.map((_, i) => (
              <Heart
                key={i}
                size={28}
                color={Colors.border}
                fill="transparent"
              />
            ))}
          </Animated.View>

          <Text style={styles.title}>Out of Hearts!</Text>
          <Text style={styles.subtitle}>
            You have used all your hearts. Refill to keep learning!
          </Text>

          <View style={styles.optionsContainer}>
            <Pressable
              onPress={handleRefillForCoins}
              style={({ pressed }) => [
                styles.optionButton,
                styles.refillButton,
                pressed && styles.optionPressed,
              ]}
              testID="refill-coins-button"
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: Colors.accentLight }]}>
                  <Heart size={20} color={Colors.accent} fill={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Refill All Hearts</Text>
                  <Text style={styles.optionDesc}>Restore to 5/5 hearts</Text>
                </View>
              </View>
              <View style={styles.coinPrice}>
                <Coins size={14} color={Colors.gold} />
                <Text style={styles.coinPriceText}>100</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleGoToShop}
              style={({ pressed }) => [
                styles.optionButton,
                styles.shopButton,
                pressed && styles.optionPressed,
              ]}
              testID="go-to-shop-button"
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: Colors.primaryLight }]}>
                  <ShoppingBag size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Go to Shop</Text>
                  <Text style={styles.optionDesc}>Buy hearts or watch ads</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.optionButton,
                styles.waitButton,
                pressed && styles.optionPressed,
              ]}
              testID="wait-refill-button"
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: Colors.goldLight }]}>
                  <Clock size={20} color={Colors.gold} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Wait to Refill</Text>
                  <Text style={styles.optionDesc}>
                    {heartCountdownSeconds > 0
                      ? 'Hearts regenerate every 60 min'
                      : 'Hearts refill over time'}
                  </Text>
                </View>
              </View>
              {heartCountdownSeconds > 0 ? (
                <View style={styles.countdownBadge}>
                  <Clock size={12} color={Colors.gold} />
                  <Text style={styles.countdownText}>{formatCountdown(heartCountdownSeconds)}</Text>
                </View>
              ) : null}
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
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mascotWrap: {
    marginBottom: 8,
  },
  heartRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    fontWeight: '500' as const,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    width: '100%',
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  refillButton: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  shopButton: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  waitButton: {
    backgroundColor: Colors.goldLight,
    borderColor: Colors.gold,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  coinPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  coinPriceText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#92400E',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#92400E',
    fontVariant: ['tabular-nums'] as const,
  },
});
