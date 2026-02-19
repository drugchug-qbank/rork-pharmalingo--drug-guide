import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { MatchPair } from '@/constants/types';

interface MatchingQuestionProps {
  pairs: MatchPair[];
  shuffledGenerics: string[];
  onComplete: (allCorrectFirstTry: boolean, correctCount: number, totalPairs: number) => void;
}

type PairStatus = 'default' | 'correct' | 'incorrect';

export default React.memo(function MatchingQuestion({ pairs, shuffledGenerics, onComplete }: MatchingQuestionProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedGeneric, setSelectedGeneric] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [brandStatuses, setBrandStatuses] = useState<Record<string, PairStatus>>({});
  const [genericStatuses, setGenericStatuses] = useState<Record<string, PairStatus>>({});
  const [mistakes, setMistakes] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const shakeAnims = useRef<Record<string, Animated.Value>>({});
  const scaleAnims = useRef<Record<string, Animated.Value>>({});

  pairs.forEach(p => {
    if (!shakeAnims.current[p.brand]) {
      shakeAnims.current[p.brand] = new Animated.Value(0);
    }
    if (!scaleAnims.current[p.brand]) {
      scaleAnims.current[p.brand] = new Animated.Value(1);
    }
  });
  shuffledGenerics.forEach(g => {
    if (!shakeAnims.current[g]) {
      shakeAnims.current[g] = new Animated.Value(0);
    }
    if (!scaleAnims.current[g]) {
      scaleAnims.current[g] = new Animated.Value(1);
    }
  });

  const tryMatch = useCallback((brand: string, generic: string) => {
    const pair = pairs.find(p => p.brand === brand);
    if (!pair) return;

    const isCorrect = pair.generic === generic;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBrandStatuses(prev => ({ ...prev, [brand]: 'correct' }));
      setGenericStatuses(prev => ({ ...prev, [generic]: 'correct' }));
      setMatchedPairs(prev => ({ ...prev, [brand]: generic }));

      const brandScale = scaleAnims.current[brand];
      const genericScale = scaleAnims.current[generic];
      if (brandScale) {
        Animated.sequence([
          Animated.timing(brandScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
          Animated.spring(brandScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
        ]).start();
      }
      if (genericScale) {
        Animated.sequence([
          Animated.timing(genericScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
          Animated.spring(genericScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
        ]).start();
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMistakes(prev => prev + 1);

      setBrandStatuses(prev => ({ ...prev, [brand]: 'incorrect' }));
      setGenericStatuses(prev => ({ ...prev, [generic]: 'incorrect' }));

      const brandShake = shakeAnims.current[brand];
      const genericShake = shakeAnims.current[generic];
      if (brandShake) {
        Animated.sequence([
          Animated.timing(brandShake, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(brandShake, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(brandShake, { toValue: 4, duration: 50, useNativeDriver: true }),
          Animated.timing(brandShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }
      if (genericShake) {
        Animated.sequence([
          Animated.timing(genericShake, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(genericShake, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(genericShake, { toValue: 4, duration: 50, useNativeDriver: true }),
          Animated.timing(genericShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }

      setTimeout(() => {
        setBrandStatuses(prev => {
          const next = { ...prev };
          if (next[brand] === 'incorrect') delete next[brand];
          return next;
        });
        setGenericStatuses(prev => {
          const next = { ...prev };
          if (next[generic] === 'incorrect') delete next[generic];
          return next;
        });
      }, 600);
    }

    setSelectedBrand(null);
    setSelectedGeneric(null);
  }, [pairs]);

  const handleBrandPress = useCallback((brand: string) => {
    if (matchedPairs[brand]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBrand(prev => prev === brand ? null : brand);
  }, [matchedPairs]);

  const handleGenericPress = useCallback((generic: string) => {
    if (Object.values(matchedPairs).includes(generic)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGeneric(prev => prev === generic ? null : generic);
  }, [matchedPairs]);

  useEffect(() => {
    if (selectedBrand && selectedGeneric) {
      tryMatch(selectedBrand, selectedGeneric);
    }
  }, [selectedBrand, selectedGeneric, tryMatch]);

  useEffect(() => {
    if (!completed && Object.keys(matchedPairs).length === pairs.length) {
      setCompleted(true);
      const allCorrectFirstTry = mistakes === 0;
      setTimeout(() => {
        onComplete(allCorrectFirstTry, pairs.length - mistakes, pairs.length);
      }, 500);
    }
  }, [matchedPairs, pairs.length, mistakes, onComplete, completed]);

  const getBrandStyle = (brand: string) => {
    const status = brandStatuses[brand];
    const isMatched = !!matchedPairs[brand];
    const isSelected = selectedBrand === brand;

    if (status === 'correct' || isMatched) {
      return { backgroundColor: Colors.successLight, borderColor: Colors.success };
    }
    if (status === 'incorrect') {
      return { backgroundColor: Colors.errorLight, borderColor: Colors.error };
    }
    if (isSelected) {
      return { backgroundColor: Colors.primaryLight, borderColor: Colors.primary };
    }
    return { backgroundColor: Colors.surface, borderColor: Colors.border };
  };

  const getGenericStyle = (generic: string) => {
    const status = genericStatuses[generic];
    const isMatched = Object.values(matchedPairs).includes(generic);
    const isSelected = selectedGeneric === generic;

    if (status === 'correct' || isMatched) {
      return { backgroundColor: Colors.successLight, borderColor: Colors.success };
    }
    if (status === 'incorrect') {
      return { backgroundColor: Colors.errorLight, borderColor: Colors.error };
    }
    if (isSelected) {
      return { backgroundColor: Colors.primaryLight, borderColor: Colors.primary };
    }
    return { backgroundColor: Colors.surface, borderColor: Colors.border };
  };

  const matchedCount = Object.keys(matchedPairs).length;

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {matchedCount}/{pairs.length} matched
        </Text>
        {mistakes > 0 && (
          <Text style={styles.mistakesText}>
            {mistakes} mistake{mistakes > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <Text style={styles.hint}>
        {selectedBrand ? `Now tap the generic for "${selectedBrand}"` :
         selectedGeneric ? `Now tap the brand for "${selectedGeneric}"` :
         'Tap a brand name, then its generic'}
      </Text>

      <View style={styles.columnsContainer}>
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Brand</Text>
          {pairs.map(p => {
            const dynamicStyle = getBrandStyle(p.brand);
            const isMatched = !!matchedPairs[p.brand];
            return (
              <Animated.View
                key={p.brand}
                style={{
                  transform: [
                    { translateX: shakeAnims.current[p.brand] || new Animated.Value(0) },
                    { scale: scaleAnims.current[p.brand] || new Animated.Value(1) },
                  ],
                }}
              >
                <Pressable
                  style={[styles.pill, dynamicStyle, isMatched && styles.matchedPill]}
                  onPress={() => handleBrandPress(p.brand)}
                  disabled={isMatched}
                >
                  <Text style={[
                    styles.pillText,
                    isMatched && styles.matchedText,
                    selectedBrand === p.brand && styles.selectedText,
                  ]} numberOfLines={2}>
                    {p.brand}
                  </Text>
                  {isMatched && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.column}>
          <Text style={styles.columnHeader}>Generic</Text>
          {shuffledGenerics.map(g => {
            const dynamicStyle = getGenericStyle(g);
            const isMatched = Object.values(matchedPairs).includes(g);
            return (
              <Animated.View
                key={g}
                style={{
                  transform: [
                    { translateX: shakeAnims.current[g] || new Animated.Value(0) },
                    { scale: scaleAnims.current[g] || new Animated.Value(1) },
                  ],
                }}
              >
                <Pressable
                  style={[styles.pill, dynamicStyle, isMatched && styles.matchedPill]}
                  onPress={() => handleGenericPress(g)}
                  disabled={isMatched}
                >
                  <Text style={[
                    styles.pillText,
                    isMatched && styles.matchedText,
                    selectedGeneric === g && styles.selectedText,
                  ]} numberOfLines={2}>
                    {g}
                  </Text>
                  {isMatched && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  mistakesText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: 14,
    fontStyle: 'italic' as const,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.textTertiary,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  divider: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: 1,
    marginVertical: 28,
  },
  pill: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    borderBottomWidth: 4,
  },
  matchedPill: {
    borderBottomWidth: 2,
    opacity: 0.8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    flex: 1,
  },
  matchedText: {
    color: '#166534',
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: '800' as const,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '800' as const,
  },
});
