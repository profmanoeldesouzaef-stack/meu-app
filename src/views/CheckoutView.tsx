import React, { useState } from "react";
import { Linking } from "react-native";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import {
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  Lock,
  Zap,
  Loader2,
  Sparkles,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

export const CheckoutView: React.FC = () => {
  const {
    selectedPlan,
    setActiveView,
    currentUserEmail,
  } = useApp();

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const plan = selectedPlan?.plan;

  const handleSubscribeExternal = async (planSlug?: string) => {
    setLoadingCheckout(true);
    const targetSlug = planSlug || plan?.slug || "reset12";

    try {
      // 1. Obter dados do usuário no Supabase
      const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const user = authData?.user;

      // 2. Chamar endpoint da API para gerar checkout do Stripe
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: targetSlug,
          recurrence: "monthly",
          userId: user?.id,
          userEmail: user?.email || currentUserEmail,
        }),
      });

      const data = await res.json().catch(() => null);
      const targetUrl =
        data?.url ||
        `https://vyratraining.com?plan=${encodeURIComponent(targetSlug)}${
          user?.email ? `&email=${encodeURIComponent(user.email)}` : ""
        }`;

      // 3. Redirecionar com segurança
      if (typeof window !== "undefined") {
        const opened = window.open(targetUrl, "_blank");
        if (!opened || opened.closed || typeof opened.closed === "undefined") {
          window.location.href = targetUrl;
        }
      } else if (typeof Linking !== "undefined" && Linking?.openURL) {
        Linking.openURL(targetUrl);
      }
    } catch (err) {
      console.warn("Erro ao redirecionar para o checkout:", err);
      const fallbackUrl = `https://vyratraining.com?plan=${encodeURIComponent(targetSlug)}`;
      if (typeof window !== "undefined") {
        window.open(fallbackUrl, "_blank") || (window.location.href = fallbackUrl);
      }
    } finally {
      setTimeout(() => setLoadingCheckout(false), 1200);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 pb-24 animate-in fade-in duration-300">
      <button
        id="checkout-back-to-plans-btn"
        onClick={() => setActiveView("paywall")}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#9B9BA1] hover:text-[#F5F5F7] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar aos protocolos</span>
      </button>

      <div className="rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 sm:p-8 space-y-6 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#D8B46A]/15 text-[#D8B46A] border border-[#D8B46A]/30 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#34C759] bg-[#34C759]/15 px-3 py-1 rounded-full border border-[#34C759]/30 inline-block">
            Checkout Oficial Criptografado
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
            Contratação & Ativação Segura
          </h2>
          <p className="text-sm text-[#9B9BA1] max-w-lg mx-auto leading-relaxed">
            A ativação dos protocolos é processada pelo checkout oficial do Stripe com total segurança e criptografia bancária. Sua conta será liberada instantaneamente no aplicativo via Webhook.
          </p>
        </div>

        {plan && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-left max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D8B46A] uppercase tracking-wider block">
                Protocolo Selecionado
              </span>
              <span className="text-xs font-black text-[#F5F5F7]">
                R$ {plan.prices_brl?.month ? plan.prices_brl.month.toFixed(2) : (plan as any)?.price ? Number((plan as any).price).toFixed(2) : "179,90"}
              </span>
            </div>
            <h4 className="text-base font-bold text-[#F5F5F7]">{plan.name}</h4>
            <p className="text-xs text-[#9B9BA1]">{plan.description}</p>
          </div>
        )}

        <div className="pt-2 space-y-3 max-w-md mx-auto">
          <button
            id="checkout-external-redirect-btn"
            disabled={loadingCheckout}
            onClick={() => handleSubscribeExternal(plan?.slug)}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#D8B46A] to-[#B38E32] text-[#0A0A0A] shadow-xl shadow-[#D8B46A]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingCheckout ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Iniciando Checkout Stripe...</span>
              </>
            ) : (
              <>
                <span>Acessar Portal Oficial & Checkout</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            id="checkout-view-plans-btn"
            onClick={() => setActiveView("paywall")}
            className="w-full py-3 rounded-2xl text-xs font-semibold bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] transition-all cursor-pointer"
          >
            Ver outros protocolos
          </button>
        </div>

        <div className="pt-4 border-t border-[#2B2B2F] flex items-center justify-center gap-4 text-xs text-[#9B9BA1]">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#34C759]" />
            <span>Ambiente Criptografado</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#D8B46A]" />
            <span>Liberação Automática</span>
          </div>
        </div>
      </div>
    </div>
  );
};
