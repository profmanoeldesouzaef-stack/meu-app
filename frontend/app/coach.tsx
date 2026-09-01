import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

type Tab = "overview" | "finance" | "plans" | "radar";
const TABS: { id: Tab; icon: any }[] = [
  { id: "overview", icon: "grid-outline" },
  { id: "finance", icon: "wallet-outline" },
  { id: "plans", icon: "barbell-outline" },
  { id: "radar", icon: "pulse-outline" },
];

export default function CoachDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [kpis, setKpis] = useState<any[]>([]);
  const [radar, setRadar] = useState<any[]>([]);
  const [coupon, setCoupon] = useState("");
  const [couponPct, setCouponPct] = useState("");
  const [partner, setPartner] = useState("");
  const [drafts, setDrafts] = useState<string[]>([]);
  const [newExercise, setNewExercise] = useState("");
  const [coupons, setCoupons] = useState<{ code: string; pct: string }[]>([{ code: "VYRA10", pct: "10" }, { code: "RESET25", pct: "25" }]);
  const [partners, setPartners] = useState<string[]>(["coach@vyra.club"]);

  useEffect(() => {
    api.kpis().then(setKpis).catch(() => {});
    api.radar().then(setRadar).catch(() => {});
  }, []);

  const saveCoupon = () => {
    if (!coupon || !couponPct) return;
    setCoupons((c) => [...c, { code: coupon.toUpperCase(), pct: couponPct }]);
    setCoupon(""); setCouponPct("");
  };

  const savePartner = () => {
    if (!partner) return;
    setPartners((p) => [...p, partner]);
    setPartner("");
  };

  const addExercise = () => {
    if (!newExercise) return;
    setDrafts((d) => [...d, newExercise]);
    setNewExercise("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="coach-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("coach.title")}</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        >
          {TABS.map((tb) => (
            <Pressable
              key={tb.id}
              testID={`coach-tab-${tb.id}`}
              onPress={() => setTab(tb.id)}
              style={[styles.tabChip, tab === tb.id && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}
            >
              <Ionicons name={tb.icon} size={14} color={tab === tb.id ? colors.brand : colors.textDim} />
              <Text style={[styles.tabText, tab === tb.id && { color: colors.text }]}>{t(`coach.${tb.id}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        {tab === "overview" && (
          <View style={styles.grid}>
            {kpis.map((k, i) => (
              <View key={i} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{lang === "pt" ? k.label_pt : k.label_en}</Text>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <View style={styles.deltaRow}>
                  <Ionicons name="trending-up" size={12} color={colors.success} />
                  <Text style={styles.deltaText}>{k.delta}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === "finance" && (
          <View>
            <Text style={styles.section}>{t("coach.new_coupon")}</Text>
            <View style={styles.card}>
              <TextInput
                testID="new-coupon-code"
                value={coupon}
                onChangeText={setCoupon}
                autoCapitalize="characters"
                placeholder="VYRA20"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
              <TextInput
                testID="new-coupon-pct"
                value={couponPct}
                onChangeText={setCouponPct}
                keyboardType="number-pad"
                placeholder="20"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
              <Pressable testID="save-coupon" onPress={saveCoupon} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{t("cta.save")}</Text>
              </Pressable>
              <View style={{ marginTop: spacing.md, gap: 6 }}>
                {coupons.map((c, i) => (
                  <View key={i} style={styles.pillRow}>
                    <Text style={styles.pillCode}>{c.code}</Text>
                    <Text style={styles.pillPct}>-{c.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.section}>{t("coach.partners")}</Text>
            <View style={styles.card}>
              <TextInput
                testID="partner-email"
                value={partner}
                onChangeText={setPartner}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="parceiro@empresa.com"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
              <Pressable testID="save-partner" onPress={savePartner} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{t("cta.save")}</Text>
              </Pressable>
              <View style={{ marginTop: spacing.md, gap: 6 }}>
                {partners.map((p, i) => (
                  <View key={i} style={styles.pillRow}>
                    <Ionicons name="mail-outline" size={14} color={colors.textDim} />
                    <Text style={[styles.pillCode, { flex: 1 }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {tab === "plans" && (
          <View>
            <Text style={styles.section}>{t("coach.new_workout")}</Text>
            <View style={styles.card}>
              <TextInput
                testID="new-exercise"
                value={newExercise}
                onChangeText={setNewExercise}
                placeholder="Supino inclinado 4x10"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
              <Pressable testID="add-exercise" onPress={addExercise} style={styles.primaryBtn}>
                <Ionicons name="add" size={16} color={colors.text} />
                <Text style={styles.primaryText}>{t("coach.new_exercise")}</Text>
              </Pressable>
              <View style={{ marginTop: spacing.md, gap: 6 }}>
                {drafts.map((d, i) => (
                  <View key={i} style={styles.pillRow}>
                    <Ionicons name="barbell-outline" size={14} color={colors.brand} />
                    <Text style={[styles.pillCode, { flex: 1 }]}>{d}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md }]}>
                <Ionicons name="save-outline" size={16} color={colors.text} />
                <Text style={styles.primaryText}>{t("coach.save_draft")}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {tab === "radar" && (
          <View>
            <Text style={styles.section}>{t("coach.alerts")}</Text>
            {radar.map((a) => (
              <View key={a.id} style={[styles.alertCard, a.severity === "crit" && { borderColor: colors.error }, a.severity === "warn" && { borderColor: colors.gold }]}>
                <View style={[styles.alertDot, { backgroundColor: a.severity === "crit" ? colors.error : a.severity === "warn" ? colors.gold : colors.blue }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertName}>{a.student}</Text>
                  <Text style={styles.alertStatus}>{a.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  tabsWrap: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabChip: { flexShrink: 0, flexDirection: "row", gap: 6, alignItems: "center", height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginTop: spacing.md, marginBottom: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  kpiCard: { width: "48%", backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  kpiLabel: { color: colors.textDim, fontSize: fs.sm },
  kpiValue: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -1, marginTop: 4 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  deltaText: { color: colors.success, fontSize: fs.sm, fontWeight: "600" },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  input: { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg },
  primaryBtn: { flexDirection: "row", height: 48, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  primaryText: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  pillRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  pillCode: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  pillPct: { color: colors.brand, fontSize: fs.base, fontWeight: "700" },
  alertCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertName: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  alertStatus: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
});
