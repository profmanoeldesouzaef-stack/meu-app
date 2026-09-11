import React from "react";
import {
  Award,
  Shield,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Crown,
  Medal,
  Zap,
} from "lucide-react";

export interface PatentDefinition {
  level: number;
  roman: string;
  name: string;
  minMonths: number;
  nextMonths?: number;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  stars: number;
  description: string;
  badgeLabel: string;
}

export const PATENTS: PatentDefinition[] = [
  {
    level: 1,
    roman: "I",
    name: "Patente I",
    minMonths: 3,
    nextMonths: 6,
    bgGradient: "from-[#8C52FF]/25 via-[#6D38D9]/20 to-[#4C1D95]/30",
    borderColor: "border-[#8C52FF]/60",
    textColor: "text-[#A78BFA]",
    glowColor: "rgba(140, 82, 255, 0.25)",
    stars: 1,
    description: "3 meses consecutivos de mensalidade ativa sem interrupção.",
    badgeLabel: "Patente I · 3 Meses",
  },
  {
    level: 2,
    roman: "II",
    name: "Patente II",
    minMonths: 6,
    nextMonths: 9,
    bgGradient: "from-[#00C0FF]/25 via-[#0284C7]/20 to-[#0369A1]/30",
    borderColor: "border-[#00C0FF]/60",
    textColor: "text-[#38BDF8]",
    glowColor: "rgba(0, 192, 255, 0.25)",
    stars: 2,
    description: "6 meses consecutivos de mensalidade ativa sem interrupção.",
    badgeLabel: "Patente II · 6 Meses",
  },
  {
    level: 3,
    roman: "III",
    name: "Patente III",
    minMonths: 9,
    nextMonths: 12,
    bgGradient: "from-[#34C759]/25 via-[#16A34A]/20 to-[#14532D]/30",
    borderColor: "border-[#34C759]/60",
    textColor: "text-[#4ADE80]",
    glowColor: "rgba(52, 199, 89, 0.25)",
    stars: 3,
    description: "9 meses consecutivos de fidelidade no programa.",
    badgeLabel: "Patente III · 9 Meses",
  },
  {
    level: 4,
    roman: "IV",
    name: "Patente IV",
    minMonths: 12,
    nextMonths: 15,
    bgGradient: "from-[#FF9A62]/30 via-[#FF6A2A]/25 to-[#C2410C]/35",
    borderColor: "border-[#FF6A2A]/70",
    textColor: "text-[#FF9A62]",
    glowColor: "rgba(255, 106, 42, 0.3)",
    stars: 4,
    description: "1 Ano Completo (12 meses) de mensalidade ativa ininterrupta.",
    badgeLabel: "Patente IV · 1 Ano",
  },
  {
    level: 5,
    roman: "V",
    name: "Patente V",
    minMonths: 15,
    nextMonths: 18,
    bgGradient: "from-[#EC4899]/25 via-[#BE185D]/20 to-[#831843]/30",
    borderColor: "border-[#EC4899]/60",
    textColor: "text-[#F472B6]",
    glowColor: "rgba(236, 72, 153, 0.25)",
    stars: 5,
    description: "15 meses de recorrência contínua de alto nível.",
    badgeLabel: "Patente V · 15 Meses",
  },
  {
    level: 6,
    roman: "VI",
    name: "Patente VI",
    minMonths: 18,
    bgGradient: "from-[#D8B46A]/35 via-[#F59E0B]/30 to-[#B45309]/40",
    borderColor: "border-[#D8B46A]/80",
    textColor: "text-[#FCD34D]",
    glowColor: "rgba(216, 180, 106, 0.35)",
    stars: 6,
    description: "Patente Suprema: 18+ meses de mensalidade ativa ininterrupta.",
    badgeLabel: "Patente VI · Suprema",
  },
];

export interface ProgressionOptions {
  activeProtocol?: string;
  planType?: string;
  hasContinuousPlan?: boolean;
  daysCompleted?: number;
}

export function getPatentInfo(
  consecutiveMonths: number = 0,
  monthlyFeePaid: boolean = true,
  options?: ProgressionOptions
): {
  level: number;
  patent: PatentDefinition | null;
  nextPatent: PatentDefinition | null;
  monthsToNext: number;
  isRevoked: boolean;
  activeMonths: number;
  qualifiesForFirstStar: boolean;
} {
  // Regra clara de negócio: se não estiver pagando a mensalidade em dia, perde a patente!
  if (!monthlyFeePaid) {
    return {
      level: 0,
      patent: null,
      nextPatent: PATENTS[0],
      monthsToNext: 3,
      isRevoked: true,
      activeMonths: 0,
      qualifiesForFirstStar: false,
    };
  }

  const safeMonths = Math.max(0, consecutiveMonths);

  // Regra da Primeira Estrela (Gamificação Reset 12 Semanas):
  // A 1ª estrela/insígnia de progressão NÃO é concedida no início.
  // Ela só é liberada após a conclusão dos 3 meses (84 dias completos)
  // E mediante a renovação/migração ativa para um dos planos contínuos (Vyra Shape ou Vyra Forge).
  const isContinuous =
    options?.hasContinuousPlan ||
    (options?.activeProtocol
      ? options.activeProtocol.toLowerCase().includes("shape") ||
        options.activeProtocol.toLowerCase().includes("forge") ||
        options.activeProtocol.toLowerCase().includes("force")
      : false) ||
    (options?.planType
      ? ["shape", "force", "forge", "monthly", "quarterly", "semiannual", "yearly"].includes(
          options.planType.toLowerCase()
        )
      : false);

  const isResetOnly =
    options?.activeProtocol?.toLowerCase().includes("reset") ||
    options?.planType === "reset12";

  // Se o aluno ainda está estritamente no Reset inicial ou não atingiu 3 meses / 84 dias completos,
  // ou se atingiu 3 meses mas ainda não migrou para um plano contínuo (Shape/Forge):
  const qualifiesForFirstStar =
    safeMonths >= 3 && (!isResetOnly || isContinuous);

  let current: PatentDefinition | null = null;
  let next: PatentDefinition | null = PATENTS[0];

  if (qualifiesForFirstStar) {
    for (let i = PATENTS.length - 1; i >= 0; i--) {
      if (safeMonths >= PATENTS[i].minMonths) {
        current = PATENTS[i];
        next = i + 1 < PATENTS.length ? PATENTS[i + 1] : null;
        break;
      }
    }
  }

  const monthsToNext = next ? Math.max(0, next.minMonths - safeMonths) : 0;

  return {
    level: current ? current.level : 0,
    patent: current,
    nextPatent: next,
    monthsToNext,
    isRevoked: false,
    activeMonths: safeMonths,
    qualifiesForFirstStar,
  };
}

export function getStarEvolutionInfo(
  consecutiveMonths: number = 0,
  options?: ProgressionOptions
) {
  const totalMonths = Math.max(0, consecutiveMonths);

  // Regra da Primeira Estrela:
  // Se ainda não concluiu 3 meses (84 dias) ou se ainda está apenas no plano Reset sem migrar para Shape/Forge,
  // nenhuma estrela é atribuída!
  const isContinuous =
    options?.hasContinuousPlan ||
    (options?.activeProtocol
      ? options.activeProtocol.toLowerCase().includes("shape") ||
        options.activeProtocol.toLowerCase().includes("forge") ||
        options.activeProtocol.toLowerCase().includes("force")
      : false) ||
    (options?.planType
      ? ["shape", "force", "forge", "monthly", "quarterly", "semiannual", "yearly"].includes(
          options.planType.toLowerCase()
        )
      : false);

  const isResetOnly =
    options?.activeProtocol?.toLowerCase().includes("reset") ||
    options?.planType === "reset12";

  const qualifies = totalMonths >= 3 && (!isResetOnly || isContinuous);

  const effectiveMonths = qualifies ? totalMonths : 0;
  const evolvedStars = Math.floor(effectiveMonths / 5);
  const singleStars = effectiveMonths % 5;
  const hasFiveStarsReached = effectiveMonths >= 5;

  return {
    totalMonths: effectiveMonths,
    totalStars: effectiveMonths,
    evolvedStars,
    singleStars,
    hasFiveStarsReached,
    qualifiesForFirstStar: qualifies,
  };
}

export function hasChatCustomizationUnlocked(consecutiveMonths: number = 0) {
  return consecutiveMonths >= 5;
}

export const CHAT_NAME_COLOR_PRESETS = [
  { name: "Ouro Vyra", hex: "#D8B46A" },
  { name: "Fogo Radiante", hex: "#FF6A2A" },
  { name: "Ciano Elétrico", hex: "#00E5FF" },
  { name: "Roxo Cósmico", hex: "#A855F7" },
  { name: "Verde Esmeralda", hex: "#34C759" },
  { name: "Rubi Supremo", hex: "#FF2D55" },
  { name: "Rosa Neon", hex: "#F43F5E" },
  { name: "Prata Real", hex: "#E2E8F0" },
];

export const CHAT_TEXT_COLOR_PRESETS = [
  { name: "Branco Puro", hex: "#F5F5F7" },
  { name: "Dourado Champanhe", hex: "#FFE4A0" },
  { name: "Menta Fresco", hex: "#A7F3D0" },
  { name: "Azul Polar", hex: "#BAE6FD" },
  { name: "Lavanda Suave", hex: "#DDD6FE" },
  { name: "Pêssego Quente", hex: "#FED7AA" },
];

/**
 * Selo de Veterano
 * Design exclusivo entre laranja e dourado (From #FF6A2A to #D8B46A), metálico, sofisticado.
 * Em comunidade e chat: exibe apenas a coroa sem o texto.
 */
export const VeteranBadge: React.FC<{
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}> = ({ size = "sm", showLabel = false, className = "" }) => {
  const sizeClasses = {
    xs: "p-1 text-[9px] gap-1",
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-4.5 h-4.5",
  };

  return (
    <span
      title="Membro Veterano Oficial"
      className={`inline-flex items-center rounded-full font-black tracking-wider uppercase bg-gradient-to-r from-[#FF6A2A] via-[#E5A93C] to-[#D8B46A] text-[#121214] shadow-md shadow-[#FF6A2A]/25 border border-[#FFE4A0]/60 select-none hover:brightness-110 transition-all ${sizeClasses[size]} ${className}`}
    >
      <Crown className={`${iconSizes[size]} fill-[#121214] stroke-[2] shrink-0`} />
      {showLabel && (
        <span className="font-extrabold tracking-widest text-[#0D0D0F]">VETERANO</span>
      )}
    </span>
  );
};

/**
 * Selo de Patente Militar Estilizado
 * Exibido no Perfil, Chat Global e Desafios.
 * Em comunidade e chat: apenas a medalha (única se >= 5 patentes) e as estrelas (mês a mês e evoluídas a cada 5 meses).
 */
export const PatentBadge: React.FC<{
  level?: number;
  months?: number;
  isPaid?: boolean;
  activeProtocol?: string;
  planType?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showTooltip?: boolean;
  showLabel?: boolean;
  isRevoked?: boolean;
  className?: string;
}> = ({
  level,
  months = 0,
  isPaid = true,
  activeProtocol,
  planType,
  size = "sm",
  showTooltip = true,
  showLabel = false,
  isRevoked: propIsRevoked,
  className = "",
}) => {
  const info = getPatentInfo(months, propIsRevoked ? false : isPaid, {
    activeProtocol,
    planType,
  });
  const patent =
    level !== undefined
      ? PATENTS.find((p) => p.level === level) || null
      : info.patent;

  const isActuallyRevoked = propIsRevoked !== undefined ? propIsRevoked : info.isRevoked;

  if (isActuallyRevoked || !patent) {
    if (size === "xs") return null;
    return (
      <span
        title={
          isActuallyRevoked
            ? "Mensalidade inativa: Patente revogada. Ao reativar, reinicia do zero."
            : "Sem patente ainda (Requer conclusão de 84 dias + migração para plano contínuo Vyra Shape/Forge)"
        }
        className={`inline-flex items-center gap-1 rounded-full font-bold text-[9px] px-2 py-0.5 bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] ${className}`}
      >
        <Shield className="w-2.5 h-2.5 text-[#6E6E73]" />
        <span>{isActuallyRevoked ? "Inadimplente" : "Iniciante"}</span>
      </span>
    );
  }

  const effectiveMonths = months > 0 ? months : patent.minMonths;
  const starInfo = getStarEvolutionInfo(effectiveMonths, {
    activeProtocol,
    planType,
  });

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[9px] gap-1",
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  // Se atingiu 5 medalhas / patente 5+, fica apenas uma medalha suprema e diferenciada
  const isSupremeMedal = patent.level >= 5;

  return (
    <span
      title={
        showTooltip
          ? `${patent.name} · ${effectiveMonths} Meses Ativos (${starInfo.evolvedStars} Estrelas Evoluídas, ${starInfo.singleStars} Estrelas)`
          : undefined
      }
      className={`inline-flex items-center rounded-full font-black tracking-wider uppercase bg-gradient-to-r ${patent.bgGradient} ${patent.textColor} border ${patent.borderColor} shadow-sm select-none hover:scale-105 transition-transform ${sizeClasses[size]} ${className}`}
      style={{ boxShadow: `0 2px 8px ${patent.glowColor}` }}
    >
      {isSupremeMedal ? (
        <span
          title="Medalha Suprema Evoluída (5+ Patentes)"
          className="flex items-center justify-center p-0.5 rounded-full bg-gradient-to-tr from-[#D8B46A] to-[#FFF0B3] text-[#0A0A0A] shadow-md shadow-[#D8B46A]/50 ring-1 ring-[#FFE4A0]"
        >
          <Award className={`${iconSizes[size]} shrink-0 stroke-[2.5]`} />
        </span>
      ) : (
        <Medal className={`${iconSizes[size]} shrink-0 stroke-[2.5]`} />
      )}

      {showLabel && <span className="font-extrabold tracking-wider">{patent.name}</span>}

      {/* Estrelas: Mês a Mês com transformação em Estrela Evoluída a cada 5 meses */}
      <span className="inline-flex items-center gap-0.5 text-[9px] tracking-tight ml-0.5">
        {/* Estrelas Evoluídas (a cada 5 meses) */}
        {Array.from({ length: starInfo.evolvedStars }).map((_, idx) => (
          <span
            key={`evo-${idx}`}
            title="Estrela Evoluída (Marco de 5 Meses)"
            className="text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.9)] animate-pulse inline-block"
          >
            ★
          </span>
        ))}

        {/* Estrelas Simples Mês a Mês */}
        {Array.from({ length: starInfo.singleStars }).map((_, idx) => (
          <span key={`single-${idx}`} className="opacity-80">
            ★
          </span>
        ))}
      </span>
    </span>
  );
};

/**
 * Card Completo do Sistema de Patentes por Recorrência de Mensalidade
 */
export const PatentRecurrenceCard: React.FC<{
  consecutiveMonths: number;
  monthlyFeePaid: boolean;
  isVeteran: boolean;
  activeProtocol?: string;
  planType?: string;
  onUpdateRecurrence: (months: number, isPaid: boolean) => void;
  onApplyVeteranCoupon: (code: string) => { success: boolean; message: string };
}> = ({
  consecutiveMonths,
  monthlyFeePaid,
  isVeteran,
  activeProtocol,
  planType,
  onUpdateRecurrence,
  onApplyVeteranCoupon,
}) => {
  const [couponInput, setCouponInput] = React.useState("");
  const [couponMsg, setCouponMsg] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [showSimulator, setShowSimulator] = React.useState(false);

  const patentInfo = getPatentInfo(consecutiveMonths, monthlyFeePaid, {
    activeProtocol,
    planType,
  });

  const handleRedeemCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = onApplyVeteranCoupon(couponInput.trim());
    setCouponMsg({ text: res.message, ok: res.success });
    if (res.success) {
      setCouponInput("");
    }
  };

  return (
    <div className="space-y-4">
      {/* CARD 1: SELO DE VETERANO (CUPOM VETERANO) */}
      <div
        id="veteran-coupon-card"
        className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          isVeteran
            ? "bg-gradient-to-br from-[#1F140A] via-[#1A130A] to-[#120F08] border-[#FF9A62]/60 shadow-xl shadow-[#FF6A2A]/10 ring-1 ring-[#D8B46A]/30"
            : "bg-[#151515] border-[#2B2B2F]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isVeteran
                  ? "bg-gradient-to-br from-[#FF6A2A] to-[#D8B46A] text-[#121214] shadow-lg shadow-[#FF6A2A]/30"
                  : "bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F]"
              }`}
            >
              <Crown className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#F5F5F7]">
                  Selo de Veterano Vyra
                </h3>
                {isVeteran ? (
                  <VeteranBadge size="sm" />
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F]">
                    Disponível via Cupom
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9B9BA1] mt-1 max-w-xl leading-relaxed">
                {isVeteran
                  ? "Parabéns! Você ativou o cupom VETERANO. Seu selo exclusivo laranja e dourado está ativo e visível no seu Perfil, no Chat Global e nos Desafios do site."
                  : "Insira o cupom especial 'veterano' para receber o selo exclusivo de veterano com gradiente laranja e dourado no seu perfil, chat e desafios!"}
              </p>
            </div>
          </div>

          {/* Form to enter / verify coupon */}
          {!isVeteran ? (
            <form onSubmit={handleRedeemCoupon} className="space-y-2 shrink-0 w-full sm:w-auto">
              <div className="flex gap-2">
                <input
                  id="veteran-coupon-input"
                  type="text"
                  placeholder="Digite seu cupom"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="px-3.5 py-2 rounded-xl bg-[#0D0D0F] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none focus:border-[#D8B46A] uppercase"
                />
                <button
                  id="redeem-veteran-coupon-btn"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6A2A] to-[#D8B46A] text-[#0A0A0A] font-black text-xs hover:brightness-110 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Resgatar
                </button>
              </div>
              {couponMsg && (
                <p
                  className={`text-[11px] font-bold ${
                    couponMsg.ok ? "text-[#34C759]" : "text-[#FF453A]"
                  }`}
                >
                  {couponMsg.text}
                </p>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="px-3 py-1.5 rounded-xl bg-[#34C759]/15 border border-[#34C759]/40 text-[#34C759] text-xs font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Selo Concedido</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: SISTEMA DE PATENTES POR RECORRÊNCIA DE MENSALIDADE */}
      <div
        id="patent-recurrence-card"
        className="p-5 sm:p-7 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-6 shadow-xl relative overflow-hidden"
      >
        {/* Header with current status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2B2B2F]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                patentInfo.isRevoked
                  ? "bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40"
                  : patentInfo.patent
                  ? `bg-gradient-to-br ${patentInfo.patent.bgGradient} ${patentInfo.patent.textColor} border ${patentInfo.patent.borderColor}`
                  : "bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F]"
              }`}
            >
              {patentInfo.isRevoked ? (
                <AlertTriangle className="w-7 h-7" />
              ) : patentInfo.patent ? (
                <Medal className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <Shield className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#F5F5F7]">
                  Sistema de Patentes Vyra
                </h3>
                {patentInfo.patent ? (
                  <PatentBadge
                    months={consecutiveMonths}
                    isPaid={monthlyFeePaid}
                    size="md"
                  />
                ) : patentInfo.isRevoked ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40 uppercase tracking-wider">
                    Patente Revogada (Inadimplente)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] uppercase">
                    Recruta (Mês {consecutiveMonths}/3)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-[#9B9BA1]">
                <span>
                  Tempo Ativo:{" "}
                  <strong className="text-[#F5F5F7]">
                    {consecutiveMonths} {consecutiveMonths === 1 ? "mês consecutivo" : "meses consecutivos"}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Status:
                  {monthlyFeePaid ? (
                    <strong className="text-[#34C759] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                      Mensalidade em Dia
                    </strong>
                  ) : (
                    <strong className="text-[#FF453A] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A]" />
                      Mensalidade Pausada
                    </strong>
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            id="toggle-patent-simulator-btn"
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-3.5 py-2 rounded-xl bg-[#1D1D1F] hover:bg-[#252528] text-xs font-bold text-[#D8B46A] border border-[#2B2B2F] hover:border-[#D8B46A]/50 transition-colors flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{showSimulator ? "Ocultar Simulador" : "Simular Meses / Pagamento"}</span>
          </button>
        </div>

        {/* Inadimplência / Reset Rule Highlight */}
        {patentInfo.isRevoked ? (
          <div className="p-4 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/40 text-xs text-[#FF857F] space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-[#FF453A] uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4" />
              Regra de Inadimplência Aplicada
            </div>
            <p className="leading-relaxed">
              Como a mensalidade foi pausada ou não paga, suas patentes foram revogadas. Ao reiniciar o pagamento e reativar o programa, a contagem de meses zera e você recomeça a progressão para a Patente I.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#0D0D0E] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D8B46A] block">
                Regra de Patentes e Primeira Estrela
              </span>
              <p className="text-[#9B9BA1]">
                A primeira estrela/insígnia é conquistada após a conclusão dos 3 meses (84 dias completos) e mediante renovação/migração ativa para um plano contínuo (Vyra Shape ou Forge). A cada <strong>3 meses consecutivos</strong> de assinatura ativa, o aluno sobe de patente.
              </p>
            </div>
            {patentInfo.nextPatent && (
              <div className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-right shrink-0">
                <span className="text-[10px] text-[#9B9BA1] block uppercase">Próxima Patente</span>
                <span className="text-xs font-black text-[#F5F5F7]">
                  {patentInfo.nextPatent.name} em {patentInfo.monthsToNext} {patentInfo.monthsToNext === 1 ? "mês" : "meses"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar towards next patent */}
        {!patentInfo.isRevoked && patentInfo.nextPatent && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9B9BA1]">
                Progresso atual:{" "}
                <strong className="text-[#F5F5F7]">
                  {consecutiveMonths} meses
                </strong>{" "}
                de {patentInfo.nextPatent.minMonths} meses
              </span>
              <span className="text-[#D8B46A] font-bold">
                Faltam {patentInfo.monthsToNext} {patentInfo.monthsToNext === 1 ? "mês" : "meses"}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#1D1D1F] overflow-hidden border border-[#2B2B2F]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6A2A] to-[#D8B46A] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (consecutiveMonths / patentInfo.nextPatent.minMonths) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 6-Level Visual Roadmap: De 3 em 3 meses */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#9B9BA1] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#D8B46A]" />
            Patentes do Programa (De 3 em 3 meses)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PATENTS.map((p) => {
              const isUnlocked =
                !patentInfo.isRevoked && consecutiveMonths >= p.minMonths;
              const isCurrent =
                !patentInfo.isRevoked &&
                patentInfo.patent &&
                patentInfo.patent.level === p.level;

              return (
                <div
                  key={p.level}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? `bg-gradient-to-br ${p.bgGradient} ${p.borderColor} shadow-lg ring-1 ring-white/10`
                      : isUnlocked
                      ? "bg-[#1A1A1E] border-[#34C759]/40 opacity-95"
                      : "bg-[#101012] border-[#222225] opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#F5F5F7]">
                        {p.roman}
                      </span>
                      <span className="text-xs font-bold text-[#F5F5F7]">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#9B9BA1] bg-[#0A0A0A] px-2 py-0.5 rounded-md border border-[#2B2B2F]">
                      {p.minMonths} Meses
                    </span>
                  </div>

                  <p className="text-[11px] text-[#9B9BA1] mt-1.5 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#2B2B2F]/60 flex items-center justify-between text-[10px]">
                    <span className="text-[#D8B46A]">
                      {"★".repeat(p.stars)}
                    </span>
                    {isCurrent ? (
                      <span className="text-[#34C759] font-black uppercase">
                        Sua Patente Atual
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[#34C759] font-bold">
                        Conquistada
                      </span>
                    ) : (
                      <span className="text-[#6E6E73]">
                        Bloqueada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Simulator Panel */}
        {showSimulator && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0C0E] border border-[#D8B46A]/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#D8B46A] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Simulador de Recorrência & Fidelidade
              </span>
              <span className="text-[10px] text-[#9B9BA1]">
                Teste como o sistema reage ao tempo e pagamento
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onUpdateRecurrence(consecutiveMonths + 1, true)}
                className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-[#252528] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] cursor-pointer"
              >
                +1 Mês Pago
              </button>
              <button
                type="button"
                onClick={() => onUpdateRecurrence(consecutiveMonths + 3, true)}
                className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-[#252528] border border-[#2B2B2F] text-xs font-bold text-[#D8B46A] cursor-pointer"
              >
                +3 Meses Pagos (Subir Patente)
              </button>
              <button
                type="button"
                onClick={() => onUpdateRecurrence(12, true)}
                className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-[#252528] border border-[#2B2B2F] text-xs font-bold text-[#FF9A62] cursor-pointer"
              >
                Definir 1 Ano (12 Meses - Patente IV)
              </button>
              <button
                type="button"
                onClick={() => onUpdateRecurrence(consecutiveMonths, false)}
                className="px-3 py-1.5 rounded-xl bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border border-[#FF453A]/40 text-xs font-bold text-[#FF453A] cursor-pointer"
              >
                Simular Inadimplência (Perder Patente)
              </button>
              <button
                type="button"
                onClick={() => onUpdateRecurrence(1, true)}
                className="px-3 py-1.5 rounded-xl bg-[#34C759]/15 hover:bg-[#34C759]/25 border border-[#34C759]/40 text-xs font-bold text-[#34C759] cursor-pointer"
              >
                Reativar Pagamento (Recomeçar do Zero)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

