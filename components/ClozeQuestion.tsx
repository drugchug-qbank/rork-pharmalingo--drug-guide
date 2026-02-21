import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { ClozeSpec } from '@/constants/types';

type Props = {
  cloze: ClozeSpec;
  onComplete: (isCorrect: boolean) => void;
  disabled?: boolean;
};

export default function ClozeQuestion({ cloze, onComplete, disabled }: Props) {
  const blanks = Math.max(1, cloze.correctWords.length);
  const safeParts = useMemo(() => {
    // Ensure parts length is blanks + 1
    if (cloze.parts.length === blanks + 1) return cloze.parts;
    const parts = [...cloze.parts];
    while (parts.length < blanks + 1) parts.push('');
    return parts.slice(0, blanks + 1);
  }, [cloze.parts, blanks]);

  const [filled, setFilled] = useState<(string | null)[]>(Array(blanks).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const usedWords = useMemo(() => new Set(filled.filter(Boolean) as string[]), [filled]);
  const allFilled = filled.every((w) => !!w);

  const removeAt = (blankIndex: number) => {
    if (disabled || submitted) return;
    setFilled((prev) => {
      const next = [...prev];
      next[blankIndex] = null;
      return next;
    });
  };

  const toggleWord = (word: string) => {
    if (disabled || submitted) return;
    setFilled((prev) => {
      const idx = prev.findIndex((w) => w === word);
      if (idx === -1) {
        const next = [...prev];
        const empty = next.findIndex((w) => !w);
        if (empty === -1) return prev;
        next[empty] = word;
        return next;
      }
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const check = () => {
    if (disabled || submitted || !allFilled) return;
    const isCorrect = filled.every((w, i) => w === cloze.correctWords[i]);
    setSubmitted(true);
    onComplete(isCorrect);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sentenceWrap}>
        {safeParts.map((part, i) => (
          <React.Fragment key={`part-${i}`}> 
            <Text style={styles.sentenceText}>{part}</Text>
            {i < blanks ? (
              <Pressable
                onPress={() => removeAt(i)}
                style={({ pressed }) => [
                  styles.blank,
                  submitted
                    ? filled[i] === cloze.correctWords[i]
                      ? styles.blankCorrect
                      : styles.blankIncorrect
                    : null,
                  pressed && !disabled && !submitted ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.blankText}>{filled[i] ?? '____'}</Text>
              </Pressable>
            ) : null}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.wordBank}>
        {cloze.wordBank.map((word) => {
          const isUsed = usedWords.has(word);
          return (
            <Pressable
              key={word}
              onPress={() => toggleWord(word)}
              style={({ pressed }) => [
                styles.wordChip,
                isUsed ? styles.wordChipUsed : null,
                pressed && !disabled && !submitted ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={[styles.wordText, isUsed ? styles.wordTextUsed : null]}>{word}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={check}
        disabled={disabled || submitted || !allFilled}
        style={({ pressed }) => [
          styles.checkButton,
          disabled || submitted || !allFilled ? styles.checkDisabled : null,
          pressed && !(disabled || submitted || !allFilled) ? { opacity: 0.85 } : null,
        ]}
        testID="cloze-check"
      >
        <Text style={styles.checkText}>{submitted ? 'Checked' : 'Check'}</Text>
      </Pressable>

      {!submitted ? (
        <Text style={styles.hint}>Tap words to fill the blank(s). Tap a blank to remove.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sentenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  sentenceText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  blank: {
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankCorrect: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  blankIncorrect: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  blankText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '800' as const,
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  wordChipUsed: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  wordText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  wordTextUsed: {
    color: Colors.textSecondary,
  },
  checkButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  checkDisabled: {
    backgroundColor: Colors.border,
  },
  checkText: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
    fontSize: 16,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
