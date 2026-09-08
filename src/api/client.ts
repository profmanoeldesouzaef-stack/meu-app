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
  ExerciseLog,
  ExerciseSetLog,
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

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let errMsg = `Request failed (${res.status} ${res.statusText})`;
    if (contentType.includes("application/json")) {
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        // ignore
      }
    }
    throw new Error(errMsg);
  }

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Endpoint ${endpoint} returned non-JSON response.`);
  }
}

export interface PlateFoodItem {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  per_100g: {
    kcal: number;
    p: number;
    c: number;
    f: number;
  };
}

export interface PlateAnalysisResult {
  name: string;
  assessment?: string;
  foods: PlateFoodItem[];
  total_grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export const api = {
  getPlans: () => request<Plan[]>("/plans"),
  getTodayWorkout: () => request<Workout>("/workout/today"),
  todayWorkout: () => request<Workout>("/workout/today"),
  getWorkoutSchedule: () => request<Record<number, Workout | null>>("/workout/schedule"),
  getWorkoutDay: (day: number | string) => request<Workout | null>(`/workout/day/${day}`),
  assignWorkoutDay: (data: { student_id?: string; student_ids?: string[]; days: number[]; workout: Partial<Workout> }) =>
    request<{ ok: boolean; schedule: Record<number, Workout | null>; message: string }>("/coach/assign-workout-day", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateWorkout: (data: Partial<Workout>) =>
    request<Workout>("/workout/today", { method: "PUT", body: JSON.stringify(data) }),
  getWorkoutLogs: (workoutId?: string, userEmail?: string, exerciseId?: string) => {
    const params = new URLSearchParams();
    if (workoutId) params.append("workout_id", workoutId);
    if (userEmail) params.append("user_email", userEmail);
    if (exerciseId) params.append("exercise_id", exerciseId);
    const qs = params.toString();
    return request<ExerciseLog[]>(`/workout/logs${qs ? `?${qs}` : ""}`);
  },
  saveExerciseLog: (data: {
    workout_id: string;
    exercise_id: string;
    exercise_name?: string;
    sets: Array<{ set_num?: number; setNum?: number; weight_kg?: number | string; weight?: string; reps: number | string; completed: boolean }>;
    notes?: string;
    user_email?: string;
  }) =>
    request<{ ok: boolean; entry: ExerciseLog }>("/workout/logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  saveBatchWorkoutLogs: (data: {
    workout_id: string;
    logs: Record<string, any[]>;
    user_email?: string;
  }) =>
    request<{ ok: boolean; saved_count: number }>("/workout/batch-logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getExerciseHistory: (exerciseId: string, userEmail?: string) => {
    const params = new URLSearchParams();
    if (userEmail) params.append("user_email", userEmail);
    const qs = params.toString();
    return request<{
      exercise_id: string;
      max_weight_kg: number;
      last_weight_kg: number | string;
      last_reps: number | string;
      last_date: string;
      history: ExerciseLog[];
    }>(`/workout/exercise-history/${exerciseId}${qs ? `?${qs}` : ""}`);
  },
  getDiet: () => request<Diet>("/diet"),
  toggleDietRelease: (released?: boolean) =>
    request<{ ok: boolean; diet_released: boolean }>("/diet/release", {
      method: "POST",
      body: JSON.stringify({ released }),
    }),
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
  hall: () => request<HallEntry[]>("/hall"),
  getChat: (userId?: string) => {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    return request<ChatMessage[]>(`/chat${qs}`);
  },
  postChat: (data: {
    author: string;
    persona: string;
    text: string;
    image?: string | null;
    is_veteran?: boolean;
    patente_level?: number;
    consecutive_months?: number;
    name_color?: string;
    text_color?: string;
  }) => request<ChatMessage>("/chat", { method: "POST", body: JSON.stringify(data) }),
  likeChat: (id: string, userId?: string) =>
    request<ChatMessage>(`/chat/${id}/like`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),
  getCoupons: () => request<Coupon[]>("/coupons"),
  createCoupon: (data: { code: string; pct: number }) =>
    request<Coupon>("/coupons", { method: "POST", body: JSON.stringify(data) }),
  toggleCoupon: (id: string) =>
    request<Coupon>(`/coupons/${id}/toggle`, { method: "POST" }),
  checkCoupon: (code: string, subtotal: number) =>
    request<{ valid: boolean; discount: number; total: number; percent: number; is_veteran?: boolean; message?: string }>("/coupon/check", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    }),
  redeemCoupon: (code: string) =>
    request<{ success: boolean; is_veteran?: boolean; message: string; profile?: UserProfile }>("/profile/redeem-coupon", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  getPartners: () => request<Partner[]>("/partners"),
  createPartner: (email: string, name?: string) =>
    request<Partner>("/partners", { method: "POST", body: JSON.stringify({ email, name }) }),
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
    request<PlateAnalysisResult>(
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
  recipesByIngredients: (params: {
    ingredientes: string[];
    tipo_refeicao?: string;
    calorias_alvo?: number;
    restricoes?: string[];
  }) =>
    request<
      Array<{
        nome_receita: string;
        tipo_refeicao: string;
        tempo_preparo: string;
        calorias: number;
        proteinas: number;
        carboidratos: number;
        gorduras: number;
        ingredientes: Array<{ name: string; quantity: string }>;
        modo_preparo: string[];
        dica_chef: string;
      }>
    >("/ai/recipes-by-ingredients", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  getStudents: (search?: string) =>
    request<Student[]>(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  updateStudentDiet: (id: string, data: Partial<Diet>) =>
    request<Diet>(`/students/${id}/diet`, { method: "PUT", body: JSON.stringify(data) }),
  updateStudentWorkout: (id: string, data: Partial<Workout>) =>
    request<Workout>(`/students/${id}/workout`, { method: "PUT", body: JSON.stringify(data) }),
  toggleStudentVipChat: (id: string, vip_chat_unlocked: boolean) =>
    request<Student>(`/students/${id}/vip-chat`, {
      method: "PUT",
      body: JSON.stringify({ vip_chat_unlocked }),
    }),
  updateStudentProtocol: (
    id: string,
    data: { water_ml?: number; creatine_dose_g?: number; vip_chat_unlocked?: boolean }
  ) =>
    request<Student>(`/students/${id}/protocol`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  coachGenerateWorkout: (params: {
    student_name?: string;
    goal?: string;
    split?: string;
    level?: string;
    duration_min?: number;
    focus_notes?: string;
    lang?: string;
    workout_date?: string;
    generation_mode?: "single_day" | "weekly_split" | "multi_week_periodization";
    period_weeks?: number;
  }) =>
    request<Workout>("/ai/coach-generate-workout", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  getCoachGuidelines: () => request<string[]>("/coach/guidelines"),
  updateCoachGuidelines: (guidelines: string[]) =>
    request<string[]>("/coach/guidelines", {
      method: "PUT",
      body: JSON.stringify({ guidelines }),
    }),
  coachAiChat: (message: string, active_guidelines?: string[]) =>
    request<{ reply: string; updated_guidelines?: string[] }>("/coach/ai-chat", {
      method: "POST",
      body: JSON.stringify({ message, active_guidelines }),
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
  togglePhotoVote: (photoId: string, userId?: string, participantName?: string) =>
    request<{
      ok: boolean;
      photoId: string;
      hasVoted: boolean;
      newVoteCount: number;
      action: "added" | "removed";
      photo: ChallengePhoto;
    }>(`/challenge-photos/${photoId}/toggle-vote`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, participant_name: participantName }),
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
  stripeCheckout: (payload: {
    email?: string;
    userId?: string;
    priceId: string;
    paymentMethod: "card" | "pix";
    planId?: string;
    cycle?: string;
    selected_protocol?: string;
    metadata?: Record<string, any>;
  }) =>
    request<{
      paymentIntent: string;
      ephemeralKey: string;
      customer: string;
      priceId: string;
      priceInfo: { id: string; name: string; amount: number; cycle: string; slug: string };
      amount: number;
      currency: string;
      paymentMethod: string;
      pixCode: string;
      pixQrCode?: string;
    }>("/stripe-checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  confirmPayment: (payload: {
    userId?: string;
    email?: string;
    priceId: string;
    planType?: string;
    planId?: string;
    cycle?: string;
    paymentMethod: string;
    selected_protocol?: string;
    metadata?: Record<string, any>;
  }) =>
    request<{
      success: boolean;
      supabaseSaved: boolean;
      status: string;
      subscription: any;
      message: string;
    }>("/subscription/confirm-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSubscription: (userId?: string, email?: string) => {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return request<{
      active: boolean;
      status: "active" | "inactive" | "trialing";
      planId?: string;
      paymentMethod?: string;
      currentPeriodEnd?: string;
      id?: string;
      source: string;
    }>(`/subscription${qs}`);
  },
  setSubscriptionStatus: (status: "active" | "inactive", userId?: string, planType?: string) =>
    request<{
      success: boolean;
      status: string;
      active: boolean;
      subscription: any;
    }>("/subscription/set-status", {
      method: "POST",
      body: JSON.stringify({ status, userId, planType }),
    }),
};
