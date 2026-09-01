import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, fmtPrice, lang, setSubscription } = useApp();
  const { slug, cycle } = useLocalSearchParams<{ slug: string; cycle: "month" | "quarter" | "year" }>();

  const [plan, setPlan] = useState<any>(null);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ valid: boolean; discount: number; total: number; percent: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.plans().then((all) => setPlan(all.find((p) => p.slug === slug)));
  }, [slug]);

  if (!plan) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const subtotal = lang === "pt" ? plan.prices_brl[cycle] : plan.prices_usd[cycle];
  const discount = applied?.valid ? applied.discount : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    if (!code) return;
    const res = await api.coupon(code, subtotal);
    setApplied(res);
    setMessage(res.valid ? t("checkout.applied") : t("checkout.invalid"));
  };

  const confirm = () => {
    setSubscription({ active: true, planId: plan.slug, cycle });
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.xl,
        }}
      >
        <Pressable testID="checkout-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.title}>{t("checkout.title")}</Text>

        <View style={styles.card}>
          <Text style={styles.section}>{t("checkout.summary")}</Text>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: plan.accent }]} />
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.cycleText}>
              {t(`paywall.${cycle === "month" ? "monthly" : cycle === "quarter" ? "quarterly" : "yearly"}`)}
            </Text>
          </View>
          <Text style={styles.desc}>{plan.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>{t("checkout.coupon")}</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TextInput
              testID="coupon-input"
              value={code}
              onChangeText={setCode}
              placeholder={t("checkout.enter_coupon")}
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              style={styles.input}
            />
            <Pressable testID="coupon-apply" onPress={applyCoupon} style={styles.applyBtn}>
              <Text style={styles.applyText}>{t("cta.apply")}</Text>
            </Pressable>
          </View>
          {message && (
            <Text
              testID="coupon-feedback"
              style={{
                color: applied?.valid ? colors.success : colors.error,
                marginTop: spacing.sm, fontSize: fs.sm,
              }}
            >
              {message} {applied?.valid ? `· -${applied.percent}%` : ""}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("checkout.subtotal")}</Text>
            <Text style={styles.totalValue}>
              {fmtPrice(plan.prices_brl[cycle], plan.prices_usd[cycle])}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("checkout.discount")}</Text>
              <Text style={[styles.totalValue, { color: colors.brand }]}>
                -{lang === "pt" ? `R$ ${discount.toFixed(0)}` : `$ ${discount.toFixed(0)}`}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={styles.grandLabel}>{t("checkout.total")}</Text>
            <Text style={styles.grandValue}>
              {lang === "pt" ? `R$ ${total.toFixed(0)}` : `$ ${total.toFixed(0)}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          testID="confirm-purchase-button"
          onPress={confirm}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="lock-closed" size={16} color={colors.text} />
          <Text style={styles.ctaText}>{t("cta.confirm_purchase")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  planName: { color: colors.text, fontSize: fs.xl, fontWeight: "700", flex: 1 },
  cycleText: { color: colors.textDim, fontSize: fs.base },
  desc: { color: colors.textDim, fontSize: fs.base, marginTop: spacing.sm, lineHeight: 20 },
  input: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg, letterSpacing: 1 },
  applyBtn: { paddingHorizontal: spacing.lg, height: 48, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  applyText: { color: colors.text, fontWeight: "600", fontSize: fs.base },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  totalLabel: { color: colors.textDim, fontSize: fs.lg },
  totalValue: { color: colors.text, fontSize: fs.lg, fontWeight: "500" },
  grandLabel: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  grandValue: { color: colors.brand, fontSize: fs.xl, fontWeight: "800" },
  stickyBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  ctaText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
});
