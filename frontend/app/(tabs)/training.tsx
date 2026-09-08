import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useFocusEffect } from "expo-router";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { useSubscription } from "@/src/hooks/useSubscription";
import { PaywallGateMobile } from "@/src/components/PaywallGateMobile";
import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase";

const COACH_EMAILS = [
  "coach@vyra.club",
  "mari@vyra.club",
  "treinador@vyra.club",
  "admin@vyra.club",
  "headcoach@vyra.club",
  "cubocao@gmail.com",
];

const FOLDERS = [
  { id: "all", label: "Todas as Pastas", icon: "folder-open" },
  { id: "Programas Vyra", label: "Programas Oficiais Vyra", icon: "ribbon" },
  { id: "Hipertrofia", label: "Hipertrofia Muscular", icon: "barbell" },
  { id: "Emagrecimento", label: "Emagrecimento & Definição", icon: "flame" },
  { id: "Força", label: "Força & Powerlifting", icon: "flash" },
  { id: "Recuperação", label: "Recuperação & Mobilidade", icon: "shield-checkmark" },
];

export default function Training() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, persona } = useApp();
  const { canAccess } = useSubscription();

  // Role check state
  const [role, setRole] = useState<"coach" | "student">("student");
  const [loadingRole, setLoadingRole] = useState(true);

  // Student State
  const [schedule, setSchedule] = useState<Record<number, any>>({});
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const d = new Date().getDay();
    return d; // 0 = Dom, 1 = Seg ...
  });
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Coach State
  const [library, setLibrary] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [activeEditWorkout, setActiveEditWorkout] = useState<any | null>(null);
  const [activeDispatchWorkout, setActiveDispatchWorkout] = useState<any | null>(null);
  const [dispatchStudent, setDispatchStudent] = useState<string>("all");
  const [dispatchDays, setDispatchDays] = useState<number[]>([1, 4]); // Default Seg e Qui
  const [dispatching, setDispatching] = useState(false);

  // Verificação de Papel do Usuário (Supabase + Contexto)
  const checkRole = useCallback(async () => {
    try {
      setLoadingRole(true);
      let detected: "coach" | "student" = "student";

      // 1. Supabase Auth
      if (supabase && supabase.auth) {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          const metaRole = user.user_metadata?.role;
          if (metaRole === "coach") {
            detected = "coach";
          } else {
            const { data: sbProfile } = await supabase
              .from("profiles")
              .select("role, is_coach, email")
              .eq("id", user.id)
              .maybeSingle();

            if (sbProfile?.role === "coach" || sbProfile?.is_coach === true) {
              detected = "coach";
            } else if (
              COACH_EMAILS.includes(user.email?.toLowerCase() || "") ||
              COACH_EMAILS.includes(sbProfile?.email?.toLowerCase() || "")
            ) {
              detected = "coach";
            }
          }
        }
      }

      // 2. Context fallback
      if (detected !== "coach" && persona === "coach") {
        detected = "coach";
      }

      setRole(detected);
    } catch (err) {
      console.warn("Erro ao checar papel do usuário:", err);
      if (persona === "coach") setRole("coach");
    } finally {
      setLoadingRole(false);
    }
  }, [persona]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  // Carregar dados de acordo com o papel
  const loadStudentSchedule = useCallback(async () => {
    try {
      setLoadingSchedule(true);
      const data = await api.getWorkoutSchedule().catch(() => null);
      if (data) {
        setSchedule(data);
      } else {
        // Fallback: carregar treino de hoje
        const todayWk = await api.todayWorkout().catch(() => null);
        if (todayWk) {
          const todayIdx = new Date().getDay();
          setSchedule({ [todayIdx]: todayWk });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar calendário:", err);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  const loadCoachLibrary = useCallback(async () => {
    try {
      setLoadingLibrary(true);
      const items = await api.getWorkoutLibrary().catch(() => []);
      setLibrary(items);
    } catch (err) {
      console.error("Erro ao carregar biblioteca:", err);
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (role === "coach") {
      loadCoachLibrary();
    } else {
      loadStudentSchedule();
    }
  }, [role, loadCoachLibrary, loadStudentSchedule]);

  useFocusEffect(
    useCallback(() => {
      if (role === "coach") {
        loadCoachLibrary();
      } else {
        loadStudentSchedule();
      }
    }, [role, loadCoachLibrary, loadStudentSchedule])
  );

  // Dias da semana atual (Segunda a Domingo)
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);

    const days = [];
    const dayNames = [
      { label: "SEG", full: "Segunda-feira", dayIdx: 1 },
      { label: "TER", full: "Terça-feira", dayIdx: 2 },
      { label: "QUA", full: "Quarta-feira", dayIdx: 3 },
      { label: "QUI", full: "Quinta-feira", dayIdx: 4 },
      { label: "SEX", full: "Sexta-feira", dayIdx: 5 },
      { label: "SÁB", full: "Sábado", dayIdx: 6 },
      { label: "DOM", full: "Domingo", dayIdx: 0 },
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayConfig = dayNames[i];
      days.push({
        ...dayConfig,
        dateNumber: d.getDate(),
        isToday: d.toDateString() === now.toDateString(),
        hasWorkout: Boolean(schedule[dayConfig.dayIdx]),
      });
    }
    return days;
  }, [schedule]);

  // Bloqueio de Telas (Apenas para Alunos)
  if (role !== "coach" && !canAccess("training")) {
    return (
      <PaywallGateMobile
        title="Assinatura Inativa. Libere seu acesso para visualizar seu treino e dieta."
        description="Libere seu acesso para visualizar seu treino e dieta."
        onSubscribe={() => router.push("/(tabs)/profile")}
        onGoBack={() => router.replace("/(tabs)")}
      />
    );
  }

  // Loading geral
  if (loadingRole) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={{ color: colors.textDim, marginTop: 16, fontSize: fs.sm }}>
          Verificando permissões de acesso...
        </Text>
      </View>
    );
  }

  // -------------------------------------------------------------
  // VISÃO DO COACH: BIBLIOTECA DE TREINOS & PRESCRIÇÃO (Bloco 3)
  // -------------------------------------------------------------
  if (role === "coach") {
    const filteredLibrary = library.filter((item) => {
      if (selectedFolder === "all") return true;
      const cat = item.category || "";
      const title = item.title || "";
      const focus = item.focus || "";
      return (
        cat.toLowerCase().includes(selectedFolder.toLowerCase()) ||
        title.toLowerCase().includes(selectedFolder.toLowerCase()) ||
        focus.toLowerCase().includes(selectedFolder.toLowerCase())
      );
    });

    const handleSaveExerciseChanges = async () => {
      if (!activeEditWorkout) return;
      try {
        await api.saveWorkoutLibrary(activeEditWorkout);
        Alert.alert("Sucesso", "Treino e exercícios atualizados na Biblioteca!");
        setActiveEditWorkout(null);
        loadCoachLibrary();
      } catch (err: any) {
        Alert.alert("Erro", "Não foi possível salvar as alterações: " + err.message);
      }
    };

    const handleConfirmDispatch = async () => {
      if (!activeDispatchWorkout) return;
      if (dispatchDays.length === 0) {
        Alert.alert("Atenção", "Selecione ao menos um dia da semana para o agendamento.");
        return;
      }
      try {
        setDispatching(true);
        const res = await api.assignWorkoutDay({
          student_id: dispatchStudent,
          days: dispatchDays,
          workout: activeDispatchWorkout,
        });
        Alert.alert(
          "Treino Despachado!",
          res.message || "O treino foi agendado no calendário com sucesso!"
        );
        setActiveDispatchWorkout(null);
      } catch (err: any) {
        Alert.alert("Erro ao despachar", err.message || "Falha na comunicação com o servidor.");
      } finally {
        setDispatching(false);
      }
    };

    const toggleDispatchDay = (dIdx: number) => {
      if (dispatchDays.includes(dIdx)) {
        setDispatchDays(dispatchDays.filter((x) => x !== dIdx));
      } else {
        setDispatchDays([...dispatchDays, dIdx]);
      }
    };

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing["3xl"] + 40,
            paddingHorizontal: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header do Coach */}
          <View style={styles.coachBadgeRow}>
            <View style={styles.coachBadge}>
              <Ionicons name="shield-checkmark" size={13} color={colors.brand} />
              <Text style={styles.coachBadgeText}>COACH OFICIAL · VYRA</Text>
            </View>
            <Pressable
              onPress={() => {
                const newTemplate = {
                  id: `lib-custom-${Date.now()}`,
                  title: "Novo Bloco de Treino",
                  focus: "Hipertrofia / Força",
                  duration_min: 50,
                  intensity: "Alta",
                  category: selectedFolder === "all" ? "Hipertrofia" : selectedFolder,
                  coach_note: "Instruções do Coach sobre cadência e segurança.",
                  exercises: [
                    {
                      id: `ex-${Date.now()}-1`,
                      name: "Exercício 1",
                      muscle: "Geral",
                      sets: 4,
                      reps: "10-12",
                      rest: "60s",
                      load_kg: "20",
                      coach_tip: "Mantenha a postura e contração máxima.",
                    },
                  ],
                };
                setActiveEditWorkout(newTemplate);
              }}
              style={styles.newWorkoutBtn}
            >
              <Ionicons name="add-circle" size={16} color={colors.text} />
              <Text style={styles.newWorkoutBtnText}>Novo Treino</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Biblioteca de Treinos</Text>
          <Text style={styles.sub}>
            Selecione uma pasta temática, edite exercícios ou despache para o calendário dos alunos.
          </Text>

          {/* Pastas / Subseções da Biblioteca */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderScroll}
          >
            {FOLDERS.map((f) => {
              const active = selectedFolder === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setSelectedFolder(f.id)}
                  style={[styles.folderChip, active && styles.folderChipActive]}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={14}
                    color={active ? colors.brand : colors.textDim}
                  />
                  <Text style={[styles.folderChipText, active && styles.folderChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {loadingLibrary ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={colors.brand} />
              <Text style={{ color: colors.textDim, marginTop: 12 }}>
                Carregando biblioteca...
              </Text>
            </View>
          ) : filteredLibrary.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-outline" size={40} color={colors.textDim} />
              <Text style={styles.emptyTitle}>Nenhum treino nesta pasta</Text>
              <Text style={styles.emptySub}>
                Crie um novo bloco de treino ou selecione outra categoria acima.
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {filteredLibrary.map((item) => (
                <View key={item.id} style={styles.libCard}>
                  <View style={styles.libCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.tagRow}>
                        <Text style={styles.categoryTag}>{item.category || "Hipertrofia"}</Text>
                        <Text style={styles.intensityTag}>{item.intensity || "Alta"}</Text>
                      </View>
                      <Text style={styles.libTitle}>{item.title}</Text>
                      <Text style={styles.libFocus}>{item.focus}</Text>
                    </View>
                  </View>

                  <View style={styles.libMetaRow}>
                    <View style={styles.libMetaItem}>
                      <Ionicons name="time-outline" size={13} color={colors.textDim} />
                      <Text style={styles.libMetaText}>{item.duration_min || 50} min</Text>
                    </View>
                    <View style={styles.libMetaItem}>
                      <Ionicons name="barbell-outline" size={13} color={colors.textDim} />
                      <Text style={styles.libMetaText}>
                        {item.exercises?.length || 0} exercícios
                      </Text>
                    </View>
                  </View>

                  {/* Prévia dos exercícios */}
                  <View style={styles.exPreviewBox}>
                    {item.exercises?.slice(0, 3).map((ex: any, idx: number) => (
                      <Text key={ex.id || idx} style={styles.exPreviewText} numberOfLines={1}>
                        • {ex.name} ({ex.sets} × {ex.reps})
                      </Text>
                    ))}
                    {(item.exercises?.length || 0) > 3 && (
                      <Text style={{ color: colors.brand, fontSize: 11, marginTop: 2 }}>
                        + {(item.exercises?.length || 0) - 3} outros exercícios
                      </Text>
                    )}
                  </View>

                  {/* Botões de Ação do Treino na Biblioteca */}
                  <View style={styles.libActionRow}>
                    <Pressable
                      onPress={() => setActiveEditWorkout({ ...item })}
                      style={styles.editBtn}
                    >
                      <Ionicons name="create-outline" size={15} color={colors.text} />
                      <Text style={styles.editBtnText}>Editar Exercícios</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setActiveDispatchWorkout({ ...item })}
                      style={styles.dispatchBtn}
                    >
                      <Ionicons name="send" size={14} color="#0A0A0A" />
                      <Text style={styles.dispatchBtnText}>Despachar para Alunos</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* MODAL 1: EDITAR / CRIAR EXERCÍCIOS (Coach) */}
        {activeEditWorkout && (
          <Modal visible={true} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { maxHeight: "88%" }]}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Editar Bloco de Treino</Text>
                    <Text style={styles.modalSub}>
                      Configure séries, repetições, carga e orientações.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setActiveEditWorkout(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
                  <Text style={styles.inputLabel}>Título do Treino</Text>
                  <TextInput
                    style={styles.input}
                    value={activeEditWorkout.title}
                    onChangeText={(val) =>
                      setActiveEditWorkout((s: any) => ({ ...s, title: val }))
                    }
                    placeholder="Ex: Peito e Tríceps Pesado"
                    placeholderTextColor={colors.textDim}
                  />

                  <Text style={styles.inputLabel}>Foco Muscular</Text>
                  <TextInput
                    style={styles.input}
                    value={activeEditWorkout.focus}
                    onChangeText={(val) =>
                      setActiveEditWorkout((s: any) => ({ ...s, focus: val }))
                    }
                    placeholder="Ex: Tensão Mecânica e Hipertrofia"
                    placeholderTextColor={colors.textDim}
                  />

                  <Text style={styles.inputLabel}>Nota do Coach</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    multiline
                    value={activeEditWorkout.coach_note}
                    onChangeText={(val) =>
                      setActiveEditWorkout((s: any) => ({ ...s, coach_note: val }))
                    }
                    placeholder="Instruções para o aluno..."
                    placeholderTextColor={colors.textDim}
                  />

                  <View style={styles.exSectionHeader}>
                    <Text style={styles.exSectionTitle}>
                      Exercícios ({activeEditWorkout.exercises?.length || 0})
                    </Text>
                    <Pressable
                      onPress={() => {
                        const newEx = {
                          id: `ex-${Date.now()}`,
                          name: "Novo Exercício",
                          muscle: "Peito",
                          sets: 4,
                          reps: "10",
                          load_kg: "20",
                          rest: "60s",
                          coach_tip: "Cadência controlada 3s.",
                        };
                        setActiveEditWorkout((s: any) => ({
                          ...s,
                          exercises: [...(s.exercises || []), newEx],
                        }));
                      }}
                      style={styles.addExSmallBtn}
                    >
                      <Ionicons name="add" size={14} color={colors.brand} />
                      <Text style={styles.addExSmallText}>Adicionar</Text>
                    </Pressable>
                  </View>

                  {activeEditWorkout.exercises?.map((ex: any, idx: number) => (
                    <View key={ex.id || idx} style={styles.editExCard}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={styles.editExIdx}>#{idx + 1}</Text>
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0 }]}
                          value={ex.name}
                          onChangeText={(v) => {
                            const updated = [...activeEditWorkout.exercises];
                            updated[idx].name = v;
                            setActiveEditWorkout((s: any) => ({ ...s, exercises: updated }));
                          }}
                          placeholder="Nome do Exercício"
                          placeholderTextColor={colors.textDim}
                        />
                        <Pressable
                          onPress={() => {
                            const updated = activeEditWorkout.exercises.filter(
                              (_: any, i: number) => i !== idx
                            );
                            setActiveEditWorkout((s: any) => ({ ...s, exercises: updated }));
                          }}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FF453A" />
                        </Pressable>
                      </View>

                      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Séries</Text>
                          <TextInput
                            style={styles.miniInput}
                            value={String(ex.sets || 4)}
                            keyboardType="numeric"
                            onChangeText={(v) => {
                              const updated = [...activeEditWorkout.exercises];
                              updated[idx].sets = Number(v) || 0;
                              setActiveEditWorkout((s: any) => ({ ...s, exercises: updated }));
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Reps</Text>
                          <TextInput
                            style={styles.miniInput}
                            value={String(ex.reps || "10")}
                            onChangeText={(v) => {
                              const updated = [...activeEditWorkout.exercises];
                              updated[idx].reps = v;
                              setActiveEditWorkout((s: any) => ({ ...s, exercises: updated }));
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Carga (kg)</Text>
                          <TextInput
                            style={styles.miniInput}
                            value={String(ex.load_kg || ex.weight_kg || "")}
                            placeholder="kg"
                            placeholderTextColor={colors.textDim}
                            onChangeText={(v) => {
                              const updated = [...activeEditWorkout.exercises];
                              updated[idx].load_kg = v;
                              setActiveEditWorkout((s: any) => ({ ...s, exercises: updated }));
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Descanso</Text>
                          <TextInput
                            style={styles.miniInput}
                            value={String(ex.rest || "60s")}
                            onChangeText={(v) => {
                              const updated = [...activeEditWorkout.exercises];
                              updated[idx].rest = v;
                              setActiveEditWorkout((s: any) => ({ ...s, exercises: updated }));
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    onPress={() => setActiveEditWorkout(null)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveExerciseChanges}
                    style={styles.confirmBtn}
                  >
                    <Ionicons name="save" size={16} color="#0A0A0A" />
                    <Text style={styles.confirmBtnText}>Salvar Treino</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* MODAL 2: DESPACHAR TREINO PARA ALUNOS (Coach) */}
        {activeDispatchWorkout && (
          <Modal visible={true} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Despachar Prescrição</Text>
                    <Text style={styles.modalSub}>
                      Atribua "{activeDispatchWorkout.title}" aos dias no calendário dos alunos.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setActiveDispatchWorkout(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </Pressable>
                </View>

                {/* Seleção do Aluno */}
                <Text style={styles.inputLabel}>Destinatário da Prescrição</Text>
                <View style={styles.studentSelectorRow}>
                  {[
                    { id: "all", label: "Todos os Alunos Ativos" },
                    { id: "std-1", label: "Rafael Silva" },
                    { id: "std-2", label: "Camila Siqueira" },
                    { id: "std-3", label: "Beatriz Lima" },
                  ].map((s) => {
                    const active = dispatchStudent === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setDispatchStudent(s.id)}
                        style={[styles.studentChip, active && styles.studentChipActive]}
                      >
                        <Ionicons
                          name={active ? "radio-button-on" : "radio-button-off"}
                          size={14}
                          color={active ? colors.brand : colors.textDim}
                        />
                        <Text
                          style={[
                            styles.studentChipText,
                            active && { color: colors.text, fontWeight: "700" },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Seleção dos Dias da Semana */}
                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                  Dias no Calendário Semanal
                </Text>
                <View style={styles.daysGrid}>
                  {[
                    { dayIdx: 1, label: "Segunda", short: "SEG" },
                    { dayIdx: 2, label: "Terça", short: "TER" },
                    { dayIdx: 3, label: "Quarta", short: "QUA" },
                    { dayIdx: 4, label: "Quinta", short: "QUI" },
                    { dayIdx: 5, label: "Sexta", short: "SEX" },
                    { dayIdx: 6, label: "Sábado", short: "SÁB" },
                    { dayIdx: 0, label: "Domingo", short: "DOM" },
                  ].map((d) => {
                    const active = dispatchDays.includes(d.dayIdx);
                    return (
                      <Pressable
                        key={d.dayIdx}
                        onPress={() => toggleDispatchDay(d.dayIdx)}
                        style={[styles.dayPickChip, active && styles.dayPickChipActive]}
                      >
                        <Text
                          style={[
                            styles.dayPickShort,
                            active && { color: "#0A0A0A", fontWeight: "800" },
                          ]}
                        >
                          {d.short}
                        </Text>
                        <Text
                          style={[
                            styles.dayPickLabel,
                            active && { color: "#0A0A0A", fontWeight: "600" },
                          ]}
                        >
                          {d.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.modalFooter}>
                  <Pressable
                    onPress={() => setActiveDispatchWorkout(null)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmDispatch}
                    disabled={dispatching}
                    style={[styles.confirmBtn, dispatching && { opacity: 0.6 }]}
                  >
                    {dispatching ? (
                      <ActivityIndicator size="small" color="#0A0A0A" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#0A0A0A" />
                        <Text style={styles.confirmBtnText}>Confirmar Despacho</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // -------------------------------------------------------------
  // VISÃO DO ALUNO: CALENDÁRIO SEMANAL & EXIBIÇÃO DINÂMICA (Bloco 2)
  // -------------------------------------------------------------
  const currentWorkout = schedule[selectedDayIdx] || null;

  const total = currentWorkout?.exercises?.length || 0;
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const requestSubstitution = (exerciseName: string) => {
    Alert.alert(
      "Substituir Exercício",
      `Deseja solicitar ao Coach uma alternativa biomecânica para "${exerciseName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: () =>
            Alert.alert("Enviado", "Sua solicitação foi encaminhada para a treinadora."),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing["3xl"] + 70,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>{t("sec.training")}</Text>

        {/* CALENDÁRIO SEMANAL DO ALUNO (Segunda a Domingo) */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="calendar-outline" size={15} color={colors.brand} />
              <Text style={styles.calendarTitle}>Semana de Treinos</Text>
            </View>
            <Text style={styles.calendarSubText}>Toque no dia para alternar</Text>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((d) => {
              const isSelected = selectedDayIdx === d.dayIdx;
              return (
                <Pressable
                  key={d.dayIdx}
                  onPress={() => setSelectedDayIdx(d.dayIdx)}
                  style={[
                    styles.dayBox,
                    isSelected && styles.dayBoxSelected,
                    d.isToday && !isSelected && styles.dayBoxToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayShortText,
                      isSelected && styles.dayShortTextSelected,
                    ]}
                  >
                    {d.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumText,
                      isSelected && styles.dayNumTextSelected,
                    ]}
                  >
                    {d.dateNumber}
                  </Text>

                  {/* Indicador de Treino ou Descanso */}
                  <View
                    style={[
                      styles.statusDot,
                      d.hasWorkout
                        ? isSelected
                          ? styles.statusDotActive
                          : styles.statusDotHasWorkout
                        : styles.statusDotRest,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* EXIBIÇÃO DINÂMICA OU ESTADO VAZIO (Dia de Descanso) */}
        {loadingSchedule ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.brand} />
            <Text style={{ color: colors.textDim, fontSize: fs.sm, marginTop: 8 }}>
              Carregando prescrição do dia...
            </Text>
          </View>
        ) : !currentWorkout ? (
          /* ESTADO VAZIO AMIGÁVEL: DIA DE DESCANSO */
          <View style={styles.restDayCard}>
            <View style={styles.restIconCircle}>
              <Ionicons name="bed-outline" size={32} color={colors.brand} />
            </View>
            <Text style={styles.restTitle}>Dia de Descanso & Regeneração</Text>
            <Text style={styles.restDesc}>
              Nenhum treino programado para este dia da semana. O repouso e o sono profundo
              são indispensáveis para a hipertrofia e reconstrução das fibras musculares.
            </Text>

            <View style={styles.restTipBox}>
              <Ionicons name="water-outline" size={16} color="#38BDF8" />
              <Text style={styles.restTipText}>
                Mantenha sua meta diária de hidratação (pelo menos 2.500 ml) e garanta de 7 a 8 horas de sono.
              </Text>
            </View>

            {selectedDayIdx !== new Date().getDay() && (
              <Pressable
                onPress={() => setSelectedDayIdx(new Date().getDay())}
                style={styles.backToTodayBtn}
              >
                <Ionicons name="today-outline" size={15} color={colors.text} />
                <Text style={styles.backToTodayText}>Ver Treino de Hoje</Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* TREINO ATIVO DO DIA SELECIONADO */
          <View>
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.title}>{currentWorkout.title}</Text>
              <Text style={styles.sub}>
                {currentWorkout.focus} · {currentWorkout.duration_min} min
              </Text>
            </View>

            {/* Barra de Progresso do Treino */}
            <View style={styles.progressCard}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.textDim, fontSize: fs.sm }}>
                  {doneCount}/{total} {t("training.exercises")}
                </Text>
                <Text style={{ color: colors.brand, fontSize: fs.sm, fontWeight: "700" }}>
                  {pct}%
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 3 }}>
                <View
                  style={{
                    height: 6,
                    width: `${pct}%`,
                    backgroundColor: colors.brand,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>

            {/* Avaliação de Movimento */}
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
                <Text style={styles.formCtaSub}>Grave sua execução para análise biomecânica</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.textDim} />
            </Pressable>

            {/* Nota do Coach */}
            {currentWorkout.coach_note && (
              <View testID="coach-note" style={styles.coachNote}>
                <View style={styles.coachNoteHead}>
                  <Ionicons name="megaphone" size={14} color={colors.brand} />
                  <Text style={styles.coachNoteTitle}>{t("training.coach_note")}</Text>
                </View>
                <Text style={styles.coachNoteText}>{currentWorkout.coach_note}</Text>
              </View>
            )}

            <Text style={styles.section}>{t("training.exercises")}</Text>

            {/* Lista de Exercícios Prescritos */}
            {currentWorkout.exercises &&
              currentWorkout.exercises.map((ex: any, idx: number) => (
                <View
                  key={ex.id || idx}
                  style={[
                    styles.exCard,
                    done[ex.id] && { opacity: 0.6, borderColor: colors.success },
                  ]}
                >
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
                      style={[
                        styles.checkBtn,
                        done[ex.id] && {
                          backgroundColor: colors.success,
                          borderColor: colors.success,
                        },
                      ]}
                    >
                      {done[ex.id] ? (
                        <Ionicons name="checkmark" size={16} color={colors.text} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={16} color={colors.textDim} />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.exMetaRow}>
                    <MetaChip icon="repeat" text={`${ex.sets} × ${ex.reps}`} />
                    <MetaChip icon="timer-outline" text={`${ex.rest || "60s"}`} />
                    {ex.load_kg && (
                      <MetaChip icon="barbell-outline" text={`${ex.load_kg} kg sugerido`} />
                    )}
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

                  <Pressable
                    onPress={() => requestSubstitution(ex.name)}
                    style={styles.substituteBtn}
                  >
                    <Ionicons name="swap-horizontal" size={14} color={colors.textDim} />
                    <Text style={styles.substituteText}>Substituir Exercício</Text>
                  </Pressable>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Botão Fixo de Finalizar Treino (Visível apenas se houver treino ativo) */}
      {currentWorkout && (
        <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 60 + spacing.md }]}>
          <Pressable
            testID="finish-workout-button"
            onPress={() => {
              Alert.alert(
                "Treino Concluído!",
                "Parabéns pelo treino de hoje! Seus dados foram computados na sua aderência.",
                [
                  {
                    text: "Ver Progresso",
                    onPress: () => router.push("/(tabs)/progress"),
                  },
                ]
              );
            }}
            style={styles.finishBtn}
          >
            <Text style={styles.finishText}>{t("cta.finish_workout")}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#0A0A0A" />
          </Pressable>
        </View>
      )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: {
    color: colors.textDim,
    fontSize: fs.sm,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", letterSpacing: -0.5 },
  sub: { color: colors.textDim, fontSize: fs.base, marginTop: 4, lineHeight: 20 },

  // Coach Badge & Header
  coachBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  coachBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,106,42,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,106,42,0.4)",
  },
  coachBadgeText: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  newWorkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newWorkoutBtnText: {
    color: colors.text,
    fontSize: fs.xs,
    fontWeight: "700",
  },

  // Pastas da Biblioteca
  folderScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: spacing.md,
  },
  folderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  folderChipActive: {
    backgroundColor: "rgba(255,106,42,0.12)",
    borderColor: colors.brand,
  },
  folderChipText: {
    color: colors.textDim,
    fontSize: fs.xs,
    fontWeight: "600",
  },
  folderChipTextActive: {
    color: colors.brand,
    fontWeight: "700",
  },

  // Cards da Biblioteca
  libCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  libCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brand,
    backgroundColor: "rgba(255,106,42,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    textTransform: "uppercase",
  },
  intensityTag: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textDim,
    backgroundColor: colors.surface2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  libTitle: {
    color: colors.text,
    fontSize: fs.lg,
    fontWeight: "700",
    marginTop: 2,
  },
  libFocus: {
    color: colors.textDim,
    fontSize: fs.xs,
    marginTop: 2,
  },
  libMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  libMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  libMetaText: {
    color: colors.textDim,
    fontSize: fs.xs,
  },
  exPreviewBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
  },
  exPreviewText: {
    color: colors.textDim,
    fontSize: 11,
    lineHeight: 18,
  },
  libActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: spacing.md,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    color: colors.text,
    fontSize: fs.xs,
    fontWeight: "600",
  },
  dispatchBtn: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  dispatchBtnText: {
    color: "#0A0A0A",
    fontSize: fs.xs,
    fontWeight: "800",
  },

  // Calendário Semanal do Aluno
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  calendarTitle: {
    color: colors.text,
    fontSize: fs.sm,
    fontWeight: "700",
  },
  calendarSubText: {
    color: colors.textDim,
    fontSize: 10,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  dayBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBoxSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  dayBoxToday: {
    borderColor: "rgba(255,106,42,0.6)",
  },
  dayShortText: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: "800",
  },
  dayShortTextSelected: {
    color: "#0A0A0A",
  },
  dayNumText: {
    color: colors.text,
    fontSize: fs.sm,
    fontWeight: "800",
    marginTop: 2,
  },
  dayNumTextSelected: {
    color: "#0A0A0A",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  statusDotActive: {
    backgroundColor: "#0A0A0A",
  },
  statusDotHasWorkout: {
    backgroundColor: colors.brand,
  },
  statusDotRest: {
    backgroundColor: "transparent",
  },

  // Card de Dia de Descanso (Empty State)
  restDayCard: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.2xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  restIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,106,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  restTitle: {
    color: colors.text,
    fontSize: fs.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  restDesc: {
    color: colors.textDim,
    fontSize: fs.sm,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 300,
  },
  restTipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.md,
    backgroundColor: "rgba(56,189,248,0.08)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.25)",
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  restTipText: {
    color: colors.text,
    fontSize: fs.xs,
    flex: 1,
    lineHeight: 18,
  },
  backToTodayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backToTodayText: {
    color: colors.text,
    fontSize: fs.xs,
    fontWeight: "700",
  },

  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // Aluno Workout UI
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  formCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  evalBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  formCtaText: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  formCtaSub: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  coachNote: {
    flexDirection: "column",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
    marginBottom: spacing.md,
  },
  coachNoteHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  coachNoteTitle: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  coachNoteText: { color: colors.text, fontSize: fs.base, marginTop: 6, lineHeight: 20 },
  exCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  exHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  exNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  exName: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  exMuscle: { color: colors.textDim, fontSize: fs.xs, marginTop: 2 },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
  },
  exMetaRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.md,
    flexWrap: "wrap",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.textDim, fontSize: fs.xs },
  videoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,106,42,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,106,42,0.35)",
  },
  videoChipText: { color: colors.brand, fontSize: fs.xs, fontWeight: "700" },
  tipBox: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "rgba(216,180,106,0.06)",
    borderWidth: 1,
    borderColor: "rgba(216,180,106,0.25)",
  },
  tipBoxText: { color: colors.text, fontSize: fs.xs, flex: 1, lineHeight: 16 },
  substituteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
  },
  substituteText: { color: colors.textDim, fontSize: fs.xs, fontWeight: "600" },
  stickyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: "rgba(10,10,10,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  finishBtn: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  finishText: { color: "#0A0A0A", fontSize: fs.base, fontWeight: "800" },

  // Modais do Coach
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#151515",
    borderTopLeftRadius: radius.2xl,
    borderTopRightRadius: radius.2xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "700" },
  modalSub: { color: colors.textDim, fontSize: fs.xs, marginTop: 2 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  confirmBtnText: { color: "#0A0A0A", fontSize: fs.sm, fontWeight: "800" },

  // Inputs
  inputLabel: {
    color: colors.textDim,
    fontSize: fs.xs,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: fs.sm,
    marginBottom: 8,
  },
  exSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  exSectionTitle: {
    color: colors.text,
    fontSize: fs.sm,
    fontWeight: "700",
  },
  addExSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,106,42,0.12)",
  },
  addExSmallText: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "700",
  },
  editExCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  editExIdx: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "800",
    width: 24,
  },
  miniLabel: {
    color: colors.textDim,
    fontSize: 10,
    marginBottom: 2,
  },
  miniInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    color: colors.text,
    fontSize: 12,
    textAlign: "center",
  },

  // Dispatch selector
  studentSelectorRow: {
    gap: 6,
    marginTop: 4,
  },
  studentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentChipActive: {
    borderColor: colors.brand,
    backgroundColor: "rgba(255,106,42,0.08)",
  },
  studentChipText: {
    color: colors.textDim,
    fontSize: fs.xs,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  dayPickChip: {
    width: "31%",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayPickChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  dayPickShort: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "700",
  },
  dayPickLabel: {
    color: colors.text,
    fontSize: 10,
    marginTop: 2,
  },

  emptyCard: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fs.base,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  emptySub: {
    color: colors.textDim,
    fontSize: fs.xs,
    textAlign: "center",
    marginTop: 4,
  },
});
