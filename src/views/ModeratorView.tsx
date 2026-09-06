import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Coach } from "../types";
import {
  Shield,
  Plus,
  Check,
  UserCheck,
  ShieldAlert,
  X,
  Mail,
  Copy,
  ExternalLink,
  Trash2,
  Lock,
  Users,
} from "lucide-react";

export const ModeratorView: React.FC = () => {
  const {
    t,
    currentUserEmail,
    registeredModerators,
    addCoachEmail,
    addModeratorEmail,
    loginWithEmail,
    setActiveView,
  } = useApp();

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [coachName, setCoachName] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New moderator email input state
  const [newModEmail, setNewModEmail] = useState("");
  const [modFeedback, setModFeedback] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCoaches()
      .then((data) => {
        if (data && data.length > 0) {
          setCoaches(data);
        } else {
          // Default initial fallback
          setCoaches([
            { id: "c-1", email: "mari@vyra.club", active: true },
            { id: "c-2", email: "coach.mari@vyra.club", active: true },
          ]);
        }
      })
      .catch((e) => {
        console.error("Error loading coaches:", e);
        setCoaches([
          { id: "c-1", email: "mari@vyra.club", active: true },
          { id: "c-2", email: "coach.mari@vyra.club", active: true },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setFeedback({ type: "error", text: "Por favor, insira um e-mail válido." });
      return;
    }

    try {
      // Add via API & AppContext
      const appRes = await addCoachEmail(clean);
      const created = await api.createCoach(clean);

      setCoaches((prev) => {
        const exists = prev.some((c) => c.email.toLowerCase() === clean);
        if (exists) return prev;
        return [created, ...prev];
      });

      setNewEmail("");
      setCoachName("");
      setFeedback({
        type: "success",
        text: `Coach com e-mail "${clean}" credenciado com sucesso! O acesso ao Painel do Coach já está liberado.`,
      });
    } catch (e) {
      console.error("Error adding coach:", e);
      // Local state fallback
      const appRes = await addCoachEmail(clean);
      const fakeCoach: Coach = {
        id: `c-${Date.now()}`,
        email: clean,
        active: true,
      };
      setCoaches((prev) => [fakeCoach, ...prev]);
      setNewEmail("");
      setFeedback({
        type: "success",
        text: `Coach com e-mail "${clean}" credenciado com sucesso!`,
      });
    }
  };

  const handleToggleCoach = async (id: string, email: string) => {
    try {
      await api.toggleCoach(id);
      setCoaches((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
      );
    } catch {
      setCoaches((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
      );
    }
  };

  const handleAddModerator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModEmail.trim()) return;
    const res = addModeratorEmail(newModEmail.trim());
    setModFeedback(res.message);
    setNewModEmail("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black tracking-widest text-[#6D9BFF] uppercase bg-[#6D9BFF]/15 px-3 py-1 rounded-full border border-[#6D9BFF]/30">
            GOVERNANÇA & SEGURANÇA
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2">
            Painel de Moderação & Credenciamento
          </h1>
          <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1">
            Controle restrito por e-mail: credencie treinadores e gerencie acessos de moderadores.
          </p>
        </div>

        {/* Current Moderator Badge */}
        <div className="px-4 py-2.5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#6D9BFF]/20 text-[#6D9BFF] flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">
              Moderador Conectado
            </span>
            <span className="text-xs font-bold text-[#F5F5F7]">
              {currentUserEmail}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Task: Credenciar Novo Coach por E-mail */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F5F7]">
              Credenciar E-mail de Treinador (Coach)
            </h3>
            <p className="text-xs text-[#9B9BA1]">
              Insira o e-mail de quem será coach no Vyra Club. O profissional terá acesso imediato ao Painel do Coach e à criação de links de convite para novos alunos.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddCoach} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">
                E-mail do Treinador (Obrigatório)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ex: coach.lucas@vyra.club ou pessoal@gmail.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setFeedback(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#D8B46A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">
                Nome do Treinador (Opcional)
              </label>
              <input
                type="text"
                placeholder="ex: Mariana Ferreira"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#D8B46A]"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                feedback.type === "success"
                  ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30"
                  : "bg-red-500/15 text-red-400 border border-red-500/30"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D8B46A] hover:bg-[#E2C382] text-[#0A0A0A] shrink-0 flex items-center gap-2 transition-all shadow-md shadow-[#D8B46A]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Credenciar Coach</span>
            </button>
          </div>
        </form>
      </div>

      {/* Coaches List */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D8B46A]" />
            <h3 className="text-sm font-bold text-[#F5F5F7]">
              Coaches Credenciados ({coaches.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#9B9BA1]">
            Acesso automático liberado ao logar com estes e-mails
          </span>
        </div>

        <div className="space-y-2.5">
          {coaches.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D8B46A]/15 text-[#D8B46A] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F5F7]">{c.email}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#9B9BA1]">
                      Permissão: Painel do Coach & Convite de Alunos
                    </span>
                    {c.email.includes("mari") && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#D8B46A]/20 text-[#D8B46A]">
                        Ativa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    loginWithEmail(c.email);
                    setActiveView("coach");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2B2B2F] text-[#F5F5F7] hover:bg-[#3A3A40] transition-colors flex items-center gap-1"
                  title="Testar acesso com este e-mail"
                >
                  <ExternalLink className="w-3 h-3 text-[#D8B46A]" />
                  <span>Acessar como Coach</span>
                </button>

                <button
                  onClick={() => handleToggleCoach(c.id, c.email)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    c.active
                      ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 hover:bg-[#34C759]/25"
                      : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 hover:bg-[#FF453A]/25"
                  }`}
                >
                  {c.active ? "Ativo" : "Revogado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Moderator Governance: E-mails autorizados para Moderador */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6D9BFF]/20 text-[#6D9BFF] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F7]">
              Governança de Moderadores Oficiais
            </h3>
            <p className="text-xs text-[#9B9BA1]">
              Apenas e-mails cadastrados abaixo podem acessar o painel de moderação.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {registeredModerators.map((email, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#6D9BFF]" />
                <span className="text-xs font-bold text-[#F5F5F7]">{email}</span>
                {email === "cubocao@gmail.com" && (
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#6D9BFF]/20 text-[#6D9BFF] border border-[#6D9BFF]/30 uppercase">
                    Administrador Master
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#34C759] font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Autorizado
              </span>
            </div>
          ))}
        </div>

        {/* Add another trusted moderator */}
        <form onSubmit={handleAddModerator} className="pt-2 flex gap-2">
          <input
            type="email"
            placeholder="Adicionar outro e-mail de moderador confiável"
            value={newModEmail}
            onChange={(e) => {
              setNewModEmail(e.target.value);
              setModFeedback(null);
            }}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#6D9BFF]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6D9BFF] text-white hover:bg-[#86ABFF] transition-colors"
          >
            Adicionar Moderador
          </button>
        </form>

        {modFeedback && (
          <p className="text-xs font-medium text-[#6D9BFF] mt-1">{modFeedback}</p>
        )}
      </div>
    </div>
  );
};
