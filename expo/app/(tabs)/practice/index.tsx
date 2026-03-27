import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Shuffle, Target, Clock, TrendingUp, Brain, AlertCircle, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useProgress } from '@/contexts/ProgressContext';
import { chapters } from '@/constants/chapters';
import { getDrugById } from '@/constants/drugData';
import OutOfHeartsModal from '@/components/OutOfHeartsModal';
import DrugMasteryCard from '@/components/DrugMasteryCard';
import XPIcon from '@/components/XPIcon';
import UserAvatar from "@/components/UserAvatar";

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    progress,
    accuracy,
    totalLessonsCompleted,
    getChapterProgress,
    getDueForReviewCount,
    getDueForReviewDrugIds,
    getLowMasteryDrugIds,
    getRecentMistakes,
    getRecentMistakeDrugIds,
    getUnlockedLessonDrugIds,
  } = useProgress();
  const [showOutOfHearts, setShowOutOfHearts] = useState<boolean>(false);

  const dueCount = getDueForReviewCount();
  const recentMistakes = getRecentMistakes(7);
  const recentMistakeDrugIds = getRecentMistakeDrugIds(7);

  const mistakeDrugs = useMemo(() => {
    return recentMistakeDrugIds.map(id => {
      const drug = getDrugById(id);
      const count = recentMistakes.filter(m => m.drugId === id).length;
      return { drugId: id, drug, count };
    }).filter(d => d.drug).slice(0, 10);
  }, [recentMistakeDrugIds, recentMistakes]);

  const startMistakesReview = useCallback(() => {
    router.push({
      pathname: '/lesson',
      params: {
        mode: 'mistakes-review',
        mistakeDrugIds: JSON.stringify(recentMistakeDrugIds),
      },
    });
  }, [router, recentMistakeDrugIds]);

  const startPractice = useCallback(() => {
    router.push({
      pathname: '/lesson',
      params: { mode: 'practice' },
    });
  }, [router]);

  const startBrandBlitz = useCallback(() => {
    const unlocked = getUnlockedLessonDrugIds();
    if (!unlocked || unlocked.length === 0) {
      Alert.alert(
        'Brand Blitz locked',
        'Complete at least one lesson on the Learn tab to unlock Brand Blitz.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    router.push({
      pathname: '/lesson',
      params: { mode: 'brand-blitz' },
    });
  }, [router, getUnlockedLessonDrugIds]);

  const startSpacedPractice = useCallback(() => {
    router.push({
      pathname: '/lesson',
      params: { mode: 'spaced' },
    });
  }, [router]);

  const startChapterReview = useCallback((chapterId: string, partId: string) => {
    if (progress.stats.hearts <= 0) {
      setShowOutOfHearts(true);
      return;
    }
    router.push({
      pathname: '/lesson',
      params: { chapterId, partId },
    });
  }, [router, progress.stats.hearts]);

  const completedChapters = chapters.filter(c => getChapterProgress(c.id) > 0);

  return (
    <View style={styles.container}>
<LinearGradient
  colors={[Colors.primary, "#0369A1"]}
  style={[styles.header, { paddingTop: insets.top + 8 }]}
>
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <View style={{ flex: 1, paddingRight: 12 }}>
      <Text style={styles.headerTitle}>Practice 💪</Text>
      <Text style={styles.headerSubtitle}>Strengthen your knowledge!</Text>
    </View>

    <UserAvatar variant="full" size={56} shape="rounded" />
  </View>
</LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dueCount > 0 && (
          <Pressable onPress={startSpacedPractice} style={styles.spacedCard} testID="spaced-practice">
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              style={styles.quickPracticeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.quickPracticeIcon}>
                <Brain size={28} color="#FFFFFF" />
              </View>
              <View style={styles.quickPracticeText}>
                <Text style={styles.quickPracticeTitle}>Spaced Review</Text>
                <Text style={styles.quickPracticeDesc}>
                  {dueCount} drug{dueCount !== 1 ? 's' : ''} due for review
                </Text>
              </View>
              <View style={styles.dueBadge}>
                <AlertCircle size={14} color="#FFFFFF" />
                <Text style={styles.dueBadgeText}>{dueCount}</Text>
              </View>
            </LinearGradient>
          </Pressable>
        )}

        <Pressable onPress={startPractice} style={styles.quickPracticeCard} testID="quick-practice">
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.quickPracticeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.quickPracticeIcon}>
              <Shuffle size={28} color="#FFFFFF" />
            </View>
            <View style={styles.quickPracticeText}>
              <Text style={styles.quickPracticeTitle}>Quick Practice 🎯</Text>
              <Text style={styles.quickPracticeDesc}>
                10 random questions from all categories
              </Text>
            </View>
            <View style={styles.playCircle}>
              <Dumbbell size={20} color={Colors.chapterColors[2]} />
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={startBrandBlitz} style={styles.brandBlitzCard} testID="brand-blitz">
          <LinearGradient
            colors={[Colors.chapterColors[2], Colors.chapterColors[4]]}
            style={styles.quickPracticeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.quickPracticeIcon}>
              <XPIcon size={28} />
            </View>
            <View style={styles.quickPracticeText}>
              <Text style={styles.quickPracticeTitle}>Brand Blitz Quiz ⚡️</Text>
              <Text style={styles.quickPracticeDesc}>15 rapid‑fire questions</Text>
            </View>
            <View style={styles.playCircle}>
              <Dumbbell size={20} color={Colors.primary} />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primaryLight }]}>
              <Target size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.goldLight }]}>
              <XPIcon size={18} />
            </View>
            <Text style={styles.statValue}>{progress.stats.xpTotal}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <TrendingUp size={18} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{totalLessonsCompleted}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
        </View>

        {mistakeDrugs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔄 Review Mistakes</Text>
            <View style={styles.mistakesCard}>
              <View style={styles.mistakesHeader}>
                <View style={styles.mistakesHeaderLeft}>
                  <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                    <RotateCcw size={18} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.mistakesHeaderTitle}>
                      {recentMistakes.length} mistake{recentMistakes.length !== 1 ? 's' : ''} this week
                    </Text>
                    <Text style={styles.mistakesHeaderSub}>
                      {mistakeDrugs.length} drug{mistakeDrugs.length !== 1 ? 's' : ''} to review
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.mistakeDrugList}>
                {mistakeDrugs.slice(0, 5).map(({ drugId, drug, count }) => (
                  <View key={drugId} style={styles.mistakeDrugRow}>
                    <View style={styles.mistakeDrugDot} />
                    <Text style={styles.mistakeDrugName} numberOfLines={1}>
                      {drug?.brandName} ({drug?.genericName})
                    </Text>
                    <View style={styles.mistakeCountBadge}>
                      <Text style={styles.mistakeCountText}>×{count}</Text>
                    </View>
                  </View>
                ))}
                {mistakeDrugs.length > 5 && (
                  <Text style={styles.mistakeMoreText}>
                    +{mistakeDrugs.length - 5} more
                  </Text>
                )}
              </View>
              <Pressable
                onPress={startMistakesReview}
                style={({ pressed }) => [
                  styles.mistakesPracticeButton,
                  pressed && { opacity: 0.85 },
                ]}
                testID="review-mistakes"
              >
                <RotateCcw size={16} color="#FFFFFF" />
                <Text style={styles.mistakesPracticeText}>Practice Mistakes</Text>
              </Pressable>
            </View>
          </>
        )}

        <DrugMasteryCard drugMastery={progress.drugMastery ?? {}} />

        {completedChapters.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📚 Review by Module</Text>
            {completedChapters.map(chapter => {
              const completedParts = chapter.parts.filter(
                p => (progress.completedLessons[p.id] ?? 0) >= 70
              );
              if (completedParts.length === 0) return null;

              return (
                <View key={chapter.id} style={styles.reviewChapter}>
                  <View style={styles.reviewChapterHeader}>
                    <View style={[styles.reviewDot, { backgroundColor: chapter.color }]} />
                    <Text style={styles.reviewChapterTitle}>{chapter.title}</Text>
                  </View>
                  <View style={styles.reviewParts}>
                    {completedParts.map(part => (
                      <Pressable
                        key={part.id}
                        onPress={() => startChapterReview(chapter.id, part.id)}
                        style={styles.reviewPartButton}
                      >
                        <Clock size={14} color={Colors.textSecondary} />
                        <Text style={styles.reviewPartText} numberOfLines={1}>{part.title}</Text>
                        <Text style={styles.reviewPartScore}>
                          {progress.completedLessons[part.id]}%
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {completedChapters.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>Complete lessons first!</Text>
            <Text style={styles.emptyDesc}>
              Finish some lessons on the Learn tab to unlock chapter reviews here
            </Text>
          </View>
        )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  spacedCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(249,115,22,0.35)',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dueBadgeText: {
    fontSize: 15,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  quickPracticeCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(14,165,233,0.25)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  brandBlitzCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: Colors.chapterColors[2] + '33',
    shadowColor: Colors.chapterColors[2],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  quickPracticeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  quickPracticeIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPracticeText: {
    flex: 1,
    marginLeft: 14,
  },
  quickPracticeTitle: {
    fontSize: 19,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  quickPracticeDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blitzPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  blitzPillText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  statIcon: {
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
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600' as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  reviewChapter: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  reviewChapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  reviewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reviewChapterTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  reviewParts: {
    gap: 6,
  },
  reviewPartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 14,
    gap: 8,
  },
  reviewPartText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  reviewPartScore: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    paddingHorizontal: 32,
    fontWeight: '500' as const,
  },
  mistakesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  mistakesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  mistakesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mistakesHeaderTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  mistakesHeaderSub: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  mistakeDrugList: {
    gap: 8,
    marginBottom: 14,
  },
  mistakeDrugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  mistakeDrugDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  mistakeDrugName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  mistakeCountBadge: {
    backgroundColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mistakeCountText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#991B1B',
  },
  mistakeMoreText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 2,
  },
  mistakesPracticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
  },
  mistakesPracticeText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
});
