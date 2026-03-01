import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { AVATARS, DEFAULT_AVATAR_ID } from "@/constants/avatars";

function safeHexColor(value?: string | null, fallback = "#EAF6FF") {
  if (!value) return fallback;
  const v = value.trim();
  return /^#([0-9a-f]{3}){1,2}$/i.test(v) ? v : fallback;
}

type Props = {
  avatarId?: string | null;
  avatarColor?: string | null; // store hex, e.g. "#6EC6FF"
  size?: number;              // container size
  shape?: "circle" | "rounded"; // how it looks in headers
  style?: ViewStyle;
};

export default function AvatarFull({
  avatarId,
  avatarColor,
  size = 56,
  shape = "rounded",
  style,
}: Props) {
  const avatar = AVATARS.find((a) => a.id === (avatarId ?? DEFAULT_AVATAR_ID)) ?? AVATARS[0];
  const bg = safeHexColor(avatarColor, "#EAF6FF");

  const radius = shape === "circle" ? size / 2 : 14;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Image
        source={avatar.full}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});