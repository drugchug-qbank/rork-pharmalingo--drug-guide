import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import {
  Heart,
  Activity,
  Droplet,
  Brain,
  Pill,
  Shield,
  Wind,
  Stethoscope,
  Syringe,
  Bug,
  BookOpen,
} from 'lucide-react-native';

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type ChapterNodeProps = {
  title: string;
  subtitle: string;
  icon: any; // can be a component (Heart) OR a string ("Heart") OR a JSX element
  color: string;
  progress: number;
  isLocked: boolean;
  index: number;
  onPress: () => void;
};

const ICON_MAP: Record<string, IconComponent> = {
  Heart,
  Activity,
  Droplet,
  Brain,
  Pill,
  Shield,
  Wind,
  Stethoscope,
  Syringe,
  Bug,
  BookOpen,
};

export default function ChapterNode({
  title,
  subtitle,
  icon,
  color,
  progress,
  isLocked,
  index,
  onPress,
}: ChapterNodeProps) {
  const pct = useMemo(() => {
    const n = Number(progress ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }, [progress]);

  const isCompleted = !isLocked && pct >= 100;
  const isInProgress = !isLocked && pct > 0 && pct < 100;

  // Bubble shows for: locked, in-progress, completed (matches the "status bubble" feel)
  const showStatusBubble = isLocked || isInProgress || isCompleted;

  const bubble = useMemo(() => {
    if (isLocked) {
      return {
        text: 'LOCKED',
        bg: 'rgba(148,163,184,0.30)',
        border: 'rgba(148,163,184,0.45)',
        fg: 'rgba(15,23,42,0.70)',
      };
    }
    if (isCompleted) {
      return {
        text: 'COMPLETED ✓',
        bg: Colors.success,
        border: 'rgba(255,255,255,0.22)',
        fg: '#FFFFFF',
      };
    }
    if (isInProgress) {
      return {
        text: 'IN PROGRESS 🔥',
        bg: color,
        border: 'rgba(255,255,255,0.22)',
        fg: '#FFFFFF',
      };
    }
    return null;
  }, [isLocked, isCompleted, isInProgress, color]);

  // ✅ IMPORTANT: Resolve icon safely so we never render <Heart> as a web tag
  const ResolvedIcon: IconComponent | null = useMemo(() => {
    if (!icon) return null;

    // If icon is a string like "Heart", map it
    if (typeof icon === 'string') {
      return ICON_MAP[icon] ?? BookOpen;
    }

    // If icon is already a component (e.g. Heart), use it directly
    // (We will render it via a PascalCase variable <Icon />)
    if (typeof icon === 'function') {
      return icon as IconComponent;
    }

    // If icon is a React element (<Heart />), we handle it separately during render.
    // Return null here so we don't incorrectly treat it as a component.
    if (React.isValidElement(icon)) {
      return null;
    }

    // Fallback
    return BookOpen;
  }, [icon]);

  const iconColor = isLocked ? Colors.textTertiary : '#FFFFFF';
  const iconBg = isLocked ? Colors.surfaceAlt : color;

  const borderColor = isLocked ? Colors.surfaceAlt : color;

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor,
          opacity: isLocked ? 0.55 : 1,
        },
        !isLocked && { borderWidth: 1.6 },
        pressed && !isLocked && { transform: [{ scale: 0.99 }] },
      ]}
      testID={`chapter-node-${index}`}
    >
      {showStatusBubble && bubble ? (
        <View
          style={[
            styles.statusBubble,
            {
              backgroundColor: bubble.bg,
              borderColor: bubble.border,
            },
          ]}
        >
          <Text style={[styles.statusBubbleText, { color: bubble.fg }]}>
            {bubble.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={[styles.iconSquare, { backgroundColor: iconBg }]}>
          {/* If icon was passed as a JSX element, clone it to enforce size/color */}
          {React.isValidElement(icon)
            ? React.cloneElement(icon as any, { size: 24, color: iconColor })
            : ResolvedIcon
              ? (
                // ✅ PascalCase component variable prevents web tag warnings
                <ResolvedIcon size={24} color={iconColor} />
              )
              : null}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.moduleLabel, { color: isLocked ? Colors.textTertiary : color }]}>
              MODULE {index + 1}
            </Text>
          </View>

          <Text style={[styles.title, isLocked && styles.titleLocked]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, isLocked && styles.subtitleLocked]} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: isLocked ? Colors.border : color,
                  },
                ]}
              />
            </View>

            <Text style={[styles.percentText, { color: isLocked ? Colors.textTertiary : color }]}>
              {pct}%
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,

    // IMPORTANT: allow the status bubble to float outside
    overflow: 'visible',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  statusBubble: {
    position: 'absolute',
    top: -12,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBubbleText: {
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 0.6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconSquare: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  content: {
    flex: 1,
    paddingTop: 2,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  moduleLabel: {
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },

  title: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  titleLocked: {
    color: Colors.textTertiary,
  },

  subtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subtitleLocked: {
    color: Colors.textTertiary,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
  },

  percentText: {
    width: 42,
    textAlign: 'right' as const,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '900' as const,
  },
});
