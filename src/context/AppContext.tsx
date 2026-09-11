import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Persona, Lang, Theme, Subscription, Plan, BillingCycle } from "../types";
import { supabase } from "../lib/supabase";
import { api } from "../api/client";
import { MilestoneCelebrationData } from "../components/MilestoneCelebrationModal";

export type ActiveView =
  | "home"
  | "training"
  | "diet"
  | "progress"
  | "profile"
  | "challenges"
  | "galeria"
  | "community"
  | "paywall"
  | "checkout"
  | "anamnesis"
  | "coach"
  | "moderator"
  | "form-checker"
  | "photo-gallery"
  | "workout-completion";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "coach" | "water" | "creatine" | "assessment" | "general";
  timestamp: string;
  read: boolean;
}

export interface CoachInviteInfo {
  coachName: string;
  coachId?: string;
  code?: string;
  active?: boolean;
  coachRole?: string;
  specialty?: string;
  couponCode?: string;
  customMessage?: string;
}

interface AppContextType {
  persona: Persona;
  lang: Lang;
  theme: Theme;
  loggedIn: boolean;
  anamnesisDone: boolean;
  photosDone: boolean;
  subscription: Subscription;
  activeView: ActiveView;
  selectedPlan: { plan: Plan; cycle: BillingCycle } | null;
  unreadCommunityCount: number;
  clearUnreadCommunity: () => void;
  systemNotifications: AppNotification[];
  dismissNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  sendNotification: (title: string, message: string, type?: AppNotification["type"]) => void;
  requestPushPermission: () => Promise<boolean>;
  pushPermissionState: NotificationPermission | "default";
  creatineChecks: Record<string, boolean>;
  toggleCreatineCheck: (timeKey: string) => void;
  currentUserEmail: string;
  setCurrentUserEmail: (email: string) => void;
  currentUserName: string;
  setCurrentUserName: (name: string) => void;
  currentUserNickname: string;
  setCurrentUserNickname: (nick: string) => void;
  registeredModerators: string[];
  registeredCoaches: string[];
  registeredPartners: string[];
  isModeratorEmail: (email: string) => boolean;
  isCoachEmail: (email: string) => boolean;
  isPartnerEmail: (email: string) => boolean;
  isPartner: boolean;
  addCoachEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  toggleCoachStatus: (idOrEmail: string) => Promise<void>;
  addModeratorEmail: (email: string) => { success: boolean; message: string };
  loginWithEmail: (email: string) => { success: boolean; role: Persona; message: string };
  inviteData: CoachInviteInfo | null;
  setInviteData: (data: CoachInviteInfo | null) => void;
  dismissInviteBanner: () => void;
  setPersona: (p: Persona) => void;
  definirPerfil: (usuario: any) => void;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setLoggedIn: (v: boolean) => void;
  logout: () => Promise<void>;
  setAnamnesisDone: (v: boolean) => void;
  setPhotosDone: (v: boolean) => void;
  setSubscription: (s: Subscription) => void;
  trackWeightsEnabled: boolean;
  setTrackWeightsEnabled: (enabled: boolean) => void;
  isChampion: boolean;
  setIsChampion: (v: boolean) => void;
  userPoints: number;
  setUserPoints: (p: number) => void;
  userRank: string | null;
  setUserRank: (r: string | null) => void;
  isVeteran: boolean;
  setIsVeteran: (v: boolean) => void;
  consecutiveMonths: number;
  setConsecutiveMonths: (m: number) => void;
  monthlyFeePaid: boolean;
  setMonthlyFeePaid: (paid: boolean) => void;
  updateRecurrence: (months: number, isPaid: boolean) => void;
  applyVeteranCoupon: (code: string) => { success: boolean; message: string };
  chatNameColor: string;
  chatTextColor: string;
  setChatColors: (nameColor: string, textColor: string) => void;
  vipChatUnlocked: boolean;
  setVipChatUnlocked: (unlocked: boolean) => void;
  hasVipChatColors: boolean;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;
  workoutReleased: boolean;
  setWorkoutReleased: (v: boolean) => void;
  dietReleased: boolean;
  setDietReleased: (v: boolean) => void;
  milestoneCelebration: MilestoneCelebrationData | null;
  triggerMilestoneCelebration: (data: MilestoneCelebrationData) => void;
  dismissMilestoneCelebration: () => void;
  setActiveView: (view: ActiveView) => void;
  setSelectedPlan: (p: { plan: Plan; cycle: BillingCycle } | null) => void;
  fmtPrice: (brl: number, usd: number) => string;
  currencySymbol: string;
  t: (k: string) => string;
}

const dict = {
  pt: {
    "app.name": "VYRA",
    "app.tagline": "Training & Performance",
    "cta.enter_demo": "Entrar em modo demonstração",
    "cta.login": "Entrar",
    "cta.signup": "Criar conta",
    "cta.forgot": "Recuperar acesso",
    "cta.continue": "Continuar",
    "cta.confirm_purchase": "Confirmar compra",
    "cta.apply": "Aplicar",
    "cta.mark_done": "Marcar como concluído",
    "cta.finish_workout": "Finalizar treino",
    "cta.analyze": "Analisar execução (IA)",
    "cta.save": "Salvar alterações",
    "cta.close": "Fechar",
    "cta.send": "Enviar mensagem",
    "cta.publish": "Publicar transformação",
    "cta.logout": "Sair da conta",
    "cta.premium": "Ver protocolos e planos",
    "cta.add_weight": "Registrar peso / medidas",
    "cta.edit": "Editar",
    "cta.ai_suggest": "IA sugerir alimentos",
    "cta.analyze_plate": "Analisar prato (IA)",
    "cta.start_anamnesis": "Preencher anamnese",
    "cta.broadcast": "Enviar aviso aos alunos",
    "cta.new_challenge": "Novo desafio",
    "cta.close_challenge": "Encerrar & mover pra Hall",
    "cta.vote": "Votar",
    "sec.hi": "Olá",
    "sec.weekly": "Progresso da semana",
    "sec.today_workout": "Treino do dia",
    "sec.macros": "Macros do dia",
    "sec.shortcuts": "Atalhos rápidos",
    "sec.challenges": "Desafios & Resultados",
    "sec.community": "Comunidade",
    "sec.evolution": "Evolução corporal",
    "sec.diet": "Plano alimentar",
    "sec.training": "Treino",
    "sec.profile": "Perfil",
    "sec.home": "Início",
    "sec.progress": "Evolução",
    "sec.reminders": "Lembretes diários",
    "sec.water": "Hidratação",
    "sec.creatine": "Creatina",
    "sec.coach_message": "Mensagem do coach",
    "sec.hall": "Hall da Fama",
    "sec.active": "Em andamento",
    "sec.perimetry": "Perimetria",
    "tab.home": "Início",
    "tab.training": "Treinos",
    "tab.diet": "Dieta",
    "tab.progress": "Evolução",
    "tab.profile": "Perfil",
    "tab.challenges": "Desafios",
    "tab.galeria": "Galeria",
    "tab.coach": "Coach Admin",
    "tab.moderator": "Moderador",
    "paywall.title": "Escolha seu protocolo",
    "paywall.sub": "Metas, periodização científica e acompanhamento de alta performance.",
    "paywall.monthly": "Mensal",
    "paywall.quarterly": "Trimestral",
    "paywall.yearly": "Anual",
    "paywall.per_month": "/mês",
    "paywall.per_quarter": "/tri",
    "paywall.per_year": "/ano",
    "paywall.coming": "Em breve · Vyra Kids",
    "paywall.most_wanted": "Mais solicitado",
    "paywall.blocked": "Recomendamos preencher a anamnese para personalização completa",
    "checkout.title": "Finalizar assinatura",
    "checkout.summary": "Resumo do pedido",
    "checkout.coupon": "Cupom de desconto",
    "checkout.enter_coupon": "Digite o cupom (ex: VYRA10, RESET25)",
    "checkout.subtotal": "Subtotal",
    "checkout.discount": "Desconto",
    "checkout.total": "Total",
    "checkout.applied": "Cupom aplicado com sucesso",
    "checkout.invalid": "Cupom inválido ou inativo",
    "training.exercises": "Exercícios prescritos",
    "training.rest": "Descanso",
    "training.done": "Concluído",
    "training.coach_note": "Nota do coach",
    "training.video": "Ver vídeo demonstrativo",
    "form.title": "Form Checker · IA",
    "form.desc": "Análise técnica de execução de movimentos com biomecânica avançada.",
    "form.checklist": "Checklist de postura e execução",
    "form.result": "Resultado da análise",
    "form.score": "Nota técnica",
    "form.run": "Rodar análise IA",
    "diet.calc": "Macro-calculadora",
    "diet.kcal": "Calorias diárias",
    "diet.protein": "Proteínas",
    "diet.carbs": "Carboidratos",
    "diet.fats": "Gorduras",
    "diet.foods": "Refeições do dia",
    "diet.substitute": "Substituir",
    "diet.ai_title": "IA · Alimentos alternativos",
    "diet.plate_title": "IA · Analisar prato",
    "diet.plate_desc": "Envie a foto do seu prato e a IA estima calorias, proteína, carboidrato e gordura.",
    "diet.plate_upload": "Enviar foto",
    "meal.breakfast": "Café da manhã",
    "meal.lunch": "Almoço",
    "meal.snack": "Lanche da tarde",
    "meal.dinner": "Jantar",
    "meal.supper": "Ceia",
    "evo.current": "Peso atual",
    "evo.history": "Histórico de pesagem",
    "evo.gallery": "Galeria do shape",
    "evo.add": "Adicionar registro",
    "ch.title": "Desafios do Clube",
    "ch.sub": "Transformações reais de membros da comunidade Vyra",
    "ch.filter.all": "Todos",
    "ch.filter.reset12": "Reset 12",
    "ch.filter.shape": "Shape",
    "ch.filter.forge": "Forge",
    "ch.weeks": "semanas",
    "ch.votes": "votos",
    "comm.title": "Comunidade Global",
    "comm.placeholder": "Mensagem para o clube… (máx 200 caracteres)",
    "profile.persona": "Persona em demonstração",
    "profile.student": "Aluno",
    "profile.coach": "Coach",
    "profile.moderator": "Moderador",
    "profile.language": "Idioma & Moeda",
    "profile.subscription": "Status da assinatura",
    "profile.active": "Ativa",
    "profile.inactive": "Não assinado",
    "profile.version": "VYRA Training & Performance · v1.1.0",
    "profile.admin": "Painel gerencial",
    "profile.nickname": "Apelido",
    "profile.height": "Altura (cm)",
    "profile.weight": "Peso (kg)",
    "profile.waist": "Cintura (cm)",
    "profile.right_arm": "Braço dir (cm)",
    "profile.left_arm": "Braço esq (cm)",
    "profile.right_leg": "Perna dir (cm)",
    "profile.left_leg": "Perna esq (cm)",
    "profile.theme": "Aparência",
    "profile.dark": "Obsidian Dark",
    "profile.light": "Clean Light",
    "profile.water_target": "Meta diária de água (ml)",
    "profile.creatine_dose": "Dose diária de creatina (g)",
    "profile.creatine_times": "Horários programados",
    "profile.edit": "Editar medidas e metas",
    "coach.title": "Painel do Coach",
    "coach.overview": "Visão geral",
    "coach.finance": "Financeiro",
    "coach.workouts": "Treinos",
    "coach.diet": "Dieta",
    "coach.challenges": "Desafios",
    "coach.radar": "Radar de Alunos",
    "coach.broadcast": "Aviso Geral",
    "coach.new_coupon": "Criar cupom",
    "coach.partners": "Parceiros isentos",
    "coach.new_workout": "Editar prescrição de treino",
    "coach.edit_diet": "Editar plano alimentar",
    "coach.new_challenge": "Criar novo desafio",
    "coach.alerts": "Alertas de retenção",
    "coach.disable": "Desativar",
    "coach.enable": "Ativar",
    "mod.title": "Painel de Moderação",
    "mod.add_coach": "Adicionar coach credenciado",
    "mod.coach_email": "E-mail do coach",
    "login.subtitle": "Clube premium de treino e performance humana",
    "login.email": "E-mail",
    "login.password": "Senha",
    "ana.title": "Anamnese Base do Aluno",
    "ana.desc": "Dados biométricos e histórico base para calibração personalizada.",
    "ana.age": "Idade",
    "ana.gender": "Gênero",
    "ana.height": "Altura (cm)",
    "ana.weight": "Peso (kg)",
    "ana.goal": "Objetivo principal",
    "ana.activity": "Nível de atividade física",
    "ana.restrictions": "Restrições alimentares",
    "ana.allergies": "Alergias ou intolerâncias",
    "ana.medical": "Observações médicas / lesões",
    "ana.photos": "Fotos corporais para avaliação postural (opcional)",
    "ana.front": "Foto frontal",
    "ana.side": "Foto lateral",
    "ana.back": "Foto posterior",
    "ana.done": "Anamnese salva com sucesso!",
  },
  en: {
    "app.name": "VYRA",
    "app.tagline": "Training & Performance",
    "cta.enter_demo": "Enter demo mode",
    "cta.login": "Sign in",
    "cta.signup": "Create account",
    "cta.forgot": "Recover access",
    "cta.continue": "Continue",
    "cta.confirm_purchase": "Confirm purchase",
    "cta.apply": "Apply",
    "cta.mark_done": "Mark as completed",
    "cta.finish_workout": "Finish workout",
    "cta.analyze": "Analyze form (AI)",
    "cta.save": "Save changes",
    "cta.close": "Close",
    "cta.send": "Send message",
    "cta.publish": "Share transformation",
    "cta.logout": "Sign out",
    "cta.premium": "View protocols & plans",
    "cta.add_weight": "Log weight / measurements",
    "cta.edit": "Edit",
    "cta.ai_suggest": "AI suggest food swaps",
    "cta.analyze_plate": "Analyze plate (AI)",
    "cta.start_anamnesis": "Fill anamnesis",
    "cta.broadcast": "Send broadcast to athletes",
    "cta.new_challenge": "New challenge",
    "cta.close_challenge": "Close & move to Hall",
    "cta.vote": "Vote",
    "sec.hi": "Hey",
    "sec.weekly": "Weekly progress",
    "sec.today_workout": "Today's workout",
    "sec.macros": "Today's macros",
    "sec.shortcuts": "Quick shortcuts",
    "sec.challenges": "Challenges & Results",
    "sec.community": "Community",
    "sec.evolution": "Body evolution",
    "sec.diet": "Nutrition plan",
    "sec.training": "Training",
    "sec.profile": "Profile",
    "sec.home": "Home",
    "sec.progress": "Evolution",
    "sec.reminders": "Daily reminders",
    "sec.water": "Hydration",
    "sec.creatine": "Creatine",
    "sec.coach_message": "Coach broadcast",
    "sec.hall": "Hall of Fame",
    "sec.active": "In progress",
    "sec.perimetry": "Perimetry",
    "tab.home": "Home",
    "tab.training": "Training",
    "tab.diet": "Diet",
    "tab.progress": "Evolution",
    "tab.profile": "Profile",
    "tab.challenges": "Challenges",
    "tab.galeria": "Gallery",
    "tab.coach": "Coach Admin",
    "tab.moderator": "Moderator",
    "paywall.title": "Pick your protocol",
    "paywall.sub": "Goals, scientific periodization and high performance coaching.",
    "paywall.monthly": "Monthly",
    "paywall.quarterly": "Quarterly",
    "paywall.yearly": "Yearly",
    "paywall.per_month": "/mo",
    "paywall.per_quarter": "/qtr",
    "paywall.per_year": "/yr",
    "paywall.coming": "Coming soon · Vyra Kids",
    "paywall.most_wanted": "Most wanted",
    "paywall.blocked": "We recommend completing your anamnesis for 100% personalization",
    "checkout.title": "Complete subscription",
    "checkout.summary": "Order summary",
    "checkout.coupon": "Discount coupon",
    "checkout.enter_coupon": "Enter coupon code (e.g. VYRA10, RESET25)",
    "checkout.subtotal": "Subtotal",
    "checkout.discount": "Discount",
    "checkout.total": "Total",
    "checkout.applied": "Coupon applied successfully",
    "checkout.invalid": "Invalid or inactive coupon",
    "training.exercises": "Prescribed exercises",
    "training.rest": "Rest",
    "training.done": "Done",
    "training.coach_note": "Coach note",
    "training.video": "Watch demo video",
    "form.title": "Form Checker · AI",
    "form.desc": "AI biomechanical analysis of exercise execution.",
    "form.checklist": "Form & posture checklist",
    "form.result": "Analysis result",
    "form.score": "Technical score",
    "form.run": "Run AI analysis",
    "diet.calc": "Macro calculator",
    "diet.kcal": "Daily calories",
    "diet.protein": "Protein",
    "diet.carbs": "Carbs",
    "diet.fats": "Fats",
    "diet.foods": "Today's meals",
    "diet.substitute": "Swap food",
    "diet.ai_title": "AI · Alternative foods",
    "diet.plate_title": "AI · Analyze plate",
    "diet.plate_desc": "Upload a photo of your plate to estimate calories, protein, carbs and fats.",
    "diet.plate_upload": "Upload photo",
    "meal.breakfast": "Breakfast",
    "meal.lunch": "Lunch",
    "meal.snack": "Afternoon snack",
    "meal.dinner": "Dinner",
    "meal.supper": "Supper",
    "evo.current": "Current weight",
    "evo.history": "Weigh-in history",
    "evo.gallery": "Shape gallery",
    "evo.add": "Log entry",
    "ch.title": "Club Challenges",
    "ch.sub": "Real transformations from the Vyra community",
    "ch.filter.all": "All",
    "ch.filter.reset12": "Reset 12",
    "ch.filter.shape": "Shape",
    "ch.filter.forge": "Forge",
    "ch.weeks": "weeks",
    "ch.votes": "votes",
    "comm.title": "Global Community",
    "comm.placeholder": "Message the club… (max 200 chars)",
    "profile.persona": "Demo persona",
    "profile.student": "Student",
    "profile.coach": "Coach",
    "profile.moderator": "Moderator",
    "profile.language": "Language & Currency",
    "profile.subscription": "Subscription status",
    "profile.active": "Active",
    "profile.inactive": "Not subscribed",
    "profile.version": "VYRA Training & Performance · v1.1.0",
    "profile.admin": "Admin dashboard",
    "profile.nickname": "Nickname",
    "profile.height": "Height (cm)",
    "profile.weight": "Weight (kg)",
    "profile.waist": "Waist (cm)",
    "profile.right_arm": "Right arm (cm)",
    "profile.left_arm": "Left arm (cm)",
    "profile.right_leg": "Right leg (cm)",
    "profile.left_leg": "Left leg (cm)",
    "profile.theme": "Appearance",
    "profile.dark": "Obsidian Dark",
    "profile.light": "Clean Light",
    "profile.water_target": "Daily water target (ml)",
    "profile.creatine_dose": "Daily creatine dose (g)",
    "profile.creatine_times": "Scheduled times",
    "profile.edit": "Edit metrics and targets",
    "coach.title": "Coach Dashboard",
    "coach.overview": "Overview",
    "coach.finance": "Finance",
    "coach.workouts": "Workouts",
    "coach.diet": "Diet",
    "coach.challenges": "Challenges",
    "coach.radar": "Athlete Radar",
    "coach.broadcast": "Broadcast",
    "coach.new_coupon": "Create coupon",
    "coach.partners": "Free partners",
    "coach.new_workout": "Edit workout prescription",
    "coach.edit_diet": "Edit nutrition plan",
    "coach.new_challenge": "Create new challenge",
    "coach.alerts": "Retention alerts",
    "coach.disable": "Disable",
    "coach.enable": "Enable",
    "mod.title": "Moderator Panel",
    "mod.add_coach": "Add accredited coach",
    "mod.coach_email": "Coach email",
    "login.subtitle": "Premium human training & performance club",
    "login.email": "Email",
    "login.password": "Password",
    "ana.title": "Student Base Anamnesis",
    "ana.desc": "Base biometric data and history for personalized coaching calibration.",
    "ana.age": "Age",
    "ana.gender": "Gender",
    "ana.height": "Height (cm)",
    "ana.weight": "Weight (kg)",
    "ana.goal": "Primary goal",
    "ana.activity": "Physical activity level",
    "ana.restrictions": "Dietary restrictions",
    "ana.allergies": "Allergies or intolerances",
    "ana.medical": "Medical notes / injuries",
    "ana.photos": "Posture assessment photos (optional)",
    "ana.front": "Front photo",
    "ana.side": "Side photo",
    "ana.back": "Back photo",
    "ana.done": "Anamnesis saved successfully!",
  },
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersonaState] = useState<Persona>("student");
  const [lang, setLangState] = useState<Lang>("pt");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [loggedIn, setLoggedInState] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("vyra_logged_in") === "true";
      }
    } catch {}
    return false;
  });
  const [anamnesisDone, setAnamnesisDoneState] = useState(false);
  const [photosDone, setPhotosDoneState] = useState(false);
  const [subscription, setSubscriptionState] = useState<Subscription>({ active: false });
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [selectedPlan, setSelectedPlan] = useState<{ plan: Plan; cycle: BillingCycle } | null>(null);

  const [onboardingCompleted, setOnboardingCompletedState] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem("vyra_onboarding_completed");
        if (val !== null) return val === "true";
        const an = localStorage.getItem("vyra_anamnesis");
        if (an === "true") return true;
      }
    } catch {}
    return true;
  });

  const [workoutReleased, setWorkoutReleasedState] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem("vyra_workout_released");
        if (val !== null) return val === "true";
      }
    } catch {}
    return true;
  });

  const [dietReleased, setDietReleasedState] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem("vyra_diet_released");
        if (val !== null) return val === "true";
      }
    } catch {}
    return true;
  });

  const setOnboardingCompleted = useCallback((v: boolean) => {
    setOnboardingCompletedState(v);
    localStorage.setItem("vyra_onboarding_completed", String(v));
  }, []);

  const setWorkoutReleased = useCallback((v: boolean) => {
    setWorkoutReleasedState(v);
    localStorage.setItem("vyra_workout_released", String(v));
  }, []);

  const setDietReleased = useCallback((v: boolean) => {
    setDietReleasedState(v);
    localStorage.setItem("vyra_diet_released", String(v));
  }, []);

  // Community unread badge state (when clicked, disappears)
  const [unreadCommunityCount, setUnreadCommunityCount] = useState<number>(3);

  const DEFAULT_STUDENT_NOTIFICATIONS: AppNotification[] = [
    {
      id: "notif-water-1",
      title: "Lembrete de Hidratação",
      message: "Beba 250ml de água agora para manter seu anabolismo e foco.",
      type: "water",
      timestamp: "Há 10 min",
      read: false,
    },
    {
      id: "notif-creatine-1",
      title: "Lembrete de Creatina",
      message: "Horário da sua dose de creatina programada pelo Coach. Marque no seu check!",
      type: "creatine",
      timestamp: "Programado",
      read: false,
    },
    {
      id: "notif-assessment-1",
      title: "Ciclo de 20 Dias: Fotos & Perimetria",
      message: "Atualize seu shape e medidas para calibração do protocolo pelo Coach.",
      type: "assessment",
      timestamp: "Programado",
      read: false,
    },
  ];

  const DEFAULT_COACH_NOTIFICATIONS: AppNotification[] = [
    {
      id: "coach-notif-1",
      title: "Ajuste de Treino Pendente",
      message: "Lucas Andrade completou 4 semanas do bloco Push/Pull/Legs e aguarda nova periodização.",
      type: "coach",
      timestamp: "Há 15 min",
      read: false,
    },
    {
      id: "coach-notif-2",
      title: "Fotos de Evolução Recebidas",
      message: "Marina Costa enviou as fotos do ciclo de 20 dias para sua avaliação postural e perímetros.",
      type: "assessment",
      timestamp: "Há 1h",
      read: false,
    },
    {
      id: "coach-notif-3",
      title: "Alerta de Frequência no Radar",
      message: "Rodrigo Silva não treina há 4 dias consecutivos. Envie um incentivo no chat.",
      type: "coach",
      timestamp: "Hoje",
      read: false,
    },
    {
      id: "coach-notif-4",
      title: "Aluna Atingiu Nova Patente!",
      message: "Juliana Lima completou 5 meses e desbloqueou a 1ª Estrela Evoluída.",
      type: "coach",
      timestamp: "Ontem",
      read: false,
    },
    {
      id: "coach-notif-5",
      title: "Revisão Nutricional Solicitada",
      message: "Pedro Santos atingiu a meta de 78kg e solicita atualização de macros e calorias.",
      type: "coach",
      timestamp: "Ontem",
      read: false,
    },
  ];

  // System notifications state for Students
  const [studentNotifications, setStudentNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("vyra_system_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_STUDENT_NOTIFICATIONS;
  });

  // System notifications state for Coach (Related to students)
  const [coachNotifications, setCoachNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("vyra_coach_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_COACH_NOTIFICATIONS;
  });

  // Active notifications list based on persona (Coach receives student-related reminders, not water/creatine)
  const systemNotifications = useMemo(() => {
    return persona === "coach" ? coachNotifications : studentNotifications;
  }, [persona, coachNotifications, studentNotifications]);

  const [pushPermissionState, setPushPermissionState] = useState<NotificationPermission | "default">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  // Creatine checks for the day
  const [creatineChecks, setCreatineChecks] = useState<Record<string, boolean>>({});

  // Student preference: track weights/load for exercises
  const [trackWeightsEnabled, setTrackWeightsEnabledState] = useState<boolean>(true);

  // VIP Chat Customization Colors (unlocked at 5th star / 5+ months)
  const [chatNameColor, setChatNameColorState] = useState<string>(() => {
    try {
      return localStorage.getItem("vyra_chat_name_color") || "#D8B46A";
    } catch {
      return "#D8B46A";
    }
  });

  const [chatTextColor, setChatTextColorState] = useState<string>(() => {
    try {
      return localStorage.getItem("vyra_chat_text_color") || "#F5F5F7";
    } catch {
      return "#F5F5F7";
    }
  });

  const setChatColors = useCallback((nameColor: string, textColor: string) => {
    setChatNameColorState(nameColor);
    setChatTextColorState(textColor);
    try {
      localStorage.setItem("vyra_chat_name_color", nameColor);
      localStorage.setItem("vyra_chat_text_color", textColor);
    } catch {}
  }, []);

  // Milestone Celebration Overlay Modal
  const [milestoneCelebration, setMilestoneCelebration] = useState<MilestoneCelebrationData | null>(null);

  const triggerMilestoneCelebration = useCallback((data: MilestoneCelebrationData) => {
    setMilestoneCelebration(data);
  }, []);

  const dismissMilestoneCelebration = useCallback(() => {
    setMilestoneCelebration(null);
  }, []);

  // Gamification: Champion, Veteran Badge, Points, Rank and Recurrence Patents
  // Novos usuários iniciam obrigatoriamente zerados (sem Coroa e com Patente Base/Iniciante)
  const [isChampion, setIsChampionState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("vyra_is_champion");
      if (saved !== null) return saved === "true";
    } catch {}
    return false; // Estritamente condicionado ao Supabase (is_champion === true)
  });

  const [userPoints, setUserPointsState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("vyra_user_points");
      if (saved !== null) return parseInt(saved, 10) || 0;
    } catch {}
    return 0; // Novos usuários iniciam obrigatoriamente com 0 pontos
  });

  const [userRank, setUserRankState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("vyra_user_rank") || null;
    } catch {}
    return null; // Patente base ou nula
  });

  const [isVeteran, setIsVeteranState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("vyra_is_veteran");
      if (saved !== null) return saved === "true";
    } catch {}
    return false; // Novos usuários iniciam SEM o selo
  });

  const [consecutiveMonths, setConsecutiveMonthsState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("vyra_consecutive_months");
      if (saved !== null) return parseInt(saved, 10) || 0;
    } catch {}
    return 0; // 0 meses: Patente base / Iniciante
  });

  const [monthlyFeePaid, setMonthlyFeePaidState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("vyra_monthly_fee_paid");
      if (saved !== null) return saved === "true";
    } catch {}
    return false;
  });

  const setIsChampion = useCallback((v: boolean) => {
    setIsChampionState(v);
    try {
      localStorage.setItem("vyra_is_champion", String(v));
    } catch {}
  }, []);

  const setUserPoints = useCallback((p: number) => {
    setUserPointsState(p);
    try {
      localStorage.setItem("vyra_user_points", String(p));
    } catch {}
  }, []);

  const setUserRank = useCallback((r: string | null) => {
    setUserRankState(r);
    try {
      if (r) localStorage.setItem("vyra_user_rank", r);
      else localStorage.removeItem("vyra_user_rank");
    } catch {}
  }, []);

  // VIP Chat Benefit (Unlocked by 5+ consecutive months OR granted directly by Coach)
  const [vipChatUnlocked, setVipChatUnlockedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("vyra_vip_chat_unlocked");
      if (saved !== null) return saved === "true";
    } catch {}
    return false;
  });

  const setVipChatUnlocked = useCallback((unlocked: boolean) => {
    setVipChatUnlockedState(unlocked);
    try {
      localStorage.setItem("vyra_vip_chat_unlocked", unlocked ? "true" : "false");
    } catch {}
  }, []);

  const hasVipChatColors = consecutiveMonths >= 5 || vipChatUnlocked;

  // User email & registered roles state (sem e-mail pré-definido)
  const [currentUserEmail, setCurrentUserEmailState] = useState<string>(() => {
    try {
      return localStorage.getItem("vyra_current_user_email") || "";
    } catch {
      return "";
    }
  });
  const [currentUserName, setCurrentUserNameState] = useState<string>(() => {
    try {
      return localStorage.getItem("vyra_user_name") || "";
    } catch {
      return "";
    }
  });
  const [currentUserNickname, setCurrentUserNicknameState] = useState<string>(() => {
    try {
      return localStorage.getItem("vyra_user_nickname") || "";
    } catch {
      return "";
    }
  });
  const [registeredModerators, setRegisteredModerators] = useState<string[]>([
    "suporte@vyratraining.com",
    "cubocao@gmail.com",
    "moderador@vyra.app",
    "admin@vyra.club",
  ]);
  const [registeredCoaches, setRegisteredCoaches] = useState<string[]>([
    "mari@vyra.club",
    "coach.mari@vyra.club",
  ]);
  const [registeredPartners, setRegisteredPartners] = useState<string[]>([
    "parceiro@empresa.com",
    "growth@nutrifit.com.br",
    "contato@crosslab.com",
  ]);

  // Invite data state (when an athlete enters via coach's invite link)
  const [inviteData, setInviteData] = useState<CoachInviteInfo | null>(null);

  // Initialize from local storage if available
  useEffect(() => {
    try {
      const p = localStorage.getItem("vyra_persona");
      const l = localStorage.getItem("vyra_lang");
      const t = localStorage.getItem("vyra_theme");
      const li = localStorage.getItem("vyra_logged_in");
      const an = localStorage.getItem("vyra_anamnesis");
      const ph = localStorage.getItem("vyra_photos_done");
      const s = localStorage.getItem("vyra_sub");
      const unread = localStorage.getItem("vyra_unread_community");
      const savedCreatine = localStorage.getItem("vyra_creatine_checks");
      const savedEmail = localStorage.getItem("vyra_user_email");
      const savedMods = localStorage.getItem("vyra_registered_moderators");
      const savedCoaches = localStorage.getItem("vyra_registered_coaches");

      if (savedEmail) setCurrentUserEmailState(savedEmail);
      if (savedMods) {
        const parsed = JSON.parse(savedMods);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Always ensure cubocao@gmail.com is included
          const merged = Array.from(new Set(["cubocao@gmail.com", ...parsed]));
          setRegisteredModerators(merged);
        }
      }
      if (savedCoaches) {
        const parsed = JSON.parse(savedCoaches);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegisteredCoaches(parsed);
        }
      }

      if (p) {
        const activeEmail = (savedEmail || "cubocao@gmail.com").trim().toLowerCase();
        const modsList: string[] = savedMods
          ? JSON.parse(savedMods)
          : ["cubocao@gmail.com", "moderador@vyra.app", "admin@vyra.club"];
        const coachesList: string[] = savedCoaches
          ? JSON.parse(savedCoaches)
          : ["mari@vyra.club", "coach.mari@vyra.club"];
        const isMod = modsList.some((m) => m.toLowerCase() === activeEmail);
        const isCoach = coachesList.some((c) => c.toLowerCase() === activeEmail);

        if (p === "moderator" && isMod) {
          setPersonaState("moderator");
        } else if (p === "coach" && isCoach) {
          setPersonaState("coach");
        } else {
          setPersonaState("student");
          localStorage.setItem("vyra_persona", "student");
        }
      }
      if (l) setLangState(l as Lang);
      if (t) setThemeState(t as Theme);
      if (li !== null) setLoggedInState(li === "true");
      if (an !== null) setAnamnesisDoneState(an === "true");
      if (ph !== null) setPhotosDoneState(ph === "true");
      if (s) setSubscriptionState(JSON.parse(s));
      if (unread !== null) setUnreadCommunityCount(parseInt(unread, 10) || 0);
      if (savedCreatine) setCreatineChecks(JSON.parse(savedCreatine));

      const savedTrackWeights = localStorage.getItem("vyra_track_weights_enabled");
      if (savedTrackWeights !== null) {
        setTrackWeightsEnabledState(savedTrackWeights === "true");
      }

      // Check URL query parameters for coach invitation link
      if (typeof window !== "undefined" && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const isInvite = params.get("invite");
        const coachName = params.get("coach");
        const coachId = params.get("coach_id");
        const code = params.get("code");

        if (isInvite || coachName || code) {
          const info: CoachInviteInfo = {
            coachName: coachName ? decodeURIComponent(coachName) : "Coach Vyra",
            coachId: coachId || "coach-mari",
            code: code || "VYRA-VIP",
          };
          setInviteData(info);
          localStorage.setItem("vyra_invite_coach", JSON.stringify(info));
        }
      } else {
        const savedInvite = localStorage.getItem("vyra_invite_coach");
        if (savedInvite) {
          try {
            setInviteData(JSON.parse(savedInvite));
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // Fetch registered coaches from backend
  useEffect(() => {
    fetch("/api/coaches")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const emails = data.map((c: any) => c.email?.toLowerCase()).filter(Boolean);
          if (emails.length > 0) {
            setRegisteredCoaches((prev) => Array.from(new Set([...prev, ...emails])));
          }
        }
      })
      .catch(() => {
        // Backend fallback
      });
  }, []);

  const setCurrentUserEmail = useCallback((email: string) => {
    const clean = email.trim().toLowerCase();
    setCurrentUserEmailState(clean);
    localStorage.setItem("vyra_user_email", clean);
  }, []);

  const setCurrentUserName = useCallback((name: string) => {
    const clean = name.trim();
    setCurrentUserNameState(clean);
    if (clean) localStorage.setItem("vyra_user_name", clean);
    else localStorage.removeItem("vyra_user_name");
  }, []);

  const setCurrentUserNickname = useCallback((nick: string) => {
    const clean = nick.trim();
    setCurrentUserNicknameState(clean);
    if (clean) localStorage.setItem("vyra_user_nickname", clean);
    else localStorage.removeItem("vyra_user_nickname");
  }, []);

  const isModeratorEmail = useCallback(
    (email: string) => {
      const clean = email.trim().toLowerCase();
      return registeredModerators.some((m) => m.toLowerCase() === clean);
    },
    [registeredModerators]
  );

  const isCoachEmail = useCallback(
    (email: string) => {
      const clean = email.trim().toLowerCase();
      return registeredCoaches.some((c) => c.toLowerCase() === clean);
    },
    [registeredCoaches]
  );

  const isPartnerEmail = useCallback(
    (email: string) => {
      const clean = email.trim().toLowerCase();
      return registeredPartners.some((p) => p.toLowerCase() === clean);
    },
    [registeredPartners]
  );

  const isPartner = useMemo(() => {
    return isPartnerEmail(currentUserEmail);
  }, [currentUserEmail, isPartnerEmail]);

  // Sincronização inicial de parceiros da API
  useEffect(() => {
    api
      .getPartners()
      .then((pts) => {
        if (pts && pts.length > 0) {
          const emails = pts.filter((p) => p.active).map((p) => p.email.toLowerCase());
          setRegisteredPartners((prev) => Array.from(new Set([...prev, ...emails])));
        }
      })
      .catch(() => {});
  }, []);

  // Assim que o Supabase confirmar o login, você faz esta verificação:
  const definirPerfil = useCallback(
    async (usuario: any) => {
      if (!usuario) return;
      const userEmail = (usuario.email || "").trim().toLowerCase();

      // 1. Verificação preliminar baseada em e-mail / metadados
      let detectedPersona: Persona = "student";

      if (
        userEmail === "suporte@vyratraining.com" ||
        userEmail === "cubocao@gmail.com" ||
        usuario.user_metadata?.role === "moderator" ||
        usuario.app_metadata?.role === "moderator" ||
        usuario.app_metadata?.role === "admin" ||
        registeredModerators.some((m) => m.toLowerCase() === userEmail)
      ) {
        detectedPersona = "moderator";
      } else if (
        usuario.user_metadata?.is_coach === true ||
        usuario.app_metadata?.is_coach === true ||
        usuario.user_metadata?.role === "coach" ||
        usuario.app_metadata?.role === "coach" ||
        registeredCoaches.some((c) => c.toLowerCase() === userEmail)
      ) {
        detectedPersona = "coach";
      }

      // 2. Consulta direta à tabela profiles do Supabase para verificar papel real e gamificação
      let profileRecord: any = null;
      try {
        if (usuario.id) {
          const { data: fetchedProfile, error } = await supabase
            .from("profiles")
            .select(
              "role, is_coach, full_name, name, nickname, avatar_url, is_champion, titles, points, rank, consecutive_months, is_veteran, monthly_fee_paid, patente_level, onboarding_completed, workout_released, diet_released, plan_active, plan_type"
            )
            .eq("id", usuario.id)
            .maybeSingle();

          profileRecord = fetchedProfile;

          // Sincronização do Nome e Apelido Reais com o banco de dados / metadados
          const realName =
            profileRecord?.full_name ||
            profileRecord?.name ||
            usuario.user_metadata?.full_name ||
            usuario.user_metadata?.name ||
            usuario.raw_user_meta_data?.full_name ||
            usuario.raw_user_meta_data?.name ||
            usuario.email?.split("@")[0] ||
            "Aluno";

          const realNickname =
            profileRecord?.nickname ||
            usuario.user_metadata?.nickname ||
            usuario.user_metadata?.display_name ||
            usuario.raw_user_meta_data?.nickname ||
            usuario.raw_user_meta_data?.display_name ||
            realName.split(" ")[0] ||
            realName;

          setCurrentUserNameState(realName);
          setCurrentUserNicknameState(realNickname);
          localStorage.setItem("vyra_user_name", realName);
          localStorage.setItem("vyra_user_nickname", realNickname);

          if (!error && profileRecord) {
            if (profileRecord.role === "coach" || profileRecord.is_coach === true) {
              detectedPersona = "coach";
            } else if (profileRecord.role === "moderator" || profileRecord.role === "admin") {
              detectedPersona = "moderator";
            } else if (profileRecord.role === "student") {
              detectedPersona = "student";
            }

            // Gamificação baseada ESTRITAMENTE nos dados do Supabase
            // Coroa: Apenas se is_champion === true ou se tiver 'campeao' em titles
            const isChamp = profileRecord.is_champion === true || (Array.isArray(profileRecord.titles) && profileRecord.titles.includes("campeao"));
            setIsChampionState(isChamp);
            localStorage.setItem("vyra_is_champion", String(isChamp));

            // Pontos e Patente (Rank): novos alunos obrigatoriamente iniciam com 0 pontos e patente base/nula
            const pts = typeof profileRecord.points === "number" ? profileRecord.points : 0;
            setUserPointsState(pts);
            localStorage.setItem("vyra_user_points", String(pts));

            const rk = profileRecord.rank || null;
            setUserRankState(rk);
            if (rk) localStorage.setItem("vyra_user_rank", rk);
            else localStorage.removeItem("vyra_user_rank");

            const months = typeof profileRecord.consecutive_months === "number" ? profileRecord.consecutive_months : 0;
            setConsecutiveMonthsState(months);
            localStorage.setItem("vyra_consecutive_months", String(months));

            const isPaid = Boolean(profileRecord.monthly_fee_paid);
            setMonthlyFeePaidState(isPaid);
            localStorage.setItem("vyra_monthly_fee_paid", String(isPaid));

            const vet = Boolean(profileRecord.is_veteran);
            setIsVeteranState(vet);
            localStorage.setItem("vyra_is_veteran", String(vet));

            const localObDone =
              localStorage.getItem("vyra_onboarding_completed") !== "false";
            const remoteObDone = Boolean(
              (profileRecord as any)?.onboarding_completed === true ||
              (profileRecord as any)?.anamnesis_done === true ||
              (profileRecord?.weight_kg && profileRecord?.height_cm)
            );
            const obDone = detectedPersona !== "student" || localObDone || remoteObDone;
            setOnboardingCompletedState(obDone);
            localStorage.setItem("vyra_onboarding_completed", String(obDone));

            const wkRel = (profileRecord as any)?.workout_released !== undefined
              ? Boolean((profileRecord as any).workout_released)
              : (detectedPersona !== "student");
            setWorkoutReleasedState(wkRel);
            localStorage.setItem("vyra_workout_released", String(wkRel));

            const dtRel = (profileRecord as any)?.diet_released !== undefined
              ? Boolean((profileRecord as any).diet_released)
              : (detectedPersona !== "student");
            setDietReleasedState(dtRel);
            localStorage.setItem("vyra_diet_released", String(dtRel));
          } else {
            // Se o perfil ainda não existir ou for novo aluno sem registros, zera tudo
            setIsChampionState(false);
            localStorage.setItem("vyra_is_champion", "false");
            setUserPointsState(0);
            localStorage.setItem("vyra_user_points", "0");
            setUserRankState(null);
            localStorage.removeItem("vyra_user_rank");
            setConsecutiveMonthsState(0);
            localStorage.setItem("vyra_consecutive_months", "0");
            setMonthlyFeePaidState(false);
            localStorage.setItem("vyra_monthly_fee_paid", "false");
            setIsVeteranState(false);
            localStorage.setItem("vyra_is_veteran", "false");

            const isStudent = detectedPersona === "student";
            const localObDone =
              localStorage.getItem("vyra_onboarding_completed") !== "false";
            const obDone = !isStudent || localObDone;
            setOnboardingCompletedState(obDone);
            localStorage.setItem("vyra_onboarding_completed", String(obDone));
            setWorkoutReleasedState(!isStudent);
            localStorage.setItem("vyra_workout_released", isStudent ? "false" : "true");
            setDietReleasedState(!isStudent);
            localStorage.setItem("vyra_diet_released", isStudent ? "false" : "true");
          }
        }
      } catch (e) {
        console.warn("Aviso ao ler perfil do Supabase:", e);
      }

      setPersonaState(detectedPersona);
      localStorage.setItem("vyra_persona", detectedPersona);

      // 3. Sincronização direta da assinatura ativa com o Supabase (consulta se o usuário possui plan_active === true)
      try {
        const isPlanActiveInProfile = Boolean(profileRecord?.plan_active === true);

        if (isPlanActiveInProfile) {
          const activeSub: Subscription = {
            active: true,
            status: "active",
            planId: profileRecord?.plan_type || "active_protocol",
            paymentMethod: "portal_web",
            in_grace_period: false,
            days_left_in_grace: 0,
          };
          setSubscriptionState(activeSub);
          localStorage.setItem("vyra_sub", JSON.stringify(activeSub));
        } else if (usuario.id) {
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", usuario.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (subData && subData.length > 0) {
            const sub = subData[0];
            const periodEndMs = sub.current_period_end ? new Date(sub.current_period_end).getTime() : NaN;
            const nowMs = Date.now();
            const isPastEnd = !isNaN(periodEndMs) && nowMs > periodEndMs;
            let isActive = sub.status === "active";
            let inGracePeriod = sub.status === "in_grace_period" || sub.in_grace_period === true;
            let daysLeftInGrace = 0;
            if (isPastEnd || sub.status === "past_due" || sub.status === "in_grace_period") {
              const daysOverdue = !isNaN(periodEndMs) ? (nowMs - periodEndMs) / (1000 * 60 * 60 * 24) : 1;
              if (daysOverdue <= 3) {
                inGracePeriod = true;
                isActive = true;
                daysLeftInGrace = Math.max(1, 3 - Math.floor(daysOverdue));
              } else {
                inGracePeriod = false;
                isActive = false;
              }
            }

            const newSub = {
              active: isActive,
              status: inGracePeriod ? "in_grace_period" : sub.status,
              planId: sub.plan_type,
              paymentMethod: sub.payment_method,
              currentPeriodEnd: sub.current_period_end,
              current_period_end: sub.current_period_end,
              in_grace_period: inGracePeriod,
              days_left_in_grace: daysLeftInGrace,
            };
            setSubscriptionState(newSub);
            localStorage.setItem("vyra_sub", JSON.stringify(newSub));
          } else {
            // Se for coach, não bloqueia
            if (detectedPersona !== "coach") {
              // Verifica se há status na API
              try {
                const apiSub = await api.getSubscription(usuario.id, userEmail);
                if (apiSub) {
                  const subObj = {
                    active: apiSub.active,
                    status: apiSub.status,
                    planId: apiSub.planId,
                    currentPeriodEnd: apiSub.currentPeriodEnd || (apiSub as any).current_period_end,
                    current_period_end: (apiSub as any).current_period_end || apiSub.currentPeriodEnd,
                    in_grace_period: (apiSub as any).in_grace_period,
                    days_left_in_grace: (apiSub as any).days_left_in_grace,
                  };
                  setSubscriptionState(subObj);
                  localStorage.setItem("vyra_sub", JSON.stringify(subObj));
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn("Aviso ao ler assinatura do Supabase:", err);
      }
    },
    [registeredModerators, registeredCoaches]
  );

  // Sincronização e verificação de permissões do usuário logado no Supabase
  useEffect(() => {
    // 1. Checa sessão ativa no Supabase
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          if (session.user.email) {
            const userEmail = session.user.email.trim().toLowerCase();
            setCurrentUserEmailState(userEmail);
            setLoggedInState(true);
          }
          definirPerfil(session.user);
        }
      })
      .catch(() => {
        // Fallback seguro caso Supabase offline ou em dev
      });

    // 2. Ouve alterações de autenticação no Supabase
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.user.email) {
          const userEmail = session.user.email.trim().toLowerCase();
          setCurrentUserEmailState(userEmail);
          setLoggedInState(true);
        }
        definirPerfil(session.user);
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [definirPerfil]);

  const addCoachEmail = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      const clean = email.trim().toLowerCase();
      if (!clean || !clean.includes("@")) {
        return { success: false, message: "E-mail inválido." };
      }

      if (registeredCoaches.some((c) => c.toLowerCase() === clean)) {
        return { success: false, message: "Este e-mail já está cadastrado como Coach." };
      }

      try {
        await fetch("/api/coaches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: clean }),
        });
      } catch (err) {
        console.error("Erro ao salvar coach na API:", err);
      }

      const updated = [clean, ...registeredCoaches];
      setRegisteredCoaches(updated);
      try {
        localStorage.setItem("vyra_registered_coaches", JSON.stringify(updated));
      } catch {
        // Fallback
      }

      return {
        success: true,
        message: `Coach com e-mail "${clean}" credenciado com sucesso! O acesso já está liberado.`,
      };
    },
    [registeredCoaches]
  );

  const toggleCoachStatus = useCallback(
    async (idOrEmail: string) => {
      try {
        await fetch(`/api/coaches/${idOrEmail}/toggle`, { method: "POST" });
      } catch {
        // Fallback
      }
    },
    []
  );

  const addModeratorEmail = useCallback(
    (email: string): { success: boolean; message: string } => {
      const clean = email.trim().toLowerCase();
      if (!clean || !clean.includes("@")) {
        return { success: false, message: "E-mail de moderador inválido." };
      }

      if (registeredModerators.some((m) => m.toLowerCase() === clean)) {
        return { success: false, message: "Este e-mail já é um moderador cadastrado." };
      }

      const updated = [...registeredModerators, clean];
      setRegisteredModerators(updated);
      try {
        localStorage.setItem("vyra_registered_moderators", JSON.stringify(updated));
      } catch {
        // Fallback
      }

      return {
        success: true,
        message: `Novo moderador "${clean}" cadastrado com sucesso na governança!`,
      };
    },
    [registeredModerators]
  );

  const loginWithEmail = useCallback(
    (email: string): { success: boolean; role: Persona; message: string } => {
      const clean = email.trim().toLowerCase();
      if (!clean) {
        return { success: false, role: "student", message: "Informe um e-mail válido." };
      }

      setCurrentUserEmail(clean);
      setLoggedInState(true);
      localStorage.setItem("vyra_logged_in", "true");

      if (isModeratorEmail(clean)) {
        setPersonaState("moderator");
        localStorage.setItem("vyra_persona", "moderator");
        setActiveView("moderator");
        return {
          success: true,
          role: "moderator",
          message: "Autenticado como Moderador Oficial com sucesso!",
        };
      }

      if (isCoachEmail(clean)) {
        setPersonaState("coach");
        localStorage.setItem("vyra_persona", "coach");
        setActiveView("coach");
        return {
          success: true,
          role: "coach",
          message: "Autenticado como Coach Credenciado com sucesso!",
        };
      }

      if (isPartnerEmail(clean)) {
        setIsVeteranState(true);
        localStorage.setItem("vyra_is_veteran", "true");
        setPersonaState("student");
        localStorage.setItem("vyra_persona", "student");
        setActiveView("home");
        return {
          success: true,
          role: "student",
          message: "Autenticado como Parceiro Oficial VIP (Selo de Veterano Concedido)!",
        };
      }

      // Standard student
      setPersonaState("student");
      localStorage.setItem("vyra_persona", "student");
      setActiveView("home");
      return {
        success: true,
        role: "student",
        message: "Autenticado como Aluno com sucesso!",
      };
    },
    [isModeratorEmail, isCoachEmail, isPartnerEmail, setCurrentUserEmail]
  );

  const dismissInviteBanner = useCallback(() => {
    setInviteData(null);
    try {
      localStorage.removeItem("vyra_invite_coach");
    } catch {
      // Fallback
    }
  }, []);

  const clearUnreadCommunity = useCallback(() => {
    setUnreadCommunityCount(0);
    try {
      localStorage.setItem("vyra_unread_community", "0");
    } catch {
      // Fallback
    }
  }, []);

  const toggleCreatineCheck = useCallback((timeKey: string) => {
    setCreatineChecks((prev) => {
      const next = { ...prev, [timeKey]: !prev[timeKey] };
      try {
        localStorage.setItem("vyra_creatine_checks", JSON.stringify(next));
      } catch {
        // Fallback
      }
      return next;
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    if (persona === "coach") {
      setCoachNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        try {
          localStorage.setItem("vyra_coach_notifications", JSON.stringify(next));
        } catch {}
        return next;
      });
    } else {
      setStudentNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        try {
          localStorage.setItem("vyra_system_notifications", JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [persona]);

  const markNotificationAsRead = useCallback((id: string) => {
    if (persona === "coach") {
      setCoachNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        try {
          localStorage.setItem("vyra_coach_notifications", JSON.stringify(next));
        } catch {}
        return next;
      });
    } else {
      setStudentNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        try {
          localStorage.setItem("vyra_system_notifications", JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [persona]);

  const markAllNotificationsAsRead = useCallback(() => {
    if (persona === "coach") {
      setCoachNotifications((prev) => {
        const next = prev.map((n) => ({ ...n, read: true }));
        try {
          localStorage.setItem("vyra_coach_notifications", JSON.stringify(next));
        } catch {}
        return next;
      });
    } else {
      setStudentNotifications((prev) => {
        const next = prev.map((n) => ({ ...n, read: true }));
        try {
          localStorage.setItem("vyra_system_notifications", JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [persona]);

  const sendNotification = useCallback(
    (title: string, message: string, type: AppNotification["type"] = "general") => {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title,
        message,
        type,
        timestamp: "Agora",
        read: false,
      };

      if (persona === "coach") {
        setCoachNotifications((prev) => {
          const next = [newNotif, ...prev.slice(0, 9)];
          try {
            localStorage.setItem("vyra_coach_notifications", JSON.stringify(next));
          } catch {}
          return next;
        });
      } else {
        setStudentNotifications((prev) => {
          const next = [newNotif, ...prev.slice(0, 9)];
          try {
            localStorage.setItem("vyra_system_notifications", JSON.stringify(next));
          } catch {}
          return next;
        });
      }

      // Try browser push notification if supported and granted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          // Native Notification for desktop & mobile
          const notif = new Notification(`VYRA · ${title}`, {
            body: message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: type,
            // @ts-ignore
            vibrate: [200, 100, 200],
          });
          // Also try mobile navigator.vibrate if available
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        } catch {
          // Native notification fallback
        }
      }
    },
    [persona]
  );

  // Recurring 2-hour water reminder ONLY for student persona
  useEffect(() => {
    if (persona !== "student") return;

    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      sendNotification(
        "💧 Hora de Beber Água (Lembrete 2h)",
        "Mantenha sua hidratação! Beba 250ml - 300ml de água agora para otimizar sua recuperação e síntese proteica.",
        "water"
      );
    }, TWO_HOURS_MS);

    return () => clearInterval(interval);
  }, [persona, sendNotification]);

  const requestPushPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermissionState(perm);
      if (perm === "granted") {
        sendNotification(
          "Notificações Ativadas!",
          "Você receberá mensagens do Coach, avisos de água e horários de creatina direto na barra do seu celular.",
          "coach"
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [sendNotification]);

  const setPersona = useCallback(
    (p: Persona) => {
      const normalizedPersona: Persona = p === "aluno" ? "student" : p;
      const cleanEmail = currentUserEmail.trim().toLowerCase();
      if (normalizedPersona === "moderator" && !isModeratorEmail(cleanEmail)) {
        console.warn("Acesso restrito: e-mail não cadastrado como moderador.");
        return;
      }
      if (normalizedPersona === "coach" && !isCoachEmail(cleanEmail)) {
        console.warn("Acesso restrito: e-mail não credenciado como treinador/coach.");
        return;
      }
      setPersonaState(normalizedPersona);
      localStorage.setItem("vyra_persona", normalizedPersona);
    },
    [currentUserEmail, isModeratorEmail, isCoachEmail]
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("vyra_lang", l);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("vyra_theme", t);
  }, []);

  const setLoggedIn = useCallback((v: boolean) => {
    setLoggedInState(v);
    localStorage.setItem("vyra_logged_in", String(v));
    if (!v) {
      setCurrentUserEmailState("");
      setPersonaState("student");
      setActiveView("home");
      try {
        supabase.auth.signOut().catch(() => {});
      } catch {}
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
    localStorage.removeItem("vyra_logged_in");
    localStorage.removeItem("vyra_current_user_email");
    localStorage.removeItem("vyra_user_name");
    localStorage.removeItem("vyra_user_nickname");
    localStorage.removeItem("vyra_persona");
    localStorage.removeItem("vyra_profile");
    localStorage.removeItem("vyra_is_champion");
    localStorage.removeItem("vyra_user_points");
    localStorage.removeItem("vyra_user_rank");
    localStorage.removeItem("vyra_is_veteran");
    localStorage.removeItem("vyra_consecutive_months");
    localStorage.removeItem("vyra_monthly_fee_paid");
    localStorage.setItem("vyra_logged_in", "false");

    setCurrentUserNameState("");
    setCurrentUserNicknameState("");
    setIsChampionState(false);
    setUserPointsState(0);
    setUserRankState(null);
    setIsVeteranState(false);
    setConsecutiveMonthsState(0);
    setMonthlyFeePaidState(false);

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}

    setLoggedInState(false);
    setCurrentUserEmailState("");
    setPersonaState("student");
    setOnboardingCompletedState(false);
    setWorkoutReleasedState(false);
    setDietReleasedState(false);
    localStorage.removeItem("vyra_onboarding_completed");
    localStorage.removeItem("vyra_workout_released");
    localStorage.removeItem("vyra_diet_released");
    setActiveView("home");
  }, []);

  const setAnamnesisDone = useCallback((v: boolean) => {
    setAnamnesisDoneState(v);
    localStorage.setItem("vyra_anamnesis", String(v));
  }, []);

  const setPhotosDone = useCallback((v: boolean) => {
    setPhotosDoneState(v);
    localStorage.setItem("vyra_photos_done", String(v));
  }, []);

  const setSubscription = useCallback((s: Subscription) => {
    setSubscriptionState(s);
    localStorage.setItem("vyra_sub", JSON.stringify(s));
  }, []);

  const setTrackWeightsEnabled = useCallback((enabled: boolean) => {
    setTrackWeightsEnabledState(enabled);
    localStorage.setItem("vyra_track_weights_enabled", String(enabled));
  }, []);

  const setIsVeteran = useCallback((v: boolean) => {
    setIsVeteranState(v);
    localStorage.setItem("vyra_is_veteran", String(v));
  }, []);

  const setConsecutiveMonths = useCallback((m: number) => {
    const val = Math.max(0, m);
    setConsecutiveMonthsState(val);
    localStorage.setItem("vyra_consecutive_months", String(val));
  }, []);

  const setMonthlyFeePaid = useCallback((paid: boolean) => {
    setMonthlyFeePaidState(paid);
    localStorage.setItem("vyra_monthly_fee_paid", String(paid));
  }, []);

  const updateRecurrence = useCallback(
    (months: number, isPaid: boolean) => {
      const prevMonths = consecutiveMonths;
      const prevPaid = monthlyFeePaid;

      setMonthlyFeePaidState(isPaid);
      try {
        localStorage.setItem("vyra_monthly_fee_paid", String(isPaid));
      } catch {}

      if (isPaid) {
        const val = Math.max(0, months);
        setConsecutiveMonthsState(val);
        try {
          localStorage.setItem("vyra_consecutive_months", String(val));
        } catch {}

        // Trigger celebratory animation for student when reaching 5 stars (every 5 months) or leveling up patent!
        if (val >= 5 && (prevMonths < 5 || Math.floor(val / 5) > Math.floor(prevMonths / 5))) {
          setMilestoneCelebration({
            type: "five_stars",
            months: val,
            title: "🌟 Estrela Evoluída Desbloqueada!",
            subtitle: `Você atingiu ${val} meses ininterruptos! Suas 5 estrelas evoluíram e você liberou a personalização de cores do Chat Global.`,
          });
        } else if (val > prevMonths && val >= 3) {
          setMilestoneCelebration({
            type: "patent",
            months: val,
            title: "Ascensão de Patente por Disciplina!",
            subtitle: `Parabéns pela dedicação! Seu tempo de fidelidade garantiu uma nova medalha militar de honra.`,
          });
        }
      }
    },
    [consecutiveMonths, monthlyFeePaid]
  );

  const applyVeteranCoupon = useCallback((code: string) => {
    const upper = (code || "").trim().toUpperCase();
    if (upper === "VETERANO") {
      setIsVeteran(true);
      api.redeemCoupon("VETERANO").catch(() => {});
      setMilestoneCelebration({
        type: "veteran",
        title: "Selo de Veterano Concedido!",
        subtitle: "Você agora ostenta a Coroa Oficial de Veterano Vyra e desconto vitalício na assinatura!",
      });
      return {
        success: true,
        message: "Selo de Veterano ativado com sucesso! Parabéns.",
      };
    }
    return {
      success: false,
      message: "Cupom inválido. Digite 'VETERANO'.",
    };
  }, [setIsVeteran]);

  const fmtPrice = useCallback(
    (brl: number, usd: number) => {
      if (lang === "pt") {
        return `R$ ${brl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `$ ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [lang]
  );

  const currencySymbol = useMemo(() => (lang === "pt" ? "R$" : "$"), [lang]);

  const t = useCallback(
    (k: string) => {
      const translations = dict[lang] || dict.pt;
      return (translations as Record<string, string>)[k] || k;
    },
    [lang]
  );

  return (
    <AppContext.Provider
      value={{
        persona,
        lang,
        theme,
        loggedIn,
        anamnesisDone,
        photosDone,
        subscription,
        activeView,
        selectedPlan,
        unreadCommunityCount,
        clearUnreadCommunity,
        systemNotifications,
        dismissNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendNotification,
        requestPushPermission,
        pushPermissionState,
        creatineChecks,
        toggleCreatineCheck,
        currentUserEmail,
        setCurrentUserEmail,
        currentUserName,
        setCurrentUserName,
        currentUserNickname,
        setCurrentUserNickname,
        registeredModerators,
        registeredCoaches,
        registeredPartners,
        isModeratorEmail,
        isCoachEmail,
        isPartnerEmail,
        isPartner,
        addCoachEmail,
        toggleCoachStatus,
        addModeratorEmail,
        loginWithEmail,
        inviteData,
        setInviteData,
        dismissInviteBanner,
        setPersona,
        definirPerfil,
        setLang,
        setTheme,
        setLoggedIn,
        logout,
        setAnamnesisDone,
        setPhotosDone,
        setSubscription,
        trackWeightsEnabled,
        setTrackWeightsEnabled,
        isChampion,
        setIsChampion,
        userPoints,
        setUserPoints,
        userRank,
        setUserRank,
        isVeteran: isPartner ? true : isVeteran,
        setIsVeteran,
        consecutiveMonths,
        setConsecutiveMonths,
        monthlyFeePaid,
        setMonthlyFeePaid,
        updateRecurrence,
        applyVeteranCoupon,
        chatNameColor,
        chatTextColor,
        setChatColors,
        vipChatUnlocked,
        setVipChatUnlocked,
        hasVipChatColors,
        onboardingCompleted,
        setOnboardingCompleted,
        workoutReleased,
        setWorkoutReleased,
        dietReleased,
        setDietReleased,
        milestoneCelebration,
        triggerMilestoneCelebration,
        dismissMilestoneCelebration,
        setActiveView,
        setSelectedPlan,
        fmtPrice,
        currencySymbol,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
