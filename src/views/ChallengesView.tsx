import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { HallEntry, ChallengeEvent } from "../types";
import { GaleriaView } from "./GaleriaView";
import { AccessGate } from "../components/AccessGate";
import {
  Trophy,
  Award,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  Camera,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const ChallengesView: React.FC = () => {
  const { t, persona, subscription, setActiveView } = useApp();

  // Access Gating for Student
  if (persona === "student" && !subscription.active) {
    return (
      <AccessGate
        type="payment"
        tabName="desafios"
        title="Desafios & Premiações Bloqueados"
        description="Os desafios comunitários, transformações e premiações da Vyra são exclusivos para alunos assinantes. Ative seu plano para participar e concorrer aos prêmios."
      />
    );
  }

  const [hall, setHall] = useState<HallEntry[]>([]);
  const [challengeEvent, setChallengeEvent] = useState<ChallengeEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);

  const loadData = async () => {
    try {
      const [hl, evt] = await Promise.all([
        api.getHall().catch(() => []),
        api.getChallengeEvent().catch(() => null),
      ]);
      setHall(hl);
      if (evt) setChallengeEvent(evt);
    } catch (e) {
      console.error("Error loading challenge event info:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleChallengeEvent = async () => {
    try {
      const updated = await api.toggleChallengeEvent();
      setChallengeEvent(updated);
    } catch (e) {
      console.error("Error toggling event:", e);
    }
  };

  // Check if challenge is in "Aguardando" / Loading status
  const isLoadingStatus =
    challengeEvent && (challengeEvent.status === "loading" || !challengeEvent.is_active);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-8 animate-in fade-in duration-300">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2B2B2F] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-3 py-1 rounded-full border border-[#D8B46A]/30 flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-[#D8B46A]" />
              {t("sec.challenges")}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2.5">
            {challengeEvent?.title || "Desafio Oficial da Comunidade"}
          </h1>
          <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1 max-w-2xl">
            {challengeEvent?.subtitle ||
              "Participe dos desafios oficiais da comunidade, alcance sua melhor versão e dispute premiações exclusivas."}
          </p>
        </div>
      </div>

      {/* Coach Quick Control Bar (When logged as coach) */}
      {persona === "coach" && (
        <div className="p-4 rounded-2xl bg-[#1D1D1F] border border-[#D8B46A]/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                challengeEvent?.is_active ? "bg-[#34C759]" : "bg-[#FF453A]"
              } animate-pulse`}
            />
            <div>
              <p className="text-xs font-bold text-[#F5F5F7]">Controle de Desafios do Coach</p>
              <p className="text-[11px] text-[#9B9BA1]">
                {challengeEvent?.is_active
                  ? "Status: Desafio ativo e aberto para fotos e votações."
                  : "Status: Desafio em aguardo/oculto para os alunos."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="coach-toggle-challenge-event-btn"
              onClick={handleToggleChallengeEvent}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                challengeEvent?.is_active
                  ? "bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/40 hover:bg-[#FF453A]/25"
                  : "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/40 hover:bg-[#34C759]/25"
              }`}
            >
              {challengeEvent?.is_active ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Pausar Desafio (Aguardando)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ativar Desafio Oficial</span>
                </>
              )}
            </button>
            <button
              onClick={() => setActiveView("coach")}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#151515] text-[#D8B46A] border border-[#2B2B2F] hover:border-[#D8B46A]"
            >
              Painel do Coach
            </button>
          </div>
        </div>
      )}

      {/* STATUS DE AGUARDO: DESAFIO CARREGANDO... (If inactive) */}
      {isLoadingStatus ? (
        <div className="p-8 sm:p-14 rounded-3xl bg-[#151515] border border-[#FF9F0A]/40 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#FF9F0A]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-[#FF9F0A]/20 border border-[#FF9F0A]/40 text-[#FF9F0A] flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#FF9F0A] bg-[#FF9F0A]/15 px-3 py-1 rounded-full border border-[#FF9F0A]/30">
              STATUS DE AGUARDO
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#F5F5F7] tracking-tight mt-3">
              DESAFIO CARREGANDO...
            </h2>
            <p className="text-xs sm:text-sm text-[#9B9BA1] max-w-lg mx-auto mt-2 leading-relaxed">
              O Coach está preparando a próxima temporada com novas diretrizes de treino e premiação especial. Fique atento às notificações!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <div className="px-4 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34C759]" />
              <span>Votação com auditoria antifraude por IP único</span>
            </div>

            {persona === "coach" && (
              <button
                onClick={() => setActiveView("coach")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D8B46A] text-black hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Abrir Gestão no Painel do Coach</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Champion Crowned Banner (If previous edition finalized) */}
          {challengeEvent?.champion && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#D8B46A]/25 via-[#1D1B14] to-[#151515] border-2 border-[#D8B46A] shadow-2xl relative overflow-hidden space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative">
                  <img
                    src={challengeEvent.champion.photo}
                    alt={challengeEvent.champion.name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D8B46A] shadow-lg shadow-[#D8B46A]/25"
                  />
                  <div className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-[#D8B46A] text-[#0A0A0A] flex items-center justify-center font-black shadow-md">
                    👑
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-[#D8B46A] bg-[#D8B46A]/20 px-3 py-0.5 rounded-full border border-[#D8B46A]/40">
                    CAMPEÃ COROADA DO DESAFIO
                  </span>
                  <h3 className="text-2xl font-black text-[#F5F5F7] tracking-tight mt-1">
                    {challengeEvent.champion.name}
                  </h3>
                  <p className="text-xs text-[#9B9BA1] mt-0.5">
                    Eleita pela comunidade com {challengeEvent.champion.votes} votos populares auditados!
                  </p>
                </div>

                <div className="px-5 py-3 rounded-2xl bg-[#D8B46A]/15 border border-[#D8B46A]/40 text-center shrink-0">
                  <span className="text-[10px] text-[#D8B46A] font-bold block uppercase tracking-wider">
                    VOTAÇÃO ENCERRADA
                  </span>
                  <span className="text-sm font-black text-[#F5F5F7]">Hall da Fama Oficial</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Challenge Guidelines Card */}
          {challengeEvent && (
            <div className="p-6 rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2B2B2F]">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#D8B46A]" />
                  <h3 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                    Premiação & Regras Oficiais
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9B9BA1]">
                  <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                  <span>Trava antifraude: 1 voto por usuário/IP</span>
                </div>
              </div>

              {challengeEvent.prize && (
                <div className="p-3 rounded-xl bg-[#D8B46A]/10 border border-[#D8B46A]/20 text-xs text-[#D8B46A] font-bold flex items-center gap-2">
                  <span>🏆 Premiação:</span>
                  <span className="text-[#F5F5F7] font-semibold">{challengeEvent.prize}</span>
                </div>
              )}

              {challengeEvent.rules && (
                <div className="text-xs text-[#9B9BA1] whitespace-pre-line leading-relaxed">
                  {challengeEvent.rules}
                </div>
              )}
            </div>
          )}

          {/* Seção da Galeria dentro de Desafios com Botão Escondido */}
          <div className="pt-2">
            {!showGallery ? (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#151515] border border-[#2B2B2F] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] flex items-center justify-center text-[#FF6A2A] shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#F5F5F7]">
                      Galeria de Fotos dos Participantes
                    </h4>
                    <p className="text-xs text-[#9B9BA1] mt-0.5">
                      Confira as fotos de evolução dos alunos e vote na sua transformação favorita.
                    </p>
                  </div>
                </div>

                <button
                  id="reveal-hidden-gallery-btn"
                  onClick={() => setShowGallery(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#FF9A62] border border-[#FF6A2A]/40 hover:bg-[#FF6A2A]/15 hover:border-[#FF6A2A] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Eye className="w-4 h-4 text-[#FF6A2A]" />
                  <span>Acessar Galeria</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-[#2B2B2F] animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-[#151515] p-3.5 rounded-2xl border border-[#2B2B2F]">
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-[#FF6A2A]" />
                    <span className="text-xs font-extrabold text-[#F5F5F7]">
                      Galeria Oficial do Desafio
                    </span>
                  </div>
                  <button
                    id="hide-gallery-btn"
                    onClick={() => setShowGallery(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] flex items-center gap-1.5 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar Galeria</span>
                  </button>
                </div>

                <GaleriaView embedded={true} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Hall of Fame */}
      {hall.length > 0 && (
        <div className="pt-6 border-t border-[#2B2B2F] space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D8B46A]" />
            <h2 className="text-lg font-black text-[#F5F5F7] tracking-tight">{t("sec.hall")}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hall.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#151515] border border-[#D8B46A]/30 flex items-center gap-4 shadow-lg shadow-[#D8B46A]/5"
              >
                <img
                  src={item.photo}
                  alt={item.champion}
                  className="w-16 h-16 rounded-xl object-cover border border-[#2B2B2F] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-[#D8B46A] uppercase">
                    <Trophy className="w-3 h-3" />
                    <span>Campeã · {item.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F5F5F7] truncate mt-0.5">
                    {item.champion}
                  </h4>
                  <p className="text-xs text-[#9B9BA1] truncate">{item.title}</p>
                  <span className="text-xs font-bold text-[#34C759] mt-1 block">
                    {item.votes} votos comunitários
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
