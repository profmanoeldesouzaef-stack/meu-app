import React from "react";
import { useApp } from "../context/AppContext";
import {
  Lock,
  ShieldCheck,
  ClipboardCheck,
  Camera,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface AccessGateProps {
  type: "payment" | "anamnesis_photos";
  title: string;
  description: string;
  tabName: "treinos" | "dieta" | "desafios";
}

export const AccessGate: React.FC<AccessGateProps> = ({
  type,
  title,
  description,
  tabName,
}) => {
  const {
    setActiveView,
    anamnesisDone,
    photosDone,
    setSubscription,
    setAnamnesisDone,
    setPhotosDone,
  } = useApp();

  const handleSimulatePayment = () => {
    setSubscription({
      active: true,
      planId: "shape",
      billingCycle: "quarterly",
      expiresAt: "2026-12-31",
    });
  };

  const handleSimulateAnamnesisPhotos = () => {
    setAnamnesisDone(true);
    setPhotosDone(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 pb-28 md:pb-12 animate-in fade-in duration-300">
      <div className="p-6 sm:p-10 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-6 text-center relative overflow-hidden shadow-2xl">
        {/* Ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF6A2A]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6A2A]/20 to-[#D8B46A]/20 border border-[#FF6A2A]/40 flex items-center justify-center mx-auto text-[#FF6A2A] shadow-lg shadow-[#FF6A2A]/10">
          {type === "payment" ? (
            <Lock className="w-8 h-8 stroke-[2.2]" />
          ) : (
            <ClipboardCheck className="w-8 h-8 stroke-[2.2] text-[#D8B46A]" />
          )}
        </div>

        {/* Badges and Titles */}
        <div className="space-y-2">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
              type === "payment"
                ? "bg-[#FF6A2A]/15 text-[#FF9A62] border-[#FF6A2A]/30"
                : "bg-[#D8B46A]/15 text-[#D8B46A] border-[#D8B46A]/30"
            }`}
          >
            {type === "payment"
              ? "Exclusivo para Alunos Assinantes"
              : "Etapa Obrigatória de Liberação"}
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
            {title}
          </h2>

          <p className="text-sm text-[#9B9BA1] max-w-lg mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Checklist for Anamnesis and Photos */}
        {type === "anamnesis_photos" && (
          <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] max-w-md mx-auto space-y-2.5 text-left">
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                {anamnesisDone ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#FF9A62]" />
                )}
                <span className="font-semibold text-[#F5F5F7]">
                  1. Questionário de Anamnese Esportiva
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  anamnesisDone
                    ? "bg-[#34C759]/20 text-[#34C759]"
                    : "bg-[#FF6A2A]/20 text-[#FF9A62]"
                }`}
              >
                {anamnesisDone ? "Concluída" : "Pendente"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                {photosDone ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                ) : (
                  <Camera className="w-4 h-4 text-[#6D9BFF]" />
                )}
                <span className="font-semibold text-[#F5F5F7]">
                  2. Fotografias Corporais de Postura
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  photosDone
                    ? "bg-[#34C759]/20 text-[#34C759]"
                    : "bg-[#6D9BFF]/20 text-[#6D9BFF]"
                }`}
              >
                {photosDone ? "Enviadas" : "Pendentes"}
              </span>
            </div>
          </div>
        )}

        {/* Primary CTA */}
        <div className="pt-2 max-w-md mx-auto space-y-3">
          {type === "payment" ? (
            <button
              id="gate-activate-plan-btn"
              onClick={() => setActiveView("paywall")}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 active:scale-[0.99] shadow-xl shadow-[#FF6A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Escolher Protocolo & Ativar Assinatura</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="gate-complete-anamnesis-btn"
              onClick={() => setActiveView("anamnesis")}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 active:scale-[0.99] shadow-xl shadow-[#FF6A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Preencher Anamnese & Anexar Fotos</span>
            </button>
          )}

          {/* Quick Demo Helper (allows immediate preview/testing without card payment or file uploads) */}
          <div className="pt-2 border-t border-[#2B2B2F]/60 flex items-center justify-center gap-2">
            {type === "payment" ? (
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="text-[11px] font-semibold text-[#9B9BA1] hover:text-[#FF9A62] transition-colors underline"
              >
                Modo Teste: Simular Pagamento Concluído
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSimulateAnamnesisPhotos}
                className="text-[11px] font-semibold text-[#9B9BA1] hover:text-[#D8B46A] transition-colors underline"
              >
                Modo Teste: Concluir Anamnese & Fotos Agora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
