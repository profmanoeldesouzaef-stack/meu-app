import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { supabase } from "../lib/supabase";
import { Workout, ProgressEntry, UserProfile, Broadcast } from "../types";
import {
  Award,
  Shield,
  ArrowRight,
  Clock,
  Flame,
  Dumbbell,
  Droplets,
  TrendingUp,
  Trophy,
  MessageSquare,
  Check,
  Zap,
  Plus,
  Minus,
  Camera,
  Ruler,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  Lock,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";

const WEEK_PT = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEK_EN = ["M", "T", "W", "T", "F", "S", "S"];

export const HomeView: React.FC = () => {
  const {
    t,
    lang,
    persona,
    subscription,
    anamnesisDone,
    photosDone,
    setActiveView,
    creatineChecks,
    toggleCreatineCheck,
    currentUserName,
    currentUserNickname,
  } = useApp();

  const isTrainingLocked =
    persona === "student" && (!subscription.active || !anamnesisDone || !photosDone);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [waterDrunk, setWaterDrunk] = useState<number>(() => {
    const saved = localStorage.getItem("vyra_water_drunk");
    return saved ? parseInt(saved, 10) : 1750;
  });
  const [loading, setLoading] = useState(true);
  const [weeklyAdherence, setWeeklyAdherence] = useState<boolean[]>([false, false, false, false, false, false, false]);

  // Evolution & Body Composition Tracking State (Integrated directly in Home)
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEvolutionReportModal, setShowEvolutionReportModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newWaist, setNewWaist] = useState("");
  const [newHip, setNewHip] = useState("");
  const [newArmRight, setNewArmRight] = useState("");
  const [newArmLeft, setNewArmLeft] = useState("");
  const [newThighRight, setNewThighRight] = useState("");
  const [newThighLeft, setNewThighLeft] = useState("");
  const [newNote, setNewNote] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressSuccessMessage, setProgressSuccessMessage] = useState<string | null>(null);
  const [progressSuccessToast, setProgressSuccessToast] = useState<string | null>(null);

  // Preenchimento prévio dos inputs com os últimos valores registrados ao abrir o modal
  const handleOpenLogModal = useCallback(() => {
    const latestWeight = progress.length > 0 ? progress[progress.length - 1].weight_kg : profile?.weight_kg;
    const latestWaist = profile?.waist_cm ?? (progress.length > 0 ? progress[progress.length - 1].waist_cm : undefined);
    const latestHip = profile?.hip_cm ?? profile?.chest_cm ?? (progress.length > 0 ? progress[progress.length - 1].hip_cm : undefined);
    const latestArmD = profile?.right_arm_cm ?? (progress.length > 0 ? (progress[progress.length - 1].right_arm_cm ?? progress[progress.length - 1].arms_cm) : undefined);
    const latestArmE = profile?.left_arm_cm ?? (progress.length > 0 ? (progress[progress.length - 1].left_arm_cm ?? progress[progress.length - 1].arms_cm) : undefined);
    const latestThighD = profile?.right_leg_cm ?? profile?.thigh_right ?? (progress.length > 0 ? (progress[progress.length - 1].thigh_right ?? progress[progress.length - 1].right_leg_cm) : undefined);
    const latestThighE = profile?.left_leg_cm ?? profile?.thigh_left ?? (progress.length > 0 ? (progress[progress.length - 1].thigh_left ?? progress[progress.length - 1].left_leg_cm) : undefined);

    setNewWeight(latestWeight !== undefined && latestWeight !== null ? String(latestWeight) : "");
    setNewWaist(latestWaist !== undefined && latestWaist !== null ? String(latestWaist) : "");
    setNewHip(latestHip !== undefined && latestHip !== null ? String(latestHip) : "");
    setNewArmRight(latestArmD !== undefined && latestArmD !== null ? String(latestArmD) : "");
    setNewArmLeft(latestArmE !== undefined && latestArmE !== null ? String(latestArmE) : "");
    setNewThighRight(latestThighD !== undefined && latestThighD !== null ? String(latestThighD) : "");
    setNewThighLeft(latestThighE !== undefined && latestThighE !== null ? String(latestThighE) : "");
    setNewNote("");
    setShowLogModal(true);
  }, [progress, profile]);

  useEffect(() => {
    if (showLogModal) {
      const latestWeight = progress.length > 0 ? progress[progress.length - 1].weight_kg : profile?.weight_kg;
      const latestWaist = profile?.waist_cm ?? (progress.length > 0 ? progress[progress.length - 1].waist_cm : undefined);
      const latestHip = profile?.hip_cm ?? profile?.chest_cm ?? (progress.length > 0 ? progress[progress.length - 1].hip_cm : undefined);
      const latestArmD = profile?.right_arm_cm ?? (progress.length > 0 ? (progress[progress.length - 1].right_arm_cm ?? progress[progress.length - 1].arms_cm) : undefined);
      const latestArmE = profile?.left_arm_cm ?? (progress.length > 0 ? (progress[progress.length - 1].left_arm_cm ?? progress[progress.length - 1].arms_cm) : undefined);
      const latestThighD = profile?.right_leg_cm ?? profile?.thigh_right ?? (progress.length > 0 ? (progress[progress.length - 1].thigh_right ?? progress[progress.length - 1].right_leg_cm) : undefined);
      const latestThighE = profile?.left_leg_cm ?? profile?.thigh_left ?? (progress.length > 0 ? (progress[progress.length - 1].thigh_left ?? progress[progress.length - 1].left_leg_cm) : undefined);

      if (latestWeight !== undefined && latestWeight !== null) setNewWeight(String(latestWeight));
      if (latestWaist !== undefined && latestWaist !== null) setNewWaist(String(latestWaist));
      if (latestHip !== undefined && latestHip !== null) setNewHip(String(latestHip));
      if (latestArmD !== undefined && latestArmD !== null) setNewArmRight(String(latestArmD));
      if (latestArmE !== undefined && latestArmE !== null) setNewArmLeft(String(latestArmE));
      if (latestThighD !== undefined && latestThighD !== null) setNewThighRight(String(latestThighD));
      if (latestThighE !== undefined && latestThighE !== null) setNewThighLeft(String(latestThighE));
    }
  }, [showLogModal, progress, profile]);

  const handleAddProgressEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    setSavingProgress(true);
    setProgressSuccessMessage(null);

    const todayDate = new Date().toISOString().split("T")[0];
    const weightVal = parseFloat(newWeight);
    const waistVal = newWaist ? parseFloat(newWaist) : undefined;
    const hipVal = newHip ? parseFloat(newHip) : undefined;
    const armRightVal = newArmRight ? parseFloat(newArmRight) : undefined;
    const armLeftVal = newArmLeft ? parseFloat(newArmLeft) : undefined;
    const thighRightVal = newThighRight ? parseFloat(newThighRight) : undefined;
    const thighLeftVal = newThighLeft ? parseFloat(newThighLeft) : undefined;

    const entry: any = {
      date: todayDate,
      weight_kg: weightVal,
      waist_cm: waistVal,
      hip_cm: hipVal,
      arms_cm: armRightVal || armLeftVal || undefined,
      right_arm_cm: armRightVal,
      left_arm_cm: armLeftVal,
      thigh_right: thighRightVal,
      thigh_left: thighLeftVal,
      right_leg_cm: thighRightVal,
      left_leg_cm: thighLeftVal,
      notes: newNote || undefined,
    };

    try {
      const added = await api.addProgress(entry);
      setProgress((prev) => [...prev, added]);

      // Atualiza no perfil a última data de avaliação (renovando o ciclo de 20 dias) e perimetria completa
      const profilePatch: Partial<UserProfile> = {
        weight_kg: weightVal,
        last_assessment_date: todayDate,
      };
      if (waistVal !== undefined) profilePatch.waist_cm = waistVal;
      if (hipVal !== undefined) profilePatch.hip_cm = hipVal;
      if (armRightVal !== undefined) profilePatch.right_arm_cm = armRightVal;
      if (armLeftVal !== undefined) profilePatch.left_arm_cm = armLeftVal;
      if (thighRightVal !== undefined) {
        profilePatch.right_leg_cm = thighRightVal;
        profilePatch.thigh_right = thighRightVal;
      }
      if (thighLeftVal !== undefined) {
        profilePatch.left_leg_cm = thighLeftVal;
        profilePatch.thigh_left = thighLeftVal;
      }

      try {
        await api.updateProfile(profilePatch);
      } catch (patchErr) {}

      // Atualização imediata do state para que Coxa D. e Coxa E. reflitam na hora
      setProfile((prev) => (prev ? { ...prev, ...profilePatch } : null));

      // Sincronização direta com Supabase (profiles e assessments)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profileSbUpdate: Record<string, any> = {
            id: user.id,
            weight_kg: weightVal,
            last_assessment_date: todayDate,
            updated_at: new Date().toISOString(),
          };
          if (waistVal !== undefined) profileSbUpdate.waist_cm = waistVal;
          if (hipVal !== undefined) profileSbUpdate.hip_cm = hipVal;
          if (armRightVal !== undefined) profileSbUpdate.right_arm_cm = armRightVal;
          if (armLeftVal !== undefined) profileSbUpdate.left_arm_cm = armLeftVal;
          if (thighRightVal !== undefined) {
            profileSbUpdate.right_leg_cm = thighRightVal;
            profileSbUpdate.thigh_right = thighRightVal;
          }
          if (thighLeftVal !== undefined) {
            profileSbUpdate.left_leg_cm = thighLeftVal;
            profileSbUpdate.thigh_left = thighLeftVal;
          }
          await supabase.from("profiles").upsert(profileSbUpdate);

          await supabase.from("assessments").insert({
            user_id: user.id,
            user_email: user.email,
            date: todayDate,
            measurements: {
              weight_kg: weightVal,
              waist_cm: waistVal,
              hip_cm: hipVal,
              right_arm_cm: armRightVal,
              left_arm_cm: armLeftVal,
              right_leg_cm: thighRightVal,
              left_leg_cm: thighLeftVal,
              thigh_right: thighRightVal,
              thigh_left: thighLeftVal,
            },
            notes: newNote || null,
            created_at: new Date().toISOString(),
          });
        }
      } catch (sbErr) {
        console.warn("Aviso na sincronização de medidas com Supabase:", sbErr);
      }

      // Recarrega todos os dados de fundo no dashboard
      loadData();

      // Feedback visual com mensagem explícita e fechamento automático do modal
      setProgressSuccessMessage("Métricas corporais registradas com sucesso!");
      setProgressSuccessToast("Métricas corporais registradas com sucesso!");

      setTimeout(() => {
        setShowLogModal(false);
        setSavingProgress(false);
        setProgressSuccessMessage(null);
        setNewWeight("");
        setNewWaist("");
        setNewHip("");
        setNewArmRight("");
        setNewArmLeft("");
        setNewThighRight("");
        setNewThighLeft("");
        setNewNote("");
      }, 950);

      // Limpa toast após 4.5s
      setTimeout(() => {
        setProgressSuccessToast(null);
      }, 4500);
    } catch (e) {
      console.error("Error adding progress entry:", e);
      setSavingProgress(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [wk, pr, pf, bc] = await Promise.all([
        api.getTodayWorkout().catch(() => null),
        api.getProgress().catch(() => []),
        api.getProfile().catch(() => null),
        api.getBroadcasts().catch(() => []),
      ]);
      if (wk) setWorkout(wk);
      if (pr) setProgress(pr);
      if (pf) setProfile(pf);
      if (bc) setBroadcasts(bc);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real Weekly Adherence from Supabase, Workout Logs & Progress Entries
  useEffect(() => {
    async function calculateRealWeeklyAdherence() {
      try {
        const now = new Date();
        const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Seg, 1 = Ter, ..., 6 = Dom
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - currentDayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        let completedDates = new Set<string>();

        // 1. Check localStorage for workout completions
        const localCompletion = localStorage.getItem("vyra_last_completed_workout");
        if (localCompletion) {
          try {
            const parsed = JSON.parse(localCompletion);
            if (parsed.date) {
              completedDates.add(parsed.date);
            }
          } catch (e) {}
        }
        const localLogs = localStorage.getItem("vyra_exercise_logs");
        if (localLogs) {
          try {
            const parsedLogs = JSON.parse(localLogs);
            Object.values(parsedLogs).forEach((item: any) => {
              if (item.date) completedDates.add(item.date);
              if (item.completed_at) completedDates.add(new Date(item.completed_at).toISOString().split("T")[0]);
            });
          } catch (e) {}
        }

        // 2. Query Supabase workout_logs
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: dbLogs } = await supabase
            .from("workout_logs")
            .select("date, completed_at")
            .eq("user_id", userData.user.id)
            .gte("created_at", startOfWeek.toISOString());

          if (dbLogs) {
            dbLogs.forEach((log) => {
              if (log.date) completedDates.add(log.date);
              if (log.completed_at) completedDates.add(new Date(log.completed_at).toISOString().split("T")[0]);
            });
          }
        }

        // 3. Build adherence array for the 7 days of the current week
        const adherenceDays: boolean[] = [];
        for (let i = 0; i < 7; i++) {
          const targetDay = new Date(startOfWeek);
          targetDay.setDate(startOfWeek.getDate() + i);
          const iso = targetDay.toISOString().split("T")[0];
          const brDate = targetDay.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
          
          const isDone = completedDates.has(iso) || completedDates.has(brDate) || (progress && progress.some(p => p.date === iso));
          adherenceDays.push(Boolean(isDone));
        }

        // Check if today has logged sets
        const todaySets = localStorage.getItem("vyra_exercise_sets");
        if (todaySets) {
          try {
            const parsed = JSON.parse(todaySets);
            const hasCompletedSet = Object.values(parsed).some((sets: any) => 
              Array.isArray(sets) && sets.some((s: any) => s.completed)
            );
            if (hasCompletedSet) {
              adherenceDays[currentDayOfWeek] = true;
            }
          } catch (e) {}
        }

        setWeeklyAdherence(adherenceDays);
      } catch (err) {
        console.error("Error calculating weekly adherence:", err);
      }
    }

    calculateRealWeeklyAdherence();
  }, [progress]);

  const weekLabels = lang === "pt" ? WEEK_PT : WEEK_EN;

  // Base da Anamnese Inicial
  const anamnesisBaseWeight = profile?.weight_kg
    ? Number(profile.weight_kg)
    : progress.length > 0
    ? progress[0].weight_kg
    : null;
  const anamnesisHeight = profile?.height_cm ? Number(profile.height_cm) : null;
  const anamnesisGoal = profile?.primary_goal || (profile as any)?.goal || "Definição muscular";

  // Dados Atuais e Variação no Ciclo de 20 Dias
  const currentWeight = progress.length > 0 ? progress[progress.length - 1].weight_kg : anamnesisBaseWeight;
  const delta =
    currentWeight !== null && anamnesisBaseWeight !== null
      ? (currentWeight - anamnesisBaseWeight).toFixed(1)
      : "0.0";

  const waterTarget = profile?.water_ml ? Number(profile.water_ml) : 2500;
  const creatineDose = profile?.creatine_dose_g
    ? Number(profile.creatine_dose_g)
    : profile?.creatine_g
    ? Number(profile.creatine_g)
    : 5.0;
  const waterPct = Math.min(100, Math.round((waterDrunk / waterTarget) * 100));

  const addWater = (amount: number) => {
    setWaterDrunk((prev) => {
      const next = Math.min(waterTarget + 1500, prev + amount);
      localStorage.setItem("vyra_water_drunk", String(next));
      return next;
    });
  };

  const removeWater = (amount: number) => {
    setWaterDrunk((prev) => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem("vyra_water_drunk", String(next));
      return next;
    });
  };

  // 20-day assessment calculation
  const lastDate =
    profile?.last_assessment_date ||
    (profile as any)?.created_at?.slice(0, 10) ||
    new Date().toISOString().slice(0, 10);
  const daysSinceAssessment = Math.max(
    0,
    Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysLeft = Math.max(0, 20 - daysSinceAssessment);
  const isAssessmentDue = daysSinceAssessment >= 20;

  // Regra de Vigência e Régua do Vyra Reset (12 Semanas / 84 dias):
  const isResetProtocol =
    subscription.planId === "reset12" ||
    Boolean(subscription.active_protocol?.toLowerCase().includes("reset")) ||
    Boolean(profile?.active_protocol?.toLowerCase().includes("reset"));

  const periodEndStr = subscription.currentPeriodEnd || subscription.current_period_end;
  const resetDaysRemaining = periodEndStr
    ? Math.ceil((new Date(periodEndStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Renderiza aviso elegante faltando 7 dias e 3 dias (ou <= 7 dias até a expiração)
  const showResetRenewalBanner =
    isResetProtocol &&
    resetDaysRemaining !== null &&
    resetDaysRemaining <= 7 &&
    resetDaysRemaining > 0;

  // Janela de Tolerância de Inadimplência (3 Dias):
  const inGracePeriod =
    Boolean(subscription.in_grace_period) ||
    subscription.status === "in_grace_period" ||
    (resetDaysRemaining !== null && resetDaysRemaining <= 0 && resetDaysRemaining >= -3);

  const graceDaysLeft =
    subscription.days_left_in_grace ??
    (resetDaysRemaining !== null && resetDaysRemaining <= 0
      ? Math.max(1, 3 + resetDaysRemaining)
      : 3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300 relative">
      {/* Toast de Confirmação de Métricas Corporais */}
      {progressSuccessToast && (
        <div
          id="progress-success-toast"
          className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#151515] border border-[#34C759]/60 shadow-2xl text-xs font-bold text-[#F5F5F7] flex items-center gap-3 animate-in slide-in-from-top-3 max-w-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0 border border-[#34C759]/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-[#34C759]">Atualização Concluída</p>
            <p className="text-[11px] text-[#9B9BA1]">{progressSuccessToast}</p>
          </div>
        </div>
      )}

      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-[#9B9BA1]">{t("sec.hi")},</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
            {currentUserNickname || currentUserName || profile?.nickname || profile?.full_name || "Aluno"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#151515] border border-[#2B2B2F] text-[#F5F5F7]">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            Season 2026
          </span>
        </div>
      </div>

      {/* Aviso de Renovação do Protocolo Vyra Reset (12 Semanas) */}
      {showResetRenewalBanner && (
        <div
          id="vyra-reset-expiration-banner"
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#D8B46A]/20 via-[#1C1A14] to-[#151515] border border-[#D8B46A]/60 shadow-lg shadow-[#D8B46A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D8B46A] to-[#FFD700] text-[#0A0A0A] flex items-center justify-center shrink-0 shadow-md">
              <Award className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D8B46A]/25 text-[#FFD700] border border-[#D8B46A]/40">
                  RENOVAÇÃO DE PROTOCOLO
                </span>
                <span className="text-[11px] text-[#D8B46A] font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Faltam {resetDaysRemaining} {resetDaysRemaining === 1 ? "dia" : "dias"}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#F5F5F7] mt-1 leading-snug">
                Seu protocolo Vyra Reset de 12 semanas está terminando em {resetDaysRemaining} {resetDaysRemaining === 1 ? "dia" : "dias"}. Escolha o seu próximo plano para manter sua evolução contínua e liberar novos níveis de patente.
              </h3>
            </div>
          </div>

          <button
            id="renew-reset-paywall-btn"
            onClick={() => setActiveView("paywall")}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#D8B46A] to-[#FFD700] text-[#0A0A0A] hover:brightness-110 shadow-lg shadow-[#D8B46A]/20 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer shrink-0"
          >
            <span>Escolher Próximo Plano</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Alerta Amarelo de Tolerância de Inadimplência (3 Dias) */}
      {inGracePeriod && (
        <div
          id="grace-period-warning-banner"
          className="p-4 sm:p-5 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/50 shadow-lg shadow-[#FFE600]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFE600] text-[#0A0A0A] flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFE600]/25 text-[#FFE600] border border-[#FFE600]/40">
                  CARÊNCIA DE 3 DIAS
                </span>
                <span className="text-[11px] text-[#FFE600] font-semibold">
                  Acesso temporário ativo
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#FFE600] mt-1 leading-snug">
                Regularize seu plano para não perder o acesso em {graceDaysLeft} {graceDaysLeft === 1 ? "dia" : "dias"}.
              </h3>
              <p className="text-xs text-[#E5E5EA] mt-0.5">
                Seus treinos e dieta continuam liberados durante esses 3 dias de tolerância.
              </p>
            </div>
          </div>

          <button
            id="grace-period-regularize-btn"
            onClick={() => setActiveView("paywall")}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#FFE600] hover:bg-[#FFF066] text-[#0A0A0A] shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer shrink-0"
          >
            <span>Regularizar Agora</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 20-Day Assessment Trigger Banner */}
      <div
        id="assessment-20days-banner"
        onClick={() => setShowLogModal(true)}
        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
          isAssessmentDue
            ? "bg-gradient-to-r from-[#FF6A2A]/20 via-[#FF6A2A]/10 to-[#151515] border-[#FF6A2A]/60 shadow-[#FF6A2A]/15 animate-pulse"
            : "bg-[#151515] border-[#2B2B2F] hover:border-[#D8B46A]/50"
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAssessmentDue
                ? "bg-[#FF6A2A] text-white"
                : "bg-[#D8B46A]/15 text-[#D8B46A]"
            }`}
          >
            {isAssessmentDue ? (
              <Camera className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Ruler className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isAssessmentDue
                    ? "bg-[#FF6A2A] text-white"
                    : "bg-[#D8B46A]/20 text-[#D8B46A]"
                }`}
              >
                {isAssessmentDue
                  ? "CICLO DE 20 DIAS VENCIDO"
                  : `CICLO DE 20 DIAS (${daysSinceAssessment}/20)`}
              </span>
              <span className="text-[11px] text-[#9B9BA1]">Perimetria & Fotos</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#F5F5F7] mt-0.5">
              {isAssessmentDue
                ? "Hora de enviar novas fotos e medidas de perimetria para o Coach!"
                : `Faltam ${daysLeft} dias para sua próxima atualização de shape`}
            </h3>
            <p className="text-xs text-[#9B9BA1] mt-0.5">
              A cada 20 dias ajustamos seu volume de treino e macronutrientes com base na sua evolução.
            </p>
          </div>
        </div>

        <button
          id="open-assessment-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowLogModal(true);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 ${
            isAssessmentDue
              ? "bg-[#FF6A2A] hover:bg-[#FF9A62] text-white shadow-md shadow-[#FF6A2A]/30"
              : "bg-[#1D1D1F] text-[#F5F5F7] hover:bg-[#2B2B2F] border border-[#2B2B2F]"
          }`}
        >
          <span>{isAssessmentDue ? "Atualizar Agora" : "Registrar Medidas"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Premium Upsell Card (if no active subscription) */}
      {!subscription.active && (
        <div
          id="home-upsell-card"
          onClick={() => setActiveView("paywall")}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FF6A2A]/20 via-[#D8B46A]/15 to-[#FF6A2A]/10 border border-[#FF6A2A]/40 flex items-center justify-between cursor-pointer hover:border-[#FF6A2A] transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A2A] to-[#D8B46A] flex items-center justify-center text-white shrink-0 shadow-md">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#D8B46A] uppercase">
                PROTOCOLO DE ALTA PERFORMANCE
              </span>
              <h3 className="text-base font-bold text-[#F5F5F7] group-hover:text-[#FF9A62] transition-colors">
                {t("cta.premium")}
              </h3>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#151515] border border-[#2B2B2F] flex items-center justify-center text-[#D8B46A] group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Weekly Adherence Streak */}
      <div>
        <h2 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider mb-3">
          {t("sec.weekly")}
        </h2>
        <div className="grid grid-cols-7 gap-2 bg-[#151515] border border-[#2B2B2F] p-3 sm:p-4 rounded-2xl">
          {weekLabels.map((day, idx) => {
            const isDone = Boolean(weeklyAdherence[idx]);
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? "bg-[#FF6A2A] text-white shadow-md shadow-[#FF6A2A]/20"
                      : "bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F]"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : day}
                </div>
                <span className="text-[10px] font-medium text-[#9B9BA1]">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evolution Card (Full Integrated Tracker with Anamnesis Base & 20-Day Cycle) */}
      <div
        id="home-evolution-card"
        className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-full border border-[#FF6A2A]/30">
              {t("sec.evolution")}
            </span>
            <h3 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
              Base da Anamnese & Ciclo de 20 Dias
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="home-open-evolution-report-btn"
              onClick={() => setShowEvolutionReportModal(true)}
              className="text-xs font-bold text-[#D8B46A] hover:text-[#FFD700] flex items-center gap-1.5 cursor-pointer bg-[#D8B46A]/10 px-3 py-1.5 rounded-xl border border-[#D8B46A]/30 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Relatório do Ciclo</span>
            </button>
            <button
              id="home-open-log-weight-btn"
              onClick={() => setShowLogModal(true)}
              className="text-xs font-bold text-[#FF6A2A] hover:text-[#FF9A62] flex items-center gap-1.5 cursor-pointer bg-[#FF6A2A]/10 px-3 py-1.5 rounded-xl border border-[#FF6A2A]/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("cta.add_weight")}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]/80">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
              Base Anamnese
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
                {anamnesisBaseWeight ? anamnesisBaseWeight.toFixed(1) : "—"}
              </span>
              {anamnesisBaseWeight && <span className="text-xs font-bold text-[#9B9BA1]">kg</span>}
            </div>
            <span className="text-[10px] text-[#9B9BA1] mt-0.5 block truncate">
              {anamnesisHeight ? `${anamnesisHeight} cm` : "Ponto zero"}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]/80">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
              Aferição Atual
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
                {currentWeight ? currentWeight.toFixed(1) : "—"}
              </span>
              {currentWeight && <span className="text-xs font-bold text-[#9B9BA1]">kg</span>}
            </div>
            <span className="text-[10px] text-[#9B9BA1] mt-0.5 block">
              {progress.length > 0 ? "Último registro" : "Sem registro"}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]/80">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
              Variação Total
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${Number(delta) <= 0 ? "text-[#34C759]" : "text-[#FF9A62]"}`}>
                {Number(delta) > 0 ? `+${delta}` : delta}
              </span>
              <span className="text-xs font-bold text-[#9B9BA1]">kg</span>
            </div>
            <span className="text-[10px] text-[#9B9BA1] mt-0.5 block">
              desde o início
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]/80">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
              Ciclo 20 Dias
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${isAssessmentDue ? "text-[#FF6A2A]" : "text-[#D8B46A]"}`}>
                {isAssessmentDue ? "Vencido" : `${daysSinceAssessment}/20`}
              </span>
            </div>
            <span className="text-[10px] text-[#9B9BA1] mt-0.5 block">
              {isAssessmentDue ? "Reavaliação" : `Faltam ${daysLeft}d`}
            </span>
          </div>
        </div>

        {/* Historical Weight Mini Chart & Timeline de Medições com rolagem suave */}
        {progress.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#9B9BA1] mb-1.5">
              <span className="font-semibold">Evolução de Pesagens no Ciclo</span>
              <span>{`${progress[0].date.slice(5)} → ${progress[progress.length - 1].date.slice(5)}`}</span>
            </div>
            {/* Container de rolagem horizontal suave com espaçamento regular */}
            <div className="w-full overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-end justify-between gap-3 h-20 border-b border-[#2B2B2F] pb-1 min-w-[280px]">
                {progress.slice(-7).map((item, idx) => {
                  const weights = progress.map((p) => p.weight_kg);
                  const min = Math.min(...weights);
                  const max = Math.max(...weights);
                  const range = max - min || 1;
                  const heightPct = 25 + ((item.weight_kg - min) / range) * 75;
                  return (
                    <div key={idx} className="flex-1 min-w-[32px] flex flex-col items-center gap-1 group">
                      <span className="text-[9px] font-bold text-[#F5F5F7] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.weight_kg}kg
                      </span>
                      <div
                        className="w-full max-w-[24px] bg-gradient-to-t from-[#FF6A2A]/40 to-[#FF6A2A] rounded-t-md group-hover:brightness-125 transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[8px] font-semibold text-[#9B9BA1] whitespace-nowrap">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Perimetry Details (Preenchimento Real do Aluno, Sem Valores Falsos) */}
        <div className="pt-1">
          {/* Hierarquia do Cabeçalho com alinhamento horizontal */}
          <div className="flex flex-row justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#9B9BA1]">
              ÚLTIMA PERIMETRIA AFERIDA
            </span>
            <button
              id="home-open-measurements-btn"
              onClick={handleOpenLogModal}
              className="text-xs font-bold text-[#FF6A2A] hover:text-[#FF9A62] bg-[#FF6A2A]/10 hover:bg-[#FF6A2A]/20 border border-[#FF6A2A]/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Atualizar medidas</span>
            </button>
          </div>

          {/* Grid Simétrico dos Cards: 2 Colunas Perfeitas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Linha 1: Cintura | Quadril (ou Tórax) */}
            <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[10px] text-[#9B9BA1] uppercase font-bold tracking-wider block">
                Cintura
              </span>
              <span className="text-base sm:text-lg font-black text-[#F5F5F7] mt-0.5 block">
                {profile?.waist_cm ? `${profile.waist_cm} cm` : "—"}
              </span>
            </div>

            <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[10px] text-[#9B9BA1] uppercase font-bold tracking-wider block">
                {profile?.hip_cm ? "Quadril" : profile?.chest_cm ? "Tórax" : "Quadril"}
              </span>
              <span className="text-base sm:text-lg font-black text-[#F5F5F7] mt-0.5 block">
                {profile?.hip_cm ? `${profile.hip_cm} cm` : profile?.chest_cm ? `${profile.chest_cm} cm` : "—"}
              </span>
            </div>

            {/* Linha 2: Braço D. | Braço E. */}
            <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[10px] text-[#9B9BA1] uppercase font-bold tracking-wider block">
                Braço D.
              </span>
              <span className="text-base sm:text-lg font-black text-[#F5F5F7] mt-0.5 block">
                {profile?.right_arm_cm ? `${profile.right_arm_cm} cm` : "—"}
              </span>
            </div>

            <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[10px] text-[#9B9BA1] uppercase font-bold tracking-wider block">
                Braço E.
              </span>
              <span className="text-base sm:text-lg font-black text-[#F5F5F7] mt-0.5 block">
                {profile?.left_arm_cm ? `${profile.left_arm_cm} cm` : "—"}
              </span>
            </div>

            {/* Linha 3: Coxa D. | Coxa E. */}
            <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[10px] text-[#9B9BA1] uppercase font-bold tracking-wider block">
                Coxa D.
              </span>
              <span className="text-base sm:text-lg font-black text-[#F5F5F7] mt-0.5 block">
                {profile?.right_leg_cm
                  ? `${profile.right_leg_cm} cm`
                  : (profile as any)?.thigh_right
                  ? `${(profile as any).thigh_right} cm`
                  : "—"}
              </span>
            </div>

            <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[10px] text-[#9B9BA1] uppercase font-bold tracking-wider block">
                Coxa E.
              </span>
              <span className="text-base sm:text-lg font-black text-[#F5F5F7] mt-0.5 block">
                {profile?.left_leg_cm
                  ? `${profile.left_leg_cm} cm`
                  : (profile as any)?.thigh_left
                  ? `${(profile as any).thigh_left} cm`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders: Water & Creatine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Tracker */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#6D9BFF]/20 text-[#6D9BFF] flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[#F5F5F7]">{t("sec.water")}</span>
            </div>
            <span className="text-xs font-bold text-[#6D9BFF]">
              {waterDrunk} / {waterTarget} ml ({waterPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#1D1D1F] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6D9BFF] to-[#3F73E5] rounded-full transition-all duration-300"
              style={{ width: `${waterPct}%` }}
            />
          </div>

          {/* Hydration Action Buttons (-250ml, +250ml, +500ml, +750ml) */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              id="sub-water-250"
              onClick={() => removeWater(250)}
              title="Retirar 250ml de água"
              className="py-2 rounded-xl text-xs font-bold bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/30 hover:bg-[#FF453A]/20 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Minus className="w-3 h-3 stroke-[2.5]" />
              <span>250ml</span>
            </button>

            <button
              id="add-water-250"
              onClick={() => addWater(250)}
              className="py-2 rounded-xl text-xs font-bold bg-[#6D9BFF]/10 text-[#6D9BFF] border border-[#6D9BFF]/30 hover:bg-[#6D9BFF]/20 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>250ml</span>
            </button>

            <button
              id="add-water-500"
              onClick={() => addWater(500)}
              className="py-2 rounded-xl text-xs font-bold bg-[#6D9BFF]/10 text-[#6D9BFF] border border-[#6D9BFF]/30 hover:bg-[#6D9BFF]/20 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>500ml</span>
            </button>

            <button
              id="add-water-750"
              onClick={() => addWater(750)}
              className="py-2 rounded-xl text-xs font-bold bg-[#6D9BFF]/10 text-[#6D9BFF] border border-[#6D9BFF]/30 hover:bg-[#6D9BFF]/20 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>750ml</span>
            </button>
          </div>
        </div>

        {/* Creatine Tracker with Interactive Check buttons */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[#F5F5F7]">{t("sec.creatine")}</span>
            </div>
            <span className="text-xs font-bold text-[#D8B46A]">
              {creatineDose}g por dose
            </span>
          </div>

          <p className="text-xs text-[#9B9BA1]">
            Quantidade prescrita pelo Coach: {creatineDose}g por dose. Horários programados:
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {(profile?.creatine_times || ["08:00", "20:00"]).map((time, idx) => {
              const isTaken = Boolean(creatineChecks[time]);
              return (
                <button
                  key={idx}
                  id={`creatine-time-check-${time.replace(":", "")}`}
                  onClick={() => toggleCreatineCheck(time)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 active:scale-95 ${
                    isTaken
                      ? "bg-[#34C759]/20 text-[#34C759] border-[#34C759]/50 shadow-md shadow-[#34C759]/10"
                      : "bg-[#1D1D1F] text-[#D8B46A] border-[#D8B46A]/30 hover:border-[#D8B46A]"
                  }`}
                  title={isTaken ? "Dose marcada como tomada! Clique para desmarcar" : "Clique para marcar dose tomada"}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{time}</span>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      isTaken
                        ? "bg-[#34C759] text-[#0A0A0A] border-[#34C759]"
                        : "border-[#9B9BA1]/40 text-transparent"
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase">
                    {isTaken ? "Tomado" : "Pendente"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div>
        <h2 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider mb-3">
          {t("sec.shortcuts")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="shortcut-challenges-btn"
            onClick={() => setActiveView("challenges")}
            className="p-4 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between hover:border-[#D8B46A] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D8B46A]/15 text-[#D8B46A] flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-[#F5F5F7]">{t("sec.challenges")}</h4>
                <p className="text-xs text-[#9B9BA1]">Galeria de fotos & votações</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9B9BA1] group-hover:text-[#D8B46A] group-hover:translate-x-1 transition-all" />
          </button>

          <button
            id="shortcut-community-btn"
            onClick={() => setActiveView("community")}
            className="p-4 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between hover:border-[#FF6A2A] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6A2A]/15 text-[#FF9A62] flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-[#F5F5F7]">{t("sec.community")}</h4>
                <p className="text-xs text-[#9B9BA1]">Chat global de atletas</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9B9BA1] group-hover:text-[#FF6A2A] group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* Log Weight & Perimetry Modal directly in Home */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              id="close-home-log-weight-modal-btn"
              onClick={() => setShowLogModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-full border border-[#FF6A2A]/30">
                Aferição de Shape
              </span>
              <h3 className="text-xl font-extrabold text-[#F5F5F7] mt-1.5">
                Registrar Peso & Perimetria
              </h3>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                Mantenha seus dados atualizados para recalcularmos seus macros automaticamente.
              </p>
            </div>

            <form onSubmit={handleAddProgressEntry} className="space-y-4">
              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                    Peso Atual (kg) *
                  </label>
                  <input
                    id="input-measure-weight"
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ex: 81.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                      Cintura (cm)
                    </label>
                    <input
                      id="input-measure-waist"
                      type="number"
                      step="0.5"
                      placeholder="Ex: 79.5"
                      value={newWaist}
                      onChange={(e) => setNewWaist(e.target.value)}
                      className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                      Quadril (cm)
                    </label>
                    <input
                      id="input-measure-hip"
                      type="number"
                      step="0.5"
                      placeholder="Ex: 98.0"
                      value={newHip}
                      onChange={(e) => setNewHip(e.target.value)}
                      className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                      Braço D. (cm)
                    </label>
                    <input
                      id="input-measure-arm-right"
                      type="number"
                      step="0.5"
                      placeholder="Ex: 38.5"
                      value={newArmRight}
                      onChange={(e) => setNewArmRight(e.target.value)}
                      className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                      Braço E. (cm)
                    </label>
                    <input
                      id="input-measure-arm-left"
                      type="number"
                      step="0.5"
                      placeholder="Ex: 38.0"
                      value={newArmLeft}
                      onChange={(e) => setNewArmLeft(e.target.value)}
                      className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                </div>

                {/* Coxa Direita & Coxa Esquerda */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                      Coxa Direita (cm)
                    </label>
                    <input
                      id="input-measure-thigh-right"
                      type="number"
                      step="0.5"
                      placeholder="Ex: 61.0"
                      value={newThighRight}
                      onChange={(e) => setNewThighRight(e.target.value)}
                      className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                      Coxa Esquerda (cm)
                    </label>
                    <input
                      id="input-measure-thigh-left"
                      type="number"
                      step="0.5"
                      placeholder="Ex: 60.5"
                      value={newThighLeft}
                      onChange={(e) => setNewThighLeft(e.target.value)}
                      className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                    Observações / Sensações
                  </label>
                  <textarea
                    id="input-measure-note"
                    placeholder="Ex: Menos retenção, boa vascularização..."
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                  />
                </div>
              </div>

              {/* Mensagem de Confirmação no Modal */}
              {progressSuccessMessage && (
                <div
                  id="modal-progress-success-alert"
                  className="p-3.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/40 text-[#34C759] text-xs font-bold flex items-center gap-2.5 animate-in fade-in"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34C759]" />
                  <span>{progressSuccessMessage}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  disabled={savingProgress}
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] hover:text-[#F5F5F7] cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  id="submit-measurements-btn"
                  type="submit"
                  disabled={savingProgress || Boolean(progressSuccessMessage)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingProgress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando no Supabase...</span>
                    </>
                  ) : progressSuccessMessage ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Salvo com Sucesso!</span>
                    </>
                  ) : (
                    <span>Salvar Medidas</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evolution Report Modal (Anamnese & Ciclo de 20 Dias) */}
      {showEvolutionReportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              id="close-evolution-report-modal-btn"
              onClick={() => setShowEvolutionReportModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-2.5 py-0.5 rounded-full border border-[#D8B46A]/30">
                  RELATÓRIO EVOLUTIVO
                </span>
                <span className="text-xs text-[#9B9BA1]">
                  Ciclo de 20 Dias
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#F5F5F7] mt-1.5">
                Comparativo Anamnese vs. Shape Atual
              </h3>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                Acompanhamento contínuo dos dados informados na Anamnese inicial e a evolução registrada a cada 20 dias.
              </p>
            </div>

            {/* Metric Comparison Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                  Base Anamnese
                </span>
                <div className="text-lg font-black text-[#F5F5F7] mt-1">
                  {anamnesisBaseWeight ? `${anamnesisBaseWeight.toFixed(1)} kg` : "—"}
                </div>
                <span className="text-[10px] text-[#9B9BA1] mt-0.5 block">
                  {anamnesisHeight ? `${anamnesisHeight} cm` : "Ponto zero"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                  Aferição Atual
                </span>
                <div className="text-lg font-black text-[#F5F5F7] mt-1">
                  {currentWeight ? `${currentWeight.toFixed(1)} kg` : "—"}
                </div>
                <span className="text-[10px] text-[#9B9BA1] mt-0.5 block">
                  {progress.length} {progress.length === 1 ? "registro" : "registros"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                  Variação
                </span>
                <div className={`text-lg font-black mt-1 ${Number(delta) <= 0 ? "text-[#34C759]" : "text-[#FF9A62]"}`}>
                  {Number(delta) > 0 ? `+${delta} kg` : `${delta} kg`}
                </div>
                <span className="text-[10px] text-[#9B9BA1] mt-0.5 block">
                  no protocolo
                </span>
              </div>
            </div>

            {/* Ciclo 20 Dias Status */}
            <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F5F5F7]">Status do Ciclo de 20 Dias</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isAssessmentDue ? "bg-[#FF6A2A] text-white" : "bg-[#D8B46A]/20 text-[#D8B46A]"
                  }`}>
                    {isAssessmentDue ? "Concluído / Atualizar" : `Dia ${daysSinceAssessment} de 20`}
                  </span>
                </div>
                <p className="text-xs text-[#9B9BA1] mt-1">
                  {isAssessmentDue
                    ? "Seu ciclo de 20 dias foi completado. Atualize sua perimetria e fotos para o Coach calibrar seus macros e séries."
                    : `Faltam ${daysLeft} dias para fechar este ciclo de 20 dias e liberar novo ajuste de protocolo.`}
                </p>
              </div>
            </div>

            {/* Perimetria Atual vs Anamnese */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
                Perimetria Atual Registrada
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] text-[#9B9BA1] uppercase block">Cintura</span>
                  <span className="text-sm font-bold text-[#F5F5F7]">
                    {profile?.waist_cm ? `${profile.waist_cm} cm` : "Aguardando registro"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] text-[#9B9BA1] uppercase block">Braço Direito</span>
                  <span className="text-sm font-bold text-[#F5F5F7]">
                    {profile?.right_arm_cm ? `${profile.right_arm_cm} cm` : "Aguardando registro"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] text-[#9B9BA1] uppercase block">Braço Esquerdo</span>
                  <span className="text-sm font-bold text-[#F5F5F7]">
                    {profile?.left_arm_cm ? `${profile.left_arm_cm} cm` : "Aguardando registro"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] text-[#9B9BA1] uppercase block">Coxa Direita</span>
                  <span className="text-sm font-bold text-[#F5F5F7]">
                    {profile?.right_leg_cm ? `${profile.right_leg_cm} cm` : "Aguardando registro"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] text-[#9B9BA1] uppercase block">Coxa Esquerda</span>
                  <span className="text-sm font-bold text-[#F5F5F7]">
                    {profile?.left_leg_cm ? `${profile.left_leg_cm} cm` : "Aguardando registro"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] text-[#9B9BA1] uppercase block">Meta Principal</span>
                  <span className="text-sm font-bold text-[#D8B46A] truncate block">
                    {anamnesisGoal}
                  </span>
                </div>
              </div>
            </div>

            {/* Coach Feedback Note */}
            <div className="p-4 rounded-2xl bg-[#D8B46A]/10 border border-[#D8B46A]/30 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#D8B46A] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-[#D8B46A] block">
                  Diretriz Coach Vyra
                </span>
                <p className="text-xs text-[#E5E5EA] mt-1 leading-relaxed">
                  Os dados da Anamnese Inicial servem como parâmetro fixo de controle. A cada ciclo de 20 dias, registre seu peso em jejum e perimetria de cintura e braço para recalibrarmos o déficit/superávit calórico e o volume de treino da sua periodização.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowEvolutionReportModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] hover:text-[#F5F5F7]"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEvolutionReportModal(false);
                  setShowLogModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20"
              >
                Registrar Nova Aferição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
