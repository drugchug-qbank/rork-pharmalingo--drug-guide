import React, { useMemo } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AVATARS } from '@/constants/avatars';
import { getAccessoryDef } from '@/constants/avatarAccessories';
import { getEyesDef, getMouthDef } from '@/constants/avatarFaceParts';
import { AvatarFrameId, getFrameDef } from '@/constants/avatarFrames';

// Local helper: simple emoji fallback (until you swap to real PNG overlays)
function getAccessoryEmoji(id: string): string {
  switch (String(id)) {
    case 'crown':
      return '👑';
    case 'star':
      return '⭐️';
    case 'sparkle':
      return '✨';
    case 'pill':
      return '💊';
    case 'book':
      return '📚';
    case 'heart':
      return '❤️';
    default:
      return '';
  }
}

function safeColor(input?: string | null): string {
  const c = (input ?? '').trim();
  return c.length > 0 ? c : '#FFFFFF';
}

type Props = {
  avatarId: string;
  avatarColor?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;

  /**
   * Zooms the headshot inside the circle.
   * 1.0 = normal, 1.2–1.5 = zoomed in
   */
  zoom?: number;

  // Duolingo-style overlays
  avatarAccessory?: string | null;
  avatarFrame?: AvatarFrameId | null;
  avatarEyes?: string | null;
  avatarMouth?: string | null;
};

export default function AvatarHead({
  avatarId,
  avatarColor = '#FFFFFF',
  size = 44,
  style,
  zoom = 1.35,
  avatarAccessory,
  avatarFrame,
  avatarEyes,
  avatarMouth,
}: Props) {
  const avatar = useMemo(() => AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0], [avatarId]);

  const accessoryDef = useMemo(() => getAccessoryDef(avatarAccessory), [avatarAccessory]);
  const frameDef = useMemo(() => getFrameDef(avatarFrame), [avatarFrame]);

  const eyesDef = useMemo(() => getEyesDef(avatarEyes), [avatarEyes]);
  const mouthDef = useMemo(() => getMouthDef(avatarMouth), [avatarMouth]);

  // ---- alignment tuning (fraction-of-size -> pixels) ----
  const eyesScale = (eyesDef?.scale ?? 1) * zoom;
  const eyesTx = (eyesDef?.offsetX ?? 0) * size;
  const eyesTy = (eyesDef?.offsetY ?? 0) * size;

  const mouthScale = (mouthDef?.scale ?? 1) * zoom;
  const mouthTx = (mouthDef?.offsetX ?? 0) * size;
  const mouthTy = (mouthDef?.offsetY ?? 0) * size;

  const accessoryScale = (accessoryDef?.scale ?? 1) * zoom;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: safeColor(avatarColor),
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {/* Base head */}
      <Image
        source={avatar.head}
        style={[
          styles.fill,
          {
            transform: [{ scale: zoom }],
          },
        ]}
        resizeMode="cover"
      />

      {/* Eyes overlay */}
      {eyesDef?.image ? (
        <Image
          pointerEvents="none"
          source={eyesDef.image}
          style={[
            styles.fill,
            {
              transform: [{ scale: eyesScale }, { translateX: eyesTx }, { translateY: eyesTy }],
            },
          ]}
          resizeMode="cover"
        />
      ) : null}

      {/* Mouth overlay */}
      {mouthDef?.image ? (
        <Image
          pointerEvents="none"
          source={mouthDef.image}
          style={[
            styles.fill,
            {
              transform: [{ scale: mouthScale }, { translateX: mouthTx }, { translateY: mouthTy }],
            },
          ]}
          resizeMode="cover"
        />
      ) : null}

      {/* Accessory overlay */}
      {accessoryDef.id !== 'none' ? (
        accessoryDef.image ? (
          <Image
            pointerEvents="none"
            source={accessoryDef.image}
            style={[styles.fill, { transform: [{ scale: accessoryScale }] }]}
            resizeMode="cover"
          />
        ) : (
          // Emoji fallback: centered (okay for now)
          <View pointerEvents="none" style={styles.accessoryEmojiWrap}>
            <Text style={[styles.accessoryEmoji, { fontSize: Math.max(14, Math.round(size * 0.46)) }]}>
              {getAccessoryEmoji(accessoryDef.id)}
            </Text>
          </View>
        )
      ) : null}

      {/* Frame ring */}
      {frameDef?.id !== 'none' ? (
        <View
        pointerEvents="none"
        style={[
          styles.frameRing,
          {
            borderColor: frameDef.borderColor,
            borderWidth: frameDef.borderWidth,
          },
        ]}
      />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: undefined,
    height: undefined,
  },

  accessoryEmojiWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessoryEmoji: {
    textAlign: 'center',
  },

  frameRing: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
});
