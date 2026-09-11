import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api, PlateAnalysisResult, PlateFoodItem } from "../api/client";
import { Diet, FoodItem, MealIngredient } from "../types";
import { AccessGate } from "../components/AccessGate";
import { EmptyStatePaywall } from "../components/EmptyStatePaywall";
import { getMealIngredients, getMealPrepInstructions } from "../utils/dietIngredients";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Camera,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChefHat,
  Flame,
  Clock,
  BookOpen,
  ShoppingBag,
  ListOrdered,
  ArrowRight,
  Trash2,
  Scale,
  SlidersHorizontal,
  Edit2,
  Sliders,
} from "lucide-react";

interface GeminiMealRecipe {
  nome_receita: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  ingredientes: string[];
}

interface IngredientRecipeItem {
  nome_receita: string;
  tipo_refeicao: string;
  tempo_preparo: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  ingredientes: Array<{ name: string; quantity: string }>;
  modo_preparo: string[];
  dica_chef: string;
}

const COMMON_INGREDIENTS = [
  "Frango",
  "Ovos",
  "Arroz",
  "Batata Doce",
  "Aveia",
  "Whey",
  "Banana",
  "Queijo",
  "Atum",
  "Brócolis",
  "Azeite",
  "Patinho Moído",
  "Tomate",
  "Pasta de Amendoim",
];

export const DietView: React.FC = () => {
  const {
    t,
    lang,
    persona,
    subscription,
    anamnesisDone,
    photosDone,
    setActiveView,
    currentUserEmail,
    dietReleased: appDietReleased,
    setDietReleased: setAppDietReleased,
  } = useApp();
  const [diet, setDiet] = useState<Diet | null>(null);
  const [loading, setLoading] = useState(true);

  const isCoach =
    persona === "coach" ||
    Boolean(
      currentUserEmail &&
        [
          "coach@vyra.club",
          "mari@vyra.club",
          "treinador@vyra.club",
          "admin@vyra.club",
          "headcoach@vyra.club",
          "cubocao@gmail.com",
        ].includes(currentUserEmail.toLowerCase())
    );

  // Access Gating for Student
  if (!isCoach && persona === "student") {
    if (!subscription.active || (subscription as any)?.status === "inactive") {
      return (
        <EmptyStatePaywall
          message="Assinatura Inativa. Libere seu acesso para visualizar seu treino e dieta."
          buttonText="Assinar Agora"
          onGoToProfile={() => setActiveView("paywall")}
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

  // Expanded state for prescribed meals
  const [expandedMealIds, setExpandedMealIds] = useState<Record<string, boolean>>({});
  const [expandedPrepMealIds, setExpandedPrepMealIds] = useState<Record<string, boolean>>({});

  // Gemini Diet Assistant State ("O que posso comer")
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [assistantTab, setAssistantTab] = useState<"ingredients" | "goal">("ingredients");

  // Tab 1: Ingredientes
  const [ingredientInput, setIngredientInput] = useState("frango, ovos, batata doce, aveia, tomate, azeite");
  const [ingredientMealType, setIngredientMealType] = useState("all");
  const [ingredientRecipes, setIngredientRecipes] = useState<IngredientRecipeItem[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [expandedPrepRecipes, setExpandedPrepRecipes] = useState<Record<number, boolean>>({});

  // Tab 2: Objetivo
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
  const [plateAnalysis, setPlateAnalysis] = useState<PlateAnalysisResult | null>(null);
  const [loadingPlate, setLoadingPlate] = useState(false);
  const [showAddFoodPlate, setShowAddFoodPlate] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddGrams, setQuickAddGrams] = useState(100);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [plateLoggedSuccess, setPlateLoggedSuccess] = useState(false);
  const [dietReleased, setDietReleased] = useState<boolean>(() =>
    appDietReleased !== undefined ? appDietReleased : true
  );

  useEffect(() => {
    if (appDietReleased !== undefined) {
      setDietReleased(appDietReleased);
    }
  }, [appDietReleased]);

  useEffect(() => {
    api
      .getDiet()
      .then((data) => {
        if (data.diet_released !== undefined) {
          const isRel = Boolean(data.diet_released);
          setDietReleased(isRel);
          setAppDietReleased(isRel);
        }
        // Enriquecer alimentos prescritos com quantidades e modo de preparo caso não estejam populados
        const enrichedFoods = data.foods.map((food) => {
          const ingredients = food.ingredients && food.ingredients.length > 0
            ? food.ingredients
            : getMealIngredients(food.name, food.grams);
          const recipe_instructions = food.recipe_instructions && food.recipe_instructions.length > 0
            ? food.recipe_instructions
            : getMealPrepInstructions(food.name);
          return {
            ...food,
            ingredients,
            recipe_instructions,
          };
        });
        setDiet({ ...data, foods: enrichedFoods });
      })
      .catch((err) => console.error("Error loading diet:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDietRelease = async () => {
    try {
      const next = !dietReleased;
      setDietReleased(next);
      setAppDietReleased(next);
      await api.toggleDietRelease(next);
    } catch (err) {
      console.error("Erro ao alterar liberação da dieta:", err);
    }
  };

  const toggleMealExpand = (id: string) => {
    setExpandedMealIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMealPrep = (id: string) => {
    setExpandedPrepMealIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRecipePrep = (index: number) => {
    setExpandedPrepRecipes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleAddIngredientTag = (ing: string) => {
    const list = ingredientInput
      ? ingredientInput.split(",").map((s) => s.trim().toLowerCase())
      : [];
    if (!list.includes(ing.toLowerCase())) {
      const next = ingredientInput.trim()
        ? `${ingredientInput.trim()}, ${ing}`
        : ing;
      setIngredientInput(next);
    }
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

    // Recalcula quantidades específicas de cada ingrediente e modo de preparo
    const newIngredients = getMealIngredients(suggestion.name, suggestion.grams);
    const newInstructions = getMealPrepInstructions(suggestion.name);

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
            ingredients: newIngredients,
            recipe_instructions: newInstructions,
          }
        : f
    );

    const updatedDiet = { ...diet, foods: updatedFoods };
    setDiet(updatedDiet);
    // Abre o card automaticamente para o aluno conferir os novos ingredientes recalculados
    setExpandedMealIds((prev) => ({ ...prev, [selectedMealToSwap.id]: true }));
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
    setPlateLoggedSuccess(false);
    try {
      const res = await api.plateAnalyze(lang, plateImage || undefined);
      setPlateAnalysis(res);
    } catch (e) {
      console.error("Plate analysis error:", e);
    } finally {
      setLoadingPlate(false);
    }
  };

  const handleUpdatePlateFoodGrams = (foodId: string, newGrams: number) => {
    if (!plateAnalysis) return;
    const safeGrams = Math.max(0, Math.round(newGrams));
    const updatedFoods = plateAnalysis.foods.map((food) => {
      if (food.id !== foodId) return food;
      const ratio = safeGrams / 100;
      return {
        ...food,
        grams: safeGrams,
        kcal: Math.round(food.per_100g.kcal * ratio),
        p: Number((food.per_100g.p * ratio).toFixed(1)),
        c: Number((food.per_100g.c * ratio).toFixed(1)),
        f: Number((food.per_100g.f * ratio).toFixed(1)),
      };
    });

    const total_grams = updatedFoods.reduce((acc, f) => acc + f.grams, 0);
    const kcal = updatedFoods.reduce((acc, f) => acc + f.kcal, 0);
    const p = Number(updatedFoods.reduce((acc, f) => acc + f.p, 0).toFixed(1));
    const c = Number(updatedFoods.reduce((acc, f) => acc + f.c, 0).toFixed(1));
    const f = Number(updatedFoods.reduce((acc, f) => acc + f.f, 0).toFixed(1));

    setPlateAnalysis({
      ...plateAnalysis,
      foods: updatedFoods,
      total_grams,
      kcal,
      p,
      c,
      f,
    });
  };

  const handleUpdatePlateFoodName = (foodId: string, newName: string) => {
    if (!plateAnalysis) return;
    const updatedFoods = plateAnalysis.foods.map((food) =>
      food.id === foodId ? { ...food, name: newName } : food
    );
    setPlateAnalysis({ ...plateAnalysis, foods: updatedFoods });
  };

  const handleUpdatePlateFoodMacroPer100g = (
    foodId: string,
    field: "p" | "c" | "f" | "kcal",
    value: number
  ) => {
    if (!plateAnalysis) return;
    const safeVal = Math.max(0, Number(value) || 0);
    const updatedFoods = plateAnalysis.foods.map((food) => {
      if (food.id !== foodId) return food;
      const newPer100 = { ...food.per_100g, [field]: safeVal };
      if (field !== "kcal") {
        newPer100.kcal = Math.round(newPer100.p * 4 + newPer100.c * 4 + newPer100.f * 9);
      }
      const ratio = food.grams / 100;
      return {
        ...food,
        per_100g: newPer100,
        kcal: Math.round(newPer100.kcal * ratio),
        p: Number((newPer100.p * ratio).toFixed(1)),
        c: Number((newPer100.c * ratio).toFixed(1)),
        f: Number((newPer100.f * ratio).toFixed(1)),
      };
    });

    const total_grams = updatedFoods.reduce((acc, f) => acc + f.grams, 0);
    const kcal = updatedFoods.reduce((acc, f) => acc + f.kcal, 0);
    const p = Number(updatedFoods.reduce((acc, f) => acc + f.p, 0).toFixed(1));
    const c = Number(updatedFoods.reduce((acc, f) => acc + f.c, 0).toFixed(1));
    const f = Number(updatedFoods.reduce((acc, f) => acc + f.f, 0).toFixed(1));

    setPlateAnalysis({
      ...plateAnalysis,
      foods: updatedFoods,
      total_grams,
      kcal,
      p,
      c,
      f,
    });
  };

  const handleRemovePlateFood = (foodId: string) => {
    if (!plateAnalysis) return;
    const updatedFoods = plateAnalysis.foods.filter((f) => f.id !== foodId);
    const total_grams = updatedFoods.reduce((acc, f) => acc + f.grams, 0);
    const kcal = updatedFoods.reduce((acc, f) => acc + f.kcal, 0);
    const p = Number(updatedFoods.reduce((acc, f) => acc + f.p, 0).toFixed(1));
    const c = Number(updatedFoods.reduce((acc, f) => acc + f.c, 0).toFixed(1));
    const f = Number(updatedFoods.reduce((acc, f) => acc + f.f, 0).toFixed(1));

    setPlateAnalysis({
      ...plateAnalysis,
      foods: updatedFoods,
      total_grams,
      kcal,
      p,
      c,
      f,
    });
  };

  const handleAddPlateFood = (
    name: string,
    grams: number,
    per100 = { kcal: 150, p: 12, c: 15, f: 4 }
  ) => {
    if (!plateAnalysis || !name.trim()) return;
    const safeGrams = Math.max(1, Math.round(grams));
    const ratio = safeGrams / 100;
    const newFood: PlateFoodItem = {
      id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      grams: safeGrams,
      kcal: Math.round(per100.kcal * ratio),
      p: Number((per100.p * ratio).toFixed(1)),
      c: Number((per100.c * ratio).toFixed(1)),
      f: Number((per100.f * ratio).toFixed(1)),
      per_100g: per100,
    };

    const updatedFoods = [...plateAnalysis.foods, newFood];
    const total_grams = updatedFoods.reduce((acc, f) => acc + f.grams, 0);
    const kcal = updatedFoods.reduce((acc, f) => acc + f.kcal, 0);
    const p = Number(updatedFoods.reduce((acc, f) => acc + f.p, 0).toFixed(1));
    const c = Number(updatedFoods.reduce((acc, f) => acc + f.c, 0).toFixed(1));
    const f = Number(updatedFoods.reduce((acc, f) => acc + f.f, 0).toFixed(1));

    setPlateAnalysis({
      ...plateAnalysis,
      foods: updatedFoods,
      total_grams,
      kcal,
      p,
      c,
      f,
    });
    setQuickAddName("");
    setShowAddFoodPlate(false);
  };

  // Gerar opções por ingredientes
  const handleGenerateByIngredients = async () => {
    if (!diet) return;
    setLoadingIngredients(true);
    try {
      const cleanList = ingredientInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.recipesByIngredients({
        ingredientes: cleanList.length > 0 ? cleanList : ["frango", "ovos", "arroz", "aveia"],
        tipo_refeicao: ingredientMealType === "all" ? undefined : ingredientMealType,
        calorias_alvo: diet.kcal,
      });

      setIngredientRecipes(res || []);
      // Reseta os estados de modo de preparo expandidos
      setExpandedPrepRecipes({});
    } catch (e) {
      console.error("Erro ao gerar pratos por ingredientes:", e);
    } finally {
      setLoadingIngredients(false);
    }
  };

  // Sugestões gerais por objetivo
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
            Plano Alimentar
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-diet-assistant-btn"
            onClick={() => {
              setAssistantTab("ingredients");
              setShowAssistantModal(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 transition-all flex items-center gap-2 shadow-md shadow-[#FF6A2A]/20 cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>O que posso comer</span>
          </button>

          <button
            id="open-plate-analysis-btn"
            onClick={() => setShowPlateModal(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#151515] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#FF6A2A] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#FF6A2A]" />
            <span>{t("cta.analyze_plate")}</span>
          </button>
        </div>
      </div>

      {/* Refeições Prescritas (Blocos com Botão de Expandir Ingredientes & Quantidades Recalculadas) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#FF6A2A]" />
              Refeições Prescritas {dietReleased ? `(${diet.foods.length})` : ""}
            </h2>
            {isCoach && (
              <button
                type="button"
                onClick={handleToggleDietRelease}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  dietReleased
                    ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30 hover:bg-[#34C759]/25"
                    : "bg-[#D8B46A]/15 text-[#D8B46A] border-[#D8B46A]/30 hover:bg-[#D8B46A]/25"
                }`}
              >
                {dietReleased ? "Liberado pelo Coach (Bloquear)" : "Bloqueado (Liberar Dieta)"}
              </button>
            )}
          </div>
          {dietReleased && (
            <span className="text-[11px] text-[#6E6E73]">Toque em uma refeição para ver quantidades</span>
          )}
        </div>

        {dietReleased ? (
        <div className="space-y-3">
          {diet.foods.map((food) => {
            const isExpanded = Boolean(expandedMealIds[food.id]);
            const isPrepExpanded = Boolean(expandedPrepMealIds[food.id]);
            const ingredientsList = food.ingredients && food.ingredients.length > 0
              ? food.ingredients
              : getMealIngredients(food.name, food.grams);
            const prepInstructions = food.recipe_instructions && food.recipe_instructions.length > 0
              ? food.recipe_instructions
              : getMealPrepInstructions(food.name);

            return (
              <div
                key={food.id}
                id={`meal-item-card-${food.id}`}
                className={`rounded-2xl bg-[#151515] border transition-all overflow-hidden ${
                  isExpanded ? "border-[#FF6A2A]/60 shadow-lg shadow-[#FF6A2A]/5" : "border-[#2B2B2F] hover:border-[#3D3D45]"
                }`}
              >
                {/* Meal Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase text-[#FF6A2A] bg-[#FF6A2A]/10 px-2.5 py-0.5 rounded-md border border-[#FF6A2A]/20">
                        {mealLabels[food.meal] || food.meal}
                      </span>
                      <span className="text-xs font-extrabold text-[#D8B46A]">
                        {food.grams}g totais
                      </span>
                      {food.kcal && (
                        <span className="text-xs font-bold text-[#9B9BA1] flex items-center gap-1">
                          <Flame className="w-3 h-3 text-[#FF6A2A]" />
                          {food.kcal} kcal
                        </span>
                      )}
                      {(food.p !== undefined || food.c !== undefined || food.f !== undefined) && (
                        <span className="text-[11px] text-[#6E6E73] font-medium hidden sm:inline">
                          P: <strong className="text-[#F5F5F7]">{food.p || 0}g</strong> · C:{" "}
                          <strong className="text-[#F5F5F7]">{food.c || 0}g</strong> · G:{" "}
                          <strong className="text-[#F5F5F7]">{food.f || 0}g</strong>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#F5F5F7] leading-snug">
                      {food.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id={`swap-food-btn-${food.id}`}
                      onClick={() => handleOpenSwap(food)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#D8B46A] hover:bg-[#D8B46A]/20 hover:border-[#D8B46A]/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Substituir alimento"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Substituir</span>
                    </button>

                    <button
                      id={`expand-meal-btn-${food.id}`}
                      onClick={() => toggleMealExpand(food.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isExpanded
                          ? "bg-[#FF6A2A]/15 border-[#FF6A2A]/50 text-[#FF9A62]"
                          : "bg-[#1D1D1F] border-[#2B2B2F] text-[#F5F5F7] hover:bg-[#26262A]"
                      }`}
                    >
                      <span>{isExpanded ? "Ocultar Ingredientes" : "Ingredientes & Quantidades"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#FF6A2A]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#9B9BA1]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Ingredients Details & Preparation Block */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#26262A] space-y-4 bg-[#111112]/60 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#D8B46A] flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#D8B46A]" />
                          Ingredientes & Quantidades Exatas do Aluno:
                        </span>
                        <span className="text-[10px] text-[#9B9BA1] font-medium">
                          Recalculado para sua meta
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {ingredientsList.map((ing, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#1A1A1C] border border-[#2B2B2F] flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] shrink-0" />
                              <span className="text-xs font-semibold text-[#E6E6EB] truncate">
                                {ing.name}
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-[#D8B46A] bg-[#D8B46A]/10 px-2 py-0.5 rounded-md border border-[#D8B46A]/20 shrink-0">
                              {ing.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botão de Ensinar a Fazer / Modo de Preparo */}
                    <div className="pt-1">
                      <button
                        id={`btn-toggle-meal-prep-${food.id}`}
                        onClick={() => toggleMealPrep(food.id)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isPrepExpanded
                            ? "bg-[#D8B46A]/20 border-[#D8B46A]/60 text-[#D8B46A]"
                            : "bg-[#1D1D1F] border-[#2B2B2F] text-[#F5F5F7] hover:bg-[#252528] hover:border-[#D8B46A]/30"
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-[#D8B46A]" />
                        <span>
                          {isPrepExpanded
                            ? "Ocultar Modo de Preparo"
                            : "👨‍🍳 Ensinar a Fazer o Prato (Modo de Preparo)"}
                        </span>
                        {isPrepExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isPrepExpanded && (
                        <div className="mt-3 p-4 rounded-2xl bg-[#18181B] border border-[#D8B46A]/30 space-y-2.5 animate-in fade-in duration-200">
                          <span className="text-[11px] font-black uppercase text-[#D8B46A] tracking-wider block">
                            Passo a Passo de Preparo:
                          </span>
                          <ol className="space-y-2 text-xs text-[#E6E6EB]">
                            {prepInstructions.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-[#D8B46A]/40">
                                  {sIdx + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#151515] border border-[#2B2B2F] text-center space-y-4 max-w-lg mx-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-[#D8B46A]/15 text-[#D8B46A] flex items-center justify-center mx-auto border border-[#D8B46A]/30">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[#F5F5F7] tracking-tight">
                Aguardando resposta do coach
              </h2>
              <p className="text-sm text-[#9B9BA1] leading-relaxed">
                Seu treinador está analisando suas respostas e montando o seu planejamento alimentar individualizado. Em breve suas refeições prescritas estarão disponíveis aqui.
              </p>
            </div>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#D8B46A]">
                <Flame className="w-3.5 h-3.5" />
                <span>Utilize "O que posso comer" e "Analisar prato" acima</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Food Swap Modal */}
      {selectedMealToSwap && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151515] border border-[#D8B46A]/40 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
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
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#9B9BA1]">
              Ao escolher um substituto, os macros e as <strong>quantidades exatas dos ingredientes</strong> serão recalculados automaticamente para você.
            </div>

            {loadingAiSwap ? (
              <div className="py-12 text-center text-[#9B9BA1] space-y-2">
                <div className="w-6 h-6 border-2 border-[#D8B46A] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Calculando equivalência calórica com IA...</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {aiSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A]/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-[#F5F5F7]">{sug.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-[#9B9BA1] mt-0.5">
                        <span className="font-bold text-[#D8B46A]">{sug.grams}g</span>
                        <span>•</span>
                        <span>{sug.kcal} kcal</span>
                        <span>•</span>
                        <span>P: {sug.p}g / C: {sug.c}g / G: {sug.f}g</span>
                      </div>
                    </div>
                    <button
                      id={`apply-swap-btn-${idx}`}
                      onClick={() => applyFoodSwap(sug)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D8B46A] text-black hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      Escolher
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plate Analysis Modal with Editable Food Quantities */}
      {showPlateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#151515] border border-[#FF6A2A]/40 p-5 sm:p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6A2A] to-[#D8B46A] text-white flex items-center justify-center shadow-md shadow-[#FF6A2A]/20">
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#F5F5F7]">
                    {t("cta.analyze_plate")}
                  </h3>
                  <p className="text-[11px] text-[#9B9BA1]">
                    Visão computacional + Ajuste manual de quantitativos e macros
                  </p>
                </div>
              </div>
              <button
                id="close-plate-modal-btn"
                onClick={() => {
                  setShowPlateModal(false);
                  setPlateAnalysis(null);
                  setPlateImage(null);
                  setShowAddFoodPlate(false);
                  setPlateLoggedSuccess(false);
                }}
                className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#4A4A52] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Upload Box */}
            <div className="space-y-3">
              <label className="block p-4 sm:p-5 rounded-2xl border-2 border-dashed border-[#2B2B2F] hover:border-[#FF6A2A] text-center cursor-pointer transition-colors bg-[#0D0D0E]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePlateImageUpload}
                  className="hidden"
                />
                {plateImage ? (
                  <div className="relative group">
                    <img
                      src={plateImage}
                      alt="Foto do Prato"
                      className="max-h-52 mx-auto rounded-xl object-cover shadow-lg"
                    />
                    <div className="mt-2 text-xs text-[#FF9A62] font-semibold flex items-center justify-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      <span>Toque para trocar a imagem</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4 text-[#9B9BA1]">
                    <Camera className="w-9 h-9 mx-auto text-[#FF6A2A]" />
                    <p className="text-xs sm:text-sm font-bold text-[#F5F5F7]">
                      Tirar foto ou enviar imagem do seu prato
                    </p>
                    <p className="text-[11px] text-[#6E6E73]">
                      A IA identificará cada alimento e estimará as gramas automaticamente
                    </p>
                  </div>
                )}
              </label>

              <button
                id="run-plate-analysis-btn"
                onClick={runPlateAnalysis}
                disabled={loadingPlate}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A2A]/25 cursor-pointer active:scale-95"
              >
                {loadingPlate ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analisando prato com Inteligência Artificial...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>{plateAnalysis ? "Reanalisar Prato com IA" : "Identificar Alimentos e Macros"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis Results & Editable Quantities */}
            {plateAnalysis && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#18181A] border border-[#FF6A2A]/30 space-y-4 animate-in fade-in duration-200">
                {/* Plate Name & Total Grams */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#2B2B2F]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black tracking-widest text-[#34C759] uppercase">
                        Prato Identificado
                      </span>
                      <span className="text-[10px] text-[#9B9BA1]">• Peso Total: ~{plateAnalysis.total_grams}g</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-[#F5F5F7] mt-0.5">
                      {plateAnalysis.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#FF6A2A]">{plateAnalysis.kcal}</span>
                    <span className="text-xs font-bold text-[#9B9BA1] ml-1">kcal</span>
                  </div>
                </div>

                {/* 4 Grand Total Macro Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#FF6A2A]/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#FF9A62] uppercase tracking-wider">
                      Calorias
                    </span>
                    <span className="text-lg font-black text-[#F5F5F7] mt-0.5">
                      {plateAnalysis.kcal} <span className="text-[11px] font-medium text-[#9B9BA1]">kcal</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#FF453A]/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#FF453A] uppercase tracking-wider">
                      Proteínas
                    </span>
                    <span className="text-lg font-black text-[#F5F5F7] mt-0.5">
                      {plateAnalysis.p} <span className="text-[11px] font-medium text-[#FF453A]">g</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#D8B46A]/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#D8B46A] uppercase tracking-wider">
                      Carboidratos
                    </span>
                    <span className="text-lg font-black text-[#F5F5F7] mt-0.5">
                      {plateAnalysis.c} <span className="text-[11px] font-medium text-[#D8B46A]">g</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#64D2FF]/30 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#64D2FF] uppercase tracking-wider">
                      Gorduras
                    </span>
                    <span className="text-lg font-black text-[#F5F5F7] mt-0.5">
                      {plateAnalysis.f} <span className="text-[11px] font-medium text-[#64D2FF]">g</span>
                    </span>
                  </div>
                </div>

                {/* Nutritional Coach Assessment */}
                {plateAnalysis.assessment && (
                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#2B2B2F] space-y-1">
                    <span className="text-[10px] font-bold text-[#D8B46A] uppercase tracking-wider flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />
                      Avaliação Nutricional da IA
                    </span>
                    <p className="text-xs text-[#E5E5EA] leading-relaxed">
                      {plateAnalysis.assessment}
                    </p>
                  </div>
                )}

                {/* Section: Editable Quantities of each food */}
                <div className="space-y-2.5 pt-2 border-t border-[#2B2B2F]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-[#F5F5F7] flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF6A2A]" />
                        Quantitativos de Cada Alimento (Editável)
                      </h5>
                      <p className="text-[10px] text-[#9B9BA1]">
                        Altere os gramas abaixo para recalcular proteína, carbo e gordura instantaneamente
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddFoodPlate(!showAddFoodPlate)}
                      className="px-2.5 py-1 rounded-lg bg-[#252528] hover:bg-[#303035] text-[11px] font-bold text-[#D8B46A] border border-[#D8B46A]/30 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Alimento</span>
                    </button>
                  </div>

                  {/* Quick Add Custom Food Form */}
                  {showAddFoodPlate && (
                    <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#D8B46A]/40 space-y-2.5 animate-in fade-in duration-150">
                      <span className="text-[11px] font-bold text-[#D8B46A]">
                        Adicionar alimento ao prato:
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={quickAddName}
                          onChange={(e) => setQuickAddName(e.target.value)}
                          placeholder="Nome (ex: Ovo Cozido, Azeite, Whey)..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#D8B46A]"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="1500"
                            value={quickAddGrams}
                            onChange={(e) => setQuickAddGrams(Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs font-bold text-center text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                          />
                          <span className="text-xs text-[#9B9BA1]">g</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (quickAddName.trim()) {
                                handleAddPlateFood(quickAddName, quickAddGrams);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#D8B46A] text-black font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Inserir
                          </button>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { name: "Ovo Cozido", g: 50, per: { kcal: 140, p: 13, c: 1, f: 9.5 } },
                          { name: "Azeite de Oliva", g: 10, per: { kcal: 884, p: 0, c: 0, f: 100 } },
                          { name: "Batata Doce", g: 100, per: { kcal: 86, p: 1.6, c: 20, f: 0.1 } },
                          { name: "Whey Protein", g: 30, per: { kcal: 400, p: 80, c: 6, f: 4 } },
                          { name: "Salada Verde", g: 80, per: { kcal: 15, p: 1.2, c: 2.5, f: 0.2 } },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleAddPlateFood(preset.name, preset.g, preset.per)}
                            className="px-2 py-0.5 rounded-md bg-[#1D1D1F] border border-[#2B2B2F] text-[10px] text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#D8B46A]/50 transition-colors"
                          >
                            + {preset.name} ({preset.g}g)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List of Individual Foods */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {plateAnalysis.foods.map((food) => {
                      const isEditing = editingFoodId === food.id;
                      return (
                        <div
                          key={food.id}
                          className="p-3.5 rounded-2xl bg-[#0F0F10] border border-[#2B2B2F] space-y-3 transition-all hover:border-[#3D3D42]"
                        >
                          {/* Row 1: Food Name, Quick Macro Pills & Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#FF6A2A] shrink-0" />
                                <input
                                  type="text"
                                  value={food.name}
                                  onChange={(e) => handleUpdatePlateFoodName(food.id, e.target.value)}
                                  className="text-xs sm:text-sm font-bold text-[#F5F5F7] bg-transparent hover:bg-[#151515] focus:bg-[#151515] px-1.5 py-0.5 rounded border border-transparent hover:border-[#2B2B2F] focus:border-[#FF6A2A] focus:outline-none w-full max-w-sm transition-colors"
                                  title="Clique para editar o nome do alimento"
                                />
                              </div>

                              {/* Live Macro Breakdown for this specific food */}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-[#F5F5F7] bg-[#18181A] px-2 py-0.5 rounded-md border border-[#2B2B2F]">
                                  {food.kcal} kcal
                                </span>
                                <span className="text-[11px] font-bold text-[#FF453A] bg-[#FF453A]/10 px-2 py-0.5 rounded-md border border-[#FF453A]/25">
                                  {food.p}g Proteína
                                </span>
                                <span className="text-[11px] font-bold text-[#D8B46A] bg-[#D8B46A]/10 px-2 py-0.5 rounded-md border border-[#D8B46A]/25">
                                  {food.c}g Carbo
                                </span>
                                <span className="text-[11px] font-bold text-[#64D2FF] bg-[#64D2FF]/10 px-2 py-0.5 rounded-md border border-[#64D2FF]/25">
                                  {food.f}g Gordura
                                </span>
                              </div>
                            </div>

                            {/* Steppers & Quantity Controls */}
                            <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0">
                              {/* -50g */}
                              <button
                                type="button"
                                onClick={() => handleUpdatePlateFoodGrams(food.id, food.grams - 50)}
                                title="Diminuir 50 gramas"
                                className="px-2 py-1 rounded-lg bg-[#18181A] border border-[#2B2B2F] text-[10px] font-bold text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#4A4A52] transition-colors cursor-pointer"
                              >
                                -50g
                              </button>

                              {/* Stepper with input */}
                              <div className="flex items-center gap-1 bg-[#151515] p-1 rounded-xl border border-[#2B2B2F]">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePlateFoodGrams(food.id, food.grams - 10)}
                                  title="-10g"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#252528] text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#303035] transition-colors cursor-pointer"
                                >
                                  -10
                                </button>
                                <input
                                  id={`food-grams-input-${food.id}`}
                                  type="number"
                                  min="0"
                                  max="2500"
                                  value={food.grams}
                                  onChange={(e) =>
                                    handleUpdatePlateFoodGrams(food.id, Number(e.target.value) || 0)
                                  }
                                  className="w-16 px-1.5 py-1 rounded-lg bg-[#0A0A0A] border border-[#2B2B2F] text-xs font-black text-center text-[#FF9A62] focus:outline-none focus:border-[#FF6A2A]"
                                />
                                <span className="text-[11px] font-bold text-[#6E6E73] pr-1">g</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePlateFoodGrams(food.id, food.grams + 10)}
                                  title="+10g"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#252528] text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#303035] transition-colors cursor-pointer"
                                >
                                  +10
                                </button>
                              </div>

                              {/* +50g */}
                              <button
                                type="button"
                                onClick={() => handleUpdatePlateFoodGrams(food.id, food.grams + 50)}
                                title="Aumentar 50 gramas"
                                className="px-2 py-1 rounded-lg bg-[#18181A] border border-[#2B2B2F] text-[10px] font-bold text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#4A4A52] transition-colors cursor-pointer"
                              >
                                +50g
                              </button>

                              {/* Toggle Nutritional Tune */}
                              <button
                                type="button"
                                onClick={() => setEditingFoodId(isEditing ? null : food.id)}
                                title="Ajustar densidade nutricional por 100g"
                                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                  isEditing
                                    ? "bg-[#D8B46A]/20 border-[#D8B46A] text-[#D8B46A]"
                                    : "bg-[#18181A] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                                }`}
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Item */}
                              <button
                                type="button"
                                onClick={() => handleRemovePlateFood(food.id)}
                                title="Remover este alimento do prato"
                                className="p-2 rounded-lg bg-[#18181A] border border-[#2B2B2F] hover:bg-[#FF453A]/20 hover:border-[#FF453A]/50 hover:text-[#FF453A] text-[#6E6E73] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Tactile Range Slider for Grams */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-[10px] text-[#6E6E73] mb-1">
                              <span>Ajuste fino da quantidade:</span>
                              <span className="font-bold text-[#FF9A62]">{food.grams} gramas</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="800"
                              step="5"
                              value={food.grams}
                              onChange={(e) => handleUpdatePlateFoodGrams(food.id, Number(e.target.value))}
                              className="w-full h-1.5 bg-[#252528] rounded-lg appearance-none cursor-pointer accent-[#FF6A2A]"
                            />
                          </div>

                          {/* Row 3: Collapsible Density / Macro Calibrator (per 100g) */}
                          {isEditing && (
                            <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#D8B46A]/30 space-y-2.5 animate-in fade-in">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#D8B46A] flex items-center gap-1.5">
                                  <Sliders className="w-3 h-3" />
                                  Densidade Nutricional por 100g de {food.name}:
                                </span>
                                <span className="text-[10px] text-[#9B9BA1]">
                                  Calcula macros automaticamente para {food.grams}g
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-[#FF453A] block mb-0.5">
                                    Proteína /100g
                                  </label>
                                  <div className="flex items-center gap-1 bg-[#151515] px-2 py-1 rounded-lg border border-[#2B2B2F]">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={food.per_100g.p}
                                      onChange={(e) =>
                                        handleUpdatePlateFoodMacroPer100g(food.id, "p", Number(e.target.value))
                                      }
                                      className="w-full bg-transparent text-xs font-bold text-[#F5F5F7] focus:outline-none"
                                    />
                                    <span className="text-[10px] text-[#6E6E73]">g</span>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-[#D8B46A] block mb-0.5">
                                    Carboidrato /100g
                                  </label>
                                  <div className="flex items-center gap-1 bg-[#151515] px-2 py-1 rounded-lg border border-[#2B2B2F]">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={food.per_100g.c}
                                      onChange={(e) =>
                                        handleUpdatePlateFoodMacroPer100g(food.id, "c", Number(e.target.value))
                                      }
                                      className="w-full bg-transparent text-xs font-bold text-[#F5F5F7] focus:outline-none"
                                    />
                                    <span className="text-[10px] text-[#6E6E73]">g</span>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-[#64D2FF] block mb-0.5">
                                    Gordura /100g
                                  </label>
                                  <div className="flex items-center gap-1 bg-[#151515] px-2 py-1 rounded-lg border border-[#2B2B2F]">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={food.per_100g.f}
                                      onChange={(e) =>
                                        handleUpdatePlateFoodMacroPer100g(food.id, "f", Number(e.target.value))
                                      }
                                      className="w-full bg-transparent text-xs font-bold text-[#F5F5F7] focus:outline-none"
                                    />
                                    <span className="text-[10px] text-[#6E6E73]">g</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm & Log Success Message */}
                {plateLoggedSuccess && (
                  <div className="p-3 rounded-xl bg-[#34C759]/15 border border-[#34C759]/40 text-xs text-[#34C759] font-bold flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4" />
                    <span>
                      Refeição registrada com sucesso com {plateAnalysis.kcal} kcal, {plateAnalysis.p}g P, {plateAnalysis.c}g C e {plateAnalysis.f}g G!
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#2B2B2F]">
                  <button
                    id="log-plate-meal-btn"
                    type="button"
                    onClick={() => {
                      setPlateLoggedSuccess(true);
                      setTimeout(() => {
                        setShowPlateModal(false);
                        setPlateAnalysis(null);
                        setPlateImage(null);
                        setPlateLoggedSuccess(false);
                      }, 1800);
                    }}
                    className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-[#34C759] to-[#30D158] text-black font-bold text-xs sm:text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#34C759]/20"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirmar e Salvar no Meu Diário</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPlateModal(false);
                      setPlateAnalysis(null);
                      setPlateImage(null);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] transition-colors cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Diet Assistant Modal ("O que posso comer") */}
      {showAssistantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-[#151515] border border-[#FF6A2A]/40 p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6A2A] to-[#D8B46A] text-white flex items-center justify-center shadow-lg shadow-[#FF6A2A]/20">
                  <ChefHat className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
                    O que posso comer
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6A2A]/20 text-[#FF9A62] border border-[#FF6A2A]/30">
                      Assistente Nutricional
                    </span>
                  </h3>
                  <p className="text-xs text-[#9B9BA1]">
                    Diga os ingredientes que você tem em casa para receber ideias de cardápio com modo de preparo!
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

            {/* Mode Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
              <button
                id="tab-assistant-ingredients"
                onClick={() => setAssistantTab("ingredients")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  assistantTab === "ingredients"
                    ? "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-md"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>🥗 Meus Ingredientes (5 Opções)</span>
              </button>

              <button
                id="tab-assistant-goal"
                onClick={() => setAssistantTab("goal")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  assistantTab === "goal"
                    ? "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-md"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>💡 Sugestões por Objetivo</span>
              </button>
            </div>

            {/* TAB 1: INGREDIENTES QUE O ALUNO TEM */}
            {assistantTab === "ingredients" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#FF6A2A]" />
                      Quais ingredientes você tem na sua geladeira/despensa?
                    </label>
                    <span className="text-[11px] text-[#D8B46A]">Mínimo 5 opções completas</span>
                  </div>

                  <input
                    id="input-assistant-ingredients"
                    type="text"
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    placeholder="Ex: frango, ovos, batata doce, aveia, tomate, queijo, azeite"
                    className="w-full px-4 py-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-medium focus:outline-none focus:border-[#FF6A2A]"
                  />

                  {/* Quick Ingredient Tags */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-[#9B9BA1] font-bold uppercase tracking-wider block">
                      Toque para adicionar rápido:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_INGREDIENTS.map((ing) => (
                        <button
                          key={ing}
                          type="button"
                          onClick={() => handleAddIngredientTag(ing)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1D1D1F] hover:bg-[#2A2A2E] text-[#E6E6EB] border border-[#2B2B2F] hover:border-[#FF6A2A]/50 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-[#FF6A2A]" />
                          <span>{ing}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filtro de tipo de refeição */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9B9BA1]">Tipo de Refeição Desejada</label>
                    <select
                      value={ingredientMealType}
                      onChange={(e) => setIngredientMealType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-semibold focus:outline-none focus:border-[#FF6A2A]"
                    >
                      <option value="all">Todas as refeições (Variado)</option>
                      <option value="breakfast">Café da Manhã</option>
                      <option value="lunch">Almoço</option>
                      <option value="snack">Lanche da Tarde</option>
                      <option value="dinner">Jantar</option>
                      <option value="supper">Ceia</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9B9BA1]">Meta Calórica do Dia</label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#D8B46A] text-xs font-bold flex items-center justify-between">
                      <span>Plano Atual:</span>
                      <span>{diet.kcal} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  id="btn-generate-recipes-by-ingredients"
                  onClick={handleGenerateByIngredients}
                  disabled={loadingIngredients}
                  className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A2A]/25 cursor-pointer"
                >
                  {loadingIngredients ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Montando 5 opções inteligentes com seus ingredientes...</span>
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-5 h-5" />
                      <span>Gerar 5 Opções de Cardápio com Meus Ingredientes</span>
                    </>
                  )}
                </button>

                {/* Recipes Output List */}
                {ingredientRecipes.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#D8B46A] flex items-center gap-1.5">
                        <UtensilsCrossed className="w-4 h-4 text-[#D8B46A]" />
                        Opções de Cardápio Criadas ({ingredientRecipes.length} opções)
                      </h4>
                      <span className="text-[11px] text-[#34C759] font-bold">
                        Com modo de preparo passo a passo
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {ingredientRecipes.map((recipe, index) => {
                        const isPrepOpen = Boolean(expandedPrepRecipes[index]);

                        return (
                          <div
                            key={index}
                            className="p-4 sm:p-5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#FF6A2A]/50 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black uppercase text-[#FF6A2A] bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-md border border-[#FF6A2A]/30">
                                    Opção 0{index + 1} · {recipe.tipo_refeicao}
                                  </span>
                                  {recipe.tempo_preparo && (
                                    <span className="text-xs text-[#9B9BA1] flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-[#D8B46A]" />
                                      {recipe.tempo_preparo}
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-sm sm:text-base font-extrabold text-[#F5F5F7]">
                                  {recipe.nome_receita}
                                </h5>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-black text-[#D8B46A] block">
                                  {recipe.calorias} kcal
                                </span>
                                <span className="text-[10px] text-[#9B9BA1]">
                                  P:{recipe.proteinas}g · C:{recipe.carboidratos}g · G:{recipe.gorduras}g
                                </span>
                              </div>
                            </div>

                            {/* Ingredientes com Quantidade Exata */}
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                                Ingredientes & Quantidades:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {recipe.ingredientes.map((ing, iIdx) => (
                                  <div
                                    key={iIdx}
                                    className="p-2 rounded-xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-1.5 text-[#E6E6EB] truncate">
                                      <Check className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
                                      <span className="truncate">{ing.name}</span>
                                    </div>
                                    <span className="font-extrabold text-[#D8B46A] shrink-0 ml-2">
                                      {ing.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Botão para ensinar a fazer o prato */}
                            <div className="pt-1">
                              <button
                                id={`btn-prep-recipe-${index}`}
                                type="button"
                                onClick={() => toggleRecipePrep(index)}
                                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  isPrepOpen
                                    ? "bg-[#D8B46A]/20 border-[#D8B46A]/60 text-[#D8B46A]"
                                    : "bg-[#252529] border-[#3A3A40] text-[#F5F5F7] hover:bg-[#2E2E34] hover:border-[#D8B46A]/40"
                                }`}
                              >
                                <BookOpen className="w-4 h-4 text-[#D8B46A]" />
                                <span>
                                  {isPrepOpen
                                    ? "Ocultar Modo de Preparo"
                                    : "👨‍🍳 Ensinar a Fazer o Prato (Modo de Preparo)"}
                                </span>
                                {isPrepOpen ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Modo de preparo expandido */}
                              {isPrepOpen && (
                                <div className="mt-3 p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/30 space-y-3 animate-in fade-in duration-200">
                                  <div className="space-y-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-[#D8B46A] flex items-center gap-1.5">
                                      <ListOrdered className="w-3.5 h-3.5 text-[#D8B46A]" />
                                      Modo de Preparo Passo a Passo:
                                    </span>
                                    <ol className="space-y-2 text-xs text-[#E6E6EB]">
                                      {recipe.modo_preparo.map((step, sIdx) => (
                                        <li key={sIdx} className="flex items-start gap-2.5">
                                          <span className="w-5 h-5 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-[#D8B46A]/40">
                                            {sIdx + 1}
                                          </span>
                                          <span className="leading-relaxed">{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>

                                  {recipe.dica_chef && (
                                    <div className="p-3 rounded-xl bg-[#D8B46A]/10 border border-[#D8B46A]/20 text-xs text-[#D8B46A] flex items-start gap-2">
                                      <ChefHat className="w-4 h-4 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="block text-[11px] uppercase tracking-wider">
                                          Dica do Chef & Nutri:
                                        </strong>
                                        <span className="text-[#E6E6EB]">{recipe.dica_chef}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SUGESTÃO GERAL POR OBJETIVO */}
            {assistantTab === "goal" && (
              <div className="space-y-4">
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

                <button
                  id="generate-assistant-recipes-btn"
                  onClick={handleRunAssistant}
                  disabled={loadingAssistant}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A2A]/20 cursor-pointer"
                >
                  {loadingAssistant ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Preparando sugestões saudáveis...</span>
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Sugerir Refeições Saudáveis</span>
                    </>
                  )}
                </button>

                {assistantRecipes.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#D8B46A]">
                      Sugestões Selecionadas ({assistantRecipes.length})
                    </h4>

                    {assistantRecipes.map((recipe, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#FF6A2A]/60 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-[#FF6A2A] bg-[#FF6A2A]/15 px-2.5 py-0.5 rounded-md border border-[#FF6A2A]/30">
                            Opção 0{index + 1}
                          </span>
                          <span className="text-xs font-bold text-[#D8B46A]">{recipe.calorias} kcal</span>
                        </div>
                        <h5 className="text-sm font-bold text-[#F5F5F7]">{recipe.nome_receita}</h5>
                        {recipe.ingredientes && recipe.ingredientes.length > 0 && (
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#E6E6EB]">
                            {recipe.ingredientes.map((ing, iIdx) => (
                              <li key={iIdx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#34C759] shrink-0 mt-0.5" />
                                <span>{ing}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
