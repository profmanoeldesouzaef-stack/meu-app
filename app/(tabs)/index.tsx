import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Animated, Share } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

const WEEK_PT = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEK_EN = ["M", "T", "W", "T", "F", "S", "S"];
// Todos os dias marcados como "true" para ativar a animação do troféu e o botão do Instagram
const DONE = [true, true, true, true, true, true, true]; 

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang, subscription } = useApp();
  const [diet, setDiet] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [waterDrunk, setWaterDrunk] = useState(0);
  
  // Animação do troféu
  const [trophyScale] = useState(new Animated.Value(1));
  const isWeekDone = DONE.every(Boolean);

  const loadAll = useCallback(() => {
    api.diet().then(setDiet).catch(() => {});
    api.progress().then(setProgress).catch(() => {});
    api.profile().then(setProfile).catch(() => {});
    api.broadcasts().then(setBroadcasts).catch(() => {});
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  useEffect(() => {
    if (isWeekDone) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(trophyScale, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(trophyScale, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    }
  }, [isWeekDone, trophyScale]);

  const shareToInstagram = async () => {
    try {
      await Share.share({
        message: "Mais uma semana de treino concluída e metas batidas no Vyra! 🏆🔥 \n\n#Foco #Constancia #Vyra",
      });
    } catch (error) {
      console.log("Erro ao partilhar:", error);
    }
  };

  const week = lang === "pt" ? WEEK_PT : WEEK_EN;
  const current = progress[progress.length - 1];
  const first = progress[0];
  const delta = current && first ? (current.weight_kg - first.weight_kg).toFixed(1) : "0";
  const waterTarget = profile?.water_ml ?? 2500;
  const waterPct = Math.min(100, Math.round((waterDrunk / waterTarget) * 100));
  const latestBroadcast = broadcasts[0];

  // Lógica do Ciclo de 20 Dias
  const calculateCycle = () => {
    // Simulando que o aluno fez o último upload há 21 dias (para forçar a tela de Vencido)
    const daysSinceUpload = 21; 
    const daysLeft = 20 - daysSinceUpload;
    const isCycleExpired = daysLeft <= 0;
    return { daysLeft, isCycleExpired };
  };
  const { daysLeft, isCycleExpired } = calculateCycle();

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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hi}>{t("sec.hi")},</Text>
            <Text style={styles.name}>{profile?.nickname ?? "Rafael"}</Text>
          </View>
          <Pressable testID="header-notifications" style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        {latestBroadcast && (
          <View testID="coach-broadcast" style={styles.broadcast}>
            <View style={styles.broadcastIcon}>
              <Ionicons name="megaphone" size={16} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.broadcastTag}>{t("sec.coach_message").toUpperCase()} · {latestBroadcast.author}</Text>
              <Text style={styles.broadcastText}>{latestBroadcast.text}</Text>
            </View>
          </View>
        )}

        {!subscription.active && (
          <Pressable testID="upsell-card" onPress={() => router.push("/paywall")} style={styles.upsell}>
            <View style={{ flex: 1 }}>
              <Text style={styles.upsellTag}>PREMIUM</Text>
              <Text style={styles.upsellTitle}>{t("cta.premium")}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.gold} />
          </Pressable>
        )}

        {/* CICLO DE 20 DIAS */}
        <View style={styles.cycleCard}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera-outline" size={26} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={[styles.cycleTag, isCycleExpired ? styles.cycleTagExpired : styles.cycleTagActive]}>
                  <Text style={[styles.cycleTagText, isCycleExpired ? { color: '#FF4D4D' } : { color: colors.brand }]}>
                    {isCycleExpired ? "CICLO DE 20 DIAS VENCIDO" : `FALTAM ${daysLeft} DIAS`}
                  </Text>
                </View>
                <Text style={{ color: colors.textDim, fontSize: 10, textAlign: 'right', fontWeight: "600" }}>Perimetria &{"\n"}Fotos</Text>
              </View>
              <Text style={styles.cycleTitle}>
                {isCycleExpired ? "Hora de enviar novas fotos e medidas de perimetria para o Coach!" : "Mantenha o foco, seu próximo envio está chegando."}
              </Text>
              <Text style={styles.cycleDesc}>A cada 20 dias ajustamos seu volume de treino e macronutrientes com base na sua evolução.</Text>
              
              {isCycleExpired && (
                <Pressable style={styles.cycleBtn} onPress={() => router.push("/(tabs)/progress")}>
                  <Text style={styles.cycleBtnText}>Atualizar Agora</Text>
                  <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.9)" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* PROGRESSO DA SEMANA */}
        <Text style={styles.section}>PROGRESSO DA SEMANA</Text>
        <View style={styles.weekRow}>
          {week.map((d, i) => (
            <View key={i} style={styles.dayItem}>
              <View style={[styles.dayCircle, DONE[i] && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                {DONE[i] && <Ionicons name="checkmark" size={14} color={colors.text} />}
              </View>
              <Text style={styles.dayLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* ANIMAÇÃO TROFÉU & INSTAGRAM */}
        {isWeekDone && (
          <Animated.View style={{ transform: [{ scale: trophyScale }], marginTop: spacing.md, alignItems: "center" }}>
            <Pressable onPress={shareToInstagram} style={styles.trophyShareBtn}>
              <Ionicons name="trophy" size={20} color={colors.gold} />
              <Text style={styles.trophyShareText}>Semana Concluída! Partilhar</Text>
              <Ionicons name="logo-instagram" size={18} color={colors.text} />
            </Pressable>
          </Animated.View>
        )}

        {/* MACROS DA DIETA */}
        <Text style={styles.section}>{t("sec.macros")}</Text>
        {diet && (
          <View style={styles.macroCard}>
            <View style={styles.macroHeader}>
              <View><Text style={styles.kcal}>{diet.kcal}</Text><Text style={styles.kcalLabel}>kcal</Text></View>
              <View style={{ flex: 1, marginLeft: spacing.lg, gap: spacing.sm }}>
                <MacroBar label={t("diet.protein")} pct={diet.protein_pct} color={colors.brand} />
                <MacroBar label={t("diet.carbs")} pct={diet.carbs_pct} color={colors.gold} />
                <MacroBar label={t("diet.fats")} pct={diet.fats_pct} color={colors.blue} />
              </View>
            </View>
          </View>
        )}

        {/* EVOLUÇÃO GRÁFICA */}
        <Text style={styles.section}>{t("sec.evolution")}</Text>
        <Pressable testID="evolution-home" onPress={() => router.push("/(tabs)/progress")} style={styles.evoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.evoValue}>{current?.weight_kg?.toFixed(1) ?? "-"} <Text style={{ fontSize: fs.sm, color: colors.textDim, fontWeight: "500" }}>kg</Text></Text>
            <Text style={styles.evoDelta}>Δ {delta} kg desde o início</Text>
          </View>
          <View style={styles.evoSpark}>
            {progress.slice(-6).map((e, i) => {
              const min = Math.min(...progress.map((p) => p.weight_kg));
              const max = Math.max(...progress.map((p) => p.weight_kg));
              const h = ((max - e.weight_kg) / (max - min || 1)) * 100;
              return <View key={i} style={{ width: 6, height: 100 - h, backgroundColor: colors.brand, borderRadius: 3 }} />;
            })}
          </View>
        </Pressable>

        {/* METAS DIÁRIAS E LEMBRETES */}
        <Text style={styles.section}>{t("sec.reminders")}</Text>
        <View style={styles.reminderCard}>
          <View style={styles.reminderHead}>
            <Ionicons name="water" size={18} color={colors.blue} />
            <Text style={styles.reminderTitle}>{t("sec.water")}</Text>
            <Text style={styles.reminderQty}>{waterDrunk} / {waterTarget} ml</Text>
          </View>
          <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 3, marginTop: 8 }}>
            <View style={{ height: 6, width: `${waterPct}%`, backgroundColor: colors.blue, borderRadius: 3 }} />
          </View>
          <View style={styles.waterBtns}>
            {[250, 500, 750].map((v) => (
              <Pressable
                key={v}
                testID={`water-plus-${v}`}
                onPress={() => setWaterDrunk((c) => Math.min(waterTarget, c + v))}
                style={styles.waterBtn}
              >
                <Text style={styles.waterBtnText}>+{v} ml</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.reminderCard, { marginTop: spacing.sm }]}>
          <View style={styles.reminderHead}>
            <Ionicons name="fitness" size={18} color={colors.gold} />
            <Text style={styles.reminderTitle}>{t("sec.creatine")}</Text>
            <Text style={styles.reminderQty}>{profile?.creatine_g ?? 5}g</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" }}>
            {(profile?.creatine_times ?? []).map((tm: string) => (
              <View key={tm} style={styles.timeChip}>
                <Ionicons name="alarm-outline" size={12} color={colors.gold} />
                <Text style={styles.timeText}>{tm}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function MacroBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: colors.textDim, fontSize: fs.sm }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: fs.sm, fontWeight: "600" }}>{pct}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 3, marginTop: 4 }}>
        <View style={{ height: 6, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  hi: { color: colors.textDim, fontSize: fs.lg },
  name: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  broadcast: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: "rgba(216,180,106,0.08)", borderWidth: 1, borderColor: "rgba(216,180,106,0.3)", marginBottom: spacing.md, alignItems: "flex-start" },
  broadcastIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(216,180,106,0.15)", alignItems: "center", justifyContent: "center" },
  broadcastTag: { color: colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  broadcastText: { color: colors.text, fontSize: fs.base, marginTop: 4, lineHeight: 20 },
  upsell: { flexDirection: "row", alignItems: "center", padding: spacing.lg, backgroundColor: "rgba(216,180,106,0.08)", borderRadius: radius.xl, borderWidth: 1, borderColor: "rgba(216,180,106,0.3)", marginBottom: spacing.lg },
  upsellTag: { color: colors.gold, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  upsellTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "600", marginTop: 2 },
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginTop: spacing.xl, marginBottom: spacing.md },
  
  // Estilos do novo Ciclo de 20 Dias
  cycleCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: "rgba(255,106,42,0.2)", marginTop: spacing.md },
  cameraIconBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,106,42,0.12)", alignItems: "center", justifyContent: "center" },
  cycleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  cycleTagExpired: { backgroundColor: "rgba(255,77,77,0.1)", borderColor: "rgba(255,77,77,0.3)" },
  cycleTagActive: { backgroundColor: "rgba(255,106,42,0.1)", borderColor: "rgba(255,106,42,0.3)" },
  cycleTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  cycleTitle: { color: colors.text, fontSize: fs.base, fontWeight: "700", lineHeight: 22, marginTop: 4 },
  cycleDesc: { color: colors.textDim, fontSize: fs.xs, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  cycleBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, backgroundColor: "#B34A1F", paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.lg },
  cycleBtnText: { color: "rgba(255,255,255,0.9)", fontSize: fs.sm, fontWeight: "700" },

  weekRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  dayItem: { alignItems: "center", gap: 6 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  dayLabel: { color: colors.textDim, fontSize: 11 },
  
  // Estilo do botão de Troféu do Instagram
  trophyShareBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "rgba(216,180,106,0.15)", paddingHorizontal: spacing.xl, paddingVertical: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(216,180,106,0.4)" },
  trophyShareText: { color: colors.gold, fontSize: fs.sm, fontWeight: "700" },

  macroCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  macroHeader: { flexDirection: "row", alignItems: "center" },
  kcal: { color: colors.text, fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  kcalLabel: { color: colors.textDim, fontSize: fs.sm, textAlign: "center" },
  evoCard: { flexDirection: "row", alignItems: "center", padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  evoValue: { color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -1 },
  evoDelta: { color: colors.success, fontSize: fs.sm, fontWeight: "600", marginTop: 4 },
  evoSpark: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 100 },
  reminderCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  reminderHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  reminderTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "600", flex: 1 },
  reminderQty: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  waterBtns: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  waterBtn: { flex: 1, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(109,155,255,0.35)", backgroundColor: "rgba(109,155,255,0.08)", alignItems: "center", justifyContent: "center" },
  waterBtnText: { color: colors.blue, fontSize: fs.sm, fontWeight: "700" },
  timeChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(216,180,106,0.12)", borderWidth: 1, borderColor: "rgba(216,180,106,0.35)" },
  timeText: { color: colors.gold, fontSize: fs.sm, fontWeight: "600" },
});