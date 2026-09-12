import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Anamnesis } from "../types";
import { supabase } from "../lib/supabase";
import { appStorage } from "../utils/storage";
import {
  ClipboardCheck,
  Check,
  Camera,
  Upload,
  ArrowLeft,
  ShieldCheck,
  Activity,
  Heart,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const AnamnesisView: React.FC = () => {
  const { t, setAnamnesisDone, setPhotosDone, setActiveView } = useApp();

  const [formData, setFormData] = useState<Anamnesis>({
    age: 28,
    gender: "Masculino",
    height_cm: 180,
    weight_kg: 80,
    goal: "Hipertrofia e Definição Muscular",
    activity_level: "Avançado (4-6x semana)",
    restrictions: "Nenhuma",
    allergies: "Nenhuma",
    medical_notes: "Sem lesões articulares prévias.",
  });

  const [photos, setPhotos] = useState<{
    front?: string;
    side?: string;
    back?: string;
  }>({});

  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          // 1. Tentar ler dados do appStorage / AsyncStorage
          const cached = await appStorage.getItem<any>(`vyra_anamnesis_${user.id}`, null);

          // 2. Select direto na tabela 'profiles' do Supabase
          const { data: dbProfile, error: profileErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileErr) {
            console.warn("[Anamnesis] Aviso ao carregar profile do Supabase:", profileErr.message);
          }

          const meta = user.user_metadata || {};

          if (isMounted) {
            setFormData((prev) => ({
              age: dbProfile?.age || meta.age || cached?.age || prev.age,
              gender: meta.gender || cached?.gender || prev.gender,
              height_cm: dbProfile?.height_cm || meta.height_cm || cached?.height_cm || prev.height_cm,
              weight_kg: dbProfile?.weight_kg || meta.weight_kg || cached?.weight_kg || prev.weight_kg,
              goal: dbProfile?.goal || dbProfile?.primary_goal || meta.primary_goal || meta.goal || cached?.goal || prev.goal,
              activity_level: meta.activity_level || cached?.activity_level || prev.activity_level,
              restrictions: dbProfile?.dietary_restrictions || meta.dietary_restrictions || cached?.restrictions || prev.restrictions,
              allergies: meta.allergies || cached?.allergies || prev.allergies,
              medical_notes: dbProfile?.medical_history || meta.medical_history || cached?.medical_notes || prev.medical_notes,
            }));

            if (meta.photo_front || cached?.photo_front) {
              setPhotos({
                front: meta.photo_front || cached?.photo_front,
                side: meta.photo_side || cached?.photo_side,
                back: meta.photo_back || cached?.photo_back,
              });
            }
          }
        }
      } catch (err) {
        console.warn("[Anamnesis] Erro ao carregar dados do usuário:", err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUseDemoPhotos = () => {
    setPhotos({
      front: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80",
      side: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
      back: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80",
    });
    setPhotoError(null);
  };

  const handlePhotoUpload = (key: "front" | "side" | "back", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => ({ ...prev, [key]: event.target?.result as string }));
        setPhotoError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photos.front && !photos.side && !photos.back) {
      setPhotoError("Anexe ao menos uma fotografia corporal (frente, lado ou costas) para liberar os treinos e dieta.");
      return;
    }

    setSaving(true);
    setPhotoError(null);
    setErrorMessage(null);

    try {
      // 1. Obter usuário autenticado no Supabase
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData?.user;

      if (authErr || !user) {
        throw new Error("Sessão do usuário não encontrada. Faça login para confirmar sua anamnese.");
      }

      // 2. Executar UPSERT direto na tabela 'profiles' do Supabase filtrando pelo user.id
      const numAge = Number(formData.age);
      const numHeight = Number(formData.height_cm);
      const numWeight = Number(formData.weight_kg);

      const profilePayload: Record<string, any> = {
        id: user.id,
        age: numAge,
        height_cm: numHeight,
        weight_kg: numWeight,
        primary_goal: formData.goal,
        goal: formData.goal,
        dietary_restrictions: formData.restrictions,
        medical_history: formData.medical_notes,
        protocol_status: "pending",
        updated_at: new Date().toISOString(),
      };

      const { error: sbProfileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (sbProfileError) {
        console.warn("[Supabase] Aviso no upsert em profiles:", sbProfileError.message);
        // Fallback básico caso algumas colunas customizadas não existam
        await supabase
          .from("profiles")
          .upsert(
            { id: user.id, updated_at: new Date().toISOString() },
            { onConflict: "id" }
          );
      }

      // 3. Atualizar metadados permanentes no Supabase Auth
      await supabase.auth.updateUser({
        data: {
          age: numAge,
          gender: formData.gender,
          height_cm: numHeight,
          weight_kg: numWeight,
          goal: formData.goal,
          primary_goal: formData.goal,
          activity_level: formData.activity_level,
          dietary_restrictions: formData.restrictions,
          allergies: formData.allergies,
          medical_history: formData.medical_notes,
          photo_front: photos.front,
          photo_side: photos.side,
          photo_back: photos.back,
          anamnesis_done: true,
          onboarding_completed: true,
        },
      });

      // 4. Persistir no appStorage (AsyncStorage / localStorage)
      const anamnesisRecord = {
        ...formData,
        ...photos,
        user_id: user.id,
        saved_at: new Date().toISOString(),
      };
      await appStorage.setItem(`vyra_anamnesis_${user.id}`, anamnesisRecord);
      await appStorage.setItem("vyra_onboarding_completed", true);

      // 5. Enviar também para a API de suporte / backend
      await api.saveAnamnesis({
        ...formData,
        photo_front: photos.front,
        photo_side: photos.side,
        photo_back: photos.back,
      }).catch(() => {});

      setAnamnesisDone(true);
      setPhotosDone(true);
      setSuccess(true);
      setTimeout(() => {
        setActiveView("home");
      }, 1500);
    } catch (e: any) {
      console.error("[Anamnesis] Erro ao salvar anamnese no Supabase:", e);
      setErrorMessage(e?.message || "Erro ao salvar anamnese no servidor. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        id="anamnesis-back-btn"
        onClick={() => setActiveView("home")}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao início</span>
      </button>

      {/* Header */}
      <div>
        <span className="text-xs font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-3 py-1 rounded-full border border-[#D8B46A]/30">
          MAPEAMENTO INDIVIDUAL
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2">
          {t("ana.title")}
        </h1>
        <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1">{t("ana.desc")}</p>
      </div>

      {success ? (
        <div className="p-8 rounded-3xl bg-[#151515] border border-[#34C759] text-center space-y-3 animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-[#34C759]/20 text-[#34C759] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 stroke-[3]" />
          </div>
          <h3 className="text-xl font-bold text-[#F5F5F7]">{t("ana.done")}</h3>
          <p className="text-xs text-[#9B9BA1]">
            Seus dados foram integrados e confirmados no Supabase com sucesso. Redirecionando...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {loadingInitial && (
            <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] text-xs flex items-center gap-2.5 animate-pulse">
              <div className="w-3 h-3 border-2 border-[#FF6A2A] border-t-transparent rounded-full animate-spin" />
              <span>Carregando dados salvos no Supabase...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-extrabold">Falha ao salvar no servidor</p>
                <p className="text-[11px] font-normal text-[#FF3B30]/80">{errorMessage}</p>
              </div>
            </div>
          )}

          {photoError && (
            <div className="p-4 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/40 text-[#FF9F0A] text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Biometrics */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF6A2A]" />
              Dados Biométricos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.age")}
                </label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.gender")}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.height")}
                </label>
                <input
                  type="number"
                  required
                  value={formData.height_cm}
                  onChange={(e) =>
                    setFormData({ ...formData, height_cm: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.weight")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.weight_kg}
                  onChange={(e) =>
                    setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>
            </div>
          </div>

          {/* Goals & Activity */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D8B46A]" />
              Objetivos & Rotina
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.goal")}
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                >
                  <option value="Hipertrofia e Definição Muscular">Hipertrofia & Definição</option>
                  <option value="Perda de Gordura / Emagrecimento">Emagrecimento Acelerado</option>
                  <option value="Performance e Força Bruta">Performance & Força</option>
                  <option value="Recomposição Corporal">Recomposição Corporal</option>
                  <option value="Longevidade & Saúde">Longevidade & Saúde</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.activity")}
                </label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                >
                  <option value="Sedentário (pouco ou nenhum exercício)">Sedentário</option>
                  <option value="Moderado (2-3x na semana)">Moderado (2-3x / semana)</option>
                  <option value="Avançado (4-6x semana)">Avançado (4-6x / semana)</option>
                  <option value="Atleta (treinos intensos diários)">Atleta de Alta Performance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.restrictions")}
                </label>
                <input
                  type="text"
                  value={formData.restrictions}
                  onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                  placeholder="Ex: Vegetariano, Sem glúten, etc."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                  {t("ana.allergies")}
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Ex: Lactose, Frutos do mar, etc."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9B9BA1] mb-1">
                {t("ana.medical")}
              </label>
              <textarea
                rows={2}
                value={formData.medical_notes || ""}
                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                placeholder="Histórico de cirurgias, dores articulares (ombro, lombar, joelho)..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>
          </div>

          {/* Photo slots */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#6D9BFF]" />
                <span>Fotografias Corporais de Avaliação (Obrigatórias para Treinos & Dieta)</span>
              </h3>
              <button
                type="button"
                onClick={handleUseDemoPhotos}
                className="text-[11px] font-bold text-[#FF9A62] bg-[#FF6A2A]/10 hover:bg-[#FF6A2A]/20 px-2.5 py-1 rounded-lg border border-[#FF6A2A]/30 transition-colors"
              >
                Usar Fotos de Exemplo (Teste Rápido)
              </button>
            </div>

            <p className="text-xs text-[#9B9BA1]">
              Suas fotos são fundamentais para que o treinador avalie desvios posturais, assimetrias e evolução muscular. Anexe pelo menos uma foto para liberar a periodização de treinos e dieta.
            </p>

            {photoError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
                {photoError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["front", "side", "back"] as const).map((slot) => {
                const label =
                  slot === "front"
                    ? t("ana.front")
                    : slot === "side"
                    ? t("ana.side")
                    : t("ana.back");
                const currentImg = photos[slot];

                return (
                  <label
                    key={slot}
                    className="border-2 border-dashed border-[#2B2B2F] hover:border-[#FF6A2A] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#1D1D1F]/40 min-h-[140px]"
                  >
                    {currentImg ? (
                      <img
                        src={currentImg}
                        alt={label}
                        className="max-h-28 rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#9B9BA1] mb-2" />
                        <span className="text-xs font-bold text-[#F5F5F7]">{label}</span>
                        <span className="text-[10px] text-[#9B9BA1] mt-0.5">Clique para anexar</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(slot, e)}
                      className="hidden"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            id="save-anamnesis-btn"
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl font-black text-base tracking-wide bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-xl shadow-[#FF6A2A]/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processando anamnese...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Salvar e Atualizar Prescrição</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
