import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

const MEALS = [
  { id: "breakfast", icon: "sunny-outline" },
  { id: "lunch", icon: "restaurant-outline" },
  { id: "snack", icon: "cafe-outline" },
  { id: "dinner", icon: "moon-outline" },
  { id: "supper", icon: "moon" },
] as const;

export default function Diet() {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [diet, setDiet] = useState<any>(null);

  useEffect(() => {
    api.diet().then(setDiet).catch(() => {});
  }, []);

  const changeKcal = (delta: number) => {
    if (!diet) return;
    const next = { ...diet, kcal: Math.max(1200, diet.kcal + delta) };
    setDiet(next);
    api.updateDiet({ kcal: next.kcal, protein_pct: next.protein_pct, carbs_pct: next.carbs_pct, fats_pct: next.fats_pct }).catch(() => {});
  };

  if (!diet) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const gramsP = Math.round((diet.kcal * diet.protein_pct / 100) / 4);
  const gramsC = Math.round((diet.kcal * diet.carbs_pct / 100) / 4);
  const gramsF = Math.round((diet.kcal * diet.fats_pct / 100) / 9);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing["3xl"] + 60,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Text style={styles.section}>{t("sec.diet")}</Text>
        <Text style={styles.title}>{t("diet.calc")}</Text>

        <View style={styles.calcCard}>
          <View style={styles.kcalRow}>
            <Pressable testID="kcal-minus" onPress={() => changeKcal(-50)} style={styles.iconBtn}>
              <Ionicons name="remove" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.kcalValue}>
              <Text style={styles.kcalNumber}>{diet.kcal}</Text>
              <Text style={styles.kcalLabel}>kcal</Text>
            </View>
            <Pressable testID="kcal-plus" onPress={() => changeKcal(50)} style={styles.iconBtn}>
              <Ionicons name="add" size={20} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.macros}>
            <MacroPill label={t("diet.protein")} pct={diet.protein_pct} grams={gramsP} color={colors.brand} />
            <MacroPill label={t("diet.carbs")} pct={diet.carbs_pct} grams={gramsC} color={colors.gold} />
            <MacroPill label={t("diet.fats")} pct={diet.fats_pct} grams={gramsF} color={colors.blue} />
          </View>
        </View>

        <Text style={styles.section}>{t("diet.foods")}</Text>
        {MEALS.map((meal) => {
          const items = diet.foods.filter((f: any) => f.meal === meal.id);
          if (!items.length) return null;
          return (
            <View key={meal.id} style={styles.mealBlock}>
              <View style={styles.mealHead}>
                <Ionicons name={meal.icon} size={16} color={colors.brand} />
                <Text style={styles.mealTitle}>{t(`meal.${meal.id}`)}</Text>
              </View>
              {items.map((f: any) => (
                <View key={f.id} style={styles.foodCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName}>{f.name}</Text>
                    <Text style={styles.foodMacro}>
                      {f.grams}g · {f.kcal} kcal · P{f.p} C{f.c} G{f.f}
                    </Text>
                  </View>
                  <Pressable testID={`swap-${f.id}`} style={styles.swap}>
                    <Ionicons name="swap-horizontal" size={14} color={colors.brand} />
                    <Text style={styles.swapText}>{t("diet.substitute")}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MacroPill({ label, pct, grams, color }: any) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{pct}% · {grams}g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", letterSpacing: -0.5 },
  calcCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg },
  kcalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  kcalValue: { alignItems: "center" },
  kcalNumber: { color: colors.text, fontSize: 44, fontWeight: "800", letterSpacing: -1 },
  kcalLabel: { color: colors.textDim, fontSize: fs.base, marginTop: -4 },
  macros: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg, gap: spacing.sm },
  macroPill: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { color: colors.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  macroValue: { color: colors.text, fontSize: fs.sm, fontWeight: "600", marginTop: 2 },
  mealBlock: { marginBottom: spacing.md },
  mealHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  mealTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  foodCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, gap: spacing.md },
  foodName: { color: colors.text, fontSize: fs.lg, fontWeight: "500" },
  foodMacro: { color: colors.textDim, fontSize: fs.sm, marginTop: 4 },
  swap: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,106,42,0.4)", backgroundColor: "rgba(255,106,42,0.08)" },
  swapText: { color: colors.brand, fontSize: fs.sm, fontWeight: "600" },
});
