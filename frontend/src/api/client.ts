const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  todayWorkout: () => req<any>("/workout/today"),
  diet: () => req<any>("/diet"),
  updateDiet: (body: any) => req<any>("/diet", { method: "PUT", body: JSON.stringify(body) }),
  progress: () => req<any[]>("/progress"),
  addProgress: (body: any) => req<any>("/progress", { method: "POST", body: JSON.stringify(body) }),
  challenges: (tag?: string) => req<any[]>(`/challenges${tag && tag !== "all" ? `?tag=${tag}` : ""}`),
  likeChallenge: (id: string) => req<any>(`/challenges/${id}/like`, { method: "POST" }),
  chat: () => req<any[]>("/chat"),
  postChat: (body: any) => req<any>("/chat", { method: "POST", body: JSON.stringify(body) }),
  coupon: (code: string, subtotal: number) =>
    req<any>("/coupon/check", { method: "POST", body: JSON.stringify({ code, subtotal }) }),
  kpis: () => req<any[]>("/kpis"),
  radar: () => req<any[]>("/radar"),
  formChecker: () => req<any>("/form-checker/mock"),
};
