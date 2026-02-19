import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Award, Star, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { DrugMastery } from '@/constants/types';
import { getDrugById } from '@/constants/drugData';

interface DrugMasteryCardProps {
  drugMastery: Record<string, DrugMastery>;
  onViewAll?: () => void;
}

const MASTERY_COLORS = ['#CBD5E1', '#94A3B8', '#0EA5E9', '#8B5CF6', '#F59E0B', '#22C55E'];
const MASTERY_LABELS = ['New', 'Learning', 'Familiar', 'Practiced', 'Strong', 'Mastered'];

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
  const stats = useMemo(() => {
    const entries = Object.entries(drugMastery);
    const total = entries.length;
    const mastered = entries.filter(([, m]) => m.masteryLevel >= 5).length;
    const strong = entries.filter(([, m]) => m.masteryLevel >= 4).length;
    const weak = entries.filter(([, m]) => m.masteryLevel <= 1).length;

    const sorted = [...entries].sort((a, b) => {
      if (a[1].masteryLevel !== b[1].masteryLevel) return a[1].masteryLevel - b[1].masteryLevel;
      return (a[1].nextReviewISO || '').localeCompare(b[1].nextReviewISO || '');
    });

    const weakDrugs = sorted.filter(([, m]) => m.masteryLevel < 3).slice(0, 4);
    const masteredDrugs = sorted.filter(([, m]) => m.masteryLevel >= 5).slice(0, 4);
    const displayDrugs = weakDrugs.length > 0 ? weakDrugs : masteredDrugs.length > 0 ? masteredDrugs : sorted.slice(0, 4);

    return { total, mastered, strong, weak, displayDrugs };
  }, [drugMastery]);

  if (stats.total === 0) return null;

  const masteryPercent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

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
              {stats.mastered}/{stats.total} mastered ({masteryPercent}%)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.overallBar}>
        <View style={[styles.overallBarFill, { width: `${masteryPercent}%` }]} />
      </View>

      <View style={styles.levelBreakdown}>
        <View style={styles.levelItem}>
          <View style={[styles.levelDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.levelText}>{stats.mastered} Mastered</Text>
        </View>
        <View style={styles.levelItem}>
          <View style={[styles.levelDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.levelText}>{stats.strong} Strong</Text>
        </View>
        <View style={styles.levelItem}>
          <View style={[styles.levelDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.levelText}>{stats.weak} Weak</Text>
        </View>
      </View>

      {stats.displayDrugs.length > 0 && (
        <View style={styles.drugList}>
          <Text style={styles.drugListTitle}>
            {stats.displayDrugs[0][1].masteryLevel < 3 ? 'Needs Practice' : 'Top Mastered'}
          </Text>
          {stats.displayDrugs.map(([drugId, mastery]) => (
            <DrugMasteryRow key={drugId} drugId={drugId} mastery={mastery} />
          ))}
        </View>
      )}

      {onViewAll && stats.total > 4 && (
        <Pressable
          onPress={onViewAll}
          style={({ pressed }) => [styles.viewAllButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.viewAllText}>View All Drugs</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </Pressable>
      )}
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
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  overallBarFill: {
    height: 8,
    backgroundColor: Colors.success,
    borderRadius: 4,
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
});
