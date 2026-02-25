import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { AVATARS } from '@/constants/avatars';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AvatarHead from '@/components/AvatarHead';
import UserAvatar from '@/components/UserAvatar';

type ProfileAvatar = { avatar_id: string | null; avatar_color: string | null };

function safeId(input?: string | null) {
  const v = (input ?? '').trim();
  if (!v) return AVATARS[0]?.id ?? 'cat';
  return v;
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
    queryFn: async (): Promise<ProfileAvatar> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_id, avatar_color')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { avatar_id: data?.avatar_id ?? null, avatar_color: data?.avatar_color ?? null };
    },
    staleTime: 60_000,
  });

  const initialAvatarId = useMemo(() => safeId(profileQuery.data?.avatar_id), [profileQuery.data?.avatar_id]);

  const [selectedId, setSelectedId] = useState<string>(initialAvatarId);

  // Keep selection synced once query loads (first paint)
  React.useEffect(() => {
    if (!profileQuery.data) return;
    setSelectedId(safeId(profileQuery.data.avatar_id));
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (nextId: string) => {
      if (!userId) throw new Error('Not signed in');

      // ✅ Default background is WHITE unless you later add a color picker.
      // NOTE: avatar_color is NOT NULL in the DB, so we must write a real color value.
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_id: nextId, avatar_color: '#FFFFFF' })
        .eq('id', userId);

      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      // Refresh every place that uses the avatar query
      await queryClient.invalidateQueries({ queryKey: ['profile-avatar', userId] });
      Alert.alert('Saved', 'Your avatar was updated!');
      router.back();
    },
    onError: (e: any) => {
      Alert.alert('Could not save avatar', e?.message ?? String(e));
    },
  });

  const handleSave = () => {
    if (saveMutation.isPending) return;
    saveMutation.mutate(selectedId);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Choose your avatar</Text>
        <Text style={styles.subtitle}>Pick a character. (Colors coming next.)</Text>

        <View style={styles.previewRow}>
          <UserAvatar variant="head" size={78} />
          <View style={{ width: 12 }} />
          <UserAvatar variant="full" size={78} shape="rounded" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {profileQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading avatars…</Text>
          </View>
        ) : profileQuery.isError ? (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>Could not load</Text>
            <Text style={styles.errorText}>
              {(profileQuery.error as any)?.message ?? 'Unknown error'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {AVATARS.map((a) => {
              const isSelected = selectedId === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedId(a.id)}
                  style={[styles.tile, isSelected && styles.tileSelected]}
                >
                  <View style={styles.tileAvatarWrap}>
                    <AvatarHead avatarId={a.id} avatarColor="#FFFFFF" size={58} />
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 16 }} />

        <Pressable
          style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saveMutation.isPending || !userId}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Avatar</Text>
          )}
        </Pressable>

        <View style={{ height: 34 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  backText: { color: '#FFFFFF', fontWeight: '800' as const, fontSize: 14 },

  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' as const, marginTop: 6 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '600' as const, marginTop: 4 },

  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },

  content: { padding: 16 },

  center: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  loadingText: { color: Colors.textSecondary, fontWeight: '700' as const },
  errorTitle: { color: Colors.text, fontWeight: '900' as const, fontSize: 16 },
  errorText: { color: Colors.textSecondary, fontWeight: '600' as const, textAlign: 'center' as const },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  tile: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tileSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },

  tileAvatarWrap: { position: 'relative' },
  selectedBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tileLabel: { marginTop: 8, fontSize: 12, fontWeight: '800' as const, color: Colors.text },

  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '900' as const, fontSize: 16 },
});
