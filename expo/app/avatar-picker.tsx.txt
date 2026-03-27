import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { AVATARS } from "@/constants/avatars";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AvatarHead from "@/components/AvatarHead";

export default function AvatarPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const userId = session?.user?.id ?? null;

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string>("beaver");

  // Load current avatar so the picker highlights it
  useQuery({
    queryKey: ["profile-avatar", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_id")
        .eq("id", userId)
        .single();

      if (error) throw error;
      const current = (data?.avatar_id ?? "beaver") as string;
      setSelected(current);
      return data;
    },
    staleTime: 60_000,
  });

  const items = useMemo(() => AVATARS, []);

  const saveAvatar = async () => {
    if (!userId) {
      Alert.alert("Not signed in", "Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      // Set avatar_color to NULL so background stays default white for now
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_id: selected, avatar_color: null })
        .eq("id", userId);

      if (error) throw error;

      // Refresh avatar everywhere
      queryClient.invalidateQueries({ queryKey: ["profile-avatar", userId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });

      Alert.alert("Saved!", "Your avatar has been updated.");
      router.back();
    } catch (e: any) {
      Alert.alert("Could not save avatar", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Choose Avatar</Text>

        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.subtitle}>Pick your character (cosmetics coming later).</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = item.id === selected;
          return (
            <Pressable
              style={[styles.tile, isSelected && styles.tileSelected]}
              onPress={() => setSelected(item.id)}
            >
              <AvatarHead avatarId={item.id} avatarColor="#FFFFFF" size={74} zoom={1.35} />
              <Text style={styles.tileLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      <Pressable
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        disabled={saving}
        onPress={saveAvatar}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}>Save Avatar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backBtn: { width: 60, paddingVertical: 8 },
  backText: { color: Colors.primary, fontWeight: "800" },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  subtitle: { color: Colors.textSecondary, fontWeight: "600", marginBottom: 12 },

  grid: { paddingBottom: 120 },
  tile: {
    flex: 1,
    alignItems: "center",
    margin: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tileSelected: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
    backgroundColor: Colors.primaryLight,
  },
  tileLabel: { marginTop: 8, fontWeight: "800", color: Colors.text, fontSize: 12 },

  saveBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
});