import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Plan, BillingCycle } from "../types";
import {
  Sparkles,
  Check,
  Award,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
  Info,
  HeartHandshake,
} from "lucide-react";

export const PaywallView: React.FC = () => {
  const {
    t,
    lang,
    fmtPrice,
    setSelectedPlan,
    setActiveView,
    anamnesisDone,
  } = useApp();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPlans()
      .then((data) => setPlans(data))
      .catch((err) => console.error("Error loading plans:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    // Default cycle: month for subscription plans, single for Reset 12
    const defaultCycle: BillingCycle = plan.slug === "reset12" ? "single" : "month";
    setSelectedPlan({ plan, cycle: defaultCycle });
    setActiveView("checkout");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[#9B9BA1]">
        <div className="w-8 h-8 border-2 border-[#FF6A2A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Carregando protocolos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-3.5 py-1 rounded-full border border-[#FF6A2A]/30">
          VYRA HIGH PERFORMANCE PROTOCOLS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F7] tracking-tight">
          {t("paywall.title")}
        </h1>
        <p className="text-sm text-[#9B9BA1] leading-relaxed">{t("paywall.sub")}</p>
      </div>

      {/* Anamnesis Advisory */}
      {!anamnesisDone && (
        <div className="p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/30 flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-[#D8B46A] shrink-0" />
            <p className="text-xs text-[#F5F5F7]">{t("paywall.blocked")}</p>
          </div>
          <button
            id="paywall-go-anamnesis-btn"
            onClick={() => setActiveView("anamnesis")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shrink-0"
          >
            {t("cta.start_anamnesis")}
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
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
            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 hover:brightness-110"
            : isForce
            ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:brightness-110"
            : "bg-gradient-to-r from-[#D8B46A] to-[#FFD580] text-[#0A0A0A] shadow-lg shadow-[#D8B46A]/25 hover:brightness-110";

          const displayPrice = isReset
            ? fmtPrice(479.90, 95.00)
            : fmtPrice(179.90, 34.90);

          const displayCycleLabel = isReset ? "Pagamento Único (12 Semanas)" : "a partir de / mês";

          return (
            <div
              key={plan.id}
              id={`plan-card-${plan.slug}`}
              className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between border relative transition-all duration-300 ${cardStyles}`}
            >
              {/* Tag Badge */}
              <div className={`inline-flex self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${badgeStyles}`}>
                {isShape && "Hipertrofia Feminina"}
                {isForce && "Hipertrofia & Força Pura"}
                {isReset && "Transformação Completa"}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight flex items-center gap-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-[#9B9BA1] leading-relaxed min-h-[48px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="py-4 border-y border-[#2B2B2F]">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#9B9BA1] font-semibold mb-0.5">
                      {displayCycleLabel}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-[#F5F5F7] tracking-tight">
                        {displayPrice}
                      </span>
                    </div>
                    {!isReset && (
                      <span className="text-[11px] text-[#D8B46A] font-medium mt-1">
                        Opções Mensal, Trimestral, Semestral e Anual na finalização
                      </span>
                    )}
                  </div>
                </div>

                {/* Perks */}
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

              {/* Action Button */}
              <div className="pt-6">
                <button
                  id={`select-plan-btn-${plan.slug}`}
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${btnStyles}`}
                >
                  <span>Escolher {plan.name.replace(/[^a-zA-Z0-9 ]/g, "").trim()}</span>
                  <ArrowRight className="w-4 h-4" />
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
          <span>Liberação imediata no aplicativo</span>
        </div>
      </div>
    </div>
  );
};
