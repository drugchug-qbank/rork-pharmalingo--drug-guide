import React, { useMemo } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AVATARS } from '@/constants/avatars';
import {
  AVATAR_ACCESSORIES,
  DEFAULT_AVATAR_ACCESSORY,
  type AvatarAccessoryId,
} from '@/constants/avatarAccessories';

type Props = {
  avatarId: string;
  avatarColor?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Controls how "zoomed" the headshot is inside the circle.
   * 1.0 = normal, 1.2–1.5 = zoomed in
   */
  zoom?: number;

  /** Optional cosmetic overlay (emoji accessory). */
  accessoryId?: AvatarAccessoryId | string | null;
};

function safeColor(input?: string | null) {
  const c = (input ?? '').trim();
  return c.length > 0 ? c : '#FFFFFF';
}

function normalizeAccessoryId(input?: string | null): AvatarAccessoryId {
  const raw = (input ?? '').trim();
  if (!raw) return DEFAULT_AVATAR_ACCESSORY;

  const found = AVATAR_ACCESSORIES.find((a) => a.id === raw);
  return (found?.id ?? DEFAULT_AVATAR_ACCESSORY) as AvatarAccessoryId;
}

export default function AvatarHead({
  avatarId,
  avatarColor,
  size = 44,
  style,
  zoom = 1.35,
  accessoryId,
}: Props) {
  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];

  const accessoryEmoji = useMemo(() => {
    const id = normalizeAccessoryId(String(accessoryId ?? ''));
    return AVATAR_ACCESSORIES.find((a) => a.id === id)?.emoji ?? null;
  }, [accessoryId]);

  const badgeSize = Math.max(16, Math.round(size * 0.38));
  const emojiSize = Math.max(10, Math.round(badgeSize * 0.62));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: safeColor(avatarColor),
        },
        style,
      ]}
    >
      <Image
        source={avatar.head}
        style={{
          width: size,
          height: size,
          transform: [{ scale: zoom }],
        }}
        resizeMode="cover"
      />

      {accessoryEmoji ? (
        <View
          pointerEvents="none"
          style={[
            styles.accessoryBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: Math.max(2, Math.round(size * 0.04)),
              bottom: Math.max(2, Math.round(size * 0.04)),
            },
          ]}
        >
          <Text style={{ fontSize: emojiSize, lineHeight: emojiSize + 2 }}>{accessoryEmoji}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessoryBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
