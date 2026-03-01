import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Colors from '@/constants/colors';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/constants/avatars';
import AvatarHead from '@/components/AvatarHead';
import UserAvatar from '@/components/UserAvatar';
import {
  AVATAR_ACCESSORIES,
  DEFAULT_AVATAR_ACCESSORY,
  AvatarAccessoryId,
  normalizeAccessoryId,
  getAccessoryDef,
  isAccessoryUnlocked,
} from '@/constants/avatarAccessories';
import {
  AVATAR_FRAMES,
  DEFAULT_AVATAR_FRAME,
  AvatarFrameId,
  normalizeFrameId,
  getFrameDef,
  isFrameUnlocked,
} from '@/constants/avatarFrames';

import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { supabase } from '@/utils/supabase';

const COLOR_SWATCHES = [
  '#FFFFFF',
  '#1D4ED8',
  '#0EA5E9',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#A855F7',
  '#111827',
  '#F472B6',
];

type ProfileAvatarRow = {
  avatar_id: string | null;
  avatar_color: string | null;
  avatar_accessory?: string | null;
  avatar_frame?: string | null;
  unlocked_avatar_accessories?: string[] | null;
  unlocked_avatar_frames?: string[] | null;
};

function safeColor(input?: string | null) {
  const c = (input ?? '').trim();
  return c.length > 0 ? c : '#FFFFFF';
}

function uniqLower(arr: string[]) {
  const set = new Set(arr.map((x) => String(x).trim().toLowerCase()).filter(Boolean));
  return Array.from(set);
}

export default function AvatarPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { progress, spendCoins, addCoins } = useProgress();

  const userId = session?.user?.id ?? null;

  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(DEFAULT_AVATAR_ID);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [selectedAccessory, setSelectedAccessory] = useState<AvatarAccessoryId>(DEFAULT_AVATAR_ACCESSORY);
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrameId>(DEFAULT_AVATAR_FRAME);

  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>(['none', 'heart']);
  const [unlockedFrames, setUnlockedFrames] = useState<string[]>(['none']);

  const [previewMode, setPreviewMode] = useState<'head' | 'full'>('head');

  const coinBalance = Number(progress?.stats?.coins ?? 0);

  const profileQuery = useQuery<ProfileAvatarRow>({
    queryKey: ['avatar-picker-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');

      // Try v2: accessory + frame + unlocks
      const v2 = await supabase
        .from('profiles')
        .select(
          'avatar_id, avatar_color, avatar_accessory, avatar_frame, unlocked_avatar_accessories, unlocked_avatar_frames'
        )
        .eq('id', userId)
        .single();

      if (!v2.error) {
        return v2.data as ProfileAvatarRow;
      }

      // Fallback: older DB (no accessory/frame/unlocks)
      const v1 = await supabase.from('profiles').select('avatar_id, avatar_color').eq('id', userId).single();
      if (v1.error) throw v1.error;

      return {
        avatar_id: (v1.data as any)?.avatar_id ?? null,
        avatar_color: (v1.data as any)?.avatar_color ?? null,
        avatar_accessory: DEFAULT_AVATAR_ACCESSORY,
        avatar_frame: DEFAULT_AVATAR_FRAME,
        unlocked_avatar_accessories: ['none', 'heart'],
        unlocked_avatar_frames: ['none'],
      };
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    setSelectedAvatarId(profileQuery.data.avatar_id ?? DEFAULT_AVATAR_ID);
    setSelectedColor(safeColor(profileQuery.data.avatar_color));
    setSelectedAccessory(normalizeAccessoryId(profileQuery.data.avatar_accessory ?? DEFAULT_AVATAR_ACCESSORY));
    setSelectedFrame(normalizeFrameId(profileQuery.data.avatar_frame ?? DEFAULT_AVATAR_FRAME));

    // Unlocked sets (default includes none + heart)
    const unlockedA = uniqLower([...(profileQuery.data.unlocked_avatar_accessories ?? []), 'none', 'heart']);
    const unlockedF = uniqLower([...(profileQuery.data.unlocked_avatar_frames ?? []), 'none']);

    setUnlockedAccessories(unlockedA);
    setUnlockedFrames(unlockedF);
  }, [profileQuery.data]);

  const accessoryUnlocked = useMemo(
    () => isAccessoryUnlocked(unlockedAccessories, selectedAccessory),
    [unlockedAccessories, selectedAccessory]
  );

  const frameUnlocked = useMemo(
    () => isFrameUnlocked(unlockedFrames, selectedFrame),
    [unlockedFrames, selectedFrame]
  );

  const canSave = accessoryUnlocked && frameUnlocked;

  const unlockAccessory = useCallback(
    async (id: AvatarAccessoryId) => {
      if (!userId) return;

      const def = getAccessoryDef(id);
      if (def.price > 0) {
        const ok = spendCoins(def.price, `Unlock avatar accessory: ${def.label}`);
        if (!ok) {
          Alert.alert('Not enough coins', `You need ${def.price} coins to unlock ${def.label}.`);
          return;
        }
      }

      const next = uniqLower([...unlockedAccessories, id]);

      const { error } = await supabase
        .from('profiles')
        .update({ unlocked_avatar_accessories: next })
        .eq('id', userId);

      if (error) {
        // Refund coins if the DB write failed
        if (def.price > 0) addCoins(def.price, `Refund (unlock failed): ${def.label}`);
        throw error;
      }

      setUnlockedAccessories(next);
      setSelectedAccessory(id);

      queryClient.invalidateQueries({ queryKey: ['profile-avatar', userId] });
      queryClient.invalidateQueries({ queryKey: ['avatar-picker-profile', userId] });
    },
    [userId, unlockedAccessories, spendCoins, addCoins, queryClient]
  );

  const unlockFrame = useCallback(
    async (id: AvatarFrameId) => {
      if (!userId) return;

      const def = getFrameDef(id);
      if (def.price > 0) {
        const ok = spendCoins(def.price, `Unlock avatar frame: ${def.label}`);
        if (!ok) {
          Alert.alert('Not enough coins', `You need ${def.price} coins to unlock ${def.label}.`);
          return;
        }
      }

      const next = uniqLower([...unlockedFrames, id]);

      const { error } = await supabase
        .from('profiles')
        .update({ unlocked_avatar_frames: next })
        .eq('id', userId);

      if (error) {
        if (def.price > 0) addCoins(def.price, `Refund (unlock failed): ${def.label}`);
        throw error;
      }

      setUnlockedFrames(next);
      setSelectedFrame(id);

      queryClient.invalidateQueries({ queryKey: ['profile-avatar', userId] });
      queryClient.invalidateQueries({ queryKey: ['avatar-picker-profile', userId] });
    },
    [userId, unlockedFrames, spendCoins, addCoins, queryClient]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');

      // Guard: don't allow saving locked cosmetics
      if (!isAccessoryUnlocked(unlockedAccessories, selectedAccessory)) {
        const def = getAccessoryDef(selectedAccessory);
        throw new Error(`${def.label} is locked. Unlock it first.`);
      }
      if (!isFrameUnlocked(unlockedFrames, selectedFrame)) {
        const def = getFrameDef(selectedFrame);
        throw new Error(`${def.label} frame is locked. Unlock it first.`);
      }

      // v2 update (avatar_accessory + avatar_frame)
      const updatePayload: any = {
        avatar_id: selectedAvatarId,
        avatar_color: selectedColor,
        avatar_accessory: normalizeAccessoryId(selectedAccessory),
        avatar_frame: normalizeFrameId(selectedFrame),
      };

      const v2 = await supabase.from('profiles').update(updatePayload).eq('id', userId);

      if (!v2.error) return;

      // v1 fallback (older DB)
      const v1 = await supabase
        .from('profiles')
        .update({ avatar_id: selectedAvatarId, avatar_color: selectedColor })
        .eq('id', userId);

      if (v1.error) throw v1.error;
    },
    onSuccess: async () => {
      if (!userId) return;
      await queryClient.invalidateQueries({ queryKey: ['profile-avatar', userId] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.back();
    },
    onError: (e: any) => {
      Alert.alert('Could not save avatar', e?.message ?? String(e));
    },
  });

  const handleSelectAccessory = (id: AvatarAccessoryId) => {
    const unlocked = isAccessoryUnlocked(unlockedAccessories, id);
    if (unlocked) {
      setSelectedAccessory(id);
      return;
    }

    const def = getAccessoryDef(id);
    Alert.alert(
      'Unlock accessory?',
      `Unlock ${def.label} for ${def.price} coins?\n\nYou have ${coinBalance} coins.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Unlock (${def.price})`,
          onPress: async () => {
            try {
              await unlockAccessory(id);
            } catch (err: any) {
              Alert.alert('Unlock failed', err?.message ?? String(err));
            }
          },
        },
      ]
    );
  };

  const handleSelectFrame = (id: AvatarFrameId) => {
    const unlocked = isFrameUnlocked(unlockedFrames, id);
    if (unlocked) {
      setSelectedFrame(id);
      return;
    }

    const def = getFrameDef(id);
    Alert.alert(
      'Unlock frame?',
      `Unlock ${def.label} frame for ${def.price} coins?\n\nYou have ${coinBalance} coins.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Unlock (${def.price})`,
          onPress: async () => {
            try {
              await unlockFrame(id);
            } catch (err: any) {
              Alert.alert('Unlock failed', err?.message ?? String(err));
            }
          },
        },
      ]
    );
  };

  const renderAccessoryOption = (a: { id: AvatarAccessoryId; label: string; emoji: string; price: number }) => {
    const selected = selectedAccessory === a.id;
    const unlocked = isAccessoryUnlocked(unlockedAccessories, a.id);

    return (
      <Pressable
        key={a.id}
        style={[styles.optionPill, selected && styles.optionPillSelected, !unlocked && styles.optionPillLocked]}
        onPress={() => handleSelectAccessory(a.id)}
      >
        <Text style={styles.optionEmoji}>{a.emoji}</Text>
        <Text style={styles.optionLabel}>{a.label}</Text>
        {!unlocked ? <Text style={styles.lockText}>🔒 {a.price}</Text> : null}
      </Pressable>
    );
  };

  const renderFrameOption = (f: { id: AvatarFrameId; label: string; borderColor: string; borderWidth: number; price: number }) => {
    const selected = selectedFrame === f.id;
    const unlocked = isFrameUnlocked(unlockedFrames, f.id);

    return (
      <Pressable
        key={f.id}
        style={[styles.optionPill, selected && styles.optionPillSelected, !unlocked && styles.optionPillLocked]}
        onPress={() => handleSelectFrame(f.id)}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: Math.max(2, f.borderWidth),
            borderColor: f.borderColor,
            backgroundColor: '#FFFFFF',
          }}
        />
        <Text style={styles.optionLabel}>{f.label}</Text>
        {!unlocked ? <Text style={styles.lockText}>🔒 {f.price}</Text> : null}
      </Pressable>
    );
  };

  const content = (() => {
    if (!userId) {
      return (
        <View style={styles.center}> 
          <Text style={styles.title}>Not signed in</Text>
        </View>
      );
    }

    if (profileQuery.isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your avatar…</Text>
        </View>
      );
    }

    if (profileQuery.isError) {
      return (
        <View style={styles.center}>
          <Text style={styles.title}>Could not load avatar</Text>
          <Text style={styles.subtitle}>{String((profileQuery.error as any)?.message ?? profileQuery.error ?? '')}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Choose your avatar</Text>
        <Text style={styles.subtitle}>Pick a character, background color, and accessory (optional)</Text>

        <View style={styles.coinsRow}>
          <Text style={styles.coinsText}>🪙 {coinBalance.toLocaleString()} coins</Text>
          <Text style={styles.coinsHint}>Unlock frames & accessories</Text>
        </View>

        {/* Preview mode toggle */}
        <View style={styles.previewToggleRow}>
          <Pressable
            style={[styles.previewToggle, previewMode === 'head' && styles.previewToggleActive]}
            onPress={() => setPreviewMode('head')}
          >
            <Text style={[styles.previewToggleText, previewMode === 'head' && styles.previewToggleTextActive]}>
              Head
            </Text>
            <View style={{ marginTop: 8 }}>
              <AvatarHead
                avatarId={selectedAvatarId}
                avatarColor={selectedColor}
                accessoryId={selectedAccessory}
                frameId={selectedFrame}
                size={58}
                zoom={1.55}
              />
            </View>
          </Pressable>

          <Pressable
            style={[styles.previewToggle, previewMode === 'full' && styles.previewToggleActive]}
            onPress={() => setPreviewMode('full')}
          >
            <Text style={[styles.previewToggleText, previewMode === 'full' && styles.previewToggleTextActive]}>
              Full
            </Text>
            <View style={{ marginTop: 8 }}>
              <UserAvatar
                variant="full"
                size={58}
                shape="rounded"
                avatarId={selectedAvatarId}
                avatarColor={selectedColor}
                avatarAccessory={selectedAccessory}
                avatarFrame={selectedFrame}
                zoom={1.15}
              />
            </View>
          </Pressable>
        </View>

        {/* Background color */}
        <Text style={styles.sectionTitle}>Background color</Text>
        <View style={styles.swatchRow}>
          {COLOR_SWATCHES.map((c) => {
            const selected = selectedColor === c;
            return (
              <Pressable
                key={c}
                style={[styles.swatch, { backgroundColor: c }, selected && styles.swatchSelected]}
                onPress={() => setSelectedColor(c)}
              />
            );
          })}
        </View>

        {/* Frames */}
        <Text style={styles.sectionTitle}>Frame</Text>
        <View style={styles.optionsRow}>{AVATAR_FRAMES.map((f) => renderFrameOption(f))}</View>

        {/* Accessories */}
        <Text style={styles.sectionTitle}>Accessory</Text>
        <View style={styles.optionsRow}>{AVATAR_ACCESSORIES.map((a) => renderAccessoryOption(a))}</View>

        {/* Character grid */}
        <Text style={styles.sectionTitle}>Character</Text>
        <View style={styles.grid}>
          {AVATARS.map((a) => {
            const selected = selectedAvatarId === a.id;
            return (
              <Pressable
                key={a.id}
                style={[styles.gridItem, selected && styles.gridItemSelected]}
                onPress={() => setSelectedAvatarId(a.id)}
              >
                {previewMode === 'head' ? (
                  <AvatarHead
                    avatarId={a.id}
                    avatarColor={selectedColor}
                    accessoryId={selectedAccessory}
                    frameId={selectedFrame}
                    size={54}
                    zoom={1.55}
                  />
                ) : (
                  <UserAvatar
                    variant="full"
                    size={54}
                    shape="rounded"
                    avatarId={a.id}
                    avatarColor={selectedColor}
                    avatarAccessory={selectedAccessory}
                    avatarFrame={selectedFrame}
                    zoom={1.12}
                  />
                )}
                <Text style={styles.gridLabel}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Locked warning */}
        {!canSave ? (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedBannerTitle}>🔒 Locked item selected</Text>
            <Text style={styles.lockedBannerText}>Unlock the selected frame/accessory before saving.</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.saveBtn, (saveMutation.isPending || !canSave) && { opacity: 0.6 }]}
          disabled={saveMutation.isPending || !canSave}
          onPress={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Avatar</Text>
          )}
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>
    );
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}> 
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topRow: { paddingHorizontal: 16, marginBottom: 6 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 6 },
  backText: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  loadingText: { marginTop: 10, color: Colors.textSecondary, fontWeight: '600' },

  scroll: { paddingHorizontal: 16, paddingBottom: 22 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },

  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  coinsText: { fontWeight: '900', color: Colors.text },
  coinsHint: { fontWeight: '700', color: Colors.textTertiary, fontSize: 12 },

  previewToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  previewToggle: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  previewToggleActive: { borderColor: Colors.primary },
  previewToggleText: { fontWeight: '900', color: Colors.textSecondary },
  previewToggleTextActive: { color: Colors.primary },

  sectionTitle: { fontSize: 13, fontWeight: '900', color: Colors.text, marginTop: 10, marginBottom: 8 },

  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  swatchSelected: {
    borderColor: Colors.primary,
    transform: [{ scale: 1.08 }],
  },

  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionPillSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionPillLocked: { opacity: 0.85 },
  optionEmoji: { fontSize: 14 },
  optionLabel: { fontSize: 12, fontWeight: '900', color: Colors.text },
  lockText: { fontSize: 11, fontWeight: '900', color: Colors.textTertiary },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  gridItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  gridLabel: { marginTop: 8, fontSize: 11, fontWeight: '900', color: Colors.textSecondary },

  lockedBanner: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
  },
  lockedBannerTitle: { fontWeight: '900', color: '#991B1B', marginBottom: 4 },
  lockedBannerText: { fontWeight: '600', color: '#7F1D1D', fontSize: 12 },

  saveBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
