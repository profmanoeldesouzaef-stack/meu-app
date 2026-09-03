import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Coach } from "../types";
import { Shield, Plus, Check, UserCheck, ShieldAlert, X } from "lucide-react";

export const ModeratorView: React.FC = () => {
  const { t } = useApp();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCoaches()
      .then((data) => setCoaches(data))
      .catch((e) => console.error("Error loading coaches:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const created = await api.createCoach(newEmail.trim());
      setCoaches((prev) => [created, ...prev]);
      setNewEmail("");
    } catch (e) {
      console.error("Error adding coach:", e);
    }
  };

  const handleToggleCoach = async (id: string) => {
    try {
      const updated = await api.toggleCoach(id);
      setCoaches((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      console.error("Error toggling coach:", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <span className="text-xs font-black tracking-widest text-[#6D9BFF] uppercase bg-[#6D9BFF]/15 px-3 py-1 rounded-full border border-[#6D9BFF]/30">
          GOVERNANÇA & SEGURANÇA
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2">
          {t("mod.title")}
        </h1>
        <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1">
          Credenciamento e gestão de acessos de treinadores e moderadores do Vyra Club.
        </p>
      </div>

      {/* Add Coach Form */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#6D9BFF]" />
          {t("mod.add_coach")}
        </h3>

        <form onSubmit={handleAddCoach} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="coach.nome@vyra.app"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#6D9BFF]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#6D9BFF] text-white hover:brightness-110 shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Credenciar</span>
          </button>
        </form>
      </div>

      {/* Coaches List */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
        <h3 className="text-sm font-bold text-[#F5F5F7]">Coaches Credenciados Ativos</h3>

        <div className="space-y-2">
          {coaches.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#6D9BFF]/15 text-[#6D9BFF] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F5F7]">{c.email}</h4>
                  <span className="text-[10px] text-[#9B9BA1]">Permissão: Acesso Coach Total</span>
                </div>
              </div>

              <button
                onClick={() => handleToggleCoach(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  c.active
                    ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 hover:bg-[#34C759]/25"
                    : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 hover:bg-[#FF453A]/25"
                }`}
              >
                {c.active ? "Ativo" : "Revogado"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
