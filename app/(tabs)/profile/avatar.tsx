import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AVATARS } from "@/constants/avatars";
import AvatarHead from "@/components/AvatarHead";

const COLOR_CHOICES = [
  "#FFFFFF", // default white
  "#FEE2E2",
  "#FFEDD5",
  "#FEF9C3",
  "#DCFCE7",
  "#DBEAFE",
  "#E0E7FF",
  "#FCE7F3",
  "#E5E7EB",
];

export default function AvatarSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { session } = useAuth();

  const userId = session?.user?.id;

  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("beaver");
  const [selectedColor, setSelectedColor] = useState<string>("#FFFFFF");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => AVATARS, []);

  const handleSave = async () => {
    if (!userId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_id: selectedAvatarId,
          avatar_color: selectedColor,
        })
        .eq("id", userId);

      if (error) throw error;

      // Refresh everywhere
      qc.invalidateQueries({ queryKey: ["profile-avatar", userId] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });

      router.back();
    } catch (e: any) {
      Alert.alert("Could not save avatar", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: Colors.text }}>Avatar</Text>
        <Text style={{ marginTop: 4, color: Colors.textSecondary, fontWeight: "600" }}>
          Pick your character + background color.
        </Text>
      </View>

      <View style={{ alignItems: "center", marginBottom: 10 }}>
        <AvatarHead avatarId={selectedAvatarId} avatarColor={selectedColor} size={110} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text style={{ fontSize: 14, fontWeight: "900", color: Colors.textSecondary, marginBottom: 10 }}>
          Choose a color
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {COLOR_CHOICES.map((c) => {
            const isActive = selectedColor === c;
            return (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  borderWidth: isActive ? 3 : 1,
                  borderColor: isActive ? Colors.primary : "rgba(0,0,0,0.12)",
                }}
              />
            );
          })}
        </View>

        <Text style={{ fontSize: 14, fontWeight: "900", color: Colors.textSecondary, marginBottom: 10 }}>
          Choose an avatar
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {rows.map((a) => {
            const isActive = selectedAvatarId === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => setSelectedAvatarId(a.id)}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  backgroundColor: "white",
                  borderWidth: isActive ? 3 : 1,
                  borderColor: isActive ? Colors.primary : "rgba(0,0,0,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AvatarHead avatarId={a.id} avatarColor="#FFFFFF" size={54} />
                <Text style={{ fontSize: 11, fontWeight: "800", marginTop: 4, color: Colors.textSecondary }}>
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            marginTop: 22,
            backgroundColor: Colors.primary,
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
            {saving ? "Saving..." : "Save Avatar"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}