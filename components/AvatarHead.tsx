import React from "react";
import { Image, View, StyleProp, ViewStyle } from "react-native";
import { AVATARS } from "@/constants/avatars";

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
};

export default function AvatarHead({
  avatarId,
  avatarColor = "#FFFFFF",
  size = 44,
  style,
  zoom = 1.35,
}: Props) {
  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: avatarColor,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Image
        source={avatar.head}
        // The transform is what "zooms" the image to reduce white padding
        style={{
          width: size,
          height: size,
          transform: [{ scale: zoom }],
        }}
        resizeMode="cover"
      />
    </View>
  );
}
