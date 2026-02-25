import React from "react";
import { Image, View, StyleProp, ViewStyle } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AvatarHead from "@/components/AvatarHead";
import { AVATARS, DEFAULT_AVATAR_ID } from "@/constants/avatars";

type Props = {
  variant?: "head" | "full";
  size?: number;
  shape?: "circle" | "rounded" | "square";
  style?: StyleProp<ViewStyle>;

  // Optional override (useful for showing other users without extra queries)
  avatarId?: string | null;
  avatarColor?: string | null;

  // Optional: render another user's avatar by id (friends list, leaderboard, etc.)
  userId?: string;

  // Optional zoom control
  zoom?: number;
};

function safeColor(input?: string | null) {
  const c = (input ?? "").trim();
  return c.length > 0 ? c : "#FFFFFF";
}

export default function UserAvatar({
  variant = "head",
  size = 44,
  shape = "circle",
  style,
  avatarId,
  avatarColor,
  userId,
  zoom,
}: Props) {
  const { session } = useAuth();

  const effectiveUserId = userId ?? session?.user?.id ?? null;

  // Only fetch if we weren't given avatarId/avatarColor explicitly
  const shouldFetch = !!effectiveUserId && (!avatarId || !avatarColor);

  const { data } = useQuery({
    queryKey: ["profile-avatar", effectiveUserId],
    enabled: shouldFetch,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_id, avatar_color")
        .eq("id", effectiveUserId)
        .single();

      if (error) throw error;
      return data as { avatar_id: string | null; avatar_color: string | null };
    },
    staleTime: 60_000,
  });

  const finalAvatarId = (avatarId ?? data?.avatar_id ?? DEFAULT_AVATAR_ID) || DEFAULT_AVATAR_ID;
  const finalColor = safeColor(avatarColor ?? data?.avatar_color);

  const avatar = AVATARS.find((a) => a.id === finalAvatarId) ?? AVATARS[0];

  const borderRadius =
    shape === "circle" ? size / 2 : shape === "rounded" ? Math.round(size * 0.22) : 0;

  if (variant === "head") {
    // Use your AvatarHead component (already has zoom fix)
    return (
      <AvatarHead
        avatarId={finalAvatarId}
        avatarColor={finalColor}
        size={size}
        // if you pass zoom, AvatarHead can use it; otherwise it uses its default
        zoom={zoom}
        style={style}
      />
    );
  }

  // Full avatar
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          overflow: "hidden",
          backgroundColor: finalColor,
          alignItems: "center",
          justifyContent: "center",
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
    </View>
  );
}
