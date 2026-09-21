import React, { useState } from "react";
import { Student, DietTemplate, Diet } from "../types";
import { api } from "../api/client";
import { Send, Users, Check, X, Search, UtensilsCrossed, Flame } from "lucide-react";

interface BulkSendDietModalProps {
  isOpen: boolean;
  dietTemplate: DietTemplate | null;
  students: Student[];
  onClose: () => void;
  onSuccess: (count: number, message: string) => void;
}

export const BulkSendDietModal: React.FC<BulkSendDietModalProps> = ({
  isOpen,
  dietTemplate,
  students,
  onClose,
  onSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(students.map((s) => s.id));
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sending, setSending] = useState(false);

  if (!isOpen || !dietTemplate) return null;

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
      const dietPayload: Diet = {
        id: `diet-bulk-${Date.now()}`,
        kcal: dietTemplate.target_kcal,
        target_kcal: dietTemplate.target_kcal,
        protein_pct: dietTemplate.protein_pct,
        carbs_pct: dietTemplate.carbs_pct,
        fats_pct: dietTemplate.fats_pct,
        target_protein_g: dietTemplate.target_protein_g,
        target_carbs_g: dietTemplate.target_carbs_g,
        target_fats_g: dietTemplate.target_fats_g,
        foods: dietTemplate.foods || [],
        diet_released: true,
      };

      const res = await api.bulkAssignDiet(selectedIds, dietPayload, dietTemplate.title);
      onSuccess(res.count, res.message);
      onClose();
    } catch (e) {
      console.error("Error bulk sending diet:", e);
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
            <div className="w-10 h-10 rounded-2xl bg-[#FF6A2A]/15 text-[#FF6A2A] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5F7]">Enviar Dieta para Alunos</h3>
              <p className="text-xs text-[#9B9BA1]">
                Protocolo: <span className="text-[#D8B46A] font-semibold">{dietTemplate.title}</span> ({dietTemplate.target_kcal} kcal)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9B9BA1] hover:text-white text-xs font-bold p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider">
              Seleção Rápida por Plano:
            </span>
            <span className="text-xs font-semibold text-[#D8B46A]">
              {selectedIds.length} de {filteredStudents.length} selecionados
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectByPlan("")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1D1D1F] text-[#9B9BA1] hover:text-white border border-[#2B2B2F] cursor-pointer"
            >
              Todos os Planos
            </button>
            <button
              type="button"
              onClick={() => handleSelectByPlan("Diamond")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1D1D1F] text-[#9B9BA1] hover:text-white border border-[#2B2B2F] cursor-pointer"
            >
              💎 Diamond
            </button>
            <button
              type="button"
              onClick={() => handleSelectByPlan("Platinum")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1D1D1F] text-[#9B9BA1] hover:text-white border border-[#2B2B2F] cursor-pointer"
            >
              ⭐ Platinum
            </button>
            <button
              type="button"
              onClick={() => handleSelectByPlan("Black")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1D1D1F] text-[#9B9BA1] hover:text-white border border-[#2B2B2F] cursor-pointer"
            >
              🖤 Black
            </button>
          </div>
        </div>

        {/* Search and Select All Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou objetivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs placeholder-[#6E6E73] focus:outline-none focus:border-[#FF6A2A]"
            />
          </div>
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] hover:bg-[#2B2B2F] transition-all cursor-pointer shrink-0"
          >
            {selectedIds.length === filteredStudents.length ? "Desmarcar Todos" : "Marcar Todos"}
          </button>
        </div>

        {/* Students List Scrollable */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#2B2B2F]/40">
          {filteredStudents.length === 0 ? (
            <p className="text-xs text-[#9B9BA1] text-center py-6">
              Nenhum aluno encontrado com este filtro.
            </p>
          ) : (
            filteredStudents.map((std) => {
              const isChecked = selectedIds.includes(std.id);
              return (
                <div
                  key={std.id}
                  onClick={() => handleToggleStudent(std.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isChecked
                      ? "bg-[#FF6A2A]/10 border border-[#FF6A2A]/40"
                      : "hover:bg-[#1D1D1F] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        isChecked
                          ? "bg-[#FF6A2A] border-[#FF6A2A] text-white"
                          : "border-[#4E4E52] bg-[#1D1D1F]"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <img
                      src={std.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
                      alt={std.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F5F5F7] truncate">
                          {std.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1D1D1F] text-[#D8B46A] border border-[#2B2B2F] shrink-0 font-medium">
                          {std.plan}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9B9BA1] block truncate">
                        {std.goal || "Condicionamento Geral"} · {std.email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] text-[#9B9BA1] block">
                      {std.diet?.kcal ? `${std.diet.kcal} kcal atual` : "Sem dieta"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Confirmation & Actions */}
        <div className="pt-3 border-t border-[#2B2B2F] flex items-center justify-between">
          <div className="text-xs text-[#9B9BA1]">
            Será liberado na aba de Dieta dos alunos marcados.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-white bg-[#1D1D1F] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="confirm-bulk-send-diet-btn"
              onClick={handleSend}
              disabled={selectedIds.length === 0 || sending}
              className="px-4 py-2 rounded-xl text-xs font-black bg-[#FF6A2A] text-white hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-[#FF6A2A]/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {sending
                  ? "Enviando Dieta..."
                  : `Enviar para ${selectedIds.length} Aluno(s)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
