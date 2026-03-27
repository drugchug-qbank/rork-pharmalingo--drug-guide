import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

type Props = {
  options: string[];
  correctAnswers: string[];
  onComplete: (isCorrect: boolean) => void;
  disabled?: boolean;
};

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export default function MultiSelectQuestion({ options, correctAnswers, onComplete, disabled }: Props) {
  const correctSet = useMemo(() => new Set(correctAnswers), [correctAnswers]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  // Reset between questions (otherwise selections can persist if two multi-select questions appear back-to-back)
  useEffect(() => {
    setSelected(new Set());
    setSubmitted(false);
  }, [options, correctAnswers]);

  const toggle = (opt: string) => {
    if (disabled || submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  const check = () => {
    if (disabled || submitted || selected.size === 0) return;
    const isCorrect = setsEqual(selected, correctSet);
    setSubmitted(true);
    onComplete(isCorrect);
  };

  const optionState = (opt: string): 'default' | 'selected' | 'correct' | 'incorrect' => {
    const isSel = selected.has(opt);
    if (!submitted) return isSel ? 'selected' : 'default';
    const isCorrect = correctSet.has(opt);
    if (isCorrect) return 'correct';
    if (isSel && !isCorrect) return 'incorrect';
    return 'default';
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsWrap}>
        {options.map((opt) => {
          const state = optionState(opt);
          return (
            <Pressable
              key={opt}
              onPress={() => toggle(opt)}
              style={({ pressed }) => [
                styles.option,
                state === 'selected' ? styles.optionSelected : null,
                state === 'correct' ? styles.optionCorrect : null,
                state === 'incorrect' ? styles.optionIncorrect : null,
                pressed && !disabled && !submitted ? { opacity: 0.85 } : null,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  state === 'selected' ? styles.optionTextSelected : null,
                  state === 'correct' ? styles.optionTextCorrect : null,
                  state === 'incorrect' ? styles.optionTextIncorrect : null,
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={check}
        disabled={disabled || submitted || selected.size === 0}
        style={({ pressed }) => [
          styles.checkButton,
          disabled || submitted || selected.size === 0 ? styles.checkDisabled : null,
          pressed && !(disabled || submitted || selected.size === 0) ? { opacity: 0.85 } : null,
        ]}
        testID="multiselect-check"
      >
        <Text style={styles.checkText}>{submitted ? 'Checked' : 'Check'}</Text>
      </Pressable>

      {!submitted ? (
        <Text style={styles.hint}>Select all that apply, then tap Check.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  optionsWrap: {
    gap: 10,
  },
  option: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  optionIncorrect: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  optionText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: Colors.primaryDark,
  },
  optionTextCorrect: {
    color: Colors.text,
  },
  optionTextIncorrect: {
    color: Colors.text,
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
