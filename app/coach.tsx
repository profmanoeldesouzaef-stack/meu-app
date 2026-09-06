import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

type Tab = "overview" | "finance" | "workouts" | "diet" | "challenges" | "broadcast" | "radar";
const TABS: { id: Tab; icon: any; k: string }[] = [
  { id: "overview", icon: "grid-outline", k: "coach.overview" },
  { id: "finance", icon: "wallet-outline", k: "coach.finance" },
  { id: "workouts", icon: "barbell-outline", k: "coach.workouts" },
  { id: "diet", icon: "restaurant-outline", k: "coach.diet" },
  { id: "challenges", icon: "trophy-outline", k: "coach.challenges" },
  { id: "broadcast", icon: "megaphone-outline", k: "coach.broadcast" },
  { id: "radar", icon: "pulse-outline", k: "coach.radar" },
];

export default function CoachDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [kpis, setKpis] = useState<any[]>([]);
  const [radar, setRadar] = useState<any[]>([]);

  useEffect(() => {
    api.kpis().then(setKpis).catch(() => {});
    api.radar().then(setRadar).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="coach-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("coach.title")}</Text>
          <Text style={styles.sub}>Coach console · full control</Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
          {TABS.map((tb) => (
            <Pressable key={tb.id} testID={`coach-tab-${tb.id}`} onPress={() => setTab(tb.id)}
              style={[styles.tabChip, tab === tb.id && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}>
              <Ionicons name={tb.icon} size={14} color={tab === tb.id ? colors.brand : colors.textDim} />
              <Text style={[styles.tabText, tab === tb.id && { color: colors.text }]}>{t(tb.k)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "overview" && (
          <View style={styles.grid}>
            {kpis.map((k, i) => (
              <View key={i} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{lang === "pt" ? k.label_pt : k.label_en}</Text>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <View style={styles.deltaRow}>
                  <Ionicons name="trending-up" size={12} color={colors.success} />
                  <Text style={styles.deltaText}>{k.delta}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === "finance" && <FinanceTab />}
        {tab === "workouts" && <WorkoutEditor />}
        {tab === "diet" && <DietEditor />}
        {tab === "challenges" && <ChallengesEditor />}
        {tab === "broadcast" && <BroadcastEditor />}
        {tab === "radar" && (
          <View>
            <Text style={styles.sectionLabel}>{t("coach.alerts")}</Text>
            {radar.map((a) => (
              <View key={a.id} style={[styles.alertCard, a.severity === "crit" && { borderColor: colors.error }, a.severity === "warn" && { borderColor: colors.gold }]}>
                <View style={[styles.alertDot, { backgroundColor: a.severity === "crit" ? colors.error : a.severity === "warn" ? colors.gold : colors.blue }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertName}>{a.student}</Text>
                  <Text style={styles.alertStatus}>{a.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FinanceTab() {
  const { t } = useApp();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [pct, setPct] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");

  const load = () => {
    api.coupons().then(setCoupons).catch(() => {});
    api.partners().then(setPartners).catch(() => {});
  };
  useEffect(load, []);

  const addCoupon = async () => {
    if (!code || !pct) return;
    await api.createCoupon({ code: code.toUpperCase(), pct: parseInt(pct, 10) });
    setCode(""); setPct(""); load();
  };
  const addPartner = async () => {
    if (!partnerEmail) return;
    await api.createPartner(partnerEmail);
    setPartnerEmail(""); load();
  };

  return (
    <View>
      <SectionCard icon="pricetag" title={t("coach.new_coupon")}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TextInput testID="new-coupon-code" value={code} onChangeText={setCode} autoCapitalize="characters"
            placeholder="VYRA20" placeholderTextColor={colors.textDim} style={[styles.input, { flex: 2 }]} />
          <TextInput testID="new-coupon-pct" value={pct} onChangeText={setPct} keyboardType="number-pad"
            placeholder="20" placeholderTextColor={colors.textDim} style={[styles.input, { flex: 1 }]} />
          <Pressable testID="save-coupon" onPress={addCoupon} style={styles.iconAdd}>
            <Ionicons name="add" size={20} color="#F5F5F7" />
          </Pressable>
        </View>
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          {coupons.map((c) => (
            <View key={c.id} style={[styles.listRow, !c.active && { opacity: 0.5 }]}>
              <View style={[styles.statusDot, { backgroundColor: c.active ? colors.success : colors.textDim }]} />
              <Text style={styles.listCode}>{c.code}</Text>
              <Text style={styles.listPct}>-{c.pct}%</Text>
              <Pressable testID={`toggle-coupon-${c.id}`} onPress={() => api.toggleCoupon(c.id).then(load)}
                style={[styles.toggleBtn, !c.active && { borderColor: colors.success, backgroundColor: "rgba(52,199,89,0.1)" }]}>
                <Text style={{ color: c.active ? colors.error : colors.success, fontSize: fs.sm, fontWeight: "700" }}>
                  {c.active ? t("coach.disable") : t("coach.enable")}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard icon="briefcase" title={t("coach.partners")}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TextInput testID="partner-email" value={partnerEmail} onChangeText={setPartnerEmail} autoCapitalize="none"
            keyboardType="email-address" placeholder="parceiro@empresa.com" placeholderTextColor={colors.textDim}
            style={[styles.input, { flex: 1 }]} />
          <Pressable testID="save-partner" onPress={addPartner} style={styles.iconAdd}>
            <Ionicons name="add" size={20} color="#F5F5F7" />
          </Pressable>
        </View>
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          {partners.map((p) => (
            <View key={p.id} style={[styles.listRow, !p.active && { opacity: 0.5 }]}>
              <View style={[styles.statusDot, { backgroundColor: p.active ? colors.success : colors.textDim }]} />
              <Text style={[styles.listCode, { flex: 1 }]}>{p.email}</Text>
              <Pressable testID={`toggle-partner-${p.id}`} onPress={() => api.togglePartner(p.id).then(load)}
                style={[styles.toggleBtn, !p.active && { borderColor: colors.success, backgroundColor: "rgba(52,199,89,0.1)" }]}>
                <Text style={{ color: p.active ? colors.error : colors.success, fontSize: fs.sm, fontWeight: "700" }}>
                  {p.active ? t("coach.disable") : t("coach.enable")}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

function WorkoutEditor() {
  const { t } = useApp();
  const [workout, setWorkout] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api.todayWorkout().then(setWorkout); }, []);
  if (!workout) return null;
  const save = async () => {
    const w = await api.updateWorkout({
      title: workout.title, focus: workout.focus,
      duration_min: parseInt(String(workout.duration_min), 10),
      coach_note: workout.coach_note,
      exercises: workout.exercises,
    });
    setWorkout(w); setSaved(true); setTimeout(() => setSaved(false), 1500);
  };
  const set = (k: string, v: any) => setWorkout({ ...workout, [k]: v });
  const setEx = (i: number, k: string, v: any) => {
    const list = [...workout.exercises]; list[i] = { ...list[i], [k]: v };
    setWorkout({ ...workout, exercises: list });
  };
  return (
    <View>
      <SectionCard icon="barbell" title={t("coach.new_workout")}>
        <FieldRow label="Título" v={workout.title} on={(v: string) => set("title", v)} testID="wk-title" />
        <FieldRow label="Foco" v={workout.focus} on={(v: string) => set("focus", v)} testID="wk-focus" />
        <FieldRow label="Duração (min)" v={String(workout.duration_min)} on={(v: string) => set("duration_min", v)} kb="number-pad" testID="wk-duration" />
        <FieldRow label="Nota do coach" v={workout.coach_note} on={(v: string) => set("coach_note", v)} multi testID="wk-note" />
      </SectionCard>

      <SectionCard icon="list" title="Exercícios">
        {workout.exercises.map((ex: any, i: number) => (
          <View key={ex.id} style={styles.exEditor}>
            <Text style={styles.exEditNum}>Exercício {i + 1}</Text>
            <FieldRow label="Nome" v={ex.name} on={(v: string) => setEx(i, "name", v)} testID={`wk-ex-name-${i}`} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}><FieldRow label="Séries" v={String(ex.sets)} on={(v: string) => setEx(i, "sets", parseInt(v || "0", 10))} kb="number-pad" testID={`wk-ex-sets-${i}`} /></View>
              <View style={{ flex: 1 }}><FieldRow label="Reps" v={ex.reps} on={(v: string) => setEx(i, "reps", v)} testID={`wk-ex-reps-${i}`} /></View>
              <View style={{ flex: 1 }}><FieldRow label="Descanso" v={ex.rest} on={(v: string) => setEx(i, "rest", v)} testID={`wk-ex-rest-${i}`} /></View>
            </View>
            <FieldRow label="Dica do coach" v={ex.coach_tip} on={(v: string) => setEx(i, "coach_tip", v)} multi testID={`wk-ex-tip-${i}`} />
            <FieldRow label="URL do vídeo" v={ex.video_url} on={(v: string) => setEx(i, "video_url", v)} testID={`wk-ex-video-${i}`} />
          </View>
        ))}
      </SectionCard>

      <Pressable testID="save-workout" onPress={save} style={styles.saveBtn}>
        <Ionicons name="save" size={16} color="#F5F5F7" />
        <Text style={styles.saveText}>{saved ? "Salvo ✔" : "Salvar treino"}</Text>
      </Pressable>
    </View>
  );
}

function DietEditor() {
  const { t } = useApp();
  const [diet, setDiet] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api.diet().then(setDiet); }, []);
  if (!diet) return null;
  const save = async () => {
    const d = await api.updateDiet({
      kcal: parseInt(String(diet.kcal), 10),
      protein_pct: parseInt(String(diet.protein_pct), 10),
      carbs_pct: parseInt(String(diet.carbs_pct), 10),
      fats_pct: parseInt(String(diet.fats_pct), 10),
      foods: diet.foods,
    });
    setDiet(d); setSaved(true); setTimeout(() => setSaved(false), 1500);
  };
  const set = (k: string, v: any) => setDiet({ ...diet, [k]: v });
  const setFood = (i: number, k: string, v: any) => {
    const list = [...diet.foods]; list[i] = { ...list[i], [k]: v };
    setDiet({ ...diet, foods: list });
  };
  return (
    <View>
      <SectionCard icon="calculator" title={t("coach.edit_diet")}>
        <FieldRow label="Calorias" v={String(diet.kcal)} on={(v: string) => set("kcal", parseInt(v || "0", 10))} kb="number-pad" testID="dt-kcal" />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}><FieldRow label="P %" v={String(diet.protein_pct)} on={(v: string) => set("protein_pct", parseInt(v || "0", 10))} kb="number-pad" testID="dt-p" /></View>
          <View style={{ flex: 1 }}><FieldRow label="C %" v={String(diet.carbs_pct)} on={(v: string) => set("carbs_pct", parseInt(v || "0", 10))} kb="number-pad" testID="dt-c" /></View>
          <View style={{ flex: 1 }}><FieldRow label="G %" v={String(diet.fats_pct)} on={(v: string) => set("fats_pct", parseInt(v || "0", 10))} kb="number-pad" testID="dt-f" /></View>
        </View>
      </SectionCard>

      <SectionCard icon="fast-food" title="Alimentos">
        {diet.foods.map((f: any, i: number) => (
          <View key={f.id} style={styles.exEditor}>
            <FieldRow label={`Refeição · ${f.meal}`} v={f.name} on={(v: string) => setFood(i, "name", v)} testID={`dt-food-name-${i}`} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}><FieldRow label="g" v={String(f.grams)} on={(v: string) => setFood(i, "grams", parseInt(v || "0", 10))} kb="number-pad" testID={`dt-food-g-${i}`} /></View>
              <View style={{ flex: 1 }}><FieldRow label="kcal" v={String(f.kcal)} on={(v: string) => setFood(i, "kcal", parseInt(v || "0", 10))} kb="number-pad" testID={`dt-food-k-${i}`} /></View>
              <View style={{ flex: 1 }}><FieldRow label="P" v={String(f.p)} on={(v: string) => setFood(i, "p", parseInt(v || "0", 10))} kb="number-pad" testID={`dt-food-p-${i}`} /></View>
              <View style={{ flex: 1 }}><FieldRow label="C" v={String(f.c)} on={(v: string) => setFood(i, "c", parseInt(v || "0", 10))} kb="number-pad" testID={`dt-food-c-${i}`} /></View>
              <View style={{ flex: 1 }}><FieldRow label="G" v={String(f.f)} on={(v: string) => setFood(i, "f", parseInt(v || "0", 10))} kb="number-pad" testID={`dt-food-fat-${i}`} /></View>
            </View>
          </View>
        ))}
      </SectionCard>

      <Pressable testID="save-diet" onPress={save} style={styles.saveBtn}>
        <Ionicons name="save" size={16} color="#F5F5F7" />
        <Text style={styles.saveText}>{saved ? "Salvo ✔" : "Salvar dieta"}</Text>
      </Pressable>
    </View>
  );
}

function ChallengesEditor() {
  const { t } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tag, setTag] = useState("reset12");
  const [weeks, setWeeks] = useState("12");
  const [voteUrl, setVoteUrl] = useState("");

  const load = () => api.challenges("all").then(setItems).catch(() => {});
  useEffect(load, []);

  const create = async () => {
    if (!title || !author) return;
    await api.createChallenge({ title, author, tag, weeks: parseInt(weeks || "12", 10), vote_url: voteUrl });
    setTitle(""); setAuthor(""); setVoteUrl(""); load();
  };
  const close = async (id: string) => { await api.closeChallenge(id); load(); };

  return (
    <View>
      <SectionCard icon="trophy" title={t("coach.new_challenge")}>
        <FieldRow label="Título" v={title} on={setTitle} testID="ch-new-title" />
        <FieldRow label="Autor / aluno" v={author} on={setAuthor} testID="ch-new-author" />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}><FieldRow label="Semanas" v={weeks} on={setWeeks} kb="number-pad" testID="ch-new-weeks" /></View>
          <View style={{ flex: 2 }}><FieldRow label="URL votação externa" v={voteUrl} on={setVoteUrl} testID="ch-new-vote" /></View>
        </View>
        <Text style={styles.subLabel}>Categoria</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
          {["reset12", "shape", "forge"].map((tg) => (
            <Pressable key={tg} testID={`ch-new-tag-${tg}`} onPress={() => setTag(tg)}
              style={[styles.smallChip, tag === tg && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}>
              <Text style={[styles.smallChipText, tag === tg && { color: colors.text }]}>{tg}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable testID="ch-create" onPress={create} style={styles.saveBtn}>
          <Ionicons name="add-circle" size={16} color="#F5F5F7" />
          <Text style={styles.saveText}>Criar desafio</Text>
        </Pressable>
      </SectionCard>

      <SectionCard icon="list" title="Desafios ativos">
        {items.map((c) => (
          <View key={c.id} style={styles.chListRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.chListTitle}>{c.title}</Text>
              <Text style={styles.chListSub}>{c.author} · {c.tag} · {c.votes} votos</Text>
            </View>
            <Pressable testID={`ch-close-${c.id}`} onPress={() => close(c.id)}
              style={{ paddingHorizontal: 10, height: 32, borderRadius: radius.pill, backgroundColor: "rgba(216,180,106,0.1)", borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.gold, fontSize: fs.sm, fontWeight: "700" }}>Hall</Text>
            </Pressable>
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

function BroadcastEditor() {
  const { t } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const load = () => api.broadcasts().then(setItems).catch(() => {});
  useEffect(load, []);

  const send = async () => {
    if (!text.trim()) return;
    await api.addBroadcast(text.trim(), "Mari");
    setText(""); setSent(true); setTimeout(() => setSent(false), 1500); load();
  };

  return (
    <View>
      <SectionCard icon="megaphone" title={t("coach.broadcast")}>
        <TextInput
          testID="broadcast-text"
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Mensagem para todos os alunos…"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { minHeight: 100, textAlignVertical: "top", paddingVertical: 12 }]}
        />
        <Pressable testID="send-broadcast" onPress={send} style={[styles.saveBtn, { marginTop: spacing.md }]}>
          <Ionicons name="send" size={16} color="#F5F5F7" />
          <Text style={styles.saveText}>{sent ? "Enviado ✔" : t("cta.broadcast")}</Text>
        </Pressable>
      </SectionCard>
      <SectionCard icon="time" title="Histórico">
        {items.map((b) => (
          <View key={b.id} style={styles.broadcastRow}>
            <Ionicons name="megaphone-outline" size={16} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.broadcastText}>{b.text}</Text>
              <Text style={styles.broadcastMeta}>{b.author} · {b.date}</Text>
            </View>
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

function SectionCard({ icon, title, children }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}><Ionicons name={icon} size={14} color={colors.brand} /></View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FieldRow({ label, v, on, testID, kb, multi }: any) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.subLabel}>{label}</Text>
      <TextInput testID={testID} value={v ?? ""} onChangeText={on} keyboardType={kb} multiline={multi}
        placeholderTextColor={colors.textDim}
        style={[styles.input, multi && { minHeight: 68, textAlignVertical: "top", paddingVertical: 10 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  sub: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  tabsWrap: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabChip: { flexShrink: 0, flexDirection: "row", gap: 6, alignItems: "center", height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  sectionLabel: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  kpiCard: { width: "48%", backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  kpiLabel: { color: colors.textDim, fontSize: fs.sm },
  kpiValue: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -1, marginTop: 4 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  deltaText: { color: colors.success, fontSize: fs.sm, fontWeight: "600" },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,106,42,0.12)", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "700", flex: 1 },
  subLabel: { color: colors.textDim, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  input: { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 44, fontSize: fs.base },
  iconAdd: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  listRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  listCode: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  listPct: { color: colors.brand, fontSize: fs.base, fontWeight: "700", flex: 1 },
  toggleBtn: { paddingHorizontal: 10, height: 30, borderRadius: radius.pill, backgroundColor: "rgba(255,59,48,0.1)", borderWidth: 1, borderColor: colors.error, alignItems: "center", justifyContent: "center" },
  exEditor: { padding: spacing.md, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  exEditNum: { color: colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: spacing.sm, textTransform: "uppercase" },
  saveBtn: { height: 48, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.sm },
  saveText: { color: "#F5F5F7", fontSize: fs.base, fontWeight: "700" },
  smallChip: { flexShrink: 0, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  smallChipText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  chListRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.sm, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xs },
  chListTitle: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  chListSub: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  broadcastRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.sm, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xs },
  broadcastText: { color: colors.text, fontSize: fs.base, lineHeight: 20 },
  broadcastMeta: { color: colors.textDim, fontSize: fs.sm, marginTop: 4 },
  alertCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertName: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  alertStatus: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
});
