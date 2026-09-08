import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { UserProfile, AssessmentEntry } from "../types";
import { VeteranBadge, PatentBadge, PatentRecurrenceCard, getPatentInfo } from "../lib/patents";
import { supabase } from "../lib/supabase";
import {
  User,
  ShieldCheck,
  Award,
  Crown,
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
  CheckCircle2,
  ArrowRightLeft,
  Palette,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  X,
} from "lucide-react";
import { SavedCardsModal } from "../components/SavedCardsModal";
import { CoachFinancialModal, CoachStudentsModal } from "../components/CoachModals";

export const ProfileView: React.FC<{ onOpenColorPicker?: () => void }> = ({ onOpenColorPicker }) => {
  const {
    t,
    persona,
    lang,
    setLang,
    theme,
    setTheme,
    subscription,
    setSubscription,
    anamnesisDone,
    trackWeightsEnabled,
    setTrackWeightsEnabled,
    setActiveView,
    sendNotification,
    currentUserEmail,
    setLoggedIn,
    logout,
    isChampion,
    userPoints,
    userRank,
    isVeteran,
    setIsVeteran,
    consecutiveMonths,
    setConsecutiveMonths,
    monthlyFeePaid,
    setMonthlyFeePaid,
    updateRecurrence,
    applyVeteranCoupon,
    vipChatUnlocked,
    hasVipChatColors,
  } = useApp();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Profile form state
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80");
  const [heightCm, setHeightCm] = useState(182);
  const [weightKg, setWeightKg] = useState(81.1);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSavedCardsModal, setShowSavedCardsModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [supabaseRole, setSupabaseRole] = useState<string | null>(null);

  // 20-day assessment state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentSaving, setAssessmentSaving] = useState(false);
  const [assessmentFeedback, setAssessmentFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
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

  // Protocols Catalogue
  const PROTOCOLS = [
    {
      id: "force",
      name: "💪 VYRA FORCE",
      shortName: "FORCE PROTOCOL",
      tag: "Hipertrofia & Força Pura",
      desc: "Focado em sobrecarga progressiva nos exercícios compostos, densidade muscular e ganhos consistentes de carga semana a semana.",
      accent: "#3B82F6",
      accentBg: "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/40",
      phase: "Fase 2: Sobrecarga Progressiva & Tensão Mecânica",
      coach: "Mari — Head Coach",
      features: [
        "Planilha de cargas e anotações ativadas",
        "Foco em força pura e hipertrofia miofibrilar",
        "Diretrizes nutricionais normocalórica / superávit",
      ],
    },
    {
      id: "shape",
      name: "🍑 VYRA SHAPE",
      shortName: "SHAPE PROTOCOL",
      tag: "Hipertrofia & Estética",
      desc: "Foco total na harmonia e proporção do físico: ênfase em glúteos e quadríceps, posterior denso, afunilamento de cintura e postura esculpida.",
      accent: "#EC4899",
      accentBg: "bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/40",
      phase: "Fase 1: Simetria, Glúteos & Linha de Cintura",
      coach: "Mari — Head Coach",
      features: [
        "Volume alto focado em glúteos e coxas",
        "Técnicas de pré-exaustão e pico de contração",
        "Treino metabólico para queima e tônus",
        "Fortalecimento específico de core e vácuo",
      ],
    },
    {
      id: "reset",
      name: "🔥 VYRA RESET 12",
      shortName: "RESET 12 WEEKS",
      tag: "Recomposição Corporal Acelerada",
      desc: "12 semanas intensivas desenhadas para secar gordura rebelde enquanto preserva massa muscular com treinos densos e cardio estratégico.",
      accent: "#FF6A2A",
      accentBg: "bg-[#FF6A2A]/15 text-[#FF6A2A] border-[#FF6A2A]/40",
      phase: "Fase 3: Déficit Calórico Controlado & Alta Intensidade",
      coach: "Mari — Head Coach",
      features: [
        "Cardio metabólico integrado com monitoramento",
        "Déficit calórico sem perda de força",
        "Sensibilidade à insulina otimizada",
        "Check-ins quinzenais de evolução",
      ],
    },
  ];

  // Protocol state
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>(() => {
    return localStorage.getItem("vyra_active_protocol") || subscription.planId || "force";
  });
  const [modalSelectedProtocol, setModalSelectedProtocol] = useState<string>(selectedProtocolId);
  const [protocolSuccessMsg, setProtocolSuccessMsg] = useState("");

  const currentProtocol = PROTOCOLS.find((p) => p.id === selectedProtocolId) || PROTOCOLS[0];

  const handleConfirmProtocolChange = (newId: string) => {
    const target = PROTOCOLS.find((p) => p.id === newId);
    if (!target) return;
    setSelectedProtocolId(newId);
    localStorage.setItem("vyra_active_protocol", newId);
    setSubscription({ ...subscription, planId: newId, active: true });
    try {
      api.updateProfile({ plan: target.name });
    } catch (e) {
      console.error(e);
    }
    sendNotification(
      "Protocolo Atualizado!",
      `Você migrou com sucesso para o ${target.name}. Sua planilha de treinos e orientações foram atualizadas!`,
      "coach"
    );
    setProtocolSuccessMsg(`Protocolo alterado com sucesso para ${target.name}!`);
    setTimeout(() => {
      setProtocolSuccessMsg("");
      setShowProtocolModal(false);
    }, 2000);
  };

  useEffect(() => {
    // Busca no Supabase diretamente
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              if (data.role) setSupabaseRole(data.role);
              if (data.is_coach) setSupabaseRole("coach");
              if (data.full_name) setFullName(data.full_name);
              if (data.nickname) setNickname(data.nickname);
              if (data.avatar_url) setAvatarUrl(data.avatar_url);
              if (data.height_cm) setHeightCm(data.height_cm);
              if (data.weight_kg) {
                setWeightKg(data.weight_kg);
                setAssessmentWeight(String(data.weight_kg));
              }
              if (data.arm_cm || data.right_arm_cm) setArmCm(String(data.arm_cm || data.right_arm_cm));
              if (data.waist_cm) setWaistCm(String(data.waist_cm));
              if (data.chest_cm) setChestCm(String(data.chest_cm));
              if (data.thigh_cm || data.right_leg_cm) setThighCm(String(data.thigh_cm || data.right_leg_cm));
            }
          });
      }
    });

    api
      .getProfile()
      .then((data) => {
        setProfile(data);
        const pendingName = localStorage.getItem("vyra_pending_fullname");
        setFullName(pendingName || data.full_name || data.nickname || "Aluno Vyra");
        setNickname(data.nickname);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.height_cm) setHeightCm(data.height_cm);
        if (data.weight_kg) setWeightKg(data.weight_kg);

        if (localStorage.getItem("vyra_open_profile_edit") === "true" || localStorage.getItem("vyra_is_new_user") === "true") {
          setEditingProfile(true);
          localStorage.removeItem("vyra_open_profile_edit");
        }
      })
      .catch((e) => {
        console.error("Error loading profile:", e);
        if (localStorage.getItem("vyra_open_profile_edit") === "true" || localStorage.getItem("vyra_is_new_user") === "true") {
          setEditingProfile(true);
        }
      });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName,
          nickname,
          avatar_url: avatarUrl,
          height_cm: heightCm,
          weight_kg: weightKg,
          updated_at: new Date().toISOString(),
        });
      }

      const updated = await api.updateProfile({
        full_name: fullName,
        nickname,
        avatar_url: avatarUrl,
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
    setAssessmentSaving(true);
    setAssessmentFeedback(null);

    const weightVal = parseFloat(assessmentWeight) || weightKg || 80.0;
    const armVal = parseFloat(armCm) || 39.5;
    const waistVal = parseFloat(waistCm) || 82.0;
    const chestVal = parseFloat(chestCm) || 104.0;
    const thighVal = parseFloat(thighCm) || 61.0;

    const newEntry: any = {
      id: `ass-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      photos: [photoFront, photoSide, photoBack],
      photo_front: photoFront,
      photo_side: photoSide,
      photo_back: photoBack,
      notes: assessmentNotes,
      measurements: {
        arm_cm: armVal,
        waist_cm: waistVal,
        chest_cm: chestVal,
        thigh_cm: thighVal,
        weight_kg: weightVal,
      },
      coach_feedback: "Fotos de Frente, Lado e Costas recebidas pelo Coach Manoel. Protocolo em calibração!",
    };

    const existingAssessments = profile?.assessments || [];
    const updatedAssessments = [newEntry, ...existingAssessments];

    try {
      // 1. Atualização via API
      const updated = await api.updateProfile({
        assessments: updatedAssessments,
        last_assessment_date: newEntry.date,
        weight_kg: weightVal,
      });
      setProfile(updated);

      // 2. Insert no Supabase (assessments e sincronização de perimetria em profiles)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Atualiza perfil no Supabase
          await supabase.from("profiles").upsert({
            id: user.id,
            weight_kg: weightVal,
            last_assessment_date: newEntry.date,
            arm_cm: armVal,
            waist_cm: waistVal,
            chest_cm: chestVal,
            thigh_cm: thighVal,
            updated_at: new Date().toISOString(),
          });

          // Insere registro na tabela assessments
          await supabase.from("assessments").insert({
            user_id: user.id,
            user_email: user.email,
            date: newEntry.date,
            photos: [photoFront, photoSide, photoBack],
            photo_front: photoFront,
            photo_side: photoSide,
            photo_back: photoBack,
            measurements: newEntry.measurements,
            notes: assessmentNotes,
            created_at: new Date().toISOString(),
          });
        }
      } catch (errDb) {
        console.warn("Aviso ao persistir avaliação no Supabase:", errDb);
      }

      // 3. Feedback visual de sucesso imediato para o aluno
      setAssessmentFeedback({
        type: "success",
        text: "Avaliação física e fotos enviadas com sucesso ao Coach!",
      });

      sendNotification(
        "Coach Manoel",
        "Avaliação de 20 dias recebida com sucesso! Em até 24h seu protocolo será calibrado.",
        "coach"
      );

      // Fecha o modal suavemente após exibir o feedback de confirmação
      setTimeout(() => {
        setShowAssessmentModal(false);
        setAssessmentFeedback(null);
        setAssessmentSaving(false);
      }, 1500);
    } catch (e: any) {
      console.error("Error saving assessment:", e);
      setAssessmentFeedback({
        type: "error",
        text: "Não foi possível enviar a avaliação. Tente novamente.",
      });
      setAssessmentSaving(false);
    }
  };

  // 20-day calculation
  const lastDate = profile?.last_assessment_date || "2026-04-10";
  const daysSince = Math.floor(
    (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isCoach =
    supabaseRole === "coach" ||
    persona === "coach" ||
    Boolean(
      currentUserEmail &&
        [
          "coach@vyra.club",
          "mari@vyra.club",
          "treinador@vyra.club",
          "admin@vyra.club",
          "headcoach@vyra.club",
        ].includes(currentUserEmail.toLowerCase())
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
                src={profile?.avatar_url || avatarUrl || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
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

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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

            {/* Badges do Usuário: Coroa (Campeão), Selo de Veterano e Patente */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
              {/* Coroa: Estritamente condicionado ao Supabase (is_champion === true ou titles.includes('campeao')) */}
              {(isChampion || (profile as any)?.is_champion === true || ((profile as any)?.titles && Array.isArray((profile as any).titles) && (profile as any).titles.includes("campeao"))) && (
                <span
                  id="profile-champion-crown"
                  title="Campeão Oficial Vyra (Reconhecido no Banco de Dados)"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase bg-gradient-to-r from-[#FF6A2A] via-[#E5A93C] to-[#D8B46A] text-[#121214] shadow-md shadow-[#FF6A2A]/25 border border-[#FFE4A0]/60 select-none animate-pulse"
                >
                  <Crown className="w-3.5 h-3.5 fill-[#121214] stroke-[2] shrink-0" />
                  <span>CAMPEÃO</span>
                </span>
              )}
              {isVeteran && <VeteranBadge size="sm" />}
              <PatentBadge
                level={
                  (profile as any)?.patente_level !== undefined && (profile as any)?.patente_level !== null
                    ? Number((profile as any).patente_level)
                    : getPatentInfo(consecutiveMonths, monthlyFeePaid).level
                }
                showLabel={true}
                size="sm"
                isRevoked={!monthlyFeePaid}
              />
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

            {/* Aviso de Hidratação e Creatina definida pelo Coach */}
            <div className="p-3.5 rounded-2xl bg-[#1D1D1F]/80 border border-[#2B2B2F] flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#FF6A2A]/10 text-[#FF9A62] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#F5F5F7]">
                  Metas de Hidratação & Creatina Prescritas pelo Coach
                </p>
                <p className="text-[11px] text-[#9B9BA1] leading-relaxed">
                  Sua meta diária de água e dose de creatina são ajustadas exclusivamente pelo seu Coach no protocolo oficial e acompanhadas na tela de Início (padrão automático: 2500 ml e 5g).
                </p>
              </div>
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

      {/* SISTEMA DE GESTÃO: Exibido no Perfil exclusivamente para o Coach */}
      {isCoach && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1A1A1E] via-[#151515] to-[#121214] border border-[#FF6A2A]/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6A2A]/20 text-[#FF6A2A] border border-[#FF6A2A]/40 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A2A] bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-full border border-[#FF6A2A]/30">
                      Visão do Coach
                    </span>
                    <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/15 px-2 py-0.5 rounded-full border border-[#34C759]/30">
                      Gestão de Alunos & Finanças
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#F5F5F7] mt-1">
                    Painel de Controle do Coach
                  </h3>
                  <p className="text-xs text-[#9B9BA1] mt-0.5">
                    Acompanhe a receita de assinaturas e prescreva treinos para a sua base de alunos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  id="btn-coach-financial-dashboard"
                  onClick={() => setShowFinancialModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#1D1D1F] border border-[#34C759]/40 text-[#34C759] hover:bg-[#34C759]/10 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Dashboard Financeiro</span>
                </button>
                <button
                  id="btn-coach-students-management"
                  onClick={() => setShowStudentsModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#FF6A2A]/20 active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>Gestão de Alunos</span>
                </button>
              </div>
            </div>

            {/* Métricas Rápidas do Coach */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-[#1D1D1F]/80 border border-[#2B2B2F] text-center">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">MRR Estimado</span>
                <span className="text-base font-extrabold text-[#34C759] block mt-0.5">R$ 6.840,00</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1D1D1F]/80 border border-[#2B2B2F] text-center">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Alunos Ativos</span>
                <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">38 Alunos</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1D1D1F]/80 border border-[#2B2B2F] text-center">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Taxa de Retenção</span>
                <span className="text-base font-extrabold text-[#D8B46A] block mt-0.5">94.7%</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1D1D1F]/80 border border-[#2B2B2F] text-center">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Prescrições Hoje</span>
                <span className="text-base font-extrabold text-[#FF6A2A] block mt-0.5">4 Pendentes</span>
              </div>
            </div>
          </div>

          <PatentRecurrenceCard
            consecutiveMonths={consecutiveMonths}
            monthlyFeePaid={monthlyFeePaid}
            isVeteran={isVeteran}
            onUpdateRecurrence={updateRecurrence}
            onApplyVeteranCoupon={applyVeteranCoupon}
          />
        </div>
      )}

      {/* Modais de Gestão do Coach */}
      <CoachFinancialModal
        isOpen={showFinancialModal}
        onClose={() => setShowFinancialModal(false)}
      />
      <CoachStudentsModal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
      />

      {/* Para Aluno com Personalização VIP de Cores (Por 5+ Estrelas OU Concedido pelo Coach) */}
      {!isCoach && (hasVipChatColors || profile?.vip_chat_unlocked) && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#1C1808] via-[#14120A] to-[#121214] border border-[#FFD700]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-[#FFD700]/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 flex items-center justify-center shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD700] bg-[#FFD700]/15 px-2.5 py-0.5 rounded-full border border-[#FFD700]/30">
                  {consecutiveMonths >= 5
                    ? "Desbloqueado · 5+ Estrelas (Evoluída)"
                    : "Benefício VIP Concedido pelo Coach"}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#F5F5F7] mt-1">
                Personalização VIP de Cores do Chat Global
              </h4>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                Escolha livremente a cor do seu nome e do texto das suas mensagens para se destacar na comunidade.
              </p>
            </div>
          </div>

          <button
            id="open-vip-chat-colors-btn"
            onClick={onOpenColorPicker}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-[#0A0A0A] hover:brightness-110 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#FFD700]/20 active:scale-95 shrink-0"
          >
            <Palette className="w-4 h-4 stroke-[2.5]" />
            <span>Personalizar Cores do Chat</span>
          </button>
        </div>
      )}

      {/* Formas de Pagamento & Cartões de Crédito (EXCLUSIVO DA VISÃO DO ALUNO) */}
      {!isCoach && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6A2A]/10 text-[#FF6A2A] border border-[#FF6A2A]/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#34C759] bg-[#34C759]/15 px-2.5 py-0.5 rounded-full border border-[#34C759]/30">
                  Stripe Segura & PCI-DSS
                </span>
                <span className="text-[10px] font-bold text-[#FF6A2A] bg-[#FF6A2A]/15 px-2 py-0.5 rounded-full border border-[#FF6A2A]/30">
                  Assinatura / Cartão de Crédito
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#F5F5F7] mt-1">
                Assinatura & Formas de Pagamento
              </h4>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                Configure cartões para débito recorrente, renovações de planos e histórico de faturas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="view-plans-btn"
              onClick={() => setActiveView("paywall")}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FF6A2A] hover:bg-[#FF9A62] text-white transition-all cursor-pointer shadow-lg shadow-[#FF6A2A]/20"
            >
              Ver Planos
            </button>
          </div>
        </div>
      )}

      {showSavedCardsModal && (
        <SavedCardsModal
          isOpen={showSavedCardsModal}
          onClose={() => setShowSavedCardsModal(false)}
        />
      )}

      {/* 20-Day Assessment Section (Fotos e Perimetria) - EXCLUSIVO DO ALUNO */}
      {!isCoach && (
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
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40 hover:bg-[#34C759]/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Avaliação</span>
            </button>
          </div>

          {/* Current Measurements Summary (Valores Reais do Supabase / Contexto) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Braço</span>
              <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">
                {profile?.right_arm_cm ?? profile?.arm_cm ?? armCm} cm
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Cintura</span>
              <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">
                {profile?.waist_cm ?? waistCm} cm
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Tórax</span>
              <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">
                {profile?.chest_cm ?? chestCm} cm
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Coxa</span>
              <span className="text-base font-extrabold text-[#F5F5F7] block mt-0.5">
                {profile?.right_leg_cm ?? profile?.thigh_cm ?? thighCm} cm
              </span>
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
      )}

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

            {/* Feedback Visual para o Aluno */}
            {assessmentFeedback && (
              <div
                id="assessment-feedback-banner"
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
                  assessmentFeedback.type === "success"
                    ? "bg-[#34C759]/20 border border-[#34C759]/40 text-[#34C759]"
                    : "bg-[#FF453A]/20 border border-[#FF453A]/40 text-[#FF453A]"
                }`}
              >
                {assessmentFeedback.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{assessmentFeedback.text}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2B2B2F]">
              <button
                type="button"
                id="cancel-assessment-btn"
                onClick={() => setShowAssessmentModal(false)}
                disabled={assessmentSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="save-assessment-btn"
                onClick={handleSaveAssessment}
                onPointerDown={handleSaveAssessment}
                {...({ onPress: handleSaveAssessment } as any)}
                disabled={assessmentSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#34C759] hover:bg-[#34C759]/90 text-[#0A0A0A] shadow-lg shadow-[#34C759]/20 font-black cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assessmentSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Enviando ao Coach...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Enviar para o coach</span>
                  </>
                )}
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

      {/* Acesso & Governança da Conta */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
              Conta & Nível de Acesso
            </h3>
            <p className="text-sm font-semibold text-[#F5F5F7] mt-0.5">
              {currentUserEmail}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {persona === "moderator" && (
              <span className="px-3 py-1 rounded-full bg-[#6D9BFF]/20 text-[#6D9BFF] border border-[#6D9BFF]/40 text-xs font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Moderador Oficial
              </span>
            )}
            {persona === "coach" && (
              <span className="px-3 py-1 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/40 text-xs font-bold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Treinador Credenciado
              </span>
            )}
            {persona === "student" && (
              <span className="px-3 py-1 rounded-full bg-[#FF6A2A]/20 text-[#FF9A62] border border-[#FF6A2A]/40 text-xs font-bold flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                Aluno / Atleta
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-[#2B2B2F]/60 flex items-center gap-2 text-[11px] text-[#6E6E73]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
          <span>
            {persona === "moderator"
              ? "Acesso de moderador verificado por governança interna de e-mail e permissões do Supabase."
              : persona === "coach"
              ? "Acesso de treinador verificado por credenciamento oficial e permissões do Supabase."
              : "Acesso aos painéis de moderação e treinador restrito exclusivamente a e-mails cadastrados e permissões no Supabase."}
          </span>
        </div>
      </div>

      {/* Funcionalidade de Registro de Cargas nos Treinos */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                trackWeightsEnabled
                  ? "bg-[#FF6A2A]/20 text-[#FF6A2A] border border-[#FF6A2A]/40 shadow-lg shadow-[#FF6A2A]/10"
                  : "bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F]"
              }`}
            >
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-[#F5F5F7]">
                  Anotação de Cargas nos Exercícios
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                    trackWeightsEnabled
                      ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/40"
                      : "bg-[#2B2B2F] text-[#9B9BA1] border-[#3A3A40]"
                  }`}
                >
                  {trackWeightsEnabled ? "LIGADO" : "DESLIGADO"}
                </span>
              </div>
              <p className="text-xs text-[#9B9BA1] mt-1 max-w-xl leading-relaxed">
                Adiciona campos numéricos em cada série dos exercícios na aba de <strong>Treinos</strong> para o aluno poder registrar quanto de peso (kg) e repetições realizou em cada série.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            {/* Direct Option Button: Ligar / Desligar */}
            <button
              id="toggle-track-weights-btn"
              onClick={() => {
                const next = !trackWeightsEnabled;
                setTrackWeightsEnabled(next);
                sendNotification(
                  "Preferência de Treino Atualizada",
                  next
                    ? "Campos de carga ativados! Agora você pode anotar seus pesos em cada série de repetições."
                    : "Campos de carga desativados na visualização de treinos.",
                  "general"
                );
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
                trackWeightsEnabled
                  ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/40 hover:bg-[#34C759]/25 shadow-sm shadow-[#34C759]/20"
                  : "bg-[#1D1D1F] text-[#9B9BA1] border-[#2B2B2F] hover:text-[#F5F5F7] hover:border-[#FF6A2A]"
              }`}
            >
              {trackWeightsEnabled ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Desligar Função</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Ligar Função</span>
                </>
              )}
            </button>

            {/* iOS style switch slider */}
            <button
              id="switch-track-weights-toggle"
              type="button"
              role="switch"
              aria-checked={trackWeightsEnabled}
              onClick={() => {
                const next = !trackWeightsEnabled;
                setTrackWeightsEnabled(next);
                sendNotification(
                  "Preferência de Treino Atualizada",
                  next
                    ? "Campos de carga ativados! Agora você pode anotar seus pesos em cada série de repetições."
                    : "Campos de carga desativados na visualização de treinos.",
                  "general"
                );
              }}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                trackWeightsEnabled ? "bg-[#34C759]" : "bg-[#2B2B2F]"
              }`}
            >
              <span className="sr-only">Ligar ou desligar anotação de cargas</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  trackWeightsEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#2B2B2F]/60 flex items-center justify-between text-xs text-[#9B9BA1]">
          <span>
            {trackWeightsEnabled
              ? "✔ Função ativa: Os campos para informar os pesos de cada série aparecem no treino."
              : "✖ Função inativa: A tela de treino fica compacta sem os campos de carga."}
          </span>
          <span className="text-[11px] font-semibold text-[#D8B46A]">
            Salvo automaticamente
          </span>
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

      {/* Botão Sair da Conta */}
      <div className="pt-6 pb-4 flex flex-col items-center gap-3 border-t border-[#2B2B2F]/60">
        <button
          id="profile-logout-btn"
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#FF453A] hover:bg-[#FF453A]/10 hover:border-[#FF453A]/40 text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-95"
        >
          <LogOut className="w-4 h-4 text-[#FF453A]" />
          <span>Sair da Conta</span>
        </button>
        <p className="text-[11px] font-semibold text-[#6E6E73]">{t("profile.version")}</p>
      </div>

      {/* Modal Meu Protocolo */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#151515] border border-[#2B2B2F] p-5 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#F5F5F7]">
                    Meu Protocolo & Periodização
                  </h3>
                  <p className="text-xs text-[#9B9BA1]">
                    Consulte seu protocolo ativo ou escolha uma nova periodização para migrar.
                  </p>
                </div>
              </div>
              <button
                id="close-protocol-modal-btn"
                onClick={() => setShowProtocolModal(false)}
                className="w-8 h-8 rounded-full bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Success alert */}
            {protocolSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/40 text-[#34C759] text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{protocolSuccessMsg}</span>
              </div>
            )}

            {/* Protocols Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#9B9BA1]">
                <span className="font-bold uppercase tracking-wider">Protocolos Disponíveis</span>
                <span>Toque em um protocolo para comparar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROTOCOLS.map((proto) => {
                  const isCurrentActive = selectedProtocolId === proto.id;
                  const isSelectedInModal = modalSelectedProtocol === proto.id;
                  return (
                    <div
                      key={proto.id}
                      onClick={() => setModalSelectedProtocol(proto.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelectedInModal
                          ? "bg-[#1A1A20] border-[#D8B46A] shadow-lg shadow-[#D8B46A]/10 ring-1 ring-[#D8B46A]/40"
                          : "bg-[#1D1D1F] border-[#2B2B2F] hover:border-[#3D3D45]"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-[#F5F5F7] block">
                            {proto.name}
                          </span>
                          {isCurrentActive ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40">
                              Seu Atual
                            </span>
                          ) : (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${proto.accentBg}`}>
                              {proto.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9B9BA1] leading-relaxed">
                          {proto.desc}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[#2B2B2F]/60 text-[11px] text-[#6E6E73]">
                        <div className="text-[#9B9BA1] font-medium">
                          Fase: <span className="text-[#D8B46A] font-semibold">{proto.phase}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isSelectedInModal
                              ? "bg-[#D8B46A] text-[#0A0A0A] font-black"
                              : "bg-[#252529] text-[#9B9BA1] hover:text-[#F5F5F7]"
                          }`}
                        >
                          {isSelectedInModal ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Selecionado</span>
                            </>
                          ) : (
                            <span>Ver Detalhes</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Protocol Comparison Card */}
            {modalSelectedProtocol && (
              <div className="p-4 rounded-2xl bg-[#1A1A20] border border-[#2B2B2F] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D8B46A] uppercase tracking-wider">
                    Recursos Inclusos no {PROTOCOLS.find((p) => p.id === modalSelectedProtocol)?.name}
                  </span>
                  <span className="text-[11px] text-[#9B9BA1]">
                    {PROTOCOLS.find((p) => p.id === modalSelectedProtocol)?.coach}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#F5F5F7]">
                  {PROTOCOLS.find((p) => p.id === modalSelectedProtocol)?.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#34C759] shrink-0 stroke-[3]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#2B2B2F]">
              <button
                id="cancel-protocol-modal-btn"
                onClick={() => setShowProtocolModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] transition-all cursor-pointer"
              >
                Fechar
              </button>

              {modalSelectedProtocol !== selectedProtocolId ? (
                <button
                  id="confirm-change-protocol-btn"
                  onClick={() => handleConfirmProtocolChange(modalSelectedProtocol)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FF6A2A]/20"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>
                    Confirmar Mudança para {PROTOCOLS.find((p) => p.id === modalSelectedProtocol)?.name}
                  </span>
                </button>
              ) : (
                <div className="text-xs text-[#34C759] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Este já é o seu protocolo ativo no momento.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Sair da Conta */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#F5F5F7]">Sair da Conta</h3>
              <p className="text-xs text-[#9B9BA1] mt-1.5 leading-relaxed">
                Deseja realmente desconectar? Você precisará informar seu e-mail novamente para acessar seus treinos e protocolos.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="cancel-logout-btn"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-logout-btn"
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  try {
                    await logout();
                  } finally {
                    setIsLoggingOut(false);
                    setShowLogoutConfirm(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-[#FF453A] text-white text-xs font-bold hover:bg-[#FF453A]/90 transition-all cursor-pointer shadow-lg shadow-[#FF453A]/20 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? "Saindo..." : "Sim, Sair"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
