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
  Plus,
  Minus,
  Check,
  Database,
  History,
  RefreshCw,
  TrendingUp,
  Save,
  Video,
} from "lucide-react";
import {
  getExerciseVideoInfo,
  buildYouTubeEmbedUrl,
  ExerciseVideoInfo,
} from "../utils/exerciseVideos";

export interface SetRecord {
  setNum: number;
  weight: string;
  reps: string;
  completed: boolean;
}

interface TrainingViewProps {
  onOpenFormChecker: (exerciseName?: string) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ onOpenFormChecker }) => {
  const {
    t,
    persona,
    subscription,
    anamnesisDone,
    photosDone,
    trackWeightsEnabled,
    setActiveView,
    currentUserEmail,
  } = useApp();

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
  const [exerciseSets, setExerciseSets] = useState<Record<string, SetRecord[]>>({});
  const [activeVideoModal, setActiveVideoModal] = useState<Exercise | null>(null);
  const [videoClipType, setVideoClipType] = useState<"clip" | "full">("clip");
  const [videoKey, setVideoKey] = useState<number>(0);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [databaseSyncState, setDatabaseSyncState] = useState<"synced" | "saving" | "idle">("idle");
  const [exerciseHistories, setExerciseHistories] = useState<
    Record<string, { max_weight_kg: number; last_weight_kg: number | string; last_reps: number | string; last_date: string }>
  >({});
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const toggleBlockCollapse = (id: string) => {
    setCollapsedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllBlocks = () => {
    if (!workout) return;
    const allCollapsed = workout.exercises.every((ex) => collapsedBlocks[ex.id]);
    if (allCollapsed) {
      setCollapsedBlocks({});
    } else {
      const all: Record<string, boolean> = {};
      workout.exercises.forEach((ex) => {
        all[ex.id] = true;
      });
      setCollapsedBlocks(all);
    }
  };

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
    let isMounted = true;

    api
      .getTodayWorkout()
      .then(async (data) => {
        if (!isMounted) return;
        setWorkout(data);
        if (data?.exercises) {
          // 1. Initial template sets based on prescribed reps/sets
          const initial: Record<string, SetRecord[]> = {};
          data.exercises.forEach((ex) => {
            const targetReps = ex.reps ? ex.reps.replace(/[^0-9-]/g, "").trim() : "10";
            initial[ex.id] = Array.from({ length: Math.max(1, ex.sets || 3) }, (_, i) => ({
              setNum: i + 1,
              weight: "",
              reps: targetReps,
              completed: false,
            }));
          });

          // 2. Overlay local storage cache for instant offline responsiveness
          try {
            const storageKey = `vyra_workout_sets_${data.id}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
              const parsed = JSON.parse(saved);
              Object.keys(parsed).forEach((k) => {
                if (initial[k] && Array.isArray(parsed[k])) {
                  initial[k] = parsed[k];
                }
              });
            }
          } catch (err) {
            console.error("Error loading workout sets from local cache:", err);
          }

          // 3. Query Database for persistent records (Authoritative Store)
          try {
            const dbLogs = await api.getWorkoutLogs(data.id, currentUserEmail);
            if (dbLogs && dbLogs.length > 0) {
              dbLogs.forEach((log) => {
                if (log.sets && log.sets.length > 0 && initial[log.exercise_id]) {
                  initial[log.exercise_id] = log.sets.map((s, idx) => ({
                    setNum: s.set_num || idx + 1,
                    weight:
                      s.weight_kg !== undefined && s.weight_kg !== null && s.weight_kg !== ""
                        ? String(s.weight_kg)
                        : initial[log.exercise_id]?.[idx]?.weight || "",
                    reps:
                      s.reps !== undefined && s.reps !== null && s.reps !== ""
                        ? String(s.reps)
                        : initial[log.exercise_id]?.[idx]?.reps || "10",
                    completed: Boolean(s.completed),
                  }));
                }
              });
            }
          } catch (dbErr) {
            console.warn("Database sync note (using local cache):", dbErr);
          }

          if (isMounted) {
            setExerciseSets(initial);
          }

          // 4. Fetch exercise previous loads & personal records
          try {
            const histories: Record<
              string,
              { max_weight_kg: number; last_weight_kg: number | string; last_reps: number | string; last_date: string }
            > = {};
            for (const ex of data.exercises) {
              const hist = await api.getExerciseHistory(ex.id, currentUserEmail);
              if (hist && (hist.max_weight_kg > 0 || hist.last_weight_kg)) {
                histories[ex.id] = hist;
              }
            }
            if (isMounted) {
              setExerciseHistories(histories);
            }
          } catch (_) {
            // Non-blocking
          }
        }
      })
      .catch((err) => console.error("Error fetching workout:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserEmail]);

  const saveSetsToStorage = (updated: Record<string, SetRecord[]>) => {
    if (workout?.id) {
      try {
        localStorage.setItem(`vyra_workout_sets_${workout.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving workout sets locally:", e);
      }
    }
  };

  // Debounced database sync for individual exercise sets
  const syncExerciseToDatabase = (exerciseId: string, setsToSave: SetRecord[]) => {
    if (!workout?.id) return;
    setDatabaseSyncState("saving");

    if (debounceTimersRef.current[exerciseId]) {
      clearTimeout(debounceTimersRef.current[exerciseId]);
    }

    debounceTimersRef.current[exerciseId] = setTimeout(async () => {
      try {
        const ex = workout.exercises.find((e) => e.id === exerciseId);
        await api.saveExerciseLog({
          workout_id: workout.id,
          exercise_id: exerciseId,
          exercise_name: ex?.name || "",
          sets: setsToSave,
          user_email: currentUserEmail,
        });
        setDatabaseSyncState("synced");
        setTimeout(() => setDatabaseSyncState("idle"), 2500);
      } catch (err) {
        console.warn("Database log persist note:", err);
        setDatabaseSyncState("idle");
      }
    }, 600);
  };

  // Immediate batch sync of all exercises to database
  const syncAllSetsToDatabase = async () => {
    if (!workout?.id) return;
    setDatabaseSyncState("saving");
    try {
      await api.saveBatchWorkoutLogs({
        workout_id: workout.id,
        logs: exerciseSets,
        user_email: currentUserEmail,
      });
      setDatabaseSyncState("synced");
      setTimeout(() => setDatabaseSyncState("idle"), 3000);
    } catch (err) {
      console.warn("Batch database sync error:", err);
      setDatabaseSyncState("idle");
    }
  };

  const updateSetRecord = (exerciseId: string, setIndex: number, patch: Partial<SetRecord>) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] ? [...prev[exerciseId]] : [];
      if (!currentSets[setIndex]) return prev;
      currentSets[setIndex] = { ...currentSets[setIndex], ...patch };
      const updated = { ...prev, [exerciseId]: currentSets };
      saveSetsToStorage(updated);
      syncExerciseToDatabase(exerciseId, currentSets);
      return updated;
    });
  };

  const handleAddSet = (exerciseId: string, defaultReps?: string) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] ? [...prev[exerciseId]] : [];
      const last = currentSets[currentSets.length - 1];
      const newNum = currentSets.length + 1;
      const targetReps = defaultReps?.replace(/[^0-9-]/g, "").trim() || "10";
      currentSets.push({
        setNum: newNum,
        weight: last?.weight || "",
        reps: last?.reps || targetReps,
        completed: false,
      });
      const updated = { ...prev, [exerciseId]: currentSets };
      saveSetsToStorage(updated);
      syncExerciseToDatabase(exerciseId, currentSets);
      return updated;
    });
  };

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] ? [...prev[exerciseId]] : [];
      if (currentSets.length <= 1) return prev;
      currentSets.splice(setIndex, 1);
      const reindexed = currentSets.map((s, idx) => ({ ...s, setNum: idx + 1 }));
      const updated = { ...prev, [exerciseId]: reindexed };
      saveSetsToStorage(updated);
      syncExerciseToDatabase(exerciseId, reindexed);
      return updated;
    });
  };

  const handleAdjustWeight = (exerciseId: string, setIndex: number, delta: number) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] ? [...prev[exerciseId]] : [];
      const current = currentSets[setIndex];
      if (!current) return prev;
      const currentNum = parseFloat(current.weight) || 0;
      const nextNum = Math.max(0, currentNum + delta);
      currentSets[setIndex] = {
        ...current,
        weight: nextNum === 0 ? "" : String(nextNum % 1 === 0 ? nextNum : nextNum.toFixed(1)),
      };
      const updated = { ...prev, [exerciseId]: currentSets };
      saveSetsToStorage(updated);
      syncExerciseToDatabase(exerciseId, currentSets);
      return updated;
    });
  };

  const handleToggleSetCompleted = (exerciseId: string, setIndex: number) => {
    setExerciseSets((prev) => {
      const currentSets = prev[exerciseId] ? [...prev[exerciseId]] : [];
      const current = currentSets[setIndex];
      if (!current) return prev;
      const nextCompleted = !current.completed;
      currentSets[setIndex] = { ...current, completed: nextCompleted };
      const updated = { ...prev, [exerciseId]: currentSets };
      saveSetsToStorage(updated);
      syncExerciseToDatabase(exerciseId, currentSets);

      // If all sets are now completed, mark the exercise as done
      const allDone = currentSets.every((s) => s.completed);
      if (allDone) {
        setCompletedExercises((c) => ({ ...c, [exerciseId]: true }));
      }
      return updated;
    });
  };

  const toggleComplete = (id: string) => {
    const willBeDone = !completedExercises[id];
    setCompletedExercises((prev) => ({
      ...prev,
      [id]: willBeDone,
    }));

    // Synchronize individual sets with exercise status
    setExerciseSets((prev) => {
      if (!prev[id]) return prev;
      const updatedSets = prev[id].map((s) => ({ ...s, completed: willBeDone }));
      const updated = { ...prev, [id]: updatedSets };
      saveSetsToStorage(updated);
      syncExerciseToDatabase(id, updatedSets);
      return updated;
    });
  };

  const totalCount = workout?.exercises.length || 0;
  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalLoggedSetsWithWeight = Object.values(exerciseSets).reduce((acc, sets) => {
    return acc + sets.filter((s) => Boolean(s.weight && s.weight.trim() !== "")).length;
  }, 0);

  const maxWeightLogged = Object.values(exerciseSets).reduce((max, sets) => {
    const exMax = sets.reduce((m, s) => Math.max(m, parseFloat(s.weight) || 0), 0);
    return Math.max(max, exMax);
  }, 0);

  const handleFinishWorkout = () => {
    if (!workout) return;
    const workoutSummary = {
      workoutTitle: workout.title,
      dayLabel: workout.day_label || "Dia de Treino",
      durationMin: workout.duration_min,
      completedExercises: completedCount || totalCount,
      totalExercises: totalCount,
      progressPct: progressPct || 100,
      maxWeightKg: maxWeightLogged,
      totalSets: totalLoggedSetsWithWeight || totalCount * 3,
      exercises: workout.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
      })),
      date: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
    try {
      localStorage.setItem("vyra_last_completed_workout", JSON.stringify(workoutSummary));
    } catch (e) {
      console.error("Failed to save workout summary:", e);
    }
    setShowFinishedModal(false);
    setActiveView("workout-completion");
  };

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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider">
            {t("training.exercises")} ({totalCount})
          </h2>

          <button
            id="toggle-all-blocks-btn"
            type="button"
            onClick={toggleAllBlocks}
            className="px-3 py-1.5 rounded-xl bg-[#18181A] hover:bg-[#222226] border border-[#2B2B2F] hover:border-[#D8B46A]/50 text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            {workout.exercises.length > 0 && workout.exercises.every((ex) => collapsedBlocks[ex.id]) ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#D8B46A]" />
                <span>Expandir Todos os Blocos</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#D8B46A]" />
                <span>Encolher Todos os Blocos</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {workout.exercises.map((ex, idx) => {
            const isDone = Boolean(completedExercises[ex.id]);
            const isCollapsed = Boolean(collapsedBlocks[ex.id]);
            const videoInfo = getExerciseVideoInfo(ex.name, ex.video_url);

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

                    {/* Botão Vídeo de Execução no YouTube (5 a 10s) */}
                    <button
                      id={`video-exercise-${ex.id}`}
                      onClick={() => {
                        setActiveVideoModal(ex);
                        setVideoClipType("clip");
                        setVideoKey((k) => k + 1);
                      }}
                      title="Vídeo de Execução (5 a 10s no YouTube)"
                      className="px-2.5 py-1.5 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF5555] hover:bg-[#FF0000]/20 hover:border-[#FF0000]/60 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current text-[#FF3B30]" />
                      <span>Execução 5-10s</span>
                    </button>

                    <button
                      id={`ai-check-exercise-${ex.id}`}
                      onClick={() => onOpenFormChecker(ex.name)}
                      title="Analisar execução deste exercício com IA"
                      className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#D8B46A] hover:bg-[#D8B46A]/20 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Botão Encolher / Expandir Bloco de Treino */}
                    <button
                      id={`toggle-collapse-block-${ex.id}`}
                      type="button"
                      onClick={() => toggleBlockCollapse(ex.id)}
                      title={isCollapsed ? "Expandir detalhes do bloco" : "Encolher bloco de treino"}
                      className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A]/50 text-[#9B9BA1] hover:text-[#F5F5F7] transition-all cursor-pointer"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-[#D8B46A]" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Conteúdo Expandido do Bloco de Treino */}
                {!isCollapsed && (
                  <div className="mt-3.5 pt-3.5 border-t border-[#2B2B2F]/70 space-y-3.5">
                    {/* Vídeo explicativo que aparecerá para o aluno */}
                    <div
                      id={`student-video-preview-${ex.id}`}
                      className="p-3.5 rounded-2xl bg-[#19191C] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => {
                            setActiveVideoModal(ex);
                            setVideoClipType("clip");
                            setVideoKey((k) => k + 1);
                          }}
                          className="relative w-20 h-13 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer group/vid border border-[#2B2B2F]"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`}
                            alt={ex.name}
                            className="w-full h-full object-cover opacity-80 group-hover/vid:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-current drop-shadow" />
                          </div>
                          <span className="absolute bottom-0.5 right-1 text-[8px] font-black bg-black/80 text-white px-1 rounded">
                            5-10s
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] font-black tracking-wider text-[#FF5555] uppercase flex items-center gap-1">
                            <Video className="w-3 h-3 text-[#FF3B30]" />
                            VÍDEO EXPLICATIVO DO ALUNO
                          </span>
                          <h4 className="text-xs font-bold text-[#F5F5F7] truncate mt-0.5">
                            {videoInfo.title}
                          </h4>
                          <p className="text-[10px] text-[#9B9BA1]">
                            {videoInfo.channel} • Duração do trecho: 5 a 10s
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        id={`watch-explanatory-video-${ex.id}`}
                        onClick={() => {
                          setActiveVideoModal(ex);
                          setVideoClipType("clip");
                          setVideoKey((k) => k + 1);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#FF0000]/15 hover:bg-[#FF0000]/25 border border-[#FF0000]/30 text-[#FF5555] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Assistir Vídeo Explicativo</span>
                      </button>
                    </div>

                    {/* Coach Tip */}
                    {ex.coach_tip && (
                      <div className="flex items-center gap-2 text-xs text-[#9B9BA1] bg-[#1A1A1D] px-3.5 py-2 rounded-xl border border-[#2B2B2F]/60">
                        <span className="text-[#D8B46A] font-bold shrink-0">Dica do Coach:</span>
                        <span>{ex.coach_tip}</span>
                      </div>
                    )}

                {/* Weight & Reps Tracking Section (Controlled via Profile) */}
                {trackWeightsEnabled ? (
                  <div
                    id={`exercise-weights-panel-${ex.id}`}
                    className="mt-4 pt-3.5 border-t border-[#2B2B2F] space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-6 h-6 rounded-lg bg-[#FF6A2A]/15 text-[#FF6A2A] flex items-center justify-center">
                          <Dumbbell className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[#F5F5F7]">
                          Cargas & Repetições Feitas
                        </span>
                        <span className="text-[10px] text-[#9B9BA1] bg-[#1D1D1F] px-2 py-0.5 rounded-md border border-[#2B2B2F]">
                          Alvo: {ex.reps} reps
                        </span>
                        {databaseSyncState === "saving" && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#D8B46A] bg-[#D8B46A]/10 px-2 py-0.5 rounded-md border border-[#D8B46A]/20">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Salvando...
                          </span>
                        )}
                        {databaseSyncState === "synced" && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-md border border-[#34C759]/20">
                            <Database className="w-2.5 h-2.5" /> Salvo no banco
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#D8B46A]">
                          {exerciseSets[ex.id]?.filter((s) => Boolean(s.weight)).length || 0} de{" "}
                          {exerciseSets[ex.id]?.length || ex.sets} com peso
                        </span>
                        <button
                          type="button"
                          id={`add-set-btn-${ex.id}`}
                          onClick={() => handleAddSet(ex.id, ex.reps)}
                          className="text-[10px] font-bold text-[#FF6A2A] hover:text-[#FF9A62] bg-[#FF6A2A]/10 px-2 py-1 rounded-lg border border-[#FF6A2A]/25 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Adicionar série extra"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Série</span>
                        </button>
                      </div>
                    </div>

                    {/* Previous Load / Record from Database */}
                    {exerciseHistories[ex.id] && (
                      <div className="flex items-center gap-2 text-[11px] text-[#9B9BA1] bg-[#161618] px-3 py-1.5 rounded-xl border border-[#2B2B2F]/70 flex-wrap">
                        <History className="w-3.5 h-3.5 text-[#D8B46A] shrink-0" />
                        <span>
                          Último registro no banco:{" "}
                          <strong className="text-[#F5F5F7]">
                            {exerciseHistories[ex.id].last_weight_kg || exerciseHistories[ex.id].max_weight_kg} kg
                          </strong>
                          {exerciseHistories[ex.id].last_reps && ` (${exerciseHistories[ex.id].last_reps} reps)`}
                        </span>
                        {exerciseHistories[ex.id].max_weight_kg > 0 && (
                          <span className="text-[#34C759] font-bold">
                            · Carga Máxima: {exerciseHistories[ex.id].max_weight_kg} kg
                          </span>
                        )}
                      </div>
                    )}

                    {/* Set Rows Table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-[#9B9BA1] uppercase">
                        <span className="col-span-3 sm:col-span-2">Série</span>
                        <span className="col-span-5 sm:col-span-4 text-center">Peso Feito (kg)</span>
                        <span className="col-span-4 sm:col-span-3 text-center">Reps Feitas</span>
                        <span className="hidden sm:block sm:col-span-3 text-right">Status / Ação</span>
                      </div>

                      {(exerciseSets[ex.id] || []).map((setRecord, sIdx) => {
                        const prevSet = sIdx > 0 ? exerciseSets[ex.id]?.[sIdx - 1] : null;

                        return (
                          <div
                            key={setRecord.setNum}
                            id={`set-row-${ex.id}-${sIdx}`}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              setRecord.completed
                                ? "bg-[#34C759]/5 border-[#34C759]/30"
                                : "bg-[#121214] border-[#2B2B2F] hover:border-[#3E3E46]"
                            }`}
                          >
                            {/* Left: Set number & check */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                id={`check-set-${ex.id}-${sIdx}`}
                                onClick={() => handleToggleSetCompleted(ex.id, sIdx)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                  setRecord.completed
                                    ? "bg-[#34C759] text-[#0A0A0A] shadow-sm shadow-[#34C759]/30"
                                    : "bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:border-[#34C759]"
                                }`}
                                title={
                                  setRecord.completed
                                    ? "Desmarcar série concluída"
                                    : "Marcar série como concluída"
                                }
                              >
                                {setRecord.completed ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <span className="text-[11px] font-black">{setRecord.setNum}</span>
                                )}
                              </button>
                              <span className="text-xs font-bold text-[#F5F5F7]">
                                {setRecord.setNum}ª Série
                              </span>
                            </div>

                            {/* Center/Right: Weight and Reps Inputs */}
                            <div className="flex items-center gap-2 flex-1 justify-end flex-wrap sm:flex-nowrap">
                              {/* Weight Input with quick buttons */}
                              <div className="flex items-center gap-1 bg-[#1A1A1D] border border-[#2B2B2F] rounded-xl px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustWeight(ex.id, sIdx, -2.5)}
                                  className="w-5 h-5 rounded bg-[#252528] text-[#9B9BA1] hover:text-[#F5F5F7] flex items-center justify-center text-xs font-bold cursor-pointer"
                                  title="Diminuir 2.5kg"
                                >
                                  -
                                </button>
                                <div className="flex items-center gap-1">
                                  <input
                                    id={`input-weight-${ex.id}-${sIdx}`}
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="0"
                                    value={setRecord.weight}
                                    onChange={(e) =>
                                      updateSetRecord(ex.id, sIdx, { weight: e.target.value })
                                    }
                                    className="w-14 sm:w-16 bg-transparent text-center font-mono font-bold text-sm text-[#F5F5F7] focus:outline-none placeholder:text-[#5A5A62]"
                                  />
                                  <span className="text-[11px] font-bold text-[#FF6A2A]">kg</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustWeight(ex.id, sIdx, 2.5)}
                                  className="w-5 h-5 rounded bg-[#252528] text-[#9B9BA1] hover:text-[#F5F5F7] flex items-center justify-center text-xs font-bold cursor-pointer"
                                  title="Aumentar 2.5kg"
                                >
                                  +
                                </button>
                              </div>

                              {/* Reps Input */}
                              <div className="flex items-center gap-1 bg-[#1A1A1D] border border-[#2B2B2F] rounded-xl px-2 py-1">
                                <input
                                  id={`input-reps-${ex.id}-${sIdx}`}
                                  type="text"
                                  placeholder={ex.reps}
                                  value={setRecord.reps}
                                  onChange={(e) =>
                                    updateSetRecord(ex.id, sIdx, { reps: e.target.value })
                                  }
                                  className="w-12 sm:w-14 bg-transparent text-center font-mono font-bold text-sm text-[#F5F5F7] focus:outline-none placeholder:text-[#5A5A62]"
                                />
                                <span className="text-[11px] font-bold text-[#9B9BA1]">reps</span>
                              </div>

                              {/* Quick repeat previous weight */}
                              {prevSet && prevSet.weight && !setRecord.weight && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSetRecord(ex.id, sIdx, { weight: prevSet.weight })
                                  }
                                  className="text-[10px] font-semibold text-[#D8B46A] bg-[#D8B46A]/10 hover:bg-[#D8B46A]/20 px-2 py-1 rounded-lg border border-[#D8B46A]/30 transition-colors shrink-0 cursor-pointer"
                                  title="Copiar carga da série anterior"
                                >
                                  Repetir {prevSet.weight}kg
                                </button>
                              )}

                              {/* Remove extra set */}
                              {(exerciseSets[ex.id]?.length || 0) > ex.sets && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(ex.id, sIdx)}
                                  className="p-1 rounded-lg text-[#FF453A] hover:bg-[#FF453A]/10 cursor-pointer"
                                  title="Remover série extra"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#2B2B2F]/40 flex items-center justify-between text-[11px] text-[#6E6E73]">
                    <span>Anotação de peso por série desativada.</span>
                    <button
                      type="button"
                      id={`enable-weights-shortcut-${ex.id}`}
                      onClick={() => setActiveView("profile")}
                      className="text-[#FF6A2A] hover:underline font-semibold cursor-pointer"
                    >
                      Ligar em Perfil →
                    </button>
                  </div>
                )}
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
            onClick={handleFinishWorkout}
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

      {/* YouTube 5-10s Execution Video Modal */}
      {activeVideoModal && (() => {
        const videoInfo = getExerciseVideoInfo(
          activeVideoModal.name,
          activeVideoModal.video_url
        );
        const startSec = videoClipType === "clip" ? videoInfo.startSec : 0;
        const endSec = videoClipType === "clip" ? videoInfo.endSec : 0;
        const embedUrl = buildYouTubeEmbedUrl(videoInfo.videoId, startSec, endSec, 1);
        const externalYouTubeUrl = `https://www.youtube.com/watch?v=${videoInfo.videoId}${
          videoClipType === "clip" ? `&t=${startSec}s` : ""
        }`;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#151515] border border-[#2B2B2F] p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest text-[#FF3B30] uppercase flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" />
                      EXECUÇÃO EM VÍDEO (5-10s)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF0000]/15 text-[#FF5555] border border-[#FF0000]/30">
                      YouTube Direto no App
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#F5F5F7] mt-0.5">
                    {activeVideoModal.name}
                  </h3>
                  <p className="text-[11px] text-[#9B9BA1] flex items-center gap-1.5 mt-0.5">
                    <span className="text-[#D8B46A] font-semibold">{videoInfo.channel}</span>
                    <span>•</span>
                    <span className="truncate">{videoInfo.title}</span>
                  </p>
                </div>
                <button
                  id="close-video-modal-btn"
                  onClick={() => {
                    setActiveVideoModal(null);
                    setVideoClipType("clip");
                  }}
                  className="p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#4A4A52] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* YouTube Embedded Player (5 to 10s loop) */}
              <div className="relative w-full rounded-2xl bg-[#0A0A0A] border border-[#2B2B2F] overflow-hidden shadow-xl aspect-video">
                <iframe
                  key={`${videoInfo.videoId}-${videoClipType}-${videoKey}`}
                  src={embedUrl}
                  title={videoInfo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Loop Controls & Clip Duration Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#9B9BA1]">Modo de Reprodução:</span>
                  <div className="flex items-center gap-1 bg-[#151515] p-1 rounded-lg border border-[#2B2B2F]">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoClipType("clip");
                        setVideoKey((k) => k + 1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        videoClipType === "clip"
                          ? "bg-[#FF3B30] text-white shadow-sm"
                          : "text-[#9B9BA1] hover:text-white"
                      }`}
                    >
                      Trecho Rápido (5-10s)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoClipType("full");
                        setVideoKey((k) => k + 1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        videoClipType === "full"
                          ? "bg-[#FF3B30] text-white shadow-sm"
                          : "text-[#9B9BA1] hover:text-white"
                      }`}
                    >
                      Vídeo Completo
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoKey((k) => k + 1)}
                    title="Reiniciar vídeo"
                    className="px-2.5 py-1 rounded-lg bg-[#252528] hover:bg-[#303035] text-[11px] font-semibold text-[#F5F5F7] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-[#FF5555]" />
                    <span>Reiniciar Trecho</span>
                  </button>
                  <a
                    href={externalYouTubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/30 text-[11px] font-semibold text-[#FF5555] flex items-center gap-1 transition-colors"
                  >
                    <span>Abrir no YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Prescribed Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Séries</span>
                  <p className="text-sm font-black text-[#F5F5F7]">{activeVideoModal.sets} séries</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Repetições</span>
                  <p className="text-sm font-black text-[#F5F5F7]">{activeVideoModal.reps}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <span className="text-[10px] font-bold text-[#9B9BA1] uppercase">Descanso</span>
                  <p className="text-sm font-black text-[#D8B46A]">{activeVideoModal.rest || "60s"}</p>
                </div>
              </div>

              {/* Biomechanical and Coach Instructions */}
              <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D8B46A]" />
                  <p className="text-xs font-bold text-[#D8B46A] uppercase tracking-wider">
                    Foco Biomecânico & Dica do Treinador
                  </p>
                </div>
                <p className="text-xs text-[#E5E5EA] leading-relaxed">
                  {activeVideoModal.coach_tip ||
                    "Mantenha a postura alinhada, respire de forma controlada e realize a fase excêntrica em 2 a 3 segundos com contração total no ápice do movimento."}
                </p>
                {activeVideoModal.coach_message && (
                  <p className="text-[11px] text-[#9B9BA1] pt-1 border-t border-[#2B2B2F]">
                    <span className="font-semibold text-[#FF6A2A]">Atenção: </span>
                    {activeVideoModal.coach_message}
                  </p>
                )}
              </div>

              {/* Quick Actions inside the modal */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  id="open-ia-form-checker-from-video"
                  type="button"
                  onClick={() => {
                    const exName = activeVideoModal.name;
                    setActiveVideoModal(null);
                    onOpenFormChecker(exName);
                  }}
                  className="w-full py-3 rounded-xl bg-[#D8B46A]/15 border border-[#D8B46A]/40 text-[#D8B46A] hover:bg-[#D8B46A]/25 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#D8B46A]" />
                  <span>Analisar Minha Execução com IA (Câmera)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              {trackWeightsEnabled && (
                <>
                  <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                    <span className="text-[10px] text-[#FF6A2A] uppercase font-bold">Séries Anotadas</span>
                    <p className="text-base font-bold text-[#F5F5F7]">{totalLoggedSetsWithWeight} séries</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
                    <span className="text-[10px] text-[#D8B46A] uppercase font-bold">Carga Máxima</span>
                    <p className="text-base font-bold text-[#D8B46A]">
                      {maxWeightLogged > 0 ? `${maxWeightLogged} kg` : "—"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="generate-template-modal-btn"
                onClick={handleFinishWorkout}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6A2A]/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Templates para Instagram (Fundo Transparente)</span>
              </button>
              <button
                id="confirm-finish-workout-btn"
                onClick={() => setShowFinishedModal(false)}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] transition-all cursor-pointer"
              >
                {t("cta.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
