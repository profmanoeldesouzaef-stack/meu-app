import { supabase } from "./supabase";
import { getVotingUserId } from "./supabaseClient";

export interface CheckinItem {
  id: string;
  user_id: string;
  user_name: string;
  tipo: string;
  created_at: string;
}

export interface CoachNotification {
  id: string;
  aluno_id?: string;
  aluno_nome: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export interface LiveStudent {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  avatar_url?: string;
  plan?: string;
  phone?: string;
  is_training_now: boolean;
  last_checkin_at?: string | null;
}

export interface AbsentStudent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  plan?: string;
  last_checkin_at: string | null;
  daysAbsent: number;
}

// Fallbacks locais para persistência offline ou ambiente demo
function getLocalCheckins(userId: string): CheckinItem[] {
  try {
    const raw = localStorage.getItem(`vyra_checkins_${userId}`);
    if (raw) return JSON.parse(raw);
    const globalRaw = localStorage.getItem("vyra_checkins");
    if (globalRaw) return JSON.parse(globalRaw);
  } catch {}
  return [];
}

function saveLocalCheckin(userId: string, checkin: CheckinItem) {
  try {
    const list = getLocalCheckins(userId);
    list.unshift(checkin);
    localStorage.setItem(`vyra_checkins_${userId}`, JSON.stringify(list));
    localStorage.setItem("vyra_checkins", JSON.stringify(list));
  } catch {}
}

/**
 * Calcula os dias seguidos de check-in (streak do foguinho 🔥)
 */
export function calculateStreakFromDates(dateStrings: string[]): number {
  if (!dateStrings || dateStrings.length === 0) return 0;

  // Normaliza as datas para "YYYY-MM-DD" e remove duplicatas no mesmo dia
  const uniqueDays = Array.from(
    new Set(
      dateStrings
        .filter(Boolean)
        .map((d) => {
          try {
            const dateObj = new Date(d);
            if (isNaN(dateObj.getTime())) return null;
            return dateObj.toISOString().split("T")[0];
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => b.localeCompare(a)); // Ordenadas decrescente

  if (uniqueDays.length === 0) return 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split("T")[0];

  const mostRecentDay = uniqueDays[0];

  // Se o check-in mais recente não foi nem hoje nem ontem, o streak quebrou
  if (mostRecentDay !== todayStr && mostRecentDay !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(mostRecentDay);

  for (const dayStr of uniqueDays) {
    const expectedStr = expectedDate.toISOString().split("T")[0];
    if (dayStr === expectedStr) {
      streak += 1;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 1. Iniciar Treino:
 * Realiza UPDATE na tabela profiles (e perfis): is_training_now = true
 */
export async function startTraining(userId: string, userName?: string): Promise<{ success: boolean; error?: string }> {
  const effectiveUserId = userId || getVotingUserId();

  try {
    // 1. Atualizar profiles no Supabase
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ is_training_now: true })
      .eq("id", effectiveUserId);

    if (profileErr) {
      console.error("[ERRO SUPABASE]:", profileErr);
      const msg = `Falha ao salvar no banco: ${profileErr.message} - ${profileErr.details || ""}`;
      try {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert(msg);
        }
      } catch {}
      return { success: false, error: profileErr.message };
    }

    // 2. Atualizar perfis por compatibilidade
    try {
      const { error: perfisErr } = await supabase
        .from("perfis")
        .update({ is_training_now: true })
        .eq("id", effectiveUserId);
      if (perfisErr) {
        console.warn("[startTraining perfis warn]:", perfisErr.message);
      }
    } catch {}

    // 3. Atualizar servidor express local (proxy / fallback)
    try {
      await fetch("/api/checkin/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: effectiveUserId, userName }),
      });
    } catch {}

    // Salvar estado local
    localStorage.setItem(`vyra_training_now_${effectiveUserId}`, "true");
    localStorage.setItem("vyra_training_now", "true");
    localStorage.setItem(`vyra_training_started_at_${effectiveUserId}`, String(Date.now()));

    return { success: true };
  } catch (err: any) {
    console.error("[ERRO SUPABASE]:", err);
    const msg = `Falha ao salvar no banco: ${err.message || err}`;
    try {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(msg);
      }
    } catch {}
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * 2. Finalizar Treino:
 * - UPDATE na tabela profiles: is_training_now: false, last_checkin_at: new Date()
 * - INSERT na tabela checkins: { user_id: user.id, user_name: user.nome, tipo: 'treino' }
 * - INSERT na tabela notificacoes_coach: { aluno_id: user.id, aluno_nome: user.nome, tipo: 'treino_finalizado', mensagem: 'Finalizou o treino de hoje!' }
 */
export async function finishTraining(
  userId: string,
  userName: string
): Promise<{ success: boolean; streak: number; error?: string }> {
  const effectiveUserId = userId || getVotingUserId();
  const effectiveUserName = (userName || "Aluno Vyra").trim();
  const nowIso = new Date().toISOString();

  let finalStreak = 1;

  try {
    // 1. UPDATE em profiles: is_training_now = false, last_checkin_at = now
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        is_training_now: false,
        last_checkin_at: nowIso,
      })
      .eq("id", effectiveUserId);

    if (profErr) {
      console.error("[ERRO SUPABASE]:", profErr);
      const msg = `Falha ao salvar no banco: ${profErr.message} - ${profErr.details || ""}`;
      try {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert(msg);
        }
      } catch {}
      return { success: false, streak: 0, error: profErr.message };
    }

    // 2. UPDATE em perfis por compatibilidade
    try {
      await supabase
        .from("perfis")
        .update({
          is_training_now: false,
          last_checkin_at: nowIso,
        })
        .eq("id", effectiveUserId);
    } catch {}

    // 3. INSERT na tabela checkins
    const checkinPayload = {
      user_id: effectiveUserId,
      user_name: effectiveUserName,
      tipo: "treino",
      created_at: nowIso,
    };

    const { error: checkinErr } = await supabase
      .from("checkins")
      .insert(checkinPayload);

    if (checkinErr) {
      console.error("[ERRO SUPABASE]:", checkinErr);
      const msg = `Falha ao salvar no banco: ${checkinErr.message} - ${checkinErr.details || ""}`;
      try {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert(msg);
        }
      } catch {}
      return { success: false, streak: 0, error: checkinErr.message };
    }

    // Salva cópia local
    const localCheckinItem: CheckinItem = {
      id: "chk-" + Date.now(),
      user_id: effectiveUserId,
      user_name: effectiveUserName,
      tipo: "treino",
      created_at: nowIso,
    };
    saveLocalCheckin(effectiveUserId, localCheckinItem);

    // 4. INSERT na tabela notificacoes_coach
    const notifPayload = {
      aluno_id: effectiveUserId,
      aluno_nome: effectiveUserName,
      tipo: "treino_finalizado",
      mensagem: "Finalizou o treino de hoje!",
      lida: false,
      created_at: nowIso,
    };

    const { error: notifErr } = await supabase
      .from("notificacoes_coach")
      .insert(notifPayload);

    if (notifErr) {
      console.error("[ERRO SUPABASE]:", notifErr);
      const msg = `Falha ao salvar no banco: ${notifErr.message} - ${notifErr.details || ""}`;
      try {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert(msg);
        }
      } catch {}
      return { success: false, streak: 0, error: notifErr.message };
    }

    // 5. Atualizar servidor backend / proxy local
    try {
      await fetch("/api/checkin/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,
          userName: effectiveUserName,
          last_checkin_at: nowIso,
        }),
      });
    } catch {}

    // 6. Atualizar estado local
    localStorage.setItem(`vyra_training_now_${effectiveUserId}`, "false");
    localStorage.setItem("vyra_training_now", "false");
    localStorage.setItem(`vyra_last_checkin_at_${effectiveUserId}`, nowIso);
    localStorage.removeItem(`vyra_training_started_at_${effectiveUserId}`);

    // 7. Recalcular e retornar o streak a partir dos dados gravados no banco
    const streakResult = await getUserStreak(effectiveUserId);
    finalStreak = streakResult.streak;

    return { success: true, streak: finalStreak };
  } catch (err: any) {
    console.error("[ERRO SUPABASE]:", err);
    const msg = `Falha ao salvar no banco: ${err.message || err}`;
    try {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(msg);
      }
    } catch {}
    return { success: false, streak: 0, error: err.message || String(err) };
  }
}

/**
 * Consulta o status atual de treino e último check-in do aluno
 */
export async function getUserTrainingStatus(
  userId: string
): Promise<{ isTrainingNow: boolean; lastCheckinAt: string | null }> {
  const effectiveUserId = userId || getVotingUserId();

  // Verifica cache local imediato
  const localIsTraining = localStorage.getItem(`vyra_training_now_${effectiveUserId}`) === "true";
  const localLastCheckin = localStorage.getItem(`vyra_last_checkin_at_${effectiveUserId}`) || null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_training_now, last_checkin_at")
      .eq("id", effectiveUserId)
      .maybeSingle();

    if (profile) {
      const isTraining = Boolean(profile.is_training_now);
      const lastCheck = profile.last_checkin_at || localLastCheckin;
      localStorage.setItem(`vyra_training_now_${effectiveUserId}`, String(isTraining));
      if (lastCheck) {
        localStorage.setItem(`vyra_last_checkin_at_${effectiveUserId}`, lastCheck);
      }
      return {
        isTrainingNow: isTraining,
        lastCheckinAt: lastCheck,
      };
    }
  } catch (e) {
    console.warn("[getUserTrainingStatus] error:", e);
  }

  return {
    isTrainingNow: localIsTraining,
    lastCheckinAt: localLastCheckin,
  };
}

/**
 * Consulta a lista de check-ins e calcula a sequência (streak) do aluno
 */
export async function getUserStreak(
  userId: string
): Promise<{ streak: number; totalCheckins: number; checkinsList: CheckinItem[] }> {
  const effectiveUserId = userId || getVotingUserId();

  try {
    const { data: dbCheckins, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: false });

    if (!error && dbCheckins && dbCheckins.length > 0) {
      const dates = dbCheckins.map((c) => c.created_at);
      const streak = calculateStreakFromDates(dates);
      return {
        streak,
        totalCheckins: dbCheckins.length,
        checkinsList: dbCheckins,
      };
    }
  } catch (e) {
    console.warn("[getUserStreak] Supabase query warning:", e);
  }

  // Fallback para histórico local
  const localList = getLocalCheckins(effectiveUserId);
  const dates = localList.map((c) => c.created_at);
  const streak = calculateStreakFromDates(dates);

  return {
    streak,
    totalCheckins: localList.length,
    checkinsList: localList,
  };
}

/**
 * 2.1 AO VIVO (Área do Coach):
 * Busca alunos em profiles (ou perfis) onde is_training_now = true
 */
export async function getLiveTrainingStudents(): Promise<LiveStudent[]> {
  try {
    // 1. Tenta buscar em profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, full_name, nickname, email, avatar_url, phone, telefone, is_training_now, last_checkin_at, protocolo_atual, role, cargo")
      .eq("is_training_now", true);

    if (!error && profiles && profiles.length > 0) {
      return profiles
        .filter((p) => (p.role !== "coach" && p.role !== "admin" && p.cargo !== "coach" && p.cargo !== "admin"))
        .map((p) => ({
          id: p.id,
          name: p.full_name || p.name || (p.email ? p.email.split("@")[0] : "Aluno"),
          nickname: p.nickname || (p.full_name || p.name || "").split(" ")[0],
          email: p.email,
          avatar_url: p.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          plan: p.protocolo_atual || "Vyra Shape",
          phone: p.phone || p.telefone || "",
          is_training_now: true,
          last_checkin_at: p.last_checkin_at,
        }));
    }

    // 2. Se vazio, tenta em perfis
    const { data: perfis, error: perfisErr } = await supabase
      .from("perfis")
      .select("id, nome, email, avatar_url, telefone, is_training_now, last_checkin_at, protocolo_atual, cargo")
      .eq("is_training_now", true);

    if (!perfisErr && perfis && perfis.length > 0) {
      return perfis
        .filter((p) => p.cargo !== "coach" && p.cargo !== "admin")
        .map((p) => ({
          id: p.id,
          name: p.nome || (p.email ? p.email.split("@")[0] : "Aluno"),
          nickname: (p.nome ? p.nome.split(" ")[0] : "") || "Aluno",
          email: p.email,
          avatar_url: p.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          plan: p.protocolo_atual || "Vyra Shape",
          phone: p.telefone || "",
          is_training_now: true,
          last_checkin_at: p.last_checkin_at,
        }));
    }

    // 3. Fallback servidor local
    try {
      const res = await fetch("/api/radar/live");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {}
  } catch (err) {
    console.warn("[getLiveTrainingStudents] error:", err);
  }

  return [];
}

/**
 * 2.2 ALERTAS DE INATIVIDADE (Área do Coach):
 * Busca alunos em profiles cujo last_checkin_at seja menor que a data de 3 dias atrás ou nulo
 */
export async function getAbsentStudents(daysThreshold = 3): Promise<AbsentStudent[]> {
  const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);
  const thresholdIso = thresholdDate.toISOString();

  try {
    // 1. Busca todos os alunos em profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, full_name, email, phone, telefone, avatar_url, protocolo_atual, role, cargo, last_checkin_at, created_at");

    if (!error && profiles && profiles.length > 0) {
      const studentProfiles = profiles.filter(
        (p) => p.role !== "coach" && p.role !== "admin" && p.cargo !== "coach" && p.cargo !== "admin"
      );

      const absentList: AbsentStudent[] = [];

      for (const p of studentProfiles) {
        const lastCheck = p.last_checkin_at;
        const createdAt = p.created_at;

        let isAbsent = false;
        let daysAbsent = daysThreshold;

        if (!lastCheck) {
          // Nunca fez check-in
          isAbsent = true;
          if (createdAt) {
            const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 3600 * 1000));
            daysAbsent = Math.max(daysThreshold, daysSinceCreated);
          } else {
            daysAbsent = 4;
          }
        } else {
          const checkDate = new Date(lastCheck);
          if (checkDate < thresholdDate) {
            isAbsent = true;
            daysAbsent = Math.floor((Date.now() - checkDate.getTime()) / (24 * 3600 * 1000));
          }
        }

        if (isAbsent) {
          absentList.push({
            id: p.id,
            name: p.full_name || p.name || (p.email ? p.email.split("@")[0] : "Aluno"),
            email: p.email,
            phone: p.phone || p.telefone || "",
            avatar_url: p.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            plan: p.protocolo_atual || "Vyra Shape",
            last_checkin_at: lastCheck,
            daysAbsent: Math.max(daysThreshold, daysAbsent),
          });
        }
      }

      if (absentList.length > 0) {
        return absentList.sort((a, b) => b.daysAbsent - a.daysAbsent);
      }
    }
  } catch (err) {
    console.error("[ERRO SUPABASE]: Erro ao buscar alunos ausentes:", err);
  }

  return [];
}

/**
 * 2.3 FEED DE NOTIFICAÇÕES (Área do Coach):
 * Busca notificações da tabela notificacoes_coach ordenadas por data descrescente
 */
export async function getCoachNotifications(): Promise<CoachNotification[]> {
  try {
    const { data: notifs, error } = await supabase
      .from("notificacoes_coach")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[ERRO SUPABASE]: Erro ao buscar notificacoes_coach:", error);
      return [];
    }

    if (notifs) {
      return notifs;
    }
  } catch (err) {
    console.error("[ERRO SUPABASE]:", err);
  }

  return [];
}

/**
 * Marcar notificação como lida
 */
export async function markCoachNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notificacoes_coach")
      .update({ lida: true })
      .eq("id", notificationId);

    if (!error) return true;
  } catch {}

  try {
    await fetch(`/api/radar/notifications/${notificationId}/read`, { method: "POST" });
  } catch {}

  return true;
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllCoachNotificationsAsRead(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notificacoes_coach")
      .update({ lida: true })
      .eq("lida", false);

    if (!error) return true;
  } catch {}

  try {
    await fetch("/api/radar/notifications/read-all", { method: "POST" });
  } catch {}

  return true;
}
