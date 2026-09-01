import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function FormChecker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useApp();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    setTimeout(async () => {
      const res = await api.formChecker();
      setResult(res);
      setLoading(false);
    }, 1200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Pressable testID="fc-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color={colors.gold} />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
        <Text style={styles.title}>{t("form.title")}</Text>
        <Text style={styles.sub}>{t("form.desc")}</Text>

        <View style={styles.videoBox}>
          <Ionicons name="videocam-outline" size={40} color={colors.textDim} />
          <Text style={styles.videoText}>Vídeo · placeholder</Text>
        </View>

        <Text style={styles.section}>{t("form.checklist")}</Text>
        <View style={styles.checklist}>
          {[
            "Postura neutra do quadril",
            "Amplitude completa do movimento",
            "Controle da fase excêntrica",
            "Estabilidade do core",
          ].map((c, i) => (
            <View key={i} style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
              <Text style={styles.checkText}>{c}</Text>
            </View>
          ))}
        </View>

        <Pressable
          testID="fc-run"
          onPress={run}
          disabled={loading}
          style={[styles.runBtn, loading && { opacity: 0.6 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Ionicons name="flash" size={18} color={colors.text} />
              <Text style={styles.runText}>{t("form.run")}</Text>
            </>
          )}
        </Pressable>

        {result && (
          <View testID="fc-result" style={styles.resultCard}>
            <Text style={styles.section}>{t("form.result")}</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNum}>{result.score}</Text>
              <View>
                <Text style={styles.scoreLabel}>{t("form.score")}</Text>
                <Text style={styles.verdict}>
                  {lang === "pt" ? result.verdict_pt : result.verdict_en}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {(lang === "pt" ? result.tips_pt : result.tips_en).map((tip: string, i: number) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, marginBottom: spacing.md },
  aiBadge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(216,180,106,0.15)", borderWidth: 1, borderColor: "rgba(216,180,106,0.4)", marginBottom: spacing.sm },
  aiBadgeText: { color: colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: fs.base, marginTop: spacing.sm, lineHeight: 20 },
  videoBox: { height: 200, borderRadius: radius.xl, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginTop: spacing.lg, gap: spacing.sm },
  videoText: { color: colors.textDim, fontSize: fs.base },
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginTop: spacing.lg, marginBottom: spacing.sm },
  checklist: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  checkItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkText: { color: colors.text, fontSize: fs.base, flex: 1 },
  runBtn: { flexDirection: "row", height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.lg },
  runText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  resultCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.gold, marginTop: spacing.lg },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  scoreNum: { color: colors.gold, fontSize: 48, fontWeight: "800", letterSpacing: -1 },
  scoreLabel: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1 },
  verdict: { color: colors.text, fontSize: fs.base, marginTop: 2, flex: 1 },
  tipRow: { flexDirection: "row", gap: spacing.sm },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand, marginTop: 7 },
  tipText: { color: colors.text, fontSize: fs.base, flex: 1, lineHeight: 20 },
});
