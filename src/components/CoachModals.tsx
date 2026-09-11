import React, { useState } from "react";
import {
  X,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  Dumbbell,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  CreditCard,
  Search,
} from "lucide-react";
import { useApp } from "../context/AppContext";

import { FinanceCRMTableWeb } from "./FinanceCRMTableWeb";

interface CoachFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachFinancialModal: React.FC<CoachFinancialModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "crm">("overview");
  const [payoutRequested, setPayoutRequested] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5F5F7]">Dashboard Financeiro do Coach</h3>
              <p className="text-xs text-[#9B9BA1]">Métricas consolidadas de assinaturas e faturamento Stripe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9B9BA1] hover:text-[#F5F5F7] p-2 rounded-xl hover:bg-[#1D1D1F] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#2B2B2F] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#34C759] text-[#0A0A0A] shadow-md shadow-[#34C759]/20"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            }`}
          >
            Métricas Stripe & Faturamento
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("crm")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "crm"
                ? "bg-[#D8B46A] text-black shadow-md shadow-[#D8B46A]/20"
                : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            }`}
          >
            CRM de Alunos & Planos
          </button>
        </div>

        {activeTab === "crm" ? (
          <FinanceCRMTableWeb />
        ) : (
          <>
            {/* Big Numbers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-1">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase flex items-center justify-between">
                  <span>MRR Atual</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#34C759]" />
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#34C759] block">R$ 6.840,00</span>
                <span className="text-[10px] text-[#34C759] font-medium">+14.2% vs mês anterior</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-1">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Alunos Ativos</span>
                <span className="text-xl sm:text-2xl font-black text-[#F5F5F7] block">38</span>
                <span className="text-[10px] text-[#9B9BA1]">36 adimplentes · 2 em cobrança</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Ticket Médio</span>
                <span className="text-xl sm:text-2xl font-black text-[#D8B46A] block">R$ 180,00</span>
                <span className="text-[10px] text-[#9B9BA1]">Base em planos recorrentes</span>
              </div>
            </div>

            {/* Breakdown por Protocolo */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                Distribuição da Base por Protocolo
              </h4>
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-[#F5F5F7]">Protocolo Force (Hipertrofia & Força)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#F5F5F7]">16 alunos</span>
                    <span className="text-[10px] text-[#9B9BA1] block">R$ 2.878,40/mês</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    <span className="text-xs font-bold text-[#F5F5F7]">Protocolo Shape (Definição & Glúteos)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#F5F5F7]">14 alunos</span>
                    <span className="text-[10px] text-[#9B9BA1] block">R$ 2.518,60/mês</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D8B46A]" />
                    <span className="text-xs font-bold text-[#F5F5F7]">Projeto Reset 12 (Recomposição Corporal)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#F5F5F7]">8 alunos</span>
                    <span className="text-[10px] text-[#9B9BA1] block">R$ 1.443,00/mês</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Repasses & Saque Stripe Connect */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1A1A1E] to-[#161619] border border-[#2B2B2F] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Saldo Disponível para Saque</span>
                <div className="text-xl font-black text-[#F5F5F7] mt-0.5">R$ 5.472,00</div>
                <span className="text-[10px] text-[#34C759]">Conta Stripe Connect vinculada</span>
              </div>

              <button
                onClick={() => {
                  setPayoutRequested(true);
                  setTimeout(() => setPayoutRequested(false), 4000);
                }}
                disabled={payoutRequested}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#34C759] hover:bg-[#30B350] text-[#0A0A0A] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#34C759]/20"
              >
                {payoutRequested ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Solicitação enviada ao Stripe!</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Solicitar Payout Imediato</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface CoachStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachStudentsModal: React.FC<CoachStudentsModalProps> = ({ isOpen, onClose }) => {
  const { sendNotification } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<string | null>(null);
  const [assignedWorkoutName, setAssignedWorkoutName] = useState("Push & Pull Hipertrofia Fase 2");

  if (!isOpen) return null;

  const students = [
    {
      id: "std-1",
      name: "Rafael Silva (Aluno Teste)",
      email: "cubocao@gmail.com",
      plan: "Protocolo Force",
      cycle: "Mensal",
      status: "active",
      streak: "14 dias",
      lastCheckin: "Hoje, 09:30",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "std-2",
      name: "Beatriz Nogueira",
      email: "beatriz.nogueira@gmail.com",
      plan: "Protocolo Shape",
      cycle: "Trimestral",
      status: "active",
      streak: "21 dias",
      lastCheckin: "Ontem",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "std-3",
      name: "Lucas Mendes",
      email: "lucas.mendes@hotmail.com",
      plan: "Projeto Reset 12",
      cycle: "Semestral",
      status: "active",
      streak: "6 dias",
      lastCheckin: "Há 2 dias",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "std-4",
      name: "Camila Fernandes",
      email: "camila.f@outlook.com",
      plan: "Protocolo Shape",
      cycle: "Mensal",
      status: "active",
      streak: "30 dias",
      lastCheckin: "Hoje, 07:15",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    },
  ];

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDispatchWorkout = (studentName: string) => {
    setDispatchedSuccess(studentName);
    sendNotification(
      "Treino Prescrito!",
      `Novo treino '${assignedWorkoutName}' enviado com sucesso para ${studentName}.`,
      "coach"
    );
    setTimeout(() => {
      setDispatchedSuccess(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2B2B2F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6A2A]/15 text-[#FF6A2A] border border-[#FF6A2A]/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5F5F7]">Gestão de Alunos do Coach</h3>
              <p className="text-xs text-[#9B9BA1]">Prescreva rotinas, acompanhe check-ins e dispare treinos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9B9BA1] hover:text-[#F5F5F7] p-2 rounded-xl hover:bg-[#1D1D1F] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback de Treino Disparado */}
        {dispatchedSuccess && (
          <div className="p-3.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/40 text-[#34C759] text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Treino prescrito e sincronizado para {dispatchedSuccess}! O aluno já pode visualizar no calendário.</span>
          </div>
        )}

        {/* Barra de Busca */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#9B9BA1] focus:outline-none focus:border-[#FF6A2A]"
          />
        </div>

        {/* Lista de Alunos */}
        <div className="space-y-3">
          {filtered.map((student) => {
            const isSelected = selectedStudent === student.id;
            return (
              <div
                key={student.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-[#1D1D1F] border-[#FF6A2A]"
                    : "bg-[#1A1A1E] border-[#2B2B2F] hover:border-[#3D3D45]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-11 h-11 rounded-xl object-cover border border-[#2B2B2F]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#F5F5F7]">{student.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30">
                          {student.status === "active" ? "Ativo" : "Pendente"}
                        </span>
                      </div>
                      <p className="text-xs text-[#9B9BA1] font-mono">{student.email}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#9B9BA1] mt-1">
                        <span>{student.plan} ({student.cycle})</span>
                        <span>•</span>
                        <span>Streak: <strong className="text-[#FF6A2A]">{student.streak}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      id={`btn-dispatch-${student.id}`}
                      onClick={() => handleDispatchWorkout(student.name)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] hover:bg-[#FF9A62] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#FF6A2A]/20 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Disparar Treino</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
