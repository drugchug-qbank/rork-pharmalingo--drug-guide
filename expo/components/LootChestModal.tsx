import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Modal, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { LootReward } from '@/constants/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPARKLE_COUNT = 12;
const SPARKLE_COLORS = ['#FFD700', '#F59E0B', '#FBBF24', '#FDE68A', '#FEF3C7', '#FFFFFF'];

interface LootChestModalProps {
  visible: boolean;
  reward: LootReward | null;
  onDismiss: () => void;
}

export default function LootChestModal({ visible, reward, onDismiss }: LootChestModalProps) {
  const [phase, setPhase] = useState<'closed' | 'shaking' | 'open'>('closed');
  const chestScale = useRef(new Animated.Value(0.3)).current;
  const chestShake = useRef(new Animated.Value(0)).current;
  const lidRotate = useRef(new Animated.Value(0)).current;
  const rewardScale = useRef(new Animated.Value(0)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const sparkles = useRef(
    Array.from({ length: SPARKLE_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    }))
  ).current;

  useEffect(() => {
    if (!visible) {
      setPhase('closed');
      chestScale.setValue(0.3);
      chestShake.setValue(0);
      lidRotate.setValue(0);
      rewardScale.setValue(0);
      rewardOpacity.setValue(0);
      bgOpacity.setValue(0);
      glowScale.setValue(0);
      glowOpacity.setValue(0);
      buttonOpacity.setValue(0);
      sparkles.forEach(s => {
        s.x.setValue(0);
        s.y.setValue(0);
        s.scale.setValue(0);
        s.opacity.setValue(0);
      });
      return;
    }

    setPhase('closed');

    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(chestScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setPhase('shaking');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const shakeSequence = Array.from({ length: 6 }, (_, i) => {
        const val = (i % 2 === 0 ? 1 : -1) * (8 - i);
        return Animated.timing(chestShake, {
          toValue: val,
          duration: 80,
          useNativeDriver: true,
        });
      });
      shakeSequence.push(
        Animated.timing(chestShake, { toValue: 0, duration: 60, useNativeDriver: true })
      );

      Animated.sequence(shakeSequence).start(() => {
        setPhase('open');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Animated.timing(lidRotate, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        Animated.parallel([
          Animated.spring(glowScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();

        setTimeout(() => {
          Animated.parallel([
            Animated.spring(rewardScale, {
              toValue: 1,
              friction: 5,
              tension: 60,
              useNativeDriver: true,
            }),
            Animated.timing(rewardOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();

          sparkles.forEach((s, i) => {
            const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
            const dist = 60 + Math.random() * 40;
            Animated.parallel([
              Animated.timing(s.x, {
                toValue: Math.cos(angle) * dist,
                duration: 600,
                delay: i * 30,
                useNativeDriver: true,
              }),
              Animated.timing(s.y, {
                toValue: Math.sin(angle) * dist,
                duration: 600,
                delay: i * 30,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(s.scale, {
                  toValue: 1,
                  duration: 200,
                  delay: i * 30,
                  useNativeDriver: true,
                }),
                Animated.timing(s.scale, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.timing(s.opacity, {
                  toValue: 1,
                  duration: 200,
                  delay: i * 30,
                  useNativeDriver: true,
                }),
                Animated.timing(s.opacity, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]),
            ]).start();
          });

          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 400,
            delay: 300,
            useNativeDriver: true,
          }).start();
        }, 300);
      });
    }, 600);
  }, [visible]);

  const getRewardColor = () => {
    if (!reward) return Colors.gold;
    switch (reward.type) {
      case 'streak_save': return '#8B5CF6';
      case 'double_xp': return '#F97316';
      case 'big_coins': return '#FFD700';
      default: return Colors.gold;
    }
  };

  if (!visible || !reward) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.chestContainer,
              {
                transform: [
                  { scale: chestScale },
                  { translateX: chestShake },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.glow,
                {
                  backgroundColor: getRewardColor(),
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                },
              ]}
            />

            <View style={styles.chestBody}>
              <Animated.View
                style={[
                  styles.chestLid,
                  {
                    transform: [
                      {
                        rotateX: lidRotate.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-120deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.chestEmoji}>🎁</Text>
              </Animated.View>

              {phase !== 'open' && (
                <Text style={styles.chestMainEmoji}>
                  {phase === 'shaking' ? '📦' : '🎁'}
                </Text>
              )}

              {phase === 'open' && (
                <Text style={styles.chestMainEmoji}>📭</Text>
              )}
            </View>

            {sparkles.map((s, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    backgroundColor: s.color,
                    transform: [
                      { translateX: s.x },
                      { translateY: s.y },
                      { scale: s.scale },
                    ],
                    opacity: s.opacity,
                  },
                ]}
              />
            ))}
          </Animated.View>

          {phase === 'open' && (
            <Animated.View
              style={[
                styles.rewardContainer,
                {
                  transform: [{ scale: rewardScale }],
                  opacity: rewardOpacity,
                },
              ]}
            >
              <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
              <Text style={styles.rewardLabel}>{reward.label}</Text>
              <Text style={styles.rewardDescription}>
                {reward.type === 'streak_save' && 'Protects your streak if you miss a day!'}
                {reward.type === 'double_xp' && 'Your next lesson earns double XP!'}
                {reward.type === 'big_coins' && 'A big coin jackpot!'}
                {reward.type === 'coins' && 'Some bonus coins for you!'}
              </Text>
            </Animated.View>
          )}

          {phase === 'open' && (
            <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
              <Pressable
                onPress={onDismiss}
                style={({ pressed }) => [
                  styles.collectButton,
                  { backgroundColor: getRewardColor() },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
                testID="loot-collect"
              >
                <Text style={styles.collectButtonText}>Collect!</Text>
              </Pressable>
            </Animated.View>
          )}

          {phase !== 'open' && (
            <Text style={styles.tapHint}>
              {phase === 'shaking' ? 'Opening...' : 'Lesson Reward!'}
            </Text>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.85,
  },
  chestContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
    marginBottom: 30,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  chestBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestLid: {
    position: 'absolute',
    top: -30,
  },
  chestEmoji: {
    fontSize: 40,
  },
  chestMainEmoji: {
    fontSize: 80,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rewardContainer: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  rewardEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  rewardLabel: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  rewardDescription: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  collectButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  collectButtonText: {
    fontSize: 19,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  tapHint: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
});
