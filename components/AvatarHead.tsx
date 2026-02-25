import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { getAvatar } from '@/constants/avatars';

type Props = {
  avatarId?: string | null;
  size?: number;
};

export default function AvatarHead({ avatarId, size = 72 }: Props) {
  const avatar = getAvatar(avatarId);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Image
        source={avatar.head}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
});