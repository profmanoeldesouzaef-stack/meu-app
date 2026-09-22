import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  Crown,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  Calendar,
} from "lucide-react";

interface ChallengePrizeConfig {
  id?: string;
  titulo?: string;
  subtitulo?: string;
  premiacao?: string;
  foto_premiacao_url?: string | null;
  ativo?: boolean;
}

interface ChallengePrizeBannerProps {
  className?: string;
  onRefreshRequest?: () => void;
}

export const ChallengePrizeBanner: React.FC<ChallengePrizeBannerProps> = ({
  className = "",
}) => {
  const [config, setConfig] = useState<ChallengePrizeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Consulta as informações da tabela desafios_config
  const fetchPrizeConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("desafios_config")
        .select("*")
        .single();

      if (!error && data) {
        setConfig(data);
      } else {
        // Fallback de segurança se múltiplos registros ou se single() retornar erro
        const { data: listData } = await supabase
          .from("desafios_config")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (listData && listData.length > 0) {
          setConfig(listData[0]);
        }
      }
    } catch (err) {
      console.warn("Aviso ao carregar premiação do desafio em desafios_config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizeConfig();
  }, []);

  const hasPhoto = Boolean(config?.foto_premiacao_url);

  return (
    <div
      id="banner-premiacao-desafio"
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-2xl ${
        hasPhoto
          ? "bg-gradient-to-br from-[#1C1A14] via-[#151515] to-[#0F0F10] border-[#D8B46A]/40"
          : "bg-[#151515] border-[#2B2B2F]"
      } ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#D8B46A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[#FF6A2A]/10 rounded-full blur-3xl pointer-events-none" />

      {hasPhoto ? (
        // CARD COM FOTO DE PREMIAÇÃO DEFINIDA
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center relative z-10">
          {/* Lado Esquerdo: Textos & Destaque */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D8B46A] bg-[#D8B46A]/15 border border-[#D8B46A]/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-[#D8B46A]" />
                PREMIAÇÃO OFICIAL DO DESAFIO
              </span>
              <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Troféu em Disputa
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight leading-tight">
                {config?.titulo || "Grande Premiação da Temporada"}
              </h2>
              <p className="text-xs sm:text-sm text-[#9B9BA1] leading-relaxed max-w-xl">
                {config?.subtitulo ||
                  "Dedique-se a cada treino, registre sua evolução e concorra à premiação exclusiva para as melhores transformações físicas da Vyra."}
              </p>
            </div>

            {/* Caixa da Premiação */}
            <div className="p-4 rounded-2xl bg-[#1D1D1F]/90 border border-[#D8B46A]/30 flex items-start gap-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-[#D8B46A]/20 border border-[#D8B46A]/40 flex items-center justify-center shrink-0 text-[#D8B46A]">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D8B46A] block">
                  Prémio da Vencedora:
                </span>
                <p className="text-sm font-bold text-[#F5F5F7] leading-snug">
                  {config?.premiacao || "Troféu Oficial Vyra + Suplementação Completa + 1 Ano de Consultoria"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#9B9BA1] pt-1">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#D8B46A]" />
                Auditado por Voto da Comunidade
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#FF6A2A]" />
                Temporada Oficial 2026
              </span>
            </div>
          </div>

          {/* Lado Direito: Foto de Premiação em Alta Resolução */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#D8B46A]/50 bg-black shadow-2xl shadow-[#D8B46A]/10 group max-h-72 sm:max-h-80 w-full flex items-center justify-center">
              <img
                src={config?.foto_premiacao_url!}
                alt="Foto Oficial da Premiação"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 max-h-72 sm:max-h-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="px-3 py-1 rounded-full bg-black/70 border border-[#D8B46A]/40 text-[#D8B46A] font-black text-[10px] uppercase tracking-wider backdrop-blur-md">
                  Foto Oficial
                </span>
                <span className="text-[11px] font-bold text-[#F5F5F7] drop-shadow-md">
                  Vyra Champion Trophy
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // PLACEHOLDER: SEM FOTO DEFINIDA (Ícone de troféu e mensagem "Prémio a ser anunciado em breve")
        <div className="p-8 sm:p-10 text-center space-y-4 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-[#1D1D1F] border border-[#D8B46A]/30 flex items-center justify-center mx-auto text-[#D8B46A] shadow-lg shadow-[#D8B46A]/10">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D8B46A] bg-[#D8B46A]/10 border border-[#D8B46A]/25 px-2.5 py-0.5 rounded-full">
                PREMIAÇÃO DO DESAFIO
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#F5F5F7] tracking-tight">
              Prémio a ser anunciado em breve
            </h3>
            <p className="text-xs sm:text-sm text-[#9B9BA1] leading-relaxed">
              O treinador e a equipa técnica estão a finalizar os detalhes da premiação desta temporada. Continue com disciplina nos seus treinos e acompanhamento dos 20 dias!
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-semibold text-[#9B9BA1]">
            <Sparkles className="w-4 h-4 text-[#D8B46A]" />
            <span>Fique atenta às atualizações no painel de desafios</span>
          </div>
        </div>
      )}
    </div>
  );
};
