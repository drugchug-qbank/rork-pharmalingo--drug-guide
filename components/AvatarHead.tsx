import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { getAvatar } from "@/constants/avatars";
import Colors from "@/constants/colors";

function safeHexColor(value?: string | null, fallback = "#FFFFFF") {
  if (!value) return fallback;
  const v = value.trim();
  return /^#([0-9a-f]{3}){1,2}$/i.test(v) ? v : fallback;
}

type Props = {
  avatarId?: string | null;
  avatarColor?: string | null;
  size?: number;
};

export default function AvatarHead({ avatarId, avatarColor, size = 44 }: Props) {
  const avatar = getAvatar(avatarId);
  const bg = safeHexColor(avatarColor, "#FFFFFF");

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Image source={avatar.head} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});