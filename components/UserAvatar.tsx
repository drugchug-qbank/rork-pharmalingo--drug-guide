import React from 'react';
import { Image, View, StyleProp, ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/constants/avatars';
import AvatarHead from '@/components/AvatarHead';
import { DEFAULT_AVATAR_ACCESSORY, normalizeAccessoryId } from '@/constants/avatarAccessories';
import { DEFAULT_AVATAR_FRAME, normalizeFrameId } from '@/constants/avatarFrames';
import { DEFAULT_AVATAR_EYES_ID, DEFAULT_AVATAR_MOUTH_ID, normalizeEyesId, normalizeMouthId } from '@/constants/avatarFaceParts';

type Props = {
  variant?: 'head' | 'full';
  size?: number;
  shape?: 'circle' | 'rounded' | 'square';
  style?: StyleProp<ViewStyle>;

  // Optional override (useful for showing other users without extra queries)
  avatarId?: string | null;
  avatarColor?: string | null;
  avatarAccessory?: string | null;
  avatarFrame?: string | null;
  avatarEyes?: string | null;
  avatarMouth?: string | null;

  // Optional: render another user's avatar by id (friends list, leaderboard, etc.)
  userId?: string;

  // Optional zoom control
  zoom?: number;
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

export default function UserAvatar({
  variant = 'head',
  size = 44,
  shape = 'circle',
  style,
  avatarId,
  avatarColor,
  avatarAccessory,
  avatarFrame,
  avatarEyes,
  avatarMouth,
  userId,
  zoom,
}: Props) {
  const { session } = useAuth();

  const effectiveUserId = userId ?? session?.user?.id ?? null;

  // Only fetch if we weren't given the avatar fields explicitly
  const shouldFetch =
    !!effectiveUserId &&
    (avatarId === undefined ||
      avatarColor === undefined ||
      avatarAccessory === undefined ||
      avatarFrame === undefined ||
      avatarEyes === undefined ||
      avatarMouth === undefined);

  const { data } = useQuery({
    queryKey: ['profile-avatar', effectiveUserId],
    enabled: shouldFetch,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'avatar_id, avatar_color, avatar_accessory, avatar_frame, avatar_eyes, avatar_mouth'
        )
        .eq('id', effectiveUserId)
        .single();

      if (error) throw error;
      return data as {
        avatar_id: string | null;
        avatar_color: string | null;
        avatar_accessory: string | null;
        avatar_frame: string | null;
        avatar_eyes: string | null;
        avatar_mouth: string | null;
      };
    },
    staleTime: 60_000,
  });

  const finalAvatarId =
    (avatarId !== undefined ? avatarId : data?.avatar_id) ?? DEFAULT_AVATAR_ID;
  const finalColor = safeHexColor(
    (avatarColor !== undefined ? avatarColor : data?.avatar_color) ?? '#FFFFFF'
  );

  const finalAccessory = normalizeAccessoryId(
    (avatarAccessory !== undefined ? avatarAccessory : data?.avatar_accessory) ??
      DEFAULT_AVATAR_ACCESSORY
  );

  const finalFrame = normalizeFrameId(
    (avatarFrame !== undefined ? avatarFrame : data?.avatar_frame) ?? DEFAULT_AVATAR_FRAME
  );

  const finalEyes = normalizeEyesId(
    (avatarEyes !== undefined ? avatarEyes : data?.avatar_eyes) ?? DEFAULT_AVATAR_EYES_ID
  );

  const finalMouth = normalizeMouthId(
    (avatarMouth !== undefined ? avatarMouth : data?.avatar_mouth) ?? DEFAULT_AVATAR_MOUTH_ID
  );

  const avatar = AVATARS.find((a) => a.id === finalAvatarId) ?? AVATARS[0];

  const borderRadius =
    shape === 'circle'
      ? size / 2
      : shape === 'rounded'
        ? Math.round(size * 0.22)
        : 0;

  if (variant === 'head') {
    return (
      <AvatarHead
        avatarId={finalAvatarId}
        avatarColor={finalColor}
        avatarAccessory={finalAccessory}
        avatarFrame={finalFrame}
        avatarEyes={finalEyes}
        avatarMouth={finalMouth}
        size={size}
        zoom={zoom}
        style={style}
      />
    );
  }

  // "Full" avatar (we only have heads now, so just show the head image)
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: finalColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Image
        source={avatar.head}
        style={{
          width: size,
          height: size,
          transform: [{ scale: zoom ?? 1.12 }],
        }}
        resizeMode="cover"
      />
    </View>
  );
}
