import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { BillingCycle } from "../types";
import {
  ShieldCheck,
  Tag,
  ArrowLeft,
  Check,
  Sparkles,
  CreditCard,
  Lock,
  Award,
  Calendar,
  Zap,
} from "lucide-react";

export const CheckoutView: React.FC = () => {
  const {
    t,
    lang,
    selectedPlan,
    setSelectedPlan,
    setActiveView,
    setSubscription,
    fmtPrice,
    currencySymbol,
  } = useApp();

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountPct, setCouponDiscountPct] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!selectedPlan) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-[#9B9BA1]">Nenhum plano selecionado.</p>
        <button
          onClick={() => setActiveView("paywall")}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6A2A] text-white"
        >
          Voltar aos planos
        </button>
      </div>
    );
  }

  const { plan, cycle: currentCycle } = selectedPlan;
  const isShape = plan.slug === "shape" || plan.name.toLowerCase().includes("shape");
  const isForce = plan.slug === "force" || plan.slug === "forge" || plan.name.toLowerCase().includes("force") || plan.name.toLowerCase().includes("forge");
  const isReset = plan.slug === "reset12";

  const handleSelectCycle = (newCycle: BillingCycle) => {
    setSelectedPlan({
      plan,
      cycle: newCycle,
    });
  };

  // Pricing calculations
  const rawBrl = plan.prices_brl[currentCycle] ?? 179.90;
  const rawUsd = plan.prices_usd[currentCycle] ?? 34.90;

  const subtotal = lang === "pt" ? rawBrl : rawUsd;
  const discountAmount = Math.round((subtotal * couponDiscountPct) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const themeBorder = isShape
    ? "border-pink-500/50 shadow-pink-500/10"
    : isForce
    ? "border-blue-500/50 shadow-blue-500/10"
    : "border-[#D8B46A]/50 shadow-[#D8B46A]/10";

  const themeAccentBg = isShape
    ? "bg-pink-500/15 text-pink-400 border-pink-500/30"
    : isForce
    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
    : "bg-[#D8B46A]/15 text-[#D8B46A] border-[#D8B46A]/30";

  const themeBtn = isShape
    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/25"
    : isForce
    ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-blue-500/25"
    : "bg-gradient-to-r from-[#D8B46A] to-[#FFD580] text-[#0A0A0A] shadow-[#D8B46A]/25";

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCheckingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await api.checkCoupon(couponCode.trim().toUpperCase(), subtotal);
      if (res.valid) {
        setCouponDiscountPct(res.percent);
        setCouponMessage({
          text: `${t("checkout.applied")} (-${res.percent}%)`,
          ok: true,
        });
      } else {
        setCouponDiscountPct(0);
        setCouponMessage({ text: t("checkout.invalid"), ok: false });
      }
    } catch {
      setCouponDiscountPct(0);
      setCouponMessage({ text: t("checkout.invalid"), ok: false });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleConfirmPurchase = () => {
    setProcessing(true);
    setTimeout(() => {
      setSubscription({
        active: true,
        planId: plan.slug,
        cycle: currentCycle,
      });
      setProcessing(false);
      setActiveView("home");
    }, 1000);
  };

  const subscriptionCycles: { key: BillingCycle; label: string; priceBrl: number; priceUsd: number; tag?: string }[] = [
    { key: "month", label: "Mensal", priceBrl: 179.90, priceUsd: 34.90 },
    { key: "quarter", label: "Trimestral", priceBrl: 499.90, priceUsd: 99.90, tag: "Economize" },
    { key: "semester", label: "Semestral", priceBrl: 899.90, priceUsd: 179.90, tag: "Mais popular" },
    { key: "year", label: "Anual", priceBrl: 1739.90, priceUsd: 349.90, tag: "Melhor valor" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        id="checkout-back-btn"
        onClick={() => setActiveView("paywall")}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar aos protocolos</span>
      </button>

      {/* Header */}
      <div>
        <span className={`text-xs font-black tracking-widest uppercase px-3.5 py-1 rounded-full border ${themeAccentBg}`}>
          {isShape ? "🍑 PROTOCOLO SHAPE" : isForce ? "💪 PROTOCOLO FORCE" : "PROJETO RESET 12"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2.5">
          Finalize sua assinatura
        </h1>
        <p className="text-xs text-[#9B9BA1] mt-1">
          Confirme a periodicidade ideal para o seu objetivo e inicie seu acompanhamento de elite.
        </p>
      </div>

      {/* Order Summary & Cycle Selection Card */}
      <div className={`p-6 sm:p-7 rounded-3xl bg-[#151515] border space-y-6 shadow-2xl ${themeBorder}`}>
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2B2B2F]">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight flex items-center gap-2">
              {plan.name}
            </h3>
            <p className="text-xs text-[#9B9BA1] mt-1 max-w-md">{plan.description}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-[#9B9BA1] block font-medium">Investimento</span>
            <span className="text-2xl font-black text-[#F5F5F7]">
              {fmtPrice(rawBrl, rawUsd)}
            </span>
          </div>
        </div>

        {/* Dynamic Period Selector (Only for Shape & Force) */}
        {!isReset ? (
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9B9BA1]" />
              <span>Escolha o plano de periodicidade:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subscriptionCycles.map((c) => {
                const isSelected = currentCycle === c.key;
                const formattedPrice = fmtPrice(c.priceBrl, c.priceUsd);

                const activeBtnStyle = isShape
                  ? "border-pink-500 bg-pink-500/15 text-[#F5F5F7] shadow-md shadow-pink-500/10"
                  : isForce
                  ? "border-blue-500 bg-blue-500/15 text-[#F5F5F7] shadow-md shadow-blue-500/10"
                  : "border-[#D8B46A] bg-[#D8B46A]/15 text-[#F5F5F7]";

                return (
                  <button
                    key={c.key}
                    id={`cycle-option-${c.key}`}
                    type="button"
                    onClick={() => handleSelectCycle(c.key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? activeBtnStyle
                        : "border-[#2B2B2F] bg-[#1a1a1d] text-[#9B9BA1] hover:border-[#4A4A52] hover:text-[#F5F5F7]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-[#F5F5F7]">{c.label}</span>
                      {c.tag && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isSelected
                            ? isShape ? "bg-pink-500 text-white" : "bg-blue-500 text-white"
                            : "bg-[#2B2B2F] text-[#9B9BA1]"
                        }`}>
                          {c.tag}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-base font-black text-[#F5F5F7]">{formattedPrice}</span>
                      <span className="text-[10px] text-[#9B9BA1]">
                        {c.key === "month" ? "/ mês" : c.key === "quarter" ? "/ 3 meses" : c.key === "semester" ? "/ 6 meses" : "/ ano"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Reset 12 Single Payment Banner */
          <div className="p-4 rounded-2xl bg-[#1E1B14] border border-[#D8B46A]/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D8B46A]/20 text-[#D8B46A] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F5F5F7]">Pagamento Único (12 Semanas)</h4>
                <p className="text-[11px] text-[#9B9BA1]">Acesso completo sem cobrança recorrente mensal.</p>
              </div>
            </div>
            <span className="text-sm font-black text-[#D8B46A] shrink-0">
              {fmtPrice(479.90, 95.00)}
            </span>
          </div>
        )}

        {/* Coupon Form */}
        <div className="pt-2 border-t border-[#2B2B2F]">
          <label className="block text-xs font-bold text-[#9B9BA1] mb-2">
            {t("checkout.coupon")}
          </label>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="checkout-coupon-input"
                type="text"
                placeholder={t("checkout.enter_coupon")}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-xs uppercase font-bold focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>
            <button
              id="apply-coupon-btn"
              type="submit"
              disabled={checkingCoupon}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] hover:border-[#FF6A2A] transition-colors shrink-0"
            >
              {checkingCoupon ? "..." : t("cta.apply")}
            </button>
          </form>

          {couponMessage && (
            <p
              className={`text-xs font-semibold mt-2 ${
                couponMessage.ok ? "text-[#34C759]" : "text-[#FF453A]"
              }`}
            >
              {couponMessage.text}
            </p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="pt-4 border-t border-[#2B2B2F] space-y-2 text-sm">
          <div className="flex justify-between text-[#9B9BA1]">
            <span>{t("checkout.subtotal")}</span>
            <span>
              {currencySymbol} {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {couponDiscountPct > 0 && (
            <div className="flex justify-between text-[#34C759] font-semibold">
              <span>
                {t("checkout.discount")} ({couponDiscountPct}%)
              </span>
              <span>
                - {currencySymbol} {discountAmount.toFixed(2).replace(".", ",")}
              </span>
            </div>
          )}

          <div className="flex justify-between text-[#F5F5F7] font-black text-xl pt-3 border-t border-[#2B2B2F]">
            <span>Total a pagar</span>
            <span className={isShape ? "text-pink-400" : isForce ? "text-blue-400" : "text-[#D8B46A]"}>
              {currencySymbol} {finalTotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Confirm Purchase CTA */}
        <button
          id="confirm-checkout-btn"
          onClick={handleConfirmPurchase}
          disabled={processing}
          className={`w-full py-4 rounded-2xl font-black text-base tracking-wide transition-all flex items-center justify-center gap-2 mt-4 hover:brightness-110 active:scale-[0.99] ${themeBtn}`}
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processando transação segura...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirmar e Finalizar Assinatura</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-[#9B9BA1] pt-1">
          <ShieldCheck className="w-4 h-4 text-[#34C759]" />
          <span>Garantia incondicional de 7 dias · Pagamento 100% Criptografado</span>
        </div>
      </div>
    </div>
  );
};
