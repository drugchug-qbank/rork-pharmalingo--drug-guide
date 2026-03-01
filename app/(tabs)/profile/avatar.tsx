import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '@/constants/colors';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/constants/avatars';
import AvatarHead from '@/components/AvatarHead';
import UserAvatar from '@/components/UserAvatar';

// Simple preset palette (we can expand later)
const AVATAR_COLOR_OPTIONS: string[] = [
  '#FFFFFF', // default
  '#F8FAFC',
  '#E2E8F0',
  '#FDE68A',
  '#FED7AA',
  '#BBF7D0',
  '#A7F3D0',
  '#BAE6FD',
  '#C7D2FE',
  '#FBCFE8',
];

function safeColor(input?: string | null) {
  const c = (input ?? '').trim();
  return c.length > 0 ? c : '#FFFFFF';
}

export default function AvatarPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const userId = session?.user?.id;

  // --- Load current profile avatar ---
  const profileQuery = useQuery({
    queryKey: ['profile-avatar', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_id, avatar_color')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as { avatar_id: string | null; avatar_color: string | null };
    },
    staleTime: 60_000,
  });

  // --- Local selection state ---
  const initialAvatarId = useMemo(() => {
    const raw = profileQuery.data?.avatar_id;
    const safeId = raw && AVATARS.some((a) => a.id === raw) ? raw : null;
    return safeId ?? DEFAULT_AVATAR_ID;
  }, [profileQuery.data?.avatar_id]);

  const initialColor = useMemo(() => safeColor(profileQuery.data?.avatar_color), [profileQuery.data?.avatar_color]);

  const [selectedId, setSelectedId] = useState<string>(DEFAULT_AVATAR_ID);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [didInit, setDidInit] = useState(false);

  useEffect(() => {
    // Initialize from profile once, when loaded
    if (didInit) return;
    if (profileQuery.isLoading) return;

    setSelectedId(initialAvatarId);
    setSelectedColor(initialColor);
    setDidInit(true);
  }, [didInit, profileQuery.isLoading, initialAvatarId, initialColor]);

  // --- Save mutation ---
  const saveMutation = useMutation({
    mutationFn: async (vars: { avatarId: string; avatarColor: string }) => {
      if (!userId) throw new Error('Not signed in');

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_id: vars.avatarId,
          // IMPORTANT: avatar_color is NOT NULL in DB, so we ALWAYS send a real color.
          avatar_color: safeColor(vars.avatarColor),
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: async () => {
      // Refresh caches so all tabs update
      await queryClient.invalidateQueries({ queryKey: ['profile-avatar', userId] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      await queryClient.invalidateQueries({ queryKey: ['friends'] });
      await queryClient.invalidateQueries({ queryKey: ['progress'] });

      router.back();
    },
    onError: (e: any) => {
      Alert.alert('Could not save avatar', e?.message ?? String(e));
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ avatarId: selectedId, avatarColor: selectedColor });
  };

  const headerPad = insets.top + 10;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[styles.header, { paddingTop: headerPad }]}>
        <Text style={styles.title}>Choose your avatar</Text>
        <Text style={styles.subtitle}>Pick a character + background color</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewRow}>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Head</Text>
            <AvatarHead avatarId={selectedId} avatarColor={selectedColor} size={96} />
          </View>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Full</Text>
            <UserAvatar
              avatarId={selectedId}
              avatarColor={selectedColor}
              variant="full"
              size={96}
              shape="rounded"
              // a touch of zoom helps fill the frame
              zoom={1.12}
            />
          </View>
        </View>

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background color</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLOR_OPTIONS.map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.toLowerCase();
              return (
                <Pressable
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    isSelected && { borderColor: Colors.primary, borderWidth: 3 },
                    // make white swatches visible
                    c.toLowerCase() === '#ffffff' && { borderColor: isSelected ? Colors.primary : 'rgba(0,0,0,0.18)' },
                  ]}
                  accessibilityLabel={`Select avatar background color ${c}`}
                />
              );
            })}
          </View>
          <Text style={styles.sectionHint}>Default is white. You can change this any time.</Text>
        </View>

        {/* Avatar grid */}
        <View style={styles.grid}>
          {AVATARS.map((a) => {
            const isSelected = selectedId === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelectedId(a.id)}
                style={[styles.tile, isSelected && styles.tileSelected]}
                accessibilityLabel={`Select avatar ${a.label}`}
              >
                <AvatarHead avatarId={a.id} avatarColor={selectedColor} size={76} />
                <Text style={[styles.tileLabel, isSelected && styles.tileLabelSelected]}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Save */}
        <Pressable
          style={[styles.saveBtn, (saveMutation.isPending || profileQuery.isLoading) && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saveMutation.isPending || profileQuery.isLoading}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Avatar</Text>
          )}
        </Pressable>

        {profileQuery.isLoading ? (
          <View style={{ paddingTop: 10 }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '900' as const, color: '#fff' },
  subtitle: { marginTop: 4, fontSize: 13, fontWeight: '700' as const, color: 'rgba(255,255,255,0.85)' },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  previewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  previewCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
  },
  previewLabel: { fontSize: 12, fontWeight: '900' as const, color: Colors.textSecondary, marginBottom: 10 },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '900' as const, color: Colors.text, marginBottom: 10 },
  sectionHint: { marginTop: 10, fontSize: 12, fontWeight: '600' as const, color: Colors.textTertiary },

  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 14,
  },
  tile: {
    width: '31.5%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
  },
  tileSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  tileLabel: { marginTop: 8, fontSize: 12, fontWeight: '800' as const, color: Colors.textSecondary },
  tileLabelSelected: { color: Colors.primaryDark },

  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' as const },
});
