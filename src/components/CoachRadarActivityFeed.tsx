import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Flame,
  MessageCircle,
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Clock,
  User,
  RefreshCw,
  Sparkles,
  Phone,
  Copy,
  ExternalLink,
  ChevronRight,
  Dumbbell,
  UserPlus,
  ShieldAlert,
} from "lucide-react";
import {
  getLiveTrainingStudents,
  getAbsentStudents,
  getCoachNotifications,
  markCoachNotificationAsRead,
  markAllCoachNotificationsAsRead,
  LiveStudent,
  AbsentStudent,
  CoachNotification,
} from "../lib/gamificationService";
import { supabase } from "../lib/supabase";

interface CoachRadarActivityFeedProps {
  onSelectStudent?: (studentId: string) => void;
}

export const CoachRadarActivityFeed: React.FC<CoachRadarActivityFeedProps> = ({
  onSelectStudent,
}) => {
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([]);
  const [notifications, setNotifications] = useState<CoachNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread" | "treinos">("all");
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Carrega todos os dados do Radar
  const loadRadarData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [live, absent, notifs] = await Promise.all([
        getLiveTrainingStudents(),
        getAbsentStudents(3),
        getCoachNotifications(),
      ]);

      setLiveStudents(live);
      setAbsentStudents(absent);
      setNotifications(notifs);
    } catch (e) {
      console.warn("Erro ao sincronizar radar de atividades:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRadarData();

    // Auto-refresh a cada 15 segundos para monitoramento ao vivo contínuo
    const interval = setInterval(() => {
      loadRadarData(true);
    }, 15000);

    // Supabase Realtime para notificar imediatamente quando alguém finalizar treino
    let channel: any = null;
    try {
      channel = supabase
        .channel("radar-live-feed")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notificacoes_coach" },
          () => {
            loadRadarData(true);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            loadRadarData(true);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime subscription fallback to polling:", err);
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadRadarData]);

  // Marcar notificação individual como lida
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    await markCoachNotificationAsRead(id);
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    await markAllCoachNotificationsAsRead();
  };

  // Abrir WhatsApp do aluno ausente
  const handleOpenWhatsApp = (student: AbsentStudent) => {
    const rawPhone = (student.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
    const studentFirstName = student.name.split(" ")[0];

    const message = encodeURIComponent(
      `Olá ${studentFirstName}, tudo bem? Notei que você não realizou check-in de treino nos últimos ${student.daysAbsent} dias no Vyra. Está tudo bem com sua rotina? Como posso te ajudar a manter o foco?`
    );

    if (rawPhone.length >= 10) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    } else {
      // Fallback: copia a mensagem para área de transferência
      navigator.clipboard.writeText(
        `Olá ${studentFirstName}, tudo bem? Notei que você não realizou check-in de treino nos últimos ${student.daysAbsent} dias no Vyra. Está tudo bem com sua rotina? Como posso te ajudar a manter o foco?`
      );
      setCopiedPhoneId(student.id);
      setTimeout(() => setCopiedPhoneId(null), 3000);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.lida).length;

  const filteredNotifs = notifications.filter((n) => {
    if (notificationFilter === "unread") return !n.lida;
    if (notificationFilter === "treinos") return n.tipo === "treino_finalizado";
    return true;
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return "Agora mesmo";
      if (diffSec < 3600) return `Há ${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `Há ${Math.floor(diffSec / 3600)} h`;
      const days = Math.floor(diffSec / 86400);
      return `Há ${days} ${days === 1 ? "dia" : "dias"}`;
    } catch {
      return "Recente";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Barra de Título & Controle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#1A1A1E] via-[#151515] to-[#121214] border border-[#2B2B2F] relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#34C759]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#34C759] uppercase bg-[#34C759]/15 px-3 py-1 rounded-full border border-[#34C759]/30 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              MONITORAMENTO AO VIVO & RADAR SUPABASE
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40">
              <span className="w-2 h-2 rounded-full bg-[#34C759] animate-ping" />
              {liveStudents.length} {liveStudents.length === 1 ? "Treinando Agora" : "Treinando Agora"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
            Radar de Atividades, Presença & Alertas
          </h2>
          <p className="text-xs text-[#9B9BA1] max-w-2xl">
            Acompanhe em tempo real os alunos que estão na academia agora, receba alertas de alunos ausentes há mais de 3 dias e visualize o feed de treinos finalizados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadRadarData()}
          disabled={refreshing}
          className="relative z-10 self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#D8B46A] hover:text-[#D8B46A] transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D8B46A] ${refreshing ? "animate-spin" : ""}`} />
          <span>Sincronizar Radar</span>
        </button>
      </div>

      {/* SEÇÃO 1: AO VIVO - Treinando Agora (Cards Brilhantes com Ponto Verde Piscando) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34C759]"></span>
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#F5F5F7]">
              Ao Vivo · Treinando Agora ({liveStudents.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#9B9BA1]">
            Atualização automática via Supabase
          </span>
        </div>

        {liveStudents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#151515] border border-[#2B2B2F] text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#1D1D1F] text-[#9B9BA1] flex items-center justify-center mx-auto">
              <Dumbbell className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-xs font-bold text-[#F5F5F7]">Nenhum aluno treinando neste instante</p>
            <p className="text-[11px] text-[#9B9BA1] max-w-md mx-auto">
              Assim que um aluno clicar em <strong>"Iniciar Treino"</strong> no aplicativo, o card brilhante aparecerá instantaneamente aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {liveStudents.map((student) => (
              <div
                key={student.id}
                className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-[#1C261D] via-[#141A15] to-[#0E130F] border-2 border-[#34C759]/60 shadow-xl shadow-[#34C759]/10 transition-all hover:scale-[1.01] hover:border-[#34C759] group"
              >
                {/* Glow de fundo do card */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#34C759]/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-xl bg-[#151515] border border-[#34C759]/50 overflow-hidden flex items-center justify-center font-bold text-xs text-[#34C759] shrink-0 shadow-md">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Ponto verde pulsando sobre o avatar */}
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-90"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#34C759] border-2 border-[#0A0A0A]"></span>
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#F5F5F7]">
                            Treinando Agora: <span className="text-[#34C759]">{student.name}</span>
                          </h4>
                        </div>
                        <p className="text-[10px] text-[#9B9BA1] mt-0.5">
                          Plano: <strong className="text-[#F5F5F7]">{student.plan || "Vyra Protocol"}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#34C759]/20 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#34C759] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                      Sessão em Andamento
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectStudent && onSelectStudent(student.id)}
                      className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#34C759] text-[#0A0A0A] hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span>Ver Aluno</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2 & 3: GRID COM ALERTAS DE INATIVIDADE (WHATSAPP) E FEED DE NOTIFICAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Alertas de Inatividade (Alunos Ausentes > 3 dias) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#F5F5F7]">
                    Alertas de Inatividade
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30">
                    {absentStudents.length} ausentes
                  </span>
                </div>
                <p className="text-[11px] text-[#9B9BA1]">
                  Alunos sem check-in nos últimos 3 dias ou mais
                </p>
              </div>
            </div>
          </div>

          {absentStudents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-2">
              <Check className="w-6 h-6 text-[#34C759] mx-auto" />
              <p className="text-xs font-bold text-[#F5F5F7]">
                Excelente! Nenhum aluno ausente no momento
              </p>
              <p className="text-[11px] text-[#9B9BA1]">
                Todos os alunos cadastrados estão mantendo o ritmo de treino ativo.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {absentStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#FF453A]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#151515] border border-[#2B2B2F] overflow-hidden flex items-center justify-center font-bold text-xs text-[#F5F5F7] shrink-0">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        student.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-[#F5F5F7] group-hover:text-[#D8B46A] transition-colors">
                          {student.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-[#FF453A] flex items-center gap-1 bg-[#FF453A]/10 px-2 py-0.5 rounded-md border border-[#FF453A]/20">
                          <Clock className="w-2.5 h-2.5" />
                          Ausente há {student.daysAbsent} dias
                        </span>
                        <span className="text-[10px] text-[#9B9BA1] truncate max-w-[130px]">
                          {student.plan || "Vyra Protocol"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Rápido de WhatsApp */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id={`whatsapp-btn-${student.id}`}
                      onClick={() => handleOpenWhatsApp(student)}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-black bg-[#25D366] text-[#0A0A0A] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#25D366]/20"
                      title="Perguntar no WhatsApp se está tudo bem"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>{copiedPhoneId === student.id ? "Mensagem Copiada!" : "Chamar no WhatsApp"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito: Feed de Notificações (notificacoes_coach) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2B2B2F]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/30 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#F5F5F7]">
                    Feed de Notificações
                  </h3>
                  {unreadNotifsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/30">
                      {unreadNotifsCount} nova(s)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9B9BA1]">
                  Treinos finalizados e novos alunos cadastrados
                </p>
              </div>
            </div>

            {unreadNotifsCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-[#D8B46A] hover:underline cursor-pointer self-start sm:self-auto flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar todas lidas</span>
              </button>
            )}
          </div>

          {/* Filtros rápidos do Feed */}
          <div className="flex items-center gap-1.5 bg-[#121214] p-1 rounded-xl border border-[#2B2B2F]">
            <button
              type="button"
              onClick={() => setNotificationFilter("all")}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                notificationFilter === "all"
                  ? "bg-[#D8B46A] text-[#0A0A0A]"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setNotificationFilter("unread")}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                notificationFilter === "unread"
                  ? "bg-[#D8B46A] text-[#0A0A0A]"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
            >
              Não lidas ({unreadNotifsCount})
            </button>
            <button
              type="button"
              onClick={() => setNotificationFilter("treinos")}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                notificationFilter === "treinos"
                  ? "bg-[#D8B46A] text-[#0A0A0A]"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
            >
              Treinos ({notifications.filter((n) => n.tipo === "treino_finalizado").length})
            </button>
          </div>

          {/* Lista de Notificações */}
          {filteredNotifs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-1">
              <p className="text-xs font-bold text-[#F5F5F7]">Nenhuma notificação encontrada</p>
              <p className="text-[11px] text-[#9B9BA1]">
                Os eventos de treinos e novos cadastros aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredNotifs.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    item.lida
                      ? "bg-[#18181A]/60 border-[#2B2B2F]/60 opacity-75"
                      : "bg-[#1D1D1F] border-[#D8B46A]/30 shadow-md shadow-[#D8B46A]/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.tipo === "treino_finalizado"
                          ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30"
                          : "bg-[#FF6A2A]/15 text-[#FF6A2A] border border-[#FF6A2A]/30"
                      }`}
                    >
                      {item.tipo === "treino_finalizado" ? (
                        <Dumbbell className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#F5F5F7]">
                          {item.aluno_nome}
                        </span>
                        {!item.lida && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D8B46A]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#D1D1D6] leading-relaxed">
                        {item.mensagem}
                      </p>
                      <div className="text-[10px] text-[#8E8E93] pt-0.5">
                        {formatRelativeTime(item.created_at)}
                      </div>
                    </div>
                  </div>

                  {!item.lida && (
                    <button
                      type="button"
                      id={`mark-read-btn-${item.id}`}
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#2B2B2F] hover:bg-[#D8B46A] hover:text-[#0A0A0A] text-[#9B9BA1] transition-all cursor-pointer shrink-0"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
