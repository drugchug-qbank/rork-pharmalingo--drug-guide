import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { Target, Coins, PartyPopper } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DailyGoalRewardModalProps {
  visible: boolean;
  onClaim: () => void;
}

export default function DailyGoalRewardModal({ visible, onClaim }: DailyGoalRewardModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const coinBounce = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      coinBounce.setValue(0);
      starRotate.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(coinBounce, {
              toValue: -12,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(coinBounce, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();

        Animated.loop(
          Animated.timing(starRotate, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ).start();
      });
    }
  }, [visible, scaleAnim, opacityAnim, coinBounce, starRotate]);

  const spin = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.starBg, { transform: [{ rotate: spin }] }]}>
            <View style={styles.starRay} />
            <View style={[styles.starRay, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.starRay, { transform: [{ rotate: '90deg' }] }]} />
            <View style={[styles.starRay, { transform: [{ rotate: '135deg' }] }]} />
          </Animated.View>

          <View style={styles.iconCircle}>
            <Target size={36} color="#FFFFFF" strokeWidth={2.5} />
          </View>

          <View style={styles.partyRow}>
            <PartyPopper size={22} color={Colors.gold} />
            <Text style={styles.title}>Daily Goal Reached!</Text>
            <PartyPopper size={22} color={Colors.gold} />
          </View>

          <Text style={styles.subtitle}>
            You crushed your daily XP goal. Keep it up!
          </Text>

          <Animated.View style={[styles.rewardPill, { transform: [{ translateY: coinBounce }] }]}>
            <Coins size={24} color={Colors.gold} />
            <Text style={styles.rewardText}>+20</Text>
          </Animated.View>

          <Pressable
            style={({ pressed }) => [styles.claimBtn, pressed && styles.claimBtnPressed]}
            onPress={onClaim}
          >
            <Text style={styles.claimBtnText}>Collect Reward</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  starBg: {
    position: 'absolute',
    top: -40,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.08,
  },
  starRay: {
    position: 'absolute',
    width: 200,
    height: 6,
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    marginBottom: 20,
    lineHeight: 20,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  rewardText: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.gold,
  },
  claimBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  claimBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  claimBtnText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
