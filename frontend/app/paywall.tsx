import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

type Cycle = "month" | "quarter" | "year";

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, fmtPrice, lang } = useApp();
  const [plans, setPlans] = useState<any[]>([]);
  const [cycle, setCycle] = useState<Cycle>("quarter");
  const [selected, setSelected] = useState<string>("reset12");

  useEffect(() => {
    api.plans().then(setPlans).catch(() => {});
  }, []);

  const cycleKey: Record<Cycle, string> = {
    month: "paywall.per_month",
    quarter: "paywall.per_quarter",
    year: "paywall.per_year",
  };

  const chosen = useMemo(() => plans.find((p) => p.slug === selected), [plans, selected]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={["rgba(255,106,42,0.14)", "rgba(10,10,10,0)"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.xl,
        }}
      >
        <Pressable testID="paywall-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t("paywall.title")}</Text>
        <Text style={styles.sub}>{t("paywall.sub")}</Text>

        <View style={styles.cycleRow}>
          {(["month", "quarter", "year"] as Cycle[]).map((c) => (
            <Pressable
              key={c}
              testID={`cycle-${c}`}
              onPress={() => setCycle(c)}
              style={[styles.cycleBtn, cycle === c && styles.cycleBtnActive]}
            >
              <Text style={[styles.cycleText, cycle === c && styles.cycleTextActive]}>
                {t(`paywall.${c === "month" ? "monthly" : c === "quarter" ? "quarterly" : "yearly"}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {plans.map((p) => {
          const price = lang === "pt" ? p.prices_brl[cycle] : p.prices_usd[cycle];
          const isSelected = selected === p.slug;
          return (
            <Pressable
              key={p.id}
              testID={`plan-card-${p.slug}`}
              onPress={() => setSelected(p.slug)}
              style={[
                styles.planCard,
                { borderColor: isSelected ? p.accent : colors.border, borderWidth: isSelected ? 2 : 1 },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <View style={[styles.planDot, { backgroundColor: p.accent }]} />
                <Text style={styles.planName}>{p.name}</Text>
                {p.tag && (
                  <View style={styles.tag}>
                    <Ionicons name="star" size={10} color={colors.gold} />
                    <Text style={styles.tagText}>{t("paywall.most_wanted")}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planDesc}>{p.description}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{fmtPrice(p.prices_brl[cycle], p.prices_usd[cycle])}</Text>
                <Text style={styles.priceCycle}>{t(cycleKey[cycle])}</Text>
              </View>
              <View style={styles.perks}>
                {p.perks.slice(0, 3).map((perk: string, i: number) => (
                  <View key={i} style={styles.perkRow}>
                    <Ionicons name="checkmark-circle" size={14} color={p.accent} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.coming}>
          <Ionicons name="time-outline" size={16} color={colors.gold} />
          <Text style={styles.comingText}>{t("paywall.coming")}</Text>
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          testID="paywall-continue"
          disabled={!chosen}
          onPress={() =>
            router.push({ pathname: "/checkout", params: { slug: chosen.slug, cycle } })
          }
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.ctaText}>{t("cta.continue")}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(21,21,21,0.7)",
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: fs.lg, marginTop: spacing.sm, marginBottom: spacing.xl, lineHeight: 22 },
  cycleRow: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  cycleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.pill },
  cycleBtnActive: { backgroundColor: colors.brand },
  cycleText: { color: colors.textDim, fontSize: fs.base, fontWeight: "600" },
  cycleTextActive: { color: colors.text },
  planCard: {
    backgroundColor: "rgba(21,21,21,0.85)",
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  planDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { color: colors.text, fontSize: fs.xl, fontWeight: "700", flex: 1 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(216,180,106,0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { color: colors.gold, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  planDesc: { color: colors.textDim, fontSize: fs.base, marginTop: spacing.sm, lineHeight: 20 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: spacing.md },
  price: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  priceCycle: { color: colors.textDim, fontSize: fs.base, marginBottom: 5 },
  perks: { marginTop: spacing.md, gap: spacing.xs },
  perkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  perkText: { color: colors.text, fontSize: fs.base, flex: 1 },
  coming: { flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", marginTop: spacing.md, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: "rgba(216,180,106,0.06)" },
  comingText: { color: colors.gold, fontSize: fs.base, letterSpacing: 0.5 },
  stickyBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    backgroundColor: "rgba(10,10,10,0.95)",
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  cta: {
    height: 52, borderRadius: radius.lg, backgroundColor: colors.brand,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
  },
  ctaText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
});
