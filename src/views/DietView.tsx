import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Diet, FoodItem } from "../types";
import { AccessGate } from "../components/AccessGate";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Sparkles,
  Camera,
  RefreshCw,
  Check,
  X,
  Upload,
  ChevronRight,
  Info,
  ChefHat,
  Flame,
  Search,
} from "lucide-react";

interface GeminiMealRecipe {
  nome_receita: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  ingredientes: string[];
}

export const DietView: React.FC = () => {
  const { t, lang, persona, subscription, anamnesisDone, photosDone } = useApp();
  const [diet, setDiet] = useState<Diet | null>(null);
  const [loading, setLoading] = useState(true);

  // Access Gating for Student
  if (persona === "student") {
    if (!subscription.active) {
      return (
        <AccessGate
          type="payment"
          tabName="dieta"
          title="Planejamento Alimentar Bloqueado"
          description="O plano nutricional e o módulo 'O que posso comer' são liberados exclusivamente após a ativação da sua assinatura Vyra."
        />
      );
    }

    if (!anamnesisDone || !photosDone) {
      return (
        <AccessGate
          type="anamnesis_photos"
          tabName="dieta"
          title="Complete sua Anamnese & Fotos para Liberar a Dieta"
          description="Para que o treinador prescreva sua dieta individualizada com máxima segurança e eficácia metabólica, é necessário concluir sua anamnese e anexar suas fotografias corporais."
        />
      );
    }
  }

  // Gemini Diet Assistant State
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [assistantGoal, setAssistantGoal] = useState("Hipertrofia e definição muscular");
  const [assistantRestrictions, setAssistantRestrictions] = useState("");
  const [assistantRecipes, setAssistantRecipes] = useState<GeminiMealRecipe[]>([]);
  const [loadingAssistant, setLoadingAssistant] = useState(false);

  // Substitution Modal State
  const [selectedMealToSwap, setSelectedMealToSwap] = useState<FoodItem | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ name: string; grams: number; kcal: number; p: number; c: number; f: number }>
  >([]);
  const [loadingAiSwap, setLoadingAiSwap] = useState(false);

  // Plate Analysis Modal State
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [plateImage, setPlateImage] = useState<string | null>(null);
  const [plateAnalysis, setPlateAnalysis] = useState<{
    name: string;
    kcal: number;
    p: number;
    c: number;
    f: number;
    grams: number;
  } | null>(null);
  const [loadingPlate, setLoadingPlate] = useState(false);

  useEffect(() => {
    api
      .getDiet()
      .then((data) => setDiet(data))
      .catch((err) => console.error("Error loading diet:", err))
      .finally(() => setLoading(false));
  }, []);

  const adjustKcal = (delta: number) => {
    if (!diet) return;
    const newKcal = Math.max(1200, Math.min(5000, diet.kcal + delta));
    const updated = { ...diet, kcal: newKcal };
    setDiet(updated);
    api.updateDiet({ kcal: newKcal }).catch(() => {});
  };

  const handleOpenSwap = async (item: FoodItem) => {
    setSelectedMealToSwap(item);
    setLoadingAiSwap(true);
    setAiSuggestions([]);
    try {
      const res = await api.dietSuggest(item.meal, item.name, lang);
      setAiSuggestions(res.suggestions || []);
    } catch (e) {
      console.error("AI diet swap error:", e);
    } finally {
      setLoadingAiSwap(false);
    }
  };

  const applyFoodSwap = (suggestion: {
    name: string;
    grams: number;
    kcal: number;
    p: number;
    c: number;
    f: number;
  }) => {
    if (!diet || !selectedMealToSwap) return;
    const updatedFoods = diet.foods.map((f) =>
      f.id === selectedMealToSwap.id
        ? {
            ...f,
            name: suggestion.name,
            grams: suggestion.grams,
            kcal: suggestion.kcal,
            p: suggestion.p,
            c: suggestion.c,
            f: suggestion.f,
          }
        : f
    );
    const updatedDiet = { ...diet, foods: updatedFoods };
    setDiet(updatedDiet);
    api.updateDiet({ foods: updatedFoods }).catch(() => {});
    setSelectedMealToSwap(null);
  };

  const handlePlateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPlateImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const runPlateAnalysis = async () => {
    setLoadingPlate(true);
    try {
      const res = await api.plateAnalyze(lang, plateImage || undefined);
      setPlateAnalysis(res);
    } catch (e) {
      console.error("Plate analysis error:", e);
    } finally {
      setLoadingPlate(false);
    }
  };

  const handleRunAssistant = async () => {
    if (!diet) return;
    setLoadingAssistant(true);
    try {
      const restrictionsList = assistantRestrictions
        ? assistantRestrictions.split(",").map((s) => s.trim())
        : [];
      const res = await api.dietAssistant(assistantGoal, diet.kcal, restrictionsList);
      setAssistantRecipes(res || []);
    } catch (e) {
      console.error("Error in Gemini diet assistant:", e);
    } finally {
      setLoadingAssistant(false);
    }
  };

  if (loading || !diet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[#9B9BA1]">
        <div className="w-8 h-8 border-2 border-[#FF6A2A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Carregando plano alimentar...</p>
      </div>
    );
  }

  // Grams calculations based on standard energy densities (4 kcal/g protein & carb, 9 kcal/g fat)
  const proteinGrams = Math.round((diet.kcal * (diet.protein_pct / 100)) / 4);
  const carbsGrams = Math.round((diet.kcal * (diet.carbs_pct / 100)) / 4);
  const fatsGrams = Math.round((diet.kcal * (diet.fats_pct / 100)) / 9);

  const mealLabels: Record<string, string> = {
    breakfast: t("meal.breakfast"),
    lunch: t("meal.lunch"),
    snack: t("meal.snack"),
    dinner: t("meal.dinner"),
    supper: t("meal.supper"),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-xs font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-3 py-1 rounded-full border border-[#FF6A2A]/30">
            {t("sec.diet")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2">
            Plano Alimentar Prescrito
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-diet-assistant-btn"
            onClick={() => setShowAssistantModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 transition-all flex items-center gap-2 shadow-md shadow-[#FF6A2A]/20 cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>O que posso comer</span>
          </button>

          <button
            id="open-plate-analysis-btn"
            onClick={() => setShowPlateModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#151515] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#FF6A2A] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#FF6A2A]" />
            <span>{t("cta.analyze_plate")}</span>
          </button>
        </div>
      </div>

      {/* Plan Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6A2A]/20 to-[#D8B46A]/20 border border-[#FF6A2A]/30 flex items-center justify-center text-[#FF6A2A] shrink-0 shadow-md">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#F5F5F7]">
              Prescrição Nutricional do Aluno
            </h2>
            <p className="text-xs text-[#9B9BA1] mt-0.5">
              Refeições estruturadas para o seu objetivo. Siga as porções e horários recomendados.
            </p>
          </div>
        </div>

        <button
          id="open-diet-assistant-banner-btn"
          onClick={() => setShowAssistantModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#FF6A2A]/40 text-[#FF9A62] hover:bg-[#FF6A2A]/10 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dúvidas? O que posso comer</span>
        </button>
      </div>

      {/* Meals List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
          Refeições Prescritas ({diet.foods.length})
        </h2>

        <div className="space-y-3">
          {diet.foods.map((food, idx) => (
            <div
              key={food.id}
              id={`meal-item-card-${food.id}`}
              className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] hover:border-[#4A4A52] transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-[#FF6A2A] bg-[#FF6A2A]/10 px-2 py-0.5 rounded-md">
                    {mealLabels[food.meal] || food.meal}
                  </span>
                  <span className="text-xs font-bold text-[#D8B46A]">{food.grams}g</span>
                </div>
                <h3 className="text-base font-bold text-[#F5F5F7]">{food.name}</h3>
                <p className="text-xs text-[#9B9BA1]">Porção planejada pelo seu treinador</p>
              </div>

              <button
                id={`swap-food-btn-${food.id}`}
                onClick={() => handleOpenSwap(food)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#D8B46A] hover:bg-[#D8B46A]/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("diet.substitute")}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Food Swap Modal */}
      {selectedMealToSwap && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151515] border border-[#D8B46A]/40 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F7]">{t("diet.ai_title")}</h3>
                  <p className="text-xs text-[#9B9BA1]">
                    Substitutos para:{" "}
                    <strong className="text-[#F5F5F7]">{selectedMealToSwap.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMealToSwap(null)}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAiSwap ? (
              <div className="py-12 text-center text-[#9B9BA1] space-y-2">
                <div className="w-7 h-7 border-2 border-[#D8B46A] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Consultando algoritmo nutricional...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    id={`ai-suggestion-card-${idx}`}
                    onClick={() => applyFoodSwap(sug)}
                    className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#D8B46A]">Opção 0{idx + 1}</span>
                        <span className="text-xs text-[#9B9BA1]">({sug.grams}g)</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#F5F5F7] mt-0.5 group-hover:text-[#D8B46A] transition-colors">
                        {sug.name}
                      </h4>
                      <p className="text-xs text-[#9B9BA1] mt-1">
                        Substituição equivalente recomendada
                      </p>
                    </div>

                    <button
                      id={`apply-swap-${idx}`}
                      className="w-8 h-8 rounded-full bg-[#151515] border border-[#2B2B2F] flex items-center justify-center text-[#D8B46A] group-hover:bg-[#D8B46A] group-hover:text-[#0A0A0A] transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Plate Analyzer Modal */}
      {showPlateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF6A2A]/20 text-[#FF6A2A] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F7]">{t("diet.plate_title")}</h3>
                  <p className="text-xs text-[#9B9BA1]">{t("diet.plate_desc")}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPlateModal(false);
                  setPlateAnalysis(null);
                  setPlateImage(null);
                }}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Area */}
            <div className="space-y-3">
              <label
                htmlFor="plate-image-upload"
                className="border-2 border-dashed border-[#2B2B2F] hover:border-[#FF6A2A] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#1D1D1F]/50 min-h-[160px]"
              >
                {plateImage ? (
                  <img
                    src={plateImage}
                    alt="Plate preview"
                    className="max-h-44 rounded-xl object-contain"
                  />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#9B9BA1] mb-2" />
                    <span className="text-xs font-bold text-[#F5F5F7]">
                      Clique para selecionar ou arraste uma foto
                    </span>
                    <span className="text-[10px] text-[#9B9BA1] mt-1">PNG, JPG até 10MB</span>
                  </>
                )}
                <input
                  id="plate-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePlateImageUpload}
                  className="hidden"
                />
              </label>

              <button
                id="run-plate-analysis-btn"
                onClick={runPlateAnalysis}
                disabled={loadingPlate}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loadingPlate ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando visão computacional...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estimar Macros do Prato</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis Result */}
            {plateAnalysis && (
              <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#34C759]/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#34C759] uppercase">
                    Análise Concluída
                  </span>
                  <span className="text-xs font-semibold text-[#9B9BA1]">
                    ~{plateAnalysis.grams}g
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#F5F5F7]">{plateAnalysis.name}</h4>

                <div className="p-3 rounded-xl bg-[#151515] border border-[#2B2B2F] space-y-1">
                  <span className="text-[11px] font-bold text-[#34C759] uppercase block">Avaliação do Prato</span>
                  <p className="text-xs text-[#E6E6EB]">
                    Prato balanceado e de acordo com a proposta da sua prescrição alimentar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Diet Assistant Modal ("O que posso comer") */}
      {showAssistantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#151515] border border-[#FF6A2A]/40 p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6A2A] to-[#D8B46A] text-white flex items-center justify-center shadow-lg shadow-[#FF6A2A]/20">
                  <ChefHat className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
                    O que posso comer
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6A2A]/20 text-[#FF9A62] border border-[#FF6A2A]/30">
                      Guia Inteligente
                    </span>
                  </h3>
                  <p className="text-xs text-[#9B9BA1]">
                    Tire dúvidas e descubra receitas saborosas e saudáveis para a sua rotina
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssistantModal(false)}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#9B9BA1]">Objetivo do Aluno</label>
                <select
                  value={assistantGoal}
                  onChange={(e) => setAssistantGoal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-semibold focus:outline-none focus:border-[#FF6A2A]"
                >
                  <option value="Hipertrofia e ganho de massa magra">Hipertrofia & Massa Magra</option>
                  <option value="Definição e queima de gordura">Definição & Cutting</option>
                  <option value="Recomposição corporal">Recomposição Corporal</option>
                  <option value="Aumento de força e performance atlética">Força & Performance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#9B9BA1]">Restrições / Preferências</label>
                <input
                  type="text"
                  placeholder="Ex: sem lactose, sem glúten, vegetariano"
                  value={assistantRestrictions}
                  onChange={(e) => setAssistantRestrictions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>
            </div>

            {/* Action button */}
            <button
              id="generate-assistant-recipes-btn"
              onClick={handleRunAssistant}
              disabled={loadingAssistant}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A2A]/20 cursor-pointer"
            >
              {loadingAssistant ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparando sugestões de refeições saudáveis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Sugerir Refeições Saudáveis</span>
                </>
              )}
            </button>

            {/* Recipe Output Cards */}
            {assistantRecipes.length > 0 && (
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#D8B46A]">
                  Sugestões Selecionadas ({assistantRecipes.length})
                </h4>

                <div className="space-y-3">
                  {assistantRecipes.map((recipe, index) => (
                    <div
                      key={index}
                      className="p-4 sm:p-5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#FF6A2A]/60 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-[#FF6A2A] bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-md border border-[#FF6A2A]/30">
                            Opção 0{index + 1}
                          </span>
                          <h5 className="text-sm sm:text-base font-extrabold text-[#F5F5F7]">
                            {recipe.nome_receita}
                          </h5>
                        </div>
                      </div>

                      {/* Ingredients */}
                      {recipe.ingredientes && recipe.ingredientes.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block mb-1.5">
                            Ingredientes & Modo de Preparo:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#E6E6EB]">
                            {recipe.ingredientes.map((ing, iIdx) => (
                              <li key={iIdx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#34C759] shrink-0 mt-0.5" />
                                <span>{ing}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
