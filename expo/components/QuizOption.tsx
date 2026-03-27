import React, { useRef, useCallback } from 'react';
import { Text, StyleSheet, Animated, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface QuizOptionProps {
  text: string;
  onPress: () => void;
  state: 'default' | 'correct' | 'incorrect' | 'disabled';
  index: number;
}

const LETTERS = ['A', 'B', 'C', 'D'];
export default React.memo(function QuizOption({ text, onPress, state, index }: QuizOptionProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (state !== 'default') return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [state, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (state !== 'default') return;
    if (state === 'default') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [state, onPress]);

  const getBorderColor = () => {
    switch (state) {
      case 'correct': return Colors.success;
      case 'incorrect': return Colors.error;
      default: return Colors.border;
    }
  };

  const getBgColor = () => {
    switch (state) {
      case 'correct': return Colors.successLight;
      case 'incorrect': return Colors.errorLight;
      default: return Colors.surface;
    }
  };

  const getLetterBg = () => {
    switch (state) {
      case 'correct': return Colors.success;
      case 'incorrect': return Colors.error;
      default: return Colors.primaryLight;
    }
  };

  const getLetterColor = () => {
    switch (state) {
      case 'correct':
      case 'incorrect':
        return '#FFFFFF';
      default: return Colors.primary;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBgColor(),
            borderWidth: state === 'correct' || state === 'incorrect' ? 2.5 : 2,
            borderBottomWidth: state === 'correct' || state === 'incorrect' ? 2.5 : 4,
          },
          state === 'disabled' && styles.disabled,
        ]}
        testID={`quiz-option-${index}`}
      >
        <View style={[styles.letter, { backgroundColor: getLetterBg() }]}>
          <Text style={[styles.letterText, { color: getLetterColor() }]}>
            {LETTERS[index]}
          </Text>
        </View>
        <Text
          style={[
            styles.text,
            state === 'correct' && styles.correctText,
            state === 'incorrect' && styles.incorrectText,
            state === 'disabled' && styles.disabledText,
          ]}
          numberOfLines={3}
        >
          {text}
        </Text>
        {state === 'correct' && <Text style={styles.stateEmoji}>✅</Text>}
        {state === 'incorrect' && <Text style={styles.stateEmoji}>❌</Text>}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  disabled: {
    opacity: 0.4,
  },
  letter: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  letterText: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  text: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600' as const,
    lineHeight: 21,
  },
  correctText: {
    color: '#166534',
    fontWeight: '700' as const,
  },
  incorrectText: {
    color: Colors.error,
    fontWeight: '700' as const,
  },
  disabledText: {
    color: Colors.textTertiary,
  },
  stateEmoji: {
    fontSize: 18,
    marginLeft: 8,
  },
});
