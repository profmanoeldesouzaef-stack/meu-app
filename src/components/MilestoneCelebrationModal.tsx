import React, { useEffect, useState } from "react";
import { Crown, Medal, Award, Sparkles, X, Check, ArrowRight, Palette } from "lucide-react";
import { VeteranBadge, PatentBadge, getStarEvolutionInfo } from "../lib/patents";

export interface MilestoneCelebrationData {
  type: "veteran" | "patent" | "five_stars";
  level?: number;
  months?: number;
  title: string;
  subtitle: string;
  badgeLabel?: string;
}

interface MilestoneCelebrationModalProps {
  data: MilestoneCelebrationData | null;
  onClose: () => void;
  onOpenColorPicker?: () => void;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  data,
  onClose,
  onOpenColorPicker,
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; color: string; size: number; delay: number }>>([]);

  useEffect(() => {
    if (!data) return;

    // Generate celebratory confetti particles
    const colors =
      data.type === "five_stars"
        ? ["#FFD700", "#FFF0B3", "#FFA000", "#FFE4A0", "#FFFFFF"]
        : data.type === "veteran"
        ? ["#FF6A2A", "#D8B46A", "#FFA726", "#FFE4A0", "#FFFFFF"]
        : ["#D8B46A", "#6D9BFF", "#34C759", "#A855F7", "#F5F5F7"];

    const newParticles = Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.8,
    }));

    setParticles(newParticles);
  }, [data]);

  if (!data) return null;

  const starInfo = getStarEvolutionInfo(data.months || 5);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300">
      {/* Falling and floating celebratory particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-bounce"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
              animationDuration: `${1.5 + (p.id % 3) * 0.5}s`,
              animationDelay: `${p.delay}s`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 text-center space-y-5 border shadow-2xl z-10 transition-all ${
          data.type === "five_stars"
            ? "bg-gradient-to-b from-[#1F1905] via-[#14120A] to-[#0A0A0A] border-[#FFD700]/70 shadow-[#FFD700]/25"
            : data.type === "veteran"
            ? "bg-gradient-to-b from-[#1F1208] via-[#140F0A] to-[#0A0A0A] border-[#FF6A2A]/70 shadow-[#FF6A2A]/25"
            : "bg-gradient-to-b from-[#15151A] via-[#121215] to-[#0A0A0A] border-[#D8B46A]/60 shadow-[#D8B46A]/20"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#1D1D1F]/80 text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#2B2B2F] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Central Animated Badge Icon */}
        <div className="relative inline-flex items-center justify-center mx-auto my-2">
          {/* Radial Pulses */}
          <div
            className={`absolute -inset-4 rounded-full blur-xl opacity-60 animate-ping ${
              data.type === "five_stars"
                ? "bg-[#FFD700]/40"
                : data.type === "veteran"
                ? "bg-[#FF6A2A]/40"
                : "bg-[#D8B46A]/40"
            }`}
          />

          {data.type === "five_stars" ? (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFE082] via-[#FFD700] to-[#FF8F00] p-1 flex items-center justify-center shadow-[0_0_35px_rgba(255,215,0,0.6)] ring-4 ring-[#FFF8E1]/80 animate-pulse">
              <div className="w-full h-full rounded-full bg-[#121008] flex items-center justify-center flex-col">
                <Sparkles className="w-9 h-9 text-[#FFD700] fill-[#FFD700] animate-spin" style={{ animationDuration: "12s" }} />
                <span className="text-[10px] font-black text-[#FFE082] mt-0.5 tracking-wider">
                  ★ EVOLUÍDA ★
                </span>
              </div>
            </div>
          ) : data.type === "veteran" ? (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF8B3D] via-[#FF6A2A] to-[#D8B46A] p-1 flex items-center justify-center shadow-[0_0_35px_rgba(255,106,42,0.6)] ring-4 ring-[#FFE4A0]/80">
              <div className="w-full h-full rounded-full bg-[#120F0C] flex items-center justify-center flex-col">
                <Crown className="w-10 h-10 text-[#FF8B3D] fill-[#FF6A2A] stroke-[2]" />
                <span className="text-[10px] font-black text-[#D8B46A] mt-0.5 tracking-widest">
                  VETERANO
                </span>
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D8B46A] via-[#E5A93C] to-[#6D9BFF] p-1 flex items-center justify-center shadow-[0_0_35px_rgba(216,180,106,0.5)] ring-4 ring-[#D8B46A]/60">
              <div className="w-full h-full rounded-full bg-[#121215] flex items-center justify-center flex-col">
                <Award className="w-10 h-10 text-[#D8B46A] fill-[#D8B46A]" />
                <span className="text-[10px] font-black text-[#D8B46A] mt-0.5 tracking-widest">
                  PATENTE {data.level}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Milestone Headers */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#1D1D1F] border border-[#2B2B2F] text-[#D8B46A]">
            <Sparkles className="w-3 h-3" />
            <span>
              {data.type === "five_stars"
                ? "Evolução Estelar Desbloqueada"
                : data.type === "veteran"
                ? "Título Honorário Concedido"
                : "Ascensão de Patente Militar"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
            {data.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#9B9BA1] max-w-sm mx-auto leading-relaxed">
            {data.subtitle}
          </p>
        </div>

        {/* Unlocked Privileges Box */}
        <div className="p-4 rounded-2xl bg-[#17171A] border border-[#2B2B2F] text-left space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase text-[#D8B46A] tracking-wider block">
            Privilégios & Benefícios Desbloqueados:
          </span>

          <ul className="space-y-1.5 text-xs text-[#E5E5EA]">
            {data.type === "five_stars" ? (
              <>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FFD700] shrink-0" />
                  <span>
                    <strong>Personalização VIP do Chat Global:</strong> Escolha livre de cor do seu nome e do texto das suas mensagens!
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FFD700] shrink-0" />
                  <span>
                    <strong>Estrela Evoluída Radiante:</strong> Suas 5 estrelas se fundiram em uma estrela dourada com pulso nos seus selos.
                  </span>
                </li>
              </>
            ) : data.type === "veteran" ? (
              <>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34C759] shrink-0" />
                  <span>
                    <strong>Coroa de Veterano:</strong> Exibida com orgulho em todas as suas mensagens e no seu perfil oficial.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34C759] shrink-0" />
                  <span>
                    <strong>Desconto Vitalício Aplicado:</strong> Mensalidade com valor especial enquanto mantiver a recorrência.
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34C759] shrink-0" />
                  <span>
                    <strong>Nova Medalha de Patente:</strong> Insígnia militar atualizada pelo seu tempo de disciplina ininterrupta.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34C759] shrink-0" />
                  <span>
                    <strong>Progresso Contínuo:</strong> A cada mês consecutivo você ganha uma estrela, evoluindo a cada 5 meses!
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          {data.type === "five_stars" && onOpenColorPicker && (
            <button
              onClick={() => {
                onClose();
                onOpenColorPicker();
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-[#0A0A0A] hover:brightness-110 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#FFD700]/20 active:scale-95"
            >
              <Palette className="w-4 h-4" />
              <span>Personalizar Cores do Chat Agora</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#1D1D1F] hover:bg-[#2B2B2F] text-[#F5F5F7] border border-[#2B2B2F] transition-all cursor-pointer"
          >
            Continuar para o App
          </button>
        </div>
      </div>
    </div>
  );
};
