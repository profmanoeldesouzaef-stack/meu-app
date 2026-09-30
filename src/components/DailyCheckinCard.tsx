import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Flame,
  Dumbbell,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Play,
  Square,
  AlertCircle,
  Loader2,
  CalendarCheck,
  Zap,
} from "lucide-react";
import {
  startTraining,
  finishTraining,
  getUserTrainingStatus,
  getUserStreak,
  CheckinItem,
} from "../lib/gamificationService";

interface DailyCheckinCardProps {
  userId: string;
  userName: string;
  onCheckinCompleted?: (streak: number) => void;
}

export const DailyCheckinCard: React.FC<DailyCheckinCardProps> = ({
  userId,
  userName,
  onCheckinCompleted,
}) => {
  const [isTrainingNow, setIsTrainingNow] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [totalCheckins, setTotalCheckins] = useState<number>(0);
  const [lastCheckinAt, setLastCheckinAt] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [checkedInToday, setCheckedInToday] = useState<boolean>(false);
  const [recentCheckins, setRecentCheckins] = useState<CheckinItem[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega status e streak do aluno
  const loadStatusAndStreak = useCallback(async () => {
    try {
      const status = await getUserTrainingStatus(userId);
      setIsTrainingNow(status.isTrainingNow);
      setLastCheckinAt(status.lastCheckinAt);

      if (status.lastCheckinAt) {
        const lastDate = new Date(status.lastCheckinAt).toISOString().split("T")[0];
        const todayDate = new Date().toISOString().split("T")[0];
        setCheckedInToday(lastDate === todayDate);
      }

      const streakData = await getUserStreak(userId);
      setStreak(streakData.streak);
      setTotalCheckins(streakData.totalCheckins);
      setRecentCheckins(streakData.checkinsList);

      // Se já estava treinando, calcula o tempo decorrido desde o início
      if (status.isTrainingNow) {
        const startedAtRaw = localStorage.getItem(`vyra_training_started_at_${userId}`);
        if (startedAtRaw) {
          const startedAt = parseInt(startedAtRaw, 10);
          if (!isNaN(startedAt)) {
            const diffSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
            setElapsedSeconds(diffSec);
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do check-in:", e);
    }
  }, [userId]);

  useEffect(() => {
    loadStatusAndStreak();
  }, [loadStatusAndStreak]);

  // Timer para treinos em andamento
  useEffect(() => {
    if (isTrainingNow) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTrainingNow]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Clique em "Iniciar Treino"
  const handleStart = async () => {
    setLoadingAction(true);
    try {
      const res = await startTraining(userId, userName);
      if (res.success) {
        setIsTrainingNow(true);
        setElapsedSeconds(0);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Clique em "Finalizar Treino"
  const handleFinish = async () => {
    setLoadingAction(true);
    try {
      const res = await finishTraining(userId, userName);
      if (res.success) {
        setIsTrainingNow(false);
        setCheckedInToday(true);
        setStreak(res.streak);
        setTotalCheckins((prev) => prev + 1);
        setShowCelebration(true);
        if (onCheckinCompleted) {
          onCheckinCompleted(res.streak);
        }
        await loadStatusAndStreak();
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Dias da semana para visualização do streak semanal
  const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0 = Segunda, 6 = Domingo

  // Dias já completados esta semana
  const isDayCompleted = (index: number) => {
    if (index > currentDayIndex) return false;
    if (index === currentDayIndex) return checkedInToday;
    return streak > (currentDayIndex - index);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#18181B] via-[#121214] to-[#0A0A0A] border border-[#2B2B2F] p-5 sm:p-6 shadow-2xl transition-all duration-300 hover:border-[#D8B46A]/40 group">
      {/* Glow de fundo */}
      <div
        className={`absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isTrainingNow
            ? "bg-[#34C759]/20"
            : streak > 0
            ? "bg-[#FF6A2A]/20"
            : "bg-[#D8B46A]/10"
        }`}
      />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B2B2F]/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                isTrainingNow
                  ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/40 shadow-[#34C759]/20 animate-pulse"
                  : streak > 0
                  ? "bg-[#FF6A2A]/15 text-[#FF6A2A] border border-[#FF6A2A]/40 shadow-[#FF6A2A]/20"
                  : "bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/30"
              }`}
            >
              {isTrainingNow ? (
                <Dumbbell className="w-6 h-6 animate-bounce" />
              ) : (
                <Flame className="w-6 h-6 fill-current" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#F5F5F7] tracking-tight">
                  Check-in Diário de Treino
                </h3>
                {isTrainingNow && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40 shadow-sm animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#34C759] animate-ping" />
                    Ao Vivo no Radar
                  </span>
                )}
                {checkedInToday && !isTrainingNow && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/40 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-[#D8B46A]" />
                    Feito Hoje
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                {isTrainingNow
                  ? "Seu treino está ativo e o coach visualiza sua presença em tempo real."
                  : checkedInToday
                  ? "Parabéns! O check-in de hoje foi registrado e pontuado no Supabase."
                  : "Inicie sua sessão para marcar presença e notificar o radar do coach."}
              </p>
            </div>
          </div>

          {/* Badge do Streak (Foguinho 🔥) */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-[#1A1A1E] px-3.5 py-2 rounded-2xl border border-[#2B2B2F] shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6A2A] to-[#FF9A62] text-[#0A0A0A] flex items-center justify-center shadow-md shadow-[#FF6A2A]/30">
              <Flame className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-[#F5F5F7] tracking-tight">
                  {streak}
                </span>
                <span className="text-[11px] font-bold text-[#FF9A62] uppercase tracking-wider">
                  {streak === 1 ? "dia seguido" : "dias seguidos"}
                </span>
              </div>
              <div className="text-[10px] text-[#9B9BA1]">
                Total: <strong>{totalCheckins}</strong> treinos
              </div>
            </div>
          </div>
        </div>

        {/* Visualizador de Dias da Semana (Semana Ativa) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151518] p-3.5 rounded-2xl border border-[#2B2B2F]/60">
          <div className="flex items-center gap-2 text-xs font-bold text-[#9B9BA1]">
            <CalendarCheck className="w-4 h-4 text-[#D8B46A]" />
            <span>Frequência da Semana:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {daysOfWeek.map((day, idx) => {
              const completed = isDayCompleted(idx);
              const isToday = idx === currentDayIndex;

              return (
                <div
                  key={day}
                  className={`flex flex-col items-center justify-center w-8 h-10 sm:w-9 sm:h-11 rounded-xl text-[10px] font-black transition-all ${
                    completed
                      ? "bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/50 shadow-sm shadow-[#34C759]/10"
                      : isToday
                      ? "bg-[#FF6A2A]/15 text-[#FF6A2A] border border-[#FF6A2A]/50 ring-1 ring-[#FF6A2A]/40"
                      : "bg-[#1D1D1F] text-[#6E6E73] border border-[#2B2B2F]"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-tighter opacity-80">
                    {day}
                  </span>
                  <span className="text-xs font-extrabold mt-0.5">
                    {completed ? "✓" : isToday ? "•" : "·"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloco de Ação: Iniciar vs Finalizar Treino */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          {isTrainingNow ? (
            /* Estado 1: Treino em Andamento */
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#34C759]/20 text-[#34C759] flex items-center justify-center border border-[#34C759]/40">
                  <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: "6s" }} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
                    Tempo de Sessão
                  </div>
                  <div className="text-2xl font-black text-[#34C759] font-mono tracking-tight">
                    {formatTimer(elapsedSeconds)}
                  </div>
                </div>
              </div>

              <button
                id="finish-workout-checkin-btn"
                type="button"
                disabled={loadingAction}
                onClick={handleFinish}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide bg-gradient-to-r from-[#34C759] to-[#30D158] text-[#0A0A0A] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-[#34C759]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                    <span>Salvando Check-in...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Finalizar Treino & Pontuar</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Estado 2: Pronto para Iniciar */
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#9B9BA1]">
                <Sparkles className="w-4 h-4 text-[#D8B46A]" />
                <span>
                  {checkedInToday
                    ? "Treino de hoje já concluído. Você ainda pode registrar outra sessão se desejar."
                    : "Cada check-in fortalece sua patente e mantém seu streak de fidelidade ativo."}
                </span>
              </div>

              <button
                id="start-workout-checkin-btn"
                type="button"
                disabled={loadingAction}
                onClick={handleStart}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  checkedInToday
                    ? "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#D8B46A] hover:text-[#D8B46A]"
                    : "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-[#0A0A0A] hover:brightness-110 active:scale-[0.98] shadow-[#FF6A2A]/25"
                }`}
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                    <span>Conectando Radar...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{checkedInToday ? "Iniciar Nova Sessão" : "Iniciar Treino Agora"}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Toast de Celebração de Conclusão */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-sm w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1C1C1E] to-[#121214] border border-[#34C759]/40 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/50 flex items-center justify-center mx-auto shadow-lg shadow-[#34C759]/30">
              <Trophy className="w-9 h-9 animate-bounce" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#34C759] bg-[#34C759]/15 px-3 py-1 rounded-full border border-[#34C759]/30">
                CHECK-IN CONFIRMADO
              </span>
              <h4 className="text-xl font-black text-[#F5F5F7] tracking-tight mt-2">
                Treino Finalizado com Sucesso!
              </h4>
              <p className="text-xs text-[#9B9BA1] mt-1.5 leading-relaxed">
                Seu check-in foi salvo na base de dados do Supabase. O Coach recebeu uma notificação no radar ao vivo!
              </p>
            </div>

            {/* Streak atualizado */}
            <div className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-[#2B2B2F] flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6A2A] to-[#FF9A62] text-[#0A0A0A] flex items-center justify-center">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#9B9BA1]">Sequência Atual</div>
                <div className="text-base font-black text-[#F5F5F7]">
                  🔥 {streak} {streak === 1 ? "dia consecutivo" : "dias consecutivos"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              className="w-full py-3 rounded-xl font-bold text-xs bg-[#34C759] text-[#0A0A0A] hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              Excelente! Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
