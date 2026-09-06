import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Share } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useMemo } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

const GALLERY = [
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=400&q=80",
];

export default function Progress() {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [entries, setEntries] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");

  const load = () => api.progress().then(setEntries).catch(() => {});
  useEffect(load, []);

  const current = entries.length ? entries[entries.length - 1] : null;
  const first = entries.length ? entries[0] : null;
  const delta = current && first ? (current.weight_kg - first.weight_kg).toFixed(1) : "0";

  const { minW, maxW } = useMemo(() => {
    const w = entries.map((e) => e.weight_kg);
    return { minW: Math.min(...w, 0), maxW: Math.max(...w, 100) };
  }, [entries]);

  const add = async () => {
    if (!weight) return;
    await api.addProgress({
      weight_kg: parseFloat(weight),
      waist_cm: waist ? parseFloat(waist) : undefined,
    });
    setWeight(""); setWaist("");
    setModalOpen(false);
    load();
  };

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
        {/* Banner de Conclusão e Compartilhamento */}
        <Pressable onPress={() => setShareOpen(true)} style={styles.shareBanner}>
          <LinearGradient colors={["#E1306C", "#F56040"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Ionicons name="logo-instagram" size={28} color="#FFF" />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.shareBannerTitle}>Treino Concluído! 🔥</Text>
            <Text style={styles.shareBannerSub}>Escolha um template e partilhe no Instagram</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </Pressable>

        <Text style={styles.section}>{t("sec.progress")}</Text>
        <Text style={styles.title}>{t("evo.current")}</Text>

        {current && (
          <View style={styles.currentCard}>
            <View>
              <Text style={styles.bigNum}>{current.weight_kg.toFixed(1)}</Text>
              <Text style={styles.unit}>kg</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.deltaPill}>
                <Ionicons
                  name={parseFloat(delta) <= 0 ? "trending-down" : "trending-up"}
                  size={14}
                  color={parseFloat(delta) <= 0 ? colors.success : colors.error}
                />
                <Text style={{ color: parseFloat(delta) <= 0 ? colors.success : colors.error, fontWeight: "700" }}>
                  {delta} kg
                </Text>
              </View>
              <Text style={styles.deltaLabel}>{current.date}</Text>
            </View>
          </View>
        )}

        <Text style={styles.section}>{t("evo.history")}</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {entries.map((e, i) => {
              const h = ((maxW - e.weight_kg) / (maxW - minW || 1)) * 100;
              return (
                <View key={e.id} style={styles.bar}>
                  <View style={{ height: 90, justifyContent: "flex-end" }}>
                    <View style={{ height: `${100 - h}%`, width: 12, backgroundColor: colors.brand, borderRadius: 6 }} />
                  </View>
                  <Text style={styles.barLabel}>{e.date.slice(5).replace("-", "/")}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable testID="add-weight-btn" onPress={() => setModalOpen(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={18} color={colors.brand} />
          <Text style={styles.addText}>{t("cta.add_weight")}</Text>
        </Pressable>

        <Text style={styles.section}>{t("evo.gallery")}</Text>
        <View style={styles.gallery}>
          {GALLERY.map((url, i) => (
            <View key={i} style={styles.galleryCell}>
              <Image source={url} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal de Progresso (Manutenção de Peso/Cintura) */}
      <Modal transparent visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t("evo.add")}</Text>
            <Text style={styles.label}>{t("evo.current")} (kg)</Text>
            <TextInput testID="weight-input" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="81.5" placeholderTextColor={colors.textDim} style={styles.input} />
            <Text style={styles.label}>Cintura (cm)</Text>
            <TextInput testID="waist-input" value={waist} onChangeText={setWaist} keyboardType="decimal-pad" placeholder="84" placeholderTextColor={colors.textDim} style={styles.input} />
            <Pressable testID="save-progress-btn" onPress={add} style={styles.saveBtn}>
              <Text style={styles.saveText}>{t("cta.save")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Templates do Instagram */}
      <ShareTemplatesModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </View>
  );
}

function ShareTemplatesModal({ open, onClose }: any) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(1);

  const shareToInsta = async () => {
    try {
      await Share.share({
        message: "Treino finalizado na plataforma Vyra! O protocolo não para. 🔥\n\n@rafael.coach #Vyra #Protocolo",
      });
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { justifyContent: "center", backgroundColor: "rgba(0,0,0,0.85)" }]}>
        <View style={[styles.shareContainer, { marginTop: insets.top, marginBottom: insets.bottom }]}>
          
          <View style={styles.shareHeader}>
            <Text style={styles.shareModalTitle}>Escolha o Template</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>

          {/* Carrossel de Templates */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            
            {/* TEMPLATE 1: Minimalista Vyra */}
            <Pressable onPress={() => setSelected(1)} style={[styles.templateWrap, selected === 1 && styles.templateSelected]}>
              <View style={[styles.templateCard, { backgroundColor: "#111" }]}>
                <View style={styles.t1Header}>
                  <Text style={styles.t1Mark}>V Y R A</Text>
                </View>
                <View style={styles.t1Body}>
                  <Text style={styles.t1Title}>TREINO</Text>
                  <Text style={styles.t1Title}>CONCLUÍDO</Text>
                  <View style={styles.t1Divider} />
                  <Text style={styles.t1Sub}>FORÇA & HIPERTROFIA</Text>
                </View>
                <View style={styles.coachFooter}>
                  <Image source="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=100&q=80" style={styles.coachPhoto} />
                  <View>
                    <Text style={styles.coachName}>Coach Rafael</Text>
                    <Text style={styles.coachRole}>Vyra Training</Text>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* TEMPLATE 2: Fundo Imagem */}
            <Pressable onPress={() => setSelected(2)} style={[styles.templateWrap, selected === 2 && styles.templateSelected]}>
              <View style={styles.templateCard}>
                <Image source="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80" style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.8)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.t2Body}>
                  <Ionicons name="checkmark-done-circle" size={48} color={colors.brand} />
                  <Text style={styles.t2Title}>+1 PRA CONTA</Text>
                </View>
                <View style={[styles.coachFooter, { borderTopWidth: 0 }]}>
                  <Image source="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=100&q=80" style={styles.coachPhoto} />
                  <View>
                    <Text style={styles.coachName}>Coach Rafael</Text>
                    <Text style={styles.coachRole}>Vyra Training</Text>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* TEMPLATE 3: Gold Light */}
            <Pressable onPress={() => setSelected(3)} style={[styles.templateWrap, selected === 3 && styles.templateSelected]}>
              <View style={[styles.templateCard, { backgroundColor: "#FAF9F6", borderWidth: 2, borderColor: colors.gold }]}>
                <View style={styles.t3Body}>
                  <Text style={styles.t3Title}>PROTOCOL</Text>
                  <Text style={styles.t3TitleMark}>VYRA</Text>
                  <Text style={styles.t3Sub}>Dia Finalizado com Sucesso.</Text>
                </View>
                <View style={[styles.coachFooter, { borderTopColor: "rgba(0,0,0,0.1)" }]}>
                  <Image source="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=100&q=80" style={styles.coachPhoto} />
                  <View>
                    <Text style={[styles.coachName, { color: "#000" }]}>Coach Rafael</Text>
                    <Text style={[styles.coachRole, { color: "#666" }]}>Head Coach</Text>
                  </View>
                </View>
              </View>
            </Pressable>

          </ScrollView>

          <Pressable onPress={shareToInsta} style={styles.instaBtn}>
            <Ionicons name="logo-instagram" size={20} color="#FFF" />
            <Text style={styles.instaBtnText}>Partilhar no Instagram</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shareBanner: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, overflow: "hidden" },
  shareBannerTitle: { color: "#FFF", fontSize: fs.lg, fontWeight: "800" },
  shareBannerSub: { color: "rgba(255,255,255,0.8)", fontSize: fs.sm, marginTop: 2 },
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", letterSpacing: -0.5 },
  currentCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bigNum: { color: colors.text, fontSize: 48, fontWeight: "800", letterSpacing: -1 },
  unit: { color: colors.textDim, fontSize: fs.base, marginTop: -6 },
  deltaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "rgba(52,199,89,0.1)", borderWidth: 1, borderColor: "rgba(52,199,89,0.3)" },
  deltaLabel: { color: colors.textDim, fontSize: fs.sm, marginTop: 6 },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, height: 160 },
  chartRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", flex: 1, gap: spacing.sm },
  bar: { alignItems: "center" },
  barLabel: { color: colors.textDim, fontSize: 10, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 48, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.brand, marginTop: spacing.md },
  addText: { color: colors.brand, fontSize: fs.lg, fontWeight: "600" },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  galleryCell: { width: "48%", aspectRatio: 1, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { color: colors.text, fontSize: fs.xl, fontWeight: "700", marginBottom: spacing.md },
  label: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg },
  saveBtn: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
  saveText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },

  /* Estilos do Modal de Compartilhamento */
  shareContainer: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.xl, margin: spacing.md, overflow: "hidden" },
  shareHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  shareModalTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "700" },
  templateWrap: { padding: 4, borderRadius: 24, borderWidth: 2, borderColor: "transparent" },
  templateSelected: { borderColor: colors.brand },
  templateCard: { width: 260, height: 420, borderRadius: 20, overflow: "hidden", backgroundColor: colors.surface, position: "relative" },
  
  coachFooter: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: "rgba(0,0,0,0.3)", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  coachPhoto: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.gold },
  coachName: { color: "#FFF", fontSize: fs.sm, fontWeight: "700" },
  coachRole: { color: "rgba(255,255,255,0.7)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },

  t1Header: { alignItems: "center", paddingTop: spacing.xl },
  t1Mark: { color: colors.brand, fontSize: 16, fontWeight: "800", letterSpacing: 6 },
  t1Body: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  t1Title: { color: "#FFF", fontSize: 32, fontWeight: "800", fontStyle: "italic", lineHeight: 34 },
  t1Divider: { height: 2, width: 40, backgroundColor: colors.gold, marginVertical: spacing.md },
  t1Sub: { color: colors.textDim, fontSize: 11, letterSpacing: 2 },

  t2Body: { flex: 1, justifyContent: "center", alignItems: "center" },
  t2Title: { color: "#FFF", fontSize: 28, fontWeight: "900", fontStyle: "italic", marginTop: spacing.sm, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  t3Body: { flex: 1, justifyContent: "center", alignItems: "center" },
  t3Title: { color: "#000", fontSize: 14, letterSpacing: 4, fontWeight: "600" },
  t3TitleMark: { color: colors.gold, fontSize: 42, fontWeight: "900", letterSpacing: -2, marginVertical: spacing.xs },
  t3Sub: { color: "#666", fontSize: fs.sm, fontStyle: "italic" },

  instaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, margin: spacing.lg, height: 56, borderRadius: radius.lg, backgroundColor: "#E1306C" },
  instaBtnText: { color: "#FFF", fontSize: fs.lg, fontWeight: "700" },
});