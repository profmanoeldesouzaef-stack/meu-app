import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

const FILTERS = ["all", "reset12", "shape", "forge"] as const;

export default function Challenges() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [items, setItems] = useState<any[]>([]);

  const load = () => api.challenges(filter).then(setItems).catch(() => {});
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const like = async (id: string) => {
    const res = await api.likeChallenge(id);
    setItems((cur) => cur.map((c) => (c.id === id ? res : c)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="ch-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("ch.title")}</Text>
          <Text style={styles.sub}>{t("ch.sub")}</Text>
        </View>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              testID={`filter-${f}`}
              onPress={() => setFilter(f)}
              style={[
                styles.chip,
                filter === f && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" },
              ]}
            >
              <Text style={[styles.chipText, filter === f && { color: colors.text }]}>{t(`ch.filter.${f}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
        }}
      >
        <View style={styles.grid}>
          {items.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.beforeAfter}>
                <Image source={c.before_image} style={styles.beforeImg} contentFit="cover" />
                <Image source={c.after_image} style={styles.afterImg} contentFit="cover" />
                <View style={styles.divider} />
                <View style={[styles.abLabel, { left: 6 }]}><Text style={styles.abText}>B</Text></View>
                <View style={[styles.abLabel, { right: 6 }]}><Text style={styles.abText}>A</Text></View>
              </View>
              <View style={{ padding: spacing.sm }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                <Text style={styles.cardAuthor}>{c.author} · {c.weeks} {t("ch.weeks")}</Text>
                <Pressable testID={`like-${c.id}`} onPress={() => like(c.id)} style={styles.likeRow}>
                  <Ionicons name="heart" size={14} color={colors.brand} />
                  <Text style={styles.likeText}>{c.likes}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="publish-transformation-btn" style={styles.publish}>
          <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
          <Text style={styles.publishText}>{t("cta.publish")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  sub: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  filterWrap: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  chip: { flexShrink: 0, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  chipText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: "48%", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  beforeAfter: { height: 160, flexDirection: "row" },
  beforeImg: { flex: 1, height: "100%" },
  afterImg: { flex: 1, height: "100%" },
  divider: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1.5, backgroundColor: colors.brand, marginLeft: -0.75 },
  abLabel: { position: "absolute", top: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(10,10,10,0.7)", alignItems: "center", justifyContent: "center" },
  abText: { color: colors.text, fontSize: 10, fontWeight: "800" },
  cardTitle: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  cardAuthor: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  likeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  likeText: { color: colors.text, fontSize: fs.sm, fontWeight: "600" },
  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  publish: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  publishText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
});
