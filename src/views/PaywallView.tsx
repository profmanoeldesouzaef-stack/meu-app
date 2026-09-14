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

export type RecurrenceKey = "monthly" | "quarterly" | "semiannual" | "annual";

interface ProtocolCardDefinition {
  id: string;
  slug: string;
  name: string;
  badge: string;
  isPopular?: boolean;
  accentColor: "blue" | "pink" | "gold";
  description: string;
  perks: string[];
}

export const PaywallView: React.FC = () => {
  const {
    t,
    user,
    setActiveView,
    anamnesisDone,
    currentUserEmail,
  } = useApp();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null);
  const [selectedCycles, setSelectedCycles] = useState<Record<string, RecurrenceKey>>({
    force: "quarterly",
    shape: "quarterly",
    performance: "quarterly",
  });
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Carrega planos adicionais da API se disponíveis
  useEffect(() => {
    api
      .getPlans()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch((err) => console.warn("Aviso ao carregar planos da API, usando protocolos canônicos:", err));
  }, []);

  // Tabela Oficial de Preços Stripe
  const PERIODICITY_CONFIG: Record<
    RecurrenceKey,
    {
      label: string;
      discountText?: string;
      monthlyPrice: string;
      totalPrice: string;
      billingNote: string;
      stripePriceId: string;
    }
  > = {
    monthly: {
      label: "Mensal",
      discountText: undefined,
      monthlyPrice: "R$ 179,90",
      totalPrice: "R$ 179,90",
      billingNote: "Faturado R$ 179,90 mensalmente",
      stripePriceId: "price_1U9FMDF7VqDt14kN3LneAWDA",
    },
    quarterly: {
      label: "Trimestral",
      discountText: "Economia de 7%",
      monthlyPrice: "R$ 166,63",
      totalPrice: "R$ 499,90",
      billingNote: "Faturado R$ 499,90 a cada 3 meses",
      stripePriceId: "price_1U9FMDF7VqDt14kNZhtT1hIO",
    },
    semiannual: {
      label: "Semestral",
      discountText: "Economia de 17%",
      monthlyPrice: "R$ 149,98",
      totalPrice: "R$ 899,90",
      billingNote: "Faturado R$ 899,90 a cada 6 meses",
      stripePriceId: "price_1U9FMDF7VqDt14kNRVRuJWd0",
    },
    annual: {
      label: "Anual",
      discountText: "Economia de 19%",
      monthlyPrice: "R$ 144,99",
      totalPrice: "R$ 1.739,90",
      billingNote: "Faturado R$ 1.739,90 por ano",
      stripePriceId: "price_1U9FMDF7VqDt14kNu6fxBRkh",
    },
  };

  // Os 3 protocolos canônicos de alta performance Vyra
  const DEFAULT_PROTOCOLS: ProtocolCardDefinition[] = [
    {
      id: "protocolo-hipertrofia",
      slug: "force",
      name: "Protocolo Hipertrofia",
      badge: "GANHO DE MASSA & FORÇA",
      accentColor: "blue",
      description: "Construção de massa muscular densa, hipertrofia acelerada e progressão planejada de cargas.",
      perks: [
        "Acesso integral à biblioteca de treinos de força e hipertrofia",
        "Periodização científica com sobrecarga progressiva",
        "Plano nutricional anabólico calibrado para ganho limpo",
        "Suporte direto e acompanhamento com treinadores",
        "Análise biomecânica de execuções com IA Vyra",
        "Comunidade exclusiva e ranking de performance",
      ],
    },
    {
      id: "protocolo-emagrecimento",
      slug: "shape",
      name: "Protocolo Emagrecimento & Definição",
      badge: "DEFINIÇÃO & TONIFICAÇÃO",
      isPopular: true,
      accentColor: "pink",
      description: "Queima acelerada de gordura corporal, tônus muscular acentuado e definição estética impecável.",
      perks: [
        "Treinos metabólicos e musculação de alta intensidade",
        "Periodização focada em recomposição e perda de gordura",
        "Plano nutricional com déficit calórico estratégico sem fome",
        "Suporte direto e acompanhamento com treinadores e nutrição",
        "Acompanhamento fotográfico de evolução e bioimpedância",
        "Metas de hidratação, suplementação e queima diária",
      ],
    },
    {
      id: "protocolo-performance",
      slug: "performance",
      name: "Protocolo Performance",
      badge: "ALTA PERFORMANCE & DISCIPLINA",
      accentColor: "gold",
      description: "Treinamento avançado para condicionamento de elite, força máxima e transformação corporal profunda.",
      perks: [
        "Periodização completa dividida em mesociclos e picos de força",
        "Técnicas avançadas de intensificação e testes de carga (1RM)",
        "Plano nutricional dinâmico ajustado aos ciclos de esforço",
        "Suporte prioritário com equipe técnica de coaches chefes",
        "Acesso prioritário a desafios, workshops e certificados",
        "Garantia de evolução constante e métricas detalhadas",
      ],
    },
  ];

  // Mescla protocolos padrão com eventuais planos cadastrados
  const protocolsToRender: ProtocolCardDefinition[] = [...DEFAULT_PROTOCOLS];

  if (plans && plans.length > 0) {
    plans.forEach((p) => {
      const pSlug = (p.slug || "").toLowerCase();
      if (pSlug === "test") return;
      const alreadyExists = protocolsToRender.some(
        (dp) => dp.slug === pSlug || (pSlug === "reset12" && dp.slug === "performance")
      );
      if (!alreadyExists) {
        protocolsToRender.push({
          id: p.id || p.slug,
          slug: p.slug,
          name: p.name,
          badge: p.tag || "PROTOCOLO VYRA",
          accentColor: "gold",
          description: p.description || "Periodização estruturada de transformação e acompanhamento contínuo.",
          perks: Array.isArray(p.perks) && p.perks.length > 0 ? p.perks : [
            "Acesso completo aos treinos e rotinas personalizadas",
            "Periodização avançada e planejamento nutricional",
            "Suporte direto com a equipe de treinadores Vyra",
          ],
        });
      }
    });
  }

  const handleSelectCycle = (protocolSlug: string, cycleKey: RecurrenceKey) => {
    setSelectedCycles((prev) => ({
      ...prev,
      [protocolSlug]: cycleKey,
    }));
  };

  // Fluxo de Pagamento Seguro via Stripe Checkout
  const handleCheckout = async (e: React.MouseEvent<HTMLButtonElement>, protocolSlug: string) => {
    // 1. Bloqueia explicitamente qualquer recarregamento ou submit de página
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setCheckoutError(null);
    setRedirectingPlan(protocolSlug);

    const chosenCycle = selectedCycles[protocolSlug] || "quarterly";
    const currentPeriodInfo = PERIODICITY_CONFIG[chosenCycle];
    const targetPriceId = currentPeriodInfo?.stripePriceId;

    // 2. Validação estrita do priceId
    if (!targetPriceId || !targetPriceId.startsWith("price_")) {
      const invalidMsg = "ID do preço Stripe inválido para o período selecionado. Por favor, tente novamente.";
      console.error("[ERRO STRIPE CHECKOUT]:", new Error(invalidMsg), { protocolSlug, chosenCycle, targetPriceId });
      setCheckoutError(invalidMsg);
      if (typeof window !== "undefined") {
        window.alert(invalidMsg);
      }
      setRedirectingPlan(null);
      return;
    }

    try {
      // 3. Vincula o usuário atual
      let activeUser = user;
      if (!activeUser) {
        const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: null }));
        activeUser = authData?.user;
      }

      const activeUserId = activeUser?.id;
      const activeUserEmail = activeUser?.email || currentUserEmail || "";

      // 4. Origem e URLs de retorno solicitadas
      const origin = typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://vyratraining.com";

      const successUrl = `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/protocolos`;

      // 5. Chama endpoint de checkout
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: targetPriceId,
          planSlug: protocolSlug,
          recurrence: chosenCycle,
          userId: activeUserId,
          userEmail: activeUserEmail,
          successUrl,
          cancelUrl,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Erro HTTP ${res.status} ao iniciar sessão de checkout`);
      }

      const data = await res.json().catch(() => null);

      // 6. Se a resposta da API retornar uma URL da Stripe (url), redireciona diretamente
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      // Se não houver url válida retornada
      throw new Error(data?.error || "A Stripe não retornou uma URL de checkout válida.");
    } catch (err: any) {
      // 7. Tratamento de erro: NÃO redireciona nem recarrega. Exibe alerta e console.error exato
      console.error("[ERRO STRIPE CHECKOUT]:", err);
      const errorMessage = err?.message || "Erro ao iniciar checkout";
      setCheckoutError(errorMessage);
      if (typeof window !== "undefined") {
        window.alert(errorMessage);
      }
    } finally {
      setRedirectingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-16 space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho Principal: Apenas o título principal e subtítulo */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-3.5 py-1 rounded-full border border-[#D8B46A]/30 inline-block shadow-sm">
          VYRA HIGH PERFORMANCE PROTOCOLS
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F5F5F7] tracking-tight">
          Escolha seu protocolo
        </h1>
        <p className="text-sm text-[#9B9BA1] leading-relaxed">
          Periodização avançada, acompanhamento nutricional dinâmico e suporte direto com nossa equipe de treinadores de elite.
        </p>
      </div>

      {/* Alerta de Erro de Checkout se houver */}
      {checkoutError && (
        <div className="max-w-2xl mx-auto p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
          {checkoutError}
        </div>
      )}

      {/* Aviso de Anamnese se pendente */}
      {!anamnesisDone && (
        <div className="p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/30 flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-[#D8B46A] shrink-0" />
            <p className="text-xs text-[#F5F5F7]">
              Conclua sua anamnese para calibrar sua periodização e volume de treino individual.
            </p>
          </div>
          <button
            id="paywall-go-anamnesis-btn"
            onClick={() => setActiveView("anamnesis")}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#D8B46A] text-[#0A0A0A] hover:brightness-110 shrink-0 cursor-pointer transition-all"
          >
            Fazer Anamnese
          </button>
        </div>
      )}

      {/* Cards de Protocolos com Seletor Embutido e Preço Dinâmico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
        {protocolsToRender.map((protocol) => {
          const isBlue = protocol.accentColor === "blue";
          const isPink = protocol.accentColor === "pink";

          const cardStyles = isPink
            ? "border-pink-500/50 bg-gradient-to-b from-[#201018] via-[#161215] to-[#151515] shadow-2xl shadow-pink-500/10 hover:border-pink-400"
            : isBlue
            ? "border-blue-500/50 bg-gradient-to-b from-[#0e1828] via-[#111620] to-[#151515] shadow-2xl shadow-blue-500/10 hover:border-blue-400"
            : "border-[#D8B46A]/50 bg-gradient-to-b from-[#1E1B14] via-[#171614] to-[#151515] shadow-2xl shadow-[#D8B46A]/10 hover:border-[#D8B46A]";

          const badgeStyles = isPink
            ? "bg-pink-500/20 text-pink-300 border-pink-500/40"
            : isBlue
            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
            : "bg-[#D8B46A]/20 text-[#D8B46A] border-[#D8B46A]/40";

          const checkIconStyles = isPink
            ? "bg-pink-500/20 text-pink-400"
            : isBlue
            ? "bg-blue-500/20 text-blue-400"
            : "bg-[#D8B46A]/20 text-[#D8B46A]";

          const btnStyles = isPink
            ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:brightness-110 shadow-lg shadow-pink-500/25"
            : isBlue
            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:brightness-110 shadow-lg shadow-blue-500/25"
            : "bg-gradient-to-r from-[#D8B46A] to-[#B38E32] text-[#0A0A0A] hover:brightness-110 shadow-lg shadow-[#D8B46A]/25";

          const currentCycle = selectedCycles[protocol.slug] || "quarterly";
          const pricing = PERIODICITY_CONFIG[currentCycle];
          const isRedirectingThisCard = redirectingPlan === protocol.slug;

          return (
            <div
              key={protocol.id}
              id={`protocol-card-${protocol.slug}`}
              className={`p-6 sm:p-7 rounded-3xl border transition-all duration-200 flex flex-col justify-between relative group ${cardStyles}`}
            >
              <div className="space-y-4">
                {/* Cabeçalho do Card: Tag de categoria & Selo Destaque sem sobreposição */}
                <div className="flex items-center justify-between gap-2 flex-wrap min-h-[28px]">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badgeStyles}`}
                  >
                    {protocol.badge}
                  </span>

                  {protocol.isPopular && (
                    <span className="bg-gradient-to-r from-[#FF6A2A] to-[#D8B46A] text-[#0A0A0A] text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>MAIS ESCOLHIDO</span>
                    </span>
                  )}
                </div>

                {/* Título e Descrição com tipografia clara e sem sobreposição */}
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-[#F5F5F7] tracking-tight group-hover:text-white transition-colors">
                    {protocol.name}
                  </h3>
                  <p className="text-xs text-[#9B9BA1] leading-relaxed min-h-[44px]">
                    {protocol.description}
                  </p>
                </div>

                {/* Seletor de Período Embutido: 4 botões compactos */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Selecione a Periodicidade:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                    {(["monthly", "quarterly", "semiannual", "annual"] as const).map((cycleKey) => {
                      const isSelected = currentCycle === cycleKey;
                      const conf = PERIODICITY_CONFIG[cycleKey];

                      return (
                        <button
                          key={cycleKey}
                          type="button"
                          id={`card-${protocol.slug}-period-${cycleKey}-btn`}
                          onClick={() => handleSelectCycle(protocol.slug, cycleKey)}
                          className={`py-2 px-1 text-center rounded-xl text-[11px] transition-all cursor-pointer truncate flex flex-col items-center justify-center ${
                            isSelected
                              ? "border border-amber-500 bg-amber-500/10 text-white font-bold shadow-sm"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 font-medium"
                          }`}
                        >
                          <span className="leading-none">{conf.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preço Dinâmico: Valor mensal em destaque + Subtexto faturamento + Badge economia */}
                <div className="pt-3 pb-2 border-t border-[#2B2B2F]/80">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-[#F5F5F7] tracking-tight">
                        {pricing.monthlyPrice}
                      </span>
                      <span className="text-xs font-semibold text-[#9B9BA1]">/mês</span>
                    </div>

                    {pricing.discountText && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        {pricing.discountText}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                    {pricing.billingNote}
                  </p>
                </div>

                {/* Lista de Benefícios com ícones de verificação */}
                <div className="space-y-2 pt-2 border-t border-[#2B2B2F]/60">
                  <span className="text-[10px] font-bold text-[#9B9BA1] uppercase tracking-wider block">
                    Incluso no protocolo:
                  </span>
                  <div className="space-y-2">
                    {protocol.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#F5F5F7]">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${checkIconStyles}`}>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="font-medium leading-tight">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botão de Ação: "Assinar Protocolo" */}
              <div className="pt-6 mt-4 border-t border-[#2B2B2F]/40">
                <button
                  id={`btn-subscribe-protocol-${protocol.slug}`}
                  type="button"
                  disabled={Boolean(redirectingPlan)}
                  onClick={(e) => handleCheckout(e, protocol.slug)}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98] ${btnStyles}`}
                >
                  {isRedirectingThisCard ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando pagamento...</span>
                    </>
                  ) : (
                    <>
                      <span>Assinar Protocolo</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-[#9B9BA1] mt-2">
                  Checkout seguro Stripe • {pricing.label} ({pricing.monthlyPrice}/mês)
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção de Confiança e Garantia */}
      <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center shrink-0 border border-[#34C759]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[#34C759] tracking-wider">
              COMPROMISSO DE RESULTADOS VYRA
            </span>
            <h4 className="text-base font-bold text-[#F5F5F7] mt-0.5">
              Garantia Incondicional de 7 Dias
            </h4>
            <p className="text-xs text-[#9B9BA1] mt-0.5">
              Experimente o protocolo completo. Se você não notar diferença real na sua rotina e treinos, devolvemos 100% do seu investimento.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#9B9BA1] flex items-center gap-2 shrink-0 bg-[#1D1D1F] px-4 py-2.5 rounded-xl border border-[#2B2B2F]">
          <Zap className="w-4 h-4 text-[#FF6A2A]" />
          <span>Ativação em tempo real</span>
        </div>
      </div>
    </div>
  );
};
