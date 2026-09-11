import React, { useEffect, useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { ChallengePhoto } from "../types";
import {
  Heart,
  Trophy,
  Flame,
  Search,
  Filter,
  Eye,
  X,
  Plus,
  Code2,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  ArrowUpDown,
  Upload,
  ArrowLeft,
} from "lucide-react";

export const PhotoGalleryView: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { t, theme, setActiveView } = useApp();
  const [photos, setPhotos] = useState<ChallengePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [votingId, setVotingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lightbox Modal
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengePhoto | null>(null);

  // Supabase SQL / Code Modal
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"sql" | "ts">("sql");
  const [copied, setCopied] = useState(false);

  // Upload/Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newCategory, setNewCategory] = useState("shape");
  const [newPhotoUrl, setNewPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
  );
  const [submitting, setSubmitting] = useState(false);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await api.getChallengePhotos({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
      });
      // Ensure strictly sorted by votes descending
      const sorted = [...data].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
      setPhotos(sorted);
    } catch (err) {
      console.error("Erro ao carregar fotos da galeria:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPhotos();
  };

  // Toggle vote handler (Like / Unlike)
  const handleToggleVote = async (photo: ChallengePhoto) => {
    if (votingId) return; // Prevent double click spam
    setVotingId(photo.id);

    const wasVoted = photo.has_voted;
    const optimisticNewCount = wasVoted
      ? Math.max(0, photo.votes_count - 1)
      : photo.votes_count + 1;

    // Optimistic update
    setPhotos((prev) => {
      const updated = prev.map((p) =>
        p.id === photo.id
          ? { ...p, has_voted: !wasVoted, votes_count: optimisticNewCount }
          : p
      );
      // Re-sort strictly by votes descending
      return updated.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
    });

    if (selectedPhoto && selectedPhoto.id === photo.id) {
      setSelectedPhoto({
        ...selectedPhoto,
        has_voted: !wasVoted,
        votes_count: optimisticNewCount,
      });
    }

    try {
      const res = await api.togglePhotoVote(photo.id);
      if (res.ok) {
        // Sync with exact server response
        setPhotos((prev) => {
          const updated = prev.map((p) =>
            p.id === photo.id
              ? { ...p, has_voted: res.hasVoted, votes_count: res.newVoteCount }
              : p
          );
          return updated.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
        });

        if (selectedPhoto && selectedPhoto.id === photo.id) {
          setSelectedPhoto({
            ...selectedPhoto,
            has_voted: res.hasVoted,
            votes_count: res.newVoteCount,
          });
        }

        const msg = res.action === "added" ? "Voto registrado! +1 🔥" : "Voto removido.";
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err: any) {
      console.error("Erro ao alternar voto:", err);
      // Rollback
      fetchPhotos();
      setToastMessage("Erro ao registrar voto. Tente novamente.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setVotingId(null);
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantName.trim() || !newPhotoUrl.trim()) return;
    setSubmitting(true);
    try {
      await api.submitChallengePhoto({
        participant_name: newParticipantName.trim(),
        caption: newCaption.trim(),
        photo_url: newPhotoUrl.trim(),
        category: newCategory,
      });
      setShowSubmitModal(false);
      setNewParticipantName("");
      setNewCaption("");
      fetchPhotos();
      setToastMessage("Foto adicionada à galeria com sucesso!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Erro ao enviar foto:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const sqlCode = `-- TABELAS SUPABASE: challenge_photos e photo_votes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Fotos do Desafio
CREATE TABLE IF NOT EXISTS public.challenge_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL,
    caption TEXT,
    photo_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'shape',
    votes_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabela de Votos (Lógica de Toggle com UNIQUE constraint)
CREATE TABLE IF NOT EXISTS public.photo_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES public.challenge_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_photo_vote UNIQUE (photo_id, user_id)
);

-- Índices de Otimização (Ordenação por votos)
CREATE INDEX idx_challenge_photos_votes_desc 
    ON public.challenge_photos (votes_count DESC);
CREATE INDEX idx_photo_votes_photo_user 
    ON public.photo_votes (photo_id, user_id);

-- Trigger para manter votes_count sincronizado
CREATE OR REPLACE FUNCTION public.sync_photo_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.challenge_photos
        SET votes_count = votes_count + 1 WHERE id = NEW.photo_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.challenge_photos
        SET votes_count = GREATEST(0, votes_count - 1) WHERE id = OLD.photo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_photo_votes_count
AFTER INSERT OR DELETE ON public.photo_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_photo_votes_count();

-- RLS (Row Level Security)
ALTER TABLE public.challenge_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read photos" ON public.challenge_photos FOR SELECT TO public USING (true);
CREATE POLICY "Public read votes" ON public.photo_votes FOR SELECT TO public USING (true);
CREATE POLICY "Auth users vote" ON public.photo_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users unvote" ON public.photo_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);`;

  const tsCode = `import { SupabaseClient } from "@supabase/supabase-js";

export interface ToggleVoteResult {
  hasVoted: boolean;
  newVoteCount: number;
  action: "added" | "removed";
}

/**
 * Função TypeScript responsável por alternar (toggle) o voto de um usuário
 * em uma foto no banco de dados do Supabase.
 *
 * Checa se o usuário já curtiu: se sim, remove (delete); se não, insere (insert).
 */
export async function togglePhotoVote(
  supabase: SupabaseClient,
  photoId: string,
  userId: string
): Promise<ToggleVoteResult> {
  // 1. Checa se o usuário já curtiu a foto
  const { data: existingVote, error: checkError } = await supabase
    .from("photo_votes")
    .select("id")
    .eq("photo_id", photoId)
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    throw new Error(\`Erro ao verificar voto: \${checkError.message}\`);
  }

  // 2. Lógica de Toggle
  if (existingVote) {
    // Já votou -> REMOVE O VOTO (Descurtir)
    const { error: deleteError } = await supabase
      .from("photo_votes")
      .delete()
      .eq("photo_id", photoId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    // Recupera a contagem atualizada
    const { count } = await supabase
      .from("photo_votes")
      .select("*", { count: "exact", head: true })
      .eq("photo_id", photoId);

    return { hasVoted: false, newVoteCount: count ?? 0, action: "removed" };
  } else {
    // Não votou -> REGISTRA O VOTO (Curtir)
    const { error: insertError } = await supabase
      .from("photo_votes")
      .insert({ photo_id: photoId, user_id: userId });

    if (insertError) throw insertError;

    const { count } = await supabase
      .from("photo_votes")
      .select("*", { count: "exact", head: true })
      .eq("photo_id", photoId);

    return { hasVoted: true, newVoteCount: count ?? 1, action: "added" };
  }
}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadge = (cat?: string) => {
    const c = (cat || "").toLowerCase();
    if (c === "destaque" || c === "geral") {
      return (
        <span className="bg-[#FF6A2A]/20 text-[#FF6A2A] border border-[#FF6A2A]/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
          Desafio Oficial
        </span>
      );
    }
    if (c === "comunidade") {
      return (
        <span className="bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
          Comunidade
        </span>
      );
    }
    return (
      <span className="bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
        Evolução
      </span>
    );
  };

  return (
    <div
      className={
        embedded
          ? "space-y-8 animate-in fade-in duration-300"
          : "max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-8 animate-in fade-in duration-300"
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1D1D1F] border border-[#FF6A2A]/40 text-[#F5F5F7] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <Flame className="w-4 h-4 text-[#FF6A2A]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Back Button when opened standalone */}
      {!embedded && (
        <button
          id="gallery-back-to-challenges-btn"
          onClick={() => setActiveView("challenges")}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] flex items-center gap-2 self-start cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Voltar para Desafios</span>
        </button>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2B2B2F] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#FF6A2A] uppercase bg-[#FF6A2A]/15 px-3 py-1 rounded-full border border-[#FF6A2A]/30 flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-[#FF6A2A]" />
              Votação Oficial da Comunidade
            </span>
            <span className="text-[10px] font-bold text-[#9B9BA1] bg-[#1D1D1F] px-2.5 py-0.5 rounded-full border border-[#2B2B2F]">
              Ordenado por Votos
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight mt-2.5">
            Galeria & Ranking de Fotos
          </h1>
          <p className="text-xs sm:text-sm text-[#9B9BA1] mt-1 max-w-2xl">
            Fotos de transformação e shape em ordem decrescente de votos. O sistema conta com
            lógica de toggle (curtir / descurtir) com constraint de voto único por usuário.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-submit-challenge-photo"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#FF6A2A]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Enviar Foto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#151515] p-3 rounded-2xl border border-[#2B2B2F]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Todas as Fotos" },
            { id: "destaque", label: "🏆 Desafio Oficial" },
            { id: "evolucao", label: "📈 Evoluções" },
            { id: "comunidade", label: "🔥 Comunidade" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#FF6A2A] text-white shadow-md shadow-[#FF6A2A]/20"
                  : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Indicator */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Buscar participante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3 py-1.5 pl-8 text-xs text-[#F5F5F7] placeholder-[#9B9BA1] focus:outline-none focus:border-[#FF6A2A]"
            />
            <Search className="w-3.5 h-3.5 text-[#9B9BA1] absolute left-2.5 top-2.5" />
          </form>

          <div
            className="flex items-center gap-1 text-[11px] font-bold text-[#D8B46A] bg-[#D8B46A]/10 border border-[#D8B46A]/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap"
            title="Lista ordenada do maior para o menor número de votos"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ranking Decrescente</span>
          </div>
        </div>
      </div>

      {/* Podium Cards for Top 3 (if exists and category is 'all' or filtered) */}
      {!loading && photos.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 1st Place */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-[#D8B46A]/20 via-[#1A1A1A] to-[#151515] p-4 rounded-3xl border-2 border-[#D8B46A] relative shadow-xl shadow-[#D8B46A]/10 flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D8B46A] to-[#FFD700] text-[#0A0A0A] text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <span>👑</span>
              <span>1º Lugar · Maior Votação</span>
            </div>

            <div className="mt-2 relative rounded-2xl overflow-hidden aspect-square border border-[#D8B46A]/40 group">
              <img
                src={photos[0].photo_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80"}
                alt={photos[0].participant_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                onClick={() => setSelectedPhoto(photos[0])}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Ampliar Foto</span>
              </button>
            </div>

            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#F5F5F7] tracking-tight">
                  {photos[0].participant_name}
                </h3>
                {getCategoryBadge(photos[0].category)}
              </div>

              {photos[0].caption && (
                <p className="text-xs text-[#9B9BA1] line-clamp-2 italic">
                  "{photos[0].caption}"
                </p>
              )}

              {/* Vote Button */}
              <button
                id={`vote-podium-${photos[0].id}`}
                onClick={() => handleToggleVote(photos[0])}
                disabled={votingId === photos[0].id}
                className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  photos[0].has_voted
                    ? "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-lg shadow-[#FF6A2A]/30 scale-[1.01]"
                    : "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A]/50 hover:bg-[#252528]"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    photos[0].has_voted ? "fill-white text-white animate-bounce" : "text-[#FF6A2A]"
                  }`}
                />
                <span>
                  {photos[0].has_voted ? "Voto Ativo" : "Votar nesta foto"} · {photos[0].votes_count} votos
                </span>
              </button>
            </div>
          </div>

          {/* 2nd Place */}
          <div className="order-2 md:order-1 bg-[#151515] p-4 rounded-3xl border border-[#9B9BA1]/40 relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#9B9BA1] text-[#0A0A0A] text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <span>🥈</span>
              <span>2º Lugar</span>
            </div>

            <div className="mt-2 relative rounded-2xl overflow-hidden aspect-square border border-[#2B2B2F] group">
              <img
                src={photos[1].photo_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"}
                alt={photos[1].participant_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                onClick={() => setSelectedPhoto(photos[1])}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Ampliar Foto</span>
              </button>
            </div>

            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#F5F5F7] tracking-tight">
                  {photos[1].participant_name}
                </h3>
                {getCategoryBadge(photos[1].category)}
              </div>

              {photos[1].caption && (
                <p className="text-xs text-[#9B9BA1] line-clamp-2 italic">
                  "{photos[1].caption}"
                </p>
              )}

              <button
                id={`vote-podium-${photos[1].id}`}
                onClick={() => handleToggleVote(photos[1])}
                disabled={votingId === photos[1].id}
                className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  photos[1].has_voted
                    ? "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-md shadow-[#FF6A2A]/20"
                    : "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A]/50"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    photos[1].has_voted ? "fill-white text-white" : "text-[#FF6A2A]"
                  }`}
                />
                <span>
                  {photos[1].has_voted ? "Voto Ativo" : "Votar"} · {photos[1].votes_count} votos
                </span>
              </button>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 bg-[#151515] p-4 rounded-3xl border border-[#CD7F32]/40 relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <span>🥉</span>
              <span>3º Lugar</span>
            </div>

            <div className="mt-2 relative rounded-2xl overflow-hidden aspect-square border border-[#2B2B2F] group">
              <img
                src={photos[2].photo_url || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"}
                alt={photos[2].participant_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                onClick={() => setSelectedPhoto(photos[2])}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Ampliar Foto</span>
              </button>
            </div>

            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#F5F5F7] tracking-tight">
                  {photos[2].participant_name}
                </h3>
                {getCategoryBadge(photos[2].category)}
              </div>

              {photos[2].caption && (
                <p className="text-xs text-[#9B9BA1] line-clamp-2 italic">
                  "{photos[2].caption}"
                </p>
              )}

              <button
                id={`vote-podium-${photos[2].id}`}
                onClick={() => handleToggleVote(photos[2])}
                disabled={votingId === photos[2].id}
                className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  photos[2].has_voted
                    ? "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-md shadow-[#FF6A2A]/20"
                    : "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A]/50"
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    photos[2].has_voted ? "fill-white text-white" : "text-[#FF6A2A]"
                  }`}
                />
                <span>
                  {photos[2].has_voted ? "Voto Ativo" : "Votar"} · {photos[2].votes_count} votos
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Ordered Photos Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#F5F5F7] flex items-center gap-2">
            <span>Ranking Completo ({photos.length} fotos)</span>
            <span className="text-xs text-[#9B9BA1] font-normal">
              (Ordenado por número de votos)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#FF6A2A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#9B9BA1]">Carregando fotos e votos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-[#151515] p-12 rounded-3xl border border-[#2B2B2F] text-center space-y-3">
            <ImageIcon className="w-12 h-12 text-[#9B9BA1] mx-auto stroke-1" />
            <h3 className="text-base font-bold text-[#F5F5F7]">Nenhuma foto encontrada</h3>
            <p className="text-xs text-[#9B9BA1] max-w-sm mx-auto">
              Nenhuma participante corresponde ao filtro selecionado. Envie a primeira foto!
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-[#FF6A2A] text-white rounded-xl text-xs font-bold"
            >
              Cadastrar Foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {photos.map((photo, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <div
                  key={photo.id}
                  id={`photo-card-${photo.id}`}
                  className={`bg-[#151515] rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between hover:border-[#FF6A2A]/40 group ${
                    isFirst
                      ? "border-[#D8B46A]/60 shadow-lg shadow-[#D8B46A]/5"
                      : "border-[#2B2B2F]"
                  }`}
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] bg-[#0A0A0A] overflow-hidden">
                    <img
                      src={photo.photo_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80"}
                      alt={photo.participant_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Rank Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1 ${
                          isFirst
                            ? "bg-[#D8B46A] text-[#0A0A0A]"
                            : isSecond
                            ? "bg-[#9B9BA1] text-[#0A0A0A]"
                            : isThird
                            ? "bg-[#CD7F32] text-white"
                            : "bg-[#1D1D1F]/90 text-[#F5F5F7] backdrop-blur-md border border-[#2B2B2F]"
                        }`}
                      >
                        {isFirst && "👑"} #{rank}
                      </span>
                    </div>

                    {/* Category Tag */}
                    <div className="absolute top-3 right-3">
                      {getCategoryBadge(photo.category)}
                    </div>

                    {/* Zoom Click Overlay */}
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Visualizar em Detalhes</span>
                    </button>
                  </div>

                  {/* Info and Actions */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-[#F5F5F7] tracking-tight">
                          {photo.participant_name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs font-black text-[#FF6A2A]">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{photo.votes_count} votos</span>
                        </div>
                      </div>

                      {photo.caption && (
                        <p className="text-xs text-[#9B9BA1] mt-1.5 line-clamp-2 leading-relaxed">
                          {photo.caption}
                        </p>
                      )}
                    </div>

                    {/* Toggle Vote Button */}
                    <div className="pt-2 border-t border-[#2B2B2F]/60 flex items-center justify-between gap-2">
                      <button
                        id={`btn-toggle-vote-${photo.id}`}
                        onClick={() => handleToggleVote(photo)}
                        disabled={votingId === photo.id}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          photo.has_voted
                            ? "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-lg shadow-[#FF6A2A]/25 hover:brightness-105 active:scale-95"
                            : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A]/40 active:scale-95"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform ${
                            photo.has_voted
                              ? "fill-white text-white scale-110"
                              : "text-[#9B9BA1] group-hover:text-[#FF6A2A]"
                          }`}
                        />
                        <span>{photo.has_voted ? "Curtido (Voto Salvo)" : "Curtir & Votar"}</span>
                      </button>

                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="p-2.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#9B9BA1]/40 transition-colors cursor-pointer"
                        title="Ver foto em tela cheia"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black bg-[#FF6A2A] text-white px-2.5 py-1 rounded-xl">
                  {selectedPhoto.votes_count} votos
                </span>
                <h3 className="text-base font-extrabold text-[#F5F5F7]">
                  {selectedPhoto.participant_name}
                </h3>
                {getCategoryBadge(selectedPhoto.category)}
              </div>

              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Photo */}
            <div className="p-4 sm:p-6 flex flex-col items-center">
              <div className="rounded-2xl overflow-hidden max-h-[55vh] border border-[#2B2B2F] shadow-xl">
                <img
                  src={selectedPhoto.photo_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80"}
                  alt={selectedPhoto.participant_name}
                  className="w-full h-full object-contain max-h-[55vh]"
                />
              </div>

              {selectedPhoto.caption && (
                <p className="mt-4 text-xs sm:text-sm text-[#9B9BA1] text-center max-w-lg italic">
                  "{selectedPhoto.caption}"
                </p>
              )}

              {/* Toggle Vote Button in Modal */}
              <div className="mt-5 w-full max-w-xs">
                <button
                  onClick={() => handleToggleVote(selectedPhoto)}
                  className={`w-full py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    selectedPhoto.has_voted
                      ? "bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white shadow-[#FF6A2A]/30"
                      : "bg-[#1D1D1F] text-[#F5F5F7] border border-[#2B2B2F] hover:border-[#FF6A2A]"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      selectedPhoto.has_voted ? "fill-white text-white" : "text-[#FF6A2A]"
                    }`}
                  />
                  <span>
                    {selectedPhoto.has_voted ? "Descurtir (Remover Voto)" : "Curtir & Votar"} ·{" "}
                    {selectedPhoto.votes_count} votos
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Code Drawer / Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#151515] border border-[#D8B46A]/40 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2B2B2F] bg-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#D8B46A]" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#F5F5F7]">
                    Código Supabase: Tabelas & Função Toggle TypeScript
                  </h3>
                  <p className="text-[11px] text-[#9B9BA1]">
                    Pronto para copiar e colar no Supabase SQL Editor e projeto TS.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCodeModal(false)}
                className="p-2 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between px-5 pt-3 border-b border-[#2B2B2F]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCodeTab("sql")}
                  className={`px-3 py-1.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeCodeTab === "sql"
                      ? "border-[#D8B46A] text-[#D8B46A]"
                      : "border-transparent text-[#9B9BA1] hover:text-[#F5F5F7]"
                  }`}
                >
                  1. SQL Supabase (Tabelas, RLS & Trigger)
                </button>
                <button
                  onClick={() => setActiveCodeTab("ts")}
                  className={`px-3 py-1.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeCodeTab === "ts"
                      ? "border-[#FF6A2A] text-[#FF6A2A]"
                      : "border-transparent text-[#9B9BA1] hover:text-[#F5F5F7]"
                  }`}
                >
                  2. TypeScript (togglePhotoVote)
                </button>
              </div>

              <button
                onClick={() => copyToClipboard(activeCodeTab === "sql" ? sqlCode : tsCode)}
                className="mb-2 px-3 py-1 rounded-xl bg-[#1D1D1F] hover:bg-[#252528] text-xs font-bold text-[#F5F5F7] border border-[#2B2B2F] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#9B9BA1]" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <div className="p-4 flex-1 overflow-y-auto bg-[#0A0A0A]">
              <pre className="text-[11px] font-mono text-[#E5E5E5] leading-relaxed overflow-x-auto p-3 bg-[#111113] rounded-xl border border-[#2B2B2F]">
                <code>{activeCodeTab === "sql" ? sqlCode : tsCode}</code>
              </pre>
            </div>

            <div className="p-3.5 border-t border-[#2B2B2F] bg-[#151515] flex justify-between items-center text-[11px] text-[#9B9BA1]">
              <span>Arquivo salvo na raiz do projeto: <code className="text-[#D8B46A]">/supabase_challenge_photos.sql</code></span>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-3 py-1 bg-[#1D1D1F] text-[#F5F5F7] rounded-lg border border-[#2B2B2F] font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Photo Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#151515] border border-[#2B2B2F] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#F5F5F7]">
                Enviar Foto para o Ranking
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-xl bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePhoto} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Nome do Participante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Camila Siqueira"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3 py-2 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Categoria / Protocolo
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3 py-2 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                >
                  <option value="destaque">🏆 Desafio Oficial</option>
                  <option value="evolucao">📈 Evolução & Perimetria</option>
                  <option value="comunidade">🔥 Destaque da Comunidade</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  URL da Foto *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3 py-2 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Legenda / Relato da Transformação
                </label>
                <textarea
                  rows={3}
                  placeholder="Conte um pouco sobre sua evolução..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full bg-[#1D1D1F] border border-[#2B2B2F] rounded-xl px-3 py-2 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#FF6A2A]/25 hover:opacity-95 cursor-pointer"
              >
                {submitting ? "Enviando..." : "Publicar Foto na Galeria"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
