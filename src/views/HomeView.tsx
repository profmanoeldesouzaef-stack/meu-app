import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Workout, ProgressEntry, UserProfile, Broadcast } from "../types";
import {
  Sparkles,
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
} from "lucide-react";

const WEEK_PT = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEK_EN = ["M", "T", "W", "T", "F", "S", "S"];
const DONE_DAYS = [true, true, false, true, false, false, false];

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

  // Evolution & Body Composition Tracking State (Integrated directly in Home)
  const [showLogModal, setShowLogModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newWaist, setNewWaist] = useState("");
  const [newArms, setNewArms] = useState("");
  const [newNote, setNewNote] = useState("");

  const handleAddProgressEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    const entry = {
      date: new Date().toISOString().split("T")[0],
      weight_kg: parseFloat(newWeight),
      waist_cm: newWaist ? parseFloat(newWaist) : undefined,
      arms_cm: newArms ? parseFloat(newArms) : undefined,
      note: newNote || undefined,
    };

    try {
      const added = await api.addProgress(entry);
      setProgress((prev) => [...prev, added]);
      setShowLogModal(false);
      setNewWeight("");
      setNewWaist("");
      setNewArms("");
      setNewNote("");
    } catch (e) {
      console.error("Error adding progress entry:", e);
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

  const weekLabels = lang === "pt" ? WEEK_PT : WEEK_EN;
  const currentWeight = progress[progress.length - 1]?.weight_kg ?? profile?.weight_kg ?? 81.1;
  const firstWeight = progress[0]?.weight_kg ?? currentWeight;
  const delta = (currentWeight - firstWeight).toFixed(1);
  const waterTarget = profile?.water_ml ? Number(profile.water_ml) : 2500;
  const creatineDose = profile?.creatine_dose_g ? Number(profile.creatine_dose_g) : (profile?.creatine_g ? Number(profile.creatine_g) : 5.0);
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
  const lastDate = profile?.last_assessment_date || "2026-04-10";
  const daysSinceAssessment = Math.floor(
    (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysLeft = Math.max(0, 20 - daysSinceAssessment);
  const isAssessmentDue = daysSinceAssessment >= 20;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-[#9B9BA1]">{t("sec.hi")},</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
            {profile?.full_name || profile?.nickname || "Rafael"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#151515] border border-[#2B2B2F] text-[#F5F5F7]">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            Season 2026
          </span>
        </div>
      </div>

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
            const isDone = DONE_DAYS[idx];
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

      {/* Today's Workout Hero */}
      {workout && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
                {t("sec.today_workout")}
              </h2>
              {isTrainingLocked && (
                <span className="text-[10px] font-bold text-[#D8B46A] bg-[#D8B46A]/15 border border-[#D8B46A]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Bloqueado
                </span>
              )}
            </div>
            <button
              id="home-view-workout-btn"
              onClick={() => setActiveView("training")}
              className="text-xs font-bold text-[#FF6A2A] hover:underline flex items-center gap-1"
            >
              <span>{isTrainingLocked ? "Liberar Treino" : t("cta.edit")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            id="today-workout-hero-card"
            onClick={() => setActiveView("training")}
            className="relative rounded-3xl overflow-hidden border border-[#2B2B2F] min-h-[220px] sm:min-h-[240px] flex flex-col justify-end p-5 sm:p-6 cursor-pointer group shadow-xl"
          >
            <img
              src={workout.hero_image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80"}
              alt={workout.title}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />

            <div className="relative z-10 space-y-2">
              <span className="inline-block text-[11px] font-black tracking-widest text-[#FF6A2A] uppercase bg-[#0A0A0A]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#FF6A2A]/30">
                {workout.day_label} · {workout.focus}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {workout.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#F5F5F7]/90">
                <div className="flex items-center gap-1.5 bg-[#151515]/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#9B9BA1]" />
                  <span>{workout.duration_min} min</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#151515]/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                  <Flame className="w-3.5 h-3.5 text-[#FF6A2A]" />
                  <span>{workout.intensity}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#151515]/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                  <Dumbbell className="w-3.5 h-3.5 text-[#D8B46A]" />
                  <span>{workout.exercises.length} exercícios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evolution Card (Full Integrated Tracker) */}
      <div
        id="home-evolution-card"
        className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl"
      >
          <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-full border border-[#FF6A2A]/30">
                {t("sec.evolution")}
              </span>
              <h3 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                Composição Corporal & Perimetria
              </h3>
            </div>
            <button
              id="home-open-log-weight-btn"
              onClick={() => setShowLogModal(true)}
              className="text-xs font-bold text-[#FF6A2A] hover:text-[#FF9A62] flex items-center gap-1 cursor-pointer bg-[#FF6A2A]/10 px-2.5 py-1 rounded-lg border border-[#FF6A2A]/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("cta.add_weight")}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
                {t("evo.current")}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
                  {currentWeight.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-[#9B9BA1]">kg</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
                Variação Total
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-[#34C759] tracking-tight">
                  {delta.startsWith("-") ? delta : `+${delta}`}
                </span>
                <span className="text-xs font-bold text-[#9B9BA1]">kg</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
                Consistência
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-[#D8B46A] tracking-tight">
                  {progress.length}
                </span>
                <span className="text-xs font-semibold text-[#9B9BA1]">registros</span>
              </div>
            </div>
          </div>

          {/* Historical Weight Mini Chart */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#9B9BA1] mb-1.5">
              <span className="font-semibold">Histórico de Pesagens</span>
              <span>{progress.length > 0 ? `${progress[0].date.slice(5)} → ${progress[progress.length - 1].date.slice(5)}` : ""}</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-20 border-b border-[#2B2B2F] pb-1">
              {progress.slice(-7).map((item, idx) => {
                const weights = progress.map((p) => p.weight_kg);
                const min = Math.min(...weights);
                const max = Math.max(...weights);
                const range = max - min || 1;
                const heightPct = 25 + ((item.weight_kg - min) / range) * 75;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold text-[#F5F5F7] opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.weight_kg}k
                    </span>
                    <div
                      className="w-full max-w-[24px] bg-gradient-to-t from-[#FF6A2A]/40 to-[#FF6A2A] rounded-t-md group-hover:brightness-125 transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[8px] font-semibold text-[#9B9BA1]">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Perimetry Details */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#9B9BA1] mb-2">
              <span className="font-semibold uppercase tracking-wider">Última Perimetria (cm)</span>
              <button
                onClick={() => setShowLogModal(true)}
                className="text-[10px] text-[#FF6A2A] hover:underline font-bold"
              >
                Atualizar medidas
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <div className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
                <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">Cintura</span>
                <span className="text-sm font-black text-[#F5F5F7] mt-0.5 block">
                  {profile?.waist_cm || 80} <span className="text-[10px] font-normal text-[#9B9BA1]">cm</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
                <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">Braço D.</span>
                <span className="text-sm font-black text-[#F5F5F7] mt-0.5 block">
                  {profile?.right_arm_cm || 38.5} <span className="text-[10px] font-normal text-[#9B9BA1]">cm</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
                <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">Braço E.</span>
                <span className="text-sm font-black text-[#F5F5F7] mt-0.5 block">
                  {profile?.left_arm_cm || 38.2} <span className="text-[10px] font-normal text-[#9B9BA1]">cm</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
                <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">Coxa D.</span>
                <span className="text-sm font-black text-[#F5F5F7] mt-0.5 block">
                  {profile?.right_leg_cm || 61.0} <span className="text-[10px] font-normal text-[#9B9BA1]">cm</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-center col-span-2 sm:col-span-1">
                <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">Coxa E.</span>
                <span className="text-sm font-black text-[#F5F5F7] mt-0.5 block">
                  {profile?.left_leg_cm || 60.8} <span className="text-[10px] font-normal text-[#9B9BA1]">cm</span>
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
              <div>
                <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                  Peso Atual (kg) *
                </label>
                <input
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
                    type="number"
                    step="0.5"
                    placeholder="Ex: 79.5"
                    value={newWaist}
                    onChange={(e) => setNewWaist(e.target.value)}
                    className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                    Braço (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 38.5"
                    value={newArms}
                    onChange={(e) => setNewArms(e.target.value)}
                    className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                  Observações / Sensações
                </label>
                <textarea
                  placeholder="Ex: Menos retenção, energia alta..."
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] hover:text-[#F5F5F7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20"
                >
                  Salvar Aferição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
