import React from "react";
import { Linking } from "react-native";
import { useApp } from "../context/AppContext";
import {
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  Lock,
  Zap,
} from "lucide-react";

export const CheckoutView: React.FC = () => {
  const {
    selectedPlan,
    setActiveView,
  } = useApp();

  const handleSubscribeExternal = (planSlug?: string) => {
    const targetUrl = planSlug
      ? `https://vyratraining.com?plan=${planSlug}`
      : "https://vyratraining.com";
    try {
      if (typeof Linking !== "undefined" && Linking?.openURL) {
        Linking.openURL(targetUrl).catch(() => {
          if (typeof window !== "undefined") {
            window.open(targetUrl, "_blank");
          }
        });
      } else if (typeof window !== "undefined") {
        window.open(targetUrl, "_blank");
      }
    } catch {
      if (typeof window !== "undefined") {
        window.open(targetUrl, "_blank");
      }
    }
  };

  const plan = selectedPlan?.plan;

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
        <div className="w-16 h-16 rounded-2xl bg-[#FF6A2A]/15 text-[#FF6A2A] border border-[#FF6A2A]/30 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#34C759] bg-[#34C759]/15 px-3 py-1 rounded-full border border-[#34C759]/30 inline-block">
            Portal Oficial Seguro
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
            Contratação Direta na Web
          </h2>
          <p className="text-sm text-[#9B9BA1] max-w-lg mx-auto leading-relaxed">
            A assinatura e ativação dos protocolos são realizadas de forma segura em nosso portal oficial. O aplicativo móvel não processa transações financeiras internamente para total transparência e conformidade.
          </p>
        </div>

        {plan && (
          <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-left max-w-md mx-auto">
            <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
              Protocolo Selecionado
            </span>
            <h4 className="text-base font-bold text-[#F5F5F7] mt-0.5">{plan.name}</h4>
            <p className="text-xs text-[#9B9BA1] mt-1">{plan.description}</p>
          </div>
        )}

        <div className="pt-2 space-y-3 max-w-md mx-auto">
          <button
            id="checkout-external-redirect-btn"
            onClick={() => handleSubscribeExternal(plan?.slug)}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-xl shadow-[#FF6A2A]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ir para o Portal Oficial Vyra</span>
            <ExternalLink className="w-4 h-4" />
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
            <Zap className="w-3.5 h-3.5 text-[#FF6A2A]" />
            <span>Liberação Automática</span>
          </div>
        </div>
      </div>
    </div>
  );
};
