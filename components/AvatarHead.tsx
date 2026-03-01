import React from 'react';
import { Image, Text, View, StyleProp, ViewStyle } from 'react-native';

import { AVATARS } from '@/constants/avatars';
import {
  AvatarAccessoryId,
  DEFAULT_AVATAR_ACCESSORY,
  getAccessoryDef,
  normalizeAccessoryId,
} from '@/constants/avatarAccessories';
import {
  AvatarFrameId,
  DEFAULT_AVATAR_FRAME,
  getFrameDef,
  normalizeFrameId,
} from '@/constants/avatarFrames';
import { getEyesDef, getMouthDef } from '@/constants/avatarFaceParts';

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

  // New face parts
  avatarEyes?: string | null;
  avatarMouth?: string | null;

  // Existing cosmetics
  avatarAccessory?: AvatarAccessoryId | string | null;
  avatarFrame?: AvatarFrameId | string | null;
};

function safeHexColor(input?: string | null, fallback = '#FFFFFF') {
  const raw = String(input ?? '').trim();
  if (!raw) return fallback;
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

const ACCESSORY_EMOJI_FALLBACK: Record<string, string> = {
  crown: '👑',
  pill: '💊',
  book: '📚',
};

export default function AvatarHead({
  avatarId,
  avatarColor = '#FFFFFF',
  size = 44,
  style,
  zoom = 1.35,
  avatarEyes,
  avatarMouth,
  avatarAccessory,
  avatarFrame,
}: Props) {
  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];

  const bg = safeHexColor(avatarColor, '#FFFFFF');

  const accessoryId = normalizeAccessoryId(avatarAccessory ?? DEFAULT_AVATAR_ACCESSORY);
  const accessoryDef = getAccessoryDef(accessoryId);
  const accessoryEmoji =
    accessoryDef.emoji || ACCESSORY_EMOJI_FALLBACK[accessoryId] || '';

  const frameId = normalizeFrameId(avatarFrame ?? DEFAULT_AVATAR_FRAME);
  const frameDef = getFrameDef(frameId);

  const eyesDef = getEyesDef(avatarEyes);
  const mouthDef = getMouthDef(avatarMouth);

  const showAccessory = accessoryId !== 'none' && accessoryEmoji.length > 0;
  const showFrame = frameId !== 'none' && frameDef.borderWidth > 0;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {/* Base head */}
      <Image
        source={avatar.head}
        style={{
          width: size,
          height: size,
          transform: [{ scale: zoom }],
        }}
        resizeMode="cover"
      />

      {/* Eyes */}
      {eyesDef?.image ? (
        <Image
          source={eyesDef.image}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            transform: [{ scale: zoom }],
          }}
          resizeMode="cover"
        />
      ) : null}

      {/* Mouth */}
      {mouthDef?.image ? (
        <Image
          source={mouthDef.image}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            transform: [{ scale: zoom }],
          }}
          resizeMode="cover"
        />
      ) : null}

      {/* Accessory badge (simple emoji for now) */}
      {showAccessory ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: Math.max(2, Math.round(size * 0.04)),
            bottom: Math.max(2, Math.round(size * 0.04)),
            width: Math.round(size * 0.34),
            height: Math.round(size * 0.34),
            borderRadius: Math.round(size * 0.17),
            backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: Math.round(size * 0.18) }}>{accessoryEmoji}</Text>
        </View>
      ) : null}

      {/* Frame ring */}
      {showFrame ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: size / 2,
            borderWidth: frameDef.borderWidth,
            borderColor: frameDef.borderColor,
          }}
        />
      ) : null}
    </View>
  );
}
