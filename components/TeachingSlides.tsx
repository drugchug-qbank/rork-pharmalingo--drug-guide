import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, BookOpen, SkipForward } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { TeachingSlideDeck } from '@/constants/types';
import ProgressBar from '@/components/ProgressBar';

function splitFact(fact: string): { icon: string; label?: string; body: string } {
  const trimmed = (fact ?? '').trim();
  if (!trimmed) return { icon: '💡', body: '' };

  // Allow authors to prefix an emoji icon like: "🎯 Use: HTN • HFrEF"
  const parts = trimmed.split(' ');
  const first = parts[0] ?? '';
  const hasEmojiPrefix = first.length <= 4 && !/[A-Za-z0-9]/.test(first);

  const icon = hasEmojiPrefix ? first : '💡';
  const text = hasEmojiPrefix ? parts.slice(1).join(' ').trim() : trimmed;

  // If the fact includes a short label prefix (e.g. "Use:"), bold it.
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 18) {
    const label = text.slice(0, colonIdx).trim();
    const body = text.slice(colonIdx + 1).trim();
    return { icon, label, body };
  }

  return { icon, body: text };
}

/**
 * Highlights suffix patterns like "-PRIL", "-SARTAN", "-STATIN" inside the subtitle.
 * It finds the first "-letters" and splits it into prefix / suffix / rest.
 */
function splitSuffixHighlight(text: string): { prefix: string; suffix?: string; rest?: string } {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return { prefix: '' };

  const match = trimmed.match(/^(.*?)(-[A-Za-z]+)(.*)$/);
  if (!match) return { prefix: trimmed };

  return { prefix: match[1] ?? '', suffix: match[2] ?? undefined, rest: match[3] ?? '' };
}

type Props = {
  deck: TeachingSlideDeck;
  onDone: () => void;
  onSkip?: () => void;
};

export default function TeachingSlides({ deck, onDone, onSkip }: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  const slide = deck.slides[slideIndex];

  const highlightParts = useMemo(
    () => splitSuffixHighlight(slide?.subtitle ?? ''),
    [slide?.subtitle]
  );

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

    // No facts? just advance
    if (factsLen <= 0) {
      if (slideIndex < deck.slides.length - 1) {
        setSlideIndex((i) => i + 1);
        setFactIndex(0);
        return;
      }
      onDone();
      return;
    }

    // Next fact on same slide
    if (factIndex < factsLen - 1) {
      setFactIndex((i) => i + 1);
      return;
    }

    // Next slide
    if (slideIndex < deck.slides.length - 1) {
      setSlideIndex((i) => i + 1);
      setFactIndex(0);
      return;
    }

    // End of deck
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
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <BookOpen size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>FIRST‑TIME QUICK TEACH</Text>
          </View>

          <Text style={styles.deckTitle}>{deck.title}</Text>

          <Text style={styles.slideCounter}>
            Slide {slideIndex + 1}/{deck.slides.length} •{' '}
            {Math.min(factIndex + 1, slide.facts.length)}/{slide.facts.length} facts
          </Text>

          <ProgressBar progress={progressPercent} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.skipButton, pressed ? { opacity: 0.8 } : null]}
          onPress={handleSkip}
          testID="skip-teaching"
        >
          <SkipForward size={16} color={Colors.textSecondary} />
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Card */}
      <View style={styles.slideCard}>
        <View style={styles.slideHeader}>
          <View style={styles.slideEmojiBubble}>
            <Text style={styles.slideEmoji}>{slide.emoji ?? '💡'}</Text>
          </View>

          <Text style={styles.slideTitle}>{slide.title}</Text>

          {slide.subtitle ? (
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>
                {highlightParts.prefix}
                {highlightParts.suffix ? (
                  <Text style={styles.highlightSuffix}>{highlightParts.suffix}</Text>
                ) : null}
                {highlightParts.rest}
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Key Info</Text>
        </View>

        <ScrollView
          style={styles.factsScroll}
          contentContainerStyle={styles.factsContent}
          showsVerticalScrollIndicator={false}
        >
          {visibleFacts.map((fact, idx) => {
            const isNewest = idx === visibleFacts.length - 1;
            const parsed = splitFact(fact);

            return (
              <Animated.View
                key={`${slide.id}-${idx}`}
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
                        opacity: popAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      }
                    : null,
                ]}
              >
                <View style={styles.factIcon}>
                  <Text style={styles.factIconText}>{parsed.icon}</Text>
                </View>

                <Text style={styles.factText}>
                  {parsed.label ? <Text style={styles.factLabel}>{parsed.label}: </Text> : null}
                  {parsed.body}
                </Text>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Next */}
      <Pressable
        style={({ pressed }) => [styles.nextButton, pressed ? { opacity: 0.9 } : null]}
        onPress={handleNext}
        testID="teaching-next"
      >
        <Text style={styles.nextText}>{nextLabel}</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.footerHint}>
        These slides show only once. You’ll still see key concepts again as quiz questions.
      </Text>
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
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  deckTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  slideCounter: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
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
    fontWeight: '800',
    fontSize: 14,
  },
  slideCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  slideHeader: {
    alignItems: 'center',
    gap: 10,
  },
  slideEmojiBubble: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideEmoji: {
    fontSize: 30,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  highlightBox: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  highlightText: {
    color: Colors.primaryDark,
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  highlightSuffix: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 20,
  },
  sectionTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
    color: Colors.secondary,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  factsScroll: {
    flex: 1,
  },
  factsContent: {
    paddingVertical: 4,
    gap: 9,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.background,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  factIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  factIconText: {
    fontSize: 16,
  },
  factText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
    fontWeight: '700',
  },
  factLabel: {
    color: Colors.primaryDark,
    fontWeight: '900',
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
    fontSize: 17,
    fontWeight: '900',
  },
  footerHint: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 40,
  },
});
