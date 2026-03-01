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
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// NOTE: the file is lowercase in this project ("constants/colors")
import Colors from '@/constants/colors';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

import AvatarHead from '@/components/AvatarHead';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/constants/avatars';
import {
  AVATAR_ACCESSORIES,
  DEFAULT_AVATAR_ACCESSORY,
  getAccessoryDef,
  getAccessoryPrice,
  isAccessoryUnlocked,
  normalizeAccessoryId,
} from '@/constants/avatarAccessories';
import {
  AVATAR_FRAMES,
  DEFAULT_AVATAR_FRAME,
  getFrameDef,
  getFramePrice,
  isFrameUnlocked,
  normalizeFrameId,
} from '@/constants/avatarFrames';
import {
  AVATAR_EYES,
  AVATAR_MOUTHS,
  DEFAULT_AVATAR_EYES_ID,
  DEFAULT_AVATAR_MOUTH_ID,
  normalizeEyesId,
  normalizeMouthId,
} from '@/constants/avatarFaceParts';

function safeHexColor(input?: string | null, fallback = '#FFFFFF') {
  const raw = String(input ?? '').trim();
  if (!raw) return fallback;
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

const BG_COLORS = [
  '#FFFFFF',
  '#1D4ED8',
  '#0EA5E9',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#A855F7',
  '#111827',
  '#F472B6',
] as const;

type ProfileAvatarRow = {
  avatar_id: string | null;
  avatar_color: string | null;
  avatar_accessory: string | null;
  avatar_frame: string | null;
  avatar_eyes: string | null;
  avatar_mouth: string | null;
  unlocked_accessories: string[] | null;
  unlocked_frames: string[] | null;
  coins: number | null;
};

export default function AvatarEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session, refreshProfile } = useAuth();

  const userId = session?.user?.id ?? null;

  const profileQuery = useQuery({
    queryKey: ['profile-avatar-editor', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'avatar_id, avatar_color, avatar_accessory, avatar_frame, avatar_eyes, avatar_mouth, unlocked_accessories, unlocked_frames, coins'
        )
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as ProfileAvatarRow;
    },
    staleTime: 30_000,
  });

  // Local state (initialized once from profileQuery)
  const [initialized, setInitialized] = useState(false);
  const [previewVariant, setPreviewVariant] = useState<'head' | 'full'>('head');

  const [selectedAvatarId, setSelectedAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [selectedAccessory, setSelectedAccessory] = useState<string>(DEFAULT_AVATAR_ACCESSORY);
  const [selectedFrame, setSelectedFrame] = useState<string>(DEFAULT_AVATAR_FRAME);
  const [selectedEyes, setSelectedEyes] = useState<string>(DEFAULT_AVATAR_EYES_ID);
  const [selectedMouth, setSelectedMouth] = useState<string>(DEFAULT_AVATAR_MOUTH_ID);

  const unlockedAccessories = profileQuery.data?.unlocked_accessories ?? [];
  const unlockedFrames = profileQuery.data?.unlocked_frames ?? [];
  const coinBalance = profileQuery.data?.coins ?? 0;

  useEffect(() => {
    if (!profileQuery.data || initialized) return;

    setSelectedAvatarId(profileQuery.data.avatar_id ?? DEFAULT_AVATAR_ID);
    setSelectedColor(safeHexColor(profileQuery.data.avatar_color));
    setSelectedAccessory(
      normalizeAccessoryId(profileQuery.data.avatar_accessory ?? DEFAULT_AVATAR_ACCESSORY)
    );
    setSelectedFrame(normalizeFrameId(profileQuery.data.avatar_frame ?? DEFAULT_AVATAR_FRAME));
    setSelectedEyes(normalizeEyesId(profileQuery.data.avatar_eyes ?? DEFAULT_AVATAR_EYES_ID));
    setSelectedMouth(normalizeMouthId(profileQuery.data.avatar_mouth ?? DEFAULT_AVATAR_MOUTH_ID));

    setInitialized(true);
  }, [profileQuery.data, initialized]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');

      const payload = {
        avatar_id: selectedAvatarId,
        avatar_color: safeHexColor(selectedColor),
        avatar_accessory: normalizeAccessoryId(selectedAccessory),
        avatar_frame: normalizeFrameId(selectedFrame),
        avatar_eyes: normalizeEyesId(selectedEyes),
        avatar_mouth: normalizeMouthId(selectedMouth),
      };

      const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      // Refresh everything that reads avatar fields
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-avatar', userId] }),
        queryClient.invalidateQueries({ queryKey: ['profile-avatar-editor', userId] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);

      // ✅ This is what fixes the Profile screen header background
      // (Profile screen reads avatar_color from AuthContext.profile)
      await refreshProfile();

      router.back();
    },
    onError: (e: any) => {
      Alert.alert('Could not save avatar', e?.message ?? 'Unknown error');
    },
  });

  const headerBg = useMemo(() => safeHexColor(selectedColor, Colors.primary), [selectedColor]);

  const onPickAccessory = (id: string) => {
    const normalized = normalizeAccessoryId(id);
    if (normalized === 'none') {
      setSelectedAccessory('none');
      return;
    }

    const unlocked = isAccessoryUnlocked(unlockedAccessories, normalized);
    if (!unlocked) {
      const price = getAccessoryPrice(normalized);
      Alert.alert(
        'Locked',
        `Unlock this in the Shop tab. (Cost: ${price} coins)`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Shop', onPress: () => router.push('/shop') },
        ]
      );
      return;
    }

    setSelectedAccessory(normalized);
  };

  const onPickFrame = (id: string) => {
    const normalized = normalizeFrameId(id);
    if (normalized === 'none') {
      setSelectedFrame('none');
      return;
    }

    const unlocked = isFrameUnlocked(unlockedFrames, normalized);
    if (!unlocked) {
      const price = getFramePrice(normalized);
      Alert.alert(
        'Locked',
        `Unlock this in the Shop tab. (Cost: ${price} coins)`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Shop', onPress: () => router.push('/shop') },
        ]
      );
      return;
    }

    setSelectedFrame(normalized);
  };

  if (!userId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <Text style={{ color: Colors.text }}>Please sign in.</Text>
      </View>
    );
  }

  if (profileQuery.isLoading && !initialized) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: headerBg }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.headerBtn}>✕</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Choose your avatar</Text>

          <Pressable
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            hitSlop={10}
          >
            <Text style={[styles.headerBtn, { opacity: saveMutation.isPending ? 0.5 : 1 }]}>
              DONE
            </Text>
          </Pressable>
        </View>

        <Text style={styles.headerSubtitle}>
          Pick a character, background color, eyes, mouth, and accessories.
        </Text>

        <View style={styles.previewCard}>
          <View style={styles.previewTabs}>
            <Pressable
              onPress={() => setPreviewVariant('head')}
              style={[
                styles.previewTab,
                previewVariant === 'head' ? styles.previewTabActive : null,
              ]}
            >
              <Text style={styles.previewTabText}>Head</Text>
            </Pressable>
            <Pressable
              onPress={() => setPreviewVariant('full')}
              style={[
                styles.previewTab,
                previewVariant === 'full' ? styles.previewTabActive : null,
              ]}
            >
              <Text style={styles.previewTabText}>Full</Text>
            </Pressable>
          </View>

          <View style={styles.previewAvatarWrap}>
            {previewVariant === 'head' ? (
              <AvatarHead
                avatarId={selectedAvatarId}
                avatarColor={selectedColor}
                avatarAccessory={selectedAccessory}
                avatarFrame={selectedFrame}
                avatarEyes={selectedEyes}
                avatarMouth={selectedMouth}
                size={96}
                zoom={1.35}
              />
            ) : (
              // We only have heads right now — use the same head for "Full"
              <AvatarHead
                avatarId={selectedAvatarId}
                avatarColor={selectedColor}
                avatarAccessory={selectedAccessory}
                avatarFrame={selectedFrame}
                avatarEyes={selectedEyes}
                avatarMouth={selectedMouth}
                size={96}
                zoom={1.2}
              />
            )}
          </View>

          <View style={styles.coinRow}>
            <Text style={styles.coinText}>Coins: {coinBalance}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 + insets.bottom }}
      >
        {/* Background color */}
        <Text style={styles.sectionTitle}>Background color</Text>
        <View style={styles.colorRow}>
          {BG_COLORS.map((c) => {
            const active = safeHexColor(c) === safeHexColor(selectedColor);
            return (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  active ? styles.colorDotActive : null,
                ]}
              />
            );
          })}
        </View>

        {/* Eyes */}
        <Text style={styles.sectionTitle}>Eyes</Text>
        <View style={styles.chipRow}>
          {AVATAR_EYES.map((e) => {
            const active = e.id === normalizeEyesId(selectedEyes);
            return (
              <Pressable
                key={e.id}
                onPress={() => setSelectedEyes(e.id)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={styles.chipText}>{e.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Mouth */}
        <Text style={styles.sectionTitle}>Mouth</Text>
        <View style={styles.chipRow}>
          {AVATAR_MOUTHS.map((m) => {
            const active = m.id === normalizeMouthId(selectedMouth);
            return (
              <Pressable
                key={m.id}
                onPress={() => setSelectedMouth(m.id)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={styles.chipText}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Accessory */}
        <Text style={styles.sectionTitle}>Accessory</Text>
        <View style={styles.chipRow}>
          {AVATAR_ACCESSORIES.map((a) => {
            const active = a.id === normalizeAccessoryId(selectedAccessory);
            const unlocked = isAccessoryUnlocked(unlockedAccessories, a.id);
            const price = getAccessoryPrice(a.id);
            const def = getAccessoryDef(a.id);

            return (
              <Pressable
                key={a.id}
                onPress={() => onPickAccessory(a.id)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={styles.chipText}>
                  {def.label}
                  {!unlocked && a.id !== 'none' ? `  🔒 ${price}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Frame */}
        <Text style={styles.sectionTitle}>Frame</Text>
        <View style={styles.chipRow}>
          {AVATAR_FRAMES.map((f) => {
            const active = f.id === normalizeFrameId(selectedFrame);
            const unlocked = isFrameUnlocked(unlockedFrames, f.id);
            const price = getFramePrice(f.id);
            const def = getFrameDef(f.id);

            return (
              <Pressable
                key={f.id}
                onPress={() => onPickFrame(f.id)}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={styles.chipText}>
                  {def.label}
                  {!unlocked && f.id !== 'none' ? `  🔒 ${price}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Character */}
        <Text style={styles.sectionTitle}>Character</Text>
        <View style={styles.grid}>
          {AVATARS.map((a) => {
            const active = a.id === selectedAvatarId;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelectedAvatarId(a.id)}
                style={[styles.gridItem, active ? styles.gridItemActive : null]}
              >
                <AvatarHead
                  avatarId={a.id}
                  avatarColor={selectedColor}
                  avatarAccessory={selectedAccessory}
                  avatarFrame={selectedFrame}
                  avatarEyes={selectedEyes}
                  avatarMouth={selectedMouth}
                  size={64}
                  zoom={1.25}
                />
                <Text style={styles.gridLabel}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          style={[styles.saveBtn, saveMutation.isPending ? { opacity: 0.6 } : null]}
        >
          <Text style={styles.saveBtnText}>
            {saveMutation.isPending ? 'Saving…' : 'Save Avatar'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  headerSubtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
  },
  previewCard: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  previewTabs: {
    flexDirection: 'row',
    gap: 10,
  },
  previewTab: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  previewTabActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  previewTabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  previewAvatarWrap: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  coinText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#111827',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  chipActive: {
    borderColor: '#1D4ED8',
    borderWidth: 2,
  },
  chipText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '30%',
    minWidth: 96,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  gridItemActive: {
    borderColor: '#1D4ED8',
    borderWidth: 2,
  },
  gridLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
  },
  saveBtn: {
    marginTop: 18,
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
});
