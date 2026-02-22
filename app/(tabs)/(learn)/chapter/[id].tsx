import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Check, Lock, Star, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { getChapterById } from '@/constants/chapters';
import { useProgress } from '@/contexts/ProgressContext';
import ProgressBar from '@/components/ProgressBar';
import OutOfHeartsModal from '@/components/OutOfHeartsModal';

export default function ChapterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress, getLessonScore, isLessonUnlocked, getChapterProgress } = useProgress();
  const [showOutOfHearts, setShowOutOfHearts] = useState<boolean>(false);

  const chapter = getChapterById(id ?? '');

  if (!chapter) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Chapter not found</Text>
      </View>
    );
  }

  const chapterProgress = getChapterProgress(chapter.id);

  const isEndgame = chapter.id === 'mod-11';

  const masteryLessonId = `mastery-${chapter.id}`;
  const masteryScore = getLessonScore(masteryLessonId);
  const allPartsCompleted = chapter.parts.every((p) => getLessonScore(p.id) >= 70);
  const masteryUnlocked = allPartsCompleted;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[chapter.color, chapter.color + 'CC']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} testID="back-button">
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{chapter.title}</Text>
            <Text style={styles.headerSubtitle}>{chapter.subtitle}</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <View style={styles.headerProgress}>
          <ProgressBar
            progress={chapterProgress}
            height={8}
            color="rgba(255,255,255,0.9)"
            backgroundColor="rgba(255,255,255,0.25)"
          />
          <Text style={styles.headerProgressText}>
            {chapterProgress}% complete {chapterProgress >= 100 ? '⭐' : ''}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {chapter.parts.map((part, index) => {
          const score = getLessonScore(part.id);
          const unlocked = isLessonUnlocked(chapter.id, index);
          const completed = score >= 70;
          const perfect = score >= 100;
          const questionCount = isEndgame ? part.questionCount : Math.min(16, Math.max(14, part.questionCount + 4));

          return (
            <LessonCard
              key={part.id}
              title={part.title}
              description={part.description}
              questionCount={questionCount}
              score={score}
              unlocked={unlocked}
              completed={completed}
              perfect={perfect}
              index={index}
              color={chapter.color}
              onLockedPress={
                isEndgame && !unlocked
                  ? () =>
                      Alert.alert(
                        'Locked: Master the course first',
                        'Finish all 10 modules and pass each Mastering quiz (≥70%) to unlock the End Game.',
                        [{ text: 'Got it', style: 'default' }]
                      )
                  : undefined
              }
              onPress={() => {
                if (progress.stats.hearts <= 0) {
                  setShowOutOfHearts(true);
                  return;
                }
                router.push({
                  pathname: '/lesson',
                  params: isEndgame
                    ? { chapterId: chapter.id, partId: part.id, mode: 'endgame' }
                    : { chapterId: chapter.id, partId: part.id },
                });
              }}
            />
          );
        })}

        {!isEndgame ? (
          <Pressable
            style={[styles.masteryCard, !masteryUnlocked && styles.masteryCardLocked]}
            onPress={() => {
              if (!masteryUnlocked) return;
              if (progress.stats.hearts <= 0) {
                setShowOutOfHearts(true);
                return;
              }
              router.push({
                pathname: '/lesson',
                params: { chapterId: chapter.id, mode: 'mastery' },
              });
            }}
          >
            <View style={styles.masteryRow}>
              <View style={styles.masteryIcon}>
                <Trophy size={20} color={Colors.primary} />
              </View>
              <View style={styles.masteryText}>
                <Text style={styles.masteryTitle}>Mastering Quiz</Text>
                <Text style={styles.masterySubtitle}>30 questions • all sections</Text>
              </View>
              {masteryScore > 0 ? (
                <View style={styles.masteryScorePill}>
                  <Text style={styles.masteryScoreText}>{masteryScore}%</Text>
                </View>
              ) : null}
              {!masteryUnlocked ? <Lock size={18} color={Colors.textSecondary} /> : null}
            </View>
            <Text style={styles.masteryDescription}>
              Cumulative check for this module. Unlocks after you complete all sections (≥70%).
            </Text>
          </Pressable>
        ) : null}
        <View style={{ height: 40 }} />
      </ScrollView>

      <OutOfHeartsModal
        visible={showOutOfHearts}
        onClose={() => setShowOutOfHearts(false)}
        onGoToShop={() => {
          router.push('/(tabs)/shop');
        }}
      />
    </View>
  );
}

interface LessonCardProps {
  title: string;
  description: string;
  questionCount: number;
  score: number;
  unlocked: boolean;
  completed: boolean;
  perfect: boolean;
  index: number;
  color: string;
  onPress: () => void;
  onLockedPress?: () => void;
}

const LessonCard = React.memo(function LessonCard({
  title,
  description,
  questionCount,
  score,
  unlocked,
  completed,
  perfect,
  index,
  color,
  onPress,
  onLockedPress,
}: LessonCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (!unlocked && !onLockedPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [unlocked, onLockedPress, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={unlocked ? onPress : onLockedPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.lessonCard, !unlocked && styles.lockedCard]}
        testID={`lesson-card-${index}`}
      >
        <View style={styles.lessonLeft}>
          <View style={[
            styles.lessonIcon,
            {
              backgroundColor: unlocked
                ? completed ? Colors.successLight : color + '18'
                : Colors.surfaceAlt,
            },
          ]}>
            {!unlocked ? (
              <Lock size={20} color={Colors.textTertiary} />
            ) : completed ? (
              perfect ? <Trophy size={20} color={Colors.gold} /> : <Check size={20} color={Colors.success} />
            ) : (
              <Play size={20} color={color} />
            )}
          </View>

          <View style={styles.lessonInfo}>
            <Text style={styles.lessonPartLabel}>Part {index + 1}</Text>
            <Text style={[styles.lessonTitle, !unlocked && styles.lockedText]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.lessonDescription} numberOfLines={1}>
              {description}
            </Text>
          </View>
        </View>

        <View style={styles.lessonRight}>
          {unlocked && completed && (
            <View style={styles.scoreContainer}>
              {perfect && <Star size={14} color={Colors.gold} fill={Colors.gold} />}
              <Text style={[styles.scoreText, { color: perfect ? Colors.gold : Colors.success }]}>
                {score}%
              </Text>
            </View>
          )}
          {unlocked && !completed && (
            <View style={[styles.startBadge, { backgroundColor: color }]}>
              <Text style={styles.startBadgeText}>
                {score > 0 ? 'RETRY 🔄' : 'START ▶'}
              </Text>
            </View>
          )}
          {!unlocked && (
            <Text style={styles.questionCountLocked}>{questionCount} Qs 🔒</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600' as const,
  },
  headerProgress: {
    gap: 6,
  },
  headerProgressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  lockedCard: {
    opacity: 0.5,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lessonPartLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 2,
  },
  lockedText: {
    color: Colors.textTertiary,
  },
  lessonDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  lessonRight: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  startBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  startBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  questionCountLocked: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '600' as const,
  },
  masteryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  masteryCardLocked: {
    opacity: 0.55,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masteryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryText: {
    flex: 1,
    marginLeft: 12,
  },
  masteryTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  masterySubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  masteryDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  masteryScorePill: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
  },
  masteryScoreText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.text,
  },
});
