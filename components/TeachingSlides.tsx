import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, BookOpen, SkipForward } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TeachingSlideDeck } from '@/constants/types';
import ProgressBar from '@/components/ProgressBar';

type Props = {
  deck: TeachingSlideDeck;
  onDone: () => void;
  onSkip?: () => void;
};

export default function TeachingSlides({ deck, onDone, onSkip }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  const slide = deck.slides[slideIndex];

  const totalFacts = useMemo(
    () => deck.slides.reduce((sum, s) => sum + (s.facts?.length ?? 0), 0),
    [deck.slides]
  );

  const revealedFactsCount = useMemo(() => {
    const prior = deck.slides
      .slice(0, slideIndex)
      .reduce((sum, s) => sum + (s.facts?.length ?? 0), 0);
    return prior + (factIndex + 1);
  }, [deck.slides, slideIndex, factIndex]);

  const progressPercent = totalFacts > 0 ? (revealedFactsCount / totalFacts) * 100 : 0;

  const visibleFacts = useMemo(() => {
    const facts = slide?.facts ?? [];
    return facts.slice(0, Math.min(factIndex + 1, facts.length));
  }, [slide, factIndex]);

  // Subtle animation when a new fact appears
  const popAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    popAnim.setValue(0);
    Animated.spring(popAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [slideIndex, factIndex, popAnim]);

  const isLastFactOnSlide = factIndex >= (slide?.facts?.length ?? 0) - 1;
  const isLastSlide = slideIndex >= deck.slides.length - 1;

  const nextLabel = useMemo(() => {
    if (!isLastFactOnSlide) return 'Next';
    if (!isLastSlide) return `Next: ${deck.slides[slideIndex + 1]?.title ?? 'Continue'}`;
    return 'Start Quiz';
  }, [isLastFactOnSlide, isLastSlide, deck.slides, slideIndex]);

  const handleNext = () => {
    const factsLen = slide?.facts?.length ?? 0;
    if (factsLen <= 0) {
      // No facts? just advance
      if (slideIndex < deck.slides.length - 1) {
        setSlideIndex((i) => i + 1);
        setFactIndex(0);
        return;
      }
      onDone();
      return;
    }

    if (factIndex < factsLen - 1) {
      setFactIndex((i) => i + 1);
      return;
    }

    if (slideIndex < deck.slides.length - 1) {
      setSlideIndex((i) => i + 1);
      setFactIndex(0);
      return;
    }

    onDone();
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    else onDone();
  };

  if (!slide) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No teaching slides found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <BookOpen size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>FIRST‑TIME QUICK TEACH</Text>
          </View>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.slideCounter}>
            Slide {slideIndex + 1} of {deck.slides.length} • Fact {Math.min(factIndex + 1, slide.facts.length)} of{' '}
            {slide.facts.length}
          </Text>
        </View>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [styles.skipButton, pressed ? { opacity: 0.8 } : null]}
          testID="skip-teaching"
        >
          <SkipForward size={16} color={Colors.textSecondary} />
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ProgressBar progress={progressPercent} height={10} color={Colors.primary} />

      <View style={styles.slideCard}>
        <View style={styles.slideTitleRow}>
          <Text style={styles.slideEmoji}>{slide.emoji ?? '💡'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            {slide.subtitle ? <Text style={styles.slideSubtitle}>{slide.subtitle}</Text> : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Key things to know</Text>

        <ScrollView
          style={styles.factsScroll}
          contentContainerStyle={styles.factsContent}
          showsVerticalScrollIndicator={false}
        >
          {visibleFacts.map((fact, idx) => {
            const isNewest = idx === visibleFacts.length - 1;
            return (
              <Animated.View
                key={`${slide.id}-fact-${idx}`}
                style={[
                  styles.factRow,
                  isNewest
                    ? {
                        transform: [
                          {
                            scale: popAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.98, 1],
                            }),
                          },
                        ],
                        opacity: popAnim,
                      }
                    : null,
                ]}
              >
                <View style={styles.bulletDot} />
                <Text style={styles.factText}>{fact}</Text>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      <Pressable
        onPress={handleNext}
        style={({ pressed }) => [styles.nextButton, pressed ? { opacity: 0.9 } : null]}
        testID="teaching-next"
      >
        <Text style={styles.nextText}>{nextLabel}</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.footerHint}>These slides show only once. You’ll still see key concepts again as quiz questions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '900' as const,
    letterSpacing: 0.4,
  },
  deckTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  slideCounter: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700' as const,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipText: {
    color: Colors.textSecondary,
    fontWeight: '800' as const,
    fontSize: 13,
  },
  slideCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  slideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slideEmoji: {
    fontSize: 28,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  slideSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.secondary,
    letterSpacing: 0.2,
  },
  factsScroll: {
    flex: 1,
  },
  factsContent: {
    paddingVertical: 6,
    gap: 12,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  factText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900' as const,
  },
  footerHint: {
    textAlign: 'center' as const,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  errorText: {
    textAlign: 'center' as const,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700' as const,
    marginTop: 40,
  },
});
