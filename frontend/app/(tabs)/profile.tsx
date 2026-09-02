import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp, Persona, Lang, Theme } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, persona, setPersona, lang, setLang, theme, setTheme, subscription, setSubscription, setLoggedIn } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { api.profile().then(setProfile).catch(() => {}); }, []);

  const personas: { id: Persona; label: string }[] = [
    { id: "student", label: t("profile.student") },
    { id: "coach", label: t("profile.coach") },
    { id: "moderator", label: t("profile.moderator") },
  ];

  const logout = () => {
    setSubscription({ active: false });
    setPersona("student");
    setLoggedIn(false);
    router.replace("/login");
  };

  const openAdmin = () => {
    if (persona === "moderator") router.push("/moderator");
    else router.push("/coach");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing["3xl"] + 60,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>{t("sec.profile")}</Text>

        <View style={styles.headerCard}>
          <Image source={profile?.avatar_url ?? "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.nickname ?? "-"}</Text>
            <Text style={styles.email}>{profile?.email ?? "-"}</Text>
            <View style={[styles.badge, { backgroundColor: subscription.active ? "rgba(52,199,89,0.15)" : "rgba(216,180,106,0.15)" }]}>
              <Ionicons name={subscription.active ? "shield-checkmark" : "sparkles"} size={12} color={subscription.active ? colors.success : colors.gold} />
              <Text style={{ color: subscription.active ? colors.success : colors.gold, fontSize: fs.sm, fontWeight: "600" }}>
                {subscription.active ? `${subscription.planId?.toUpperCase()} · ${t("profile.active")}` : t("profile.inactive")}
              </Text>
            </View>
          </View>
          <Pressable testID="edit-profile-btn" onPress={() => setEditOpen(true)} style={styles.editIcon}>
            <Ionicons name="pencil" size={16} color={colors.brand} />
          </Pressable>
        </View>

        <Text style={styles.section}>{t("sec.perimetry")}</Text>
        <View style={styles.periGrid}>
          <PeriCell label={t("profile.height")} value={profile?.height_cm} suffix="cm" />
          <PeriCell label={t("profile.weight")} value={profile?.weight_kg} suffix="kg" />
          <PeriCell label={t("profile.waist")} value={profile?.waist_cm} suffix="cm" />
          <PeriCell label={t("profile.right_arm")} value={profile?.right_arm_cm} suffix="cm" />
          <PeriCell label={t("profile.left_arm")} value={profile?.left_arm_cm} suffix="cm" />
          <PeriCell label={t("profile.right_leg")} value={profile?.right_leg_cm} suffix="cm" />
          <PeriCell label={t("profile.left_leg")} value={profile?.left_leg_cm} suffix="cm" />
        </View>

        <Text style={styles.section}>{t("profile.persona")}</Text>
        <View style={styles.personaRow}>
          {personas.map((p) => (
            <Pressable key={p.id} testID={`persona-${p.id}`} onPress={() => setPersona(p.id)}
              style={[styles.personaCard, persona === p.id && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" }]}>
              <Ionicons name={p.id === "student" ? "person" : p.id === "coach" ? "school" : "shield"} size={20}
                color={persona === p.id ? colors.brand : colors.textDim} />
              <Text style={[styles.personaText, persona === p.id && { color: colors.text }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {(persona === "coach" || persona === "moderator") && (
          <Pressable testID="open-admin-dashboard" onPress={openAdmin} style={styles.adminBtn}>
            <Ionicons name="analytics" size={20} color={colors.text} />
            <Text style={styles.adminText}>{persona === "moderator" ? t("mod.title") : t("profile.admin")}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </Pressable>
        )}

        <Text style={styles.section}>{t("profile.language")}</Text>
        <View style={{ gap: spacing.sm }}>
          {(["pt", "en"] as Lang[]).map((l) => (
            <Pressable key={l} testID={`profile-lang-${l}`} onPress={() => setLang(l)}
              style={[styles.langCard, lang === l && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" }]}>
              <Text style={[styles.langText, lang === l && { color: colors.text }]}>{l === "pt" ? "🇧🇷  Português (BRL)" : "🇺🇸  English (USD)"}</Text>
              {lang === l && <Ionicons name="checkmark-circle" size={18} color={colors.brand} />}
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{t("profile.theme")}</Text>
        <View style={{ gap: spacing.sm }}>
          {(["dark", "light"] as Theme[]).map((th) => (
            <Pressable key={th} testID={`profile-theme-${th}`} onPress={() => setTheme(th)}
              style={[styles.langCard, theme === th && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" }]}>
              <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                <Ionicons name={th === "dark" ? "moon" : "sunny"} size={16} color={theme === th ? colors.brand : colors.textDim} />
                <Text style={[styles.langText, theme === th && { color: colors.text }]}>{th === "dark" ? t("profile.dark") : t("profile.light")}</Text>
              </View>
              {theme === th && <Ionicons name="checkmark-circle" size={18} color={colors.brand} />}
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{t("profile.subscription")}</Text>
        <Pressable testID="manage-plan-btn" onPress={() => router.push("/paywall")} style={styles.rowBtn}>
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

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSaved={(p) => setProfile(p)}
      />
    </View>
  );
}

function PeriCell({ label, value, suffix }: any) {
  return (
    <View style={styles.periCell}>
      <Text style={styles.periLabel}>{label}</Text>
      <Text style={styles.periValue}>{value ?? "-"} <Text style={styles.periSuffix}>{suffix}</Text></Text>
    </View>
  );
}

function EditProfileModal({ open, onClose, profile, onSaved }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = async () => {
    const body = {
      nickname: form.nickname,
      email: form.email,
      height_cm: parseInt(String(form.height_cm || 0), 10) || undefined,
      weight_kg: parseFloat(String(form.weight_kg || 0)) || undefined,
      waist_cm: parseFloat(String(form.waist_cm || 0)) || undefined,
      right_arm_cm: parseFloat(String(form.right_arm_cm || 0)) || undefined,
      left_arm_cm: parseFloat(String(form.left_arm_cm || 0)) || undefined,
      right_leg_cm: parseFloat(String(form.right_leg_cm || 0)) || undefined,
      left_leg_cm: parseFloat(String(form.left_leg_cm || 0)) || undefined,
      water_ml: parseInt(String(form.water_ml || 0), 10) || undefined,
      creatine_g: parseFloat(String(form.creatine_g || 0)) || undefined,
      creatine_times: typeof form.creatine_times === "string" ? form.creatine_times.split(",").map((s: string) => s.trim()).filter(Boolean) : form.creatine_times,
    };
    const p = await api.updateProfile(body);
    onSaved(p);
    onClose();
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }}>
        <View style={{ flex: 1, backgroundColor: colors.bg, marginTop: insets.top + 20, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700", flex: 1 }}>{t("profile.edit")}</Text>
            <Pressable testID="close-edit" onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
            <EditRow label={t("profile.nickname")} value={form.nickname} onChange={(v) => set("nickname", v)} testID="edit-nickname" />
            <EditRow label="Email" value={form.email} onChange={(v) => set("email", v)} testID="edit-email" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.height")} value={String(form.height_cm ?? "")} onChange={(v) => set("height_cm", v)} keyboardType="number-pad" testID="edit-height" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.weight")} value={String(form.weight_kg ?? "")} onChange={(v) => set("weight_kg", v)} keyboardType="decimal-pad" testID="edit-weight" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.waist")} value={String(form.waist_cm ?? "")} onChange={(v) => set("waist_cm", v)} keyboardType="decimal-pad" testID="edit-waist" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.right_arm")} value={String(form.right_arm_cm ?? "")} onChange={(v) => set("right_arm_cm", v)} keyboardType="decimal-pad" testID="edit-right-arm" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.left_arm")} value={String(form.left_arm_cm ?? "")} onChange={(v) => set("left_arm_cm", v)} keyboardType="decimal-pad" testID="edit-left-arm" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.right_leg")} value={String(form.right_leg_cm ?? "")} onChange={(v) => set("right_leg_cm", v)} keyboardType="decimal-pad" testID="edit-right-leg" /></View>
            </View>
            <EditRow label={t("profile.left_leg")} value={String(form.left_leg_cm ?? "")} onChange={(v) => set("left_leg_cm", v)} keyboardType="decimal-pad" testID="edit-left-leg" />
            <EditRow label={t("profile.water_target")} value={String(form.water_ml ?? "")} onChange={(v) => set("water_ml", v)} keyboardType="number-pad" testID="edit-water" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.creatine_dose")} value={String(form.creatine_g ?? "")} onChange={(v) => set("creatine_g", v)} keyboardType="decimal-pad" testID="edit-creatine" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.creatine_times")} value={Array.isArray(form.creatine_times) ? form.creatine_times.join(", ") : form.creatine_times || ""} onChange={(v) => set("creatine_times", v)} testID="edit-creatine-times" /></View>
            </View>

            <Pressable testID="save-profile-edit" onPress={save} style={{ height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: spacing.lg }}>
              <Text style={{ color: "#F5F5F7", fontSize: fs.lg, fontWeight: "600" }}>{t("cta.save")}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function EditRow({ label, value, onChange, testID, keyboardType }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
      <TextInput testID={testID} value={value} onChangeText={onChange} keyboardType={keyboardType}
        placeholderTextColor={colors.textDim}
        style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg }} />
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
  editIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,106,42,0.4)", backgroundColor: "rgba(255,106,42,0.1)", alignItems: "center", justifyContent: "center" },
  periGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  periCell: { flexBasis: "48%", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  periLabel: { color: colors.textDim, fontSize: fs.sm },
  periValue: { color: colors.text, fontSize: fs.xl, fontWeight: "700", marginTop: 4 },
  periSuffix: { color: colors.textDim, fontSize: fs.sm, fontWeight: "500" },
  personaRow: { flexDirection: "row", gap: spacing.sm },
  personaCard: { flex: 1, alignItems: "center", gap: 6, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  personaText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  adminBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.gold, marginTop: spacing.md },
  adminText: { color: colors.text, flex: 1, fontSize: fs.lg, fontWeight: "600" },
  langCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  langText: { color: colors.textDim, fontSize: fs.lg, fontWeight: "500" },
  rowBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowText: { color: colors.text, flex: 1, fontSize: fs.lg },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,59,48,0.4)", marginTop: spacing.xl },
  logoutText: { color: colors.error, fontSize: fs.lg, fontWeight: "600" },
  version: { color: colors.textDim, fontSize: fs.sm, textAlign: "center", marginTop: spacing.lg },
});
