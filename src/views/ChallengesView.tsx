import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { supabase } from "../lib/supabase";
import { getVotingUserId } from "../lib/supabaseClient";
import { AccessGate } from "../components/AccessGate";
import { EmptyStatePaywall } from "../components/EmptyStatePaywall";
import { ChallengeParticipationModal } from "../components/ChallengeParticipationModal";
import { CoachChallengeEvaluationPanel } from "../components/CoachChallengeEvaluationPanel";
import { ActiveChallenge, ChallengeEntry } from "../types";
import { getChallengeEntries } from "../lib/storage";
import {
  Trophy,
  Flame,
  Heart,
  Calendar,
  Megaphone,
  Clock,
  ArrowRight,
  Plus,
  PlusCircle,
  UploadCloud,
  Share2,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Filter,
  Camera,
  Award,
  Lock,
  Crown,
  Users,
  CheckCircle2,
} from "lucide-react";

// Filtros de categoria
const FILTERS = ["all", "reset12", "shape", "forge"] as const;

// Ícone oficial estilizado do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export const ChallengesView: React.FC = () => {
  const { t, persona, subscription, setActiveView, currentUserEmail } = useApp();

  const isCoach =
    persona === "coach" ||
    Boolean(
      currentUserEmail &&
        [
          "coach@vyra.club",
          "mari@vyra.club",
          "treinador@vyra.club",
          "admin@vyra.club",
          "headcoach@vyra.club",
          "cubocao@gmail.com",
        ].includes(currentUserEmail.toLowerCase())
    );

  // Access Gating for Student
  if (!isCoach && persona === "student" && (!subscription.active || (subscription as any)?.status === "inactive")) {
    return (
      <EmptyStatePaywall
        message="Assinatura Inativa. Libere seu acesso para visualizar seu treino e dieta."
        buttonText="Assinar Agora"
        onGoToProfile={() => setActiveView("paywall")}
      />
    );
  }

  const [tab, setTab] = useState<"active" | "coach" | "hall">("active");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [items, setItems] = useState<any[]>([]);
  const [hall, setHall] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  // Step 4: Engine de Desafios & Participação
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [challengeEntries, setChallengeEntries] = useState<ChallengeEntry[]>([]);
  const [participationModalOpen, setParticipationModalOpen] = useState(false);
  const [selectedChallengeForParticipation, setSelectedChallengeForParticipation] =
    useState<ActiveChallenge | null>(null);
  const [selectedCoachChallengeId, setSelectedCoachChallengeId] = useState<string>("");

  // Simulação de data para testes de Coach / Administrador
  const [simulatedDay, setSimulatedDay] = useState<number | null>(null);

  // --- O CÉREBRO DO CALENDÁRIO ---
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diaReal = hoje.getDate(); 
  const diaAtual = simulatedDay !== null ? simulatedDay : diaReal;
  
  // Descobre qual é o último dia do mês atual
  const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate(); 
  const penultimoDia = ultimoDiaDoMes - 1;

  // As regras do jogo:
  const isFaseApresentacao = diaAtual >= 1 && diaAtual <= 6;
  const isFaseInscricao = diaAtual >= 7 && diaAtual <= 25;
  const isFaseVotacaoExterna = diaAtual >= 26 && diaAtual <= penultimoDia;
  const isDiaDeTransicao = diaAtual === ultimoDiaDoMes;
  // -------------------------------

  const loadActiveChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/active-challenges");
      if (res.ok) {
        const data = await res.json();
        setActiveChallenges(data);
        if (data.length > 0 && !selectedCoachChallengeId) {
          setSelectedCoachChallengeId(data[0].id);
        }
      }
    } catch (err) {
      console.warn("Erro ao buscar desafios ativos:", err);
    }
  }, [selectedCoachChallengeId]);

  const loadEntries = useCallback(async () => {
    try {
      const entries = await getChallengeEntries();
      setChallengeEntries(entries);
    } catch (err) {
      console.warn("Erro ao buscar entradas de desafios:", err);
    }
  }, []);

  const loadActive = async () => {
    loadActiveChallenges();
    loadEntries();

    try {
      const { data, error } = await supabase
        .from("challenge_photos")
        .select("*")
        .order("votes_count", { ascending: false });

      if (!error && data && data.length > 0) {
        let filtered = data;
        if (filter !== "all") {
          filtered = data.filter((item: any) => item.category === filter);
        }
        const formatados = filtered.map((item: any) => ({
          id: item.id,
          before_image: { uri: item.before_image || item.photo_url },
          after_image: { uri: item.photo_url || item.after_image },
          title: item.caption || "Desafio Vyra",
          author: item.participant_name || "Atleta Vyra",
          weeks: 12, 
          likes: Number(item.votes_count) || 0,
          vote_url: item.vote_url || null, // Puxando o link do post do Instagram que você colocar
        }));
        setItems(formatados);
        return;
      }
    } catch (e) {
      console.warn("Supabase fetch notice:", e);
    }

    // Fallback: consome API interna
    try {
      const apiChallenges = await api.getChallenges(filter === "all" ? undefined : filter);
      const formatados = apiChallenges.map((item) => ({
        id: item.id,
        before_image: { uri: item.before_image },
        after_image: { uri: item.after_image },
        title: item.title || "Desafio Vyra",
        author: item.author || "Atleta Vyra",
        weeks: item.weeks || 12,
        likes: item.votes || item.likes || 0,
        vote_url: item.vote_url || null,
      }));
      setItems(formatados);
    } catch (err) {
      console.error("Error loading fallback challenges:", err);
    }
  };

  const loadHall = () => api.hall().then(setHall).catch(() => {});

  useEffect(() => {
    loadActive();
  }, [filter]);

  useEffect(() => {
    loadHall();
  }, []);

  const like = async (id: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || getVotingUserId();
      const { error: insertError } = await supabase
        .from("photo_votes")
        .insert({ photo_id: id, user_id: userId });

      if (insertError) {
        await supabase.from("photo_votes").delete().match({ photo_id: id, user_id: userId });
      }
    } catch (e) {
      await api.likeChallenge(id).catch(() => {});
    }
    loadActive(); 
  };

  const closeChallenge = async (id: string) => {
    try {
      await api.closeChallenge(id);
    } catch (e) {
      console.error("Error closing challenge:", e);
    }
    loadActive(); 
    loadHall();
  };

  // Função que abre o WhatsApp pedindo votos
  const pedirVotos = async (nome: string, url: string | null) => {
    if (!url) {
      alert("Aviso: O link da votação no Instagram ainda não foi liberado pelo Coach!");
      return;
    }
    const message = `Fala galera! Meu shape tá na reta no Desafio Vyra 🏆\n\nCliquem no link abaixo, vão lá no post e comentem MEU NOME (${nome}) pra me ajudar a ganhar essa batalha!\n\nVote aqui: ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Desafio Vyra 🏆 - Vote em mim!",
          text: message,
          url: url,
        });
        return;
      } catch (error) {
        console.log("Compartilhamento nativo não acionado, abrindo WhatsApp:", error);
      }
    }
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-36 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2B2B2F] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#D8B46A] uppercase bg-[#D8B46A]/15 px-3 py-1 rounded-full border border-[#D8B46A]/30 flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-[#D8B46A]" />
              {t("ch.title")}
            </span>

            {/* Current Phase Badge */}
            {isFaseApresentacao && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1D1D1F] text-[#9B9BA1] border border-[#2B2B2F] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Fase 1: Apresentação (Dia {diaAtual}/{ultimoDiaDoMes})
              </span>
            )}
            {isFaseInscricao && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF6A2A]/15 text-[#FF9A62] border border-[#FF6A2A]/30 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Fase 2: Inscrições Abertas (Dia {diaAtual}/{ultimoDiaDoMes})
              </span>
            )}
            {isFaseVotacaoExterna && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 flex items-center gap-1">
                <Megaphone className="w-3 h-3" />
                Fase 3: Votação Oficial (Dia {diaAtual}/{ultimoDiaDoMes})
              </span>
            )}
            {isDiaDeTransicao && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/40 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Fase 4: Transição & Apuração (Último dia)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2">
            {t("ch.title")}
          </h1>
          <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1 max-w-2xl">
            {t("ch.sub")}
          </p>
        </div>

        {/* Coach / Admin Phase Simulator bar for immediate testing */}
        {(persona === "coach" || persona === "moderator") && (
          <div className="flex flex-col sm:items-end gap-1 bg-[#151515] p-2.5 rounded-2xl border border-[#2B2B2F]">
            <span className="text-[10px] font-black text-[#D8B46A] uppercase tracking-wider">
              Painel Admin: Simular Calendário
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSimulatedDay(null)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  simulatedDay === null
                    ? "bg-[#D8B46A] text-black"
                    : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                Hoje ({diaReal})
              </button>
              <button
                onClick={() => setSimulatedDay(3)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  simulatedDay === 3
                    ? "bg-[#D8B46A] text-black"
                    : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
                title="Fase 1: Dias 1 a 6"
              >
                Dia 3 (Apresentação)
              </button>
              <button
                onClick={() => setSimulatedDay(12)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  simulatedDay === 12
                    ? "bg-[#D8B46A] text-black"
                    : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
                title="Fase 2: Dias 7 a 25"
              >
                Dia 12 (Inscrição)
              </button>
              <button
                onClick={() => setSimulatedDay(27)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  simulatedDay === 27
                    ? "bg-[#25D366] text-black"
                    : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
                title="Fase 3: Dias 26 a penúltimo dia"
              >
                Dia 27 (Votação WhatsApp)
              </button>
              <button
                onClick={() => setSimulatedDay(ultimoDiaDoMes)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  simulatedDay === ultimoDiaDoMes
                    ? "bg-[#D8B46A] text-black"
                    : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
                title="Fase 4: Último dia do mês"
              >
                Dia {ultimoDiaDoMes} (Transição)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2B2B2F] pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-active"
            onClick={() => setTab("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === "active"
                ? "bg-[#FF6A2A] text-white shadow-lg shadow-[#FF6A2A]/20"
                : "bg-[#151515] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{t("sec.active")}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
              {items.length}
            </span>
          </button>

          <button
            id="tab-hall"
            onClick={() => setTab("hall")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === "hall"
                ? "bg-[#D8B46A] text-black shadow-lg shadow-[#D8B46A]/20"
                : "bg-[#151515] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{t("sec.hall")}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
              {hall.length}
            </span>
          </button>

          {(isCoach || persona === "moderator") && (
            <button
              id="tab-coach"
              onClick={() => setTab("coach")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === "coach"
                  ? "bg-[#D8B46A] text-black shadow-lg shadow-[#D8B46A]/20"
                  : "bg-[#151515] text-[#D8B46A] hover:bg-[#D8B46A]/10 border border-[#D8B46A]/40"
              }`}
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>Painel do Coach</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 font-black">
                {challengeEntries.length}
              </span>
            </button>
          )}
        </div>

        {/* Category Filters (when on active tab) */}
        {tab === "active" && (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#151515] p-1 rounded-xl border border-[#2B2B2F]">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all capitalize cursor-pointer ${
                  filter === f
                    ? "bg-[#2B2B2F] text-[#F5F5F7]"
                    : "text-[#9B9BA1] hover:text-[#F5F5F7]"
                }`}
              >
                {f === "all" ? t("ch.filter.all") : f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab: Active Challenges */}
      {tab === "active" && (
        <div className="space-y-8">
          {/* Desafios Oficiais Ativos - Cards Imersivos e Modernos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#F5F5F7] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#D8B46A]" />
                  Desafios Ativos da Temporada
                </h3>
                <p className="text-xs text-[#9B9BA1]">
                  Participe das disputas de transformação, envie suas fotos para o Supabase Storage e dispute o cinturão oficial Vyra.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenges.map((ch) => {
                const isFinished = ch.status === "finished" || ch.status === "closed";
                return (
                  <div
                    key={ch.id}
                    className="relative overflow-hidden rounded-3xl bg-[#151515] border border-[#2B2B2F] hover:border-[#D8B46A]/60 transition-all shadow-2xl flex flex-col justify-between group"
                  >
                    {/* Imagem de Capa Imersiva com Gradiente */}
                    <div className="relative h-44 w-full overflow-hidden bg-black">
                      <img
                        src={
                          ch.banner_url ||
                          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
                        }
                        alt={ch.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/50 to-transparent" />

                      {/* Badges de Topo */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-black/70 text-[#D8B46A] border border-[#D8B46A]/40 text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
                          <Flame className="w-3 h-3 text-[#FF6A2A]" />
                          {ch.protocol || "Vyra Protocol"}
                        </span>

                        {isFinished ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40 text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Finalizado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-[#FF6A2A]/20 text-[#FF9A62] border border-[#FF6A2A]/40 text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Inscrições Abertas
                          </span>
                        )}
                      </div>

                      {/* Título sobre a imagem */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h4 className="text-lg font-black text-[#F5F5F7] tracking-tight leading-snug drop-shadow-md">
                          {ch.title}
                        </h4>
                        {ch.subtitle && (
                          <p className="text-xs font-semibold text-[#D8B46A] drop-shadow-sm">
                            {ch.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo & Premiação */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <p className="text-xs text-[#9B9BA1] leading-relaxed line-clamp-2">
                          {ch.description}
                        </p>

                        {/* Bloco de Premiação */}
                        {ch.prize && (
                          <div className="p-3 rounded-2xl bg-[#D8B46A]/10 border border-[#D8B46A]/30 flex items-start gap-2.5">
                            <Crown className="w-4 h-4 text-[#D8B46A] shrink-0 mt-0.5" />
                            <div className="text-xs space-y-0.5">
                              <span className="font-bold text-[#D8B46A] block">Premiação Oficial:</span>
                              <span className="text-[#F5F5F7] font-medium">{ch.prize}</span>
                            </div>
                          </div>
                        )}

                        {/* Campeão se finalizado */}
                        {ch.winner_name && (
                          <div className="p-2.5 rounded-xl bg-[#34C759]/15 border border-[#34C759]/30 flex items-center gap-2 text-xs">
                            <Crown className="w-4 h-4 text-[#34C759]" />
                            <span className="text-[#34C759] font-bold">
                              Campeão Declarado: <strong className="text-[#F5F5F7]">{ch.winner_name}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer do Card */}
                      <div className="pt-3 border-t border-[#2B2B2F] flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-[#9B9BA1]">
                          <Users className="w-3.5 h-3.5 text-[#D8B46A]" />
                          <span>{ch.entries_count || 0} atletas inscritos</span>
                        </div>

                        {/* Botão Participar / Enviar Foto */}
                        {isFinished ? (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 rounded-xl text-xs font-bold text-[#6E6E73] bg-[#1D1D1F] border border-[#2B2B2F] cursor-not-allowed"
                          >
                            Submissões Encerradas
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChallengeForParticipation(ch);
                              setParticipationModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#D8B46A] hover:brightness-110 text-black active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-[#D8B46A]/20 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 fill-black" />
                            <span>Participar / Enviar Foto</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Coach Evaluation Panel */}
      {tab === "coach" && (
        <CoachChallengeEvaluationPanel
          challenges={activeChallenges}
          entries={challengeEntries}
          selectedChallengeId={selectedCoachChallengeId || activeChallenges[0]?.id || ""}
          onSelectChallenge={(id) => setSelectedCoachChallengeId(id)}
          onRefresh={() => {
            loadActive();
            loadEntries();
            loadHall();
          }}
        />
      )}

      {/* Tab: Hall of Fame */}
      {tab === "hall" && (
        <div className="space-y-4">
          {hall.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#151515] border border-[#2B2B2F] text-center space-y-3">
              <Trophy className="w-10 h-10 text-[#D8B46A] mx-auto opacity-50" />
              <h3 className="text-base font-bold text-[#F5F5F7]">
                Hall da Fama em Construção
              </h3>
              <p className="text-xs text-[#9B9BA1] max-w-md mx-auto">
                Ao final de cada temporada mensal, os campeões coroados pela comunidade são imortalizados aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hall.map((h, i) => {
                const photoSrc =
                  typeof h.photo === "object" && h.photo?.uri
                    ? h.photo.uri
                    : h.photo || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=300&q=80";

                return (
                  <div
                    key={h.id || i}
                    className="p-4 rounded-3xl bg-[#151515] border border-[#D8B46A]/30 flex items-center gap-4 shadow-xl relative overflow-hidden"
                  >
                    {/* Medalha com Posição */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA000] text-black font-black text-xs flex items-center justify-center shadow-md shrink-0">
                      {i + 1}
                    </div>

                    <img
                      src={photoSrc}
                      alt={h.champion}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#2B2B2F] shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold text-[#F5F5F7] truncate">
                        {h.champion}
                      </h4>
                      <p className="text-xs text-[#9B9BA1] truncate mt-0.5">{h.title}</p>
                      {h.votes !== undefined && (
                        <span className="text-[11px] font-bold text-[#34C759] mt-1 block">
                          {h.votes} votos populares auditados
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- BARRA INFERIOR INTELIGENTE --- */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-[#2B2B2F] px-4 py-3.5 flex items-center justify-center shadow-2xl">
        <div className="w-full max-w-md">
          {persona === "coach" || persona === "moderator" ? (
            <button
              id="admin-new-challenge-btn"
              onClick={() => setCreateOpen(true)}
              className="w-full py-3 px-6 rounded-2xl bg-[#D8B46A] text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#D8B46A]/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>Novo Desafio (Admin)</span>
            </button>
          ) : (
            <>
              {isFaseApresentacao && (
                <div
                  id="fase-apresentacao-bar"
                  className="w-full py-3 px-6 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#9B9BA1] font-bold text-sm flex items-center justify-center gap-2 select-none"
                >
                  <Calendar className="w-4 h-4 text-[#9B9BA1]" />
                  <span>Inscrições abrem dia 7!</span>
                </div>
              )}

              {isFaseInscricao && (
                <button
                  id="fase-inscricao-publish-btn"
                  onClick={() => setParticipationModalOpen(true)}
                  className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#FF6A2A]/25 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Inscrever Transformação no Desafio</span>
                </button>
              )}

              {isFaseVotacaoExterna && (
                <div
                  id="fase-votacao-bar"
                  className="w-full py-3 px-6 rounded-2xl bg-[#25D366] text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25 select-none"
                >
                  <Megaphone className="w-4 h-4 text-black" />
                  <span>Votação Oficial Aberta!</span>
                </div>
              )}

              {isDiaDeTransicao && (
                <div
                  id="fase-transicao-bar"
                  className="w-full py-3 px-6 rounded-2xl bg-[#D8B46A] text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D8B46A]/25 select-none"
                >
                  <Trophy className="w-4 h-4 text-black" />
                  <span>Calculando Campeões...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* --------------------------------- */}

      {/* Modal: Novo Desafio (Admin / Coach) */}
      <NewChallengeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadActive}
      />

      {/* Modal: Participação Oficial em Desafio com Upload Storage */}
      <ChallengeParticipationModal
        isOpen={participationModalOpen}
        onClose={() => setParticipationModalOpen(false)}
        challenge={selectedChallengeForParticipation || activeChallenges[0] || null}
        onEntryCreated={() => {
          loadActive();
          loadEntries();
        }}
      />
    </div>
  );
};

// --- MODAL: NOVO DESAFIO (ADMIN) ---
interface NewChallengeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const NewChallengeModal: React.FC<NewChallengeModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [voteUrl, setVoteUrl] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !participantName.trim()) {
      alert("Preencha o título e o nome do participante.");
      return;
    }

    setSaving(true);
    try {
      // 1. Tenta salvar no Supabase
      const { error: sbError } = await supabase.from("challenge_photos").insert({
        participant_name: participantName.trim(),
        caption: title.trim(),
        photo_url: afterUrl.trim() || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
        before_image: beforeUrl.trim() || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
        after_image: afterUrl.trim() || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
        vote_url: voteUrl.trim() || null,
        votes_count: 0,
      });

      if (sbError) {
        console.warn("Supabase insert notice, saving to local api:", sbError);
      }

      // 2. Salva na API local
      await api.createChallenge({
        title: title.trim(),
        author: participantName.trim(),
        before_image: beforeUrl.trim() || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
        after_image: afterUrl.trim() || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
        vote_url: voteUrl.trim() || undefined,
        weeks: 12,
        likes: 0,
        votes: 0,
        tag: "shape",
        status: "active",
      });

      onCreated();
      onClose();
    } catch (err) {
      console.error("Error creating challenge:", err);
      alert("Erro ao criar desafio. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#151515] border border-[#2B2B2F] rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#2B2B2F] pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D8B46A]" />
            <h3 className="text-base font-bold text-[#F5F5F7]">Novo Desafio (Admin)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
              Título / Legenda da Transformação
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Evolução 12 Semanas - Ganho de 5kg limpo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
              Nome do Participante / Aluno
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Mendes"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#25D366] block mb-1">
              Link da Votação no Instagram (vote_url)
            </label>
            <input
              type="url"
              placeholder="https://www.instagram.com/p/..."
              value={voteUrl}
              onChange={(e) => setVoteUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#25D366]"
            />
            <span className="text-[10px] text-[#9B9BA1] mt-1 block">
              Esse link será compartilhado no WhatsApp a partir do dia 26 para que as pessoas comentem no post oficial.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                URL da Foto "Antes" (opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={beforeUrl}
                onChange={(e) => setBeforeUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#9B9BA1] block mb-1">
                URL da Foto "Depois" (opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={afterUrl}
                onChange={(e) => setAfterUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D8B46A]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2B2B2F]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-black bg-[#D8B46A] text-black hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#D8B46A]/20"
            >
              {saving ? "Salvando..." : "Criar Desafio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Export aliases
export const Challenges = ChallengesView;
export default ChallengesView;
