import React from "react";
import { useApp } from "../context/AppContext";
import { Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface EmptyStatePaywallProps {
  onGoToProfile?: () => void;
  message?: string;
  buttonText?: string;
}

export const EmptyStatePaywall: React.FC<EmptyStatePaywallProps> = ({
  onGoToProfile,
  message = "Assinatura Inativa. Libere seu acesso para visualizar seu treino e dieta.",
  buttonText = "Assinar Agora",
}) => {
  const { setActiveView } = useApp();

  const handleRedirect = () => {
    if (onGoToProfile) {
      onGoToProfile();
    } else {
      setActiveView("profile");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 pb-28 md:pb-16 animate-in fade-in duration-300">
      <div className="p-7 sm:p-10 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-6 text-center relative overflow-hidden shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF6A2A]/15 blur-3xl rounded-full pointer-events-none" />

        {/* Ícone de Cadeado de Proteção */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6A2A]/20 to-[#D8B46A]/20 border border-[#FF6A2A]/40 flex items-center justify-center mx-auto text-[#FF6A2A] shadow-lg shadow-[#FF6A2A]/10">
          <Lock className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Badge & Mensagem Oficial Obrigatória */}
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-[#FF6A2A]/15 text-[#FF9A62] border-[#FF6A2A]/30">
            <Sparkles className="w-3 h-3 text-[#FF9A62]" />
            <span>Acesso Restrito · Alunos Vyra</span>
          </span>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F7] tracking-tight leading-snug">
            {message}
          </h2>

          <p className="text-xs sm:text-sm text-[#9B9BA1] max-w-md mx-auto leading-relaxed">
            Seu acompanhamento individualizado com periodização, prescrição de exercícios e planejamento de macros está aguardando a ativação do seu protocolo.
          </p>
        </div>

        {/* Botão de Ação: Redireciona para a tela de Perfil (onde está o botão 'Meu Protocolo') */}
        <div className="pt-2 max-w-sm mx-auto space-y-3">
          <button
            id="btn-empty-paywall-subscribe"
            onClick={handleRedirect}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 active:scale-[0.99] shadow-xl shadow-[#FF6A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#9B9BA1] pt-1">
            <ShieldCheck className="w-4 h-4 text-[#34C759]" />
            <span>Garantia incondicional de 7 dias · Pagamento 100% Criptografado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
