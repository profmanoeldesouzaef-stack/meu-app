import { View, Text, StyleSheet, ScrollView, Pressable, Linking, TextInput, Modal } from "react-native";
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
  const { t, persona } = useApp();
  const [tab, setTab] = useState<"active" | "hall">("active");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [items, setItems] = useState<any[]>([]);
  const [hall, setHall] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const loadActive = () => api.challenges(filter).then(setItems).catch(() => {});
  const loadHall = () => api.hall().then(setHall).catch(() => {});

  useEffect(() => { loadActive(); }, [filter]);
  useEffect(() => { loadHall(); }, []);

  const like = async (id: string) => {
    const res = await api.likeChallenge(id);
    setItems((cur) => cur.map((c) => (c.id === id ? res : c)));
  };

  const closeChallenge = async (id: string) => {
    await api.closeChallenge(id);
    loadActive(); loadHall();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="ch-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("ch.title")}</Text>
          <Text style={styles.sub}>{t("ch.sub")}</Text>
        </View>
      </View>

      <View style={styles.tabsBar}>
        <Pressable testID="tab-active" onPress={() => setTab("active")}
          style={[styles.tabBtn, tab === "active" && styles.tabBtnActive]}>
          <Ionicons name="flame" size={14} color={tab === "active" ? colors.brand : colors.textDim} />
          <Text style={[styles.tabText, tab === "active" && { color: colors.text }]}>{t("sec.active")}</Text>
        </Pressable>
        <Pressable testID="tab-hall" onPress={() => setTab("hall")}
          style={[styles.tabBtn, tab === "hall" && styles.tabBtnActive]}>
          <Ionicons name="trophy" size={14} color={tab === "hall" ? colors.gold : colors.textDim} />
          <Text style={[styles.tabText, tab === "hall" && { color: colors.text }]}>{t("sec.hall")}</Text>
        </Pressable>
      </View>

      {tab === "active" && (
        <View style={styles.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
            {FILTERS.map((f) => (
              <Pressable key={f} testID={`filter-${f}`} onPress={() => setFilter(f)}
                style={[styles.chip, filter === f && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}>
                <Text style={[styles.chipText, filter === f && { color: colors.text }]}>{t(`ch.filter.${f}`)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "active" && (
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
                  <View style={styles.cardActions}>
                    <Pressable testID={`like-${c.id}`} onPress={() => like(c.id)} style={styles.likeRow}>
                      <Ionicons name="heart" size={14} color={colors.brand} />
                      <Text style={styles.likeText}>{c.likes}</Text>
                    </Pressable>
                    <Pressable testID={`vote-${c.id}`} onPress={() => c.vote_url && Linking.openURL(c.vote_url)} style={styles.voteRow}>
                      <Ionicons name="open-outline" size={12} color={colors.gold} />
                      <Text style={styles.voteText}>{t("cta.vote")}</Text>
                    </Pressable>
                  </View>
                  {(persona === "coach" || persona === "moderator") && (
                    <Pressable testID={`close-${c.id}`} onPress={() => closeChallenge(c.id)} style={styles.closeChBtn}>
                      <Ionicons name="trophy-outline" size={12} color={colors.gold} />
                      <Text style={styles.closeChText}>Encerrar</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === "hall" && (
          <View style={{ gap: spacing.md }}>
            {hall.map((h, i) => (
              <View key={h.id} style={styles.hallCard}>
                <View style={styles.medal}>
                  <Text style={styles.medalText}>{i + 1}</Text>
                </View>
                <Image source={h.photo} style={styles.hallPhoto} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hallName}>{h.champion}</Text>
                  <Text style={styles.hallTitle}>{h.title}</Text>
                  <Text style={styles.hallDate}>{h.date} · {h.votes} {t("ch.votes")}</Text>
                </View>
                <Ionicons name="trophy" size={22} color={colors.gold} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {(persona === "coach" || persona === "moderator") ? (
          <Pressable testID="new-challenge-btn" onPress={() => setCreateOpen(true)} style={styles.publish}>
            <Ionicons name="add-circle-outline" size={18} color={colors.text} />
            <Text style={styles.publishText}>{t("cta.new_challenge")}</Text>
          </Pressable>
        ) : (
          <Pressable testID="publish-transformation-btn" style={styles.publish}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
            <Text style={styles.publishText}>{t("cta.publish")}</Text>
          </Pressable>
        )}
      </View>

      <NewChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadActive} />
    </View>
  );
}

function NewChallengeModal({ open, onClose, onCreated }: any) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tag, setTag] = useState("reset12");
  const [weeks, setWeeks] = useState("12");
  const [voteUrl, setVoteUrl] = useState("");
  const create = async () => {
    if (!title || !author) return;
    await api.createChallenge({ title, author, tag, weeks: parseInt(weeks || "12", 10), vote_url: voteUrl });
    setTitle(""); setAuthor(""); setVoteUrl("");
    onCreated();
    onClose();
  };
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{t2("Novo desafio")}</Text>
          <SheetInput label="Título" v={title} on={setTitle} testID="new-ch-title" />
          <SheetInput label="Autor / aluno" v={author} on={setAuthor} testID="new-ch-author" />
          <SheetInput label="Semanas" v={weeks} on={setWeeks} testID="new-ch-weeks" kb="number-pad" />
          <SheetInput label="URL de votação externa" v={voteUrl} on={setVoteUrl} testID="new-ch-vote-url" />
          <Text style={styles.smallLabel}>Categoria</Text>
          <View style={styles.chipRow}>
            {["reset12", "shape", "forge"].map((tg) => (
              <Pressable key={tg} onPress={() => setTag(tg)}
                style={[styles.smallChip, tag === tg && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}>
                <Text style={[styles.smallChipText, tag === tg && { color: colors.text }]}>{tg}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable testID="create-challenge" onPress={create}
            style={{ height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: spacing.lg }}>
            <Text style={{ color: "#F5F5F7", fontSize: fs.lg, fontWeight: "600" }}>Criar desafio</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function t2(s: string) { return s; }

function SheetInput({ label, v, on, testID, kb }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.smallLabel}>{label}</Text>
      <TextInput testID={testID} value={v} onChangeText={on} keyboardType={kb}
        placeholderTextColor={colors.textDim}
        style={{ backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  sub: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  tabsBar: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  tabBtn: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", height: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabBtnActive: { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" },
  tabText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
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
  cardActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  likeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeText: { color: colors.text, fontSize: fs.sm, fontWeight: "600" },
  voteRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(216,180,106,0.35)", backgroundColor: "rgba(216,180,106,0.08)" },
  voteText: { color: colors.gold, fontSize: fs.sm, fontWeight: "700" },
  closeChBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, marginTop: spacing.xs, borderRadius: radius.pill, backgroundColor: "rgba(216,180,106,0.08)", borderWidth: 1, borderColor: "rgba(216,180,106,0.35)", alignSelf: "flex-start" },
  closeChText: { color: colors.gold, fontSize: 10, fontWeight: "700" },
  hallCard: { flexDirection: "row", gap: spacing.md, alignItems: "center", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  medal: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(216,180,106,0.15)", borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  medalText: { color: colors.gold, fontSize: fs.base, fontWeight: "800" },
  hallPhoto: { width: 56, height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  hallName: { color: colors.text, fontSize: fs.lg, fontWeight: "700" },
  hallTitle: { color: colors.gold, fontSize: fs.sm, fontWeight: "600", marginTop: 2 },
  hallDate: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  publish: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  publishText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { color: colors.text, fontSize: fs.xl, fontWeight: "700", marginBottom: spacing.md },
  smallLabel: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  smallChip: { flexShrink: 0, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  smallChipText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
});
