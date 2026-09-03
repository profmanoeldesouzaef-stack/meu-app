import React, { useEffect, useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Workout, Exercise } from "../types";
import { AccessGate } from "../components/AccessGate";
import {
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Trophy,
  X,
  ExternalLink,
  ChevronRight,
  Dumbbell,
  Timer,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface TrainingViewProps {
  onOpenFormChecker: (exerciseName?: string) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ onOpenFormChecker }) => {
  const { t, persona, subscription, anamnesisDone, photosDone } = useApp();

  // Access Gating for Student
  if (persona === "student") {
    if (!subscription.active) {
      return (
        <AccessGate
          type="payment"
          tabName="treinos"
          title="Periodização de Treino Bloqueada"
          description="A sua planilha de treino e a periodização individualizada são exclusivas para alunos com assinatura Vyra ativa. Escolha um plano para liberar seu acesso."
        />
      );
    }

    if (!anamnesisDone || !photosDone) {
      return (
        <AccessGate
          type="anamnesis_photos"
          tabName="treinos"
          title="Complete sua Anamnese & Fotos para Liberar os Treinos"
          description="Para que o treinador monte sua periodização de treino com total segurança biomecânica e precisão para seu biotipo, você deve finalizar a anamnese e anexar suas fotografias corporais."
        />
      );
    }
  }

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [activeVideoModal, setActiveVideoModal] = useState<Exercise | null>(null);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Persistent Timer State (Floating Stopwatch & Rest Timer)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"stopwatch" | "countdown">("stopwatch");
  const [timerMinimized, setTimerMinimized] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === "countdown") {
            if (prev <= 1) {
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMode]);

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerMode("stopwatch");
  };

  const handleStartRest = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerMode("countdown");
    setIsTimerRunning(true);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    api
      .getTodayWorkout()
      .then((data) => {
        setWorkout(data);
      })
      .catch((err) => console.error("Error fetching workout:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleComplete = (id: string) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalCount = workout?.exercises.length || 0;
  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[#9B9BA1]">
        <div className="w-8 h-8 border-2 border-[#FF6A2A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Carregando prescrição do dia...</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[#9B9BA1]">
        <p>Nenhum treino disponível hoje.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-64 md:pb-48 space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Overview */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-3 py-1 rounded-full border border-[#FF6A2A]/30">
            {workout.day_label}
          </span>
          <span className="text-xs font-bold text-[#9B9BA1] bg-[#151515] px-3 py-1 rounded-full border border-[#2B2B2F]">
            {workout.focus}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
          {workout.title}
        </h1>

        <div className="flex items-center gap-4 text-xs font-semibold text-[#9B9BA1] pt-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#9B9BA1]" />
            {workout.duration_min} minutos
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#FF6A2A]" />
            Intensidade {workout.intensity}
          </span>
          <span className="flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-[#D8B46A]" />
            {totalCount} exercícios
          </span>
        </div>
      </div>

      {/* Progress & AI Form Action Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
              Progresso do Treino
            </span>
            <div className="text-lg font-extrabold text-[#F5F5F7]">
              {completedCount} de {totalCount} concluídos ({progressPct}%)
            </div>
          </div>

          <button
            id="open-form-checker-main-btn"
            onClick={() => onOpenFormChecker()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>{t("cta.analyze")}</span>
          </button>
        </div>

        <div className="w-full h-2.5 bg-[#1D1D1F] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6A2A] to-[#D8B46A] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Coach Note */}
      {workout.coach_note && (
        <div className="p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/30 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#D8B46A]/15 text-[#D8B46A] flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-[#D8B46A] uppercase tracking-wider">
              {t("training.coach_note")}
            </h4>
            <p className="text-xs sm:text-sm text-[#F5F5F7] mt-1 leading-relaxed">
              {workout.coach_note}
            </p>
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
          {t("training.exercises")} ({totalCount})
        </h2>

        <div className="space-y-3">
          {workout.exercises.map((ex, idx) => {
            const isDone = Boolean(completedExercises[ex.id]);

            return (
              <div
                key={ex.id}
                id={`exercise-card-${ex.id}`}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDone
                    ? "bg-[#151515]/60 border-[#34C759]/40 opacity-90"
                    : "bg-[#151515] border-[#2B2B2F] hover:border-[#4A4A52]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <button
                      id={`check-exercise-${ex.id}`}
                      onClick={() => toggleComplete(ex.id)}
                      className="mt-0.5 text-[#9B9BA1] hover:text-[#34C759] transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-[#34C759] fill-[#34C759]/20" />
                      ) : (
                        <Circle className="w-6 h-6 stroke-[1.8]" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#9B9BA1]">
                          0{idx + 1}
                        </span>
                        <h3
                          className={`text-base font-bold ${
                            isDone ? "line-through text-[#9B9BA1]" : "text-[#F5F5F7]"
                          }`}
                        >
                          {ex.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-semibold">
                        <span className="text-[#FF6A2A] bg-[#FF6A2A]/10 px-2 py-0.5 rounded-md">
                          {ex.sets} séries
                        </span>
                        <span className="text-[#F5F5F7] bg-[#1D1D1F] px-2 py-0.5 rounded-md border border-[#2B2B2F]">
                          {ex.reps} reps
                        </span>
                        <span className="text-[#D8B46A] bg-[#D8B46A]/10 px-2 py-0.5 rounded-md">
                          Descanso: {ex.rest}
                        </span>
                        <span className="text-[#6D9BFF] bg-[#6D9BFF]/10 px-2 py-0.5 rounded-md">
                          {ex.muscle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Quick rest button for this exercise */}
                    <button
                      onClick={() => {
                        const seconds = parseInt(ex.rest?.replace(/[^0-9]/g, "") || "60", 10) || 60;
                        handleStartRest(seconds);
                      }}
                      title="Iniciar descanso deste exercício"
                      className="px-2 py-1.5 rounded-xl bg-[#D8B46A]/10 border border-[#D8B46A]/30 text-[#D8B46A] text-[11px] font-bold hover:bg-[#D8B46A]/20 flex items-center gap-1 transition-colors"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{ex.rest || "60s"}</span>
                    </button>

                    {ex.video_url && (
                      <button
                        id={`video-exercise-${ex.id}`}
                        onClick={() => setActiveVideoModal(ex)}
                        title="Ver vídeo demonstrativo"
                        className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#FF6A2A] hover:border-[#FF6A2A]/40 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}

                    <button
                      id={`ai-check-exercise-${ex.id}`}
                      onClick={() => onOpenFormChecker(ex.name)}
                      title="Analisar execução deste exercício com IA"
                      className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#D8B46A] hover:bg-[#D8B46A]/20 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Coach Tip */}
                {ex.coach_tip && (
                  <div className="mt-3 pt-3 border-t border-[#2B2B2F]/60 flex items-center gap-2 text-xs text-[#9B9BA1]">
                    <span className="text-[#D8B46A] font-bold">Dica do Coach:</span>
                    <span>{ex.coach_tip}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Finish Workout CTA Card */}
      <div className="pt-6 pb-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-[#9B9BA1]">
            <span className="font-bold uppercase tracking-wider">Conclusão do Treino</span>
            <span className="font-extrabold text-[#D8B46A]">
              {completedCount} de {totalCount} concluídos
            </span>
          </div>
          <button
            id="finish-workout-btn"
            onClick={() => setShowFinishedModal(true)}
            className="w-full py-4 rounded-xl font-black text-base tracking-wide bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-xl shadow-[#FF6A2A]/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-5 h-5" />
            <span>{t("cta.finish_workout")}</span>
          </button>
        </div>
      </div>

      {/* Persistent Floating Sticky Stopwatch & Rest Timer */}
      <div
        id="persistent-training-stopwatch"
        className="fixed bottom-24 md:bottom-8 right-3 sm:right-6 z-40 max-w-[340px] w-[calc(100%-1.5rem)] sm:w-80 shadow-2xl transition-all duration-200"
      >
        <div className="bg-[#151515]/95 backdrop-blur-xl border border-[#D8B46A]/50 rounded-2xl p-3 shadow-2xl shadow-black/90 space-y-2 ring-1 ring-black/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isTimerRunning
                    ? "bg-[#D8B46A] text-[#0A0A0A] animate-pulse"
                    : "bg-[#D8B46A]/20 text-[#D8B46A]"
                }`}
              >
                <Timer className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#D8B46A] block">
                  {timerMode === "countdown" ? "DESCANSO" : "CRONÔMETRO"}
                </span>
                <span className="text-lg font-black text-[#F5F5F7] font-mono leading-none">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isTimerRunning ? (
                <button
                  id="timer-pause-btn"
                  onClick={handlePauseTimer}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FF6A2A] text-white hover:bg-[#FF6A2A]/90 flex items-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausa</span>
                </button>
              ) : (
                <button
                  id="timer-start-btn"
                  onClick={handleStartTimer}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#34C759] text-[#0A0A0A] hover:bg-[#34C759]/90 font-black flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              )}

              <button
                id="timer-reset-btn"
                onClick={handleResetTimer}
                title="Resetar"
                className="p-1.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                id="timer-toggle-minimize"
                onClick={() => setTimerMinimized(!timerMinimized)}
                className="p-1.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] cursor-pointer"
                title={timerMinimized ? "Expandir presets" : "Minimizar"}
              >
                {timerMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Rest Presets */}
          {!timerMinimized && (
            <div className="flex items-center gap-1 pt-1 border-t border-[#2B2B2F]">
              <span className="text-[9px] text-[#9B9BA1] font-bold shrink-0">Descanso:</span>
              {[30, 45, 60, 90, 120].map((s) => (
                <button
                  key={s}
                  id={`preset-rest-${s}`}
                  onClick={() => handleStartRest(s)}
                  className="flex-1 py-1 rounded-lg text-[10px] font-extrabold bg-[#1D1D1F] hover:bg-[#D8B46A]/20 text-[#D8B46A] border border-[#2B2B2F] hover:border-[#D8B46A] transition-all text-center cursor-pointer"
                >
                  {s}s
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Demo Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div>
                <span className="text-[10px] font-bold text-[#FF6A2A] uppercase">
                  VÍDEO DEMONSTRATIVO
                </span>
                <h3 className="text-lg font-bold text-[#F5F5F7]">{activeVideoModal.name}</h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl bg-[#0A0A0A] border border-[#2B2B2F] flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#FF6A2A]/20 text-[#FF6A2A] flex items-center justify-center">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F5F5F7]">Guia de Execução Oficial</p>
                <p className="text-xs text-[#9B9BA1] mt-1">
                  Abra a demonstração técnica no player oficial.
                </p>
              </div>
              <a
                href={activeVideoModal.video_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] text-white flex items-center gap-2 hover:brightness-110 transition-all"
              >
                <span>Assistir no YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#9B9BA1]">
              <p className="font-semibold text-[#D8B46A]">Foco Biomecânico:</p>
              <p className="mt-0.5">{activeVideoModal.coach_tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Finished Workout Modal */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#151515] border border-[#D8B46A]/50 p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#D8B46A] to-[#FF6A2A] text-[#0A0A0A] flex items-center justify-center mx-auto shadow-xl shadow-[#FF6A2A]/30">
              <Trophy className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-extrabold tracking-widest text-[#D8B46A] uppercase">
                TREINO CONCLUÍDO COM SUCESSO!
              </span>
              <h3 className="text-2xl font-black text-[#F5F5F7] mt-1">
                Progressive Overload Garantido
              </h3>
              <p className="text-xs text-[#9B9BA1] mt-2 leading-relaxed">
                Você completou {completedCount} de {totalCount} exercícios prescritos. Descanse,
                hidrate-se e bata as metas de proteína do dia.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2 text-left">
              <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                <span className="text-[10px] text-[#9B9BA1] uppercase font-bold">Tempo Total</span>
                <p className="text-base font-bold text-[#F5F5F7]">{workout.duration_min} min</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                <span className="text-[10px] text-[#9B9BA1] uppercase font-bold">Adesão</span>
                <p className="text-base font-bold text-[#34C759]">{progressPct}%</p>
              </div>
            </div>

            <button
              id="confirm-finish-workout-btn"
              onClick={() => setShowFinishedModal(false)}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#FF6A2A] text-white hover:brightness-110 transition-all"
            >
              {t("cta.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
