import React, { useState, useMemo, useEffect } from "react";
import { Student } from "../types";
import {
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  Search,
  Check,
  Play,
  SkipForward,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit3,
  X,
  Users,
  Copy,
  Info,
} from "lucide-react";

interface CoachWhatsAppModuleProps {
  students: Student[];
  onUpdateStudentPhone?: (studentId: string, newPhone: string) => void;
}

// Modelos pré-definidos de mensagens
const DEFAULT_TEMPLATES = [
  {
    id: "alinhamento",
    title: "Alinhamento de Protocolo",
    description: "Para calibrar treinos e dieta com o aluno recém-chegado",
    text: "Olá, {nome}! Aqui é o Coach da Vyra Training. Estou finalizando a calibração do seu protocolo de treinos e dieta. Vamos alinhar alguns detalhes rápidos?",
  },
  {
    id: "avaliacao_20d",
    title: "Lembrete de Avaliação (20 Dias)",
    description: "Aviso de check-in periódico de fotos e medidas corporais",
    text: "Olá, {nome}! Passando para lembrar que faltam poucos dias para a atualização das suas fotos e medidas no app da Vyra. Fique atento ao check-in!",
  },
  {
    id: "personalizada",
    title: "Mensagem Personalizada",
    description: "Texto livre configurável pelo coach",
    text: "Olá, {nome}! Passando para ver como estão os treinos desta semana do seu {protocolo}. Alguma dúvida ou ajuste necessário?",
  },
];

/**
 * Higieniza o número de telefone removendo espaços, traços, parênteses e caracteres não-numéricos.
 * Garante o DDI 55 (Brasil) caso não esteja presente.
 */
export function sanitizePhoneNumber(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  // Se já começar com 55 e tiver tamanho compatível com DDD + 8 ou 9 dígitos (ex: 5511999998888 -> 12 ou 13 dígitos)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tem DDD e número (10 ou 11 dígitos, ex: 11988887777 ou 1188887777)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Fallback se tiver pelo menos 8 dígitos
  if (digits.length >= 8) {
    return `55${digits}`;
  }

  return "";
}

/**
 * Formata visualmente o telefone para exibição: (XX) XXXXX-XXXX
 */
export function formatPhoneDisplay(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  // Se tiver 55 no início, remove para exibição local
  let local = digits;
  if (local.startsWith("55") && local.length >= 12) {
    local = local.slice(2);
  }

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

export const CoachWhatsAppModule: React.FC<CoachWhatsAppModuleProps> = ({
  students,
  onUpdateStudentPhone,
}) => {
  // Estado do template ativo
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("alinhamento");
  const [messageText, setMessageText] = useState<string>(DEFAULT_TEMPLATES[0].text);

  // Histórico de alunos que já receberam mensagem nesta sessão
  const [sentStudentIds, setSentStudentIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("vyra_whatsapp_sent_ids");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Busca e Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPhone, setFilterPhone] = useState<"all" | "has_phone" | "no_phone" | "pending" | "sent">("all");

  // Edição rápida de telefone de aluno no local
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState("");
  const [localPhoneOverrides, setLocalPhoneOverrides] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("vyra_student_phones_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal da Fila de Disparos
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueCopiedFeedback, setQueueCopiedFeedback] = useState(false);

  // Sincroniza estado de envio no localStorage
  useEffect(() => {
    try {
      localStorage.setItem("vyra_whatsapp_sent_ids", JSON.stringify(sentStudentIds));
    } catch (e) {
      console.warn("Could not save sent student ids", e);
    }
  }, [sentStudentIds]);

  // Altera template selecionado
  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = DEFAULT_TEMPLATES.find((t) => t.id === tplId);
    if (found) {
      setMessageText(found.text);
    }
  };

  // Formata mensagem substituindo variáveis {nome} e {protocolo}
  const formatMessageForStudent = (rawText: string, student: Student): string => {
    const studentName = student.name ? student.name.split(" ")[0] : student.nickname || "Aluno";
    const protocolName = student.plan || "Protocolo Vyra";
    return rawText
      .replace(/{nome}/gi, studentName)
      .replace(/{protocolo}/gi, protocolName);
  };

  // Obtém telefone efetivo considerando possíveis edições do coach
  const getEffectivePhone = (student: Student): string => {
    if (localPhoneOverrides[student.id]) {
      return localPhoneOverrides[student.id];
    }
    return student.phone || student.whatsapp || "";
  };

  // Salva edição local de telefone
  const handleSavePhone = (studentId: string) => {
    const clean = editPhoneValue.trim();
    const updated = { ...localPhoneOverrides, [studentId]: clean };
    setLocalPhoneOverrides(updated);
    try {
      localStorage.setItem("vyra_student_phones_overrides", JSON.stringify(updated));
    } catch {}
    if (onUpdateStudentPhone) {
      onUpdateStudentPhone(studentId, clean);
    }
    setEditingStudentId(null);
  };

  // Abre o WhatsApp para um aluno específico
  const handleSendToStudent = (student: Student) => {
    const phone = getEffectivePhone(student);
    const cleanPhone = sanitizePhoneNumber(phone);

    if (!cleanPhone) {
      alert(`O aluno ${student.name} não possui um telefone válido cadastrado.`);
      return;
    }

    const formattedMessage = formatMessageForStudent(messageText, student);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedMessage)}`;

    // Abre em nova aba
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    // Marca como enviado
    setSentStudentIds((prev) => ({ ...prev, [student.id]: true }));
  };

  // Limpa o histórico de envios
  const handleResetSentStatus = () => {
    if (window.confirm("Deseja redefinir o status de envio de todos os alunos?")) {
      setSentStudentIds({});
    }
  };

  // Lista filtrada de alunos
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const phone = getEffectivePhone(s);
      const hasPhone = Boolean(sanitizePhoneNumber(phone));
      const isSent = Boolean(sentStudentIds[s.id]);

      // Filtro de status
      if (filterPhone === "has_phone" && !hasPhone) return false;
      if (filterPhone === "no_phone" && hasPhone) return false;
      if (filterPhone === "pending" && (!hasPhone || isSent)) return false;
      if (filterPhone === "sent" && !isSent) return false;

      // Filtro de busca
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchPlan = s.plan.toLowerCase().includes(q);
      const matchPhone = phone.includes(q);
      return matchName || matchEmail || matchPlan || matchPhone;
    });
  }, [students, localPhoneOverrides, sentStudentIds, filterPhone, searchQuery]);

  // Alunos elegíveis para a fila de disparo (com telefone válido)
  const queueEligibleStudents = useMemo(() => {
    return students.filter((s) => {
      const phone = getEffectivePhone(s);
      return Boolean(sanitizePhoneNumber(phone));
    });
  }, [students, localPhoneOverrides]);

  // Aluno atual na fila de disparos
  const currentQueueStudent = queueEligibleStudents[queueIndex] || null;

  // Iniciar Fila
  const handleStartQueue = () => {
    if (queueEligibleStudents.length === 0) {
      alert("Não há alunos cadastrados com número de telefone para a fila de disparos.");
      return;
    }
    // Procura o primeiro que ainda não foi enviado
    const firstPendingIdx = queueEligibleStudents.findIndex((s) => !sentStudentIds[s.id]);
    setQueueIndex(firstPendingIdx !== -1 ? firstPendingIdx : 0);
    setIsQueueOpen(true);
  };

  // Dispara o atual da fila e avança
  const handleQueueSendCurrent = () => {
    if (!currentQueueStudent) return;
    handleSendToStudent(currentQueueStudent);

    // Avança para o próximo se houver
    if (queueIndex + 1 < queueEligibleStudents.length) {
      setQueueIndex((prev) => prev + 1);
    }
  };

  // Pula o atual da fila sem enviar
  const handleQueueSkipCurrent = () => {
    if (queueIndex + 1 < queueEligibleStudents.length) {
      setQueueIndex((prev) => prev + 1);
    }
  };

  // Exemplo de prévia com o primeiro aluno disponível
  const previewStudent = students[0] || {
    id: "sample",
    name: "Rafael Mendes",
    nickname: "Rafa",
    plan: "Projeto Reset 12",
    email: "rafael@vyra.club",
    phone: "(11) 98123-4567",
    goal: "Hipertrofia",
    weight_kg: 81,
    height_cm: 178,
  };

  const formattedPreviewMessage = formatMessageForStudent(messageText, previewStudent);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header do Módulo */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#151515] via-[#1A1A1E] to-[#121214] border border-[#2B2B2F] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-widest text-[#25D366] uppercase bg-[#25D366]/15 px-3 py-1 rounded-full border border-[#25D366]/30 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>COMUNICAÇÃO DIRETA & DISPAROS</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1]">
                {students.length} Alunos Cadastrados
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight">
              Central WhatsApp do Treinador
            </h2>
            <p className="text-xs text-[#9B9BA1] max-w-2xl">
              Selecione templates de alinhamento ou lembretes de ciclo de 20 dias, envie mensagens personalizadas individuais ou execute a fila assistida de disparos para toda a sua turma com link direto seguro.
            </p>
          </div>

          {/* Botão Superior: Disparar Fila para Todos */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="whatsapp-btn-start-queue"
              type="button"
              onClick={handleStartQueue}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-[#25D366]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Disparar Fila para Todos</span>
            </button>

            {Object.keys(sentStudentIds).length > 0 && (
              <button
                id="whatsapp-btn-reset-sent"
                type="button"
                onClick={handleResetSentStatus}
                title="Redefinir marcações de enviados"
                className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#FF453A] hover:border-[#FF453A]/40 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seção 1: Estrutura de Mensagens Rápidas (Templates & Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Seletor de Templates e Editor */}
        <div className="lg:col-span-7 space-y-4 p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D8B46A]" />
              <h3 className="text-sm font-bold text-[#F5F5F7]">
                Modelos de Mensagem (Templates)
              </h3>
            </div>
            <span className="text-[11px] text-[#9B9BA1]">
              Tags: <code className="text-[#FF6A2A] font-bold">{"{nome}"}</code> e <code className="text-[#D8B46A] font-bold">{"{protocolo}"}</code>
            </span>
          </div>

          {/* Cards de Seleção de Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DEFAULT_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  id={`whatsapp-tpl-btn-${tpl.id}`}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-[#25D366]/15 border-[#25D366] text-[#F5F5F7] shadow-md shadow-[#25D366]/10"
                      : "bg-[#1D1D1F] border-[#2B2B2F] text-[#9B9BA1] hover:border-[#25D366]/50 hover:text-[#F5F5F7]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold truncate">
                      {tpl.title}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#9B9BA1] line-clamp-2 leading-tight">
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Editor de Texto da Mensagem */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#9B9BA1]" />
                <span>Corpo da Mensagem a Disparar:</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMessageText((prev) => prev + " {nome}")}
                  className="px-2 py-0.5 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] text-[10px] font-bold text-[#FF6A2A] hover:bg-[#FF6A2A]/10 transition-colors"
                >
                  + Inserir {"{nome}"}
                </button>
                <button
                  type="button"
                  onClick={() => setMessageText((prev) => prev + " {protocolo}")}
                  className="px-2 py-0.5 rounded-lg bg-[#1D1D1F] border border-[#2B2B2F] text-[10px] font-bold text-[#D8B46A] hover:bg-[#D8B46A]/10 transition-colors"
                >
                  + Inserir {"{protocolo}"}
                </button>
              </div>
            </div>

            <textarea
              id="whatsapp-message-textarea"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              placeholder="Digite a mensagem para o aluno. Use {nome} para ser substituído pelo primeiro nome do aluno..."
              className="w-full p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#25D366] focus:outline-none transition-colors resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Prévia ao Vivo da Mensagem Formatada */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#25D366] animate-pulse" />
                <span className="text-xs font-bold text-[#F5F5F7]">
                  Prévia em Tempo Real (WhatsApp)
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-full">
                Exemplo: {previewStudent.name.split(" ")[0]}
              </span>
            </div>

            {/* Balão estilizado estilo WhatsApp */}
            <div className="p-4 rounded-2xl bg-[#0D2418] border border-[#25D366]/30 text-xs sm:text-sm text-[#E1F7E8] space-y-2 relative shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-[#25D366] font-bold">
                <span>Coach Mariana (Vyra Training)</span>
                <span>Agora</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed font-sans">
                {formattedPreviewMessage || "Nenhuma mensagem digitada..."}
              </p>
              <div className="flex justify-end text-[10px] text-[#25D366]/70">
                <span>✓✓</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-[11px] text-[#9B9BA1] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#D8B46A] shrink-0" />
            <span>
              Ao disparar, a tag <strong className="text-[#F5F5F7]">{"{nome}"}</strong> será automaticamente substituída pelo primeiro nome do aluno cadastrado.
            </span>
          </div>
        </div>
      </div>

      {/* Seção 2: Fila de Disparo e Lista de Alunos */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D8B46A]" />
              <h3 className="text-sm sm:text-base font-bold text-[#F5F5F7]">
                Lista de Alunos & Fila de Disparo
              </h3>
            </div>
            <p className="text-xs text-[#9B9BA1]">
              Dispare mensagens individualmente ou gerencie o status de envio de cada aluno:
            </p>
          </div>

          {/* Métricas Rápidas */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs">
              <span className="text-[#9B9BA1]">Disparados: </span>
              <strong className="text-[#25D366]">
                {Object.keys(sentStudentIds).length}/{students.length}
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs">
              <span className="text-[#9B9BA1]">Com WhatsApp: </span>
              <strong className="text-[#F5F5F7]">
                {queueEligibleStudents.length}
              </strong>
            </div>
          </div>
        </div>

        {/* Barra de Filtro e Pesquisa */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="whatsapp-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail, protocolo ou telefone..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#25D366] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "Todos" },
              { id: "pending", label: "Aguardando" },
              { id: "sent", label: "Enviados" },
              { id: "no_phone", label: "Sem Telefone" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterPhone(f.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterPhone === f.id
                    ? "bg-[#25D366] text-black shadow-sm"
                    : "bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela / Lista de Alunos */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[#2B2B2F] rounded-2xl p-6">
            <Users className="w-8 h-8 text-[#6E6E73] mx-auto mb-2" />
            <p className="text-xs text-[#9B9BA1]">Nenhum aluno encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2B2B2F] text-[11px] font-bold text-[#9B9BA1] uppercase">
                  <th className="py-3 px-3">Aluno</th>
                  <th className="py-3 px-3">Protocolo Ativo</th>
                  <th className="py-3 px-3">WhatsApp / Telefone</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2F]/60 text-xs">
                {filteredStudents.map((std) => {
                  const rawPhone = getEffectivePhone(std);
                  const cleanPhone = sanitizePhoneNumber(rawPhone);
                  const hasValidPhone = Boolean(cleanPhone);
                  const isSent = Boolean(sentStudentIds[std.id]);
                  const isEditingThis = editingStudentId === std.id;

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-[#1A1A1E]/50 transition-colors group"
                    >
                      {/* Aluno Nome + Foto */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {std.avatar_url ? (
                            <img
                              src={std.avatar_url}
                              alt={std.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#2B2B2F] shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center font-bold text-[#F5F5F7] text-xs shrink-0">
                              {std.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-[#F5F5F7] block leading-tight">
                              {std.name}
                            </span>
                            <span className="text-[11px] text-[#9B9BA1]">
                              {std.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Protocolo Ativo */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#D8B46A]/10 text-[#D8B46A] border border-[#D8B46A]/20">
                          {std.plan || "Protocolo Vyra"}
                        </span>
                      </td>

                      {/* Telefone / WhatsApp */}
                      <td className="py-3.5 px-3">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editPhoneValue}
                              onChange={(e) => setEditPhoneValue(e.target.value)}
                              placeholder="(XX) 9XXXX-XXXX"
                              className="px-2 py-1 rounded-lg bg-[#1D1D1F] border border-[#25D366] text-xs text-[#F5F5F7] w-36 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePhone(std.id)}
                              className="p-1 rounded-md bg-[#25D366] text-black hover:brightness-110"
                              title="Salvar telefone"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudentId(null)}
                              className="p-1 rounded-md bg-[#2B2B2F] text-[#9B9BA1] hover:text-white"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : hasValidPhone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#F5F5F7]">
                              {formatPhoneDisplay(rawPhone)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudentId(std.id);
                                setEditPhoneValue(rawPhone);
                              }}
                              className="text-[#6E6E73] hover:text-[#D8B46A] transition-colors p-1"
                              title="Editar número"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30">
                              <AlertCircle className="w-3 h-3" />
                              <span>Sem telefone cadastrado</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudentId(std.id);
                                setEditPhoneValue("");
                              }}
                              className="text-[10px] font-bold text-[#D8B46A] hover:underline"
                            >
                              + Adicionar
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status de Envio */}
                      <td className="py-3.5 px-3 text-center">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Enviado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F]">
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Botão de Ação: Enviar WhatsApp */}
                      <td className="py-3.5 px-3 text-right">
                        {hasValidPhone ? (
                          <button
                            id={`whatsapp-send-btn-${std.id}`}
                            type="button"
                            onClick={() => handleSendToStudent(std)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-black shadow-md shadow-[#25D366]/15 transition-all cursor-pointer active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>Enviar WhatsApp</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#6E6E73] border border-[#2B2B2F] cursor-not-allowed opacity-60"
                            title="Aluno sem telefone válido para envio"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Indisponível</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DA FILA INTERATIVA DE DISPAROS ("Disparar Fila para Todos") */}
      {isQueueOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#F5F5F7]">
                    Fila Interativa de Disparos WhatsApp
                  </h3>
                  <p className="text-xs text-[#9B9BA1]">
                    Disparo guiado com link oficial <code className="text-[#25D366]">wa.me</code> aluno por aluno.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueueOpen(false)}
                className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#9B9BA1]">
                  Progresso: Aluno {queueIndex + 1} de {queueEligibleStudents.length}
                </span>
                <span className="text-[#25D366]">
                  {Math.round(((queueIndex + 1) / queueEligibleStudents.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1D1D1F] border border-[#2B2B2F] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#25D366] to-[#128C7E] transition-all duration-300"
                  style={{
                    width: `${((queueIndex + 1) / queueEligibleStudents.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Card do Aluno Atual */}
            {currentQueueStudent ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentQueueStudent.avatar_url ? (
                      <img
                        src={currentQueueStudent.avatar_url}
                        alt={currentQueueStudent.name}
                        className="w-11 h-11 rounded-full object-cover border border-[#25D366]/40"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center font-black text-[#25D366] text-sm">
                        {currentQueueStudent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-extrabold text-[#F5F5F7]">
                          {currentQueueStudent.name}
                        </h4>
                        {sentStudentIds[currentQueueStudent.id] && (
                          <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Já enviado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#9B9BA1] block">
                        {currentQueueStudent.email} · {currentQueueStudent.plan}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#9B9BA1] uppercase block">Telefone</span>
                    <span className="font-mono text-xs font-bold text-[#25D366]">
                      {formatPhoneDisplay(getEffectivePhone(currentQueueStudent))}
                    </span>
                  </div>
                </div>

                {/* Mensagem Formatada para este Aluno */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#9B9BA1] block">
                    Mensagem que será aberta no WhatsApp Web/App:
                  </span>
                  <div className="p-3 rounded-xl bg-[#0D2418] border border-[#25D366]/30 text-xs text-[#E1F7E8] font-sans leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {formatMessageForStudent(messageText, currentQueueStudent)}
                  </div>
                </div>

                {/* Botões de Ação da Fila */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    id="queue-send-open-btn"
                    type="button"
                    onClick={handleQueueSendCurrent}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir WhatsApp deste Aluno →</span>
                  </button>

                  <button
                    id="queue-skip-btn"
                    type="button"
                    onClick={handleQueueSkipCurrent}
                    disabled={queueIndex + 1 >= queueEligibleStudents.length}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#151515] border border-[#2B2B2F] text-[#9B9BA1] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Pular</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#25D366] mx-auto" />
                <h4 className="text-base font-bold text-[#F5F5F7]">Fila de Disparos Concluída!</h4>
                <p className="text-xs text-[#9B9BA1]">
                  Todos os alunos elegíveis da lista foram processados.
                </p>
                <button
                  type="button"
                  onClick={() => setIsQueueOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#25D366] text-black font-bold text-xs"
                >
                  Fechar Fila
                </button>
              </div>
            )}

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between border-t border-[#2B2B2F] pt-3 text-[11px] text-[#9B9BA1]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={queueIndex === 0}
                  onClick={() => setQueueIndex((p) => Math.max(0, p - 1))}
                  className="text-[#D8B46A] hover:underline disabled:opacity-30 disabled:no-underline font-bold"
                >
                  ← Aluno Anterior
                </button>
                <span>·</span>
                <button
                  type="button"
                  disabled={queueIndex + 1 >= queueEligibleStudents.length}
                  onClick={() => setQueueIndex((p) => Math.min(queueEligibleStudents.length - 1, p + 1))}
                  className="text-[#D8B46A] hover:underline disabled:opacity-30 disabled:no-underline font-bold"
                >
                  Próximo Aluno →
                </button>
              </div>

              <span>Pressione "Abrir WhatsApp" para disparar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
