import React, { useMemo } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/constants/avatars';
import AvatarHead from '@/components/AvatarHead';
import {
  AVATAR_ACCESSORIES,
  DEFAULT_AVATAR_ACCESSORY,
  type AvatarAccessoryId,
} from '@/constants/avatarAccessories';

type Props = {
  variant?: 'head' | 'full';
  size?: number;
  shape?: 'circle' | 'rounded' | 'square';
  style?: StyleProp<ViewStyle>;

  // Optional override (useful for showing other users without extra queries)
  avatarId?: string | null;
  avatarColor?: string | null;
  avatarAccessory?: AvatarAccessoryId | string | null;

  // Optional: render another user's avatar by id (friends list, leaderboard, etc.)
  userId?: string;

  // Optional zoom control
  zoom?: number;
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

function getAccessoryEmoji(id?: string | null) {
  const normalized = normalizeAccessoryId(id);
  return AVATAR_ACCESSORIES.find((a) => a.id === normalized)?.emoji ?? null;
}

export default function UserAvatar({
  variant = 'head',
  size = 44,
  shape = 'circle',
  style,
  avatarId,
  avatarColor,
  avatarAccessory,
  userId,
  zoom,
}: Props) {
  const { session } = useAuth();

  const effectiveUserId = userId ?? session?.user?.id ?? null;

  // Only fetch if we weren't given avatarId/avatarColor/avatarAccessory explicitly
  const shouldFetch =
    !!effectiveUserId && (!avatarId || !avatarColor || typeof avatarAccessory === 'undefined');

  const { data } = useQuery({
    queryKey: ['profile-avatar', effectiveUserId],
    enabled: shouldFetch,
    queryFn: async () => {
      if (!effectiveUserId) {
        return {
          avatar_id: null,
          avatar_color: null,
          avatar_accessory: DEFAULT_AVATAR_ACCESSORY,
        } as any;
      }

      // Try v2 (with avatar_accessory). If that column doesn't exist yet, fall back.
      const v2 = await supabase
        .from('profiles')
        .select('avatar_id, avatar_color, avatar_accessory')
        .eq('id', effectiveUserId)
        .single();

      if (!v2.error) return v2.data as any;

      const msg = String((v2.error as any)?.message ?? '').toLowerCase();
      if (msg.includes('avatar_accessory') || msg.includes('column') || msg.includes('does not exist')) {
        const v1 = await supabase
          .from('profiles')
          .select('avatar_id, avatar_color')
          .eq('id', effectiveUserId)
          .single();

        if (v1.error) throw v1.error;

        return {
          ...(v1.data as any),
          avatar_accessory: DEFAULT_AVATAR_ACCESSORY,
        } as any;
      }

      throw v2.error;
    },
    staleTime: 60_000,
  });

  const finalAvatarId = (avatarId ?? (data as any)?.avatar_id ?? DEFAULT_AVATAR_ID) || DEFAULT_AVATAR_ID;
  const finalColor = safeColor(avatarColor ?? (data as any)?.avatar_color);
  const finalAccessoryId = normalizeAccessoryId(
    String(avatarAccessory ?? (data as any)?.avatar_accessory ?? DEFAULT_AVATAR_ACCESSORY)
  );

  const accessoryEmoji = useMemo(() => getAccessoryEmoji(finalAccessoryId), [finalAccessoryId]);

  const avatar = AVATARS.find((a) => a.id === finalAvatarId) ?? AVATARS[0];

  const borderRadius =
    shape === 'circle' ? size / 2 : shape === 'rounded' ? Math.round(size * 0.22) : 0;

  if (variant === 'head') {
    return (
      <AvatarHead
        avatarId={finalAvatarId}
        avatarColor={finalColor}
        size={size}
        zoom={zoom}
        accessoryId={finalAccessoryId}
        style={style}
      />
    );
  }

  const badgeSize = Math.max(18, Math.round(size * 0.34));
  const emojiSize = Math.max(11, Math.round(badgeSize * 0.62));

  // Full avatar
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
        source={avatar.full}
        style={{
          width: size,
          height: size,
          transform: [{ scale: zoom ?? 1.12 }],
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
