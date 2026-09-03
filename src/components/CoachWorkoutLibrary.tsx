import React, { useState } from "react";
import { Workout } from "../types";
import {
  BookOpen,
  Send,
  Plus,
  Trash2,
  Dumbbell,
  Clock,
  Flame,
  Search,
  CheckCircle2,
  Copy,
  Layers,
  ArrowRight,
} from "lucide-react";

interface CoachWorkoutLibraryProps {
  library: Workout[];
  onLoadWorkout: (workout: Workout) => void;
  onOpenBulkSend: (workout: Workout) => void;
  onDeleteWorkout: (id: string) => void;
  onSaveCurrentToLibrary: () => void;
  currentWorkoutTitle?: string;
}

export const CoachWorkoutLibrary: React.FC<CoachWorkoutLibraryProps> = ({
  library,
  onLoadWorkout,
  onOpenBulkSend,
  onDeleteWorkout,
  onSaveCurrentToLibrary,
  currentWorkoutTitle,
}) => {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  const filtered = library.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.focus.toLowerCase().includes(search.toLowerCase()) ||
      w.day_label.toLowerCase().includes(search.toLowerCase());
    const matchesTag =
      tagFilter === "all" ||
      w.title.toLowerCase().includes(tagFilter.toLowerCase()) ||
      w.focus.toLowerCase().includes(tagFilter.toLowerCase());
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Action Buttons */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D8B46A]/15 border border-[#D8B46A]/40 text-[#D8B46A] flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D8B46A] bg-[#D8B46A]/10 px-2.5 py-0.5 rounded-full border border-[#D8B46A]/20">
              ACERVO TÁTICO OFICIAL
            </span>
            <h2 className="text-lg font-black text-[#F5F5F7] tracking-tight mt-1">
              Biblioteca de Treinos do Coach
            </h2>
            <p className="text-xs text-[#9B9BA1]">
              Salve, organize e envie protocolos prescritos diretamente para grupos ou turmas de alunos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentWorkoutTitle && (
            <button
              id="save-current-to-library-btn"
              onClick={onSaveCurrentToLibrary}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/40 hover:bg-[#D8B46A]/25 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Salva o treino que está atualmente aberto no editor na sua biblioteca"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salvar Treino Atual na Biblioteca</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTagFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tagFilter === "all"
                ? "bg-[#D8B46A] text-[#0A0A0A]"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
            }`}
          >
            Todos ({library.length})
          </button>
          <button
            onClick={() => setTagFilter("shape")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              tagFilter === "shape"
                ? "bg-pink-500/20 text-pink-400 border-pink-500"
                : "bg-[#1D1D1F] text-[#9B9BA1] border-transparent hover:text-white"
            }`}
          >
            VYRA SHAPE
          </button>
          <button
            onClick={() => setTagFilter("forge")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              tagFilter === "forge"
                ? "bg-blue-500/20 text-blue-400 border-blue-500"
                : "bg-[#1D1D1F] text-[#9B9BA1] border-transparent hover:text-white"
            }`}
          >
            VYRA FORGE
          </button>
          <button
            onClick={() => setTagFilter("reset")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              tagFilter === "reset"
                ? "bg-[#D8B46A]/20 text-[#D8B46A] border-[#D8B46A]"
                : "bg-[#1D1D1F] text-[#9B9BA1] border-transparent hover:text-white"
            }`}
          >
            RESET 12
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título ou foco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
          />
        </div>
      </div>

      {/* Library Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
          <BookOpen className="w-8 h-8 text-[#9B9BA1] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#F5F5F7]">Nenhum treino encontrado</h3>
          <p className="text-xs text-[#9B9BA1] max-w-sm mx-auto">
            Utilize o botão "Salvar Treino Atual na Biblioteca" no editor de treinos para armazenar novos modelos de treinamento aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isShape = item.title.toLowerCase().includes("shape") || item.focus.toLowerCase().includes("glúteo");
            const isForge = item.title.toLowerCase().includes("forge") || item.focus.toLowerCase().includes("hipertrofia pura");
            const planBadge = isShape
              ? { text: "VYRA SHAPE", color: "text-pink-400 bg-pink-500/10 border-pink-500/30" }
              : isForge
              ? { text: "VYRA FORGE", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" }
              : { text: "RESET 12", color: "text-[#D8B46A] bg-[#D8B46A]/10 border-[#D8B46A]/30" };

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] hover:border-[#D8B46A]/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${planBadge.color}`}>
                      {planBadge.text}
                    </span>
                    <span className="text-[11px] font-bold text-[#9B9BA1]">
                      {item.day_label}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#F5F5F7] tracking-tight mt-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#9B9BA1] mt-0.5 line-clamp-1">
                    {item.focus}
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-[11px] text-[#9B9BA1]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D8B46A]" />
                      {item.duration_min} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#FF6A2A]" />
                      {item.intensity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-[#34C759]" />
                      {item.exercises?.length || 0} exercícios
                    </span>
                  </div>

                  {/* Exercises Peek */}
                  <div className="mt-3 pt-3 border-t border-[#2B2B2F] space-y-1">
                    {item.exercises?.slice(0, 3).map((ex, exI) => (
                      <div key={exI} className="text-[11px] text-[#9B9BA1] flex items-center justify-between">
                        <span className="truncate max-w-[180px]">· {ex.name}</span>
                        <span className="text-[#D8B46A] font-bold shrink-0">{ex.sets}x {ex.reps}</span>
                      </div>
                    ))}
                    {(item.exercises?.length || 0) > 3 && (
                      <span className="text-[10px] text-[#9B9BA1] italic block pt-0.5">
                        + {(item.exercises?.length || 0) - 3} outros exercícios...
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-[#2B2B2F]">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onLoadWorkout(item)}
                      className="py-2 px-3 rounded-xl bg-[#1D1D1F] hover:bg-[#2B2B2F] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] hover:text-[#D8B46A] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Abrir Editor</span>
                    </button>

                    <button
                      onClick={() => onOpenBulkSend(item)}
                      className="py-2 px-3 rounded-xl bg-[#FF6A2A]/15 hover:bg-[#FF6A2A]/25 border border-[#FF6A2A]/40 text-xs font-bold text-[#FF9A62] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Alunos</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteWorkout(item.id)}
                    className="w-full py-1 text-[11px] text-[#9B9BA1] hover:text-[#FF453A] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover da Biblioteca</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
