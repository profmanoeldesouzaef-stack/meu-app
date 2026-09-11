import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { VyraLogo } from "./VyraLogo";
import { api } from "../api/client";
import { supabase } from "../lib/supabase";
import {
  ShieldCheck,
  Target,
  User,
  Scale,
  Ruler,
  Calendar,
  AlertTriangle,
  Utensils,
  ArrowRight,
  Lock,
  CheckCircle2,
  X,
} from "lucide-react";

interface FirstTimeOnboardingModalProps {
  onCompleted?: () => void;
}

export const FirstTimeOnboardingModal: React.FC<FirstTimeOnboardingModalProps> = ({ onCompleted }) => {
  const {
    currentUserEmail,
    currentUserName,
    currentUserNickname,
    setCurrentUserName,
    setCurrentUserNickname,
    setOnboardingCompleted,
    setAnamnesisDone,
    setWorkoutReleased,
    setDietReleased,
    setActiveView,
    setSelectedPlan,
    subscription,
  } = useApp();

  const [fullName, setFullName] = useState(currentUserName || "");
  const [nickname, setNickname] = useState(currentUserNickname || "");
  const [age, setAge] = useState<number | string>("");
  const [weightKg, setWeightKg] = useState<number | string>("");
  const [heightCm, setHeightCm] = useState<number | string>("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>("");
  const [medicalHistory, setMedicalHistory] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const GOAL_OPTIONS = [
    "Hipertrofia e Ganho de Massa",
    "Emagrecimento e Queima de Gordura",
    "Definição Muscular & Estética",
    "Condicionamento e Resistência",
    "Recomposição Corporal",
  ];

  const RESTRICTION_TAGS = [
    "Nenhuma",
    "Sem lactose",
    "Sem glúten",
    "Vegetariano",
    "Vegano",
    "Alergia a frutos do mar",
    "Alergia a amendoim/castanhas",
  ];

  const MEDICAL_TAGS = [
    "Nenhuma lesão prévia",
    "Dor lombar",
    "Lesão no joelho / Condromalácia",
    "Dor no ombro / Manguito rotador",
    "Hérnia de disco",
    "Hipertensão controlada",
  ];

  const handleSelectGoal = (goal: string) => {
    setPrimaryGoal(goal);
  };

  const handleToggleRestrictionTag = (tag: string) => {
    if (tag === "Nenhuma") {
      setDietaryRestrictions("Nenhuma");
      return;
    }
    const current = dietaryRestrictions.replace(/^Nenhuma,?\s*/i, "").trim();
    const list = current ? current.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (list.includes(tag)) {
      const filtered = list.filter((item) => item !== tag);
      setDietaryRestrictions(filtered.length > 0 ? filtered.join(", ") : "Nenhuma");
    } else {
      list.push(tag);
      setDietaryRestrictions(list.join(", "));
    }
  };

  const handleToggleMedicalTag = (tag: string) => {
    if (tag === "Nenhuma lesão prévia") {
      setMedicalHistory("Nenhuma lesão prévia");
      return;
    }
    const current = medicalHistory.replace(/^Nenhuma lesão prévia,?\s*/i, "").trim();
    const list = current ? current.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (list.includes(tag)) {
      const filtered = list.filter((item) => item !== tag);
      setMedicalHistory(filtered.length > 0 ? filtered.join(", ") : "Nenhuma lesão prévia");
    } else {
      list.push(tag);
      setMedicalHistory(list.join(", "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanFullName = fullName.trim();
    const cleanNickname = nickname.trim() || cleanFullName.split(" ")[0] || "Aluno";
    const numAge = Number(age);
    const numWeight = Number(weightKg);
    const numHeight = Number(heightCm);

    if (!cleanFullName) {
      setErrorMessage("Por favor, preencha seu nome completo.");
      return;
    }
    if (!numAge || numAge < 10 || numAge > 110) {
      setErrorMessage("Por favor, informe uma idade válida.");
      return;
    }
    if (!numWeight || numWeight < 30 || numWeight > 300) {
      setErrorMessage("Por favor, informe um peso atual válido em kg.");
      return;
    }
    if (!numHeight || numHeight < 100 || numHeight > 240) {
      setErrorMessage("Por favor, informe uma altura válida em centímetros.");
      return;
    }
    if (!primaryGoal.trim()) {
      setErrorMessage("Por favor, selecione ou descreva seu objetivo principal.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Obter usuário logado do Supabase se disponível
      let currentUserId = "me";
      let userEmail = currentUserEmail || "";

      if (supabase && supabase.auth) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            currentUserId = authData.user.id;
            userEmail = authData.user.email || userEmail;
          }
        } catch (authErr) {
          console.warn("Aviso ao ler usuário auth:", authErr);
        }
      }

      // 2. Salvar na API local (Express server)
      const payload = {
        user_id: currentUserId,
        email: userEmail,
        full_name: cleanFullName,
        nickname: cleanNickname,
        age: numAge,
        weight_kg: numWeight,
        height_cm: numHeight,
        primary_goal: primaryGoal.trim(),
        dietary_restrictions: dietaryRestrictions.trim() || "Nenhuma",
        medical_history: medicalHistory.trim() || "Nenhuma lesão",
        last_assessment_date: new Date().toISOString().split("T")[0],
      };

      await api.submitOnboarding(payload).catch((err) => {
        console.warn("Aviso na chamada /api/onboarding:", err);
      });

      // 3. Sincronização direta com o Supabase profiles (e student_onboarding)
      if (supabase && currentUserId && currentUserId !== "me") {
        try {
          // Upsert em profiles marcando onboarding_completed: true e travando releases
          const profileUpsertData: Record<string, any> = {
            id: currentUserId,
            full_name: cleanFullName,
            name: cleanFullName,
            nickname: cleanNickname,
            age: numAge,
            weight_kg: numWeight,
            height_cm: numHeight,
            onboarding_completed: true,
            workout_released: false,
            diet_released: false,
            last_assessment_date: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          };

          if (userEmail) {
            profileUpsertData.email = userEmail;
          }

          // Tenta atualizar com campos complementares
          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              ...profileUpsertData,
              primary_goal: primaryGoal.trim(),
              dietary_restrictions: dietaryRestrictions.trim(),
              medical_history: medicalHistory.trim(),
            },
            { onConflict: "id" }
          );

          if (profileError) {
            // Fallback caso colunas customizadas não existam
            await supabase.from("profiles").upsert(profileUpsertData, { onConflict: "id" });
          }

          // Salva na tabela dedicada student_onboarding
          try {
            await supabase.from("student_onboarding").upsert(
              {
                user_id: currentUserId,
                full_name: cleanFullName,
                nickname: cleanNickname,
                age: numAge,
                weight_kg: numWeight,
                height_cm: numHeight,
                primary_goal: primaryGoal.trim(),
                dietary_restrictions: dietaryRestrictions.trim(),
                medical_history: medicalHistory.trim(),
                onboarding_completed: true,
                workout_released: false,
                diet_released: false,
                created_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          } catch {}
        } catch (sbErr) {
          console.warn("Aviso ao sincronizar perfil Supabase:", sbErr);
        }
      }

      // 4. Atualizar Contexto React e LocalStorage
      setCurrentUserName(cleanFullName);
      setCurrentUserNickname(cleanNickname);
      setOnboardingCompleted(true);
      setAnamnesisDone(true);
      setWorkoutReleased(false);
      setDietReleased(false);

      localStorage.setItem("vyra_onboarding_completed", "true");
      localStorage.setItem("vyra_anamnesis", "true");
      localStorage.setItem("vyra_workout_released", "false");
      localStorage.setItem("vyra_diet_released", "false");
      localStorage.setItem("vyra_user_name", cleanFullName);
      localStorage.setItem("vyra_user_nickname", cleanNickname);

      // Notificar conclusão
      if (onCompleted) {
        onCompleted();
      }

      // Redireciona para o plano/paywall apenas se assinatura não estiver ativa
      if (!subscription.active) {
        setActiveView("paywall");
      } else {
        setActiveView("home");
      }
    } catch (err: any) {
      console.error("Erro ao salvar anamnese inicial:", err);
      setErrorMessage(
        err.message || "Ocorreu um erro ao salvar seus dados. Por favor, tente novamente."
      );
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setOnboardingCompleted(true);
    setAnamnesisDone(true);
    localStorage.setItem("vyra_onboarding_completed", "true");
    localStorage.setItem("vyra_anamnesis", "true");
    if (onCompleted) {
      onCompleted();
    }
  };

  return (
    <div
      id="first-time-onboarding-modal"
      className="fixed inset-0 z-[9999] bg-[#0A0A0A] overflow-y-auto flex flex-col justify-start items-center px-4 py-8 sm:py-12"
      style={{
        backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(255, 106, 42, 0.12) 0%, rgba(10, 10, 10, 1) 75%)",
      }}
    >
      <div className="w-full max-w-2xl bg-[#141416] border border-[#26262B] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative">
        {/* Botão Fechar / Dispensar */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-6 right-6 p-2 rounded-xl text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#1D1D1F] transition-all cursor-pointer z-10"
          title="Fechar anamnese"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header com Logo e Badge */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <VyraLogo size={36} />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF6A2A]/10 border border-[#FF6A2A]/30 text-[#FF6A2A] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anamnese Inicial Obrigatória</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
            Bem-vindo ao Protocolo VYRA
          </h1>

          <p className="text-sm text-[#9B9BA1] max-w-lg mx-auto leading-relaxed">
            Preencha seus dados biométricos e histórico de saúde para que seu Coach estruture seu protocolo exclusivo de periodização e nutrição.
          </p>
        </div>

        {/* Mensagem de Erro se houver */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome e Apelido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF6A2A]" />
                Nome Completo *
              </label>
              <input
                type="text"
                id="onboarding-fullname"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Rafael Mendes"
                className="w-full px-4 py-3 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF6A2A]" />
                Como gostaria de ser chamado (apelido) *
              </label>
              <input
                type="text"
                id="onboarding-nickname"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Rafa"
                className="w-full px-4 py-3 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors"
              />
            </div>
          </div>

          {/* Idade, Peso e Altura */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF6A2A]" />
                Idade *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="onboarding-age"
                  required
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ex: 28"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-[#8E8E93] font-medium pointer-events-none">
                  anos
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#FF6A2A]" />
                Peso Atual (kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="onboarding-weight"
                  required
                  step="0.1"
                  min={35}
                  max={250}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Ex: 75.0"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-[#8E8E93] font-medium pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-[#FF6A2A]" />
                Altura (cm) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="onboarding-height"
                  required
                  min={120}
                  max={230}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="Ex: 175"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-[#8E8E93] font-medium pointer-events-none">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Objetivo Principal */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#FF6A2A]" />
              Objetivo Principal *
            </label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((g) => {
                const selected = primaryGoal === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleSelectGoal(g)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? "bg-[#FF6A2A] text-white shadow-md shadow-[#FF6A2A]/20"
                        : "bg-[#1D1D20] text-[#A1A1A6] hover:bg-[#26262B] border border-[#2C2C32]"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              id="onboarding-goal-custom"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="Ou digite um objetivo personalizado..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors"
            />
          </div>

          {/* Restrições Alimentares / Alergias */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#FF6A2A]" />
              Restrições Alimentares / Alergias
            </label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_TAGS.map((tag) => {
                const isSelected =
                  dietaryRestrictions.toLowerCase().includes(tag.toLowerCase()) ||
                  (tag === "Nenhuma" && dietaryRestrictions === "Nenhuma");
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleRestrictionTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FF6A2A]/20 text-[#FF6A2A] border border-[#FF6A2A]/50 font-bold"
                        : "bg-[#1D1D20] text-[#8E8E93] hover:text-[#E5E5EA] border border-[#2C2C32]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <textarea
              id="onboarding-dietary-restrictions"
              rows={2}
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              placeholder="Ex: Intolerância severa à lactose, não como frutos do mar..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors resize-none"
            />
          </div>

          {/* Histórico de Lesões / Observações Médicas */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#E5E5EA] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A2A]" />
              Histórico de Lesões ou Observações Médicas
            </label>
            <div className="flex flex-wrap gap-2">
              {MEDICAL_TAGS.map((tag) => {
                const isSelected =
                  medicalHistory.toLowerCase().includes(tag.toLowerCase()) ||
                  (tag === "Nenhuma lesão prévia" && medicalHistory === "Nenhuma lesão prévia");
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleMedicalTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FF6A2A]/20 text-[#FF6A2A] border border-[#FF6A2A]/50 font-bold"
                        : "bg-[#1D1D20] text-[#8E8E93] hover:text-[#E5E5EA] border border-[#2C2C32]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <textarea
              id="onboarding-medical-history"
              rows={2}
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Ex: Cirurgia de menisco em 2023, dor no ombro em elevação lateral..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D20] border border-[#2C2C32] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A] transition-colors resize-none"
            />
          </div>

          {/* Card de Aviso de Segurança e Liberação Posterior */}
          <div className="p-4 rounded-2xl bg-[#1D1D20]/80 border border-[#2B2B30] flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#D8B46A] shrink-0 mt-0.5" />
            <div className="text-xs text-[#A1A1A6] space-y-1">
              <span className="font-bold text-[#F5F5F7] block">
                Liberação Individual pelo Treinador
              </span>
              <span>
                Por questões de segurança fisiológica e prescrição individualizada, suas abas de Treino e Dieta serão liberadas após a análise do Coach.
              </span>
            </div>
          </div>

          {/* Botão de Salvar e Continuar */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-save-onboarding"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#FF6A2A] hover:bg-[#FF8542] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#FF6A2A]/25 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Salvando anamnese e configurando perfil...</span>
              ) : (
                <>
                  <span>Salvar e Continuar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
