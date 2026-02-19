import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Coins, Target, Flame, Trophy, ArrowRight, RotateCcw, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import MascotAnimated from '@/components/MascotAnimated';
import LootChestModal from '@/components/LootChestModal';
import { useProgress } from '@/contexts/ProgressContext';
import { LootReward } from '@/constants/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ['#F59E0B', '#0EA5E9', '#22C55E', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'strip';
}

function useConfetti(shouldPlay: boolean): ConfettiPiece[] {
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-40),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 6,
      shape: (['square', 'circle', 'strip'] as const)[Math.floor(Math.random() * 3)],
    }))
  ).current;

  useEffect(() => {
    if (!shouldPlay) return;

    pieces.forEach((piece, i) => {
      const startX = Math.random() * SCREEN_WIDTH;
      const endX = startX + (Math.random() - 0.5) * 200;
      const delay = i * 30;

      piece.x.setValue(startX);
      piece.y.setValue(-40);
      piece.rotate.setValue(0);
      piece.opacity.setValue(1);

      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 40,
          duration: 2800 + Math.random() * 1200,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: endX,
          duration: 2800 + Math.random() * 1200,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: Math.random() * 10 - 5,
          duration: 2800,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration: 1000,
          delay: delay + 2000,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [shouldPlay, pieces]);

  return pieces;
}

export default function LessonCompleteScreen() {
  const params = useLocalSearchParams<{
    correctCount: string;
    totalQuestions: string;
    xpEarned: string;
    coinsEarned: string;
    isPerfect: string;
    streakStatus: string;
    streakCount: string;
    chapterId?: string;
    partId?: string;
    isPractice?: string;
    perfectBonus?: string;
    highestCombo?: string;
    comboBonusCoins?: string;
    mistakesJson?: string;
    isMistakesMode?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { generateLootReward } = useProgress();
  const [showLootChest, setShowLootChest] = useState<boolean>(false);
  const [lootReward, setLootReward] = useState<LootReward | null>(null);
  const [lootCollected, setLootCollected] = useState<boolean>(false);

  const correctCount = parseInt(params.correctCount ?? '0', 10);
  const totalQuestions = parseInt(params.totalQuestions ?? '0', 10);
  const xpEarned = parseInt(params.xpEarned ?? '0', 10);
  const coinsEarned = parseInt(params.coinsEarned ?? '0', 10);
  const isPerfect = params.isPerfect === 'true';
  const streakStatus = params.streakStatus ?? 'kept';
  const streakCount = parseInt(params.streakCount ?? '0', 10);
  const perfectBonus = parseInt(params.perfectBonus ?? '0', 10);
  const isPractice = params.isPractice === 'true';
  const highestCombo = parseInt(params.highestCombo ?? '0', 10);
  const comboBonusCoins = parseInt(params.comboBonusCoins ?? '0', 10);
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const wrongCount = totalQuestions - correctCount;
  const mistakesJson = params.mistakesJson ?? '';
  const isMistakesMode = params.isMistakesMode === 'true';
  const hasMistakes = mistakesJson.length > 0 && !isMistakesMode;

  const confetti = useConfetti(true);

  const heroScale = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(60)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(40)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const perfectGlow = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.sequence([
      Animated.parallel([
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(statsSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(buttonsSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (isPerfect) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(perfectGlow, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(perfectGlow, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (streakCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(streakPulse, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [heroScale, heroOpacity, statsSlide, statsOpacity, buttonsSlide, buttonsOpacity, perfectGlow, streakPulse, isPerfect, streakCount]);

  const handleOpenChest = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const reward = generateLootReward();
    setLootReward(reward);
    setShowLootChest(true);
  };

  const handleLootCollected = () => {
    setShowLootChest(false);
    setLootCollected(true);
  };

  const handleContinue = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      router.dismissAll();
    } catch {
      router.replace('/');
    }
  };

  const handlePracticeMistakes = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      router.dismissAll();
    } catch {
      // ignore
    }
    setTimeout(() => {
      router.push({
        pathname: '/lesson',
        params: {
          mode: 'mistakes',
          mistakesJson,
        },
      });
    }, 100);
  };

  const streakLabel = useMemo(() => {
    if (streakStatus === 'incremented') return `Streak +1! Now ${streakCount} days 🔥`;
    if (streakStatus === 'kept') return `${streakCount} day streak kept! 🔥`;
    return `New streak started! 🔥`;
  }, [streakStatus, streakCount]);

  const perfectGlowOpacity = perfectGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {confetti.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confettiPiece,
            {
              width: piece.shape === 'strip' ? piece.size * 0.4 : piece.size,
              height: piece.shape === 'strip' ? piece.size * 2 : piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? piece.size / 2 : 2,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { rotate: piece.rotate.interpolate({
                  inputRange: [-5, 5],
                  outputRange: ['-180deg', '180deg'],
                })},
                { scale: piece.scale },
              ],
              opacity: piece.opacity,
            },
          ]}
        />
      ))}

      <Animated.View style={[
        styles.heroSection,
        {
          opacity: heroOpacity,
          transform: [{ scale: heroScale }],
        },
      ]}>
        {isPerfect && (
          <Animated.View style={[styles.perfectGlow, { opacity: perfectGlowOpacity }]} />
        )}
        <MascotAnimated mood={isPerfect ? 'dancing' : 'celebrating'} size={120} />
        <Text style={styles.heroTitle}>
          {isPerfect ? '🌟 Perfect Score! 🌟' : 'Lesson Complete!'}
        </Text>
        {isPerfect && (
          <View style={styles.perfectBadge}>
            <Trophy size={14} color="#92400E" />
            <Text style={styles.perfectBadgeText}>Perfect Bonus +{perfectBonus} coins</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={[
        styles.statsContainer,
        {
          opacity: statsOpacity,
          transform: [{ translateY: statsSlide }],
        },
      ]}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: Colors.primaryLight }]}>
              <Zap size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>+{xpEarned}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: Colors.goldLight }]}>
              <Coins size={18} color={Colors.gold} />
            </View>
            <Text style={styles.statValue}>+{coinsEarned}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: Colors.successLight }]}>
              <Target size={18} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>{correctCount}/{totalQuestions}</Text>
          </View>
        </View>

        {highestCombo >= 2 && (
          <View style={styles.comboBanner}>
            <View style={styles.comboBannerLeft}>
              <TrendingUp size={18} color="#9A3412" />
              <Text style={styles.comboBannerText}>
                🔥 Best Combo: {highestCombo}
              </Text>
            </View>
            {comboBonusCoins > 0 && (
              <View style={styles.comboBonusPill}>
                <Text style={styles.comboBonusPillText}>+{comboBonusCoins} 🪙</Text>
              </View>
            )}
          </View>
        )}

        {streakCount > 0 && (
          <Animated.View style={[
            styles.streakBanner,
            { transform: [{ scale: streakPulse }] },
          ]}>
            <Flame size={20} color="#EA580C" />
            <Text style={styles.streakText}>{streakLabel}</Text>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View style={[
        styles.buttonsContainer,
        {
          opacity: buttonsOpacity,
          transform: [{ translateY: buttonsSlide }],
        },
      ]}>
        {!lootCollected ? (
          <Pressable
            onPress={handleOpenChest}
            style={({ pressed }) => [
              styles.lootButton,
              pressed && styles.buttonPressed,
            ]}
            testID="lesson-complete-loot"
          >
            <Text style={styles.lootButtonEmoji}>🎁</Text>
            <Text style={styles.lootButtonText}>Open Reward Chest!</Text>
          </Pressable>
        ) : (
          <View style={styles.lootCollectedBanner}>
            <Text style={styles.lootCollectedText}>
              {lootReward?.emoji} {lootReward?.label} collected!
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          testID="lesson-complete-continue"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </Pressable>

        {hasMistakes && (
          <Pressable
            onPress={handlePracticeMistakes}
            style={({ pressed }) => [
              styles.practiceButton,
              pressed && styles.buttonPressed,
            ]}
            testID="lesson-complete-practice"
          >
            <RotateCcw size={18} color={Colors.primary} />
            <Text style={styles.practiceButtonText}>Practice Mistakes ({wrongCount})</Text>
          </Pressable>
        )}
      </Animated.View>

      <LootChestModal
        visible={showLootChest}
        reward={lootReward}
        onDismiss={handleLootCollected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  perfectGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.gold,
    top: -30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  perfectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  perfectBadgeText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#92400E',
  },
  statsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#9A3412',
  },
  comboBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    marginBottom: 12,
  },
  comboBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comboBannerText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#9A3412',
  },
  comboBonusPill: {
    backgroundColor: '#FDBA74',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  comboBonusPillText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#7C2D12',
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 12,
  },
  lootButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  lootButtonEmoji: {
    fontSize: 22,
  },
  lootButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  lootCollectedBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  lootCollectedText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#166534',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  practiceButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
