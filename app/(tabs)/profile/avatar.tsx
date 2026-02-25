import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/constants/avatars';
import AvatarHead from '@/components/AvatarHead';
import UserAvatar from '@/components/UserAvatar';
import {
  AVATAR_ACCESSORIES,
  DEFAULT_AVATAR_ACCESSORY,
  type AvatarAccessoryId,
} from '@/constants/avatarAccessories';

const PRESET_COLORS: string[] = [
  '#FFFFFF',
  '#1D4ED8', // Royal blue
  '#0EA5E9', // Sky
  '#22C55E', // Green
  '#F59E0B', // Gold
  '#EF4444', // Red
  '#A855F7', // Purple
  '#111827', // Near-black
  '#F472B6', // Pink
];

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

export default function AvatarPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const userId = session?.user?.id ?? null;

  const profileQuery = useQuery({
    queryKey: ['profile-avatar', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      // Try v2 (with avatar_accessory). If missing, fall back.
      const v2 = await supabase
        .from('profiles')
        .select('avatar_id, avatar_color, avatar_accessory')
        .eq('id', userId)
        .single();

      if (!v2.error) return v2.data as any;

      const msg = String((v2.error as any)?.message ?? '').toLowerCase();
      if (msg.includes('avatar_accessory') || msg.includes('column') || msg.includes('does not exist')) {
        const v1 = await supabase
          .from('profiles')
          .select('avatar_id, avatar_color')
          .eq('id', userId)
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

  const initialAvatarId = useMemo(() => {
    const raw = String((profileQuery.data as any)?.avatar_id ?? '').trim();
    const exists = AVATARS.some((a) => a.id === raw);
    return exists ? raw : DEFAULT_AVATAR_ID;
  }, [profileQuery.data]);

  const initialColor = useMemo(() => {
    return safeColor((profileQuery.data as any)?.avatar_color);
  }, [profileQuery.data]);

  const initialAccessory = useMemo(() => {
    return normalizeAccessoryId((profileQuery.data as any)?.avatar_accessory);
  }, [profileQuery.data]);

  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(DEFAULT_AVATAR_ID);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [selectedAccessory, setSelectedAccessory] = useState<AvatarAccessoryId>(DEFAULT_AVATAR_ACCESSORY);

  // Initialize state once profileQuery loads
  useEffect(() => {
    if (profileQuery.isLoading) return;
    setSelectedAvatarId(initialAvatarId);
    setSelectedColor(initialColor);
    setSelectedAccessory(initialAccessory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.isLoading]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');

      const payloadV2: any = {
        avatar_id: selectedAvatarId,
        avatar_color: safeColor(selectedColor),
        avatar_accessory: normalizeAccessoryId(selectedAccessory),
      };

      const v2 = await supabase.from('profiles').update(payloadV2).eq('id', userId);
      if (!v2.error) return;

      // If avatar_accessory column isn't deployed yet, fall back to updating only id/color.
      const msg = String((v2.error as any)?.message ?? '').toLowerCase();
      if (msg.includes('avatar_accessory') || msg.includes('column') || msg.includes('does not exist')) {
        const v1 = await supabase
          .from('profiles')
          .update({ avatar_id: selectedAvatarId, avatar_color: safeColor(selectedColor) })
          .eq('id', userId);

        if (v1.error) throw v1.error;
        return;
      }

      throw v2.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile-avatar'] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      await queryClient.invalidateQueries({ queryKey: ['friends'] });

      router.back();
    },
    onError: (e: any) => {
      Alert.alert('Could not save avatar', e?.message ?? String(e));
    },
  });

  const saving = saveMutation.isPending;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <Text style={styles.title}>Choose your avatar</Text>
        <Text style={styles.subtitle}>Pick a character, background color, and accessory (optional)</Text>

        <View style={styles.previewRow}>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Head</Text>
            <AvatarHead
              avatarId={selectedAvatarId}
              avatarColor={selectedColor}
              accessoryId={selectedAccessory}
              size={72}
              zoom={1.35}
            />
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Full</Text>
            <UserAvatar
              variant="full"
              size={72}
              avatarId={selectedAvatarId}
              avatarColor={selectedColor}
              avatarAccessory={selectedAccessory}
              zoom={1.12}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Background colors */}
        <Text style={styles.sectionTitle}>Background color</Text>
        <View style={styles.swatchRow}>
          {PRESET_COLORS.map((c) => {
            const isSelected = c.toLowerCase() === selectedColor.toLowerCase();
            return (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  c.toLowerCase() === '#ffffff' && styles.swatchWhite,
                  isSelected && styles.swatchSelected,
                ]}
              />
            );
          })}
        </View>

        {/* Accessories */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Accessory</Text>
        <View style={styles.accessoryRow}>
          {AVATAR_ACCESSORIES.map((a) => {
            const isSelected = a.id === selectedAccessory;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelectedAccessory(a.id)}
                style={[styles.accessoryChip, isSelected && styles.accessoryChipSelected]}
              >
                <Text style={styles.accessoryEmoji}>{a.emoji ?? '🚫'}</Text>
                <Text style={[styles.accessoryLabel, isSelected && styles.accessoryLabelSelected]}>
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Avatar grid */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Character</Text>
        <View style={styles.grid}>
          {AVATARS.map((a) => {
            const selected = a.id === selectedAvatarId;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelectedAvatarId(a.id)}
                style={[styles.tile, selected && styles.tileSelected]}
              >
                <AvatarHead
                  avatarId={a.id}
                  avatarColor={selectedColor}
                  accessoryId={selectedAccessory}
                  size={62}
                  zoom={1.35}
                />
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={() => saveMutation.mutate()}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Avatar</Text>}
        </Pressable>

        <View style={{ height: 26 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },

  previewRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  previewCard: {
    flex: 1,
    backgroundColor: 'rgba(240, 249, 255, 0.30)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    gap: 8,
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '900',
  },

  content: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 10,
  },

  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  swatchWhite: {
    borderColor: 'rgba(0,0,0,0.18)',
  },
  swatchSelected: {
    borderColor: Colors.primary,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  accessoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accessoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  accessoryChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  accessoryEmoji: {
    fontSize: 16,
  },
  accessoryLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
  },
  accessoryLabelSelected: {
    color: Colors.primaryDark,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tile: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tileSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  tileLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
  },

  saveButton: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});
