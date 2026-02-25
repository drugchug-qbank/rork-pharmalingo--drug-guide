import React from 'react';
import { Image, View, Text, StyleProp, ViewStyle } from 'react-native';
import { AVATARS } from '@/constants/avatars';
import {
  DEFAULT_AVATAR_ACCESSORY,
  AvatarAccessoryId,
  getAccessoryDef,
  normalizeAccessoryId,
} from '@/constants/avatarAccessories';
import {
  DEFAULT_AVATAR_FRAME,
  AvatarFrameId,
  getFrameDef,
  normalizeFrameId,
} from '@/constants/avatarFrames';

type Props = {
  avatarId: string;
  avatarColor?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Controls how "zoomed" the headshot is inside the circle.
   * 1.0 = normal, 1.2–1.6 = zoomed in
   */
  zoom?: number;
  /** Optional accessory overlay (emoji badge). */
  accessoryId?: AvatarAccessoryId | string | null;
  /** Optional frame ring around the circle. */
  frameId?: AvatarFrameId | string | null;
};

export default function AvatarHead({
  avatarId,
  avatarColor = '#FFFFFF',
  size = 44,
  style,
  zoom = 1.35,
  accessoryId = DEFAULT_AVATAR_ACCESSORY,
  frameId = DEFAULT_AVATAR_FRAME,
}: Props) {
  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];

  const finalAccessoryId = normalizeAccessoryId(accessoryId);
  const accessory = getAccessoryDef(finalAccessoryId);

  const finalFrameId = normalizeFrameId(frameId);
  const frame = getFrameDef(finalFrameId);
  const frameW = Math.max(0, Number(frame.borderWidth ?? 0));

  const innerSize = Math.max(1, Math.round(size - frameW * 2));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: frameW,
          borderColor: frame.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
          backgroundColor: avatarColor ?? '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={avatar.head}
          style={{
            width: innerSize,
            height: innerSize,
            transform: [{ scale: zoom }],
          }}
          resizeMode="cover"
        />

        {/* Accessory badge (simple emoji) */}
        {finalAccessoryId !== 'none' ? (
          <View
            style={{
              position: 'absolute',
              right: 3,
              bottom: 3,
              minWidth: Math.max(18, Math.round(innerSize * 0.34)),
              height: Math.max(18, Math.round(innerSize * 0.34)),
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
            }}
          >
            <Text style={{ fontSize: Math.max(12, Math.round(innerSize * 0.18)) }}>{accessory.emoji}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
