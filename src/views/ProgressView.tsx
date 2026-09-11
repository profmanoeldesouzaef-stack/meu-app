import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { ProgressEntry, UserProfile } from "../types";
import {
  TrendingUp,
  Plus,
  Calendar,
  Ruler,
  Image as ImageIcon,
  X,
  Check,
  Award,
} from "lucide-react";

export const ProgressView: React.FC = () => {
  const { t } = useApp();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newWaist, setNewWaist] = useState("");
  const [newHip, setNewHip] = useState("");
  const [newArmRight, setNewArmRight] = useState("");
  const [newArmLeft, setNewArmLeft] = useState("");
  const [newThighRight, setNewThighRight] = useState("");
  const [newThighLeft, setNewThighLeft] = useState("");
  const [newNote, setNewNote] = useState("");

  const loadData = async () => {
    try {
      const [pr, pf] = await Promise.all([api.getProgress(), api.getProfile()]);
      setProgress(pr);
      setProfile(pf);
    } catch (e) {
      console.error("Error fetching progress:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenLogModal = () => {
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
  };

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

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

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
      note: newNote || undefined,
      notes: newNote || undefined,
    };

    try {
      const added = await api.addProgress(entry);
      setProgress((prev) => [...prev, added]);

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

      setProfile((prev) => (prev ? { ...prev, ...profilePatch } : null));

      setShowLogModal(false);
      setNewWeight("");
      setNewWaist("");
      setNewHip("");
      setNewArmRight("");
      setNewArmLeft("");
      setNewThighRight("");
      setNewThighLeft("");
      setNewNote("");
    } catch (e) {
      console.error("Error adding progress entry:", e);
    }
  };

  const currentWeight = progress[progress.length - 1]?.weight_kg ?? profile?.weight_kg ?? 81.1;
  const firstWeight = progress[0]?.weight_kg ?? currentWeight;
  const delta = (currentWeight - firstWeight).toFixed(1);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[#9B9BA1]">
        <div className="w-8 h-8 border-2 border-[#FF6A2A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Carregando evolução corporal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-3 py-1 rounded-full border border-[#FF6A2A]/30">
            {t("sec.evolution")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2">
            Composição Corporal
          </h1>
        </div>

        <button
          id="open-log-weight-btn"
          onClick={() => setShowLogModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t("evo.add")}</span>
        </button>
      </div>

      {/* Hero Stats Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-xl">
        <div>
          <span className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
            {t("evo.current")}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-4xl font-black text-[#F5F5F7] tracking-tight">
              {currentWeight.toFixed(1)}
            </span>
            <span className="text-base font-bold text-[#9B9BA1]">kg</span>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
            Variação Total
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-4xl font-black text-[#34C759] tracking-tight">
              {delta.startsWith("-") ? delta : `+${delta}`}
            </span>
            <span className="text-base font-bold text-[#9B9BA1]">kg</span>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
            Consistência
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-4xl font-black text-[#D8B46A] tracking-tight">
              {progress.length}
            </span>
            <span className="text-xs font-semibold text-[#9B9BA1] leading-tight">
              registros aferidos
            </span>
          </div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
            {t("evo.history")}
          </h3>
          <span className="text-xs text-[#9B9BA1]">Últimos meses</span>
        </div>

        {/* Chart representation */}
        <div className="pt-6 pb-2">
          <div className="flex items-end justify-between gap-2 h-44 border-b border-[#2B2B2F] pb-2">
            {progress.map((item, idx) => {
              const weights = progress.map((p) => p.weight_kg);
              const min = Math.min(...weights);
              const max = Math.max(...weights);
              const range = max - min || 1;
              const heightPct = 25 + ((item.weight_kg - min) / range) * 75;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-[#F5F5F7] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.weight_kg}
                  </span>
                  <div
                    className="w-full max-w-[28px] bg-gradient-to-t from-[#FF6A2A]/40 to-[#FF6A2A] rounded-t-lg group-hover:brightness-125 transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-semibold text-[#9B9BA1] rotate-[-45deg] sm:rotate-0 mt-1">
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Perimetry Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
            {t("sec.perimetry")} (cm)
          </h3>
          <button
            onClick={handleOpenLogModal}
            className="text-xs font-bold text-[#FF6A2A] hover:underline cursor-pointer"
          >
            Atualizar medidas
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[#9B9BA1] uppercase font-bold block">Cintura</span>
            <span className="text-lg font-black text-[#F5F5F7] mt-0.5 block">
              {profile?.waist_cm ? `${profile.waist_cm} cm` : "—"}
            </span>
          </div>

          <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[#9B9BA1] uppercase font-bold block">
              {profile?.hip_cm ? "Quadril" : profile?.chest_cm ? "Tórax" : "Quadril"}
            </span>
            <span className="text-lg font-black text-[#F5F5F7] mt-0.5 block">
              {profile?.hip_cm ? `${profile.hip_cm} cm` : profile?.chest_cm ? `${profile.chest_cm} cm` : "—"}
            </span>
          </div>

          <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[#9B9BA1] uppercase font-bold block">Braço D.</span>
            <span className="text-lg font-black text-[#F5F5F7] mt-0.5 block">
              {profile?.right_arm_cm ? `${profile.right_arm_cm} cm` : "—"}
            </span>
          </div>

          <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[#9B9BA1] uppercase font-bold block">Braço E.</span>
            <span className="text-lg font-black text-[#F5F5F7] mt-0.5 block">
              {profile?.left_arm_cm ? `${profile.left_arm_cm} cm` : "—"}
            </span>
          </div>

          <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[#9B9BA1] uppercase font-bold block">Coxa D.</span>
            <span className="text-lg font-black text-[#F5F5F7] mt-0.5 block">
              {profile?.right_leg_cm
                ? `${profile.right_leg_cm} cm`
                : (profile as any)?.thigh_right
                ? `${(profile as any).thigh_right} cm`
                : "—"}
            </span>
          </div>

          <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[#9B9BA1] uppercase font-bold block">Coxa E.</span>
            <span className="text-lg font-black text-[#F5F5F7] mt-0.5 block">
              {profile?.left_leg_cm
                ? `${profile.left_leg_cm} cm`
                : (profile as any)?.thigh_left
                ? `${(profile as any).thigh_left} cm`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Shape Gallery */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#FF6A2A]" />
            <h3 className="text-sm font-bold text-[#F5F5F7]">{t("evo.gallery")}</h3>
          </div>
          <span className="text-xs font-bold text-[#D8B46A]">Avaliação Visual</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-[#2B2B2F] bg-[#1D1D1F] aspect-video relative group">
            <img
              src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80"
              alt="Shape Front"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-xs font-bold text-white">Semana 01 · 84.5kg</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#2B2B2F] bg-[#1D1D1F] aspect-video relative group">
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
              alt="Shape Recent"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-xs font-bold text-[#34C759]">Semana 12 · 81.1kg (-3.4kg)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to Log Weight */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <h3 className="text-base font-bold text-[#F5F5F7]">{t("cta.add_weight")}</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                    Peso corporal (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ex: 81.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#FF6A2A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Cintura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 80.0"
                      value={newWaist}
                      onChange={(e) => setNewWaist(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Quadril (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 98.0"
                      value={newHip}
                      onChange={(e) => setNewHip(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Braço D. (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 38.5"
                      value={newArmRight}
                      onChange={(e) => setNewArmRight(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Braço E. (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 38.0"
                      value={newArmLeft}
                      onChange={(e) => setNewArmLeft(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                </div>

                {/* Coxa D. e Coxa E. */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Coxa Direita (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 61.0"
                      value={newThighRight}
                      onChange={(e) => setNewThighRight(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                      Coxa Esquerda (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 60.5"
                      value={newThighLeft}
                      onChange={(e) => setNewThighLeft(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#FF6A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                    Observações / Sensações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Menos retenção hídrica, alta energia"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#FF6A2A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Registro</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
