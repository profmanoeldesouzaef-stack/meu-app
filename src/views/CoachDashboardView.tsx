import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import {
  KPI,
  RadarAlert,
  Coupon,
  Partner,
  Workout,
  Diet,
  Challenge,
  ChallengeEvent,
  Broadcast,
  Student,
} from "../types";
import {
  UserCheck,
  TrendingUp,
  CreditCard,
  Dumbbell,
  UtensilsCrossed,
  Trophy,
  AlertTriangle,
  Megaphone,
  Plus,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Bot,
  Crown,
  Save,
  Search,
  Users,
  Target,
  Scale,
  Flame,
  Clock,
  Edit2,
  Trash2,
  PlusCircle,
  CheckCircle2,
  Zap,
  Sliders,
  Play,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Send,
  Copy,
  Layers,
  Filter,
  Link2,
  MessageCircle,
  ExternalLink,
  Share2,
  Droplets,
  Palette,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { appStorage } from "../utils/storage";
import { SubstituteExerciseModal } from "../components/SubstituteExerciseModal";
import { BulkSendWorkoutModal } from "../components/BulkSendWorkoutModal";
import { CoachWorkoutLibrary } from "../components/CoachWorkoutLibrary";
import { CoachDietFoodPresets } from "../components/CoachDietFoodPresets";
import { VeteranBadge } from "../lib/patents";
import { FinanceCRMTableWeb } from "../components/FinanceCRMTableWeb";

export const CoachDashboardView: React.FC = () => {
  const { t, lang, currentUserEmail, setInviteData, setActiveView, setVipChatUnlocked } = useApp();
  const [activeTab, setActiveTab] = useState<
    "overview" | "pending_students" | "ai_chat" | "invite" | "finance" | "workouts" | "library" | "diet" | "radar" | "broadcast" | "challenges"
  >("overview");

  // Pending Students state (Onboarding anamnesis & release queue)
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [pendingFilter, setPendingFilter] = useState<"all" | "workout" | "diet">("all");
  const [pendingSearchQuery, setPendingSearchQuery] = useState<string>("");

  // Protocol state (Hydration & Creatine for student)
  const [studentWaterTarget, setStudentWaterTarget] = useState<number>(2500);
  const [studentCreatineDose, setStudentCreatineDose] = useState<number>(5.0);
  const [savingProtocol, setSavingProtocol] = useState<boolean>(false);

  // Consultant Invite Link state
  const [coachInviteName, setCoachInviteName] = useState("Mariana Ferreira");
  const [coachInviteSpecialty, setCoachInviteSpecialty] = useState(
    "Periodização Científica & Protocolo de 12 Semanas"
  );
  const [coachInviteMessage, setCoachInviteMessage] = useState(
    "Vou planejar seus treinos personalizados, ajustar sua dieta flexível e avaliar sua evolução física e fotos a cada 20 dias."
  );
  const [inviteCopied, setInviteCopied] = useState(false);

  const [kpis, setKpis] = useState<KPI[]>([]);
  const [radar, setRadar] = useState<RadarAlert[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [diet, setDiet] = useState<Diet | null>(null);

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("std-1");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentFilterPlan, setStudentFilterPlan] = useState<string>("all");

  // Workout tab specific filters
  const [workoutSearchQuery, setWorkoutSearchQuery] = useState("");
  const [workoutFilterPlan, setWorkoutFilterPlan] = useState<string>("all");

  // Workout Library & Bulk Send state
  const [workoutLibrary, setWorkoutLibrary] = useState<Workout[]>([]);
  const [showSendWorkoutModal, setShowSendWorkoutModal] = useState(false);
  const [workoutToBulkSend, setWorkoutToBulkSend] = useState<Workout | null>(null);

  // Exercise Substitute state
  const [substituteModalIdx, setSubstituteModalIdx] = useState<number | null>(null);

  // Forms state
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponPct, setNewCouponPct] = useState(15);
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerName, setNewPartnerName] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastAuthor, setBroadcastAuthor] = useState("Coach Mari");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Salvo com sucesso!");

  // Macro & Calorie updating state
  const [savingMacros, setSavingMacros] = useState(false);
  const [macroSuccessMessage, setMacroSuccessMessage] = useState<string | null>(null);
  const [macroErrorMessage, setMacroErrorMessage] = useState<string | null>(null);

  // AI Workout Generator Modal & State
  const [showAiWorkoutModal, setShowAiWorkoutModal] = useState(false);
  const [aiWorkoutLoading, setAiWorkoutLoading] = useState(false);
  const [aiWorkoutSplit, setAiWorkoutSplit] = useState("Push (Peito, Ombro e Tríceps)");
  const [aiWorkoutLevel, setAiWorkoutLevel] = useState("Intermediário");
  const [aiWorkoutDuration, setAiWorkoutDuration] = useState(55);
  const [aiWorkoutFocusNotes, setAiWorkoutFocusNotes] = useState(
    "Ênfase em retração escapular e controle excêntrico de 3 segundos."
  );
  const [aiWorkoutDate, setAiWorkoutDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [aiWorkoutMode, setAiWorkoutMode] = useState<"single_day" | "weekly_split" | "multi_week_periodization">("single_day");
  const [aiWorkoutWeeks, setAiWorkoutWeeks] = useState(4);

  // AI Diet Generator Modal & State
  const [showAiDietModal, setShowAiDietModal] = useState(false);
  const [aiDietLoading, setAiDietLoading] = useState(false);
  const [aiDietGoal, setAiDietGoal] = useState("Hipertrofia e Densidade Muscular");
  const [aiDietKcal, setAiDietKcal] = useState(2500);
  const [aiDietRestrictions, setAiDietRestrictions] = useState("Nenhuma");

  // New Food Item in Diet form
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodGrams, setNewFoodGrams] = useState(200);
  const [newFoodKcal, setNewFoodKcal] = useState(300);
  const [newFoodProtein, setNewFoodProtein] = useState(30);
  const [newFoodCarbs, setNewFoodCarbs] = useState(35);
  const [newFoodFats, setNewFoodFats] = useState(8);
  const [newFoodMeal, setNewFoodMeal] = useState<"breakfast" | "lunch" | "snack" | "dinner" | "supper">("lunch");
  const [showAddFoodForm, setShowAddFoodForm] = useState(false);

  // Food Option (Substitution) Modal State
  const [addFoodOptionModalFoodId, setAddFoodOptionModalFoodId] = useState<string | null>(null);
  const [addFoodOptionText, setAddFoodOptionText] = useState("");

  // Coach AI Methodology & Guidelines Chat State
  const [coachAiMessages, setCoachAiMessages] = useState<Array<{ sender: "coach" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Olá, Coach! Sou a sua IA técnica e biomecânica. Diga-me tudo o que você prefere ou veta na prescrição de treinos e dietas dos seus alunos (ex: 'Priorizar exercícios livres com halteres', 'Evitar açúcares simples e ultraprocessados', 'Prescrever cadência excêntrica de 3s', 'Para mulheres priorizar glúteos e posteriores'). Atualizarei suas diretrizes ativas e as aplicarei em cada novo plano gerado!",
      time: "Agora",
    },
  ]);
  const [coachAiInput, setCoachAiInput] = useState("");
  const [coachAiSending, setCoachAiSending] = useState(false);
  const [activeGuidelines, setActiveGuidelines] = useState<string[]>([
    "Priorizar exercícios multiarticulares e cadência excêntrica controlada (3s).",
    "Nas divisões femininas, priorizar volume para glúteos e posterior de coxa.",
    "Evitar alimentos ultraprocessados; prescrever fontes limpas de carboidrato (arroz, batata, aveia).",
    "Sempre incluir opções de substituição equivalentes em macronutrientes para cada refeição.",
  ]);
  const [newCustomGuideline, setNewCustomGuideline] = useState("");

  // Challenge Event state & form
  const [challengeEvent, setChallengeEvent] = useState<ChallengeEvent | null>(null);
  const [challengeSubmissions, setChallengeSubmissions] = useState<Challenge[]>([]);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtSubtitle, setEvtSubtitle] = useState("");
  const [evtRules, setEvtRules] = useState("");
  const [evtPrize, setEvtPrize] = useState("");
  const [evtStartDate, setEvtStartDate] = useState("");
  const [evtEndDate, setEvtEndDate] = useState("");
  const [evtStatus, setEvtStatus] = useState<"active" | "loading" | "closed">("active");
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [crowningLoading, setCrowningLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getKpis().catch(() => []),
      api.getRadar().catch(() => []),
      api.getCoupons().catch(() => []),
      api.getPartners().catch(() => []),
      api.getTodayWorkout().catch(() => null),
      api.getDiet().catch(() => null),
      api.getStudents().catch(() => []),
      api.getChallengeEvent().catch(() => null),
      api.getChallenges().catch(() => []),
      api.getWorkoutLibrary().catch(() => []),
      api.getCoachGuidelines().catch(() => []),
      api.getPendingStudents().catch(() => []),
    ]).then(([kp, rd, cp, pt, wk, dt, stds, chEvt, chItems, wLib, cGuidelines, pStds]) => {
      setKpis(kp);
      setRadar(rd);
      setCoupons(cp);
      setPartners(pt);
      if (wLib) setWorkoutLibrary(wLib);
      if (wk) setWorkout(wk);
      if (dt) setDiet(dt);
      if (cGuidelines && cGuidelines.length > 0) setActiveGuidelines(cGuidelines);
      if (pStds) setPendingStudents(pStds);
      if (chEvt) {
        setChallengeEvent(chEvt);
        setEvtTitle(chEvt.title || "");
        setEvtSubtitle(chEvt.subtitle || "");
        setEvtRules(chEvt.rules || "");
        setEvtPrize(chEvt.prize || "");
        setEvtStartDate(chEvt.start_date ? chEvt.start_date.split("T")[0] : "");
        setEvtEndDate(chEvt.end_date ? chEvt.end_date.split("T")[0] : "");
        setEvtStatus(chEvt.status || "active");
      }
      if (chItems) {
        setChallengeSubmissions(chItems);
      }
      if (stds && stds.length > 0) {
        setStudents(stds);
        const defaultStd = stds[0];
        setSelectedStudentId(defaultStd.id);
        if (defaultStd.diet) setDiet(defaultStd.diet);
        if (defaultStd.workout) setWorkout(defaultStd.workout);
      }
    });
  }, []);

  const loadPendingStudents = async () => {
    setLoadingPending(true);
    try {
      const data = await api.getPendingStudents();
      setPendingStudents(data);
    } catch (err) {
      console.error("Erro ao carregar alunos pendentes:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending_students") {
      loadPendingStudents();
    }
  }, [activeTab]);

  const handleReleaseWorkout = async (studentId: string) => {
    setReleasingId(`workout-${studentId}`);
    try {
      await api.releaseStudentWorkout(studentId);
      setPendingStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, workout_released: true } : s))
      );
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, workout_released: true } : s))
      );
      showNotification("Treino liberado com sucesso para o aluno!");
    } catch (err) {
      console.error("Erro ao liberar treino:", err);
      showNotification("Erro ao liberar treino do aluno.");
    } finally {
      setReleasingId(null);
    }
  };

  const handleReleaseDiet = async (studentId: string) => {
    setReleasingId(`diet-${studentId}`);
    try {
      await api.releaseStudentDiet(studentId);
      setPendingStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, diet_released: true } : s))
      );
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, diet_released: true } : s))
      );
      showNotification("Dieta liberada com sucesso para o aluno!");
    } catch (err) {
      console.error("Erro ao liberar dieta:", err);
      showNotification("Erro ao liberar dieta do aluno.");
    } finally {
      setReleasingId(null);
    }
  };

  const handleSimulatePendingStudent = async () => {
    try {
      const res = await api.simulatePendingStudent();
      const newStd = res.student;
      await loadPendingStudents();
      if (newStd) {
        setStudents((prev) => [newStd, ...prev]);
        showNotification(`Aluno simulado adicionado à fila: ${newStd.name}`);
      } else {
        showNotification("Aluno simulado adicionado à fila!");
      }
    } catch (err) {
      console.error("Erro ao simular aluno pendente:", err);
      showNotification("Erro ao simular aluno.");
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0] || null;

  // Sync hydration & creatine when selected student changes
  useEffect(() => {
    if (selectedStudent) {
      setStudentWaterTarget(selectedStudent.water_ml ? Number(selectedStudent.water_ml) : 2500);
      setStudentCreatineDose(selectedStudent.creatine_dose_g ? Number(selectedStudent.creatine_dose_g) : 5.0);
    }
  }, [selectedStudentId, selectedStudent?.id, selectedStudent?.water_ml, selectedStudent?.creatine_dose_g]);

  // Handle selecting a student
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    if (student.diet) {
      setDiet(student.diet);
    }
    if (student.workout) {
      setWorkout(student.workout);
    }
    setStudentWaterTarget(student.water_ml ? Number(student.water_ml) : 2500);
    setStudentCreatineDose(student.creatine_dose_g ? Number(student.creatine_dose_g) : 5.0);
    // Pre-fill AI modals with student info
    setAiDietGoal(student.goal || "Hipertrofia Muscular");
    setAiDietRestrictions(student.restrictions || "Nenhuma");
    const estimatedKcal = Math.round(
      student.weight_kg * 32 + (student.goal.toLowerCase().includes("hipertrofia") ? 400 : -350)
    );
    setAiDietKcal(estimatedKcal > 1400 ? estimatedKcal : 2200);
  };

  const handleToggleStudentVipChat = async (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    const newVipStatus = !target.vip_chat_unlocked;
    try {
      await api.toggleStudentVipChat(studentId, newVipStatus);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, vip_chat_unlocked: newVipStatus } : s))
      );
      if (studentId === "std-1") {
        setVipChatUnlocked(newVipStatus);
      }
      showNotification(
        newVipStatus
          ? `Benefício VIP de Cores do Chat CONCEDIDO para ${target.name}!`
          : `Benefício VIP de Cores do Chat REVOGADO de ${target.name}.`
      );
    } catch (e) {
      console.error("Error toggling VIP chat:", e);
      showNotification("Erro ao atualizar benefício VIP do aluno.");
    }
  };

  const handleSaveStudentProtocol = async () => {
    if (!selectedStudent) return;
    setSavingProtocol(true);
    try {
      const updated = await api.updateStudentProtocol(selectedStudent.id, {
        water_ml: studentWaterTarget,
        creatine_dose_g: studentCreatineDose,
      });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? { ...s, water_ml: updated.water_ml, creatine_dose_g: updated.creatine_dose_g }
            : s
        )
      );
      showNotification(
        `Prescrição salva: ${updated.water_ml}ml de água e ${updated.creatine_dose_g}g de creatina para ${selectedStudent.name}!`
      );
    } catch (e) {
      console.error("Error saving student protocol:", e);
      showNotification("Erro ao salvar prescrição de hidratação e creatina.");
    } finally {
      setSavingProtocol(false);
    }
  };

  const showNotification = (msg: string) => {
    setSaveMessage(msg);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      const created = await api.createCoupon({
        code: newCouponCode.trim().toUpperCase(),
        pct: Number(newCouponPct),
      });
      setCoupons((prev) => [created, ...prev]);
      setNewCouponCode("");
      showNotification("Cupom criado com sucesso!");
    } catch (e) {
      console.error("Error creating coupon:", e);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const updated = await api.toggleCoupon(id);
      setCoupons((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      console.error("Error toggling coupon:", e);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerEmail.trim()) return;
    try {
      const created = await api.createPartner(newPartnerEmail.trim(), newPartnerName.trim() || undefined);
      setPartners((prev) => [{ ...created, is_veteran: true }, ...prev]);
      setNewPartnerEmail("");
      setNewPartnerName("");
      showNotification("Parceiro adicionado com sucesso! Selo de Veterano concedido.");
    } catch (e) {
      console.error("Error creating partner:", e);
    }
  };

  const handleTogglePartner = async (id: string) => {
    try {
      const updated = await api.togglePartner(id);
      setPartners((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      console.error("Error toggling partner:", e);
    }
  };

  const handleSaveWorkout = async () => {
    if (!workout) return;
    try {
      if (selectedStudent) {
        await api.updateStudentWorkout(selectedStudent.id, workout);
        // update local student list
        setStudents((prev) =>
          prev.map((s) => (s.id === selectedStudent.id ? { ...s, workout } : s))
        );
        showNotification(`Treino de ${selectedStudent.name} salvo com sucesso!`);
      } else {
        await api.updateWorkout(workout);
        showNotification("Treino salvo com sucesso!");
      }
    } catch (e) {
      console.error("Error updating workout:", e);
    }
  };

  const handleOpenBulkSend = (targetWorkout?: Workout) => {
    setWorkoutToBulkSend(targetWorkout || workout);
    setShowSendWorkoutModal(true);
  };

  const handleSaveCurrentToLibrary = async () => {
    if (!workout) return;
    try {
      const templateToSave: Workout = {
        ...workout,
        id: `lib-${Date.now()}`,
      };
      const saved = await api.saveWorkoutLibrary(templateToSave);
      setWorkoutLibrary((prev) => [saved, ...prev.filter((w) => w.id !== saved.id)]);
      showNotification(`Treino "${workout.title}" salvo na Biblioteca Oficial!`);
    } catch (e) {
      console.error("Error saving to library:", e);
    }
  };

  const handleDeleteFromLibrary = async (id: string) => {
    if (!confirm("Deseja remover este protocolo da biblioteca?")) return;
    try {
      await api.deleteWorkoutLibrary(id);
      setWorkoutLibrary((prev) => prev.filter((w) => w.id !== id));
      showNotification("Treino removido da biblioteca.");
    } catch (e) {
      console.error("Error deleting from library:", e);
    }
  };

  const handleLoadWorkoutFromLibrary = (libWorkout: Workout) => {
    setWorkout(libWorkout);
    setActiveTab("workouts");
    showNotification(`Protocolo "${libWorkout.title}" carregado no editor!`);
  };

  const handleSelectSubstitute = (substituteName: string) => {
    if (substituteModalIdx === null || !workout) return;
    const updated = [...(workout.exercises || [])];
    const currentEx = updated[substituteModalIdx];
    if (currentEx) {
      updated[substituteModalIdx] = {
        ...currentEx,
        substitute_exercise: substituteName,
      };
      setWorkout({ ...workout, exercises: updated });
      showNotification(`Substituto configurado: ${substituteName}`);
    }
    setSubstituteModalIdx(null);
  };

  // Diet food option (substitutions) handlers
  const handleOpenAddFoodOptionModal = (foodId: string) => {
    setAddFoodOptionModalFoodId(foodId);
    setAddFoodOptionText("");
  };

  const handleConfirmAddFoodOption = () => {
    if (!addFoodOptionModalFoodId || !addFoodOptionText.trim() || !diet) return;
    const updatedFoods = diet.foods.map((f) => {
      if (f.id === addFoodOptionModalFoodId) {
        return {
          ...f,
          options: [...(f.options || []), addFoodOptionText.trim()],
        };
      }
      return f;
    });
    setDiet({ ...diet, foods: updatedFoods });
    setAddFoodOptionModalFoodId(null);
    setAddFoodOptionText("");
    showNotification("Opção de substituição adicionada com sucesso.");
  };

  const handleRemoveFoodOption = (foodId: string, optIndex: number) => {
    if (!diet) return;
    const updatedFoods = diet.foods.map((f) => {
      if (f.id === foodId) {
        const nextOpts = [...(f.options || [])];
        nextOpts.splice(optIndex, 1);
        return {
          ...f,
          options: nextOpts,
        };
      }
      return f;
    });
    setDiet({ ...diet, foods: updatedFoods });
    showNotification("Opção removida.");
  };

  // Preset food selector handler
  const handleSelectPresetFood = (preset: {
    name: string;
    grams: number;
    kcal: number;
    p: number;
    c: number;
    f: number;
  }) => {
    if (!diet) return;
    const newFood = {
      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: preset.name,
      grams: preset.grams,
      kcal: preset.kcal,
      p: preset.p,
      c: preset.c,
      f: preset.f,
      meal: newFoodMeal,
      options: [],
    };
    const updatedFoods = [newFood, ...(diet.foods || [])];
    const totalKcal = updatedFoods.reduce((acc, f) => acc + (f.kcal || 0), 0);
    const totalP = updatedFoods.reduce((acc, f) => acc + (f.p || 0), 0);
    const totalC = updatedFoods.reduce((acc, f) => acc + (f.c || 0), 0);
    const totalF = updatedFoods.reduce((acc, f) => acc + (f.f || 0), 0);

    setDiet({
      ...diet,
      target_kcal: totalKcal,
      target_protein_g: totalP,
      target_carbs_g: totalC,
      target_fats_g: totalF,
      foods: updatedFoods,
    });
    showNotification(`"${preset.name}" adicionado à refeição!`);
  };

  const handleSaveDiet = async () => {
    if (!diet) return;
    try {
      if (selectedStudent) {
        await api.updateStudentDiet(selectedStudent.id, diet);
        // update local student list
        setStudents((prev) =>
          prev.map((s) => (s.id === selectedStudent.id ? { ...s, diet } : s))
        );
        showNotification(`Dieta de ${selectedStudent.name} salva com sucesso!`);
      } else {
        await api.updateDiet(diet);
        showNotification("Dieta salva com sucesso!");
      }
    } catch (e) {
      console.error("Error updating diet:", e);
    }
  };

  const handleSaveMacrosAndDiet = async () => {
    if (!diet) return;
    setSavingMacros(true);
    setMacroSuccessMessage(null);
    setMacroErrorMessage(null);

    try {
      const studentId = selectedStudent?.id;
      const calories = diet.kcal || 2400;
      const proteinPct = diet.protein_pct || 35;
      const carbsPct = diet.carbs_pct || 45;
      const fatsPct = diet.fats_pct || 20;

      const proteinG = Math.round((calories * (proteinPct / 100)) / 4);
      const carbsG = Math.round((calories * (carbsPct / 100)) / 4);
      const fatsG = Math.round((calories * (fatsPct / 100)) / 9);

      // 1. Atualizar e sincronizar diretamente no Supabase
      if (studentId) {
        const updatePayload: Record<string, any> = {
          target_calories: calories,
          target_protein_pct: proteinPct,
          target_carbs_pct: carbsPct,
          target_fats_pct: fatsPct,
          target_protein_g: proteinG,
          target_carbs_g: carbsG,
          target_fats_g: fatsG,
          diet_plan: diet,
          updated_at: new Date().toISOString(),
        };

        const { error: sbProfileErr } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", studentId);

        if (sbProfileErr) {
          console.warn("Aviso ao atualizar perfil no Supabase:", sbProfileErr);
        }

        try {
          await supabase.from("diet_plans").upsert(
            {
              user_id: studentId,
              calories,
              protein_pct: proteinPct,
              carbs_pct: carbsPct,
              fats_pct: fatsPct,
              plan_data: diet,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (planErr) {
          console.warn("Aviso ao gravar diet_plans:", planErr);
        }

        // Cache persistente por aluno
        await appStorage.setItem(`vyra_diet_${studentId}`, diet);
        await appStorage.setItem(`vyra_macros_${studentId}`, {
          calories,
          proteinPct,
          carbsPct,
          fatsPct,
          proteinG,
          carbsG,
          fatsG,
        });
      }

      // Persistir também no storage global ativo
      await appStorage.setItem("vyra_diet_current", diet);

      // 2. Atualizar a API interna do applet e o state de alunos
      if (selectedStudent) {
        await api.updateStudentDiet(selectedStudent.id, diet).catch(() => {});
        setStudents((prev) =>
          prev.map((s) => (s.id === selectedStudent.id ? { ...s, diet } : s))
        );
      } else {
        await api.updateDiet(diet).catch(() => {});
      }

      // 3. Feedback visual de sucesso imediato
      setMacroSuccessMessage("Metas de macronutrientes atualizadas com sucesso!");
      showNotification("Metas de macronutrientes atualizadas com sucesso!");

      setTimeout(() => {
        setMacroSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error("Erro ao atualizar macronutrientes:", err);
      setMacroErrorMessage(err?.message || "Falha ao gravar macronutrientes no banco de dados.");
    } finally {
      setSavingMacros(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    try {
      await api.addBroadcast({
        text: broadcastText.trim(),
        author: broadcastAuthor || "Coach Mari",
      });
      setBroadcastText("");
      showNotification("Comunicado transmitido para todos os alunos!");
    } catch (e) {
      console.error("Error creating broadcast:", e);
    }
  };

  // Challenge Event Handlers
  const handleSaveChallengeEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChallenge(true);
    try {
      const updated = await api.updateChallengeEvent({
        title: evtTitle,
        subtitle: evtSubtitle,
        rules: evtRules,
        prize: evtPrize,
        start_date: evtStartDate ? new Date(evtStartDate).toISOString() : new Date().toISOString(),
        end_date: evtEndDate ? new Date(evtEndDate).toISOString() : new Date().toISOString(),
        status: evtStatus,
        is_active: evtStatus !== "loading",
      });
      setChallengeEvent(updated);
      showNotification("Configurações do Desafio e Votação salvas!");
    } catch (err) {
      console.error("Erro ao atualizar desafio:", err);
    } finally {
      setSavingChallenge(false);
    }
  };

  const handleCrownChampion = async () => {
    if (!confirm("Deseja congelar a votação e coroar a Campeã Oficial agora com base no ranking de votos?")) {
      return;
    }
    setCrowningLoading(true);
    try {
      const res = await api.closeAndCrownChallenge();
      if (res.ok) {
        setChallengeEvent(res.event);
        setEvtStatus("closed");
        showNotification(`Campeã coroada com sucesso: ${res.champion.name}!`);
        // Refresh challenges
        const refreshed = await api.getChallenges();
        setChallengeSubmissions(refreshed);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao congelar desafio");
    } finally {
      setCrowningLoading(false);
    }
  };

  // Coach AI Methodology & Guidelines Chat Handlers
  const handleSendMessageToAi = async (textToSend?: string) => {
    const msg = (textToSend || coachAiInput).trim();
    if (!msg || coachAiSending) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setCoachAiMessages((prev) => [...prev, { sender: "coach", text: msg, time: now }]);
    setCoachAiInput("");
    setCoachAiSending(true);

    try {
      const res = await api.coachAiChat(msg, activeGuidelines);
      const aiTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setCoachAiMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.reply || "Instruções registradas com sucesso! Aplicarei aos treinos e dietas.",
          time: aiTime,
        },
      ]);
      if (res.updated_guidelines && res.updated_guidelines.length > 0) {
        setActiveGuidelines(res.updated_guidelines);
        showNotification("Diretrizes da sua metodologia atualizadas!");
      }
    } catch (err) {
      console.error("Erro no chat com IA:", err);
      setCoachAiMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Recebi suas diretrizes, Coach! As preferências da sua metodologia estão ativas para as próximas prescrições de treinos e dietas.",
          time: now,
        },
      ]);
    } finally {
      setCoachAiSending(false);
    }
  };

  const handleAddCustomGuideline = async () => {
    if (!newCustomGuideline.trim()) return;
    const updated = [...activeGuidelines, newCustomGuideline.trim()];
    setActiveGuidelines(updated);
    setNewCustomGuideline("");
    try {
      await api.updateCoachGuidelines(updated);
      showNotification("Nova diretriz salva na sua metodologia!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveGuideline = async (index: number) => {
    const updated = activeGuidelines.filter((_, i) => i !== index);
    setActiveGuidelines(updated);
    try {
      await api.updateCoachGuidelines(updated);
      showNotification("Diretriz removida.");
    } catch (e) {
      console.error(e);
    }
  };

  // AI Workout Generation
  const handleGenerateAiWorkout = async () => {
    setAiWorkoutLoading(true);
    try {
      const generated = await api.coachGenerateWorkout({
        student_name: selectedStudent?.name || "Atleta Vyra",
        goal: selectedStudent?.goal || "Hipertrofia Muscular",
        split: aiWorkoutSplit,
        level: aiWorkoutLevel,
        duration_min: Number(aiWorkoutDuration),
        focus_notes: aiWorkoutFocusNotes,
        lang,
        workout_date: aiWorkoutDate || new Date().toISOString().split("T")[0],
        generation_mode: aiWorkoutMode,
        period_weeks: Number(aiWorkoutWeeks),
      });

      if (generated) {
        setWorkout(generated);
        setShowAiWorkoutModal(false);
        showNotification("Treino gerado com IA e aplicado ao editor!");
      }
    } catch (err) {
      console.error("Erro ao gerar treino com IA:", err);
    } finally {
      setAiWorkoutLoading(false);
    }
  };

  // AI Diet Generation
  const handleGenerateAiDiet = async () => {
    setAiDietLoading(true);
    try {
      const generated = await api.coachGenerateDiet({
        student_name: selectedStudent?.name || "Atleta Vyra",
        goal: aiDietGoal,
        weight_kg: selectedStudent?.weight_kg || 75,
        height_cm: selectedStudent?.height_cm || 175,
        restrictions: aiDietRestrictions,
        target_kcal: Number(aiDietKcal),
        lang,
      });

      if (generated) {
        setDiet(generated);
        setShowAiDietModal(false);
        showNotification(`Dieta personalizada com IA gerada para ${selectedStudent?.name || "o aluno"}!`);
      }
    } catch (err) {
      console.error("Erro ao gerar dieta com IA:", err);
    } finally {
      setAiDietLoading(false);
    }
  };

  // Add custom food to diet
  const handleAddFoodToDiet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim() || !diet) return;

    const newFood = {
      id: `food-${Date.now()}`,
      name: newFoodName.trim(),
      grams: Number(newFoodGrams) || 100,
      kcal: Number(newFoodKcal) || 150,
      p: Number(newFoodProtein) || 10,
      c: Number(newFoodCarbs) || 10,
      f: Number(newFoodFats) || 5,
      meal: newFoodMeal,
    };

    setDiet({
      ...diet,
      foods: [...(diet.foods || []), newFood],
    });

    setNewFoodName("");
    setShowAddFoodForm(false);
    showNotification("Alimento adicionado à dieta!");
  };

  const handleRemoveFoodFromDiet = (foodId: string) => {
    if (!diet) return;
    setDiet({
      ...diet,
      foods: diet.foods.filter((f) => f.id !== foodId),
    });
    showNotification("Alimento removido da dieta.");
  };

  // Filtered students for search bar
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.nickname.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.goal.toLowerCase().includes(studentSearchQuery.toLowerCase());

    const matchesPlan =
      studentFilterPlan === "all" || s.plan.toLowerCase().includes(studentFilterPlan.toLowerCase());

    return matchesSearch && matchesPlan;
  });

  const tabs = [
    { id: "overview", label: t("coach.overview"), icon: TrendingUp },
    {
      id: "pending_students",
      label: `Alunos Pendentes ${
        pendingStudents.filter((s) => !s.workout_released || !s.diet_released).length > 0
          ? `(${pendingStudents.filter((s) => !s.workout_released || !s.diet_released).length})`
          : ""
      }`,
      icon: UserCheck,
    },
    { id: "ai_chat", label: "Conversar com IA (Metodologia)", icon: Bot },
    { id: "invite", label: "Convidar Alunos (Link VIP)", icon: Link2 },
    { id: "challenges", label: "Desafios & Votação", icon: Trophy },
    { id: "workouts", label: t("coach.workouts"), icon: Dumbbell },
    { id: "library", label: "Biblioteca de Treinos", icon: BookOpen },
    { id: "diet", label: t("coach.diet"), icon: UtensilsCrossed },
    { id: "finance", label: t("coach.finance"), icon: CreditCard },
    { id: "radar", label: t("coach.radar"), icon: AlertTriangle },
    { id: "broadcast", label: t("coach.broadcast"), icon: Megaphone },
  ];

  const mealLabels: Record<string, string> = {
    breakfast: "Café da Manhã",
    lunch: "Almoço",
    snack: "Lanche da Tarde",
    dinner: "Jantar",
    supper: "Ceia",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-3 py-1 rounded-full border border-[#D8B46A]/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>COACH DASHBOARD & INTEL</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-1">
            Gestão de Alunos & Protocolos IA
          </h1>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 rounded-2xl bg-[#34C759]/20 border border-[#34C759] text-[#34C759] text-xs font-extrabold flex items-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#151515] border border-[#2B2B2F] overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`coach-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#D8B46A] text-[#0A0A0A] shadow-md shadow-[#D8B46A]/20"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Alunos Pendentes (Anamnese Obrigatória & Fila de Liberação) */}
      {activeTab === "pending_students" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1A1A1E] via-[#151515] to-[#121214] border border-[#D8B46A]/30 space-y-4 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D8B46A]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-3 py-1 rounded-full border border-[#D8B46A]/30 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    FILA DE ANAMNESE OBRIGATÓRIA
                  </span>
                  <span className="text-xs font-bold text-[#9B9BA1] bg-[#2B2B2F] px-2.5 py-0.5 rounded-full">
                    {pendingStudents.length} {pendingStudents.length === 1 ? "aluno registrado" : "alunos registrados"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
                  Alunos Aguardando Liberação do Coach
                </h2>
                <p className="text-sm text-[#9B9BA1] max-w-2xl">
                  Novos alunos que completaram a anamnese inicial obrigatória. Os treinos e dietas permanecem travados no app do aluno até você clicar em liberar ou prescrever um protocolo personalizado.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={loadPendingStudents}
                  disabled={loadingPending}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2B2B2F] hover:bg-[#3A3A3F] text-[#F5F5F7] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? "animate-spin" : ""}`} />
                  <span>Atualizar</span>
                </button>
                <button
                  onClick={handleSimulatePendingStudent}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D8B46A] hover:bg-[#E5C17B] text-[#0A0A0A] flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#D8B46A]/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simular Aluno com Anamnese</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#111113] border border-[#2B2B2F] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#9B9BA1]">Total na Fila</span>
                  <p className="text-2xl font-black text-[#F5F5F7]">{pendingStudents.length}</p>
                </div>
                <Users className="w-6 h-6 text-[#D8B46A]" />
              </div>
              <div className="p-4 rounded-2xl bg-[#111113] border border-[#2B2B2F] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#9B9BA1]">Treino Pendente</span>
                  <p className="text-2xl font-black text-[#FF6A2A]">
                    {pendingStudents.filter((s) => !s.workout_released).length}
                  </p>
                </div>
                <Dumbbell className="w-6 h-6 text-[#FF6A2A]" />
              </div>
              <div className="p-4 rounded-2xl bg-[#111113] border border-[#2B2B2F] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#9B9BA1]">Dieta Pendente</span>
                  <p className="text-2xl font-black text-[#34C759]">
                    {pendingStudents.filter((s) => !s.diet_released).length}
                  </p>
                </div>
                <UtensilsCrossed className="w-6 h-6 text-[#34C759]" />
              </div>
            </div>
          </div>

          {/* Filters and Search Toolbar */}
          <div className="p-4 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold text-[#9B9BA1] flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filtrar:
              </span>
              <button
                onClick={() => setPendingFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  pendingFilter === "all"
                    ? "bg-[#D8B46A] text-[#0A0A0A]"
                    : "bg-[#202024] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                Todos ({pendingStudents.length})
              </button>
              <button
                onClick={() => setPendingFilter("workout")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  pendingFilter === "workout"
                    ? "bg-[#FF6A2A] text-white"
                    : "bg-[#202024] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                Treino Pendente ({pendingStudents.filter((s) => !s.workout_released).length})
              </button>
              <button
                onClick={() => setPendingFilter("diet")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  pendingFilter === "diet"
                    ? "bg-[#34C759] text-white"
                    : "bg-[#202024] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                Dieta Pendente ({pendingStudents.filter((s) => !s.diet_released).length})
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pendingSearchQuery}
                onChange={(e) => setPendingSearchQuery(e.target.value)}
                placeholder="Buscar por nome, objetivo, restrição..."
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-xl bg-[#202024] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#9B9BA1] focus:outline-none focus:border-[#D8B46A]"
              />
            </div>
          </div>

          {/* Student Cards List */}
          {pendingStudents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#34C759]/10 border border-[#34C759]/30 flex items-center justify-center mx-auto text-[#34C759]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#F5F5F7]">Fila Zerada!</h3>
                <p className="text-xs text-[#9B9BA1] max-w-md mx-auto">
                  Não há alunos com anamnese aguardando liberação neste momento. Todos os protocolos foram liberados.
                </p>
              </div>
              <button
                onClick={handleSimulatePendingStudent}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D8B46A] hover:bg-[#E5C17B] text-[#0A0A0A] inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D8B46A]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Simular Aluno com Anamnese Pendente</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingStudents
                .filter((s) => {
                  if (pendingFilter === "workout") return !s.workout_released;
                  if (pendingFilter === "diet") return !s.diet_released;
                  return true;
                })
                .filter((s) => {
                  if (!pendingSearchQuery.trim()) return true;
                  const q = pendingSearchQuery.toLowerCase();
                  return (
                    (s.name || "").toLowerCase().includes(q) ||
                    (s.nickname || "").toLowerCase().includes(q) ||
                    (s.email || "").toLowerCase().includes(q) ||
                    (s.primary_goal || s.goal || "").toLowerCase().includes(q) ||
                    (s.dietary_restrictions || s.restrictions || "").toLowerCase().includes(q) ||
                    (s.medical_history || "").toLowerCase().includes(q)
                  );
                })
                .map((student) => {
                  const isWorkoutReleased = Boolean(student.workout_released);
                  const isDietReleased = Boolean(student.diet_released);
                  const isReleasingWk = releasingId === `workout-${student.id}`;
                  const isReleasingDt = releasingId === `diet-${student.id}`;

                  return (
                    <div
                      key={student.id}
                      className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] hover:border-[#3A3A3F] transition-all space-y-4 shadow-xl"
                    >
                      {/* Card Header: Student Identity & Status Badges */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#2B2B2F]">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              student.avatar_url ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                            }
                            alt={student.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-[#D8B46A]/30 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-extrabold text-[#F5F5F7]">{student.name}</h3>
                              {student.nickname && (
                                <span className="text-xs font-bold text-[#D8B46A] bg-[#D8B46A]/10 px-2 py-0.5 rounded-full border border-[#D8B46A]/20">
                                  "{student.nickname}"
                                </span>
                              )}
                              <span className="text-[10px] font-black uppercase tracking-wider bg-[#2B2B2F] text-[#9B9BA1] px-2 py-0.5 rounded-md">
                                {student.plan || "Consultoria VIP"}
                              </span>
                            </div>
                            <p className="text-xs text-[#9B9BA1] mt-0.5">{student.email}</p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                              isWorkoutReleased
                                ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30"
                                : "bg-[#FF6A2A]/15 text-[#FF6A2A] border-[#FF6A2A]/30"
                            }`}
                          >
                            <Dumbbell className="w-3.5 h-3.5" />
                            <span>{isWorkoutReleased ? "Treino Liberado" : "Treino Travado"}</span>
                          </div>

                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                              isDietReleased
                                ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30"
                                : "bg-[#FF6A2A]/15 text-[#FF6A2A] border-[#FF6A2A]/30"
                            }`}
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>{isDietReleased ? "Dieta Liberada" : "Dieta Travada"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Anamnese Clinical Data Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-2xl bg-[#111113] border border-[#2B2B2F]/60">
                          <span className="text-[10px] uppercase font-bold text-[#9B9BA1] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#D8B46A]" /> Idade
                          </span>
                          <p className="text-sm font-black text-[#F5F5F7] mt-0.5">
                            {student.age ? `${student.age} anos` : "Não inf."}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-[#111113] border border-[#2B2B2F]/60">
                          <span className="text-[10px] uppercase font-bold text-[#9B9BA1] flex items-center gap-1">
                            <Scale className="w-3 h-3 text-[#34C759]" /> Peso Atual
                          </span>
                          <p className="text-sm font-black text-[#F5F5F7] mt-0.5">
                            {student.weight_kg ? `${student.weight_kg} kg` : "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-[#111113] border border-[#2B2B2F]/60">
                          <span className="text-[10px] uppercase font-bold text-[#9B9BA1] flex items-center gap-1">
                            <Target className="w-3 h-3 text-[#0A84FF]" /> Altura
                          </span>
                          <p className="text-sm font-black text-[#F5F5F7] mt-0.5">
                            {student.height_cm ? `${student.height_cm} cm` : "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-[#111113] border border-[#2B2B2F]/60">
                          <span className="text-[10px] uppercase font-bold text-[#9B9BA1] flex items-center gap-1">
                            <Flame className="w-3 h-3 text-[#FF6A2A]" /> Objetivo
                          </span>
                          <p
                            className="text-sm font-black text-[#F5F5F7] mt-0.5 truncate"
                            title={student.primary_goal || student.goal}
                          >
                            {student.primary_goal || student.goal || "Condicionamento Geral"}
                          </p>
                        </div>
                      </div>

                      {/* Dietary Restrictions and Medical History Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-[#111113] border border-[#2B2B2F]/80 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#D8B46A]">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>Restrições Alimentares / Alergias:</span>
                          </div>
                          <p className="text-xs text-[#E5E5E7] leading-relaxed">
                            {student.dietary_restrictions || student.restrictions || "Nenhuma restrição relatada"}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#111113] border border-[#2B2B2F]/80 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6A2A]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Histórico de Lesões / Observações Médicas:</span>
                          </div>
                          <p className="text-xs text-[#E5E5E7] leading-relaxed">
                            {student.medical_history || "Nenhum histórico de lesão ou condição prévia"}
                          </p>
                        </div>
                      </div>

                      {/* Coach Actions Toolbar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#2B2B2F]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Release Workout Button */}
                          <button
                            onClick={() => handleReleaseWorkout(student.id)}
                            disabled={isWorkoutReleased || isReleasingWk}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                              isWorkoutReleased
                                ? "bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/30 cursor-default"
                                : "bg-[#FF6A2A] hover:bg-[#E55A1D] text-white shadow-md shadow-[#FF6A2A]/20"
                            }`}
                          >
                            {isReleasingWk ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isWorkoutReleased ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Dumbbell className="w-3.5 h-3.5" />
                            )}
                            <span>{isWorkoutReleased ? "Treino Liberado" : "Liberar Treino"}</span>
                          </button>

                          {/* Release Diet Button */}
                          <button
                            onClick={() => handleReleaseDiet(student.id)}
                            disabled={isDietReleased || isReleasingDt}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                              isDietReleased
                                ? "bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/30 cursor-default"
                                : "bg-[#34C759] hover:bg-[#2EB04F] text-white shadow-md shadow-[#34C759]/20"
                            }`}
                          >
                            {isReleasingDt ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isDietReleased ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                            )}
                            <span>{isDietReleased ? "Dieta Liberada" : "Liberar Dieta"}</span>
                          </button>
                        </div>

                        {/* Shortcuts to Prescribe / Edit */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              handleSelectStudent(student);
                              setActiveTab("workouts");
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#202024] hover:bg-[#2B2B2F] text-[#F5F5F7] flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Dumbbell className="w-3 h-3 text-[#D8B46A]" />
                            <span>Editar Treino</span>
                          </button>
                          <button
                            onClick={() => {
                              handleSelectStudent(student);
                              setActiveTab("diet");
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#202024] hover:bg-[#2B2B2F] text-[#F5F5F7] flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <UtensilsCrossed className="w-3 h-3 text-[#34C759]" />
                            <span>Editar Dieta</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map((kpi, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col justify-between space-y-3"
              >
                <span className="text-xs font-semibold text-[#9B9BA1]">
                  {lang === "pt" ? kpi.label_pt : kpi.label_en}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-[#F5F5F7]">{kpi.value}</span>
                  <span className="text-xs font-bold text-[#34C759] bg-[#34C759]/15 px-2 py-0.5 rounded-md">
                    {kpi.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Shortcuts to Student Protocols */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F7]">Acesso Rápido a Protocolos de Alunos</h3>
                <p className="text-xs text-[#9B9BA1]">
                  Selecione um aluno para prescrever dietas e treinos potencializados por IA.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("diet")}
                className="text-xs font-bold text-[#D8B46A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ir para Dietas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.slice(0, 6).map((std) => (
                <div
                  key={std.id}
                  onClick={() => {
                    handleSelectStudent(std);
                    setActiveTab("diet");
                  }}
                  className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A]/50 transition-all cursor-pointer flex items-center gap-3 group"
                >
                  <img
                    src={std.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
                    alt={std.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#2B2B2F] group-hover:border-[#D8B46A]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-[#F5F5F7] truncate">{std.name}</h4>
                      <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/15 px-1.5 py-0.5 rounded">
                        {std.adherence_pct}% adesão
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9B9BA1] truncate">{std.goal}</p>
                    <span className="text-[10px] font-bold text-[#D8B46A]">{std.plan}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner: Convidar Alunos para Consultoria */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#D8B46A]/20 via-[#1D1D1F] to-[#151515] border border-[#D8B46A]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D8B46A] bg-[#D8B46A]/20 px-2.5 py-0.5 rounded-full border border-[#D8B46A]/40 inline-flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                <span>LINK DE CONSULTORIA</span>
              </span>
              <h3 className="text-base font-extrabold text-[#F5F5F7]">
                Convide novos alunos para a sua consultoria
              </h3>
              <p className="text-xs text-[#9B9BA1] max-w-xl">
                Gere um link exclusivo de convite. Quando a pessoa acessar, ela ingressará diretamente vinculada à sua consultoria, com cupom VIP e anamnese direcionada para você.
              </p>
            </div>

            <button
              onClick={() => setActiveTab("invite")}
              className="px-5 py-3 rounded-2xl text-xs font-extrabold bg-[#D8B46A] hover:bg-[#E2C382] text-[#0A0A0A] shrink-0 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D8B46A]/20"
            >
              <Link2 className="w-4 h-4" />
              <span>Gerar e Copiar Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Conversar com a IA (Metodologia do Coach) */}
      {activeTab === "ai_chat" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1A1A1E] via-[#151515] to-[#121214] border border-[#D8B46A]/30 space-y-4 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D8B46A]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#D8B46A] bg-[#D8B46A]/15 px-3 py-1 rounded-full border border-[#D8B46A]/30 inline-flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 fill-current" />
                  <span>ASSISTENTE TÉCNICO & BIOMECÂNICO</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
                  Conversar com a IA do Coach
                </h2>
                <p className="text-xs sm:text-sm text-[#9B9BA1] max-w-2xl leading-relaxed">
                  Defina a sua filosofia de treinamento, cadências, exercícios proibidos ou prioritários e regras alimentares.
                  A IA absorverá suas orientações e as aplicará automaticamente em todos os treinos e dietas gerados para seus alunos.
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1D1D1F] border border-[#34C759]/40 text-[#34C759] text-xs font-black shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-ping" />
                <span>IA Sincronizada com sua Metodologia</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Chat Console (7 cols) */}
            <div className="lg:col-span-7 space-y-4 flex flex-col">
              <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex-1 flex flex-col space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D8B46A] to-[#FFD580] flex items-center justify-center text-[#0A0A0A] font-black">
                      <Bot className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#F5F5F7]">Canal de Metodologia & Instruções</h4>
                      <p className="text-[10px] text-[#9B9BA1]">Diga o que a IA deve ou não prescrever</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#D8B46A] bg-[#D8B46A]/10 px-2.5 py-1 rounded-lg border border-[#D8B46A]/20">
                    Gemini Biomechanics
                  </span>
                </div>

                {/* Conversation List */}
                <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                  {coachAiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${
                        msg.sender === "coach" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                          msg.sender === "coach"
                            ? "bg-[#D8B46A] text-[#0A0A0A]"
                            : "bg-[#1D1D1F] border border-[#2B2B2F] text-[#D8B46A]"
                        }`}
                      >
                        {msg.sender === "coach" ? "C" : <Bot className="w-3.5 h-3.5 fill-current" />}
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                          msg.sender === "coach"
                            ? "bg-[#D8B46A] text-[#0A0A0A] font-semibold rounded-tr-none"
                            : "bg-[#1D1D1F] border border-[#2B2B2F] text-[#E5E5EA] rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <span
                          className={`text-[9px] block text-right font-medium ${
                            msg.sender === "coach" ? "text-[#0A0A0A]/70" : "text-[#6E6E73]"
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}

                  {coachAiSending && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center shrink-0 text-[#D8B46A]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#9B9BA1] flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D8B46A] animate-bounce" />
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D8B46A] animate-bounce delay-100" />
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D8B46A] animate-bounce delay-200" />
                        <span>Absorvendo diretrizes e atualizando regras biomecânicas...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="space-y-1.5 pt-2 border-t border-[#2B2B2F]/60">
                  <span className="text-[10px] font-bold text-[#9B9BA1] block">
                    Sugestões rápidas de diretriz:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Foco no Agora: Treino exclusivo para hoje, sem semana inteira",
                      "Variabilidade de Estímulos: Variar pegadas, ângulos e métodos de intensidade",
                      "Formatação Direta & Motivacional: Listar apenas o que executar na sessão",
                      "Priorizar exercícios multiarticulares e cadência excêntrica de 3s",
                      "Sempre incluir opções de substituição equivalentes de alimentos",
                    ].map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessageToAi(sug)}
                        disabled={coachAiSending}
                        className="text-[10px] font-semibold bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A] text-[#9B9BA1] hover:text-[#F5F5F7] px-2.5 py-1 rounded-lg transition-all text-left cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessageToAi();
                  }}
                  className="flex gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={coachAiInput}
                    onChange={(e) => setCoachAiInput(e.target.value)}
                    placeholder="Ex: 'Não quero agachamento livre com barra para iniciantes, prefira goblet squat ou hack...'"
                    className="flex-1 px-4 py-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#D8B46A]"
                  />
                  <button
                    type="submit"
                    disabled={coachAiSending || !coachAiInput.trim()}
                    className="px-5 py-3 rounded-2xl bg-[#D8B46A] hover:bg-[#E2C382] text-[#0A0A0A] font-extrabold text-xs flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer shrink-0 shadow-lg shadow-[#D8B46A]/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Active Methodology Guidelines & Rules (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#D8B46A]" />
                    <h3 className="text-xs font-black text-[#F5F5F7] uppercase tracking-wider">
                      Diretrizes Ativas da Sua Metodologia
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#D8B46A]/15 text-[#D8B46A] px-2.5 py-0.5 rounded-full border border-[#D8B46A]/30">
                    {activeGuidelines.length} regras ativas
                  </span>
                </div>

                <p className="text-[11px] text-[#9B9BA1] leading-relaxed">
                  Estas regras são injetadas diretamente nos algoritmos de IA de prescrição da VYRA toda vez que você gerar treinos ou dietas para seus alunos.
                </p>

                {/* Guidelines List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {activeGuidelines.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A]/40 flex items-start justify-between gap-3 transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-[#D8B46A]/15 text-[#D8B46A] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-[#D8B46A]/30">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-[#F5F5F7] leading-relaxed">{g}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveGuideline(idx)}
                        title="Remover diretriz"
                        className="text-[#9B9BA1] hover:text-[#FF453A] p-1 rounded-lg hover:bg-[#151515] transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Guideline Field */}
                <div className="pt-3 border-t border-[#2B2B2F]/60 space-y-2">
                  <label className="text-[10px] font-bold text-[#9B9BA1] block uppercase">
                    + Adicionar Nova Regra Manualmente
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomGuideline}
                      onChange={(e) => setNewCustomGuideline(e.target.value)}
                      placeholder="ex: 'Sempre prescrever 10 min de cardio pós-treino'"
                      className="flex-1 px-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#D8B46A]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomGuideline}
                      disabled={!newCustomGuideline.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#2B2B2F] hover:bg-[#D8B46A] hover:text-[#0A0A0A] text-xs font-bold text-[#F5F5F7] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Test Shortcut */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#D8B46A]/15 to-[#1D1D1F] border border-[#D8B46A]/30 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-[#D8B46A] block uppercase">
                      Testar na Prática
                    </span>
                    <p className="text-[11px] text-[#9B9BA1]">
                      Gere um treino para um aluno usando as regras acima.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("workouts");
                      setShowAiWorkoutModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#D8B46A] text-[#0A0A0A] font-black text-xs hover:brightness-110 flex items-center gap-1.5 shrink-0 shadow-md shadow-[#D8B46A]/20 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Gerar Treino</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Convidar Alunos (Consultoria) */}
      {activeTab === "invite" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1A1A1E] via-[#151515] to-[#121214] border border-[#D8B46A]/30 space-y-4 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D8B46A]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#D8B46A] bg-[#D8B46A]/15 px-3 py-1 rounded-full border border-[#D8B46A]/30 inline-flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>CONSULTORIA EXCLUSIVA & CAPTAÇÃO</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
                  Link de Convite para sua Consultoria
                </h2>
                <p className="text-xs sm:text-sm text-[#9B9BA1] max-w-2xl leading-relaxed">
                  Envie este link para as pessoas que você deseja que se tornem seus alunos. Ao entrarem por ele, elas serão automaticamente vinculadas ao seu painel para você prescrever treinos, dietas e acompanhar o progresso a cada 20 dias.
                </p>
              </div>

              {/* KPI Mini Badges */}
              <div className="flex gap-2 sm:flex-col shrink-0">
                <div className="px-3.5 py-2 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-center">
                  <span className="text-[10px] text-[#9B9BA1] font-bold block uppercase">Alunos Vinculados</span>
                  <span className="text-lg font-black text-[#D8B46A]">{students.length} Ativos</span>
                </div>
              </div>
            </div>

            {/* Generated Official Link Box */}
            <div className="p-4 rounded-2xl bg-[#0F0F11] border border-[#D8B46A]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-[#D8B46A]" />
                  <span>Seu Link Oficial de Convite de Alunos</span>
                </span>
                <span className="text-[10px] text-[#34C759] font-bold bg-[#34C759]/15 px-2 py-0.5 rounded-full border border-[#34C759]/30">
                  Pronto para Enviar
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 px-4 py-2.5 rounded-xl bg-[#18181B] border border-[#2B2B2F] text-xs font-mono text-[#D8B46A] truncate flex items-center">
                  {`${typeof window !== "undefined" ? window.location.origin : "https://vyra.club"}/?invite=consultoria&coach=${encodeURIComponent(
                    coachInviteName
                  )}`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const url = `${typeof window !== "undefined" ? window.location.origin : "https://vyra.club"}/?invite=consultoria&coach=${encodeURIComponent(
                        coachInviteName
                      )}`;
                      navigator.clipboard.writeText(url);
                      setInviteCopied(true);
                      showNotification("Link copiado para a área de transferência!");
                      setTimeout(() => setInviteCopied(false), 2500);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                      inviteCopied
                        ? "bg-[#34C759] text-black shadow-[#34C759]/20"
                        : "bg-[#D8B46A] hover:bg-[#E2C382] text-[#0A0A0A] shadow-[#D8B46A]/20"
                    }`}
                  >
                    {inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{inviteCopied ? "Link Copiado!" : "Copiar Link"}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `🔥 Olá! Quero te convidar para a minha Consultoria de Treino no Vyra Club!\n\n` +
                      `Vou montar sua periodização completa com execução em vídeo e acompanhar suas fotos e medidas a cada 20 dias.\n\n` +
                      `Acesse meu link exclusivo para iniciar:\n` +
                      `${typeof window !== "undefined" ? window.location.origin : "https://vyra.club"}/?invite=consultoria&coach=${encodeURIComponent(
                        coachInviteName
                      )}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#22bf5b] text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#25D366]/20"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      setInviteData({
                        active: true,
                        coachName: coachInviteName,
                        coachRole: "",
                        specialty: coachInviteSpecialty,
                        couponCode: "",
                      });
                      setActiveView("anamnesis");
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] hover:bg-[#2B2B2F] border border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
                    title="Ver como o aluno verá a anamnese"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#6D9BFF]" />
                    <span className="hidden sm:inline">Testar Fluxo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Customization Form & Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Customizer */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D8B46A]" />
                <h3 className="text-sm font-bold text-[#F5F5F7]">
                  Personalizar Informações do seu Convite
                </h3>
              </div>
              <p className="text-xs text-[#9B9BA1]">
                Estas informações aparecem no topo da página quando o futuro aluno clica no seu link.
              </p>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">
                    Seu Nome de Apresentação
                  </label>
                  <input
                    type="text"
                    value={coachInviteName}
                    onChange={(e) => setCoachInviteName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">
                    Especialidade Principal da Consultoria
                  </label>
                  <input
                    type="text"
                    value={coachInviteSpecialty}
                    onChange={(e) => setCoachInviteSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#9B9BA1] mb-1">
                    Mensagem de Boas-Vindas aos Novos Alunos
                  </label>
                  <textarea
                    rows={3}
                    value={coachInviteMessage}
                    onChange={(e) => setCoachInviteMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A] resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => showNotification("Configurações do convite salvas!")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] hover:bg-[#252528] border border-[#2B2B2F] text-[#F5F5F7] transition-colors"
                  >
                    Salvar Padrão
                  </button>
                </div>
              </div>
            </div>

            {/* Live Visual Preview of what Student sees */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9B9BA1]">
                    Pré-visualização do Aluno
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/30">
                    Modo Recepção VIP
                  </span>
                </div>

                {/* Simulated Invite Landing Card */}
                <div className="p-5 rounded-2xl bg-[#111113] border border-[#D8B46A]/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center font-bold text-lg border border-[#D8B46A]/40">
                      {coachInviteName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#D8B46A] uppercase block">
                        Convite de Consultoria
                      </span>
                      <h4 className="text-sm font-extrabold text-[#F5F5F7]">{coachInviteName}</h4>
                      {coachInviteSpecialty && (
                        <p className="text-[11px] text-[#9B9BA1]">{coachInviteSpecialty}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#E5E5EA] bg-[#1A1A1E] p-3 rounded-xl border border-[#2B2B2F] italic">
                    "{coachInviteMessage}"
                  </p>

                  <div className="space-y-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-2 text-[#9B9BA1]">
                      <Check className="w-3.5 h-3.5 text-[#34C759]" />
                      <span>Periodização completa de treinos com execução em vídeo</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#9B9BA1]">
                      <Check className="w-3.5 h-3.5 text-[#34C759]" />
                      <span>Acompanhamento físico e fotos a cada 20 dias</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#9B9BA1]">
                      <Check className="w-3.5 h-3.5 text-[#34C759]" />
                      <span>Comunicação e suporte direto pelo aplicativo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2B2B2F]">
                <p className="text-[11px] text-[#9B9BA1] text-center">
                  Ao clicar no seu link, o aluno é direcionado para a Anamnese inicial e já fica listado na sua aba de Alunos.
                </p>
              </div>
            </div>
          </div>

          {/* Students enrolled through your consulting */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D8B46A]" />
                  <span>Alunos Atuais da sua Consultoria ({students.length})</span>
                </h3>
                <p className="text-xs text-[#9B9BA1]">
                  Todos os atletas vinculados que você acompanha e prescreve.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("workouts")}
                className="text-xs font-bold text-[#D8B46A] hover:underline flex items-center gap-1"
              >
                <span>Prescrever Treinos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((std) => (
                <div
                  key={std.id}
                  className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={std.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
                      alt={std.name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#2B2B2F]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#F5F5F7]">{std.name}</h4>
                      <p className="text-[10px] text-[#9B9BA1]">{std.goal}</p>
                      <span className="text-[9px] font-bold text-[#D8B46A]">{std.plan}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        handleSelectStudent(std);
                        setActiveTab("workouts");
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#D8B46A]/15 text-[#D8B46A] hover:bg-[#D8B46A]/25 transition-colors text-center"
                    >
                      Treino
                    </button>
                    <button
                      onClick={() => {
                        handleSelectStudent(std);
                        setActiveTab("diet");
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#151515] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] transition-colors text-center"
                    >
                      Dieta
                    </button>
                    <button
                      type="button"
                      id={`invite-vip-toggle-${std.id}`}
                      onClick={() => handleToggleStudentVipChat(std.id)}
                      title={std.vip_chat_unlocked ? "Benefício VIP de Cores do Chat ativo. Clique para revogar." : "Conceder Benefício VIP de Cores do Chat"}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        std.vip_chat_unlocked
                          ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40"
                          : "bg-[#151515] text-[#9B9BA1] hover:text-[#FFD700] border border-[#2B2B2F]"
                      }`}
                    >
                      <Palette className="w-3 h-3" />
                      <span>{std.vip_chat_unlocked ? "VIP Chat" : "+ VIP"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Finance */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          {/* Módulo de Busca e Gestão de Alunos no Financeiro */}
          <FinanceCRMTableWeb />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coupon Management */}
            <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F7]">Cupons de Desconto</h3>

            <form onSubmit={handleCreateCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="CÓDIGO (ex: VYRA20)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs uppercase font-bold focus:outline-none focus:border-[#D8B46A]"
              />
              <input
                type="number"
                min="5"
                max="90"
                value={newCouponPct}
                onChange={(e) => setNewCouponPct(Number(e.target.value))}
                className="w-16 px-2 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-bold text-center focus:outline-none focus:border-[#D8B46A]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shrink-0 cursor-pointer"
              >
                Criar
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {coupons.map((cp) => (
                <div
                  key={cp.id}
                  className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-[#F5F5F7]">{cp.code}</span>
                    <span className="text-[10px] text-[#D8B46A] ml-2 font-bold">{cp.pct}% OFF</span>
                  </div>
                  <button
                    onClick={() => handleToggleCoupon(cp.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      cp.active
                        ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30"
                        : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
                    }`}
                  >
                    {cp.active ? "Ativo" : "Inativo"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Exempt Partners */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#F5F5F7]">Parceiros & Atletas Isentos</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FF6A2A]/15 text-[#FF9A62] border border-[#FF6A2A]/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  SELO VETERANO GARANTIDO
                </span>
              </div>
              <p className="text-xs text-[#9B9BA1]">
                Todos os parceiros cadastrados recebem Acesso VIP e o <strong>Selo de Veterano</strong> (laranja e dourado) ativo no perfil, no chat e na galeria.
              </p>
            </div>

            <form onSubmit={handleCreatePartner} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nome da marca ou atleta (ex: NutriFit)"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                className="w-full sm:w-1/3 px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A]"
              />
              <input
                type="email"
                required
                placeholder="email@parceiro.com"
                value={newPartnerEmail}
                onChange={(e) => setNewPartnerEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {partners.map((pt) => (
                <div
                  key={pt.id}
                  className="p-3.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#F5F5F7] truncate">
                          {pt.name || pt.email.split("@")[0]}
                        </span>
                        {/* Todos os parceiros têm o selo de veterano garantido */}
                        <VeteranBadge size="xs" />
                      </div>
                      <span className="text-[11px] text-[#9B9BA1] truncate block">{pt.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => handleTogglePartner(pt.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        pt.active
                          ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30"
                          : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
                      }`}
                    >
                      {pt.active ? "Acesso VIP Ativo" : "Revogado"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Tab: Workouts Editor with Student Filters, Library & Bulk Send */}
      {activeTab === "workouts" && (
        <div className="space-y-6">
          {/* Student Selector Toolbar with Search & Plan Filters */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D8B46A]">
                  PRESCRIÇÃO TÁTICA INDIVIDUAL OU COLETIVA
                </span>
                <h3 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
                  <span>Prescrição de Treino</span>
                  {selectedStudent && (
                    <span className="text-xs text-[#D8B46A] bg-[#D8B46A]/15 px-2.5 py-0.5 rounded-full border border-[#D8B46A]/30">
                      Aluno(a): {selectedStudent.name} ({selectedStudent.plan})
                    </span>
                  )}
                </h3>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="open-bulk-send-workout-btn"
                  onClick={() => handleOpenBulkSend()}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#FF6A2A]/15 text-[#FF9A62] border border-[#FF6A2A]/40 hover:bg-[#FF6A2A]/25 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Enviar este treino para múltiplos alunos selecionados"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar para Alunos...</span>
                </button>

                <button
                  id="save-to-library-toolbar-btn"
                  onClick={handleSaveCurrentToLibrary}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#D8B46A] border border-[#D8B46A]/40 hover:bg-[#D8B46A]/10 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Salvar este protocolo no acervo da biblioteca"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Salvar na Biblioteca</span>
                </button>

                <button
                  id="open-ai-workout-generator"
                  onClick={() => setShowAiWorkoutModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D8B46A] to-[#F1C40F] text-[#0A0A0A] hover:brightness-110 flex items-center gap-1.5 shadow-lg shadow-[#D8B46A]/20 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Gerar c/ IA</span>
                </button>

                <button
                  onClick={handleSaveWorkout}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] text-white hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FF6A2A]/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Treino</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar for Students */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[#2B2B2F]">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setWorkoutFilterPlan("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workoutFilterPlan === "all"
                      ? "bg-[#D8B46A] text-[#0A0A0A]"
                      : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-white"
                  }`}
                >
                  Todos ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkoutFilterPlan("shape")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    workoutFilterPlan === "shape"
                      ? "bg-pink-500/20 text-pink-400 border-pink-500"
                      : "bg-[#1D1D1F] text-[#9B9BA1] border-transparent hover:text-white"
                  }`}
                >
                  VYRA SHAPE
                </button>
                <button
                  type="button"
                  onClick={() => setWorkoutFilterPlan("forge")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    workoutFilterPlan === "forge"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500"
                      : "bg-[#1D1D1F] text-[#9B9BA1] border-transparent hover:text-white"
                  }`}
                >
                  VYRA FORGE
                </button>
                <button
                  type="button"
                  onClick={() => setWorkoutFilterPlan("reset")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    workoutFilterPlan === "reset"
                      ? "bg-[#D8B46A]/20 text-[#D8B46A] border-[#D8B46A]"
                      : "bg-[#1D1D1F] text-[#9B9BA1] border-transparent hover:text-white"
                  }`}
                >
                  RESET 12
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar aluno por nome ou objetivo..."
                  value={workoutSearchQuery}
                  onChange={(e) => setWorkoutSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                />
              </div>
            </div>

            {/* Student Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {students
                .filter((std) => {
                  const matchSearch =
                    std.name.toLowerCase().includes(workoutSearchQuery.toLowerCase()) ||
                    std.goal.toLowerCase().includes(workoutSearchQuery.toLowerCase()) ||
                    std.email.toLowerCase().includes(workoutSearchQuery.toLowerCase());
                  const matchPlan =
                    workoutFilterPlan === "all" ||
                    std.plan.toLowerCase().includes(workoutFilterPlan.toLowerCase());
                  return matchSearch && matchPlan;
                })
                .map((std) => {
                  const isSelected = std.id === selectedStudentId;
                  const isShape = std.plan.toLowerCase().includes("shape");
                  const isForge = std.plan.toLowerCase().includes("forge");
                  const planColor = isShape ? "border-pink-500/40 text-pink-400" : isForge ? "border-blue-500/40 text-blue-400" : "border-[#D8B46A]/40 text-[#D8B46A]";

                  return (
                    <button
                      key={std.id}
                      onClick={() => handleSelectStudent(std)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A] shadow-md shadow-[#D8B46A]/10"
                          : "bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] hover:text-[#F5F5F7]"
                      }`}
                    >
                      <img
                        src={std.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
                        alt={std.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{std.name}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${planColor}`}>
                        {std.plan.replace("VYRA ", "")}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Active Workout Form */}
          {workout && (
            <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A2A]">
                    PROTOCOLO EM EDIÇÃO · {selectedStudent ? selectedStudent.name : "GERAL"}
                  </span>
                  <h3 className="text-base font-bold text-[#F5F5F7]">{workout.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9B9BA1] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D8B46A]" />
                    {workout.duration_min} min
                  </span>
                  <span className="text-xs text-[#9B9BA1] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#FF6A2A]" />
                    {workout.intensity}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Dia / Rótulo</label>
                  <input
                    type="text"
                    value={workout.day_label}
                    onChange={(e) => setWorkout({ ...workout, day_label: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-semibold focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Título do Treino</label>
                  <input
                    type="text"
                    value={workout.title}
                    onChange={(e) => setWorkout({ ...workout, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-semibold focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9B9BA1] mb-1">Foco / Divisão</label>
                  <input
                    type="text"
                    value={workout.focus}
                    onChange={(e) => setWorkout({ ...workout, focus: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-semibold focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Nota e Instrução Tática Geral do Treino
                </label>
                <textarea
                  rows={2}
                  value={workout.coach_note}
                  onChange={(e) => setWorkout({ ...workout, coach_note: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A]"
                />
              </div>

              {/* Exercises List in Workout */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                    Exercícios Prescritos ({workout.exercises?.length || 0}) — Edição Tática
                  </h4>
                  <span className="text-[11px] text-[#9B9BA1]">
                    Altere séries, repetições, descanso ou substitua exercícios diretamente.
                  </span>
                </div>

                <div className="space-y-3">
                  {workout.exercises?.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-3 hover:border-[#3E3E42] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#2B2B2F] text-[#D8B46A] text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
                              <span>{ex.name}</span>
                              {ex.substitute_exercise && (
                                <span className="text-[10px] bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 px-2 py-0.5 rounded-full font-bold">
                                  Substituto: {ex.substitute_exercise}
                                </span>
                              )}
                            </h5>
                            <span className="text-[11px] text-[#9B9BA1]">{ex.muscle} · {ex.coach_tip}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSubstituteModalIdx(idx)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/30 hover:bg-[#D8B46A]/25 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Substituir Exercício</span>
                        </button>
                      </div>

                      {/* Editable Series, Reps, Rest */}
                      <div className="grid grid-cols-3 gap-2.5 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-[#9B9BA1] block mb-1 uppercase">Séries</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={ex.sets}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              const updated = [...(workout.exercises || [])];
                              updated[idx] = { ...updated[idx], sets: val };
                              setWorkout({ ...workout, exercises: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] font-bold text-center focus:border-[#D8B46A]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#9B9BA1] block mb-1 uppercase">Repetições</label>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) => {
                              const updated = [...(workout.exercises || [])];
                              updated[idx] = { ...updated[idx], reps: e.target.value };
                              setWorkout({ ...workout, exercises: updated });
                            }}
                            placeholder="ex: 10-12 ou Falha"
                            className="w-full px-3 py-1.5 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] font-bold text-center focus:border-[#D8B46A]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#9B9BA1] block mb-1 uppercase">Descanso</label>
                          <input
                            type="text"
                            value={ex.rest}
                            onChange={(e) => {
                              const updated = [...(workout.exercises || [])];
                              updated[idx] = { ...updated[idx], rest: e.target.value };
                              setWorkout({ ...workout, exercises: updated });
                            }}
                            placeholder="ex: 60s ou 90s"
                            className="w-full px-3 py-1.5 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] font-bold text-center focus:border-[#D8B46A]"
                          />
                        </div>
                      </div>

                      {/* Recado do Coach no Exercício */}
                      <div>
                        <label className="text-[10px] font-bold text-[#D8B46A] block mb-1 uppercase">
                          Recado do Coach no Exercício (Dica Tática ou Ajuste Personalizado)
                        </label>
                        <input
                          type="text"
                          value={ex.coach_message || ""}
                          onChange={(e) => {
                            const updated = [...(workout.exercises || [])];
                            updated[idx] = { ...updated[idx], coach_message: e.target.value };
                            setWorkout({ ...workout, exercises: updated });
                          }}
                          placeholder="ex: 'Segure 2s no ponto zero de contração e controle a descida!'..."
                          className="w-full px-3 py-1.5 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:border-[#D8B46A]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Workout Library */}
      {activeTab === "library" && (
        <CoachWorkoutLibrary
          library={workoutLibrary}
          onLoadWorkout={handleLoadWorkoutFromLibrary}
          onOpenBulkSend={handleOpenBulkSend}
          onDeleteWorkout={handleDeleteFromLibrary}
          onSaveCurrentToLibrary={handleSaveCurrentToLibrary}
          currentWorkoutTitle={workout?.title}
        />
      )}

      {/* Tab: Diet Editor with Student Lookup & AI Diet Generator */}
      {activeTab === "diet" && (
        <div className="space-y-6">
          {/* Student Search and Selection Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D8B46A]">
                  PROCURA DE ALUNO & PRESCRIÇÃO NUTRICIONAL
                </span>
                <h3 className="text-base font-bold text-[#F5F5F7]">
                  Prescrever / Ajustar Dieta por Aluno
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="open-ai-diet-generator"
                  onClick={() => setShowAiDietModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D8B46A] to-[#F1C40F] text-[#0A0A0A] hover:brightness-110 flex items-center gap-1.5 shadow-lg shadow-[#D8B46A]/20 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Gerar Dieta com IA</span>
                </button>
                <button
                  onClick={handleSaveDiet}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] text-white hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dieta</span>
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="student-search-input"
                placeholder="Buscar aluno por nome, apelido, email ou objetivo... (ex: Rafael, Camila, Cutting)"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs placeholder-[#6E6E73] focus:outline-none focus:border-[#D8B46A]"
              />
            </div>

            {/* Quick Students Selector List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredStudents.map((std) => {
                const isSelected = std.id === selectedStudentId;
                return (
                  <div
                    key={std.id}
                    id={`student-card-${std.id}`}
                    onClick={() => handleSelectStudent(std)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? "bg-[#D8B46A]/10 border-[#D8B46A] ring-1 ring-[#D8B46A]/30"
                        : "bg-[#1D1D1F] border-[#2B2B2F] hover:border-[#3E3E42]"
                    }`}
                  >
                    <img
                      src={std.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
                      alt={std.name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#2B2B2F] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#F5F5F7] truncate">{std.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#D8B46A] shrink-0 animate-ping" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#9B9BA1] truncate">{std.goal}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-[#D8B46A]">
                        <span>{std.weight_kg} kg</span>
                        <span>·</span>
                        <span>{std.height_cm} cm</span>
                        <span>·</span>
                        <span>{std.plan}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Student Active Profile Box */}
          {selectedStudent && (
            <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedStudent.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
                  alt={selectedStudent.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-[#D8B46A]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-[#F5F5F7]">{selectedStudent.name}</h4>
                    <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/15 px-2 py-0.5 rounded-full border border-[#34C759]/30">
                      {selectedStudent.adherence_pct}% adesão
                    </span>
                  </div>
                  <p className="text-xs text-[#9B9BA1]">{selectedStudent.email} · {selectedStudent.plan}</p>
                  <p className="text-xs font-bold text-[#D8B46A] mt-0.5">
                    Meta: {selectedStudent.goal} · Restrição: {selectedStudent.restrictions || "Nenhuma"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#1D1D1F] p-3 rounded-2xl border border-[#2B2B2F]">
                <div className="text-center px-2">
                  <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">PESO</span>
                  <span className="text-xs font-black text-[#F5F5F7]">{selectedStudent.weight_kg} kg</span>
                </div>
                <div className="w-px h-6 bg-[#2B2B2F]" />
                <div className="text-center px-2">
                  <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">ALTURA</span>
                  <span className="text-xs font-black text-[#F5F5F7]">{selectedStudent.height_cm} cm</span>
                </div>
                <div className="w-px h-6 bg-[#2B2B2F]" />
                <div className="text-center px-2">
                  <span className="text-[9px] text-[#9B9BA1] uppercase font-bold block">CINTURA</span>
                  <span className="text-xs font-black text-[#F5F5F7]">{selectedStudent.waist_cm || "--"} cm</span>
                </div>
              </div>
            </div>
          )}

          {/* Hydration, Creatine Protocol & VIP Chat Colors for Selected Student */}
          {selectedStudent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Prescrição de Hidratação & Creatina */}
              <div className="p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#2B2B2F]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#6D9BFF]/20 text-[#6D9BFF] flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#F5F5F7]">
                        Prescrição de Hidratação & Creatina
                      </h4>
                      <p className="text-[10px] text-[#9B9BA1]">
                        Para {selectedStudent.name} (exibido na tela Início do aluno)
                      </p>
                    </div>
                  </div>

                  <button
                    id="save-protocol-btn"
                    onClick={handleSaveStudentProtocol}
                    disabled={savingProtocol}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#6D9BFF] text-black hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#6D9BFF]/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingProtocol ? "Salvando..." : "Salvar Prescrição"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Water Target */}
                  <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#6D9BFF] flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>Meta de Água Diária</span>
                      </label>
                      <span className="text-xs font-black text-[#F5F5F7]">
                        {studentWaterTarget} ml
                      </span>
                    </div>

                    <input
                      id="coach-water-target-input"
                      type="number"
                      step="100"
                      min="1000"
                      max="6000"
                      value={studentWaterTarget}
                      onChange={(e) => setStudentWaterTarget(parseInt(e.target.value) || 2500)}
                      className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] focus:outline-none focus:border-[#6D9BFF]"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[2000, 2500, 3000, 3500, 4000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setStudentWaterTarget(preset)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                            studentWaterTarget === preset
                              ? "bg-[#6D9BFF] text-black"
                              : "bg-[#121214] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
                          }`}
                        >
                          {preset}ml
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Creatine Dose */}
                  <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#D8B46A] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Dose de Creatina</span>
                      </label>
                      <span className="text-xs font-black text-[#F5F5F7]">
                        {studentCreatineDose}g / dose
                      </span>
                    </div>

                    <input
                      id="coach-creatine-dose-input"
                      type="number"
                      step="0.5"
                      min="1"
                      max="20"
                      value={studentCreatineDose}
                      onChange={(e) => setStudentCreatineDose(parseFloat(e.target.value) || 5)}
                      className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[3, 5, 7, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setStudentCreatineDose(preset)}
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                            studentCreatineDose === preset
                              ? "bg-[#D8B46A] text-black"
                              : "bg-[#121214] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
                          }`}
                        >
                          {preset}g
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-[#9B9BA1] bg-[#1D1D1F] p-2.5 rounded-xl border border-[#2B2B2F] flex items-center gap-2">
                  <span className="text-[#D8B46A] font-bold">ℹ Regra Padrão:</span>
                  <span>Caso você não altere, o aluno tem meta automática de <strong>2500 ml</strong> de água e <strong>5g</strong> de creatina.</span>
                </p>
              </div>

              {/* Concessão de Benefício VIP de Cores do Chat Global */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1808] via-[#151515] to-[#121214] border border-[#FFD700]/40 space-y-3 flex flex-col justify-between shadow-lg shadow-[#FFD700]/5">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#2B2B2F]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#F5F5F7]">
                          Personalização VIP de Cores do Chat
                        </h4>
                        <span className="text-[9px] text-[#FFD700] font-black uppercase tracking-wider">
                          Benefício Exclusivo do Aluno
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        selectedStudent.vip_chat_unlocked
                          ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30"
                          : "bg-[#9B9BA1]/10 text-[#9B9BA1] border-[#2B2B2F]"
                      }`}
                    >
                      {selectedStudent.vip_chat_unlocked ? "VIP ATIVO" : "BLOQUEADO"}
                    </span>
                  </div>

                  <p className="text-xs text-[#9B9BA1] mt-3 leading-relaxed">
                    Permite que <strong className="text-[#F5F5F7]">{selectedStudent.name}</strong> personalize a cor do nome e do texto das mensagens no Chat da Comunidade Global. Você como Coach pode conceder esse benefício especial a qualquer momento.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    id={`toggle-vip-chat-btn-${selectedStudent.id}`}
                    type="button"
                    onClick={() => handleToggleStudentVipChat(selectedStudent.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      selectedStudent.vip_chat_unlocked
                        ? "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 hover:bg-[#FF453A]/25"
                        : "bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-black hover:brightness-110 shadow-[#FFD700]/20 active:scale-95"
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span>
                      {selectedStudent.vip_chat_unlocked
                        ? `Revogar Benefício VIP de ${selectedStudent.name}`
                        : `Conceder Benefício VIP de Cores para ${selectedStudent.name}`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Diet Macronutrients and Meals Table */}
          {diet && (
            <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2B2B2F]">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F5F7]">
                    Divisão de Macronutrientes & Calorias
                  </h3>
                  <p className="text-xs text-[#9B9BA1]">
                    Ajuste fino dos percentuais de macros para {selectedStudent?.name || "o aluno"}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#9B9BA1]">Meta Calórica:</label>
                  <div className="flex items-center gap-1.5 bg-[#1D1D1F] px-3 py-1.5 rounded-xl border border-[#2B2B2F] focus-within:border-[#FF6A2A]">
                    <input
                      type="number"
                      step="50"
                      min="1000"
                      max="6000"
                      value={diet.kcal || 2400}
                      onChange={(e) => setDiet({ ...diet, kcal: parseInt(e.target.value) || 2000 })}
                      className="w-16 bg-transparent text-xs font-black text-[#F5F5F7] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#9B9BA1]">kcal / dia</span>
                  </div>
                </div>
              </div>

              {/* Macro Sliders / Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#FF6A2A]">Proteína</label>
                    <span className="text-xs font-black text-[#FF6A2A]">{diet.protein_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={diet.protein_pct}
                    onChange={(e) => setDiet({ ...diet, protein_pct: parseInt(e.target.value) || 35 })}
                    className="w-full accent-[#FF6A2A]"
                  />
                  <span className="text-[10px] text-[#9B9BA1] block mt-1 font-medium">
                    ~{Math.round(((diet.kcal || 2400) * (diet.protein_pct / 100)) / 4)}g de proteína
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#D8B46A]">Carboidratos</label>
                    <span className="text-xs font-black text-[#D8B46A]">{diet.carbs_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="65"
                    value={diet.carbs_pct}
                    onChange={(e) => setDiet({ ...diet, carbs_pct: parseInt(e.target.value) || 45 })}
                    className="w-full accent-[#D8B46A]"
                  />
                  <span className="text-[10px] text-[#9B9BA1] block mt-1 font-medium">
                    ~{Math.round(((diet.kcal || 2400) * (diet.carbs_pct / 100)) / 4)}g de carboidratos
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#6D9BFF]">Gorduras</label>
                    <span className="text-xs font-black text-[#6D9BFF]">{diet.fats_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    value={diet.fats_pct}
                    onChange={(e) => setDiet({ ...diet, fats_pct: parseInt(e.target.value) || 20 })}
                    className="w-full accent-[#6D9BFF]"
                  />
                  <span className="text-[10px] text-[#9B9BA1] block mt-1 font-medium">
                    ~{Math.round(((diet.kcal || 2400) * (diet.fats_pct / 100)) / 9)}g de lipídios
                  </span>
                </div>
              </div>

              {/* Botão de Destaque: Salvar e Atualizar Dieta do Aluno */}
              <div className="pt-2">
                <button
                  id="save-and-update-diet-btn"
                  type="button"
                  disabled={savingMacros}
                  onClick={handleSaveMacrosAndDiet}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 shadow-lg cursor-pointer ${
                    savingMacros
                      ? "bg-[#2B2B2F] text-[#9B9BA1] cursor-not-allowed"
                      : "bg-gradient-to-r from-[#FF6A2A] via-[#FF8A48] to-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shadow-[#FF6A2A]/20"
                  }`}
                >
                  {savingMacros ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#9B9BA1] border-t-transparent rounded-full animate-spin" />
                      <span>Atualizando protocolo...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar e Atualizar Dieta do Aluno</span>
                    </>
                  )}
                </button>

                {/* Alerta de Sucesso */}
                {macroSuccessMessage && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-[#34C759]/15 border border-[#34C759]/40 text-[#34C759] text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{macroSuccessMessage}</span>
                  </div>
                )}

                {/* Alerta de Erro */}
                {macroErrorMessage && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/40 text-[#FF453A] text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{macroErrorMessage}</span>
                  </div>
                )}
              </div>

              {/* Preset Foods Quick Selector */}
              <div className="pt-2 border-t border-[#2B2B2F]">
                <CoachDietFoodPresets onSelectPreset={handleSelectPresetFood} />
              </div>

              {/* Meals Structure List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                    Refeições Prescritas ({diet.foods?.length || 0})
                  </h4>
                  <button
                    onClick={() => setShowAddFoodForm(!showAddFoodForm)}
                    className="text-xs font-bold text-[#D8B46A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Alimento / Refeição Personalizado</span>
                  </button>
                </div>

                {/* Add Food Form */}
                {showAddFoodForm && (
                  <form
                    onSubmit={handleAddFoodToDiet}
                    className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#D8B46A]/50 space-y-3 animate-in zoom-in-95"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-[#9B9BA1] block mb-1">
                          Nome do Prato / Alimento
                        </label>
                        <input
                          type="text"
                          placeholder="ex: Filé de frango com arroz e brócolis"
                          value={newFoodName}
                          onChange={(e) => setNewFoodName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#9B9BA1] block mb-1">
                          Refeição
                        </label>
                        <select
                          value={newFoodMeal}
                          onChange={(e) => setNewFoodMeal(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                        >
                          <option value="breakfast">Café da Manhã</option>
                          <option value="lunch">Almoço</option>
                          <option value="snack">Lanche da Tarde</option>
                          <option value="dinner">Jantar</option>
                          <option value="supper">Ceia</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#9B9BA1] block mb-1">Gramas (g)</label>
                        <input
                          type="number"
                          value={newFoodGrams}
                          onChange={(e) => setNewFoodGrams(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#FF6A2A] block mb-1">Prot (g)</label>
                        <input
                          type="number"
                          value={newFoodProtein}
                          onChange={(e) => setNewFoodProtein(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#D8B46A] block mb-1">Carb (g)</label>
                        <input
                          type="number"
                          value={newFoodCarbs}
                          onChange={(e) => setNewFoodCarbs(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#6D9BFF] block mb-1">Gord (g)</label>
                        <input
                          type="number"
                          value={newFoodFats}
                          onChange={(e) => setNewFoodFats(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-[#151515] border border-[#2B2B2F] text-xs text-[#F5F5F7] text-center"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddFoodForm(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#9B9BA1] hover:bg-[#151515] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 cursor-pointer"
                      >
                        Salvar Item
                      </button>
                    </div>
                  </form>
                )}

                {/* Meals Cards */}
                <div className="space-y-3">
                  {diet.foods?.map((food) => (
                    <div
                      key={food.id}
                      className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-2 hover:border-[#3E3E42] transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-black uppercase text-[#D8B46A] bg-[#D8B46A]/10 px-2 py-0.5 rounded-md border border-[#D8B46A]/20">
                            {mealLabels[food.meal] || food.meal}
                          </span>
                          <h5 className="text-xs font-bold text-[#F5F5F7] mt-1">{food.name}</h5>
                          <span className="text-[10px] text-[#9B9BA1]">{food.grams}g · {food.kcal} kcal</span>
                        </div>

                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className="text-[11px] font-bold text-[#FF6A2A] bg-[#FF6A2A]/10 px-2 py-1 rounded-lg">
                            {food.p}g P
                          </span>
                          <span className="text-[11px] font-bold text-[#D8B46A] bg-[#D8B46A]/10 px-2 py-1 rounded-lg">
                            {food.c}g C
                          </span>
                          <span className="text-[11px] font-bold text-[#6D9BFF] bg-[#6D9BFF]/10 px-2 py-1 rounded-lg">
                            {food.f}g G
                          </span>
                          <button
                            onClick={() => handleRemoveFoodFromDiet(food.id)}
                            title="Remover alimento"
                            className="p-1.5 rounded-lg text-[#9B9BA1] hover:text-[#FF453A] hover:bg-[#151515] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Substitutions / Options for food */}
                      <div className="pt-2 border-t border-[#2B2B2F]/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#D8B46A]">
                            Opções de Substituição ({food.options?.length || 0}):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddFoodOptionModal(food.id)}
                            className="text-[10px] text-[#9B9BA1] hover:text-[#D8B46A] flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar Opção de Troca</span>
                          </button>
                        </div>
                        {food.options && food.options.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {food.options.map((opt, optIdx) => (
                              <span
                                key={optIdx}
                                className="text-[10px] bg-[#151515] border border-[#2B2B2F] px-2.5 py-1 rounded-lg text-[#F5F5F7] flex items-center gap-2"
                              >
                                <span>{opt}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFoodOption(food.id, optIdx)}
                                  className="text-[#9B9BA1] hover:text-[#FF453A] font-black text-xs"
                                  title="Remover opção"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#6E6E73] italic">
                            Nenhuma opção cadastrada (o aluno verá apenas este prato padrão).
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Radar */}
      {activeTab === "radar" && (
        <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7]">{t("coach.radar")}</h3>
              <p className="text-xs text-[#9B9BA1]">
                Identificação precoce de alunos com risco de churn ou faltas consecutivas.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {radar.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      alert.severity === "crit"
                        ? "bg-[#FF453A]/20 text-[#FF453A]"
                        : alert.severity === "warn"
                        ? "bg-[#FF9F0A]/20 text-[#FF9F0A]"
                        : "bg-[#6D9BFF]/20 text-[#6D9BFF]"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F5F5F7]">{alert.student}</h4>
                    <p className="text-[11px] text-[#9B9BA1]">{alert.status}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const matched = students.find((s) => s.name.includes(alert.student.split(" ")[0]));
                    if (matched) {
                      handleSelectStudent(matched);
                      setActiveTab("diet");
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/30 hover:bg-[#D8B46A] hover:text-[#0A0A0A] transition-all cursor-pointer"
                >
                  Abrir Ficha
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Broadcast */}
      {activeTab === "broadcast" && (
        <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7]">{t("coach.broadcast")}</h3>
              <p className="text-xs text-[#9B9BA1]">
                Envie alertas que aparecem no topo do feed e na barra de notificações de todos os alunos.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                Nome do Coach / Emissor
              </label>
              <input
                type="text"
                value={broadcastAuthor}
                onChange={(e) => setBroadcastAuthor(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs font-semibold focus:outline-none focus:border-[#D8B46A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                Mensagem de Transmissão (Push Notification)
              </label>
              <textarea
                rows={3}
                placeholder="ex: Galera, hidratação de hoje: 3 litros no mínimo! Treino de pernas liberado no app."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A]"
                required
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FF6A2A] text-white hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#FF6A2A]/20"
            >
              <Megaphone className="w-4 h-4" />
              <span>Disparar Notificação para Todos</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab: Challenges & Voting Management */}
      {activeTab === "challenges" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status Header Banner */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#D8B46A]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                  evtStatus === "active"
                    ? "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30"
                    : evtStatus === "loading"
                    ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30"
                    : "bg-[#AF52DE]/15 text-[#AF52DE] border-[#AF52DE]/30"
                }`}>
                  {evtStatus === "active"
                    ? "🟢 Votação Aberta ao Público"
                    : evtStatus === "loading"
                    ? "🟡 Status de Aguardo (Desafio Carregando...)"
                    : "🟣 Desafio Encerrado & Campeã Coroada"}
                </span>
                <span className="text-xs text-[#9B9BA1]">
                  Término: {evtEndDate ? new Date(evtEndDate).toLocaleDateString("pt-BR") : "A definir"}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#F5F5F7] mt-1.5 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#D8B46A]" />
                <span>{evtTitle || "Desafio Oficial Vyra"}</span>
              </h3>
              <p className="text-xs text-[#9B9BA1] mt-0.5 max-w-xl">
                Configure os textos, regras, datas e controle antifraude de votos para as alunas do app.
              </p>
            </div>

            {/* Quick Status Pill Switcher */}
            <div className="flex items-center gap-2 self-stretch md:self-auto bg-[#1D1D1F] p-1.5 rounded-2xl border border-[#2B2B2F]">
              <button
                type="button"
                onClick={() => setEvtStatus("loading")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  evtStatus === "loading"
                    ? "bg-[#FF9F0A] text-black shadow-md"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                Aguardando
              </button>
              <button
                type="button"
                onClick={() => setEvtStatus("active")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  evtStatus === "active"
                    ? "bg-[#34C759] text-black shadow-md"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() => setEvtStatus("closed")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  evtStatus === "closed"
                    ? "bg-[#AF52DE] text-white shadow-md"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                Encerrado
              </button>
            </div>
          </div>

          {/* Champion Crowned Alert (if exists) */}
          {challengeEvent?.champion && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#D8B46A]/20 via-[#151515] to-[#151515] border border-[#D8B46A] flex flex-col sm:flex-row items-center gap-4 shadow-2xl animate-in zoom-in-95">
              <img
                src={challengeEvent.champion.photo || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"}
                alt={challengeEvent.champion.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#D8B46A] shadow-md shadow-[#D8B46A]/20 shrink-0"
              />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-[#D8B46A] uppercase">
                  <Trophy className="w-4 h-4" />
                  <span>CAMPEÃ OFICIAL COROADA · HALL DA FAMA</span>
                </div>
                <h4 className="text-xl font-black text-[#F5F5F7] mt-0.5">
                  {challengeEvent.champion.name}
                </h4>
                <p className="text-xs text-[#9B9BA1] mt-0.5">
                  Vitória conquistada com {challengeEvent.champion.votes} votos auditados pela comunidade!
                </p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-[#D8B46A]/15 border border-[#D8B46A]/40 text-[#D8B46A] text-xs font-black shrink-0">
                1º LUGAR NO RANKING
              </div>
            </div>
          )}

          {/* Action to Crown Champion & Freeze */}
          <div className="p-5 rounded-3xl bg-[#1E1A11] border border-[#D8B46A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-[#F5F5F7] flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D8B46A]" />
                <span>Gamificação & Coroação Automatizada</span>
              </h4>
              <p className="text-xs text-[#9B9BA1] max-w-lg">
                Ao congelar, o back-end bloqueia novos votos, calcula a classificação pelo maior número de votos auditados e elege a campeã no Hall da Fama.
              </p>
            </div>
            <button
              type="button"
              id="freeze-and-crown-btn"
              onClick={handleCrownChampion}
              disabled={crowningLoading}
              className="px-5 py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-[#D8B46A] to-[#FFD580] text-[#0A0A0A] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-[#D8B46A]/20 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {crowningLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditando e Coroando...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  <span>Congelar Votação e Coroar Campeã</span>
                </>
              )}
            </button>
          </div>

          {/* Challenge Configuration Form */}
          <form onSubmit={handleSaveChallengeEvent} className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-5 shadow-xl">
            <h4 className="text-xs font-bold text-[#9B9BA1] uppercase tracking-wider pb-3 border-b border-[#2B2B2F]">
              Edição Dinâmica do Desafio (Textos, Títulos e Regras)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Título do Desafio *
                </label>
                <input
                  type="text"
                  required
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                  placeholder="Ex: DESAFIO CORPO & MENTE VYRA - 12 SEMANAS"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Data de Início do Desafio *
                </label>
                <input
                  type="date"
                  required
                  value={evtStartDate}
                  onChange={(e) => setEvtStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Data de Término (Congelamento Automático) *
                </label>
                <input
                  type="date"
                  required
                  value={evtEndDate}
                  onChange={(e) => setEvtEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                Subtítulo / Chamada Motivacional
              </label>
              <input
                type="text"
                value={evtSubtitle}
                onChange={(e) => setEvtSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                placeholder="Ex: 12 semanas de foco absoluto, hipertrofia feminina e queima acelerada."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                Premiação Oficial
              </label>
              <input
                type="text"
                value={evtPrize}
                onChange={(e) => setEvtPrize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                placeholder="Ex: 👑 Troféu Oficial Vyra + 1 Ano de Consultoria Grátis + Kit Completo de Suplementos"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                Regras e Critérios Oficiais de Avaliação
              </label>
              <textarea
                rows={4}
                value={evtRules}
                onChange={(e) => setEvtRules(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-normal text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                placeholder="1. Fotos de corpo inteiro frente e costas com a mesma iluminação.&#10;2. Envio de peso inicial e final.&#10;3. Trava antifraude: 1 voto por IP na comunidade."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingChallenge}
                className="px-6 py-3 rounded-2xl font-black text-xs bg-[#D8B46A] text-black hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[#D8B46A]/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingChallenge ? "Salvando..." : "Salvar Configurações do Desafio"}</span>
              </button>
            </div>
          </form>

          {/* Participant Submissions & IP Audit Ranking */}
          <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div>
                <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D8B46A]" />
                  <span>Ranking Parcial das Alunas ({challengeSubmissions.length} participantes)</span>
                </h4>
                <p className="text-[11px] text-[#9B9BA1] mt-0.5">
                  Votos computados com checagem antifraude por endereço de IP único.
                </p>
              </div>
            </div>

            {challengeSubmissions.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#9B9BA1]">
                Nenhuma aluna enviou fotos para este desafio ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {challengeSubmissions
                  .slice()
                  .sort((a, b) => b.likes - a.likes)
                  .map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? "bg-[#D8B46A] text-black"
                            : idx === 1
                            ? "bg-[#C0C0C0] text-black"
                            : idx === 2
                            ? "bg-[#CD7F32] text-white"
                            : "bg-[#2B2B2F] text-[#9B9BA1]"
                        }`}>
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <img
                            src={sub.after_image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80"}
                            alt={sub.author}
                            className="w-12 h-12 rounded-xl object-cover border border-[#2B2B2F]"
                          />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[#F5F5F7]">{sub.author}</h5>
                          <p className="text-[11px] text-[#9B9BA1] truncate max-w-xs">{sub.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                              {sub.tag}
                            </span>
                            <span className="text-[10px] text-[#9B9BA1]">{sub.weeks} semanas</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <span className="text-base font-black text-[#D8B46A] block">
                            {sub.likes} votos
                          </span>
                          <span className="text-[10px] text-[#34C759] font-semibold">
                            IPs Validados
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Workout Generator Modal */}
      {showAiWorkoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151515] border border-[#D8B46A]/50 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#D8B46A]">
                    VYRA AI COACH PROTOCOL
                  </span>
                  <h3 className="text-base font-bold text-[#F5F5F7]">
                    Gerar Treino de Alta Performance
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowAiWorkoutModal(false)}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#9B9BA1] mb-1">Aluno Alvo</label>
                <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#D8B46A]" />
                  <span>{selectedStudent ? `${selectedStudent.name} (${selectedStudent.goal})` : "Atleta Geral"}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#9B9BA1] mb-1">Divisão / Agrupamento Muscular</label>
                <select
                  value={aiWorkoutSplit}
                  onChange={(e) => setAiWorkoutSplit(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                >
                  <option value="Push (Peito, Ombro e Tríceps)">Push (Peito, Ombro e Tríceps)</option>
                  <option value="Pull (Costas, Trapézio e Bíceps)">Pull (Costas, Trapézio e Bíceps)</option>
                  <option value="Legs (Quadríceps, Glúteos e Posterior)">Legs (Quadríceps, Glúteos e Posterior)</option>
                  <option value="Upper Body (Tronco Superior Completo)">Upper Body (Tronco Superior Completo)</option>
                  <option value="Full Body Metcon (Condicionamento & Força)">Full Body Metcon (Condicionamento & Força)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#9B9BA1] mb-1">Data de Início / Referência</label>
                  <input
                    type="date"
                    value={aiWorkoutDate}
                    onChange={(e) => setAiWorkoutDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#9B9BA1] mb-1">Modo de Prescrição</label>
                  <select
                    value={aiWorkoutMode}
                    onChange={(e) => setAiWorkoutMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                  >
                    <option value="single_day">Treino Diário Único</option>
                    <option value="weekly_split">Semana Completa (Split Variado)</option>
                    <option value="multi_week_periodization">Periodização por Semanas</option>
                  </select>
                </div>
              </div>

              {aiWorkoutMode === "multi_week_periodization" && (
                <div>
                  <label className="block font-bold text-[#9B9BA1] mb-1">Duração do Ciclo (Semanas)</label>
                  <select
                    value={aiWorkoutWeeks}
                    onChange={(e) => setAiWorkoutWeeks(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                  >
                    <option value={4}>4 Semanas (Mesociclo de Choque / Acumulação)</option>
                    <option value={8}>8 Semanas (Progressão Ondulatória)</option>
                    <option value={12}>12 Semanas (Periodização Completa Vyra)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#9B9BA1] mb-1">Nível de Treinabilidade</label>
                  <select
                    value={aiWorkoutLevel}
                    onChange={(e) => setAiWorkoutLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado / Atleta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#9B9BA1] mb-1">Duração Alvo (min)</label>
                  <input
                    type="number"
                    value={aiWorkoutDuration}
                    onChange={(e) => setAiWorkoutDuration(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#9B9BA1] mb-1">
                  Diretrizes Biomecânicas & Foco Específico
                </label>
                <textarea
                  rows={2}
                  value={aiWorkoutFocusNotes}
                  onChange={(e) => setAiWorkoutFocusNotes(e.target.value)}
                  placeholder="ex: Foco em retração escapular, cadência excêntrica 3s e drop-set no último exercício."
                  className="w-full p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAiWorkoutModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9B9BA1] hover:bg-[#1D1D1F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateAiWorkout}
                disabled={aiWorkoutLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#D8B46A] to-[#F1C40F] text-[#0A0A0A] hover:brightness-110 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {aiWorkoutLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculando Biomecânica...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Gerar Treino com Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Diet Generator Modal */}
      {showAiDietModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151515] border border-[#D8B46A]/50 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#D8B46A]">
                    VYRA AI NUTRITIONIST
                  </span>
                  <h3 className="text-base font-bold text-[#F5F5F7]">
                    Gerar Protocolo Nutricional com IA
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowAiDietModal(false)}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#9B9BA1] mb-1">Aluno Selecionado</label>
                <div className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#D8B46A]" />
                    {selectedStudent ? selectedStudent.name : "Atleta Geral"}
                  </span>
                  {selectedStudent && (
                    <span className="text-[10px] text-[#D8B46A]">
                      {selectedStudent.weight_kg}kg · {selectedStudent.height_cm}cm
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#9B9BA1] mb-1">Objetivo Nutricional</label>
                <select
                  value={aiDietGoal}
                  onChange={(e) => setAiDietGoal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                >
                  <option value="Hipertrofia e Densidade Muscular">Hipertrofia e Densidade Muscular</option>
                  <option value="Definição Muscular & Estética">Definição Muscular & Estética (Cutting)</option>
                  <option value="Recomposição Corporal & Perda de Gordura">Recomposição Corporal (Gordura - / Músculo +)</option>
                  <option value="Ganho de Massa Bruta & Força">Ganho de Massa Bruta & Força (Bulking Limpo)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#9B9BA1] mb-1">Meta Calórica Diária (kcal)</label>
                  <input
                    type="number"
                    value={aiDietKcal}
                    onChange={(e) => setAiDietKcal(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#9B9BA1] mb-1">Restrições / Preferências</label>
                  <input
                    type="text"
                    value={aiDietRestrictions}
                    onChange={(e) => setAiDietRestrictions(e.target.value)}
                    placeholder="ex: Sem lactose, Sem glúten, Vegetariano"
                    className="w-full p-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] font-semibold focus:outline-none focus:border-[#D8B46A]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAiDietModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9B9BA1] hover:bg-[#1D1D1F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateAiDiet}
                disabled={aiDietLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#D8B46A] to-[#F1C40F] text-[#0A0A0A] hover:brightness-110 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {aiDietLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculando Macronutrientes...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Gerar Dieta com Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Send Workout Modal */}
      {showSendWorkoutModal && workoutToBulkSend && (
        <BulkSendWorkoutModal
          isOpen={showSendWorkoutModal}
          workout={workoutToBulkSend}
          students={students}
          onClose={() => {
            setShowSendWorkoutModal(false);
            setWorkoutToBulkSend(null);
          }}
          onSuccess={(count, studentNames) => {
            const namesDisplay = typeof studentNames === "string" ? studentNames : (Array.isArray(studentNames) ? (studentNames as string[]).join(", ") : "");
            showNotification(`Treino atribuído com sucesso para ${count} aluno(s): ${namesDisplay}!`);
            // Refresh student list from server
            api.getStudents().then(setStudents).catch(() => {});
          }}
        />
      )}

      {/* Substitute Exercise Modal */}
      {substituteModalIdx !== null && workout && workout.exercises && workout.exercises[substituteModalIdx] && (
        <SubstituteExerciseModal
          isOpen={substituteModalIdx !== null}
          currentExercise={workout.exercises[substituteModalIdx]}
          exerciseName={workout.exercises[substituteModalIdx].name}
          muscle={workout.exercises[substituteModalIdx].muscle}
          onSelectSubstitute={handleSelectSubstitute}
          onClose={() => setSubstituteModalIdx(null)}
        />
      )}

      {/* Food Option (Substitution) Modal */}
      {addFoodOptionModalFoodId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#D8B46A]" />
                <h3 className="text-sm font-black text-[#F5F5F7]">Adicionar Opção de Troca</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddFoodOptionModalFoodId(null);
                  setAddFoodOptionText("");
                }}
                className="p-1 rounded-lg text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#1D1D1F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9B9BA1] leading-relaxed">
              O aluno poderá alternar para esta opção no aplicativo se não quiser consumir o prato principal prescrito.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Nome e Porção da Substituição *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={addFoodOptionText}
                  onChange={(e) => setAddFoodOptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmAddFoodOption();
                    }
                  }}
                  placeholder="Ex: 150g de Tilápia Grelhada com Lemon Pepper"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#9B9BA1] block">Sugestões rápidas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "150g de Tilápia Grelhada",
                    "140g de Patinho Moído",
                    "4 Ovos Cozidos inteiros",
                    "150g de Tofu Grelhado",
                    "1 scoop de Whey com 30g de Aveia",
                    "150g de Batata Doce Cozida",
                    "150g de Arroz Integral",
                  ].map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setAddFoodOptionText(sug)}
                      className="text-[10px] bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#D8B46A] text-[#9B9BA1] hover:text-[#F5F5F7] px-2 py-1 rounded-lg transition-all text-left cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2B2B2F]">
              <button
                type="button"
                onClick={() => {
                  setAddFoodOptionModalFoodId(null);
                  setAddFoodOptionText("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#9B9BA1] hover:bg-[#1D1D1F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddFoodOption}
                disabled={!addFoodOptionText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#D8B46A] hover:bg-[#E2C382] text-[#0A0A0A] disabled:opacity-50 cursor-pointer shadow-md shadow-[#D8B46A]/20"
              >
                Adicionar Opção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
