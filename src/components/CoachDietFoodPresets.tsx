import React, { useState } from "react";
import { Plus, UtensilsCrossed, Sparkles, Check } from "lucide-react";

interface FoodPreset {
  category: string;
  name: string;
  grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

const FITNESS_FOODS_BANK: FoodPreset[] = [
  // Proteínas
  { category: "Proteínas", name: "Peito de Frango Grelhado", grams: 150, kcal: 247, p: 46, c: 0, f: 5 },
  { category: "Proteínas", name: "Filé de Tilápia Grelhado", grams: 150, kcal: 192, p: 39, c: 0, f: 4 },
  { category: "Proteínas", name: "Patinho Moído Magro", grams: 150, kcal: 260, p: 44, c: 0, f: 8 },
  { category: "Proteínas", name: "Salmão Grelhado na Chapa", grams: 120, kcal: 240, p: 26, c: 0, f: 14 },
  { category: "Proteínas", name: "Ovos Mexidos Inteiros (3 unid)", grams: 150, kcal: 215, p: 19, c: 2, f: 15 },
  { category: "Proteínas", name: "Claras de Ovos Pasteurisadas", grams: 200, kcal: 104, p: 22, c: 1, f: 0 },
  { category: "Proteínas", name: "Whey Protein 100% Isolado", grams: 30, kcal: 115, p: 27, c: 1, f: 1 },
  { category: "Proteínas", name: "Queijo Cottage Magro", grams: 100, kcal: 98, p: 14, c: 3, f: 3 },
  { category: "Proteínas", name: "Atum Ralado em Água", grams: 120, kcal: 130, p: 30, c: 0, f: 1 },
  
  // Carboidratos
  { category: "Carboidratos", name: "Arroz Branco Cozido", grams: 150, kcal: 195, p: 4, c: 42, f: 0 },
  { category: "Carboidratos", name: "Batata Doce Cozida", grams: 150, kcal: 130, p: 2, c: 30, f: 0 },
  { category: "Carboidratos", name: "Aveia em Flocos Finos", grams: 50, kcal: 185, p: 7, c: 33, f: 3 },
  { category: "Carboidratos", name: "Mandioca / Aipim Cozido", grams: 120, kcal: 190, p: 2, c: 45, f: 0 },
  { category: "Carboidratos", name: "Macarrão Integral Cozido", grams: 120, kcal: 150, p: 6, c: 30, f: 1 },
  { category: "Carboidratos", name: "Banana Prata", grams: 100, kcal: 98, p: 1, c: 26, f: 0 },
  { category: "Carboidratos", name: "Goma de Tapioca", grams: 60, kcal: 145, p: 0, c: 36, f: 0 },
  { category: "Carboidratos", name: "Pão Integral 100% Grãos (2 fatias)", grams: 50, kcal: 120, p: 5, c: 22, f: 1 },

  // Gorduras Boas & Fibras
  { category: "Gorduras Boas", name: "Azeite de Oliva Extra Virgem", grams: 10, kcal: 88, p: 0, c: 0, f: 10 },
  { category: "Gorduras Boas", name: "Pasta de Amendoim Integral", grams: 30, kcal: 180, p: 8, c: 6, f: 15 },
  { category: "Gorduras Boas", name: "Castanha-do-Pará Selecionada", grams: 20, kcal: 132, p: 3, c: 2, f: 13 },
  { category: "Gorduras Boas", name: "Abacate Fresco", grams: 80, kcal: 128, p: 2, c: 7, f: 12 },
  { category: "Gorduras Boas", name: "Semente de Chia / Linhaça", grams: 15, kcal: 75, p: 3, c: 6, f: 5 },
];

interface CoachDietFoodPresetsProps {
  onSelectPreset: (preset: FoodPreset) => void;
}

export const CoachDietFoodPresets: React.FC<CoachDietFoodPresetsProps> = ({
  onSelectPreset,
}) => {
  const [activeCategory, setActiveCategory] = useState("Proteínas");

  const categories = ["Proteínas", "Carboidratos", "Gorduras Boas"];
  const currentPresets = FITNESS_FOODS_BANK.filter((f) => f.category === activeCategory);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-[#D8B46A]" />
          <div>
            <h4 className="text-xs font-bold text-[#F5F5F7]">
              Banco Rápido de Alimentos Fitness do Coach
            </h4>
            <p className="text-[11px] text-[#9B9BA1]">
              Clique em qualquer alimento para adicionar instantaneamente com macros calculados.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 bg-[#1D1D1F] p-1 rounded-xl border border-[#2B2B2F]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#D8B46A] text-[#0A0A0A]"
                  : "text-[#9B9BA1] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
        {currentPresets.map((food, i) => (
          <button
            key={i}
            onClick={() => onSelectPreset(food)}
            className="p-2.5 rounded-xl bg-[#1D1D1F] hover:bg-[#252528] border border-[#2B2B2F] hover:border-[#D8B46A]/50 text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-[#F5F5F7] group-hover:text-[#D8B46A] transition-colors">
                {food.name}
              </div>
              <div className="text-[10px] text-[#9B9BA1] mt-0.5">
                {food.grams}g · <span className="text-[#F5F5F7] font-semibold">{food.kcal} kcal</span>
                {" "}(<span className="text-[#FF6A2A]">{food.p}P</span> / <span className="text-[#D8B46A]">{food.c}C</span> / <span className="text-[#6D9BFF]">{food.f}G</span>)
              </div>
            </div>

            <div className="w-6 h-6 rounded-lg bg-[#2B2B2F] group-hover:bg-[#D8B46A] text-[#9B9BA1] group-hover:text-[#0A0A0A] flex items-center justify-center shrink-0 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
