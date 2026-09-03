import React, { useState } from "react";
import { Student, Workout } from "../types";
import { api } from "../api/client";
import { Send, Users, Check, X, Search, Filter, ShieldCheck } from "lucide-react";

interface BulkSendWorkoutModalProps {
  isOpen: boolean;
  workout: Workout | null;
  students: Student[];
  onClose: () => void;
  onSuccess: (count: number, message: string) => void;
}

export const BulkSendWorkoutModal: React.FC<BulkSendWorkoutModalProps> = ({
  isOpen,
  workout,
  students,
  onClose,
  onSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(students.map((s) => s.id));
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sending, setSending] = useState(false);

  if (!isOpen || !workout) return null;

  const filteredStudents = students.filter((std) => {
    const matchesSearch =
      std.name.toLowerCase().includes(search.toLowerCase()) ||
      std.email.toLowerCase().includes(search.toLowerCase()) ||
      std.goal.toLowerCase().includes(search.toLowerCase());
    const matchesPlan =
      planFilter === "all" || std.plan.toLowerCase().includes(planFilter.toLowerCase());
    return matchesSearch && matchesPlan;
  });

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleSelectByPlan = (planKeyword: string) => {
    const ids = students
      .filter((s) => s.plan.toLowerCase().includes(planKeyword.toLowerCase()))
      .map((s) => s.id);
    setSelectedIds(ids);
  };

  const handleToggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setSending(true);
    try {
      const res = await api.bulkAssignWorkout(selectedIds, workout);
      onSuccess(res.count, res.message);
      onClose();
    } catch (e) {
      console.error("Error bulk sending workout:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-2.5">
            <Send className="w-5 h-5 text-[#FF6A2A]" />
            <div>
              <h3 className="text-base font-bold text-[#F5F5F7]">Enviar Treino para Alunos</h3>
              <p className="text-xs text-[#9B9BA1]">
                Treino: <span className="text-[#D8B46A] font-semibold">{workout.title}</span> ({workout.day_label} · {workout.duration_min} min)
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

        {/* Quick Filter Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider">
              Seleção Rápida por Plano:
            </span>
            <span className="text-xs font-bold text-[#D8B46A]">
              {selectedIds.length} selecionado(s) de {students.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedIds(students.map((s) => s.id))}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1D1D1F] hover:bg-[#2B2B2F] text-[#F5F5F7] border border-[#2B2B2F] cursor-pointer"
            >
              Todos ({students.length})
            </button>
            <button
              onClick={() => handleSelectByPlan("shape")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 hover:bg-pink-500/25 cursor-pointer"
            >
              Apenas VYRA SHAPE
            </button>
            <button
              onClick={() => handleSelectByPlan("forge")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 cursor-pointer"
            >
              Apenas VYRA FORGE
            </button>
            <button
              onClick={() => handleSelectByPlan("reset")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/30 hover:bg-[#D8B46A]/25 cursor-pointer"
            >
              Apenas RESET 12
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1D1D1F] text-[#FF453A] border border-[#FF453A]/30 hover:bg-[#FF453A]/10 cursor-pointer"
            >
              Limpar Seleção
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar aluno por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
          />
        </div>

        {/* Student Checklist */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {filteredStudents.map((std) => {
            const isChecked = selectedIds.includes(std.id);
            const isShape = std.plan.toLowerCase().includes("shape");
            const isForge = std.plan.toLowerCase().includes("forge");
            const planBadgeColor = isShape
              ? "text-pink-400 border-pink-500/30 bg-pink-500/10"
              : isForge
              ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
              : "text-[#D8B46A] border-[#D8B46A]/30 bg-[#D8B46A]/10";

            return (
              <div
                key={std.id}
                onClick={() => handleToggleStudent(std.id)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isChecked
                    ? "bg-[#1D1D1F] border-[#FF6A2A]/60 shadow-sm"
                    : "bg-[#121214] border-[#2B2B2F] opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isChecked
                        ? "bg-[#FF6A2A] border-[#FF6A2A] text-white"
                        : "border-[#4A4A52] bg-transparent"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <img
                    src={std.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&q=80"}
                    alt={std.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#2B2B2F]"
                  />

                  <div>
                    <h4 className="text-xs font-bold text-[#F5F5F7] leading-tight">{std.name}</h4>
                    <span className="text-[10px] text-[#9B9BA1]">{std.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${planBadgeColor}`}>
                    {std.plan}
                  </span>
                  <span className="text-[10px] font-bold text-[#34C759]">
                    {std.adherence_pct}% adesão
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2B2B2F]">
          <span className="text-xs text-[#9B9BA1]">
            Receberão notificação push no app.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="confirm-bulk-send-workout-btn"
              disabled={selectedIds.length === 0 || sending}
              onClick={handleSend}
              className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? "Enviando..." : `Enviar para ${selectedIds.length} Aluno(s)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
