import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp, Persona, Lang } from "@/src/context/AppContext";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, persona, setPersona, lang, setLang, subscription, setSubscription } = useApp();

  const personas: { id: Persona; label: string }[] = [
    { id: "student", label: t("profile.student") },
    { id: "coach", label: t("profile.coach") },
    { id: "moderator", label: t("profile.moderator") },
  ];

  const logout = () => {
    setSubscription({ active: false });
    setPersona("student");
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing["3xl"] + 60,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Text style={styles.section}>{t("sec.profile")}</Text>

        <View style={styles.headerCard}>
          <Image
            source="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Rafael M.</Text>
            <Text style={styles.email}>rafael@vyra.club</Text>
            <View style={[styles.badge, { backgroundColor: subscription.active ? "rgba(52,199,89,0.15)" : "rgba(216,180,106,0.15)" }]}>
              <Ionicons
                name={subscription.active ? "shield-checkmark" : "sparkles"}
                size={12}
                color={subscription.active ? colors.success : colors.gold}
              />
              <Text style={{ color: subscription.active ? colors.success : colors.gold, fontSize: fs.sm, fontWeight: "600" }}>
                {subscription.active ? `${subscription.planId?.toUpperCase()} · ${t("profile.active")}` : t("profile.inactive")}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>{t("profile.persona")}</Text>
        <View style={styles.personaRow}>
          {personas.map((p) => (
            <Pressable
              key={p.id}
              testID={`persona-${p.id}`}
              onPress={() => setPersona(p.id)}
              style={[styles.personaCard, persona === p.id && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" }]}
            >
              <Ionicons
                name={p.id === "student" ? "person" : p.id === "coach" ? "school" : "shield"}
                size={20}
                color={persona === p.id ? colors.brand : colors.textDim}
              />
              <Text style={[styles.personaText, persona === p.id && { color: colors.text }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {(persona === "coach" || persona === "moderator") && (
          <Pressable
            testID="open-coach-dashboard"
            onPress={() => router.push("/coach")}
            style={styles.adminBtn}
          >
            <Ionicons name="analytics" size={20} color={colors.text} />
            <Text style={styles.adminText}>{t("profile.admin")}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </Pressable>
        )}

        <Text style={styles.section}>{t("profile.language")}</Text>
        <View style={styles.langRow}>
          {(["pt", "en"] as Lang[]).map((l) => (
            <Pressable
              key={l}
              testID={`profile-lang-${l}`}
              onPress={() => setLang(l)}
              style={[styles.langCard, lang === l && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" }]}
            >
              <Text style={[styles.langText, lang === l && { color: colors.text }]}>
                {l === "pt" ? "🇧🇷  Português (BRL)" : "🇺🇸  English (USD)"}
              </Text>
              {lang === l && <Ionicons name="checkmark-circle" size={18} color={colors.brand} />}
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{t("profile.subscription")}</Text>
        <Pressable
          testID="manage-plan-btn"
          onPress={() => router.push("/paywall")}
          style={styles.rowBtn}
        >
          <Ionicons name="card-outline" size={18} color={colors.text} />
          <Text style={styles.rowText}>{subscription.active ? `${subscription.planId?.toUpperCase()} · ${subscription.cycle}` : t("cta.premium")}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </Pressable>

        <Pressable testID="logout-btn" onPress={logout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>{t("cta.logout")}</Text>
        </Pressable>

        <Text style={styles.version}>{t("profile.version")}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.lg },
  headerCard: { flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  name: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  email: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.sm },
  personaRow: { flexDirection: "row", gap: spacing.sm },
  personaCard: { flex: 1, alignItems: "center", gap: 6, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  personaText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  adminBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.gold, marginTop: spacing.md },
  adminText: { color: colors.text, flex: 1, fontSize: fs.lg, fontWeight: "600" },
  langRow: { gap: spacing.sm },
  langCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  langText: { color: colors.textDim, fontSize: fs.lg, fontWeight: "500" },
  rowBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowText: { color: colors.text, flex: 1, fontSize: fs.lg },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,59,48,0.4)", marginTop: spacing.xl },
  logoutText: { color: colors.error, fontSize: fs.lg, fontWeight: "600" },
  version: { color: colors.textDim, fontSize: fs.sm, textAlign: "center", marginTop: spacing.lg },
});
