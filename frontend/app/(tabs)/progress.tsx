import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from "react-native";
import { Image } from "expo-image";
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
      >
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

        <Pressable
          testID="add-weight-btn"
          onPress={() => setModalOpen(true)}
          style={styles.addBtn}
        >
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

      <Modal transparent visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t("evo.add")}</Text>
            <Text style={styles.label}>{t("evo.current")} (kg)</Text>
            <TextInput
              testID="weight-input"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="81.5"
              placeholderTextColor={colors.textDim}
              style={styles.input}
            />
            <Text style={styles.label}>Cintura (cm)</Text>
            <TextInput
              testID="waist-input"
              value={waist}
              onChangeText={setWaist}
              keyboardType="decimal-pad"
              placeholder="84"
              placeholderTextColor={colors.textDim}
              style={styles.input}
            />
            <Pressable testID="save-progress-btn" onPress={add} style={styles.saveBtn}>
              <Text style={styles.saveText}>{t("cta.save")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
