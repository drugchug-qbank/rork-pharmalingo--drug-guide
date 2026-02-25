import React from "react";
import { View, ViewStyle } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import AvatarHead from "@/components/AvatarHead";
import AvatarFull from "@/components/AvatarFull";

type Props = {
  variant?: "head" | "full";
  size?: number;
  shape?: "circle" | "rounded"; // only applies to "full"
  style?: ViewStyle;
};

/**
 * Renders the CURRENT signed-in user's avatar.
 * - Uses profile.avatar_id + profile.avatar_color if present
 * - Falls back to cat + light blue if missing
 */
export default function UserAvatar({
  variant = "head",
  size = 44,
  shape = "circle",
  style,
}: Props) {
  const auth = useAuth() as any;

  // Different apps name this differently; this makes it tolerant.
  const profile =
    auth?.profile ??
    auth?.userProfile ??
    auth?.user_data ??
    auth?.user ??
    auth?.currentUser ??
    null;

  const avatarId =
    profile?.avatar_id ??
    profile?.avatarId ??
    "cat";

  const avatarColor =
    profile?.avatar_color ??
    profile?.avatarColor ??
    "#EAF6FF";

  if (variant === "full") {
    return (
      <AvatarFull
        avatarId={avatarId}
        avatarColor={avatarColor}
        size={size}
        shape={shape}
        style={style}
      />
    );
  }

  // AvatarHead doesn't take style, so we wrap it
  return (
    <View style={style}>
      <AvatarHead avatarId={avatarId} avatarColor={avatarColor} size={size} />
    </View>
  );
}