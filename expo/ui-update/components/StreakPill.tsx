import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';

import Colors from '@/constants/colors';

type StreakPillSize = 'sm' | 'md' | 'lg';

export type StreakPillProps = {
  value: number;
  /** Size for icon + typography. Defaults to 'md'. */
  size?: StreakPillSize;
  /** Use when displayed on a dark/blue header background. Defaults to true. */
  onDark?: boolean;
  /** Optional style override for the outer pill container. */
  style?: ViewStyle;
  /** Accessibility label override. */
  accessibilityLabel?: string;
};

const SIZE_MAP: Record<StreakPillSize, {
  px: number;
  py: number;
  gap: number;
  icon: number;
  flame: number;
  font: number;
  radius: number;
}> = {
  sm: { px: 10, py: 6, gap: 6, icon: 20, flame: 12, font: 14, radius: 14 },
  md: { px: 12, py: 7, gap: 7, icon: 24, flame: 14, font: 15, radius: 16 },
  lg: { px: 14, py: 9, gap: 8, icon: 28, flame: 16, font: 16, radius: 18 },
};

export default function StreakPill({
  value,
  size = 'md',
  onDark = true,
  style,
  accessibilityLabel,
}: StreakPillProps) {
  const s = SIZE_MAP[size];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `Streak ${value} days`}
      style={[
        styles.pill,
        onDark ? styles.pillOnDark : styles.pillOnLight,
        {
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderRadius: s.radius,
          gap: s.gap,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['#FDBA74', '#F97316', '#EF4444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: s.icon / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Flame size={s.flame} color="#FFFFFF" strokeWidth={2.6} />
      </LinearGradient>

      <Text style={[styles.value, onDark ? styles.valueOnDark : styles.valueOnLight, { fontSize: s.font }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillOnDark: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pillOnLight: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  value: {
    fontWeight: '900' as const,
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'] as const,
  },
  valueOnDark: {
    color: '#FFFFFF',
  },
  valueOnLight: {
    color: Colors.text,
  },
});
