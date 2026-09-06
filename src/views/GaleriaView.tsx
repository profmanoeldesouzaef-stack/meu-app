import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { getSupabaseClient, getSupabaseCredentials, getVotingUserId } from "../lib/supabaseClient";
import { api } from "../api/client";
import { ChallengePhoto } from "../types";
import { GaleriaPhotoUpload } from "../components/GaleriaPhotoUpload";
import { VeteranBadge, PatentBadge } from "../lib/patents";
import {
  Heart,
  Trophy,
  Sparkles,
  Search,
  Plus,
  X,
  Check,
  Database,
  ExternalLink,
  ShieldCheck,
  LayoutGrid,
  List,
  AlertCircle,
  TrendingUp,
  Image as ImageIcon,
  Flame,
  Upload,
} from "lucide-react";

export const GaleriaView: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { t, theme } = useApp();
  const [photos, setPhotos] = useState<ChallengePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Supabase credentials state
  const [supabaseStatus, setSupabaseStatus] = useState(getSupabaseCredentials());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputUrl, setInputUrl] = useState(supabaseStatus.url);
  const [inputKey, setInputKey] = useState(supabaseStatus.key);

  // Lightbox Modal
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengePhoto | null>(null);

  // Submit Photo Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Carrega fotos do Supabase (com fallback automático se ainda não configurado)
   */
  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const supabase = getSupabaseClient();
      const currentUserId = getVotingUserId();

      if (supabase) {
        // 1. Busca fotos da tabela 'challenge_photos' ordenadas por votos decrescente
        const { data: supabasePhotos, error: fetchError } = await supabase
          .from("challenge_photos")
          .select("id, participant_name, photo_url, votes_count, caption, created_at, status")
          .order("votes_count", { ascending: false });

        if (fetchError) {
          console.warn("Aviso ao buscar de challenge_photos no Supabase:", fetchError);
          throw fetchError;
        }

        if (supabasePhotos) {
          // 2. Busca votos do usuário logado na tabela 'photo_votes'
          const photoIds = supabasePhotos.map((p) => p.id);
          const { data: userVotes, error: votesError } = await supabase
            .from("photo_votes")
            .select("photo_id")
            .eq("user_id", currentUserId)
            .in("photo_id", photoIds);

          if (votesError) {
            console.warn("Aviso ao buscar photo_votes:", votesError);
          }

          const votedPhotoIds = new Set(userVotes?.map((v) => v.photo_id) || []);
          const localVoted = new Set<string>(
            JSON.parse(localStorage.getItem("vyra_voted_photos") || "[]")
          );

          const formatted: ChallengePhoto[] = supabasePhotos.map((p) => ({
            id: p.id,
            participant_name: p.participant_name,
            photo_url: p.photo_url,
            votes_count: Number(p.votes_count) || 0,
            caption: p.caption || "",
            category: (p as any).category || "shape",
            has_voted: votedPhotoIds.has(p.id) || localVoted.has(p.id),
            created_at: p.created_at,
          }));

          setPhotos(formatted);
          return;
        }
      }

      // Fallback: consome API interna que espelha as regras
      const fallbackData = await api.getChallengePhotos();
      const localVoted = new Set<string>(
        JSON.parse(localStorage.getItem("vyra_voted_photos") || "[]")
      );
      const sorted = [...fallbackData]
        .map((p) => ({
          ...p,
          has_voted: Boolean(p.has_voted || localVoted.has(p.id)),
        }))
        .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
      setPhotos(sorted);
    } catch (err: any) {
      console.warn("Falha ao carregar do Supabase direto, acionando fallback:", err);
      try {
        const fallbackData = await api.getChallengePhotos();
        const localVoted = new Set<string>(
          JSON.parse(localStorage.getItem("vyra_voted_photos") || "[]")
        );
        const sorted = [...fallbackData]
          .map((p) => ({
            ...p,
            has_voted: Boolean(p.has_voted || localVoted.has(p.id)),
          }))
          .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
        setPhotos(sorted);
      } catch (e: any) {
        setErrorMsg(err?.message || "Erro ao carregar fotos.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  /**
   * Função de Curtir / Descurtir conforme o comando:
   * - Checa se o usuário já curtiu
   * - Se não curtiu -> INSERT na tabela 'photo_votes'
   * - Se já curtiu -> DELETE da tabela 'photo_votes'
   * - O trigger de contagem de votos do Supabase recalcula 'votes_count'
   */
  const handleToggleVote = async (photo: ChallengePhoto) => {
    if (votingId) return; // Evita cliques múltiplos
    setVotingId(photo.id);

    const supabase = getSupabaseClient();
    const currentUserId = getVotingUserId();
    const wasVoted = Boolean(photo.has_voted);
    const optimisticCount = wasVoted
      ? Math.max(0, photo.votes_count - 1)
      : photo.votes_count + 1;

    // Atualiza tracking local por dispositivo
    const localVoted = new Set<string>(
      JSON.parse(localStorage.getItem("vyra_voted_photos") || "[]")
    );
    if (wasVoted) {
      localVoted.delete(photo.id);
    } else {
      localVoted.add(photo.id);
    }
    localStorage.setItem("vyra_voted_photos", JSON.stringify(Array.from(localVoted)));

    // 1. Atualização Otimista Imediata na Interface
    setPhotos((prev) => {
      const updated = prev.map((p) =>
        p.id === photo.id
          ? { ...p, has_voted: !wasVoted, votes_count: optimisticCount }
          : p
      );
      return updated.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
    });

    if (selectedPhoto && selectedPhoto.id === photo.id) {
      setSelectedPhoto({
        ...selectedPhoto,
        has_voted: !wasVoted,
        votes_count: optimisticCount,
      });
    }

    try {
      let voteSucceeded = false;
      let newVoteStatus = !wasVoted;
      let finalCount = optimisticCount;

      // Chama endpoint de voto sincronizado (que atualiza Supabase ou banco com tolerância a falhas)
      try {
        const res = await api.togglePhotoVote(photo.id, currentUserId, photo.participant_name);
        if (res && res.ok) {
          voteSucceeded = true;
          newVoteStatus = res.hasVoted;
          finalCount = res.newVoteCount;
        }
      } catch (apiErr) {
        console.warn("Aviso na chamada togglePhotoVote da API:", apiErr);
      }

      if (supabase && !voteSucceeded) {
        try {
          if (wasVoted) {
            await supabase
              .from("photo_votes")
              .delete()
              .eq("photo_id", photo.id)
              .eq("user_id", currentUserId);
          } else {
            await supabase
              .from("photo_votes")
              .insert({ photo_id: photo.id, user_id: currentUserId });
          }
          voteSucceeded = true;
        } catch (supabaseDirectErr) {
          console.warn("Tentativa direta Supabase falhou:", supabaseDirectErr);
        }
      }

      showToast(
        newVoteStatus
          ? `Você curtiu a foto de ${photo.participant_name}! ❤️`
          : `Voto removido de ${photo.participant_name}`
      );

      setPhotos((prev) =>
        prev
          .map((p) =>
            p.id === photo.id
              ? { ...p, has_voted: newVoteStatus, votes_count: finalCount }
              : p
          )
          .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))
      );

      if (selectedPhoto && selectedPhoto.id === photo.id) {
        setSelectedPhoto({
          ...selectedPhoto,
          has_voted: newVoteStatus,
          votes_count: finalCount,
        });
      }
    } catch (err: any) {
      console.warn("Aviso ao processar voto:", err);
      showToast(
        !wasVoted
          ? `Você curtiu a foto de ${photo.participant_name}! ❤️`
          : `Voto removido de ${photo.participant_name}`
      );
    } finally {
      setVotingId(null);
    }
  };

  /**
   * Salvar credenciais personalizadas do Supabase
   */
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (inputUrl.trim() && inputKey.trim()) {
        localStorage.setItem("vyra_supabase_url", inputUrl.trim());
        localStorage.setItem("vyra_supabase_anon_key", inputKey.trim());
      } else {
        localStorage.removeItem("vyra_supabase_url");
        localStorage.removeItem("vyra_supabase_anon_key");
      }
      setSupabaseStatus(getSupabaseCredentials());
      setShowConfigModal(false);
      showToast("Configuração do Supabase salva com sucesso!");
      loadPhotos();
    } catch {
      showToast("Erro ao gravar configuração local.");
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.participant_name.toLowerCase().includes(q) ||
      (p.caption && p.caption.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className={
        embedded
          ? "space-y-6 animate-in fade-in duration-300"
          : "max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6 animate-in fade-in duration-300"
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1D1D1F] border border-[#FF6A2A]/50 text-[#F5F5F7] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-[#FF6A2A]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2B2B2F] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-3 py-1 rounded-full border border-[#FF6A2A]/30 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#FF6A2A]" />
              Galeria Oficial da Comunidade
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2.5">
            Galeria de Fotos & Votações
          </h1>
          <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1 max-w-2xl">
            Acompanhe as transformações dos participantes, vote na sua evolução favorita e compartilhe seu progresso.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="galeria-submit-photo-btn"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enviar Foto</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & View Modes */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#151515] p-3 rounded-2xl border border-[#2B2B2F]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9BA1]" />
          <input
            id="galeria-search-input"
            type="text"
            placeholder="Buscar participante ou legenda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F5F7] placeholder:text-[#9B9BA1] focus:outline-none focus:border-[#FF6A2A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9BA1] hover:text-[#F5F5F7]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter & View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#9B9BA1]">
          <span className="font-semibold">
            {filteredPhotos.length} {filteredPhotos.length === 1 ? "foto" : "fotos"}
          </span>

          <div className="flex items-center bg-[#1D1D1F] p-1 rounded-xl border border-[#2B2B2F]">
            <button
              id="galeria-view-grid-btn"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-[#FF6A2A] text-white"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              id="galeria-view-list-btn"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-[#FF6A2A] text-white"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
              title="Visualização em Lista / Ranking"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#FF6A2A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#9B9BA1]">Carregando fotos do Supabase...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#151515] border border-[#2B2B2F] space-y-3">
          <ImageIcon className="w-12 h-12 text-[#9B9BA1]/50 mx-auto" />
          <h3 className="text-base font-bold text-[#F5F5F7]">Nenhuma foto encontrada</h3>
          <p className="text-xs text-[#9B9BA1] max-w-sm mx-auto">
            {searchQuery
              ? "Tente outro termo de busca."
              : "Seja o primeiro a cadastrar sua foto no desafio!"}
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#FF6A2A] border border-[#FF6A2A]/30 hover:bg-[#FF6A2A]/10 transition-colors inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Foto Agora</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map((photo, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <div
                key={photo.id}
                id={`galeria-card-${photo.id}`}
                className={`rounded-3xl bg-[#151515] border transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:border-[#FF6A2A]/50 shadow-xl ${
                  isFirst
                    ? "border-[#D8B46A]/60 shadow-[#D8B46A]/10 ring-1 ring-[#D8B46A]/30"
                    : isSecond
                    ? "border-[#E5E5EA]/40"
                    : isThird
                    ? "border-[#C67D3B]/40"
                    : "border-[#2B2B2F]"
                }`}
              >
                {/* Photo container with zoom on hover */}
                <div
                  className="relative aspect-[4/5] bg-black cursor-pointer overflow-hidden"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.photo_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80"}
                    alt={photo.participant_name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-black/40 pointer-events-none" />

                  {/* Rank Badge */}
                  <div className="absolute top-3 left-3">
                    {isFirst && (
                      <span className="bg-[#D8B46A] text-[#0A0A0A] font-black text-[11px] px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
                        👑 1º Lugar
                      </span>
                    )}
                    {isSecond && (
                      <span className="bg-[#E5E5EA] text-[#0A0A0A] font-black text-[11px] px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
                        🥈 2º Lugar
                      </span>
                    )}
                    {isThird && (
                      <span className="bg-[#C67D3B] text-white font-black text-[11px] px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
                        🥉 3º Lugar
                      </span>
                    )}
                    {!isFirst && !isSecond && !isThird && (
                      <span className="bg-black/60 backdrop-blur-md text-[#9B9BA1] font-bold text-[10px] px-2 py-0.5 rounded-lg border border-white/10">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Quick Heart Icon on Top Right */}
                  <button
                    id={`like-photo-quick-btn-${photo.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVote(photo);
                    }}
                    disabled={votingId === photo.id}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                      photo.has_voted
                        ? "bg-[#FF453A] text-white scale-110 shadow-[#FF453A]/40"
                        : "bg-black/60 text-[#F5F5F7] hover:bg-black/80 hover:scale-105 border border-white/15"
                    }`}
                    title={photo.has_voted ? "Descurtir" : "Curtir"}
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform ${
                        photo.has_voted ? "fill-current animate-wiggle" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Card Content & Footer */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-extrabold text-[#F5F5F7] tracking-tight truncate">
                          {photo.participant_name}
                        </h3>
                        {photo.is_veteran && <VeteranBadge size="xs" />}
                        {typeof photo.patente_level === "number" && photo.patente_level > 0 && (
                          <PatentBadge level={photo.patente_level} size="xs" showLabel={true} />
                        )}
                      </div>
                      {photo.caption && (
                        <p className="text-xs text-[#9B9BA1] line-clamp-2 mt-0.5 leading-relaxed">
                          {photo.caption}
                        </p>
                      )}
                    </div>

                    {/* Total Votes Counter */}
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-lg font-black text-[#F5F5F7]">
                          {photo.votes_count}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B9BA1] block">
                        {photo.votes_count === 1 ? "voto" : "votos"}
                      </span>
                    </div>
                  </div>

                  {/* Main 'Curtir' Button */}
                  <button
                    id={`like-photo-btn-${photo.id}`}
                    onClick={() => handleToggleVote(photo)}
                    disabled={votingId === photo.id}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      photo.has_voted
                        ? "bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/60 hover:bg-[#FF453A]/30"
                        : "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A] hover:text-[#FF6A2A]"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        photo.has_voted ? "fill-[#FF453A] text-[#FF453A]" : ""
                      }`}
                    />
                    <span>{photo.has_voted ? "Curtido" : "Curtir"}</span>
                    <span className="text-[10px] font-bold opacity-75">
                      ({photo.votes_count})
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW / RANKING */
        <div className="rounded-3xl bg-[#151515] border border-[#2B2B2F] divide-y divide-[#2B2B2F] overflow-hidden shadow-xl">
          {filteredPhotos.map((photo, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <div
                key={photo.id}
                id={`galeria-list-row-${photo.id}`}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#1D1D1F]/50 transition-colors"
              >
                {/* Position & Thumbnail */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-8 text-center shrink-0">
                    {isFirst ? (
                      <span className="text-xl">👑</span>
                    ) : isSecond ? (
                      <span className="text-xl">🥈</span>
                    ) : isThird ? (
                      <span className="text-xl">🥉</span>
                    ) : (
                      <span className="text-sm font-black text-[#9B9BA1]">#{index + 1}</span>
                    )}
                  </div>

                  <img
                    src={photo.photo_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&auto=format&fit=crop&q=80"}
                    alt={photo.participant_name}
                    onClick={() => setSelectedPhoto(photo)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[#2B2B2F] shrink-0 cursor-pointer hover:brightness-110"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm sm:text-base font-extrabold text-[#F5F5F7] truncate">
                        {photo.participant_name}
                      </h4>
                      {photo.is_veteran && <VeteranBadge size="xs" />}
                      {typeof photo.patente_level === "number" && photo.patente_level > 0 && (
                        <PatentBadge level={photo.patente_level} size="xs" showLabel={true} />
                      )}
                      {isFirst && (
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider text-[#D8B46A] bg-[#D8B46A]/15 px-2 py-0.5 rounded-md border border-[#D8B46A]/30">
                          Líder
                        </span>
                      )}
                    </div>
                    {photo.caption && (
                      <p className="text-xs text-[#9B9BA1] truncate mt-0.5 max-w-md">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vote Counter & Action Button */}
                <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-[#F5F5F7] block">
                      {photo.votes_count}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-[#9B9BA1]">
                      {photo.votes_count === 1 ? "voto" : "votos"}
                    </span>
                  </div>

                  <button
                    id={`like-list-btn-${photo.id}`}
                    onClick={() => handleToggleVote(photo)}
                    disabled={votingId === photo.id}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      photo.has_voted
                        ? "bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/60"
                        : "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A] hover:text-[#FF6A2A]"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        photo.has_voted ? "fill-[#FF453A] text-[#FF453A]" : ""
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {photo.has_voted ? "Curtido" : "Curtir"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-[#151515] border border-[#2B2B2F] max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="close-lightbox-btn"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative max-h-[65vh] bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.photo_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80"}
                alt={selectedPhoto.participant_name}
                className="max-h-[65vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-[#F5F5F7]">
                      {selectedPhoto.participant_name}
                    </h3>
                    {selectedPhoto.is_veteran && <VeteranBadge size="sm" />}
                    {typeof selectedPhoto.patente_level === "number" && selectedPhoto.patente_level > 0 && (
                      <PatentBadge level={selectedPhoto.patente_level} size="sm" showLabel={true} />
                    )}
                  </div>
                  {selectedPhoto.caption && (
                    <p className="text-xs text-[#9B9BA1] mt-1 leading-relaxed">
                      {selectedPhoto.caption}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-[#F5F5F7]">
                    {selectedPhoto.votes_count}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#9B9BA1] block">
                    Votos Registrados
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  id="lightbox-toggle-vote-btn"
                  onClick={() => handleToggleVote(selectedPhoto)}
                  disabled={votingId === selectedPhoto.id}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    selectedPhoto.has_voted
                      ? "bg-[#FF453A] text-white shadow-[#FF453A]/30"
                      : "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-[#FF6A2A]/30 hover:brightness-110"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      selectedPhoto.has_voted ? "fill-white" : ""
                    }`}
                  />
                  <span>
                    {selectedPhoto.has_voted ? "Descurtir Foto" : "Curtir Foto"} (
                    {selectedPhoto.votes_count})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Photo Component (expo-image-picker & supabase-js) */}
      <GaleriaPhotoUpload
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onPhotoUploaded={loadPhotos}
        onToast={showToast}
      />

      {/* Supabase Config / Credentials Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2B2B2F] w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              id="close-supabase-config-btn"
              onClick={() => setShowConfigModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#34C759] uppercase bg-[#34C759]/15 px-2.5 py-0.5 rounded-full border border-[#34C759]/30">
                Integração Supabase
              </span>
              <h3 className="text-xl font-extrabold text-[#F5F5F7] mt-1.5">
                Configuração de Conexão
              </h3>
              <p className="text-xs text-[#9B9BA1] mt-0.5 leading-relaxed">
                Insira a URL e a Anon Key do seu projeto Supabase para conectar diretamente as tabelas <code className="text-[#FF9A62]">challenge_photos</code> e <code className="text-[#FF9A62]">photo_votes</code>.
              </p>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#9B9BA1] block mb-1 flex items-center justify-between">
                  <span>SUPABASE_URL (Project URL) *</span>
                  <span className="text-[10px] font-normal text-[#9B9BA1]">Formato: https://xxxx.supabase.co</span>
                </label>
                <input
                  type="text"
                  placeholder="https://[seu-projeto].supabase.co"
                  value={inputUrl}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (val.startsWith("sb_publishable_") || val.startsWith("sb_secret_")) {
                      // Se o usuário colou a chave na URL, ajusta automaticamente
                      setInputKey(val);
                      setInputUrl("");
                    } else {
                      setInputUrl(e.target.value);
                    }
                  }}
                  className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2.5 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#34C759]"
                />
                {inputUrl && !inputUrl.startsWith("http://") && !inputUrl.startsWith("https://") && (
                  <p className="text-[11px] text-[#FF9F0A] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>A URL precisa começar com <code>https://</code> (ex: <code>https://abcdefgh.supabase.co</code>)</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#9B9BA1] block mb-1 flex items-center justify-between">
                  <span>SUPABASE_ANON_KEY (Publishable Key)</span>
                  <span className="text-[10px] text-[#34C759] font-semibold">Chave pública detectada ✓</span>
                </label>
                <input
                  type="text"
                  placeholder="sb_publishable_..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-4 py-2.5 text-xs text-[#F5F5F7] font-mono focus:outline-none focus:border-[#34C759]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1D1D1F] border border-[#2B2B2F] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#34C759] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Schema Ativo & Auditado:</span>
                </div>
                <ul className="text-[11px] text-[#9B9BA1] space-y-1 list-disc list-inside">
                  <li>Tabela <strong className="text-[#F5F5F7]">challenge_photos</strong>: Foto, nome e total de votos.</li>
                  <li>Tabela <strong className="text-[#F5F5F7]">photo_votes</strong>: INSERT ao curtir, DELETE ao descurtir.</li>
                  <li>Trigger automático no Supabase sincroniza a coluna <code className="text-[#FF9A62]">votes_count</code>.</li>
                </ul>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("vyra_supabase_url");
                    localStorage.removeItem("vyra_supabase_anon_key");
                    setInputUrl("");
                    setInputKey("");
                    setSupabaseStatus(getSupabaseCredentials());
                    setShowConfigModal(false);
                    loadPhotos();
                    showToast("Restaurado para o modo integrado padrão.");
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#FF453A] border border-[#2B2B2F] hover:bg-[#FF453A]/10"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#34C759] text-black hover:brightness-110 shadow-lg shadow-[#34C759]/20 font-extrabold"
                >
                  Salvar Conexão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
