import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Persona, Lang, Theme, Subscription, Plan, BillingCycle } from "../types";

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
  | "photo-gallery";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "coach" | "water" | "creatine" | "assessment" | "general";
  timestamp: string;
  read: boolean;
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
  sendNotification: (title: string, message: string, type?: AppNotification["type"]) => void;
  requestPushPermission: () => Promise<boolean>;
  pushPermissionState: NotificationPermission | "default";
  creatineChecks: Record<string, boolean>;
  toggleCreatineCheck: (timeKey: string) => void;
  setPersona: (p: Persona) => void;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setLoggedIn: (v: boolean) => void;
  setAnamnesisDone: (v: boolean) => void;
  setPhotosDone: (v: boolean) => void;
  setSubscription: (s: Subscription) => void;
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
    "ana.title": "Anamnese Esportiva",
    "ana.desc": "Mapeamento metabólico, objetivos e restrições para máxima precisão.",
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
    "ana.title": "Sports Anamnesis",
    "ana.desc": "Metabolic mapping, goals and restrictions for maximum precision.",
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
  const [loggedIn, setLoggedInState] = useState(true);
  const [anamnesisDone, setAnamnesisDoneState] = useState(false);
  const [photosDone, setPhotosDoneState] = useState(false);
  const [subscription, setSubscriptionState] = useState<Subscription>({ active: false });
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [selectedPlan, setSelectedPlan] = useState<{ plan: Plan; cycle: BillingCycle } | null>(null);

  // Community unread badge state (when clicked, disappears)
  const [unreadCommunityCount, setUnreadCommunityCount] = useState<number>(3);

  // System notifications state (Coach message, Water, Creatine, Assessment)
  const [systemNotifications, setSystemNotifications] = useState<AppNotification[]>([
    {
      id: "notif-coach-1",
      title: "Mensagem do Coach Manoel",
      message: "Seu treino de hoje foi ajustado com foco em progressive overload! Beba 3L de água.",
      type: "coach",
      timestamp: "Agora",
      read: false,
    },
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
  ]);

  const [pushPermissionState, setPushPermissionState] = useState<NotificationPermission | "default">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  // Creatine checks for the day
  const [creatineChecks, setCreatineChecks] = useState<Record<string, boolean>>({});

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

      if (p) setPersonaState(p as Persona);
      if (l) setLangState(l as Lang);
      if (t) setThemeState(t as Theme);
      if (li !== null) setLoggedInState(li === "true");
      if (an !== null) setAnamnesisDoneState(an === "true");
      if (ph !== null) setPhotosDoneState(ph === "true");
      if (s) setSubscriptionState(JSON.parse(s));
      if (unread !== null) setUnreadCommunityCount(parseInt(unread, 10) || 0);
      if (savedCreatine) setCreatineChecks(JSON.parse(savedCreatine));
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
    setSystemNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

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

      setSystemNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);

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
    []
  );

  // Recurring 2-hour water reminder for student
  useEffect(() => {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      sendNotification(
        "💧 Hora de Beber Água (Lembrete 2h)",
        "Mantenha sua hidratação! Beba 250ml - 300ml de água agora para otimizar sua recuperação e síntese proteica.",
        "water"
      );
    }, TWO_HOURS_MS);

    return () => clearInterval(interval);
  }, [sendNotification]);

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

  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p);
    localStorage.setItem("vyra_persona", p);
  }, []);

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

  const fmtPrice = useCallback(
    (brl: number, usd: number) => {
      if (lang === "pt") {
        return `R$ ${brl.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
      return `$ ${usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        sendNotification,
        requestPushPermission,
        pushPermissionState,
        creatineChecks,
        toggleCreatineCheck,
        setPersona,
        setLang,
        setTheme,
        setLoggedIn,
        setAnamnesisDone,
        setPhotosDone,
        setSubscription,
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
