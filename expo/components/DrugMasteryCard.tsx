import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, useWindowDimensions, Alert } from 'react-native';
import { Award, Star, ChevronRight, ChevronLeft, Clock, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { DrugMastery } from '@/constants/types';
import { drugs, getDrugById } from '@/constants/drugData';

interface DrugMasteryCardProps {
  drugMastery: Record<string, DrugMastery>;
  onViewAll?: () => void;
}

const MASTERY_COLORS = ['#CBD5E1', '#94A3B8', '#0EA5E9', '#8B5CF6', '#F59E0B', '#22C55E'];
const MASTERY_LABELS = ['New', 'Learning', 'Familiar', 'Practiced', 'Strong', 'Mastered'];

type MasteryBucket = 'mastered' | 'strong' | 'weak' | 'unseen';
type BucketViewMode = 'list' | 'swipe';

const MasteryBar = React.memo(function MasteryBar({ level }: { level: number }) {
  return (
    <View style={styles.masteryBarContainer}>
      {[0, 1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[
            styles.masterySegment,
            { backgroundColor: i < level ? MASTERY_COLORS[level] : '#E2E8F0' },
          ]}
        />
      ))}
    </View>
  );
});

const DrugMasteryRow = React.memo(function DrugMasteryRow({
  drugId,
  mastery,
}: {
  drugId: string;
  mastery: DrugMastery;
}) {
  const drug = getDrugById(drugId);
  if (!drug) return null;

  const isMastered = mastery.masteryLevel >= 5;

  return (
    <View style={[styles.drugRow, isMastered && styles.drugRowMastered]}>
      <View style={styles.drugInfo}>
        <View style={styles.drugNameRow}>
          <Text style={styles.drugBrand} numberOfLines={1}>{drug.brandName}</Text>
          {isMastered && (
            <View style={styles.masteredBadge}>
              <Star size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={styles.drugGeneric} numberOfLines={1}>{drug.genericName}</Text>
      </View>
      <View style={styles.masteryRight}>
        <MasteryBar level={mastery.masteryLevel} />
        <Text style={[styles.masteryLabel, { color: MASTERY_COLORS[mastery.masteryLevel] }]}>
          {MASTERY_LABELS[mastery.masteryLevel]}
        </Text>
      </View>
    </View>
  );
});

export default React.memo(function DrugMasteryCard({ drugMastery, onViewAll }: DrugMasteryCardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const modalWidth = Math.min(windowWidth - 28, 520);
  const modalMaxHeight = Math.min(windowHeight - 160, 700);

  const [bucketOpen, setBucketOpen] = useState<MasteryBucket | null>(null);
  const [bucketIndex, setBucketIndex] = useState(0);
  const [bucketView, setBucketView] = useState<BucketViewMode>('list');

  const stats = useMemo(() => {
    const now = Date.now();
    const entries = Object.entries(drugMastery);
    const seen = entries.length;
    const totalPossible = drugs.length;

    const mastered = entries.filter(([, m]) => m.masteryLevel >= 5).length;
    const strong = entries.filter(([, m]) => m.masteryLevel === 4).length;
    const weak = entries.filter(([, m]) => m.masteryLevel <= 1).length;
    const dueNow = entries.filter(([, m]) => {
      if (!m.nextReviewISO) return false;
      const t = new Date(m.nextReviewISO).getTime();
      return Number.isFinite(t) && t <= now;
    }).length;
    const unseen = Math.max(0, totalPossible - seen);

    const masteryIdSet = new Set(entries.map(([id]) => id));
    const unseenIds = drugs.filter(d => !masteryIdSet.has(d.id)).map(d => d.id);

    const masteredIds = entries
      .filter(([, m]) => m.masteryLevel >= 5)
      .sort((a, b) => (b[1].lastSeenISO || '').localeCompare(a[1].lastSeenISO || ''))
      .map(([id]) => id);

    const strongIds = entries
      .filter(([, m]) => m.masteryLevel === 4)
      .sort((a, b) => (b[1].lastSeenISO || '').localeCompare(a[1].lastSeenISO || ''))
      .map(([id]) => id);

    const weakIds = entries
      .filter(([, m]) => m.masteryLevel <= 1)
      .sort((a, b) => {
        if (a[1].masteryLevel !== b[1].masteryLevel) return a[1].masteryLevel - b[1].masteryLevel;
        return (a[1].nextReviewISO || '').localeCompare(b[1].nextReviewISO || '');
      })
      .map(([id]) => id);

    const sorted = [...entries].sort((a, b) => {
      if (a[1].masteryLevel !== b[1].masteryLevel) return a[1].masteryLevel - b[1].masteryLevel;
      return (a[1].nextReviewISO || '').localeCompare(b[1].nextReviewISO || '');
    });

    const dueList = sorted.filter(([, m]) => {
      if (!m.nextReviewISO) return false;
      const t = new Date(m.nextReviewISO).getTime();
      return Number.isFinite(t) && t <= now;
    });

    const needsPractice = sorted.filter(([, m]) => m.masteryLevel < 3);
    const topMastered = sorted.filter(([, m]) => m.masteryLevel >= 5);

    let displayTitle = 'Needs Practice';
    let displayDrugs = needsPractice.slice(0, 4);
    if (dueList.length > 0) {
      displayTitle = 'Due for Review';
      displayDrugs = dueList.slice(0, 4);
    } else if (needsPractice.length > 0) {
      displayTitle = 'Needs Practice';
      displayDrugs = needsPractice.slice(0, 4);
    } else if (topMastered.length > 0) {
      displayTitle = 'Top Mastered';
      displayDrugs = topMastered.slice(0, 4);
    } else {
      displayTitle = 'Recently Studied';
      displayDrugs = sorted.slice(0, 4);
    }

    return {
      totalPossible,
      seen,
      mastered,
      strong,
      weak,
      unseen,
      dueNow,
      displayTitle,
      displayDrugs,
      masteredIds,
      strongIds,
      weakIds,
      unseenIds,
    };
  }, [drugMastery]);

  const masteryPercent = stats.totalPossible > 0 ? Math.round((stats.mastered / stats.totalPossible) * 100) : 0;
  const seenPercent = stats.totalPossible > 0 ? Math.round((stats.seen / stats.totalPossible) * 100) : 0;

  const getBucketLabel = (bucket: MasteryBucket): string => {
    switch (bucket) {
      case 'mastered':
        return 'Mastered';
      case 'strong':
        return 'Strong';
      case 'weak':
        return 'Weak';
      case 'unseen':
        return 'Unseen';
    }
  };

  const bucketTotalCount = useMemo(() => {
    if (!bucketOpen) return 0;
    if (bucketOpen === 'mastered') return stats.masteredIds.length;
    if (bucketOpen === 'strong') return stats.strongIds.length;
    if (bucketOpen === 'weak') return stats.weakIds.length;
    return stats.unseenIds.length;
  }, [bucketOpen, stats.masteredIds.length, stats.strongIds.length, stats.weakIds.length, stats.unseenIds.length]);

  const bucketIdsAll = useMemo(() => {
    if (!bucketOpen) return [] as string[];
    return bucketOpen === 'mastered'
      ? stats.masteredIds
      : bucketOpen === 'strong'
        ? stats.strongIds
        : bucketOpen === 'weak'
          ? stats.weakIds
          : stats.unseenIds;
  }, [bucketOpen, stats.masteredIds, stats.strongIds, stats.weakIds, stats.unseenIds]);

  const openBucket = useCallback(
    (bucket: MasteryBucket) => {
      const count =
        bucket === 'mastered'
          ? stats.masteredIds.length
          : bucket === 'strong'
            ? stats.strongIds.length
            : bucket === 'weak'
              ? stats.weakIds.length
              : stats.unseenIds.length;

      if (count === 0) {
        Alert.alert('Nothing here yet', `No ${getBucketLabel(bucket).toLowerCase()} drugs yet. Keep practicing!`);
        return;
      }

      setBucketIndex(0);
      setBucketView('list');
      setBucketOpen(bucket);
    },
    [stats.masteredIds.length, stats.strongIds.length, stats.weakIds.length, stats.unseenIds.length]
  );

  const closeBucket = useCallback(() => {
    setBucketOpen(null);
    setBucketIndex(0);
    setBucketView('list');
  }, []);

  const openBucketSwiperAt = useCallback((index: number) => {
    if (!bucketOpen) return;
    const max = bucketIdsAll.length;
    const safeIndex = Math.min(Math.max(0, index), Math.max(0, max - 1));
    setBucketIndex(safeIndex);
    setBucketView('swipe');
  }, [bucketOpen, bucketIdsAll.length]);

  const onBucketScrollEnd = useCallback(
    (e: any) => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      const idx = Math.round(x / Math.max(1, modalWidth));
      if (Number.isFinite(idx)) setBucketIndex(idx);
    },
    [modalWidth]
  );

  const renderBucketListRow = useCallback(
    ({ item: drugId, index }: { item: string; index: number }) => {
      const drug = getDrugById(drugId);
      if (!drug) return null;

      const mastery = drugMastery[drugId];
      const isUnseen = bucketOpen === 'unseen' || !mastery;
      const masteryLevel = isUnseen ? 0 : mastery.masteryLevel;
      const label = isUnseen ? 'Unseen' : MASTERY_LABELS[masteryLevel] ?? 'Learning';
      const labelColor = isUnseen ? '#94A3B8' : MASTERY_COLORS[masteryLevel] ?? '#94A3B8';

      return (
        <Pressable
          onPress={() => openBucketSwiperAt(index)}
          style={({ pressed }) => [styles.bucketListRow, pressed ? { opacity: 0.85 } : null]}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.bucketListBrand} numberOfLines={1}>{drug.brandName}</Text>
            <Text style={styles.bucketListGeneric} numberOfLines={1}>{drug.genericName}</Text>
          </View>

          <View style={styles.bucketListRight}>
            {!isUnseen ? <MasteryBar level={masteryLevel} /> : <View style={styles.bucketListUnseenBar} />}
            <Text style={[styles.bucketListLabel, { color: labelColor }]} numberOfLines={1}>{label}</Text>
          </View>

          <ChevronRight size={18} color={Colors.textSecondary} />
        </Pressable>
      );
    },
    [bucketOpen, drugMastery, openBucketSwiperAt]
  );

  const renderBucketCard = useCallback(
    ({ item: drugId }: { item: string }) => {
      const drug = getDrugById(drugId);
      if (!drug) return <View style={[styles.bucketPage, { width: modalWidth }]} />;

      const mastery = drugMastery[drugId];
      const isUnseen = bucketOpen === 'unseen' || !mastery;
      const masteryLevel = isUnseen ? 0 : mastery.masteryLevel;

      const label = isUnseen ? 'Unseen' : MASTERY_LABELS[masteryLevel] ?? 'Learning';
      const labelColor = isUnseen ? '#94A3B8' : MASTERY_COLORS[masteryLevel] ?? '#94A3B8';

      const uses = (drug.indications ?? []).slice(0, 3);
      const aes = (drug.sideEffects ?? []).slice(0, 3);

      return (
        <View style={[styles.bucketPage, { width: modalWidth }]}>
          <View style={styles.bucketCard}>
            <Text style={styles.bucketBrand} numberOfLines={2}>
              {drug.brandName}
            </Text>
            <Text style={styles.bucketGeneric} numberOfLines={2}>
              {drug.genericName}
            </Text>

            <View style={styles.bucketChip}>
              <Text style={styles.bucketChipText} numberOfLines={2}>
                {drug.drugClass}
              </Text>
            </View>

            <View style={styles.bucketFacts}>
              {uses.length > 0 && (
                <Text style={styles.bucketFact} numberOfLines={2}>
                  <Text style={styles.factEmoji}>🎯 </Text>
                  <Text style={styles.factLabel}>Uses: </Text>
                  {uses.join(' • ')}
                </Text>
              )}
              {aes.length > 0 && (
                <Text style={styles.bucketFact} numberOfLines={2}>
                  <Text style={styles.factEmoji}>⚠️ </Text>
                  <Text style={styles.factLabel}>AEs: </Text>
                  {aes.join(' • ')}
                </Text>
              )}
              {drug.keyFact ? (
                <Text style={styles.bucketPearl} numberOfLines={3}>
                  <Text style={styles.factEmoji}>✨ </Text>
                  {drug.keyFact}
                </Text>
              ) : null}
            </View>

            <View style={styles.bucketFooter}>
              <MasteryBar level={masteryLevel} />
              <Text style={[styles.bucketStatus, { color: labelColor }]}>{label}</Text>
            </View>
          </View>
        </View>
      );
    },
    [bucketOpen, drugMastery, modalWidth]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Award size={20} color={Colors.gold} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Drug Mastery</Text>
            <Text style={styles.headerSub}>
              {stats.mastered}/{stats.totalPossible} mastered • {stats.seen}/{stats.totalPossible} seen
            </Text>
          </View>
        </View>

        {stats.dueNow > 0 && (
          <View style={styles.duePill}>
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.duePillText}>{stats.dueNow} due</Text>
          </View>
        )}
      </View>

      <View style={styles.overallBar}>
        <View style={[styles.overallBarSeen, { width: `${seenPercent}%` }]} />
        <View style={[styles.overallBarFill, { width: `${masteryPercent}%` }]} />
      </View>

      <View style={styles.levelBreakdown}>
        <Pressable onPress={() => openBucket('mastered')} style={styles.levelItem} hitSlop={8}>
          <View style={[styles.levelDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.levelText}>{stats.mastered} Mastered</Text>
        </Pressable>
        <Pressable onPress={() => openBucket('strong')} style={styles.levelItem} hitSlop={8}>
          <View style={[styles.levelDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.levelText}>{stats.strong} Strong</Text>
        </Pressable>
        <Pressable onPress={() => openBucket('weak')} style={styles.levelItem} hitSlop={8}>
          <View style={[styles.levelDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.levelText}>{stats.weak} Weak</Text>
        </Pressable>
        <Pressable onPress={() => openBucket('unseen')} style={styles.levelItem} hitSlop={8}>
          <View style={[styles.levelDot, { backgroundColor: '#CBD5E1' }]} />
          <Text style={styles.levelText}>{stats.unseen} Unseen</Text>
        </Pressable>
      </View>

      {stats.displayDrugs.length > 0 && (
        <View style={styles.drugList}>
          <Text style={styles.drugListTitle}>{stats.displayTitle}</Text>
          {stats.displayDrugs.map(([drugId, mastery]) => (
            <DrugMasteryRow key={drugId} drugId={drugId} mastery={mastery} />
          ))}
        </View>
      )}

      {stats.displayDrugs.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start building mastery</Text>
          <Text style={styles.emptyText}>Complete a quiz or practice session to start tracking your Top 300 progress.</Text>
        </View>
      )}

      {onViewAll && stats.seen > 4 && (
        <Pressable
          onPress={onViewAll}
          style={({ pressed }) => [styles.viewAllButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.viewAllText}>View All Drugs</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </Pressable>
      )}

      <Modal
        visible={bucketOpen !== null}
        transparent
        animationType="fade"
        onRequestClose={closeBucket}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: modalWidth, maxHeight: modalMaxHeight }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {bucketView === 'swipe' ? (
                  <Pressable
                    onPress={() => setBucketView('list')}
                    style={({ pressed }) => [styles.modalBack, pressed ? { opacity: 0.85 } : null]}
                    hitSlop={8}
                  >
                    <ChevronLeft size={18} color={Colors.textSecondary} />
                    <Text style={styles.modalBackText}>List</Text>
                  </Pressable>
                ) : null}

                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{bucketOpen ? getBucketLabel(bucketOpen) : ''}</Text>
                  {bucketView === 'list' ? (
                    <Text style={styles.modalSub}>
                      {bucketTotalCount} drug{bucketTotalCount === 1 ? '' : 's'} • Tap a drug to swipe
                    </Text>
                  ) : (
                    <Text style={styles.modalSub}>
                      Swipe → {bucketIdsAll.length > 0 ? `${bucketIndex + 1}/${bucketIdsAll.length}` : ''}
                    </Text>
                  )}
                </View>
              </View>

              <Pressable onPress={closeBucket} style={styles.modalClose} hitSlop={8}>
                <X size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {bucketView === 'list' ? (
              <FlatList
                data={bucketIdsAll}
                keyExtractor={(id) => id}
                renderItem={renderBucketListRow}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 14, paddingBottom: 18 }}
              />
            ) : (
              <FlatList
                data={bucketIdsAll}
                keyExtractor={(id) => id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={renderBucketCard}
                onMomentumScrollEnd={onBucketScrollEnd}
                bounces={false}
                initialScrollIndex={Math.min(bucketIndex, Math.max(0, bucketIdsAll.length - 1))}
                getItemLayout={(_, index) => ({ length: modalWidth, offset: modalWidth * index, index })}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  overallBar: {
    position: 'relative',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  overallBarSeen: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(14,165,233,0.35)',
    borderRadius: 4,
  },
  overallBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  duePillText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  levelBreakdown: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  drugList: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
    paddingTop: 12,
  },
  emptyState: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
    paddingTop: 12,
    paddingBottom: 2,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  drugListTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  drugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  drugRowMastered: {
    backgroundColor: '#F0FDF4',
  },
  drugInfo: {
    flex: 1,
    marginRight: 12,
  },
  drugNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drugBrand: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  masteredBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drugGeneric: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  masteryRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  masteryBarContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  masterySegment: {
    width: 14,
    height: 6,
    borderRadius: 3,
  },
  masteryLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceAlt,
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  modalBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  modalBackText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bucketListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginBottom: 10,
  },
  bucketListBrand: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  bucketListGeneric: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bucketListRight: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 86,
  },
  bucketListUnseenBar: {
    width: 70,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  bucketListLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
  },

  bucketPage: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  bucketCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bucketBrand: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  bucketGeneric: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  bucketChip: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    maxWidth: '100%',
  },
  bucketChipText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  bucketFacts: {
    marginTop: 12,
    gap: 8,
  },
  bucketFact: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 18,
  },
  bucketPearl: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  factEmoji: {
    fontSize: 13,
  },
  factLabel: {
    fontWeight: '900' as const,
    color: Colors.primaryDark,
  },
  bucketFooter: {
    marginTop: 14,
    alignItems: 'center',
    gap: 6,
  },
  bucketStatus: {
    fontSize: 12,
    fontWeight: '900' as const,
  },
});
