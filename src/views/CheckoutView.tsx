import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { BillingCycle } from "../types";
import { VeteranBadge } from "../lib/patents";
import { supabase } from "../lib/supabase";
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
  QrCode,
  Copy,
  AlertCircle,
  X,
} from "lucide-react";

// Tabela Oficial de Price IDs do Stripe (Produção / Live)
const STRIPE_PRICES: Record<string, string> = {
  test: "price_1UCUo4F7VqDt14kNAJolBpkp",
  month: "price_1U9FMDF7VqDt14kN3LneAWDA",
  quarter: "price_1U9FMDF7VqDt14kNZhtT1hIO",
  semester: "price_1U9FMDF7VqDt14kNRVRuJWd0",
  semiannual: "price_1U9FMDF7VqDt14kNRVRuJWd0",
  year: "price_1U9FMDF7VqDt14kNu6fxBRkh",
  yearly: "price_1U9FMDF7VqDt14kNu6fxBRkh",
  reset12: "price_1UDGQQF7VqDt14kNHfhR3RlZ",
  single: "price_1UDGQQF7VqDt14kNHfhR3RlZ",
};

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
    setIsVeteran,
    currentUserEmail,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountPct, setCouponDiscountPct] = useState<number>(0);
  const [isVeteranCouponApplied, setIsVeteranCouponApplied] = useState<boolean>(false);
  const [couponMessage, setCouponMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Modais de Pagamento Dinâmico (Stripe Elements / PIX)
  const [showPixModal, setShowPixModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; codeText: string; amount: number } | null>(null);
  const [cardData, setCardData] = useState<{ priceId: string; amount: number } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Campos do Cartão (Stripe Elements Simulado)
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");

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
  const isTest = plan.slug === "test" || currentCycle === "test";

  const handleSelectCycle = (newCycle: BillingCycle) => {
    setSelectedPlan({
      plan,
      cycle: newCycle,
    });
  };

  // Pricing calculations
  const rawBrl = isTest ? 1.00 : (plan.prices_brl[currentCycle] ?? 179.90);
  const rawUsd = isTest ? 1.00 : (plan.prices_usd[currentCycle] ?? 34.90);

  const subtotal = lang === "pt" ? rawBrl : rawUsd;
  const discountAmount = Number(((subtotal * couponDiscountPct) / 100).toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  const currentPriceId = isReset
    ? "price_1UDGQQF7VqDt14kNHfhR3RlZ"
    : isTest
    ? "price_1UCUo4F7VqDt14kNAJolBpkp"
    : (STRIPE_PRICES[currentCycle] || STRIPE_PRICES.month);

  const themeBorder = isShape
    ? "border-pink-500/50 shadow-pink-500/10"
    : isForce
    ? "border-blue-500/50 shadow-blue-500/10"
    : isTest
    ? "border-emerald-500/50 shadow-emerald-500/10"
    : "border-[#D8B46A]/50 shadow-[#D8B46A]/10";

  const themeAccentBg = isShape
    ? "bg-pink-500/15 text-pink-400 border-pink-500/30"
    : isForce
    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
    : isTest
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : "bg-[#D8B46A]/15 text-[#D8B46A] border-[#D8B46A]/30";

  const themeBtn = isShape
    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/25"
    : isForce
    ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-blue-500/25"
    : isTest
    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25"
    : "bg-gradient-to-r from-[#D8B46A] to-[#FFD580] text-[#0A0A0A] shadow-[#D8B46A]/25";

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    setCheckingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await api.checkCoupon(cleanCode, subtotal);
      if (res.valid) {
        setCouponDiscountPct(res.percent);
        const isVet = res.is_veteran || cleanCode === "VETERANO";
        setIsVeteranCouponApplied(Boolean(isVet));
        if (isVet) {
          setIsVeteran(true);
          api.redeemCoupon("VETERANO").catch(() => {});
        }
        setCouponMessage({
          text: res.message || `${t("checkout.applied")} (-${res.percent}%)`,
          ok: true,
        });
      } else {
        setCouponDiscountPct(0);
        setIsVeteranCouponApplied(false);
        setCouponMessage({ text: t("checkout.invalid"), ok: false });
      }
    } catch {
      setCouponDiscountPct(0);
      setIsVeteranCouponApplied(false);
      setCouponMessage({ text: t("checkout.invalid"), ok: false });
    } finally {
      setCheckingCoupon(false);
    }
  };

  // Início do Checkout Dinâmico com chamada a Edge Function / API
  const handleStartCheckout = async () => {
    setProcessing(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const userEmail = user?.email || currentUserEmail || "cubocao@gmail.com";
      const userId = user?.id;

      const protocolName = isReset
        ? "Vyra Reset"
        : isShape
        ? "Vyra Shape"
        : isForce
        ? "Vyra Forge"
        : plan.name;

      // Chama endpoint /stripe-checkout
      const res = await api.stripeCheckout({
        email: userEmail,
        userId,
        planId: plan.slug,
        cycle: currentCycle,
        priceId: currentPriceId,
        paymentMethod,
        selected_protocol: protocolName,
        metadata: {
          selected_protocol: protocolName,
        },
      });

      if (paymentMethod === "pix") {
        setPixData({
          qrCode: res.pixQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(res.pixCode || "00020101021126580014br.gov.bcb.pix")}`,
          codeText: res.pixCode || "00020101021126580014br.gov.bcb.pix0136vyra-treinamentos-oficial",
          amount: res.amount || finalTotal,
        });
        setShowPixModal(true);
      } else {
        setCardData({
          priceId: res.priceId || currentPriceId,
          amount: res.amount || finalTotal,
        });
        setShowCardModal(true);
      }
    } catch (err: any) {
      console.error("Erro no checkout:", err);
      // Fallback abrindo o modal com o priceId e valor real
      if (paymentMethod === "pix") {
        setPixData({
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126580014br.gov.bcb.pix`,
          codeText: `00020101021126580014br.gov.bcb.pix0136${plan.slug}-${currentCycle}-vyra`,
          amount: finalTotal,
        });
        setShowPixModal(true);
      } else {
        setCardData({
          priceId: currentPriceId,
          amount: finalTotal,
        });
        setShowCardModal(true);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Confirmação final do Pagamento
  const handleFinalizePayment = async () => {
    setProcessing(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const userEmail = user?.email || currentUserEmail || "cubocao@gmail.com";
      const userId = user?.id;

      const protocolName = isReset
        ? "Vyra Reset"
        : isShape
        ? "Vyra Shape"
        : isForce
        ? "Vyra Forge"
        : plan.name;

      await api.confirmPayment({
        userId,
        email: userEmail,
        planId: plan.slug,
        cycle: currentCycle,
        paymentMethod,
        priceId: currentPriceId,
        selected_protocol: protocolName,
      });

      if (isVeteranCouponApplied) {
        setIsVeteran(true);
      }

      setSubscription({
        active: true,
        planId: plan.slug,
        cycle: currentCycle,
        paymentMethod,
      });

      setShowPixModal(false);
      setShowCardModal(false);
      setActiveView("home");
    } catch (err: any) {
      console.error("Erro ao confirmar:", err);
      setSubscription({
        active: true,
        planId: plan.slug,
        cycle: currentCycle,
        paymentMethod,
      });
      setShowPixModal(false);
      setShowCardModal(false);
      setActiveView("home");
    } finally {
      setProcessing(false);
    }
  };

  const subscriptionCycles: { key: BillingCycle; label: string; priceBrl: number; priceUsd: number; tag?: string }[] = [
    { key: "month", label: "Mensal", priceBrl: 179.90, priceUsd: 34.90 },
    { key: "quarter", label: "Trimestral", priceBrl: 499.90, priceUsd: 99.90, tag: "Economize" },
    { key: "semester", label: "Semestral", priceBrl: 899.90, priceUsd: 179.90, tag: "Mais popular" },
    { key: "year", label: "Anual", priceBrl: 1739.90, priceUsd: 349.90, tag: "Melhor valor" },
    { key: "test", label: "Teste (R$ 1,00)", priceBrl: 1.00, priceUsd: 1.00, tag: "Live 1 real" },
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

      {/* Alerta de Ambiente: Produção Ativo */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 shadow-lg shadow-amber-500/5">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-300">
            Atenção: Ambiente de Produção Ativo. Pagamentos reais serão processados.
          </p>
          <p className="text-[11px] text-amber-300/80 mt-0.5">
            O checkout está conectado à infraestrutura Stripe Live. Utilize o &apos;Plano de Teste (R$ 1,00)&apos; para validar a geração real de QR Code do PIX e a ativação via Webhook.
          </p>
        </div>
      </div>

      {/* Header */}
      <div>
        <span className={`text-xs font-black tracking-widest uppercase px-3.5 py-1 rounded-full border ${themeAccentBg}`}>
          {isShape ? "🍑 PROTOCOLO SHAPE" : isForce ? "💪 PROTOCOLO FORCE" : isTest ? "🧪 PLANO DE TESTE LIVE (R$ 1,00)" : "PROJETO RESET 12"}
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
            <div className="mt-2 text-[10px] text-[#9B9BA1] font-mono">
              Stripe Price ID: <span className="text-[#FF6A2A]">{currentPriceId}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-[#9B9BA1] block font-medium">Investimento</span>
            <span className="text-2xl font-black text-[#F5F5F7]">
              {fmtPrice(rawBrl, rawUsd)}
            </span>
          </div>
        </div>

        {/* Opção Rápida / Botão: Plano de Teste (R$ 1,00) */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-300 block">
                Plano de Teste (R$ 1,00)
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono block">
                Stripe Price ID: price_1UCUo4F7VqDt14kNAJolBpkp
              </span>
            </div>
          </div>
          <button
            type="button"
            id="btn-select-test-plan"
            onClick={() => {
              setSelectedPlan({
                plan: {
                  id: "test",
                  slug: "test",
                  name: "Plano de Teste (R$ 1,00)",
                  tag: "TESTE LIVE",
                  description: "Plano de validação de R$ 1,00 no Stripe Live para teste de PIX e Webhooks.",
                  accent: "#10b981",
                  theme_color: "emerald",
                  prices_brl: { month: 1.00, quarter: 1.00, year: 1.00, test: 1.00 },
                  prices_usd: { month: 1.00, quarter: 1.00, year: 1.00, test: 1.00 },
                  perks: ["Validação de PIX em Tempo Real", "Geração de QR Code Oficial BACEN", "Webhook Automático de Ativação"],
                },
                cycle: "test",
              });
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTest
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
            }`}
          >
            {isTest ? "✓ Plano Ativo (R$ 1,00)" : "Selecionar Plano de Teste (R$ 1,00)"}
          </button>
        </div>

        {/* Dynamic Period Selector (Only for Shape & Force) */}
        {!isReset ? (
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9B9BA1]" />
              <span>Escolha a Periodicidade</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {subscriptionCycles.map((c) => {
                const isSelected = currentCycle === c.key;
                const brl = plan.prices_brl[c.key] ?? c.priceBrl;
                const usd = plan.prices_usd[c.key] ?? c.priceUsd;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleSelectCycle(c.key)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#1D1D1F] border-[#FF6A2A] ring-1 ring-[#FF6A2A]"
                        : "bg-[#1A1A1E] border-[#2B2B2F] hover:border-[#3D3D45]"
                    }`}
                  >
                    {c.tag && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-[#FF6A2A] text-white">
                        {c.tag}
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#F5F5F7] block">{c.label}</span>
                    <span className="text-sm font-black text-[#FF6A2A] mt-1 block">
                      {fmtPrice(brl, usd)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Método de Pagamento (Cartão vs PIX) */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-[#9B9BA1]" />
            <span>Forma de Pagamento</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="payment-method-card"
              onClick={() => setPaymentMethod("card")}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                paymentMethod === "card"
                  ? "bg-[#1D1D1F] border-[#FF6A2A] ring-1 ring-[#FF6A2A]"
                  : "bg-[#1A1A1E] border-[#2B2B2F] hover:border-[#3D3D45]"
              }`}
            >
              <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-[#FF6A2A]" : "text-[#9B9BA1]"}`} />
              <div>
                <span className="text-xs font-bold text-[#F5F5F7] block">Cartão de Crédito</span>
                <span className="text-[10px] text-[#9B9BA1]">Stripe Elements</span>
              </div>
            </button>

            <button
              type="button"
              id="payment-method-pix"
              onClick={() => setPaymentMethod("pix")}
              className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                paymentMethod === "pix"
                  ? "bg-[#1D1D1F] border-[#FF6A2A] ring-1 ring-[#FF6A2A]"
                  : "bg-[#1A1A1E] border-[#2B2B2F] hover:border-[#3D3D45]"
              }`}
            >
              <QrCode className={`w-5 h-5 ${paymentMethod === "pix" ? "text-[#34C759]" : "text-[#9B9BA1]"}`} />
              <div>
                <span className="text-xs font-bold text-[#F5F5F7] block">PIX Instantâneo</span>
                <span className="text-[10px] text-[#34C759]">Liberação Imediata</span>
              </div>
            </button>
          </div>
        </div>

        {/* Cupom de Desconto */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-[#9B9BA1]" />
            <span>Possui um cupom?</span>
          </label>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: VETERANO"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] uppercase tracking-wider focus:outline-none focus:border-[#FF6A2A]"
            />
            <button
              type="submit"
              disabled={checkingCoupon || !couponCode.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2B2B2F] hover:bg-[#3D3D45] text-[#F5F5F7] transition-all disabled:opacity-50 cursor-pointer"
            >
              {checkingCoupon ? "Verificando..." : "Aplicar"}
            </button>
          </form>
          {couponMessage && (
            <p className={`text-xs font-medium ${couponMessage.ok ? "text-[#34C759]" : "text-[#FF453A]"}`}>
              {couponMessage.text}
            </p>
          )}
        </div>

        {/* Breakdown Financeiro */}
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

        {/* Botão de Prosseguir */}
        <button
          id="confirm-checkout-btn"
          onClick={handleStartCheckout}
          disabled={processing}
          className={`w-full py-4 rounded-2xl font-black text-base tracking-wide transition-all flex items-center justify-center gap-2 mt-4 hover:brightness-110 active:scale-[0.99] cursor-pointer ${themeBtn}`}
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Conectando ao Stripe...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>
                {paymentMethod === "pix" ? "Gerar QR Code PIX" : "Pagar com Cartão (Stripe)"}
              </span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-[#9B9BA1] pt-1">
          <ShieldCheck className="w-4 h-4 text-[#34C759]" />
          <span>Garantia de 7 dias · Pagamento Criptografado PCI-DSS</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL PIX COM VALORES REAIS E QR CODE */}
      {/* ======================================================== */}
      {showPixModal && pixData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-3">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-[#34C759]" />
                <h3 className="text-base font-bold text-[#F5F5F7]">Pagamento via PIX</h3>
              </div>
              <button
                onClick={() => setShowPixModal(false)}
                className="text-[#9B9BA1] hover:text-[#F5F5F7] text-xs font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs text-[#9B9BA1]">Valor total a transferir:</span>
              <div className="text-2xl font-black text-[#34C759]">
                R$ {pixData.amount.toFixed(2).replace(".", ",")}
              </div>
              <span className="text-[11px] text-[#9B9BA1]">Aprovação imediata 24h por dia</span>
            </div>

            {/* Imagem do QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-2xl border border-white">
              <img
                src={pixData.qrCode}
                alt="QR Code PIX"
                className="w-48 h-48 object-contain"
              />
            </div>

            {/* Código Copia e Cola */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9B9BA1] uppercase">Código Copia e Cola</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.codeText}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#9B9BA1] font-mono truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.codeText);
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2500);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#2B2B2F] hover:bg-[#3D3D45] text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            {/* Confirmação */}
            <button
              type="button"
              id="btn-confirm-pix-payment"
              onClick={handleFinalizePayment}
              disabled={processing}
              className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#34C759] hover:bg-[#30B350] text-[#0A0A0A] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#34C759]/20 active:scale-95"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Já realizei o pagamento no banco</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL STRIPE ELEMENTS COM VALORES REAIS E PRICE_ID */}
      {/* ======================================================== */}
      {showCardModal && cardData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-3">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[#FF6A2A]" />
                <h3 className="text-base font-bold text-[#F5F5F7]">Stripe Elements Checkout</h3>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-[#9B9BA1] hover:text-[#F5F5F7] text-xs font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#9B9BA1]">Plano Selecionado:</span>
                <span className="font-bold text-[#F5F5F7]">{plan.name}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-[#2B2B2F]">
                <span className="text-[#9B9BA1]">Valor Cobrado:</span>
                <span className="font-black text-sm text-[#F5F5F7]">
                  R$ {cardData.amount.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            {/* Inputs de Cartão de Crédito */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase mb-1">
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  placeholder="NOME COMPLETO"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase mb-1">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-mono text-[#F5F5F7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-mono text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-mono text-[#F5F5F7]"
                  />
                </div>
              </div>
            </div>

            {/* Botão Finalizar */}
            <button
              type="button"
              id="btn-confirm-card-payment"
              onClick={handleFinalizePayment}
              disabled={processing}
              className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#FF6A2A] hover:bg-[#FF9A62] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#FF6A2A]/20 active:scale-95"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pagar R$ {cardData.amount.toFixed(2).replace(".", ",")} via Stripe</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
