import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function Training() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [workout, setWorkout] = useState<any>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadWorkout = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await api.todayWorkout();
      setWorkout(data);
    } catch (error: any) {
      console.error("Erro ao carregar treino:", error);
      setErrorMsg("Não foi possível carregar o treino de hoje. Verifique o banco de dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWorkout(); }, [loadWorkout]);
  useFocusEffect(useCallback(() => { loadWorkout(); }, [loadWorkout]));

  const requestSubstitution = (exerciseName: string) => {
    Alert.alert(
      "Substituir Exercício",
      `Deseja solicitar ao Coach uma alternativa para "${exerciseName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Solicitar", onPress: () => console.log("Solicitação enviada") }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={{ color: colors.textDim, marginTop: 16 }}>Buscando seu treino...</Text>
      </View>
    );
  }

  if (errorMsg || !workout) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textDim} />
        <Text style={{ color: colors.textDim, marginTop: 16, textAlign: "center" }}>{errorMsg || "Nenhum treino programado para hoje."}</Text>
        <Pressable onPress={loadWorkout} style={{ marginTop: 24, padding: 12, backgroundColor: colors.surface2, borderRadius: radius.md }}>
          <Text style={{ color: colors.text }}>Tentar Novamente</Text>
        </Pressable>
      </View>
    );
  }

  const total = workout.exercises?.length || 0;
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

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

        <Pressable
          testID="open-form-checker"
          onPress={() => router.push("/form-checker")}
          style={styles.formCta}
        >
          <View style={styles.evalBadge}>
            <Ionicons name="videocam-outline" size={16} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.formCtaText}>Avaliação de Movimento</Text>
            <Text style={styles.formCtaSub}>Grave sua execução</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textDim} />
        </Pressable>

        {workout.coach_note && (
          <View testID="coach-note" style={styles.coachNote}>
            <View style={styles.coachNoteHead}>
              <Ionicons name="megaphone" size={14} color={colors.brand} />
              <Text style={styles.coachNoteTitle}>{t("training.coach_note")}</Text>
            </View>
            <Text style={styles.coachNoteText}>{workout.coach_note}</Text>
          </View>
        )}

        <Text style={styles.section}>{t("training.exercises")}</Text>
        
        {workout.exercises && workout.exercises.map((ex: any, idx: number) => (
          <View key={ex.id || idx} style={[styles.exCard, done[ex.id] && { opacity: 0.55, borderColor: colors.success }]}>
            <View style={styles.exHeader}>
              <View style={styles.exNum}><Text style={{ color: colors.text, fontWeight: "700" }}>{idx + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMuscle}>{ex.muscle}</Text>
              </View>
              <Pressable
                testID={`done-${ex.id}`}
                onPress={() => setDone((s) => ({ ...s, [ex.id]: !s[ex.id] }))}
                style={[styles.checkBtn, done[ex.id] && { backgroundColor: colors.success, borderColor: colors.success }]}
              >
                {done[ex.id] ? <Ionicons name="checkmark" size={16} color={colors.text} /> : <Ionicons name="ellipse-outline" size={16} color={colors.textDim} />}
              </Pressable>
            </View>

            <View style={styles.exMetaRow}>
              <MetaChip icon="repeat" text={`${ex.sets} × ${ex.reps}`} />
              <MetaChip icon="timer-outline" text={`${ex.rest}`} />
              {ex.video_url && (
                <Pressable
                  testID={`video-${ex.id}`}
                  onPress={() => Linking.openURL(ex.video_url)}
                  style={styles.videoChip}
                >
                  <Ionicons name="play-circle" size={14} color={colors.brand} />
                  <Text style={styles.videoChipText}>Ver Execução</Text>
                </Pressable>
              )}
            </View>

            {ex.coach_tip && (
              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={12} color={colors.gold} />
                <Text style={styles.tipBoxText}>{ex.coach_tip}</Text>
              </View>
            )}

            <Pressable onPress={() => requestSubstitution(ex.name)} style={styles.substituteBtn}>
              <Ionicons name="swap-horizontal" size={14} color={colors.textDim} />
              <Text style={styles.substituteText}>Substituir</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 60 + spacing.md }]}>
        <Pressable testID="finish-workout-button" onPress={() => router.push("/(tabs)/progress")} style={styles.finishBtn}>
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
  progressCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg, marginBottom: spacing.md },
  formCta: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  evalBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
  formCtaText: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  formCtaSub: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  coachNote: { flexDirection: "column", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: colors.brand, marginBottom: spacing.md },
  coachNoteHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  coachNoteTitle: { color: colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  coachNoteText: { color: colors.text, fontSize: fs.base, marginTop: 6, lineHeight: 20 },
  exCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  exHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  exNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  exName: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  exMuscle: { color: colors.textDim, fontSize: fs.xs, marginTop: 2 },
  checkBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface2 },
  exMetaRow: { flexDirection: "row", gap: 6, marginTop: spacing.md, flexWrap: "wrap", paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.textDim, fontSize: fs.xs },
  videoChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(255,106,42,0.08)", borderWidth: 1, borderColor: "rgba(255,106,42,0.35)" },
  videoChipText: { color: colors.brand, fontSize: fs.xs, fontWeight: "700" },
  tipBox: { flexDirection: "row", gap: 6, alignItems: "flex-start", padding: spacing.sm, marginTop: spacing.sm, borderRadius: radius.md, backgroundColor: "rgba(216,180,106,0.06)", borderWidth: 1, borderColor: "rgba(216,180,106,0.25)" },
  tipBoxText: { color: colors.text, fontSize: fs.xs, flex: 1, lineHeight: 16 },
  substituteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface2, borderRadius: radius.md },
  substituteText: { color: colors.textDim, fontSize: fs.xs, fontWeight: "600" },
  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  finishBtn: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  finishText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
});