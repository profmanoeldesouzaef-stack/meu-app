import React, { useEffect, useState } from "react";
import { Linking } from "react-native";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Plan } from "../types";
import { supabase } from "../lib/supabase";
import {
  Check,
  Award,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
  Info,
  HeartHandshake,
  ExternalLink,
  Loader2,
  Lock,
  Sparkles,
  Calendar,
} from "lucide-react";

export const PaywallView: React.FC = () => {
  const {
    t,
    lang,
    fmtPrice,
    setActiveView,
    anamnesisDone,
    currentUserEmail,
  } = useApp();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null);
  const [selectedRecurrence, setSelectedRecurrence] = useState<"monthly" | "quarterly" | "semiannual" | "annual">("quarterly");

  useEffect(() => {
    api
      .getPlans()
      .then((data) => setPlans(data))
      .catch((err) => console.error("Error loading plans:", err))
      .finally(() => setLoading(false));
  }, []);

  const STRIPE_PRICES_MAP: Record<string, string> = {
    reset12: "price_1UDGQQF7VqDt14kNHfhR3RlZ",
    monthly: "price_1U9FMDF7VqDt14kN3LneAWDA",
    quarterly: "price_1U9FMDF7VqDt14kNZhtT1hIO",
    semiannual: "price_1U9FMDF7VqDt14kNRVRuJWd0",
    annual: "price_1U9FMDF7VqDt14kNu6fxBRkh",
    test: "price_1UCUo4F7VqDt14kNAJolBpkp",
  };

  const handleSubscribeExternal = async (planSlug?: string, overrideRecurrence?: string) => {
    const cycle = overrideRecurrence || selectedRecurrence;
    const targetSlug = planSlug || "reset12";
    const selectedPriceId = targetSlug === "reset12" 
      ? STRIPE_PRICES_MAP.reset12 
      : (STRIPE_PRICES_MAP[cycle] || STRIPE_PRICES_MAP.monthly);

    setRedirectingPlan(targetSlug);

    try {
      // 1. Obter usuário autenticado
      const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const user = authData?.user;

      // 2. Chamar endpoint oficial do backend com o priceId selecionado
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPriceId,
          planSlug: targetSlug,
          recurrence: targetSlug === "reset12" ? "single" : cycle,
          userId: user?.id,
          userEmail: user?.email || currentUserEmail,
          successUrl: "https://vyratraining.com?payment=success",
          cancelUrl: "https://vyratraining.com?payment=cancel",
        }),
      });

      const data = await res.json().catch(() => null);
      const targetUrl =
        data?.url ||
        `https://vyratraining.com?plan=${encodeURIComponent(targetSlug)}&priceId=${encodeURIComponent(selectedPriceId)}&cycle=${encodeURIComponent(cycle)}${
          user?.email ? `&email=${encodeURIComponent(user.email)}` : ""
        }`;

      // 3. Redireciona a janela para a session.url imediatamente
      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      } else if (typeof Linking !== "undefined" && Linking?.openURL) {
        Linking.openURL(targetUrl);
      }
    } catch (err) {
      console.warn("Erro ao iniciar sessão do Stripe Checkout:", err);
      const fallbackUrl = `https://vyratraining.com?plan=${encodeURIComponent(targetSlug)}&priceId=${encodeURIComponent(selectedPriceId)}&cycle=${encodeURIComponent(cycle)}`;
      if (typeof window !== "undefined") {
        window.location.href = fallbackUrl;
      }
    } finally {
      setTimeout(() => setRedirectingPlan(null), 1200);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#9B9BA1] space-y-3">
        <div className="w-9 h-9 border-2 border-[#D8B46A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-[#F5F5F7]">Carregando protocolos de alta performance...</p>
      </div>
    );
  }

  // Filtrar para destacar os 3 protocolos principais: Reset 12 Semanas, Shape e Forge
  const activePlans = plans.filter((p) => p.slug !== "test" && p.id !== "test");
  const displayPlans = activePlans.length > 0 ? activePlans : plans;

  // Tabela de Preços por Ciclo
  const RECURRENCE_RATES = {
    monthly: { label: "Mensal", monthlyPrice: "R$ 179,90", total: "R$ 179,90", discount: null },
    quarterly: { label: "Trimestral", monthlyPrice: "R$ 149,90", total: "R$ 449,70", discount: "Economize 17%" },
    semiannual: { label: "Semestral", monthlyPrice: "R$ 129,90", total: "R$ 779,40", discount: "Economize 28%" },
    annual: { label: "Anual", monthlyPrice: "R$ 99,90", total: "R$ 1.198,80", discount: "Economize 45% • Melhor Valor" },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-3.5 py-1 rounded-full border border-[#D8B46A]/30">
          VYRA HIGH PERFORMANCE PROTOCOLS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F7] tracking-tight">
          {t("paywall.title") || "Eleve Seu Físico ao Nível Superior"}
        </h1>
        <p className="text-sm text-[#9B9BA1] leading-relaxed">
          {t("paywall.sub") || "Periodização avançada, acompanhamento nutricional dinâmico e suporte direto com nossa equipe de treinadores."}
        </p>
      </div>

      {/* Informativo de Assinatura Segura no Portal Oficial / Stripe Checkout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center shrink-0 border border-[#34C759]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-bold text-[#F5F5F7]">
                Assinatura & Checkout Seguro via Stripe
              </p>
              <span className="px-2 py-0.5 rounded-full bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/30 text-[9px] font-black uppercase">
                PORTAL OFICIAL
              </span>
            </div>
            <p className="text-[11px] text-[#9B9BA1] mt-0.5">
              Transações criptografadas ponta a ponta com liberação instantânea via Webhook em nosso portal.
            </p>
          </div>
        </div>
        <button
          id="paywall-go-portal-direct-btn"
          disabled={Boolean(redirectingPlan)}
          onClick={() => handleSubscribeExternal("portal")}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D8B46A] to-[#B38E32] text-[#0A0A0A] hover:brightness-110 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {redirectingPlan === "portal" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <span>Acessar Portal Oficial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Seletor Interativo de Recorrência / Ciclo de Cobrança */}
      <div className="max-w-xl mx-auto space-y-2">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B9BA1]">
            Selecione o período de contratação:
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[#151515] border border-[#2B2B2F]">
          {(["monthly", "quarterly", "semiannual", "annual"] as const).map((cycleKey) => {
            const cycle = RECURRENCE_RATES[cycleKey];
            const isSelected = selectedRecurrence === cycleKey;
            return (
              <button
                key={cycleKey}
                type="button"
                id={`recurrence-toggle-${cycleKey}`}
                onClick={() => setSelectedRecurrence(cycleKey)}
                className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                  isSelected
                    ? "bg-[#D8B46A] text-[#0A0A0A] font-extrabold shadow-md"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]"
                }`}
              >
                <span className="text-xs font-bold">{cycle.label}</span>
                <span className={`text-[10px] font-medium ${isSelected ? "text-[#0A0A0A]/80" : "text-[#D8B46A]"}`}>
                  {cycle.monthlyPrice}
                </span>
                {cycle.discount && (
                  <span
                    className={`text-[8px] font-black uppercase tracking-tight px-1 py-0.2 rounded mt-0.5 ${
                      isSelected ? "bg-black/20 text-[#0A0A0A]" : "bg-[#34C759]/20 text-[#34C759]"
                    }`}
                  >
                    {cycleKey === "annual" ? "45% OFF" : cycleKey === "semiannual" ? "28% OFF" : "17% OFF"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {RECURRENCE_RATES[selectedRecurrence].discount && (
          <p className="text-center text-[11px] font-bold text-[#34C759]">
            ✓ {RECURRENCE_RATES[selectedRecurrence].discount} no plano {RECURRENCE_RATES[selectedRecurrence].label} ({RECURRENCE_RATES[selectedRecurrence].total} faturado integralmente)
          </p>
        )}
      </div>

      {/* Anamnesis Advisory */}
      {!anamnesisDone && (
        <div className="p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/30 flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-[#D8B46A] shrink-0" />
            <p className="text-xs text-[#F5F5F7]">{t("paywall.blocked") || "Conclua sua anamnese para calibrar sua periodização individual."}</p>
          </div>
          <button
            id="paywall-go-anamnesis-btn"
            onClick={() => setActiveView("anamnesis")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shrink-0 cursor-pointer"
          >
            {t("cta.start_anamnesis") || "Fazer Anamnese"}
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className={`grid grid-cols-1 ${displayPlans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3"} gap-6`}>
        {displayPlans.map((plan) => {
          const isShape = plan.slug === "shape" || plan.name.toLowerCase().includes("shape");
          const isForce = plan.slug === "force" || plan.slug === "forge" || plan.name.toLowerCase().includes("force") || plan.name.toLowerCase().includes("forge");
          const isReset = plan.slug === "reset12";

          const cardStyles = isShape
            ? "border-pink-500/60 bg-gradient-to-b from-[#201018] to-[#151515] shadow-2xl shadow-pink-500/10 hover:border-pink-400"
            : isForce
            ? "border-blue-500/60 bg-gradient-to-b from-[#0e1828] to-[#151515] shadow-2xl shadow-blue-500/10 hover:border-blue-400"
            : "border-[#D8B46A]/60 bg-gradient-to-b from-[#1E1B14] to-[#151515] shadow-2xl shadow-[#D8B46A]/10 hover:border-[#D8B46A]";

          const badgeStyles = isShape
            ? "bg-pink-500/20 text-pink-300 border-pink-500/40"
            : isForce
            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
            : "bg-[#D8B46A]/20 text-[#D8B46A] border-[#D8B46A]/40";

          const checkIconStyles = isShape
            ? "bg-pink-500/20 text-pink-400"
            : isForce
            ? "bg-blue-500/20 text-blue-400"
            : "bg-[#D8B46A]/20 text-[#D8B46A]";

          const btnStyles = isShape
            ? "bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/20"
            : isForce
            ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
            : "bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shadow-lg shadow-[#D8B46A]/20";

          const activeRecurrenceInfo = RECURRENCE_RATES[selectedRecurrence];
          const isRedirectingThisPlan = redirectingPlan === plan.slug;

          return (
            <div
              key={plan.id}
              id={`paywall-plan-card-${plan.slug}`}
              className={`p-6 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden ${cardStyles}`}
            >
              <div className="space-y-4">
                {/* Header do Card */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badgeStyles}`}
                  >
                    {isReset
                      ? "PROGRAMA 12 SEMANAS"
                      : isShape
                      ? "DEFINIÇÃO & TONIFICAÇÃO"
                      : "HIPERTROFIA AVANÇADA"}
                  </span>
                  {isReset && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#D8B46A]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>DESTAQUE</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-[#9B9BA1] mt-1 line-clamp-2">
                    {plan.description}
                  </p>
                </div>

                {/* Preço & Ciclo */}
                <div className="pt-2 border-t border-[#2B2B2F]">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-[#F5F5F7]">
                        {isReset ? "R$ 479,90" : activeRecurrenceInfo.monthlyPrice}
                      </span>
                      <span className="text-xs text-[#9B9BA1] font-semibold">
                        {isReset ? "à vista ou 12x" : "/mês"}
                      </span>
                    </div>

                    {!isReset ? (
                      <span className="text-[11px] text-[#D8B46A] font-medium mt-1">
                        Ciclo {activeRecurrenceInfo.label} ({activeRecurrenceInfo.total})
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#D8B46A] font-medium mt-1">
                        Acesso por 84 dias com garantia de evolução física
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de Benefícios */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
                    Incluso no protocolo:
                  </span>
                  {plan.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#F5F5F7]">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${checkIconStyles}`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Ação Conectado ao Stripe Checkout */}
              <div className="pt-6">
                <button
                  id={`select-plan-btn-${plan.slug}`}
                  disabled={Boolean(redirectingPlan)}
                  onClick={() => handleSubscribeExternal(plan.slug)}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${btnStyles}`}
                >
                  {isRedirectingThisPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando ao Stripe...</span>
                    </>
                  ) : (
                    <>
                      <span>{isReset ? "Começar Agora" : `Assinar ${activeRecurrenceInfo.label}`}</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guarantee & Confidence Banner */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[#34C759] tracking-wider">
              Compromisso de Resultados Vyra
            </span>
            <h4 className="text-base font-bold text-[#F5F5F7] mt-0.5">
              Garantia Incondicional de 7 Dias
            </h4>
            <p className="text-xs text-[#9B9BA1] mt-0.5">
              Acesso total a treinos, periodizações, planos nutricionais e acompanhamento de ponta.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#9B9BA1] flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FF6A2A]" />
          <span>Liberação imediata no aplicativo via Webhook oficial</span>
        </div>
      </div>
    </div>
  );
};
