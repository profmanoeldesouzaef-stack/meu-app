import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { useSubscription } from "@/src/hooks/useSubscription";
import { PaywallGateMobile } from "@/src/components/PaywallGateMobile";
import { useRouter } from "expo-router";
import { api } from "@/src/api/client";

const MEALS = [
  { id: "breakfast", icon: "sunny-outline" },
  { id: "lunch", icon: "restaurant-outline" },
  { id: "snack", icon: "cafe-outline" },
  { id: "dinner", icon: "moon-outline" },
  { id: "supper", icon: "moon" },
] as const;

// tiny 1x1 jpeg base64 for mock upload flow — user would replace via native picker in real device build
const MOCK_IMG = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

export default function Diet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useApp();
  const { canAccess } = useSubscription();

  // Bloqueio de Telas (Regra de Negócio Crítica: Paywall Guard)
  if (!canAccess("diet")) {
    return (
      <PaywallGateMobile
        title="Assinatura Inativa. Libere seu acesso para visualizar seu treino e dieta."
        description="Libere seu acesso para visualizar seu treino e dieta."
        onSubscribe={() => router.push("/(tabs)/profile")}
        onGoBack={() => router.replace("/(tabs)")}
      />
    );
  }

  const [diet, setDiet] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiMeal, setAiMeal] = useState<string>("");
  const [plateOpen, setPlateOpen] = useState(false);
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateResult, setPlateResult] = useState<any>(null);

  useEffect(() => { api.diet().then(setDiet).catch(() => {}); }, []);

  const changeKcal = (delta: number) => {
    if (!diet) return;
    const next = { ...diet, kcal: Math.max(1200, diet.kcal + delta) };
    setDiet(next);
    api.updateDiet({ kcal: next.kcal }).catch(() => {});
  };

  const aiSuggest = async (meal: string, food: string) => {
    setAiMeal(meal);
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.aiDietSuggest(meal, food, lang);
      setAiResult(res);
    } catch (e) {
      setAiResult({ suggestions: [] });
    } finally {
      setAiLoading(false);
    }
  };

  const analyzePlate = async () => {
    setPlateLoading(true);
    setPlateResult(null);
    try {
      const res = await api.aiPlate(MOCK_IMG, lang);
      setPlateResult(res);
    } catch (e) {
      setPlateResult(null);
    } finally {
      setPlateLoading(false);
    }
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
        showsVerticalScrollIndicator={false}
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

        <Pressable testID="open-plate-ai" onPress={() => setPlateOpen(true)} style={styles.plateBtn}>
          <View style={styles.plateBadge}><Ionicons name="camera" size={16} color={colors.gold} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.plateBtnText}>{t("diet.plate_title")}</Text>
            <Text style={styles.plateBtnSub}>{t("diet.plate_desc")}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.gold} />
        </Pressable>

        <Text style={styles.section}>{t("diet.foods")}</Text>
        {MEALS.map((meal) => {
          const items = diet.foods.filter((f: any) => f.meal === meal.id);
          if (!items.length) return null;
          return (
            <View key={meal.id} style={styles.mealBlock}>
              <View style={styles.mealHead}>
                <Ionicons name={meal.icon} size={16} color={colors.brand} />
                <Text style={styles.mealTitle}>{t(`meal.${meal.id}`)}</Text>
                <Pressable
                  testID={`ai-${meal.id}`}
                  onPress={() => aiSuggest(meal.id, items[0].name)}
                  style={styles.aiChip}
                >
                  <Ionicons name="sparkles" size={12} color={colors.gold} />
                  <Text style={styles.aiChipText}>{t("cta.ai_suggest")}</Text>
                </Pressable>
              </View>
              {items.map((f: any) => (
                <View key={f.id} style={styles.foodCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName}>{f.name}</Text>
                    <Text style={styles.foodMacro}>{f.grams}g · {f.kcal} kcal · P{f.p} C{f.c} G{f.f}</Text>
                  </View>
                  <Pressable testID={`swap-${f.id}`} style={styles.swap}>
                    <Ionicons name="swap-horizontal" size={14} color={colors.brand} />
                    <Text style={styles.swapText}>{t("diet.substitute")}</Text>
                  </Pressable>
                </View>
              ))}
              {aiMeal === meal.id && (aiLoading || aiResult) && (
                <View style={styles.aiPanel}>
                  <View style={styles.aiHead}>
                    <Ionicons name="sparkles" size={14} color={colors.gold} />
                    <Text style={styles.aiHeadText}>{t("diet.ai_title")}</Text>
                    <Pressable testID="close-ai" onPress={() => { setAiMeal(""); setAiResult(null); }}>
                      <Ionicons name="close" size={16} color={colors.textDim} />
                    </Pressable>
                  </View>
                  {aiLoading ? (
                    <ActivityIndicator color={colors.gold} style={{ marginVertical: spacing.md }} />
                  ) : (
                    (aiResult?.suggestions ?? []).map((s: any, i: number) => (
                      <View key={i} style={styles.aiItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.aiName}>{s.name}</Text>
                          <Text style={styles.aiMacro}>{s.grams}g · {s.kcal} kcal · P{s.p} C{s.c} G{s.f}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={plateOpen} transparent animationType="slide" onRequestClose={() => setPlateOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPlateOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t("diet.plate_title")}</Text>
            <Text style={styles.sheetDesc}>{t("diet.plate_desc")}</Text>
            <Pressable testID="upload-plate" onPress={analyzePlate} style={styles.uploadBox} disabled={plateLoading}>
              {plateLoading ? (
                <ActivityIndicator color={colors.gold} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={30} color={colors.gold} />
                  <Text style={styles.uploadText}>{t("diet.plate_upload")}</Text>
                </>
              )}
            </Pressable>
            {plateResult && (
              <View testID="plate-result" style={styles.plateResult}>
                <Text style={styles.plateName}>{plateResult.name}</Text>
                <View style={styles.editableRow}>
                  <EditableField label="kcal" value={plateResult.kcal} onChange={(v) => setPlateResult({ ...plateResult, kcal: v })} />
                  <EditableField label="P" value={plateResult.p} onChange={(v) => setPlateResult({ ...plateResult, p: v })} />
                  <EditableField label="C" value={plateResult.c} onChange={(v) => setPlateResult({ ...plateResult, c: v })} />
                  <EditableField label="G" value={plateResult.f} onChange={(v) => setPlateResult({ ...plateResult, f: v })} />
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function EditableField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.editable}>
      <Text style={styles.editableLabel}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={(s) => onChange(parseInt(s || "0", 10))}
        keyboardType="number-pad"
        style={styles.editableInput}
      />
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
  plateBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md, padding: spacing.md, backgroundColor: "rgba(216,180,106,0.08)", borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(216,180,106,0.35)" },
  plateBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(216,180,106,0.2)", alignItems: "center", justifyContent: "center" },
  plateBtnText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  plateBtnSub: { color: colors.textDim, fontSize: fs.sm, marginTop: 2, lineHeight: 16 },
  mealBlock: { marginBottom: spacing.md },
  mealHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  mealTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "600", flex: 1 },
  aiChip: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(216,180,106,0.12)", borderWidth: 1, borderColor: "rgba(216,180,106,0.35)" },
  aiChipText: { color: colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  foodCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, gap: spacing.md },
  foodName: { color: colors.text, fontSize: fs.lg, fontWeight: "500" },
  foodMacro: { color: colors.textDim, fontSize: fs.sm, marginTop: 4 },
  swap: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,106,42,0.4)", backgroundColor: "rgba(255,106,42,0.08)" },
  swapText: { color: colors.brand, fontSize: fs.sm, fontWeight: "600" },
  aiPanel: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: "rgba(216,180,106,0.35)", marginTop: spacing.sm },
  aiHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  aiHeadText: { color: colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1, flex: 1 },
  aiItem: { flexDirection: "row", alignItems: "center", padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xs },
  aiName: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  aiMacro: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  sheetDesc: { color: colors.textDim, fontSize: fs.base, marginTop: 4, marginBottom: spacing.md },
  uploadBox: { minHeight: 140, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(216,180,106,0.4)", backgroundColor: "rgba(216,180,106,0.05)", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  uploadText: { color: colors.gold, fontSize: fs.lg, fontWeight: "600" },
  plateResult: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  plateName: { color: colors.text, fontSize: fs.lg, fontWeight: "700", marginBottom: spacing.sm },
  editableRow: { flexDirection: "row", gap: spacing.sm },
  editable: { flex: 1, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  editableLabel: { color: colors.textDim, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  editableInput: { color: colors.text, fontSize: fs.lg, fontWeight: "700", textAlign: "center", padding: 0, marginTop: 4, width: "100%" },
});
