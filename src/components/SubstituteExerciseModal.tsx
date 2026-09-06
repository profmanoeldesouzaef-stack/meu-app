import React, { useState } from "react";
import { X, RefreshCw, Check, Search, Dumbbell } from "lucide-react";

export interface SubstituteExerciseModalProps {
  isOpen?: boolean;
  exerciseName?: string;
  muscle?: string;
  currentExercise?: { name: string; muscle?: string; [key: string]: any };
  onClose: () => void;
  onSelectSubstitute: (substituteName: string) => void;
}

const exerciseSubstitutesCatalog: Record<string, string[]> = {
  "Peitoral": [
    "Supino Inclinado com Halteres",
    "Crossover na Polia Média",
    "Peck Deck / Voador",
    "Supino Reto com Barra",
    "Crucifixo Inclinado com Halteres",
    "Flexão de Braço com Carga",
    "Supino Declinado com Halteres",
    "Dips / Paralelas com Peso Corporal",
  ],
  "Costas": [
    "Puxada Alta Frontal no Triângulo",
    "Remada Curvada com Barra",
    "Remada Baixa no Cabo / Polia",
    "Pulldown com Corda na Polia Alta",
    "Remada Cavalinho com Carga",
    "Barra Fixa Pronada",
    "Remada Serrote Unilateral com Halter",
  ],
  "Quadríceps": [
    "Leg Press 45 Graus",
    "Agachamento Búlgaro com Halteres",
    "Cadeira Extensora",
    "Agachamento Hack Machine",
    "Passada / Afundo com Halteres",
    "Agachamento Frontal com Barra",
  ],
  "Posterior e Glúteo": [
    "Mesa Flexora Deitada",
    "Cadeira Flexora",
    "Stiff com Barra ou Halteres",
    "Elevação Pélvica com Barra",
    "Glúteo no Cabo / Coice na Polia",
    "Cadeira Abdutora",
  ],
  "Ombros": [
    "Elevação Lateral na Polia",
    "Desenvolvimento com Halteres Sentado",
    "Elevação Frontal com Halteres",
    "Crucifixo Invertido na Máquina",
    "Face Pull com Corda na Polia",
    "Desenvolvimento Militar com Barra",
  ],
  "Tríceps": [
    "Tríceps Corda na Polia Alta",
    "Tríceps Barra Reta na Polia",
    "Tríceps Testa com Barra W",
    "Tríceps Francês Unilateral",
    "Mergulho em Paralelas",
  ],
  "Bíceps": [
    "Rosca Direta com Barra W",
    "Rosca Alternada com Halteres",
    "Rosca Martelo na Corda ou Halteres",
    "Rosca Scott no Banco",
    "Rosca Concentrada Unilateral",
  ],
};

export const SubstituteExerciseModal: React.FC<SubstituteExerciseModalProps> = ({
  isOpen = true,
  exerciseName: propExerciseName,
  muscle: propMuscle,
  currentExercise,
  onClose,
  onSelectSubstitute,
}) => {
  const [customName, setCustomName] = useState("");
  const [search, setSearch] = useState("");

  if (isOpen === false) return null;

  const exerciseName = propExerciseName || currentExercise?.name || "Exercício";
  const muscle = propMuscle || currentExercise?.muscle || "";

  // Find relevant category or fallback to all
  const matchedKey = Object.keys(exerciseSubstitutesCatalog).find((k) =>
    muscle.toLowerCase().includes(k.toLowerCase())
  );
  const alternatives = matchedKey
    ? exerciseSubstitutesCatalog[matchedKey]
    : Object.values(exerciseSubstitutesCatalog).flat();

  const filtered = alternatives.filter((alt) =>
    alt.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = (name: string) => {
    onSelectSubstitute(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#D8B46A]" />
            <div>
              <h3 className="text-base font-bold text-[#F5F5F7]">Substituir Exercício</h3>
              <p className="text-[11px] text-[#9B9BA1]">
                Exercício atual: <strong className="text-[#F5F5F7]">{exerciseName}</strong> ({muscle})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9B9BA1] hover:text-white text-xs font-bold"
          >
            ✕ Fechar
          </button>
        </div>

        {/* Custom input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#9B9BA1]">
            Digite o nome de uma variação ou escolha abaixo:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ex: Crossover Polia Média"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
            />
            <button
              disabled={!customName.trim()}
              onClick={() => handleApply(customName.trim())}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* Search filter for suggestions */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar sugestões..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
          />
        </div>

        {/* Suggestions list */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleApply(item)}
              className="w-full text-left p-3 rounded-xl bg-[#1D1D1F] hover:bg-[#2B2B2F] border border-[#2B2B2F] hover:border-[#D8B46A] text-xs font-semibold text-[#F5F5F7] flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Dumbbell className="w-3.5 h-3.5 text-[#D8B46A] group-hover:scale-110 transition-transform" />
                <span>{item}</span>
              </div>
              <span className="text-[10px] text-[#D8B46A] opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                Selecionar →
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#2B2B2F]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
