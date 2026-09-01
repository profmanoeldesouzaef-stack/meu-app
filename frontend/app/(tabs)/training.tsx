import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function Training() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [workout, setWorkout] = useState<any>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.todayWorkout().then(setWorkout).catch(() => {});
  }, []);

  if (!workout) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const total = workout.exercises.length;
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing["3xl"] + 60,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Text style={styles.section}>{t("sec.training")}</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.sub}>{workout.focus} · {workout.duration_min} min</Text>

        <View style={styles.progressCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: colors.textDim, fontSize: fs.sm }}>{doneCount}/{total} {t("training.exercises")}</Text>
            <Text style={{ color: colors.brand, fontSize: fs.sm, fontWeight: "700" }}>{pct}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 3 }}>
            <View style={{ height: 6, width: `${pct}%`, backgroundColor: colors.brand, borderRadius: 3 }} />
          </View>
        </View>

        <Text style={styles.section}>{t("training.exercises")}</Text>
        {workout.exercises.map((ex: any, idx: number) => (
          <View key={ex.id} style={[styles.exCard, done[ex.id] && { opacity: 0.55, borderColor: colors.success }]}>
            <View style={styles.exHeader}>
              <View style={styles.exNum}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMuscle}>{ex.muscle}</Text>
              </View>
              <Pressable
                testID={`done-${ex.id}`}
                onPress={() => setDone((s) => ({ ...s, [ex.id]: !s[ex.id] }))}
                style={[styles.checkBtn, done[ex.id] && { backgroundColor: colors.success, borderColor: colors.success }]}
              >
                {done[ex.id] ? (
                  <Ionicons name="checkmark" size={18} color={colors.text} />
                ) : (
                  <Ionicons name="ellipse-outline" size={18} color={colors.textDim} />
                )}
              </Pressable>
            </View>
            <View style={styles.exMeta}>
              <MetaChip icon="repeat" text={`${ex.sets} × ${ex.reps}`} />
              <MetaChip icon="timer-outline" text={`${t("training.rest")} ${ex.rest}`} />
            </View>
          </View>
        ))}

        <Pressable
          testID="open-form-checker"
          onPress={() => router.push("/form-checker")}
          style={styles.formCta}
        >
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={colors.gold} />
          </View>
          <Text style={styles.formCtaText}>{t("cta.analyze")}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.gold} />
        </Pressable>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 60 + spacing.md }]}>
        <Pressable
          testID="finish-workout-button"
          onPress={() => router.push("/(tabs)/progress")}
          style={styles.finishBtn}
        >
          <Text style={styles.finishText}>{t("cta.finish_workout")}</Text>
          <Ionicons name="checkmark-circle" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function MetaChip({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={colors.textDim} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: fs.lg, marginTop: 4 },
  progressCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg },
  exCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  exHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  exNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  exName: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  exMuscle: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  checkBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface2 },
  exMeta: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.textDim, fontSize: fs.sm },
  formCta: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "rgba(216,180,106,0.08)", borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: "rgba(216,180,106,0.35)", marginTop: spacing.md },
  aiBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(216,180,106,0.25)", alignItems: "center", justifyContent: "center" },
  formCtaText: { color: colors.text, fontSize: fs.lg, fontWeight: "600", flex: 1 },
  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  finishBtn: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  finishText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
});
