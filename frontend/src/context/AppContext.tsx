import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Persona = "student" | "coach" | "moderator";
export type Lang = "pt" | "en";

type Subscription = { active: boolean; planId?: string; cycle?: "month" | "quarter" | "year" };

type AppState = {
  persona: Persona;
  lang: Lang;
  subscription: Subscription;
  setPersona: (p: Persona) => void;
  setLang: (l: Lang) => void;
  setSubscription: (s: Subscription) => void;
  currency: () => "BRL" | "USD";
  fmtPrice: (brl: number, usd: number) => string;
  t: (k: string) => string;
};

const AppCtx = createContext<AppState | null>(null);

const dict = {
  pt: {
    // generic
    "app.name": "VYRA",
    "app.tagline": "Training & Performance",
    "cta.enter_demo": "Entrar em modo demonstração",
    "cta.login": "Entrar",
    "cta.signup": "Criar conta",
    "cta.forgot": "Recuperar acesso",
    "cta.continue": "Continuar",
    "cta.confirm_purchase": "Confirmar compra",
    "cta.apply": "Aplicar",
    "cta.mark_done": "Marcar como feita",
    "cta.finish_workout": "Finalizar treino",
    "cta.analyze": "Analisar execução",
    "cta.save": "Salvar",
    "cta.close": "Fechar",
    "cta.send": "Enviar",
    "cta.like": "Curtir",
    "cta.publish": "Publicar transformação",
    "cta.logout": "Sair",
    "cta.back": "Voltar",
    "cta.premium": "Ver planos",
    "cta.add_weight": "Registrar peso",
    // sections
    "sec.hi": "Olá",
    "sec.weekly": "Progresso da semana",
    "sec.today_workout": "Treino do dia",
    "sec.macros": "Macros do dia",
    "sec.shortcuts": "Atalhos",
    "sec.challenges": "Desafios",
    "sec.community": "Comunidade",
    "sec.evolution": "Evolução",
    "sec.diet": "Dieta",
    "sec.training": "Treino",
    "sec.profile": "Perfil",
    "sec.home": "Início",
    "sec.progress": "Evolução",
    // tabs
    "tab.home": "Início",
    "tab.training": "Treinos",
    "tab.diet": "Dieta",
    "tab.progress": "Evolução",
    "tab.profile": "Perfil",
    // paywall
    "paywall.title": "Escolha seu protocolo",
    "paywall.sub": "Metas, ciência e coach — feitos para performance real.",
    "paywall.monthly": "Mensal",
    "paywall.quarterly": "Trimestral",
    "paywall.yearly": "Anual",
    "paywall.per_month": "/mês",
    "paywall.per_quarter": "/tri",
    "paywall.per_year": "/ano",
    "paywall.coming": "Em breve · Vyra Kids",
    "paywall.most_wanted": "Mais solicitado",
    // checkout
    "checkout.title": "Finalizar assinatura",
    "checkout.summary": "Resumo",
    "checkout.coupon": "Cupom",
    "checkout.enter_coupon": "Digite um cupom",
    "checkout.subtotal": "Subtotal",
    "checkout.discount": "Desconto",
    "checkout.total": "Total",
    "checkout.applied": "Cupom aplicado",
    "checkout.invalid": "Cupom inválido",
    // training
    "training.exercises": "Exercícios",
    "training.rest": "Descanso",
    "training.sets": "séries",
    "training.done": "Concluído",
    // form checker
    "form.title": "Form Checker · IA",
    "form.desc": "Análise de execução assistida por IA — resultado simulado.",
    "form.checklist": "Checklist de execução",
    "form.result": "Resultado",
    "form.score": "Nota técnica",
    "form.run": "Rodar análise",
    // diet
    "diet.calc": "Macro-calculadora",
    "diet.kcal": "Calorias",
    "diet.protein": "Proteínas",
    "diet.carbs": "Carboidratos",
    "diet.fats": "Gorduras",
    "diet.foods": "Alimentos",
    "diet.substitute": "Substituir",
    "meal.breakfast": "Café da manhã",
    "meal.lunch": "Almoço",
    "meal.snack": "Lanche",
    "meal.dinner": "Jantar",
    "meal.supper": "Ceia",
    // evolution
    "evo.current": "Peso atual",
    "evo.history": "Histórico",
    "evo.gallery": "Galeria do shape",
    "evo.add": "Adicionar registro",
    // challenges
    "ch.title": "Desafios",
    "ch.sub": "Antes / Depois da comunidade Vyra",
    "ch.filter.all": "Todos",
    "ch.filter.reset12": "Reset 12",
    "ch.filter.shape": "Shape",
    "ch.filter.forge": "Forge",
    "ch.weeks": "semanas",
    // community
    "comm.title": "Chat global",
    "comm.placeholder": "Mensagem para o clube…",
    // profile
    "profile.persona": "Persona demo",
    "profile.student": "Aluno",
    "profile.coach": "Coach",
    "profile.moderator": "Moderador",
    "profile.language": "Idioma",
    "profile.subscription": "Assinatura",
    "profile.active": "Ativa",
    "profile.inactive": "Não assinado",
    "profile.version": "Versão 1.0.0 · demo",
    "profile.admin": "Painel gerencial",
    // coach
    "coach.title": "Painel gerencial",
    "coach.overview": "Visão geral",
    "coach.finance": "Financeiro",
    "coach.plans": "Treinos",
    "coach.radar": "Radar",
    "coach.new_coupon": "Novo cupom",
    "coach.partners": "Parceiros isentos",
    "coach.new_workout": "Montar treino",
    "coach.new_exercise": "Adicionar exercício",
    "coach.save_draft": "Salvar rascunho",
    "coach.alerts": "Alertas ativos",
    // login
    "login.subtitle": "Clube premium de treino e performance",
    "login.email": "E-mail",
    "login.password": "Senha",
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
    "cta.mark_done": "Mark as done",
    "cta.finish_workout": "Finish workout",
    "cta.analyze": "Analyze form",
    "cta.save": "Save",
    "cta.close": "Close",
    "cta.send": "Send",
    "cta.like": "Like",
    "cta.publish": "Share transformation",
    "cta.logout": "Sign out",
    "cta.back": "Back",
    "cta.premium": "View plans",
    "cta.add_weight": "Log weight",
    "sec.hi": "Hey",
    "sec.weekly": "Weekly progress",
    "sec.today_workout": "Today's workout",
    "sec.macros": "Today's macros",
    "sec.shortcuts": "Shortcuts",
    "sec.challenges": "Challenges",
    "sec.community": "Community",
    "sec.evolution": "Evolution",
    "sec.diet": "Diet",
    "sec.training": "Training",
    "sec.profile": "Profile",
    "sec.home": "Home",
    "sec.progress": "Evolution",
    "tab.home": "Home",
    "tab.training": "Training",
    "tab.diet": "Diet",
    "tab.progress": "Evolution",
    "tab.profile": "Profile",
    "paywall.title": "Pick your protocol",
    "paywall.sub": "Goals, science and coach — built for real performance.",
    "paywall.monthly": "Monthly",
    "paywall.quarterly": "Quarterly",
    "paywall.yearly": "Yearly",
    "paywall.per_month": "/mo",
    "paywall.per_quarter": "/qtr",
    "paywall.per_year": "/yr",
    "paywall.coming": "Coming soon · Vyra Kids",
    "paywall.most_wanted": "Most wanted",
    "checkout.title": "Complete subscription",
    "checkout.summary": "Summary",
    "checkout.coupon": "Coupon",
    "checkout.enter_coupon": "Enter a coupon",
    "checkout.subtotal": "Subtotal",
    "checkout.discount": "Discount",
    "checkout.total": "Total",
    "checkout.applied": "Coupon applied",
    "checkout.invalid": "Invalid coupon",
    "training.exercises": "Exercises",
    "training.rest": "Rest",
    "training.sets": "sets",
    "training.done": "Done",
    "form.title": "Form Checker · AI",
    "form.desc": "AI-assisted form analysis — simulated result.",
    "form.checklist": "Execution checklist",
    "form.result": "Result",
    "form.score": "Technical score",
    "form.run": "Run analysis",
    "diet.calc": "Macro calculator",
    "diet.kcal": "Calories",
    "diet.protein": "Protein",
    "diet.carbs": "Carbs",
    "diet.fats": "Fats",
    "diet.foods": "Foods",
    "diet.substitute": "Swap",
    "meal.breakfast": "Breakfast",
    "meal.lunch": "Lunch",
    "meal.snack": "Snack",
    "meal.dinner": "Dinner",
    "meal.supper": "Supper",
    "evo.current": "Current weight",
    "evo.history": "History",
    "evo.gallery": "Shape gallery",
    "evo.add": "Log entry",
    "ch.title": "Challenges",
    "ch.sub": "Before / After from the Vyra club",
    "ch.filter.all": "All",
    "ch.filter.reset12": "Reset 12",
    "ch.filter.shape": "Shape",
    "ch.filter.forge": "Forge",
    "ch.weeks": "weeks",
    "comm.title": "Global chat",
    "comm.placeholder": "Message the club…",
    "profile.persona": "Demo persona",
    "profile.student": "Student",
    "profile.coach": "Coach",
    "profile.moderator": "Moderator",
    "profile.language": "Language",
    "profile.subscription": "Subscription",
    "profile.active": "Active",
    "profile.inactive": "Not subscribed",
    "profile.version": "Version 1.0.0 · demo",
    "profile.admin": "Admin dashboard",
    "coach.title": "Admin dashboard",
    "coach.overview": "Overview",
    "coach.finance": "Finance",
    "coach.plans": "Workouts",
    "coach.radar": "Radar",
    "coach.new_coupon": "New coupon",
    "coach.partners": "Free partners",
    "coach.new_workout": "Build workout",
    "coach.new_exercise": "Add exercise",
    "coach.save_draft": "Save draft",
    "coach.alerts": "Active alerts",
    "login.subtitle": "Premium training & performance club",
    "login.email": "Email",
    "login.password": "Password",
  },
} as const;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersonaState] = useState<Persona>("student");
  const [lang, setLangState] = useState<Lang>("pt");
  const [subscription, setSubscriptionState] = useState<Subscription>({ active: false });

  useEffect(() => {
    (async () => {
      const [p, l, s] = await Promise.all([
        AsyncStorage.getItem("vyra.persona"),
        AsyncStorage.getItem("vyra.lang"),
        AsyncStorage.getItem("vyra.sub"),
      ]);
      if (p) setPersonaState(p as Persona);
      if (l) setLangState(l as Lang);
      if (s) setSubscriptionState(JSON.parse(s));
    })();
  }, []);

  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p);
    AsyncStorage.setItem("vyra.persona", p);
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem("vyra.lang", l);
  }, []);
  const setSubscription = useCallback((s: Subscription) => {
    setSubscriptionState(s);
    AsyncStorage.setItem("vyra.sub", JSON.stringify(s));
  }, []);

  const currency = useCallback(() => (lang === "pt" ? "BRL" : "USD") as "BRL" | "USD", [lang]);
  const fmtPrice = useCallback(
    (brl: number, usd: number) => {
      if (lang === "pt") {
        return `R$ ${brl.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
      return `$ ${usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    },
    [lang]
  );
  const t = useCallback((k: string) => (dict as any)[lang][k] ?? k, [lang]);

  return (
    <AppCtx.Provider
      value={{ persona, lang, subscription, setPersona, setLang, setSubscription, currency, fmtPrice, t }}
    >
      {children}
    </AppCtx.Provider>
  );
};

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
};
