import React from "react";
import AvatarHead from "@/components/AvatarHead";

type Props = {
  user: any;      // leaderboard row, friend row, etc.
  size?: number;
};

export default function AvatarHeadFromUser({ user, size = 34 }: Props) {
  const avatarId =
    user?.avatar_id ??
    user?.avatarId ??
    user?.profiles?.avatar_id ??
    user?.profiles?.avatarId ??
    "cat";

  const avatarColor =
    user?.avatar_color ??
    user?.avatarColor ??
    user?.profiles?.avatar_color ??
    user?.profiles?.avatarColor ??
    "#FFFFFF";

  return <AvatarHead avatarId={avatarId} avatarColor={avatarColor} size={size} />;
}