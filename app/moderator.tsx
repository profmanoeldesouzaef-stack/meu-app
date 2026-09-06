import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function Moderator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [email, setEmail] = useState("");
  const [coaches, setCoaches] = useState<any[]>([]);

  const load = () => api.coaches().then(setCoaches).catch(() => {});
  useEffect(load, []);

  const add = async () => {
    if (!email) return;
    await api.createCoach(email);
    setEmail("");
    load();
  };
  const toggle = async (id: string) => {
    await api.toggleCoach(id);
    load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="mod-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("mod.title")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="shield-checkmark" size={16} color={colors.brand} />
            <Text style={styles.cardTitle}>{t("mod.add_coach")}</Text>
          </View>
          <Text style={styles.label}>{t("mod.coach_email")}</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TextInput
              testID="mod-email-input"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="coach@vyra.club"
              placeholderTextColor={colors.textDim}
              style={styles.input}
            />
            <Pressable testID="mod-add-coach" onPress={add} style={styles.addBtn}>
              <Ionicons name="add" size={18} color="#F5F5F7" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.section}>Coaches cadastrados</Text>
        <View style={{ gap: spacing.sm }}>
          {coaches.map((c) => (
            <View key={c.id} style={styles.coachRow}>
              <View style={[styles.dot, { backgroundColor: c.active ? colors.success : colors.textDim }]} />
              <Text style={styles.coachEmail}>{c.email}</Text>
              <Pressable testID={`toggle-coach-${c.id}`} onPress={() => toggle(c.id)}
                style={[styles.toggleBtn, !c.active && { backgroundColor: "rgba(52,199,89,0.1)", borderColor: colors.success }]}>
                <Text style={{ color: c.active ? colors.error : colors.success, fontSize: fs.sm, fontWeight: "700" }}>
                  {c.active ? "Desativar" : "Ativar"}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "700" },
  label: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  input: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg },
  addBtn: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.xl },
  coachRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  coachEmail: { flex: 1, color: colors.text, fontSize: fs.base },
  toggleBtn: { paddingHorizontal: 12, height: 32, borderRadius: radius.pill, backgroundColor: "rgba(255,59,48,0.1)", borderWidth: 1, borderColor: colors.error, alignItems: "center", justifyContent: "center" },
});
