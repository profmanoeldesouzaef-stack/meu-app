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
  Sparkles,
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
} from "lucide-react";
import { SubstituteExerciseModal } from "../components/SubstituteExerciseModal";
import { BulkSendWorkoutModal } from "../components/BulkSendWorkoutModal";
import { CoachWorkoutLibrary } from "../components/CoachWorkoutLibrary";
import { CoachDietFoodPresets } from "../components/CoachDietFoodPresets";

export const CoachDashboardView: React.FC = () => {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<
    "overview" | "finance" | "workouts" | "library" | "diet" | "radar" | "broadcast" | "challenges"
  >("overview");

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
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastAuthor, setBroadcastAuthor] = useState("Coach Mari");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Salvo com sucesso!");

  // AI Workout Generator Modal & State
  const [showAiWorkoutModal, setShowAiWorkoutModal] = useState(false);
  const [aiWorkoutLoading, setAiWorkoutLoading] = useState(false);
  const [aiWorkoutSplit, setAiWorkoutSplit] = useState("Push (Peito, Ombro e Tríceps)");
  const [aiWorkoutLevel, setAiWorkoutLevel] = useState("Intermediário");
  const [aiWorkoutDuration, setAiWorkoutDuration] = useState(55);
  const [aiWorkoutFocusNotes, setAiWorkoutFocusNotes] = useState(
    "Ênfase em retração escapular e controle excêntrico de 3 segundos."
  );

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

  // Challenge Event state & form
  const [challengeEvent, setChallengeEvent] = useState<ChallengeEvent | null>(null);
  const [challengeSubmissions, setChallengeSubmissions] = useState<Challenge[]>([]);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtSubtitle, setEvtSubtitle] = useState("");
  const [evtRules, setEvtRules] = useState("");
  const [evtPrize, setEvtPrize] = useState("");
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
    ]).then(([kp, rd, cp, pt, wk, dt, stds, chEvt, chItems, wLib]) => {
      setKpis(kp);
      setRadar(rd);
      setCoupons(cp);
      setPartners(pt);
      if (wLib) setWorkoutLibrary(wLib);
      if (wk) setWorkout(wk);
      if (dt) setDiet(dt);
      if (chEvt) {
        setChallengeEvent(chEvt);
        setEvtTitle(chEvt.title || "");
        setEvtSubtitle(chEvt.subtitle || "");
        setEvtRules(chEvt.rules || "");
        setEvtPrize(chEvt.prize || "");
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0] || null;

  // Handle selecting a student
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    if (student.diet) {
      setDiet(student.diet);
    }
    if (student.workout) {
      setWorkout(student.workout);
    }
    // Pre-fill AI modals with student info
    setAiDietGoal(student.goal || "Hipertrofia Muscular");
    setAiDietRestrictions(student.restrictions || "Nenhuma");
    const estimatedKcal = Math.round(
      student.weight_kg * 32 + (student.goal.toLowerCase().includes("hipertrofia") ? 400 : -350)
    );
    setAiDietKcal(estimatedKcal > 1400 ? estimatedKcal : 2200);
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
      const created = await api.createPartner(newPartnerEmail.trim());
      setPartners((prev) => [created, ...prev]);
      setNewPartnerEmail("");
      showNotification("Parceiro adicionado com sucesso!");
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
  const handleAddFoodOption = (foodId: string) => {
    const opt = prompt("Digite uma opção de substituição (ex: 150g de Tilápia Grelhada):");
    if (!opt || !opt.trim() || !diet) return;
    const updatedFoods = diet.foods.map((f) => {
      if (f.id === foodId) {
        return {
          ...f,
          options: [...(f.options || []), opt.trim()],
        };
      }
      return f;
    });
    setDiet({ ...diet, foods: updatedFoods });
    showNotification("Opção de substituição adicionada.");
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
        </div>
      )}

      {/* Tab: Finance */}
      {activeTab === "finance" && (
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
            <h3 className="text-sm font-bold text-[#F5F5F7]">Parceiros & Atletas Isentos</h3>

            <form onSubmit={handleCreatePartner} className="flex gap-2">
              <input
                type="email"
                placeholder="email@atleta.com"
                value={newPartnerEmail}
                onChange={(e) => setNewPartnerEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs focus:outline-none focus:border-[#D8B46A]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shrink-0 cursor-pointer"
              >
                Adicionar
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {partners.map((pt) => (
                <div
                  key={pt.id}
                  className="p-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-between"
                >
                  <span className="text-xs text-[#F5F5F7] truncate max-w-[200px]">{pt.email}</span>
                  <button
                    onClick={() => handleTogglePartner(pt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      pt.active
                        ? "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30"
                        : "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30"
                    }`}
                  >
                    {pt.active ? "Acesso VIP" : "Revogado"}
                  </button>
                </div>
              ))}
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
                  <Sparkles className="w-4 h-4 fill-current" />
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
                  <Sparkles className="w-4 h-4 fill-current" />
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
                  <span className="text-xs font-bold text-[#F5F5F7] bg-[#1D1D1F] px-3 py-1.5 rounded-xl border border-[#2B2B2F]">
                    Total: {diet.kcal || 2400} kcal / dia
                  </span>
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
                  <span className="text-[10px] text-[#9B9BA1] block mt-1">
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
                  <span className="text-[10px] text-[#9B9BA1] block mt-1">
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
                  <span className="text-[10px] text-[#9B9BA1] block mt-1">
                    ~{Math.round(((diet.kcal || 2400) * (diet.fats_pct / 100)) / 9)}g de lipídios
                  </span>
                </div>
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
                            onClick={() => handleAddFoodOption(food.id)}
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
                src={challengeEvent.champion.photo}
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
                <Sparkles className="w-4 h-4 text-[#D8B46A]" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            src={sub.after_image}
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
                  <Sparkles className="w-4 h-4 fill-current" />
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
                    <Sparkles className="w-4 h-4 fill-current" />
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
                  <Sparkles className="w-4 h-4 fill-current" />
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
                    <Sparkles className="w-4 h-4 fill-current" />
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
          workout={workoutToBulkSend}
          students={students}
          onClose={() => {
            setShowSendWorkoutModal(false);
            setWorkoutToBulkSend(null);
          }}
          onSuccess={(count, studentNames) => {
            showNotification(`Treino atribuído com sucesso para ${count} aluno(s): ${studentNames.join(", ")}!`);
            // Refresh student list from server
            api.getStudents().then(setStudents).catch(() => {});
          }}
        />
      )}

      {/* Substitute Exercise Modal */}
      {substituteModalIdx !== null && workout && workout.exercises && workout.exercises[substituteModalIdx] && (
        <SubstituteExerciseModal
          currentExercise={workout.exercises[substituteModalIdx]}
          onSelectSubstitute={handleSelectSubstitute}
          onClose={() => setSubstituteModalIdx(null)}
        />
      )}
    </div>
  );
};
