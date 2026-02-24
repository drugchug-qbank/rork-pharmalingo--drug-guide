import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Heart, Coins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { chapters } from '@/constants/chapters';
import { useProgress } from '@/contexts/ProgressContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStreakStatus } from '@/hooks/useStreakStatus';

import ChapterNode from '@/components/ChapterNode';
import MascotAnimated from '@/components/MascotAnimated';
import DailyQuestsCard from '@/components/DailyQuestsCard';
import StreakPill from '@/components/StreakPill';

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    progress,
    getChapterProgress,
    isChapterGoldMastered,
    isLessonUnlocked,
    getDailyQuests,
    claimDailyQuest,
  } = useProgress();

  const { session } = useAuth();

  // ✅ Server-backed streak status (source of truth)
  // Keeps Learn header flame synced with Profile/Leaderboard.
  const streakQuery = useStreakStatus({ invalidateOnAppActive: true });

  // ✅ When you return to the Learn tab (e.g., after finishing a quiz/lesson),
  // refetch the streak so it updates immediately.
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      streakQuery.refetch();
    }, [session, streakQuery.refetch])
  );

  // Use server streak when available, otherwise fall back to local cached streak.
  const streakCount = useMemo(() => {
    return streakQuery.data ? streakQuery.effectiveStreak : progress.stats.streakCurrent;
  }, [streakQuery.data, streakQuery.effectiveStreak, progress.stats.streakCurrent]);

  const isChapterUnlocked = (chapterIndex: number): boolean => {
    if (chapterIndex === 0) return true;
    const chapter = chapters[chapterIndex];
    return isLessonUnlocked(chapter.id, 0);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {/* Avatar placeholder (user-customizable in the future) */}
            <View style={styles.avatarWrap}>
              <MascotAnimated mood="waving" size={70} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>PharmaLingo</Text>
              <Text style={styles.headerSubtitle}>Top 300 Drugs</Text>
            </View>
          </View>
        </View>

        {/* Move badges UNDER the title so they never get pushed off-screen */}
        <View style={styles.headerStatsRow}>
          <StreakPill value={streakCount} size="md" onDark />

          <View style={styles.statPill}>
            {/* Match flame icon size in StreakPill (md -> 24) */}
            <Heart size={24} color="#FF6B6B" fill="#FF6B6B" />
            <Text style={styles.statText}>{progress.stats.hearts}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Shop"
            onPress={() => router.push('/(tabs)/shop')}
            style={styles.statPill}
          >
            <Coins size={22} color={Colors.gold} />
            <Text style={styles.statText}>{progress.stats.coins}</Text>
          </Pressable>
        </View>

        <View style={styles.xpBar}>
          <View style={styles.xpBarTrack}>
            <View
              style={[
                styles.xpBarFill,
                { width: `${Math.min(((progress.stats.xpTotal % 500) / 500) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.xpBarText}>
            Lv.{progress.level} • {progress.stats.xpTotal % 500}/{500} XP
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Daily Goal REMOVED — ONLY Daily Quests remain */}
        <DailyQuestsCard quests={getDailyQuests().slice(0, 3)} onClaim={claimDailyQuest} />

        {progress.stats.doubleXpNextLesson && (
          <View style={styles.boosterBanner}>
            <Text style={styles.boosterEmoji}>⚡</Text>
            <Text style={styles.boosterText}>2× XP active for your next lesson!</Text>
          </View>
        )}

        <View style={styles.pathContainer}>
          {chapters.map((chapter, index) => {
            const unlocked = isChapterUnlocked(index);
            const chapterProg = getChapterProgress(chapter.id);
            const isEndgame = chapter.id === 'mod-11';
            const goldMastered = !isEndgame && isChapterGoldMastered(chapter.id);

            return (
              <React.Fragment key={chapter.id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.connector,
                      index % 2 === 0 ? styles.connectorRight : styles.connectorLeft,
                      !unlocked && styles.connectorLocked,
                    ]}
                  />
                )}

                <ChapterNode
                  title={chapter.title}
                  subtitle={chapter.subtitle}
                  icon={chapter.icon}
                  color={chapter.color}
                  progress={chapterProg}
                  isLocked={!unlocked}
                  index={index}
                  special={isEndgame}
                  mastered={goldMastered}
                  onLockedPress={
                    isEndgame && !unlocked
                      ? () =>
                          Alert.alert(
                            'Locked: Master the course first',
                            'This Gold Challenge unlocks only after you complete ALL 10 modules and pass each Mastering quiz (≥70%).',
                            [{ text: 'Got it', style: 'default' }]
                          )
                      : undefined
                  }
                  onPress={() => router.push(`/chapter/${chapter.id}`)}
                />
              </React.Fragment>
            );
          })}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingBottom: 16, paddingHorizontal: 20 },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },

  avatarWrap: { marginTop: 6 },
  headerTextWrap: { paddingTop: 2 },

  headerTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600' as const,
    marginTop: 2,
  },

  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 6,
  },
  statText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' as const },

  xpBar: { marginTop: 12 },
  xpBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: { height: 8, backgroundColor: Colors.gold, borderRadius: 4 },
  xpBarText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700' as const,
    marginTop: 4,
    textAlign: 'center' as const,
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 20 },

  boosterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
  },
  boosterEmoji: { fontSize: 18 },
  boosterText: { fontSize: 14, fontWeight: '700' as const, color: '#9A3412' },

  pathContainer: { alignItems: 'center' },

  connector: {
    width: 4,
    height: 24,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: 4,
    opacity: 0.4,
  },
  connectorLeft: { alignSelf: 'center', marginLeft: -60 },
  connectorRight: { alignSelf: 'center', marginRight: -60 },
  connectorLocked: { backgroundColor: Colors.border, opacity: 0.3 },
});