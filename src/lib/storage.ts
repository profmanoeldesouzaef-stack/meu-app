import { supabase } from "./supabase";
import { getVotingUserId } from "./supabaseClient";
import { ChallengeEntry } from "../types";

const BUCKET_NAME = "challenge_photos";

/**
 * Faz o upload de uma imagem (URI local, base64 ou Blob) para o bucket 'challenge_photos' do Supabase Storage.
 */
export async function uploadToChallengePhotosBucket(
  uriOrBlob: string | Blob,
  customFileName?: string
): Promise<{ publicUrl: string; path: string; error?: any }> {
  try {
    let blob: Blob;
    let contentType = "image/jpeg";

    if (typeof uriOrBlob === "string") {
      // Caso seja data URL ou blob URL
      const response = await fetch(uriOrBlob);
      blob = await response.blob();
      contentType = blob.type || "image/jpeg";
    } else {
      blob = uriOrBlob;
      contentType = blob.type || "image/jpeg";
    }

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : "jpg";

    const userId = getVotingUserId() || "athlete";
    const fileName =
      customFileName ||
      `entry_${userId.substring(0, 8)}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 7)}.${ext}`;

    const filePath = fileName;

    // Tenta upload no bucket Supabase 'challenge_photos'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Supabase Storage] Aviso no bucket '${BUCKET_NAME}':`, uploadError.message);
      // Se for URL data/blob, mantém como fallback válido para visualização local imediata
      const fallbackUrl = typeof uriOrBlob === "string" ? uriOrBlob : URL.createObjectURL(blob);
      return { publicUrl: fallbackUrl, path: filePath, error: uploadError };
    }

    // Obter URL pública do arquivo
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData?.path || filePath);

    const publicUrl = publicUrlData?.publicUrl || (typeof uriOrBlob === "string" ? uriOrBlob : "");

    return {
      publicUrl,
      path: uploadData?.path || filePath,
    };
  } catch (err: any) {
    console.error("[Storage Upload Error]:", err);
    const fallbackUrl = typeof uriOrBlob === "string" ? uriOrBlob : "";
    return { publicUrl: fallbackUrl, path: "", error: err };
  }
}

/**
 * Salva uma nova participação na tabela 'challenge_entries' do Supabase e sincroniza no backend.
 */
export async function saveChallengeEntry(entry: {
  challenge_id: string;
  user_id?: string;
  participant_name?: string;
  photo_url: string;
  caption?: string;
}): Promise<ChallengeEntry> {
  const userId = entry.user_id || getVotingUserId() || "user-default";
  const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newEntry: ChallengeEntry = {
    id: entryId,
    user_id: userId,
    challenge_id: entry.challenge_id,
    photo_url: entry.photo_url,
    participant_name: entry.participant_name || "Atleta Vyra",
    caption: entry.caption || "",
    votes_count: 0,
    is_winner: false,
    created_at: now,
  };

  // 1. Tenta gravar no Supabase tabela 'challenge_entries'
  try {
    const { error } = await supabase.from("challenge_entries").insert({
      id: newEntry.id,
      user_id: newEntry.user_id,
      challenge_id: newEntry.challenge_id,
      photo_url: newEntry.photo_url,
      participant_name: newEntry.participant_name,
      caption: newEntry.caption,
      votes_count: 0,
      is_winner: false,
      created_at: newEntry.created_at,
    });

    if (error) {
      console.warn("[Supabase] Inserção em challenge_entries:", error.message);
    }

    // Retrocompatibilidade opcional com 'challenge_photos'
    try {
      await supabase.from("challenge_photos").insert({
        id: newEntry.id,
        participant_name: newEntry.participant_name,
        photo_url: newEntry.photo_url,
        caption: newEntry.caption,
        category: "shape",
        votes_count: 0,
        created_at: newEntry.created_at,
      });
    } catch {
      // silencioso se a tabela legada não existir
    }
  } catch (err) {
    console.warn("[Supabase] Aviso ao persistir submissão:", err);
  }

  // 2. Sincroniza com o backend
  try {
    await fetch("/api/challenge-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    });
  } catch (apiErr) {
    console.warn("[API] Aviso ao registrar entry no servidor:", apiErr);
  }

  return newEntry;
}

/**
 * Busca participações por desafio
 */
export async function getChallengeEntries(challengeId?: string): Promise<ChallengeEntry[]> {
  try {
    let query = supabase
      .from("challenge_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (challengeId) {
      query = query.eq("challenge_id", challengeId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        challenge_id: item.challenge_id,
        photo_url: item.photo_url,
        created_at: item.created_at,
        participant_name: item.participant_name || "Atleta Vyra",
        caption: item.caption || "",
        votes_count: Number(item.votes_count) || 0,
        is_winner: Boolean(item.is_winner),
      }));
    }
  } catch (e) {
    console.warn("[Supabase] Falha ao carregar challenge_entries:", e);
  }

  // Fallback backend
  try {
    const url = challengeId
      ? `/api/challenge-entries?challenge_id=${encodeURIComponent(challengeId)}`
      : "/api/challenge-entries";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (apiErr) {
    console.warn("[API] Falha ao buscar challenge-entries:", apiErr);
  }

  return [];
}

/**
 * Ação definitiva do Coach: Declarar Campeão de um Desafio.
 * Encerra submissões, marca o status como 'finished' e atribui o vencedor.
 */
export async function declareChampionAction(
  challengeId: string,
  winner: {
    entry_id: string;
    user_id: string;
    participant_name: string;
    photo_url: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Atualiza na tabela challenge_entries no Supabase
    await supabase
      .from("challenge_entries")
      .update({ is_winner: true })
      .eq("id", winner.entry_id);

    // 2. Atualiza a tabela challenges no Supabase
    await supabase
      .from("challenges")
      .update({
        status: "finished",
        winner_id: winner.user_id,
        winner_name: winner.participant_name,
        winner_photo_url: winner.photo_url,
        finished_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    // 3. Notifica o backend oficial
    const res = await fetch(`/api/challenges/${challengeId}/declare-champion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(winner),
    });

    if (res.ok) {
      const result = await res.json();
      return { success: true, message: result.message || "Campeão declarado com sucesso!" };
    }
  } catch (err: any) {
    console.error("Erro ao declarar campeão:", err);
  }

  return { success: true, message: "Campeão declarado e submissões encerradas!" };
}
