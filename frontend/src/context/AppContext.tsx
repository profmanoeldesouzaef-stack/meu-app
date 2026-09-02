import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Persona = "student" | "coach" | "moderator";
export type Lang = "pt" | "en";
export type Theme = "dark" | "light";

type Subscription = { active: boolean; planId?: string; cycle?: "month" | "quarter" | "year" };

type Palette = {
  bg: string; surface: string; surface2: string; border: string; borderStrong: string;
  text: string; textDim: string; brand: string; brand2: string; gold: string; pink: string; blue: string;
  success: string; error: string; overlay: string;
};

type AppState = {
  persona: Persona;
  lang: Lang;
  theme: Theme;
  loggedIn: boolean;
  anamnesisDone: boolean;
  subscription: Subscription;
  colors: Palette;
  setPersona: (p: Persona) => void;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setLoggedIn: (v: boolean) => void;
  setAnamnesisDone: (v: boolean) => void;
  setSubscription: (s: Subscription) => void;
  fmtPrice: (brl: number, usd: number) => string;
  currencySymbol: () => string;
  t: (k: string) => string;
};

const AppCtx = createContext<AppState | null>(null);

const DARK: Palette = {
  bg: "#0A0A0A", surface: "#151515", surface2: "#1D1D1F", border: "#2B2B2F", borderStrong: "#4A4A52",
  text: "#F5F5F7", textDim: "#9B9BA1", brand: "#FF6A2A", brand2: "#FF9A62",
  gold: "#D8B46A", pink: "#D96E92", blue: "#6D9BFF",
  success: "#34C759", error: "#FF3B30", overlay: "rgba(0,0,0,0.6)",
};
const LIGHT: Palette = {
  bg: "#F5F3EE", surface: "#FFFFFF", surface2: "#F0EDE5", border: "#E4DFD3", borderStrong: "#C9C2B2",
  text: "#141414", textDim: "#666666", brand: "#FF6A2A", brand2: "#FF9A62",
  gold: "#B8933D", pink: "#C2547C", blue: "#3F73E5",
  success: "#1E8E3E", error: "#D93025", overlay: "rgba(20,20,20,0.35)",
};

const dict = {
  pt: {
    "app.name": "VYRA", "app.tagline": "Training & Performance",
    "cta.enter_demo": "Entrar em modo demonstração",
    "cta.login": "Entrar", "cta.signup": "Criar conta", "cta.forgot": "Recuperar acesso",
    "cta.continue": "Continuar", "cta.confirm_purchase": "Confirmar compra", "cta.apply": "Aplicar",
    "cta.mark_done": "Marcar como feita", "cta.finish_workout": "Finalizar treino",
    "cta.analyze": "Analisar execução", "cta.save": "Salvar", "cta.close": "Fechar",
    "cta.send": "Enviar", "cta.publish": "Publicar transformação", "cta.logout": "Sair",
    "cta.premium": "Ver planos", "cta.add_weight": "Registrar peso", "cta.edit": "Editar",
    "cta.ai_suggest": "IA sugerir", "cta.analyze_plate": "Analisar prato", "cta.start_anamnesis": "Preencher anamnese",
    "cta.broadcast": "Enviar aviso", "cta.new_challenge": "Novo desafio",
    "cta.close_challenge": "Encerrar & mover pra Hall", "cta.vote": "Votar",
    "sec.hi": "Olá", "sec.weekly": "Progresso da semana",
    "sec.today_workout": "Treino do dia", "sec.macros": "Macros do dia", "sec.shortcuts": "Atalhos",
    "sec.challenges": "Desafios", "sec.community": "Comunidade", "sec.evolution": "Evolução",
    "sec.diet": "Dieta", "sec.training": "Treino", "sec.profile": "Perfil", "sec.home": "Início",
    "sec.progress": "Evolução", "sec.reminders": "Lembretes", "sec.water": "Hidratação",
    "sec.creatine": "Creatina", "sec.coach_message": "Mensagem do coach", "sec.hall": "Hall da Fama",
    "sec.active": "Em andamento", "sec.perimetry": "Perimetria",
    "tab.home": "Início", "tab.training": "Treinos", "tab.diet": "Dieta", "tab.progress": "Evolução",
    "tab.profile": "Perfil", "tab.challenges": "Desafios",
    "paywall.title": "Escolha seu protocolo",
    "paywall.sub": "Metas, ciência e coach — feitos para performance real.",
    "paywall.monthly": "Mensal", "paywall.quarterly": "Trimestral", "paywall.yearly": "Anual",
    "paywall.per_month": "/mês", "paywall.per_quarter": "/tri", "paywall.per_year": "/ano",
    "paywall.coming": "Em breve · Vyra Kids", "paywall.most_wanted": "Mais solicitado",
    "paywall.blocked": "Preencha a anamnese antes de assinar",
    "checkout.title": "Finalizar assinatura", "checkout.summary": "Resumo",
    "checkout.coupon": "Cupom", "checkout.enter_coupon": "Digite um cupom",
    "checkout.subtotal": "Subtotal", "checkout.discount": "Desconto", "checkout.total": "Total",
    "checkout.applied": "Cupom aplicado", "checkout.invalid": "Cupom inválido ou inativo",
    "training.exercises": "Exercícios", "training.rest": "Descanso", "training.done": "Concluído",
    "training.coach_note": "Nota do coach", "training.video": "Ver execução",
    "form.title": "Form Checker · IA", "form.desc": "Análise de execução assistida por IA.",
    "form.checklist": "Checklist de execução", "form.result": "Resultado",
    "form.score": "Nota técnica", "form.run": "Rodar análise",
    "diet.calc": "Macro-calculadora", "diet.kcal": "Calorias", "diet.protein": "Proteínas",
    "diet.carbs": "Carboidratos", "diet.fats": "Gorduras", "diet.foods": "Alimentos",
    "diet.substitute": "Substituir", "diet.ai_title": "IA · alimentos alternativos",
    "diet.plate_title": "IA · Analisar prato",
    "diet.plate_desc": "Envie a foto do seu prato e a IA estima kcal, proteína, carbo e gordura.",
    "diet.plate_upload": "Enviar foto",
    "meal.breakfast": "Café da manhã", "meal.lunch": "Almoço", "meal.snack": "Lanche",
    "meal.dinner": "Jantar", "meal.supper": "Ceia",
    "evo.current": "Peso atual", "evo.history": "Histórico", "evo.gallery": "Galeria do shape",
    "evo.add": "Adicionar registro",
    "ch.title": "Desafios", "ch.sub": "Antes / Depois da comunidade Vyra",
    "ch.filter.all": "Todos", "ch.filter.reset12": "Reset 12", "ch.filter.shape": "Shape", "ch.filter.forge": "Forge",
    "ch.weeks": "semanas", "ch.votes": "votos",
    "comm.title": "Chat global", "comm.placeholder": "Mensagem para o clube… (máx 200)",
    "profile.persona": "Persona demo", "profile.student": "Aluno", "profile.coach": "Coach",
    "profile.moderator": "Moderador", "profile.language": "Idioma", "profile.subscription": "Assinatura",
    "profile.active": "Ativa", "profile.inactive": "Não assinado",
    "profile.version": "Versão 1.1.0 · demo", "profile.admin": "Painel gerencial",
    "profile.nickname": "Apelido", "profile.height": "Altura (cm)", "profile.weight": "Peso (kg)",
    "profile.waist": "Cintura (cm)", "profile.right_arm": "Braço dir (cm)",
    "profile.left_arm": "Braço esq (cm)", "profile.right_leg": "Perna dir (cm)",
    "profile.left_leg": "Perna esq (cm)", "profile.theme": "Tema", "profile.dark": "Escuro", "profile.light": "Claro",
    "profile.water_target": "Meta de água (ml)", "profile.creatine_dose": "Dose creatina (g)",
    "profile.creatine_times": "Horários (separe por vírgula)",
    "profile.edit": "Editar perfil",
    "coach.title": "Painel gerencial", "coach.overview": "Visão geral", "coach.finance": "Financeiro",
    "coach.workouts": "Treinos", "coach.diet": "Dieta", "coach.challenges": "Desafios",
    "coach.radar": "Radar", "coach.broadcast": "Aviso",
    "coach.new_coupon": "Novo cupom", "coach.partners": "Parceiros isentos",
    "coach.new_workout": "Editar treino do aluno",
    "coach.edit_diet": "Editar dieta do aluno", "coach.new_challenge": "Criar novo desafio",
    "coach.alerts": "Alertas ativos", "coach.disable": "Desativar", "coach.enable": "Ativar",
    "mod.title": "Painel do Moderador", "mod.add_coach": "Adicionar coach por e-mail",
    "mod.coach_email": "E-mail do coach",
    "login.subtitle": "Clube premium de treino e performance",
    "login.email": "E-mail", "login.password": "Senha",
    "ana.title": "Anamnese", "ana.desc": "Antes de assinar, precisamos entender você.",
    "ana.age": "Idade", "ana.gender": "Gênero (M/F/Outro)", "ana.height": "Altura (cm)",
    "ana.weight": "Peso (kg)", "ana.goal": "Objetivo", "ana.activity": "Nível de atividade",
    "ana.restrictions": "Restrições alimentares", "ana.allergies": "Alergias",
    "ana.medical": "Observações médicas", "ana.photos": "Fotos frente/lado/costas (opcional)",
    "ana.front": "Foto frente", "ana.side": "Foto lado", "ana.back": "Foto costas",
    "ana.done": "Anamnese salva ✔",
  },
  en: {
    "app.name": "VYRA", "app.tagline": "Training & Performance",
    "cta.enter_demo": "Enter demo mode", "cta.login": "Sign in", "cta.signup": "Create account",
    "cta.forgot": "Recover access", "cta.continue": "Continue", "cta.confirm_purchase": "Confirm purchase",
    "cta.apply": "Apply", "cta.mark_done": "Mark as done", "cta.finish_workout": "Finish workout",
    "cta.analyze": "Analyze form", "cta.save": "Save", "cta.close": "Close", "cta.send": "Send",
    "cta.publish": "Share transformation", "cta.logout": "Sign out", "cta.premium": "View plans",
    "cta.add_weight": "Log weight", "cta.edit": "Edit", "cta.ai_suggest": "AI suggest",
    "cta.analyze_plate": "Analyze plate", "cta.start_anamnesis": "Fill anamnesis",
    "cta.broadcast": "Send broadcast", "cta.new_challenge": "New challenge",
    "cta.close_challenge": "Close & move to Hall", "cta.vote": "Vote",
    "sec.hi": "Hey", "sec.weekly": "Weekly progress", "sec.today_workout": "Today's workout",
    "sec.macros": "Today's macros", "sec.shortcuts": "Shortcuts", "sec.challenges": "Challenges",
    "sec.community": "Community", "sec.evolution": "Evolution", "sec.diet": "Diet",
    "sec.training": "Training", "sec.profile": "Profile", "sec.home": "Home", "sec.progress": "Evolution",
    "sec.reminders": "Reminders", "sec.water": "Hydration", "sec.creatine": "Creatine",
    "sec.coach_message": "Coach broadcast", "sec.hall": "Hall of Fame", "sec.active": "Ongoing",
    "sec.perimetry": "Perimetry",
    "tab.home": "Home", "tab.training": "Training", "tab.diet": "Diet", "tab.progress": "Evolution",
    "tab.profile": "Profile", "tab.challenges": "Challenges",
    "paywall.title": "Pick your protocol", "paywall.sub": "Goals, science and coach — built for real performance.",
    "paywall.monthly": "Monthly", "paywall.quarterly": "Quarterly", "paywall.yearly": "Yearly",
    "paywall.per_month": "/mo", "paywall.per_quarter": "/qtr", "paywall.per_year": "/yr",
    "paywall.coming": "Coming soon · Vyra Kids", "paywall.most_wanted": "Most wanted",
    "paywall.blocked": "Fill the anamnesis before subscribing",
    "checkout.title": "Complete subscription", "checkout.summary": "Summary",
    "checkout.coupon": "Coupon", "checkout.enter_coupon": "Enter a coupon",
    "checkout.subtotal": "Subtotal", "checkout.discount": "Discount", "checkout.total": "Total",
    "checkout.applied": "Coupon applied", "checkout.invalid": "Invalid or inactive coupon",
    "training.exercises": "Exercises", "training.rest": "Rest", "training.done": "Done",
    "training.coach_note": "Coach note", "training.video": "Watch demo",
    "form.title": "Form Checker · AI", "form.desc": "AI-assisted form analysis.",
    "form.checklist": "Execution checklist", "form.result": "Result",
    "form.score": "Technical score", "form.run": "Run analysis",
    "diet.calc": "Macro calculator", "diet.kcal": "Calories", "diet.protein": "Protein",
    "diet.carbs": "Carbs", "diet.fats": "Fats", "diet.foods": "Foods", "diet.substitute": "Swap",
    "diet.ai_title": "AI · alternative foods",
    "diet.plate_title": "AI · Analyze plate",
    "diet.plate_desc": "Upload a photo of your plate and AI will estimate kcal, protein, carbs, fats.",
    "diet.plate_upload": "Upload photo",
    "meal.breakfast": "Breakfast", "meal.lunch": "Lunch", "meal.snack": "Snack",
    "meal.dinner": "Dinner", "meal.supper": "Supper",
    "evo.current": "Current weight", "evo.history": "History", "evo.gallery": "Shape gallery",
    "evo.add": "Log entry",
    "ch.title": "Challenges", "ch.sub": "Before / After from the Vyra club",
    "ch.filter.all": "All", "ch.filter.reset12": "Reset 12", "ch.filter.shape": "Shape", "ch.filter.forge": "Forge",
    "ch.weeks": "weeks", "ch.votes": "votes",
    "comm.title": "Global chat", "comm.placeholder": "Message the club… (max 200)",
    "profile.persona": "Demo persona", "profile.student": "Student", "profile.coach": "Coach",
    "profile.moderator": "Moderator", "profile.language": "Language", "profile.subscription": "Subscription",
    "profile.active": "Active", "profile.inactive": "Not subscribed",
    "profile.version": "Version 1.1.0 · demo", "profile.admin": "Admin dashboard",
    "profile.nickname": "Nickname", "profile.height": "Height (cm)", "profile.weight": "Weight (kg)",
    "profile.waist": "Waist (cm)", "profile.right_arm": "Right arm (cm)", "profile.left_arm": "Left arm (cm)",
    "profile.right_leg": "Right leg (cm)", "profile.left_leg": "Left leg (cm)",
    "profile.theme": "Theme", "profile.dark": "Dark", "profile.light": "Light",
    "profile.water_target": "Water target (ml)", "profile.creatine_dose": "Creatine dose (g)",
    "profile.creatine_times": "Times (comma separated)", "profile.edit": "Edit profile",
    "coach.title": "Admin dashboard", "coach.overview": "Overview", "coach.finance": "Finance",
    "coach.workouts": "Workouts", "coach.diet": "Diet", "coach.challenges": "Challenges",
    "coach.radar": "Radar", "coach.broadcast": "Broadcast",
    "coach.new_coupon": "New coupon", "coach.partners": "Free partners",
    "coach.new_workout": "Edit student workout", "coach.edit_diet": "Edit student diet",
    "coach.new_challenge": "Create new challenge",
    "coach.alerts": "Active alerts", "coach.disable": "Disable", "coach.enable": "Enable",
    "mod.title": "Moderator panel", "mod.add_coach": "Add coach by email",
    "mod.coach_email": "Coach email",
    "login.subtitle": "Premium training & performance club",
    "login.email": "Email", "login.password": "Password",
    "ana.title": "Anamnesis", "ana.desc": "Before subscribing, we need to know you.",
    "ana.age": "Age", "ana.gender": "Gender (M/F/Other)", "ana.height": "Height (cm)",
    "ana.weight": "Weight (kg)", "ana.goal": "Goal", "ana.activity": "Activity level",
    "ana.restrictions": "Dietary restrictions", "ana.allergies": "Allergies",
    "ana.medical": "Medical notes", "ana.photos": "Front / side / back photos (optional)",
    "ana.front": "Front photo", "ana.side": "Side photo", "ana.back": "Back photo",
    "ana.done": "Anamnesis saved ✔",
  },
} as const;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersonaState] = useState<Persona>("student");
  const [lang, setLangState] = useState<Lang>("pt");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [loggedIn, setLoggedInState] = useState(false);
  const [anamnesisDone, setAnamnesisDoneState] = useState(false);
  const [subscription, setSubscriptionState] = useState<Subscription>({ active: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, l, th, li, an, s] = await Promise.all([
        AsyncStorage.getItem("vyra.persona"),
        AsyncStorage.getItem("vyra.lang"),
        AsyncStorage.getItem("vyra.theme"),
        AsyncStorage.getItem("vyra.loggedIn"),
        AsyncStorage.getItem("vyra.anamnesis"),
        AsyncStorage.getItem("vyra.sub"),
      ]);
      if (p) setPersonaState(p as Persona);
      if (l) setLangState(l as Lang);
      if (th) setThemeState(th as Theme);
      if (li === "1") setLoggedInState(true);
      if (an === "1") setAnamnesisDoneState(true);
      if (s) setSubscriptionState(JSON.parse(s));
      setReady(true);
    })();
  }, []);

  const setPersona = useCallback((p: Persona) => { setPersonaState(p); AsyncStorage.setItem("vyra.persona", p); }, []);
  const setLang = useCallback((l: Lang) => { setLangState(l); AsyncStorage.setItem("vyra.lang", l); }, []);
  const setTheme = useCallback((t: Theme) => { setThemeState(t); AsyncStorage.setItem("vyra.theme", t); }, []);
  const setLoggedIn = useCallback((v: boolean) => { setLoggedInState(v); AsyncStorage.setItem("vyra.loggedIn", v ? "1" : "0"); }, []);
  const setAnamnesisDone = useCallback((v: boolean) => { setAnamnesisDoneState(v); AsyncStorage.setItem("vyra.anamnesis", v ? "1" : "0"); }, []);
  const setSubscription = useCallback((s: Subscription) => { setSubscriptionState(s); AsyncStorage.setItem("vyra.sub", JSON.stringify(s)); }, []);

  const fmtPrice = useCallback((brl: number, usd: number) => {
    if (lang === "pt") return `R$ ${brl.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return `$ ${usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, [lang]);
  const currencySymbol = useCallback(() => (lang === "pt" ? "R$" : "$"), [lang]);
  const t = useCallback((k: string) => (dict as any)[lang][k] ?? k, [lang]);

  const colors = useMemo(() => (theme === "dark" ? DARK : LIGHT), [theme]);

  if (!ready) return null;

  return (
    <AppCtx.Provider value={{
      persona, lang, theme, loggedIn, anamnesisDone, subscription, colors,
      setPersona, setLang, setTheme, setLoggedIn, setAnamnesisDone, setSubscription,
      fmtPrice, currencySymbol, t,
    }}>
      {children}
    </AppCtx.Provider>
  );
};

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
};
