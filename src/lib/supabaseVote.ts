import { SupabaseClient } from "@supabase/supabase-js";
import { ChallengePhoto } from "../types";

export interface ToggleVoteResult {
  hasVoted: boolean;
  newVoteCount: number;
  action: "added" | "removed";
  photoId: string;
}

/**
 * Função TypeScript responsável por alternar (toggle) o voto de um usuário
 * em uma foto no banco de dados do Supabase.
 *
 * 1. Checa na tabela 'photo_votes' se o usuário já curtiu a foto especificada.
 * 2. Se já curtiu: deleta o voto (descurtir).
 * 3. Se não curtiu: insere o novo voto (curtir).
 * 4. Retorna o estado atualizado (hasVoted e nova quantidade de votos).
 *
 * Nota: Com a trigger 'trg_sync_photo_votes_count' configurada no Supabase,
 * a coluna 'votes_count' na tabela 'challenge_photos' é sincronizada automaticamente.
 *
 * @param supabase - Instância do SupabaseClient
 * @param photoId - UUID da foto na tabela 'challenge_photos'
 * @param userId - UUID do usuário autenticado na tabela 'auth.users'
 * @returns {Promise<ToggleVoteResult>}
 */
export async function togglePhotoVote(
  supabase: SupabaseClient,
  photoId: string,
  userId: string
): Promise<ToggleVoteResult> {
  if (!photoId || !userId) {
    throw new Error("photoId e userId são obrigatórios para registrar o voto.");
  }

  // Passo 1: Checa se o usuário já curtiu esta foto
  const { data: existingVote, error: checkError } = await supabase
    .from("photo_votes")
    .select("id")
    .eq("photo_id", photoId)
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    console.error("Erro ao verificar voto existente no Supabase:", checkError);
    throw new Error(`Erro ao verificar voto: ${checkError.message}`);
  }

  let action: "added" | "removed";
  let hasVoted: boolean;

  // Passo 2: Lógica de Toggle
  if (existingVote) {
    // Usuário já curtiu -> REMOVE o voto (Descurtir)
    const { error: deleteError } = await supabase
      .from("photo_votes")
      .delete()
      .eq("photo_id", photoId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Erro ao remover voto no Supabase:", deleteError);
      throw new Error(`Erro ao remover voto: ${deleteError.message}`);
    }

    action = "removed";
    hasVoted = false;
  } else {
    // Usuário ainda não curtiu -> INSERE o voto (Curtir)
    const { error: insertError } = await supabase
      .from("photo_votes")
      .insert({
        photo_id: photoId,
        user_id: userId,
      });

    if (insertError) {
      console.error("Erro ao registrar voto no Supabase:", insertError);
      throw new Error(`Erro ao registrar voto: ${insertError.message}`);
    }

    action = "added";
    hasVoted = true;
  }

  // Passo 3: Busca a contagem exata e atualizada de votos para a foto
  const { count, error: countError } = await supabase
    .from("photo_votes")
    .select("*", { count: "exact", head: true })
    .eq("photo_id", photoId);

  if (countError) {
    console.warn("Aviso ao recuperar contagem atualizada de votos:", countError);
  }

  const newVoteCount = count !== null && count !== undefined ? count : 0;

  return {
    hasVoted,
    newVoteCount,
    action,
    photoId,
  };
}

/**
 * Função auxiliar para buscar todas as fotos ordenadas estritamente
 * pela quantidade de votos (ordem decrescente - maior para menor).
 *
 * @param supabase - Instância do SupabaseClient
 * @param currentUserId - (Opcional) ID do usuário atual para marcar fotos já curtidas
 * @param categoryFilter - (Opcional) Filtrar por categoria ('shape', 'force', 'reset12')
 * @returns {Promise<ChallengePhoto[]>}
 */
export async function getPhotosOrderedByVotes(
  supabase: SupabaseClient,
  currentUserId?: string,
  categoryFilter?: string
): Promise<ChallengePhoto[]> {
  let query = supabase
    .from("challenge_photos")
    .select(
      `
      id,
      user_id,
      participant_name,
      caption,
      photo_url,
      category,
      votes_count,
      created_at
    `
    )
    .eq("status", "approved")
    .order("votes_count", { ascending: false }); // Ordem estrita por quantidade de votos

  if (categoryFilter && categoryFilter !== "all" && categoryFilter !== "Todas") {
    query = query.eq("category", categoryFilter.toLowerCase());
  }

  const { data: photos, error } = await query;

  if (error) {
    console.error("Erro ao buscar fotos ordenadas por votos:", error);
    throw new Error(`Erro ao carregar galeria: ${error.message}`);
  }

  if (!photos) return [];

  // Se houver um usuário autenticado, mapeia quais fotos ele já curtiu
  if (currentUserId && photos.length > 0) {
    const photoIds = photos.map((p) => p.id);
    const { data: userVotes } = await supabase
      .from("photo_votes")
      .select("photo_id")
      .eq("user_id", currentUserId)
      .in("photo_id", photoIds);

    const votedSet = new Set(userVotes?.map((v) => v.photo_id) || []);

    return photos.map((p) => ({
      ...p,
      has_voted: votedSet.has(p.id),
    }));
  }

  return photos.map((p) => ({
    ...p,
    has_voted: false,
  }));
}
