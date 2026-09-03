import {
  Plan,
  Workout,
  Diet,
  ProgressEntry,
  Challenge,
  ChallengeEvent,
  HallEntry,
  ChatMessage,
  KPI,
  RadarAlert,
  Coupon,
  Partner,
  Coach,
  Broadcast,
  UserProfile,
  Anamnesis,
  Student,
  ChallengePhoto,
} from "../types";

const BASE_URL = "/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  getPlans: () => request<Plan[]>("/plans"),
  getTodayWorkout: () => request<Workout>("/workout/today"),
  updateWorkout: (data: Partial<Workout>) =>
    request<Workout>("/workout/today", { method: "PUT", body: JSON.stringify(data) }),
  getDiet: () => request<Diet>("/diet"),
  updateDiet: (data: Partial<Diet>) =>
    request<Diet>("/diet", { method: "PUT", body: JSON.stringify(data) }),
  getProgress: () => request<ProgressEntry[]>("/progress"),
  addProgress: (data: Partial<ProgressEntry>) =>
    request<ProgressEntry>("/progress", { method: "POST", body: JSON.stringify(data) }),
  getChallenges: (tag?: string) =>
    request<Challenge[]>(`/challenges${tag ? `?tag=${tag}` : ""}`),
  createChallenge: (data: Partial<Challenge>) =>
    request<Challenge>("/challenges", { method: "POST", body: JSON.stringify(data) }),
  deleteChallenge: (id: string) =>
    request<{ ok: boolean; message: string }>(`/challenges/${id}`, { method: "DELETE" }),
  likeChallenge: (id: string) =>
    request<Challenge>(`/challenges/${id}/like`, { method: "POST" }),
  voteChallenge: (id: string) =>
    request<{ ok: boolean; message: string; votes: number; has_voted: boolean; item: Challenge }>(
      `/challenges/${id}/vote`,
      { method: "POST" }
    ),
  getChallengeEvent: () => request<ChallengeEvent>("/challenge-event"),
  updateChallengeEvent: (data: Partial<ChallengeEvent>) =>
    request<ChallengeEvent>("/challenge-event", { method: "PUT", body: JSON.stringify(data) }),
  toggleChallengeEvent: (is_active?: boolean) =>
    request<ChallengeEvent>("/challenge-event/toggle", {
      method: "POST",
      body: JSON.stringify({ is_active }),
    }),
  closeAndCrownChallenge: () =>
    request<{ ok: boolean; event: ChallengeEvent; champion: any; ranking: Challenge[] }>(
      "/challenge-event/close-and-crown",
      { method: "POST" }
    ),
  closeChallenge: (id: string) =>
    request<{ ok: boolean; hall_entry: HallEntry }>(`/challenges/${id}/close`, {
      method: "POST",
    }),
  getHall: () => request<HallEntry[]>("/hall"),
  getChat: () => request<ChatMessage[]>("/chat"),
  postChat: (data: { author: string; persona: string; text: string; image?: string | null }) =>
    request<ChatMessage>("/chat", { method: "POST", body: JSON.stringify(data) }),
  likeChat: (id: string) => request<ChatMessage>(`/chat/${id}/like`, { method: "POST" }),
  getCoupons: () => request<Coupon[]>("/coupons"),
  createCoupon: (data: { code: string; pct: number }) =>
    request<Coupon>("/coupons", { method: "POST", body: JSON.stringify(data) }),
  toggleCoupon: (id: string) =>
    request<Coupon>(`/coupons/${id}/toggle`, { method: "POST" }),
  checkCoupon: (code: string, subtotal: number) =>
    request<{ valid: boolean; discount: number; total: number; percent: number }>("/coupon/check", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    }),
  getPartners: () => request<Partner[]>("/partners"),
  createPartner: (email: string) =>
    request<Partner>("/partners", { method: "POST", body: JSON.stringify({ email }) }),
  togglePartner: (id: string) =>
    request<Partner>(`/partners/${id}/toggle`, { method: "POST" }),
  getCoaches: () => request<Coach[]>("/coaches"),
  createCoach: (email: string) =>
    request<Coach>("/coaches", { method: "POST", body: JSON.stringify({ email }) }),
  toggleCoach: (id: string) =>
    request<Coach>(`/coaches/${id}/toggle`, { method: "POST" }),
  getKpis: () => request<KPI[]>("/kpis"),
  getRadar: () => request<RadarAlert[]>("/radar"),
  getProfile: () => request<UserProfile>("/profile"),
  updateProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>("/profile", { method: "PUT", body: JSON.stringify(data) }),
  saveAnamnesis: (data: Anamnesis) =>
    request<{ ok: boolean; profile: UserProfile }>("/anamnesis", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getBroadcasts: () => request<Broadcast[]>("/broadcasts"),
  addBroadcast: (data: { text: string; author: string }) =>
    request<Broadcast>("/broadcasts", { method: "POST", body: JSON.stringify(data) }),
  formChecker: (exercise: string, checklist: string[]) =>
    request<{
      score: number;
      verdict_pt: string;
      verdict_en: string;
      tips_pt: string[];
      tips_en: string[];
    }>("/ai/form-checker", {
      method: "POST",
      body: JSON.stringify({ exercise, checklist }),
    }),
  dietSuggest: (meal: string, current_food: string, lang: string) =>
    request<{
      suggestions: Array<{ name: string; grams: number; kcal: number; p: number; c: number; f: number }>;
    }>("/ai/diet-suggest", {
      method: "POST",
      body: JSON.stringify({ meal, current_food, lang }),
    }),
  plateAnalyze: (lang: string, image_base64?: string) =>
    request<{ name: string; kcal: number; p: number; c: number; f: number; grams: number }>(
      "/ai/plate-analyze",
      {
        method: "POST",
        body: JSON.stringify({ lang, image_base64 }),
      }
    ),
  dietAssistant: (objetivo: string, calorias_alvo: number, restricoes?: string | string[]) =>
    request<
      Array<{
        nome_receita: string;
        calorias: number;
        proteinas: number;
        carboidratos: number;
        gorduras: number;
        ingredientes: string[];
      }>
    >("/ai/diet-assistant", {
      method: "POST",
      body: JSON.stringify({ objetivo, calorias_alvo, restricoes }),
    }),
  getStudents: (search?: string) =>
    request<Student[]>(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  updateStudentDiet: (id: string, data: Partial<Diet>) =>
    request<Diet>(`/students/${id}/diet`, { method: "PUT", body: JSON.stringify(data) }),
  updateStudentWorkout: (id: string, data: Partial<Workout>) =>
    request<Workout>(`/students/${id}/workout`, { method: "PUT", body: JSON.stringify(data) }),
  coachGenerateWorkout: (params: {
    student_name?: string;
    goal?: string;
    split?: string;
    level?: string;
    duration_min?: number;
    focus_notes?: string;
    lang?: string;
  }) =>
    request<Workout>("/ai/coach-generate-workout", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  coachGenerateDiet: (params: {
    student_name?: string;
    goal?: string;
    weight_kg?: number;
    height_cm?: number;
    restrictions?: string;
    target_kcal?: number;
    lang?: string;
  }) =>
    request<Diet>("/ai/coach-generate-diet", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  bulkAssignWorkout: (student_ids: string[], workout: Workout) =>
    request<{ ok: boolean; count: number; message: string }>("/coach/assign-workout-bulk", {
      method: "POST",
      body: JSON.stringify({ student_ids, workout }),
    }),
  getWorkoutLibrary: () => request<Workout[]>("/coach/workout-library"),
  saveWorkoutLibrary: (workout: Workout) =>
    request<Workout>("/coach/workout-library", {
      method: "POST",
      body: JSON.stringify(workout),
    }),
  deleteWorkoutLibrary: (id: string) =>
    request<{ ok: boolean }>(`/coach/workout-library/${id}`, { method: "DELETE" }),
  getChallengePhotos: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append("category", params.category);
    if (params?.search) q.append("search", params.search);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request<ChallengePhoto[]>(`/challenge-photos${qs}`);
  },
  togglePhotoVote: (photoId: string, userId?: string) =>
    request<{
      ok: boolean;
      photoId: string;
      hasVoted: boolean;
      newVoteCount: number;
      action: "added" | "removed";
      photo: ChallengePhoto;
    }>(`/challenge-photos/${photoId}/toggle-vote`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),
  submitChallengePhoto: (data: {
    participant_name: string;
    caption?: string;
    photo_url: string;
    category?: string;
  }) =>
    request<ChallengePhoto>("/challenge-photos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
