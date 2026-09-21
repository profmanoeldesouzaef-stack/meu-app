import React, { useState } from "react";
import { DietTemplate, FoodItem } from "../types";
import {
  UtensilsCrossed,
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Search,
  CheckCircle2,
  Flame,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Scale,
  Check,
  X,
  BookOpen,
  Info,
  Apple,
  Save,
  ArrowRight,
  Layers,
} from "lucide-react";

interface CoachDietLibraryProps {
  library: DietTemplate[];
  onApplyToStudent: (template: DietTemplate) => void;
  onOpenBulkSend: (template: DietTemplate) => void;
  onDeleteDiet: (id: string) => void;
  onSaveDietToLibrary: (template: DietTemplate) => Promise<void>;
  onSaveCurrentStudentDiet?: (title: string, category: DietTemplate["category"], notes: string) => void;
  currentStudentName?: string;
  currentDietKcal?: number;
}

const CATEGORY_MAP: Record<
  DietTemplate["category"],
  { label: string; color: string; bg: string; border: string }
> = {
  cutting: {
    label: "Cutting / Secagem",
    color: "text-[#FF6A2A]",
    bg: "bg-[#FF6A2A]/10",
    border: "border-[#FF6A2A]/30",
  },
  bulking: {
    label: "Bulking / Hipertrofia",
    color: "text-[#D8B46A]",
    bg: "bg-[#D8B46A]/10",
    border: "border-[#D8B46A]/30",
  },
  recomposition: {
    label: "Recomposição Corporal",
    color: "text-[#6D9BFF]",
    bg: "bg-[#6D9BFF]/10",
    border: "border-[#6D9BFF]/30",
  },
  low_carb: {
    label: "Low Carb / Cetogênica",
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
    border: "border-[#25D366]/30",
  },
  maintenance: {
    label: "Manutenção",
    color: "text-[#A855F7]",
    bg: "bg-[#A855F7]/10",
    border: "border-[#A855F7]/30",
  },
  custom: {
    label: "Personalizado / Especial",
    color: "text-[#F5F5F7]",
    bg: "bg-[#2B2B2F]",
    border: "border-[#3E3E42]",
  },
};

const MEAL_NAMES: Record<FoodItem["meal"], string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanche da Tarde",
  dinner: "Jantar",
  supper: "Ceia",
};

const QUICK_FOOD_BANK = [
  { meal: "breakfast" as const, name: "Ovos Caipiras Inteiros (3 unid)", grams: 150, kcal: 215, p: 19, c: 2, f: 15 },
  { meal: "breakfast" as const, name: "Aveia em Flocos Finos", grams: 50, kcal: 185, p: 7, c: 33, f: 3 },
  { meal: "breakfast" as const, name: "Banana Prata", grams: 100, kcal: 98, p: 1, c: 26, f: 0 },
  { meal: "lunch" as const, name: "Peito de Frango Grelhado", grams: 180, kcal: 290, p: 48, c: 0, f: 6 },
  { meal: "lunch" as const, name: "Arroz Branco Cozido", grams: 150, kcal: 195, p: 4, c: 42, f: 0 },
  { meal: "lunch" as const, name: "Feijão Carioca", grams: 120, kcal: 98, p: 6, c: 18, f: 1 },
  { meal: "lunch" as const, name: "Mix de Legumes e Brócolis", grams: 100, kcal: 40, p: 3, c: 7, f: 0 },
  { meal: "snack" as const, name: "Whey Protein 100% Isolado", grams: 35, kcal: 135, p: 30, c: 1, f: 1 },
  { meal: "snack" as const, name: "Pasta de Amendoim Integral", grams: 25, kcal: 150, p: 7, c: 4, f: 12 },
  { meal: "dinner" as const, name: "Patinho Moído Magro", grams: 160, kcal: 270, p: 40, c: 0, f: 10 },
  { meal: "dinner" as const, name: "Batata Doce Cozida/Assada", grams: 150, kcal: 130, p: 2, c: 30, f: 0 },
  { meal: "dinner" as const, name: "Filé de Tilápia Grelhado", grams: 180, kcal: 230, p: 46, c: 0, f: 4 },
  { meal: "supper" as const, name: "Iogurte Natural Proteico", grams: 150, kcal: 95, p: 14, c: 7, f: 0 },
  { meal: "supper" as const, name: "Castanha-do-Pará (3 unid)", grams: 15, kcal: 100, p: 3, c: 2, f: 10 },
];

export const CoachDietLibrary: React.FC<CoachDietLibraryProps> = ({
  library,
  onApplyToStudent,
  onOpenBulkSend,
  onDeleteDiet,
  onSaveDietToLibrary,
  onSaveCurrentStudentDiet,
  currentStudentName,
  currentDietKcal,
}) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedDietId, setExpandedDietId] = useState<string | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DietTemplate | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<DietTemplate["category"]>("cutting");
  const [formDescription, setFormDescription] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formKcal, setFormKcal] = useState(2000);
  const [formProteinPct, setFormProteinPct] = useState(35);
  const [formCarbsPct, setFormCarbsPct] = useState(40);
  const [formFatsPct, setFormFatsPct] = useState(25);
  const [formFoods, setFormFoods] = useState<FoodItem[]>([]);

  // Add Item to Form State
  const [newFoodMeal, setNewFoodMeal] = useState<FoodItem["meal"]>("breakfast");
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodGrams, setNewFoodGrams] = useState(100);
  const [newFoodKcal, setNewFoodKcal] = useState(150);
  const [newFoodP, setNewFoodP] = useState(15);
  const [newFoodC, setNewFoodC] = useState(15);
  const [newFoodF, setNewFoodF] = useState(4);

  // Save current student diet modal state
  const [saveStudentModalOpen, setSaveStudentModalOpen] = useState(false);
  const [studentSaveTitle, setStudentSaveTitle] = useState("");
  const [studentSaveCat, setStudentSaveCat] = useState<DietTemplate["category"]>("cutting");
  const [studentSaveNotes, setStudentSaveNotes] = useState("");

  const filtered = library.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
      (d.coach_notes && d.coach_notes.toLowerCase().includes(search.toLowerCase())) ||
      (d.foods && d.foods.some((f) => f.name.toLowerCase().includes(search.toLowerCase())));
    const matchesCat = categoryFilter === "all" || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle("Novo Protocolo de Dieta");
    setFormCategory("cutting");
    setFormDescription("Prescrição balanceada com controle calórico e timing de nutrientes.");
    setFormNotes("Beber no mínimo 3L de água por dia. Seguir a sequência das refeições.");
    setFormKcal(2000);
    setFormProteinPct(35);
    setFormCarbsPct(40);
    setFormFatsPct(25);
    setFormFoods([
      {
        id: `food-${Date.now()}-1`,
        name: "Ovos Mexidos com Aveia",
        grams: 200,
        kcal: 350,
        p: 26,
        c: 30,
        f: 12,
        meal: "breakfast",
      },
      {
        id: `food-${Date.now()}-2`,
        name: "Peito de Frango com Arroz e Legumes",
        grams: 350,
        kcal: 540,
        p: 50,
        c: 55,
        f: 8,
        meal: "lunch",
      },
      {
        id: `food-${Date.now()}-3`,
        name: "Whey Protein Isolado com Banana",
        grams: 250,
        kcal: 250,
        p: 28,
        c: 28,
        f: 2,
        meal: "snack",
      },
      {
        id: `food-${Date.now()}-4`,
        name: "Tilápia Grelhada com Batata Doce",
        grams: 320,
        kcal: 480,
        p: 44,
        c: 45,
        f: 8,
        meal: "dinner",
      },
    ]);
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (template: DietTemplate) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormCategory(template.category);
    setFormDescription(template.description || "");
    setFormNotes(template.coach_notes || "");
    setFormKcal(template.target_kcal);
    setFormProteinPct(template.protein_pct);
    setFormCarbsPct(template.carbs_pct);
    setFormFatsPct(template.fats_pct);
    setFormFoods(template.foods ? [...template.foods] : []);
    setIsEditorOpen(true);
  };

  const handleApplyMacroPreset = (
    cat: DietTemplate["category"],
    p: number,
    c: number,
    f: number
  ) => {
    setFormCategory(cat);
    setFormProteinPct(p);
    setFormCarbsPct(c);
    setFormFatsPct(f);
  };

  const handleAddFoodToForm = () => {
    if (!newFoodName.trim()) return;
    const item: FoodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newFoodName.trim(),
      grams: Number(newFoodGrams) || 100,
      kcal: Number(newFoodKcal) || 100,
      p: Number(newFoodP) || 0,
      c: Number(newFoodC) || 0,
      f: Number(newFoodF) || 0,
      meal: newFoodMeal,
    };
    setFormFoods((prev) => [...prev, item]);
    setNewFoodName("");
  };

  const handleAddQuickBankItem = (preset: typeof QUICK_FOOD_BANK[0]) => {
    const item: FoodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      grams: preset.grams,
      kcal: preset.kcal,
      p: preset.p,
      c: preset.c,
      f: preset.f,
      meal: preset.meal,
    };
    setFormFoods((prev) => [...prev, item]);
  };

  const handleRemoveFoodFromForm = (id: string) => {
    setFormFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSaveForm = async () => {
    if (!formTitle.trim()) return;

    // Grams calculation
    const pGrams = Math.round((formKcal * (formProteinPct / 100)) / 4);
    const cGrams = Math.round((formKcal * (formCarbsPct / 100)) / 4);
    const fGrams = Math.round((formKcal * (formFatsPct / 100)) / 9);

    const templateToSave: DietTemplate = {
      id: editingTemplate ? editingTemplate.id : `diet-lib-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      description: formDescription.trim(),
      coach_notes: formNotes.trim(),
      target_kcal: Number(formKcal),
      protein_pct: Number(formProteinPct),
      carbs_pct: Number(formCarbsPct),
      fats_pct: Number(formFatsPct),
      target_protein_g: pGrams,
      target_carbs_g: cGrams,
      target_fats_g: fGrams,
      foods: formFoods,
      created_at: editingTemplate?.created_at || new Date().toISOString(),
      is_template: true,
    };

    await onSaveDietToLibrary(templateToSave);
    setIsEditorOpen(false);
  };

  const handleDuplicate = async (template: DietTemplate) => {
    const duplicated: DietTemplate = {
      ...template,
      id: `diet-lib-${Date.now()}`,
      title: `${template.title} (Cópia)`,
      created_at: new Date().toISOString(),
      foods: template.foods ? template.foods.map((f) => ({ ...f, id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })) : [],
    };
    await onSaveDietToLibrary(duplicated);
  };

  const handleConfirmSaveStudentDiet = () => {
    if (!onSaveCurrentStudentDiet) return;
    const finalTitle =
      studentSaveTitle.trim() ||
      `Dieta de ${currentStudentName || "Aluno"} (${currentDietKcal || 2000} kcal)`;
    onSaveCurrentStudentDiet(finalTitle, studentSaveCat, studentSaveNotes);
    setSaveStudentModalOpen(false);
  };

  // Calculations for preview inside form
  const totalFoodKcal = formFoods.reduce((acc, f) => acc + (f.kcal || 0), 0);
  const totalFoodP = formFoods.reduce((acc, f) => acc + (f.p || 0), 0);
  const totalFoodC = formFoods.reduce((acc, f) => acc + (f.c || 0), 0);
  const totalFoodF = formFoods.reduce((acc, f) => acc + (f.f || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Action Buttons */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6A2A]/15 border border-[#FF6A2A]/40 text-[#FF6A2A] flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6A2A] bg-[#FF6A2A]/10 px-2.5 py-0.5 rounded-full border border-[#FF6A2A]/20">
                ACERVO NUTRICIONAL OFICIAL
              </span>
              <span className="text-[10px] font-semibold text-[#9B9BA1]">
                {library.length} {library.length === 1 ? "protocolo" : "protocolos"} salvos
              </span>
            </div>
            <h2 className="text-lg font-black text-[#F5F5F7] tracking-tight mt-1">
              Biblioteca de Dietas do Coach
            </h2>
            <p className="text-xs text-[#9B9BA1]">
              Crie modelos distintos de dietas (Cutting, Bulking, Recomposição, Low Carb), guarde no seu acervo e aplique diretamente nos alunos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSaveCurrentStudentDiet && currentStudentName && (
            <button
              id="save-current-student-diet-btn"
              type="button"
              onClick={() => {
                setStudentSaveTitle(`Dieta - ${currentStudentName} (${currentDietKcal || 2000} kcal)`);
                setStudentSaveCat("cutting");
                setStudentSaveNotes("");
                setSaveStudentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#D8B46A] border border-[#D8B46A]/40 hover:bg-[#D8B46A]/15 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Salva a dieta atual do aluno selecionado como um modelo na sua biblioteca"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Dieta do Aluno na Biblioteca</span>
            </button>
          )}

          <button
            id="create-new-diet-library-btn"
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#FF6A2A] text-white hover:brightness-110 flex items-center gap-1.5 transition-all shadow-lg shadow-[#FF6A2A]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Criar Nova Dieta</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === "all"
                ? "bg-[#FF6A2A] text-white"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
            }`}
          >
            Todas ({library.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("cutting")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === "cutting"
                ? "bg-[#FF6A2A] text-white"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
            }`}
          >
            🔥 Cutting
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("bulking")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === "bulking"
                ? "bg-[#D8B46A] text-[#0A0A0A]"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
            }`}
          >
            ⚡ Bulking
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("recomposition")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === "recomposition"
                ? "bg-[#6D9BFF] text-white"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
            }`}
          >
            ⚖️ Recomposição
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("low_carb")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === "low_carb"
                ? "bg-[#25D366] text-black"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
            }`}
          >
            🥑 Low Carb
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, alimento ou nota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A]"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-[#6E6E73] mx-auto" />
          <h3 className="text-base font-bold text-[#F5F5F7]">Nenhuma dieta encontrada</h3>
          <p className="text-xs text-[#9B9BA1] max-w-sm mx-auto">
            Não encontramos nenhum protocolo para o filtro atual. Crie uma nova dieta ou limpe a busca.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] text-white hover:brightness-110 cursor-pointer"
          >
            + Criar Dieta Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.custom;
            const isExpanded = expandedDietId === item.id;
            const mealsList = item.foods ? Array.from(new Set(item.foods.map((f) => f.meal))) : [];

            // Calculate macro grams if not provided
            const pG = item.target_protein_g ?? Math.round((item.target_kcal * (item.protein_pct / 100)) / 4);
            const cG = item.target_carbs_g ?? Math.round((item.target_kcal * (item.carbs_pct / 100)) / 4);
            const fG = item.target_fats_g ?? Math.round((item.target_kcal * (item.fats_pct / 100)) / 9);

            return (
              <div
                key={item.id}
                id={`diet-card-${item.id}`}
                className="rounded-3xl bg-[#151515] border border-[#2B2B2F] hover:border-[#3E3E42] transition-all flex flex-col justify-between overflow-hidden shadow-lg group"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}
                    >
                      {cat.label}
                    </span>
                    <span className="text-[11px] font-medium text-[#9B9BA1]">
                      {item.foods?.length || 0} alimentos cadastrados
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-[#F5F5F7] group-hover:text-[#FF9A62] transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-[#9B9BA1] mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Macros Bento Box */}
                  <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#111113] border border-[#222225]">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                        Calorias
                      </span>
                      <span className="text-sm font-black text-[#FF6A2A] flex items-center justify-center gap-0.5 mt-0.5">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {item.target_kcal}
                      </span>
                    </div>

                    <div className="text-center border-l border-[#2B2B2F]">
                      <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                        Proteína
                      </span>
                      <span className="text-xs font-black text-[#F5F5F7] block mt-0.5">
                        {pG}g
                      </span>
                      <span className="text-[9px] text-[#FF6A2A] font-semibold">
                        {item.protein_pct}%
                      </span>
                    </div>

                    <div className="text-center border-l border-[#2B2B2F]">
                      <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                        Carbo
                      </span>
                      <span className="text-xs font-black text-[#F5F5F7] block mt-0.5">
                        {cG}g
                      </span>
                      <span className="text-[9px] text-[#D8B46A] font-semibold">
                        {item.carbs_pct}%
                      </span>
                    </div>

                    <div className="text-center border-l border-[#2B2B2F]">
                      <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                        Gordura
                      </span>
                      <span className="text-xs font-black text-[#F5F5F7] block mt-0.5">
                        {fG}g
                      </span>
                      <span className="text-[9px] text-[#6D9BFF] font-semibold">
                        {item.fats_pct}%
                      </span>
                    </div>
                  </div>

                  {/* Coach Notes Callout */}
                  {item.coach_notes && (
                    <div className="p-3 rounded-xl bg-[#1A1A1C] border border-[#2B2B2F] text-[11px] text-[#9B9BA1] flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-[#D8B46A] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item.coach_notes}</span>
                    </div>
                  )}

                  {/* Toggle Meals Breakdown */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedDietId(isExpanded ? null : item.id)}
                      className="w-full py-2 px-3 rounded-xl bg-[#1D1D1F] hover:bg-[#252528] text-xs font-bold text-[#F5F5F7] flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#FF6A2A]" />
                        <span>Ver Cardápio Detalhado ({mealsList.length} refeições)</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#9B9BA1]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#9B9BA1]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-[#0F0F10] border border-[#2B2B2F] space-y-3 animate-in fade-in duration-200">
                        {(["breakfast", "lunch", "snack", "dinner", "supper"] as FoodItem["meal"][]).map((m) => {
                          const foodsInMeal = item.foods ? item.foods.filter((f) => f.meal === m) : [];
                          if (foodsInMeal.length === 0) return null;
                          const mealKcal = foodsInMeal.reduce((acc, f) => acc + (f.kcal || 0), 0);

                          return (
                            <div key={m} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-[#D8B46A] border-b border-[#222225] pb-1">
                                <span>{MEAL_NAMES[m]}</span>
                                <span className="text-[#9B9BA1] font-normal">{mealKcal} kcal</span>
                              </div>
                              <div className="space-y-1 pl-1">
                                {foodsInMeal.map((f) => (
                                  <div
                                    key={f.id}
                                    className="flex items-center justify-between text-xs text-[#F5F5F7] py-0.5"
                                  >
                                    <span className="truncate pr-2">
                                      • {f.name} ({f.grams}g)
                                    </span>
                                    <span className="text-[10px] text-[#9B9BA1] shrink-0">
                                      {f.kcal} kcal | P:{f.p}g C:{f.c}g G:{f.f}g
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-[#111113] border-t border-[#2B2B2F] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#2B2B2F] transition-all cursor-pointer"
                      title="Editar Dieta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      className="p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#D8B46A] hover:bg-[#2B2B2F] transition-all cursor-pointer"
                      title="Duplicar Dieta"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDiet(item.id)}
                      className="p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-red-400 hover:bg-[#2B2B2F] transition-all cursor-pointer"
                      title="Excluir Dieta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenBulkSend(item)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF6A2A]/15 text-[#FF9A62] border border-[#FF6A2A]/40 hover:bg-[#FF6A2A]/25 flex items-center gap-1 transition-all cursor-pointer"
                      title="Disparar para múltiplos alunos"
                    >
                      <Send className="w-3 h-3" />
                      <span>Enviar para Alunos...</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-apply-diet-${item.id}`}
                      onClick={() => onApplyToStudent(item)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#FF6A2A] text-white hover:brightness-110 flex items-center gap-1.5 shadow-md shadow-[#FF6A2A]/20 transition-all cursor-pointer"
                      title="Carregar este protocolo no aluno selecionado"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Aplicar ao Aluno</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar / Editar Dieta */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6A2A]/20 text-[#FF6A2A] flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F7]">
                    {editingTemplate ? "Editar Protocolo de Dieta" : "Criar Nova Dieta para a Biblioteca"}
                  </h3>
                  <p className="text-xs text-[#9B9BA1]">
                    Defina título, objetivo, calorias, macros e alimentos deste modelo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[#9B9BA1] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Título do Protocolo *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: 🔥 Protocolo Cutting Seca Rápido (1.750 kcal)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Categoria / Objetivo
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DietTemplate["category"])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#FF6A2A]"
                >
                  <option value="cutting">🔥 Cutting (Déficit Calórico)</option>
                  <option value="bulking">⚡ Bulking (Superávit Calórico)</option>
                  <option value="recomposition">⚖️ Recomposição Corporal</option>
                  <option value="low_carb">🥑 Low Carb / Cetogênica</option>
                  <option value="maintenance">🎯 Manutenção Calórica</option>
                  <option value="custom">✨ Personalizado / Especial</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Meta Calórica Total (kcal) *
                </label>
                <input
                  type="number"
                  value={formKcal}
                  onChange={(e) => setFormKcal(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Breve Descrição / Foco
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Déficit agressivo para definição de abdômen e preservação muscular."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Orientações / Notas do Coach
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Beber 3.5L de água/dia. Tomar a creatina no pós-treino com a fruta."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>
            </div>

            {/* Macro Percentages & Presets */}
            <div className="p-4 rounded-2xl bg-[#111113] border border-[#2B2B2F] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#F5F5F7]">
                  Divisão de Macronutrientes (%)
                </span>
                {/* Presets */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyMacroPreset("cutting", 40, 35, 25)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1D1D1F] text-[#FF6A2A] border border-[#2B2B2F] hover:bg-[#2B2B2F] cursor-pointer"
                  >
                    Cutting (40/35/25)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMacroPreset("bulking", 25, 55, 20)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1D1D1F] text-[#D8B46A] border border-[#2B2B2F] hover:bg-[#2B2B2F] cursor-pointer"
                  >
                    Bulking (25/55/20)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMacroPreset("recomposition", 35, 45, 20)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1D1D1F] text-[#6D9BFF] border border-[#2B2B2F] hover:bg-[#2B2B2F] cursor-pointer"
                  >
                    Recomp (35/45/20)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMacroPreset("low_carb", 35, 10, 55)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1D1D1F] text-[#25D366] border border-[#2B2B2F] hover:bg-[#2B2B2F] cursor-pointer"
                  >
                    Low Carb (35/10/55)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#9B9BA1] block">
                    Proteína: {formProteinPct}% ({Math.round((formKcal * (formProteinPct / 100)) / 4)}g)
                  </label>
                  <input
                    type="number"
                    value={formProteinPct}
                    onChange={(e) => setFormProteinPct(Number(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#9B9BA1] block">
                    Carboidrato: {formCarbsPct}% ({Math.round((formKcal * (formCarbsPct / 100)) / 4)}g)
                  </label>
                  <input
                    type="number"
                    value={formCarbsPct}
                    onChange={(e) => setFormCarbsPct(Number(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#9B9BA1] block">
                    Gordura: {formFatsPct}% ({Math.round((formKcal * (formFatsPct / 100)) / 9)}g)
                  </label>
                  <input
                    type="number"
                    value={formFatsPct}
                    onChange={(e) => setFormFatsPct(Number(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7]"
                  />
                </div>
              </div>

              {formProteinPct + formCarbsPct + formFatsPct !== 100 && (
                <p className="text-[11px] text-amber-400 font-semibold">
                  ⚠️ A soma dos macros está em {formProteinPct + formCarbsPct + formFatsPct}%. O ideal é fechar em 100%.
                </p>
              )}
            </div>

            {/* Foods and Meals Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#FF6A2A]" />
                  <span>Alimentos por Refeição ({formFoods.length} itens)</span>
                </h4>
                <div className="text-[11px] font-semibold text-[#9B9BA1]">
                  Soma atual: <span className="text-[#FF6A2A] font-bold">{totalFoodKcal}</span> / {formKcal} kcal
                  (P: {totalFoodP}g | C: {totalFoodC}g | G: {totalFoodF}g)
                </div>
              </div>

              {/* Quick Add Preset Buttons */}
              <div className="p-3 rounded-2xl bg-[#111113] border border-[#2B2B2F] space-y-2">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
                  Adicionar Rápido com 1 Clique:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {QUICK_FOOD_BANK.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddQuickBankItem(item)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1D1D1F] hover:bg-[#252528] text-[#F5F5F7] border border-[#2B2B2F] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5 text-[#FF6A2A]" />
                      <span>{item.name}</span>
                      <span className="text-[9px] text-[#9B9BA1]">({item.kcal}kcal)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Add Row */}
              <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] grid grid-cols-2 sm:grid-cols-7 gap-2 items-end">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-[#9B9BA1] block font-semibold">Alimento</label>
                  <input
                    type="text"
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    placeholder="Ex: Frango Grelhado"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9B9BA1] block font-semibold">Refeição</label>
                  <select
                    value={newFoodMeal}
                    onChange={(e) => setNewFoodMeal(e.target.value as FoodItem["meal"])}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7]"
                  >
                    <option value="breakfast">Café</option>
                    <option value="lunch">Almoço</option>
                    <option value="snack">Lanche</option>
                    <option value="dinner">Jantar</option>
                    <option value="supper">Ceia</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#9B9BA1] block font-semibold">Gramas</label>
                  <input
                    type="number"
                    value={newFoodGrams}
                    onChange={(e) => setNewFoodGrams(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9B9BA1] block font-semibold">Kcal</label>
                  <input
                    type="number"
                    value={newFoodKcal}
                    onChange={(e) => setNewFoodKcal(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9B9BA1] block font-semibold">P/C/G</label>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      title="Proteína"
                      value={newFoodP}
                      onChange={(e) => setNewFoodP(Number(e.target.value) || 0)}
                      className="w-full px-1 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-[10px] text-[#F5F5F7] text-center"
                    />
                    <input
                      type="number"
                      title="Carbo"
                      value={newFoodC}
                      onChange={(e) => setNewFoodC(Number(e.target.value) || 0)}
                      className="w-full px-1 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-[10px] text-[#F5F5F7] text-center"
                    />
                    <input
                      type="number"
                      title="Gordura"
                      value={newFoodF}
                      onChange={(e) => setNewFoodF(Number(e.target.value) || 0)}
                      className="w-full px-1 py-1.5 rounded-lg bg-[#151515] border border-[#2B2B2F] text-[10px] text-[#F5F5F7] text-center"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddFoodToForm}
                    className="w-full py-1.5 rounded-lg bg-[#FF6A2A] text-white text-xs font-bold hover:brightness-110 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Added Foods List */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-[#2B2B2F]/40">
                {formFoods.length === 0 ? (
                  <p className="text-xs text-[#9B9BA1] text-center py-4">
                    Nenhum alimento adicionado. Adicione alimentos acima ou selecione presets rápidos.
                  </p>
                ) : (
                  formFoods.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 hover:bg-[#1D1D1F] rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#2B2B2F] text-[#D8B46A] shrink-0">
                          {MEAL_NAMES[item.meal]}
                        </span>
                        <span className="text-xs font-semibold text-[#F5F5F7] truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#9B9BA1] shrink-0">
                          ({item.grams}g)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-[#FF6A2A]">
                          {item.kcal} kcal
                        </span>
                        <span className="text-[10px] text-[#9B9BA1]">
                          P:{item.p}g C:{item.c}g G:{item.f}g
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFoodFromForm(item.id)}
                          className="p-1 rounded-lg text-[#9B9BA1] hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#2B2B2F] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-white bg-[#1D1D1F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="save-diet-template-submit-btn"
                onClick={handleSaveForm}
                disabled={!formTitle.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#FF6A2A] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Dieta na Biblioteca</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Salvar Dieta do Aluno Atual como Modelo */}
      {saveStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-[#D8B46A]" />
                <h3 className="text-base font-bold text-[#F5F5F7]">
                  Salvar Dieta na Biblioteca
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSaveStudentModalOpen(false)}
                className="text-[#9B9BA1] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9B9BA1]">
              A dieta atualmente prescrita para <strong className="text-[#F5F5F7]">{currentStudentName}</strong> ({currentDietKcal} kcal) será salva no acervo do coach para uso futuro.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  value={studentSaveTitle}
                  onChange={(e) => setStudentSaveTitle(e.target.value)}
                  placeholder="Ex: Dieta Cutting 1.850 kcal (Foco Proteico)"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Objetivo / Categoria
                </label>
                <select
                  value={studentSaveCat}
                  onChange={(e) => setStudentSaveCat(e.target.value as DietTemplate["category"])}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                >
                  <option value="cutting">🔥 Cutting / Secagem</option>
                  <option value="bulking">⚡ Bulking / Hipertrofia</option>
                  <option value="recomposition">⚖️ Recomposição Corporal</option>
                  <option value="low_carb">🥑 Low Carb</option>
                  <option value="maintenance">🎯 Manutenção</option>
                  <option value="custom">✨ Personalizado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">
                  Notas de Orientação
                </label>
                <textarea
                  rows={2}
                  value={studentSaveNotes}
                  onChange={(e) => setStudentSaveNotes(e.target.value)}
                  placeholder="Instruções sobre hidratação, horários ou suplementação..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#2B2B2F] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveStudentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-white bg-[#1D1D1F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-save-student-diet-to-library-btn"
                onClick={handleConfirmSaveStudentDiet}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#D8B46A] text-black hover:brightness-110 shadow-lg shadow-[#D8B46A]/20 cursor-pointer"
              >
                Salvar no Acervo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
