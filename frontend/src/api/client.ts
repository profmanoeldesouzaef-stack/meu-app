const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
import { supabase } from "@/src/lib/supabase"; // A IMPORTAÇÃO NOVA FICA AQUI NO TOPO

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const api = {
  plans: () => req<any[]>("/plans"),
  
  // A ROTA DO TREINO FOI SUBSTITUÍDA AQUI:
  todayWorkout: async () => {
    const { data: workout, error: wError } = await supabase
      .from('workouts')
      .select('*')
      .eq('is_today', true)
      .single();

    if (wError) throw wError;

    const { data: exercises, error: eError } = await supabase
      .from('workout_exercises')
      .select(`
        id, sets, reps, rest, coach_tip,
        exercises ( name, muscle, video_url )
      `)
      .eq('workout_id', workout.id)
      .order('order_index', { ascending: true });

    if (eError) throw eError;

    return {
      title: workout.title,
      focus: workout.focus,
      duration_min: workout.duration_min,
      coach_note: workout.coach_note,
      exercises: exercises.map((e: any) => ({
        id: e.id,
        name: e.exercises.name,
        muscle: e.exercises.muscle,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        coach_tip: e.coach_tip,
        video_url: e.exercises.video_url
      }))
    };
  },
  
  // O restante do arquivo continua igual:
  updateWorkout: (body: any) => req<any>("/workout/today", { method: "PUT", body: JSON.stringify(body) }),
  diet: () => req<any>("/diet"),
  updateDiet: (body: any) => req<any>("/diet", { method: "PUT", body: JSON.stringify(body) }),
  progress: () => req<any[]>("/progress"),
  addProgress: (body: any) => req<any>("/progress", { method: "POST", body: JSON.stringify(body) }),
  challenges: (tag?: string) => req<any[]>(`/challenges${tag && tag !== "all" ? `?tag=${tag}` : ""}`),
  createChallenge: (body: any) => req<any>("/challenges", { method: "POST", body: JSON.stringify(body) }),
  likeChallenge: (id: string) => req<any>(`/challenges/${id}/like`, { method: "POST" }),
  closeChallenge: (id: string) => req<any>(`/challenges/${id}/close`, { method: "POST" }),
  hall: () => req<any[]>("/hall"),
  chat: () => req<any[]>("/chat"),
  postChat: (body: any) => req<any>("/chat", { method: "POST", body: JSON.stringify(body) }),
  likeChat: (id: string) => req<any>(`/chat/${id}/like`, { method: "POST" }),
  coupons: () => req<any[]>("/coupons"),
  createCoupon: (body: any) => req<any>("/coupons", { method: "POST", body: JSON.stringify(body) }),
  toggleCoupon: (id: string) => req<any>(`/coupons/${id}/toggle`, { method: "POST" }),
  coupon: (code: string, subtotal: number) =>
    req<any>("/coupon/check", { method: "POST", body: JSON.stringify({ code, subtotal }) }),
  partners: () => req<any[]>("/partners"),
  createPartner: (email: string) => req<any>("/partners", { method: "POST", body: JSON.stringify({ email }) }),
  togglePartner: (id: string) => req<any>(`/partners/${id}/toggle`, { method: "POST" }),
  coaches: () => req<any[]>("/coaches"),
  createCoach: (email: string) => req<any>("/coaches", { method: "POST", body: JSON.stringify({ email }) }),
  toggleCoach: (id: string) => req<any>(`/coaches/${id}/toggle`, { method: "POST" }),
  kpis: () => req<any[]>("/kpis"),
  radar: () => req<any[]>("/radar"),
  profile: () => req<any>("/profile"),
  updateProfile: (body: any) => req<any>("/profile", { method: "PUT", body: JSON.stringify(body) }),
  saveAnamnesis: (body: any) => req<any>("/anamnesis", { method: "POST", body: JSON.stringify(body) }),
  broadcasts: () => req<any[]>("/broadcasts"),
  addBroadcast: (text: string, author: string) => req<any>("/broadcasts", { method: "POST", body: JSON.stringify({ text, author }) }),
  aiFormChecker: (exercise: string, checklist: string[]) =>
    req<any>("/ai/form-checker", { method: "POST", body: JSON.stringify({ exercise, checklist }) }),
  aiDietSuggest: (meal: string, current_food: string, lang: string) =>
    req<any>("/ai/diet-suggest", { method: "POST", body: JSON.stringify({ meal, current_food, lang }) }),
  aiPlate: (image_base64: string, lang: string) =>
    req<any>("/ai/plate-analyze", { method: "POST", body: JSON.stringify({ image_base64, lang }) }),
};