import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { UserProfile, AssessmentEntry } from "../types";
import {
  User,
  ShieldCheck,
  Award,
  Globe,
  Sun,
  Moon,
  Droplets,
  Zap,
  Sparkles,
  Check,
  ChevronRight,
  LogOut,
  Edit2,
  FileText,
  Sliders,
  Dumbbell,
  UserCheck,
  Shield,
  Camera,
  Ruler,
  Upload,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";

export const ProfileView: React.FC = () => {
  const {
    t,
    persona,
    setPersona,
    lang,
    setLang,
    theme,
    setTheme,
    subscription,
    anamnesisDone,
    setActiveView,
    sendNotification,
  } = useApp();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Profile form state
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [waterTarget, setWaterTarget] = useState(2500);
  const [creatineDose, setCreatineDose] = useState(5.0);
  const [heightCm, setHeightCm] = useState(182);
  const [weightKg, setWeightKg] = useState(81.1);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 20-day assessment state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [armCm, setArmCm] = useState("39.5");
  const [waistCm, setWaistCm] = useState("82.0");
  const [chestCm, setChestCm] = useState("104.0");
  const [thighCm, setThighCm] = useState("61.0");
  const [assessmentWeight, setAssessmentWeight] = useState("81.1");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [photoFront, setPhotoFront] = useState<string>(
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80"
  );
  const [photoSide, setPhotoSide] = useState<string>(
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80"
  );
  const [photoBack, setPhotoBack] = useState<string>(
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80"
  );

  useEffect(() => {
    api
      .getProfile()
      .then((data) => {
        setProfile(data);
        setFullName(data.full_name || data.nickname || "Rafael Silva");
        setNickname(data.nickname);
        setAvatarUrl(data.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80");
        setWaterTarget(data.water_ml);
        setCreatineDose(data.creatine_g);
        setHeightCm(data.height_cm || 182);
        setWeightKg(data.weight_kg || 81.1);
      })
      .catch((e) => console.error("Error loading profile:", e));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        full_name: fullName,
        nickname,
        avatar_url: avatarUrl,
        water_ml: waterTarget,
        creatine_g: creatineDose,
        height_cm: heightCm,
        weight_kg: weightKg,
      });
      setProfile(updated);
      setEditingProfile(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Error updating profile:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlotUpload = (slot: "front" | "side" | "back", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (slot === "front") setPhotoFront(reader.result);
          if (slot === "side") setPhotoSide(reader.result);
          if (slot === "back") setPhotoBack(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAssessment = async () => {
    const newEntry: any = {
      id: `ass-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      photos: [photoFront, photoSide, photoBack],
      photo_front: photoFront,
      photo_side: photoSide,
      photo_back: photoBack,
      measurements: {
        arm_cm: parseFloat(armCm) || 39.5,
        waist_cm: parseFloat(waistCm) || 82.0,
        chest_cm: parseFloat(chestCm) || 104.0,
        thigh_cm: parseFloat(thighCm) || 61.0,
        weight_kg: parseFloat(assessmentWeight) || weightKg,
      },
      coach_feedback: "Fotos de Frente, Lado e Costas recebidas pelo Coach. Protocolo em análise de perimetria!",
    };

    const existingAssessments = profile?.assessments || [];
    const updatedAssessments = [newEntry, ...existingAssessments];

    try {
      const updated = await api.updateProfile({
        assessments: updatedAssessments,
        last_assessment_date: newEntry.date,
        weight_kg: parseFloat(assessmentWeight) || weightKg,
      });
      setProfile(updated);
      setShowAssessmentModal(false);
      sendNotification(
        "Coach Manoel",
        "Avaliação de 20 dias recebida com sucesso! Em até 24h seu protocolo será calibrado.",
        "coach"
      );
    } catch (e) {
      console.error("Error saving assessment:", e);
    }
  };

  // 20-day calculation
  const lastDate = profile?.last_assessment_date || "2026-04-10";
  const daysSince = Math.floor(
    (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-[#34C759]/20 border border-[#34C759] text-[#34C759] text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Perfil atualizado com sucesso!</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#FF6A2A] to-[#D8B46A] p-0.5 shadow-lg shadow-[#FF6A2A]/20 overflow-hidden">
              <img
                src={profile?.avatar_url || avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            {editingProfile && (
              <label
                htmlFor="avatar-file-input"
                className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5 text-[#FF6A2A]" />
                <span className="text-[9px] font-bold mt-1">Alterar</span>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-[#F5F5F7]">
                {profile?.full_name || profile?.nickname || "Rafael Silva"}
              </h2>
              {subscription.active ? (
                <span className="px-2 py-0.5 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/40 text-[10px] font-black uppercase">
                  {subscription.planId?.toUpperCase() || "PRO"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] text-[10px] font-semibold">
                  FREE
                </span>
              )}
            </div>
            <p className="text-xs text-[#9B9BA1]">
              Apelido: <strong className="text-[#F5F5F7]">@{profile?.nickname || "rafael"}</strong> · {profile?.email || "rafael@vyra.app"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="profile-edit-toggle-btn"
            onClick={() => {
              if (editingProfile) handleSaveProfile();
              else setEditingProfile(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              editingProfile
                ? "bg-[#34C759] text-[#0A0A0A] hover:bg-[#34C759]/90"
                : "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A]"
            }`}
          >
            {editingProfile ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Perfil & Foto</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editable Fields Form (when editingProfile is open) */}
      {editingProfile && (
        <div className="p-6 rounded-3xl bg-[#18181A] border border-[#FF6A2A]/40 space-y-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
            <h3 className="text-xs font-bold text-[#FF9A62] uppercase tracking-wider flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Editar Dados Pessoais & Foto
            </h3>
            <span className="text-[10px] text-[#9B9BA1]">Preencha e clique em Salvar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Nome Completo</label>
              <input
                id="edit-fullname-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Rafael de Souza Silva"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Apelido no App</label>
              <input
                id="edit-nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Rafael"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">URL da Foto de Perfil</label>
              <input
                id="edit-avatarurl-input"
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Altura (cm)</label>
                <input
                  id="edit-height-input"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value) || 180)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Peso (kg)</label>
                <input
                  id="edit-weight-input"
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 80)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Meta de Hidratação (ml)</label>
              <input
                id="edit-water-input"
                type="number"
                step="100"
                value={waterTarget}
                onChange={(e) => setWaterTarget(parseInt(e.target.value) || 2500)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Dose de Creatina por Tomada (g)</label>
              <input
                id="edit-creatine-input"
                type="number"
                step="0.5"
                value={creatineDose}
                onChange={(e) => setCreatineDose(parseFloat(e.target.value) || 5)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
              <p className="text-[11px] text-[#D8B46A] mt-1 font-medium">
                Prescrita pelo Coach por dose (e não diária acumulada).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              id="edit-profile-cancel-btn"
              onClick={() => setEditingProfile(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
            >
              Cancelar
            </button>
            <button
              id="edit-profile-save-btn"
              onClick={handleSaveProfile}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] hover:bg-[#FF9A62] text-white shadow-lg shadow-[#FF6A2A]/20"
            >
              {saving ? "Salvando..." : "Salvar Dados"}
            </button>
          </div>
        </div>
      )}

      {/* 20-Day Assessment Section (Fotos e Perimetria) */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#34C759]/20 text-[#34C759] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7]">
                Ciclo de 20 Dias: Fotos & Perimetria
              </h3>
              <p className="text-[11px] text-[#9B9BA1]">
                Última atualização há {daysSince} dias ({profile?.last_assessment_date || "2026-04-10"})
              </p>
            </div>
          </div>

          <button
            id="open-new-assessment-btn"
            onClick={() => setShowAssessmentModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40 hover:bg-[#34C759]/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Avaliação</span>
          </button>
        </div>

        {/* Current Measurements Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Braço</span>
            <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">39.5 cm</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Cintura</span>
            <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">82.0 cm</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Tórax</span>
            <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">104.0 cm</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Coxa</span>
            <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">61.0 cm</span>
          </div>
        </div>

        {/* Assessment History */}
        {profile?.assessments && profile.assessments.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
              Histórico de Envios
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {profile.assessments.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#D8B46A]" />
                      <span className="font-bold text-[#F5F5F7]">{item.date}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/10 px-2.5 py-1 rounded-full border border-[#34C759]/30">
                      Avaliado pelo Coach
                    </span>
                  </div>

                  <p className="text-[11px] text-[#9B9BA1]">
                    Peso: {item.measurements?.weight_kg || item.weight_kg}kg · Braço: {item.measurements?.arm_cm || item.right_arm_cm}cm · Cintura: {item.measurements?.waist_cm || item.waist_cm}cm
                  </p>

                  {/* 3 Photos Thumbnails */}
                  {(item.photos || item.photo_front) && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="relative rounded-lg overflow-hidden h-20 border border-[#333]">
                        <img
                          src={item.photo_front || (item.photos && item.photos[0]) || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80"}
                          alt="Frente"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-bold text-white">
                          Frente
                        </span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-20 border border-[#333]">
                        <img
                          src={item.photo_side || (item.photos && item.photos[1]) || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80"}
                          alt="Lado"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-bold text-white">
                          Lado
                        </span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-20 border border-[#333]">
                        <img
                          src={item.photo_back || (item.photos && item.photos[2]) || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80"}
                          alt="Costas"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-bold text-white">
                          Costas
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assessment Modal (Fotos e Perimetria) */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#34C759]" />
                <h3 className="text-base font-bold text-[#F5F5F7]">Atualização de 20 Dias</h3>
              </div>
              <button
                id="close-assessment-modal-btn"
                onClick={() => setShowAssessmentModal(false)}
                className="text-[#9B9BA1] hover:text-white text-xs font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-xs text-[#9B9BA1]">
              Insira suas medidas corporais e anexe as fotos de frente, costas e perfil para o Coach avaliar a evolução do shape.
            </p>

            {/* Perimetry Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">Peso Atual (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={assessmentWeight}
                  onChange={(e) => setAssessmentWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-sm text-[#F5F5F7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">Braço Contraído (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={armCm}
                  onChange={(e) => setArmCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-sm text-[#F5F5F7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">Cintura / Umbigo (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-sm text-[#F5F5F7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">Tórax / Peitoral (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={chestCm}
                  onChange={(e) => setChestCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-sm text-[#F5F5F7]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">Coxa Medial (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={thighCm}
                  onChange={(e) => setThighCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-sm text-[#F5F5F7]"
                />
              </div>
            </div>

            {/* 3 Photos Upload: Frente, Lado, Costas */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#F5F5F7]">
                Fotos do Ciclo de 20 Dias (Frente, Lado e Costas)
              </label>
              <p className="text-[11px] text-[#9B9BA1]">
                Envie as 3 fotos padronizadas para geração das avaliações e relatórios do Coach.
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* 1. Frente */}
                <div className="flex flex-col items-center bg-[#1D1D1F] border border-[#2B2B2F] rounded-2xl p-2.5 text-center relative group">
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-black/40 mb-2 relative border border-[#3A3A40]">
                    <img src={photoFront} alt="Frente" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-[#34C759]">
                      1. Frente
                    </span>
                  </div>
                  <label
                    htmlFor="upload-front-photo"
                    className="w-full py-1.5 rounded-lg bg-[#2B2B2F] hover:bg-[#3A3A40] text-[10px] font-bold text-[#F5F5F7] cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Trocar</span>
                    <input
                      id="upload-front-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlotUpload("front", e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 2. Lado */}
                <div className="flex flex-col items-center bg-[#1D1D1F] border border-[#2B2B2F] rounded-2xl p-2.5 text-center relative group">
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-black/40 mb-2 relative border border-[#3A3A40]">
                    <img src={photoSide} alt="Lado" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-[#D8B46A]">
                      2. Lado
                    </span>
                  </div>
                  <label
                    htmlFor="upload-side-photo"
                    className="w-full py-1.5 rounded-lg bg-[#2B2B2F] hover:bg-[#3A3A40] text-[10px] font-bold text-[#F5F5F7] cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Trocar</span>
                    <input
                      id="upload-side-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlotUpload("side", e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 3. Costas */}
                <div className="flex flex-col items-center bg-[#1D1D1F] border border-[#2B2B2F] rounded-2xl p-2.5 text-center relative group">
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-black/40 mb-2 relative border border-[#3A3A40]">
                    <img src={photoBack} alt="Costas" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-[#0A84FF]">
                      3. Costas
                    </span>
                  </div>
                  <label
                    htmlFor="upload-back-photo"
                    className="w-full py-1.5 rounded-lg bg-[#2B2B2F] hover:bg-[#3A3A40] text-[10px] font-bold text-[#F5F5F7] cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Trocar</span>
                    <input
                      id="upload-back-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlotUpload("back", e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2B2B2F]">
              <button
                id="cancel-assessment-btn"
                onClick={() => setShowAssessmentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1]"
              >
                Cancelar
              </button>
              <button
                id="save-assessment-btn"
                onClick={handleSaveAssessment}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#34C759] hover:bg-[#34C759]/90 text-[#0A0A0A] shadow-lg shadow-[#34C759]/20 font-black"
              >
                Enviar ao Coach
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anamnesis Card */}
      <div className="p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D8B46A]/15 text-[#D8B46A] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F5F5F7]">{t("ana.title")}</h4>
            <p className="text-xs text-[#9B9BA1]">
              {anamnesisDone ? "Anamnese completa e ativa" : "Pendente de preenchimento"}
            </p>
          </div>
        </div>

        <button
          id="profile-anamnesis-btn"
          onClick={() => setActiveView("anamnesis")}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#D8B46A] transition-colors"
        >
          {anamnesisDone ? "Atualizar" : "Preencher agora"}
        </button>
      </div>

      {/* Demo Persona Switcher */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
        <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
          {t("profile.persona")}
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            id="profile-persona-student"
            onClick={() => setPersona("student")}
            className={`p-3 rounded-2xl border text-center transition-all ${
              persona === "student"
                ? "bg-[#FF6A2A]/20 border-[#FF6A2A] text-[#FF9A62]"
                : "bg-[#1D1D1F] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7]"
            }`}
          >
            <Dumbbell className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-bold block">{t("profile.student")}</span>
          </button>

          <button
            id="profile-persona-coach"
            onClick={() => setPersona("coach")}
            className={`p-3 rounded-2xl border text-center transition-all ${
              persona === "coach"
                ? "bg-[#D8B46A]/20 border-[#D8B46A] text-[#D8B46A]"
                : "bg-[#1D1D1F] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7]"
            }`}
          >
            <UserCheck className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-bold block">{t("profile.coach")}</span>
          </button>

          <button
            id="profile-persona-mod"
            onClick={() => setPersona("moderator")}
            className={`p-3 rounded-2xl border text-center transition-all ${
              persona === "moderator"
                ? "bg-[#6D9BFF]/20 border-[#6D9BFF] text-[#6D9BFF]"
                : "bg-[#1D1D1F] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7]"
            }`}
          >
            <Shield className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-bold block">{t("profile.moderator")}</span>
          </button>
        </div>
      </div>

      {/* Language & Theme Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Language */}
        <div className="p-4 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#FF6A2A]" />
            <div>
              <span className="text-xs font-bold text-[#F5F5F7] block">{t("profile.language")}</span>
              <span className="text-[10px] text-[#9B9BA1]">
                {lang === "pt" ? "Português (BRL R$)" : "English (USD $)"}
              </span>
            </div>
          </div>
          <button
            id="profile-switch-lang-btn"
            onClick={() => setLang(lang === "pt" ? "en" : "pt")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#FF6A2A]"
          >
            {lang === "pt" ? "Switch to EN" : "Mudar para PT"}
          </button>
        </div>

        {/* Theme */}
        <div className="p-4 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-[#D8B46A]" />
            ) : (
              <Sun className="w-5 h-5 text-[#FF6A2A]" />
            )}
            <div>
              <span className="text-xs font-bold text-[#F5F5F7] block">{t("profile.theme")}</span>
              <span className="text-[10px] text-[#9B9BA1]">
                {theme === "dark" ? t("profile.dark") : t("profile.light")}
              </span>
            </div>
          </div>
          <button
            id="profile-switch-theme-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#FF6A2A]"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* Admin Dashboards Direct Links */}
      {(persona === "coach" || persona === "moderator") && (
        <div className="space-y-2">
          <button
            id="profile-goto-coach-dashboard-btn"
            onClick={() => setActiveView("coach")}
            className="w-full p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/40 text-[#D8B46A] hover:bg-[#D8B46A]/10 flex items-center justify-between font-bold text-xs"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Acessar Painel do Coach</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            id="profile-goto-moderator-dashboard-btn"
            onClick={() => setActiveView("moderator")}
            className="w-full p-4 rounded-2xl bg-[#151515] border border-[#6D9BFF]/40 text-[#6D9BFF] hover:bg-[#6D9BFF]/10 flex items-center justify-between font-bold text-xs"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Acessar Painel de Moderação</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Version Tag & Logout */}
      <div className="text-center pt-4 space-y-3">
        <p className="text-[11px] font-semibold text-[#9B9BA1]">{t("profile.version")}</p>
      </div>
    </div>
  );
};
