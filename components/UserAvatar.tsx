import React from 'react';
import { Image, View, Text, StyleProp, ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/constants/avatars';
import AvatarHead from '@/components/AvatarHead';
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
  variant?: 'head' | 'full';
  size?: number;
  shape?: 'circle' | 'rounded' | 'square';
  style?: StyleProp<ViewStyle>;

  // Optional override (useful for showing other users without extra queries)
  avatarId?: string | null;
  avatarColor?: string | null;
  avatarAccessory?: AvatarAccessoryId | string | null;
  avatarFrame?: AvatarFrameId | string | null;

  // Optional: render another user's avatar by id (friends list, leaderboard, etc.)
  userId?: string;

  // Optional zoom control
  zoom?: number;
};

function safeColor(input?: string | null) {
  const c = (input ?? '').trim();
  return c.length > 0 ? c : '#FFFFFF';
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
  userId,
  zoom,
}: Props) {
  const { session } = useAuth();

  const effectiveUserId = userId ?? session?.user?.id ?? null;

  // Only fetch if we weren't given the data explicitly
  const shouldFetch = !!effectiveUserId && (!avatarId || !avatarColor || !avatarAccessory || !avatarFrame);

  const { data } = useQuery({
    queryKey: ['profile-avatar', effectiveUserId],
    enabled: shouldFetch,
    queryFn: async () => {
      // v2 (has accessory + frame)
      const v2 = await supabase
        .from('profiles')
        .select('avatar_id, avatar_color, avatar_accessory, avatar_frame')
        .eq('id', effectiveUserId)
        .single();

      if (!v2.error) {
        return v2.data as {
          avatar_id: string | null;
          avatar_color: string | null;
          avatar_accessory: string | null;
          avatar_frame: string | null;
        };
      }

      // v1 fallback (older DB)
      const v1 = await supabase.from('profiles').select('avatar_id, avatar_color').eq('id', effectiveUserId).single();
      if (v1.error) throw v1.error;

      return {
        avatar_id: (v1.data as any)?.avatar_id ?? null,
        avatar_color: (v1.data as any)?.avatar_color ?? null,
        avatar_accessory: DEFAULT_AVATAR_ACCESSORY,
        avatar_frame: DEFAULT_AVATAR_FRAME,
      };
    },
    staleTime: 60_000,
  });

  const finalAvatarId = (avatarId ?? data?.avatar_id ?? DEFAULT_AVATAR_ID) || DEFAULT_AVATAR_ID;
  const finalColor = safeColor(avatarColor ?? data?.avatar_color);
  const finalAccessoryId = normalizeAccessoryId(avatarAccessory ?? (data as any)?.avatar_accessory ?? DEFAULT_AVATAR_ACCESSORY);
  const finalFrameId = normalizeFrameId(avatarFrame ?? (data as any)?.avatar_frame ?? DEFAULT_AVATAR_FRAME);

  const avatar = AVATARS.find((a) => a.id === finalAvatarId) ?? AVATARS[0];

  const borderRadius =
    shape === 'circle' ? size / 2 : shape === 'rounded' ? Math.round(size * 0.22) : 0;

  if (variant === 'head') {
    // Headshot (circle)
    return (
      <AvatarHead
        avatarId={finalAvatarId}
        avatarColor={finalColor}
        size={size}
        zoom={zoom}
        accessoryId={finalAccessoryId}
        frameId={finalFrameId}
        style={style}
      />
    );
  }

  // Full avatar
  const frame = getFrameDef(finalFrameId);
  const frameW = Math.max(0, Number(frame.borderWidth ?? 0));
  const innerSize = Math.max(1, Math.round(size - frameW * 2));
  const innerRadius =
    shape === 'circle' ? innerSize / 2 : shape === 'rounded' ? Math.round(innerSize * 0.22) : 0;

  const accessory = getAccessoryDef(finalAccessoryId);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
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
          borderRadius: innerRadius,
          overflow: 'hidden',
          backgroundColor: finalColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={avatar.full}
          style={{
            width: innerSize,
            height: innerSize,
            transform: [{ scale: zoom ?? 1.12 }],
          }}
          resizeMode="cover"
        />

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
