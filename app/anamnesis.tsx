import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function Anamnesis() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, setAnamnesisDone } = useApp();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [activity, setActivity] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medical, setMedical] = useState("");
  const [saved, setSaved] = useState(false);

  const canSave = age && gender && height && weight && goal && activity;

  const save = async () => {
    if (!canSave) return;
    await api.saveAnamnesis({
      age: parseInt(age, 10),
      gender,
      height_cm: parseInt(height, 10),
      weight_kg: parseFloat(weight),
      goal,
      activity_level: activity,
      restrictions,
      allergies,
      medical_notes: medical || undefined,
    });
    setAnamnesisDone(true);
    setSaved(true);
    setTimeout(() => router.replace("/paywall"), 700);
  };

  const goals = ["emagrecer", "hipertrofia", "recomposicao", "performance"];
  const activities = ["sedentario", "leve", "moderado", "intenso"];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headBadge}>
          <Ionicons name="clipboard-outline" size={14} color={colors.gold} />
          <Text style={styles.headBadgeText}>PASSO 1 · REQUISITO</Text>
        </View>
        <Text style={styles.title}>{t("ana.title")}</Text>
        <Text style={styles.sub}>{t("ana.desc")}</Text>

        <View style={styles.grid}>
          <Field label={t("ana.age")} value={age} onChange={setAge} keyboardType="number-pad" testID="ana-age" half />
          <Field label={t("ana.gender")} value={gender} onChange={setGender} testID="ana-gender" half />
          <Field label={t("ana.height")} value={height} onChange={setHeight} keyboardType="number-pad" testID="ana-height" half />
          <Field label={t("ana.weight")} value={weight} onChange={setWeight} keyboardType="decimal-pad" testID="ana-weight" half />
        </View>

        <Text style={styles.label}>{t("ana.goal")}</Text>
        <View style={styles.chips}>
          {goals.map((g) => (
            <Pressable
              key={g}
              testID={`goal-${g}`}
              onPress={() => setGoal(g)}
              style={[styles.chip, goal === g && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}
            >
              <Text style={[styles.chipText, goal === g && { color: colors.text }]}>{g}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t("ana.activity")}</Text>
        <View style={styles.chips}>
          {activities.map((a) => (
            <Pressable
              key={a}
              testID={`activity-${a}`}
              onPress={() => setActivity(a)}
              style={[styles.chip, activity === a && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}
            >
              <Text style={[styles.chipText, activity === a && { color: colors.text }]}>{a}</Text>
            </Pressable>
          ))}
        </View>

        <Field label={t("ana.restrictions")} value={restrictions} onChange={setRestrictions} testID="ana-restrictions" multi />
        <Field label={t("ana.allergies")} value={allergies} onChange={setAllergies} testID="ana-allergies" multi />
        <Field label={t("ana.medical")} value={medical} onChange={setMedical} testID="ana-medical" multi />

        <Text style={styles.label}>{t("ana.photos")}</Text>
        <View style={styles.photoRow}>
          {["front", "side", "back"].map((k) => (
            <View key={k} style={styles.photoCell}>
              <Ionicons name="camera-outline" size={22} color={colors.textDim} />
              <Text style={styles.photoLabel}>{t(`ana.${k}`)}</Text>
            </View>
          ))}
        </View>

        {saved && (
          <View testID="ana-saved" style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.savedText}>{t("ana.done")}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          testID="save-anamnesis"
          onPress={save}
          disabled={!canSave}
          style={({ pressed }) => [styles.cta, { opacity: !canSave ? 0.5 : pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.ctaText}>{t("cta.save")}</Text>
          <Ionicons name="arrow-forward" size={18} color="#F5F5F7" />
        </Pressable>
      </View>
    </View>
  );
}

function Field({ label, value, onChange, testID, keyboardType, multi, half }: any) {
  return (
    <View style={{ flexBasis: half ? "48%" : "100%", marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multi}
        style={[styles.input, multi && { minHeight: 68, textAlignVertical: "top", paddingVertical: 12 }]}
        placeholderTextColor={colors.textDim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headBadge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(216,180,106,0.12)", borderWidth: 1, borderColor: "rgba(216,180,106,0.4)" },
  headBadgeText: { color: colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", marginTop: spacing.md, letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: fs.lg, marginTop: spacing.sm, marginBottom: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  label: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: spacing.sm },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: { flexShrink: 0, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  chipText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600", textTransform: "capitalize" },
  photoRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  photoCell: { flex: 1, aspectRatio: 0.8, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 6 },
  photoLabel: { color: colors.textDim, fontSize: fs.sm, textAlign: "center" },
  savedBanner: { flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", padding: spacing.md, borderRadius: radius.lg, backgroundColor: "rgba(52,199,89,0.1)", borderWidth: 1, borderColor: "rgba(52,199,89,0.3)", marginTop: spacing.md },
  savedText: { color: colors.success, fontSize: fs.base, fontWeight: "600" },
  stickyBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  ctaText: { color: "#F5F5F7", fontSize: fs.lg, fontWeight: "600" },
});
