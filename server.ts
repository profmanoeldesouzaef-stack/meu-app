import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { getDietAssistantRecommendations } from "./lib/diet-assistant";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// Credenciais Oficiais do Supabase para persistência e sincronização em tempo real
const SUPABASE_PROJECT_URL = process.env.VITE_SUPABASE_URL || "https://qxcmqzzfsjvstlzveyrh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y21xenpmc2p2c3RsenZleXJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5MTQ1NiwiZXhwIjoyMTAzMTY3NDU2fQ.9n2Pc8d5X8FxrVbOAGB6R9yQePzvzghr9TtZ6J2EY1w";

let supabaseServerClient: SupabaseClient | null = null;
function getSupabaseServer(): SupabaseClient {
  if (!supabaseServerClient) {
    supabaseServerClient = createSupabaseClient(SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabaseServerClient;
}

// Lazy Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn("Failed to initialize Gemini SDK:", e);
    }
  }
  return aiClient;
}

// In-Memory Database Store seeded with VYRA content
const db = {
  plans: [
    {
      id: "shape",
      slug: "shape",
      name: "🍑 VYRA SHAPE",
      tag: "Hipertrofia Feminina",
      description: "Construa o físico que você deseja. Focado em hipertrofia feminina, definição impecável e simetria corporal avançada.",
      accent: "#EC4899",
      theme_color: "pink",
      prices_brl: {
        month: 179.9,
        quarter: 499.9,
        semester: 899.9,
        year: 1739.9,
      },
      prices_usd: {
        month: 34.9,
        quarter: 99.9,
        semester: 179.9,
        year: 349.9,
      },
      perks: [
        "Hipertrofia feminina",
        "Foco em definição e proporção",
        "Composição corporal",
      ],
    },
    {
      id: "force",
      slug: "force",
      name: "💪 VYRA FORCE",
      tag: "Hipertrofia & Força",
      description: "Mais força. Mais músculo. Mais evolução. O caminho definitivo para quem busca hipertrofia pura, densidade e progressão contínua.",
      accent: "#3B82F6",
      theme_color: "blue",
      prices_brl: {
        month: 179.9,
        quarter: 499.9,
        semester: 899.9,
        year: 1739.9,
      },
      prices_usd: {
        month: 34.9,
        quarter: 99.9,
        semester: 179.9,
        year: 349.9,
      },
      perks: [
        "Ganho de massa muscular",
        "Desenvolvimento de força",
        "Progressão de cargas",
      ],
    },
    {
      id: "reset12",
      slug: "reset12",
      name: "Reset 12",
      tag: "12 Semanas",
      description: "Um programa completo de 12 semanas, desenvolvido para quem quer seguir um processo estruturado de transformação física intensa.",
      accent: "#D8B46A",
      theme_color: "gold",
      prices_brl: {
        month: 479.9,
        quarter: 479.9,
        semester: 479.9,
        year: 479.9,
        single: 479.9,
      },
      prices_usd: {
        month: 95.0,
        quarter: 95.0,
        semester: 95.0,
        year: 95.0,
        single: 95.0,
      },
      perks: [
        "Pagamento Único (12 Semanas)",
        "Progresso dividido em fases",
        "Técnicas de intensificação",
        "Acompanhamento da evolução",
      ],
    },
  ],

  challenge_event: {
    id: "evt-desafio-oficial",
    title: "Desafio Transformação Vyra Shape & Force",
    subtitle: "Envie sua evolução (Antes & Depois). Votação aberta ao público com trava anti-fraude por IP.",
    rules: "1. Envie fotos de Antes e Depois com mesma iluminação e pose (frente e costas).\n2. Votação aberta ao público com controle estrito de 1 voto por IP por aluna participante.\n3. Ao atingir a data de encerramento, o sistema congela a votação e calcula a Campeã Oficial.",
    prize: "👑 Coroa de Campeã Oficial + Troféu Dourado Vyra + 1 Ano de Acompanhamento Grátis + Kit Completo de Suplementos",
    start_date: "2026-08-01",
    end_date: "2026-09-30T23:59:59.000Z",
    status: "active" as "active" | "loading" | "closed",
    is_active: true,
    champion: {
      id: "c2",
      name: "Camila Siqueira",
      title: "Shape · Verão 2026",
      votes: 428,
      photo: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
      date: "Set / 2026",
      weeks: 16,
    } as any,
  },

  ip_votes: {} as Record<string, string[]>,

  workout: {
    id: "wk-today",
    day_label: "Dia 3 · Push",
    title: "Peito, Ombro & Tríceps",
    focus: "Push · Força",
    duration_min: 58,
    intensity: "Alta",
    coach_note: "Foco no controle excêntrico. Se sentir dor na articulação, reduza carga 20% e me avise no chat.",
    hero_image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&auto=format&fit=crop&q=80",
    exercises: [
      {
        id: "e1",
        name: "Supino reto barra",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        muscle: "Peito",
        video_url: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
        coach_tip: "Mantenha escápulas retraídas durante toda a execução.",
      },
      {
        id: "e2",
        name: "Supino inclinado halter",
        sets: 3,
        reps: "10-12",
        rest: "75s",
        muscle: "Peito",
        video_url: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
        coach_tip: "Inclinação de 30-45°. Trajetória em arco.",
      },
      {
        id: "e3",
        name: "Desenvolvimento militar",
        sets: 4,
        reps: "8",
        rest: "90s",
        muscle: "Ombro",
        video_url: "https://www.youtube.com/watch?v=qEwKCR5JCog",
        coach_tip: "Core contraído, não arqueie a lombar.",
      },
      {
        id: "e4",
        name: "Elevação lateral",
        sets: 4,
        reps: "12",
        rest: "45s",
        muscle: "Ombro",
        video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
        coach_tip: "Cotovelos ligeiramente flexionados, sem impulso.",
      },
      {
        id: "e5",
        name: "Tríceps corda",
        sets: 3,
        reps: "12-15",
        rest: "45s",
        muscle: "Tríceps",
        video_url: "https://www.youtube.com/watch?v=vB5OHsJ3EME",
        coach_tip: "Cotovelos colados ao tronco, extensão completa.",
      },
      {
        id: "e6",
        name: "Tríceps francês",
        sets: 3,
        reps: "10",
        rest: "60s",
        muscle: "Tríceps",
        video_url: "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q",
        coach_tip: "Cotovelos apontando pro teto, sem abrir.",
      },
    ],
  },

  diet: {
    id: "diet-default",
    kcal: 2450,
    protein_pct: 35,
    carbs_pct: 40,
    fats_pct: 25,
    foods: [
      { id: "f1", name: "Omelete com aveia", grams: 250, kcal: 480, p: 35, c: 42, f: 18, meal: "breakfast" },
      { id: "f2", name: "Frango grelhado com arroz", grams: 350, kcal: 620, p: 55, c: 65, f: 12, meal: "lunch" },
      { id: "f3", name: "Whey isolado + banana", grams: 300, kcal: 320, p: 30, c: 40, f: 4, meal: "snack" },
      { id: "f4", name: "Salmão com batata doce", grams: 320, kcal: 580, p: 42, c: 48, f: 22, meal: "dinner" },
      { id: "f5", name: "Iogurte grego + castanhas", grams: 200, kcal: 340, p: 22, c: 18, f: 20, meal: "supper" },
    ],
  },

  progress: [
    { id: "p1", date: "2026-03-01", weight_kg: 84.2, waist_cm: 88, arms_cm: 38, note: "Início do ciclo" },
    { id: "p2", date: "2026-03-15", weight_kg: 83.4, waist_cm: 87, arms_cm: 38.5, note: "" },
    { id: "p3", date: "2026-04-01", weight_kg: 82.6, waist_cm: 86, arms_cm: 39, note: "Deficit ajustado" },
    { id: "p4", date: "2026-04-15", weight_kg: 81.8, waist_cm: 85, arms_cm: 39.2, note: "" },
    { id: "p5", date: "2026-05-01", weight_kg: 81.1, waist_cm: 84, arms_cm: 39.5, note: "Foco em push" },
  ],

  challenges: [
    {
      id: "c1",
      author: "Rafael M.",
      title: "12 semanas em Reset",
      weeks: 12,
      before_image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80",
      after_image: "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=600&q=80",
      likes: 214,
      tag: "reset12",
      status: "active",
      votes: 214,
      vote_url: "https://vote.vyra.club/c1",
    },
    {
      id: "c2",
      author: "Camila S.",
      title: "Shape · Verão 2026",
      weeks: 16,
      before_image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
      after_image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
      likes: 187,
      tag: "shape",
      status: "active",
      votes: 187,
      vote_url: "https://vote.vyra.club/c2",
    },
    {
      id: "c3",
      author: "Diego P.",
      title: "Forge Bulk",
      weeks: 20,
      before_image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
      after_image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
      likes: 302,
      tag: "forge",
      status: "active",
      votes: 302,
      vote_url: "https://vote.vyra.club/c3",
    },
  ],

  hall: [
    {
      id: "h1",
      champion: "Marina R.",
      title: "Reset · Q4 2025",
      date: "Dez / 2025",
      photo: "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=600&q=80",
      votes: 1420,
    },
    {
      id: "h2",
      champion: "Lucas O.",
      title: "Forge Summer",
      date: "Set / 2025",
      photo: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
      votes: 1180,
    },
    {
      id: "h3",
      champion: "Bianca N.",
      title: "Shape Winter",
      date: "Jun / 2025",
      photo: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
      votes: 980,
    },
  ],

  chat: [
    {
      id: "m1",
      author: "Mari — Coach",
      persona: "coach",
      text: "Bom dia, clube! Semana com foco em progressive overload 🔥",
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      likes: 12,
      image: null,
    },
    {
      id: "m2",
      author: "Rafael M.",
      persona: "student",
      text: "Fechei o supino com 92kg hoje, animal!",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      likes: 5,
      image: null,
    },
    {
      id: "m3",
      author: "Camila S.",
      persona: "student",
      text: "Alguém tem substituto pro salmão hoje?",
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      likes: 2,
      image: null,
    },
  ],

  kpis: [
    { label_pt: "Alunos ativos", label_en: "Active students", value: "248", delta: "+12" },
    { label_pt: "Adesão semanal", label_en: "Weekly adherence", value: "87%", delta: "+3%" },
    { label_pt: "Receita mensal", label_en: "Monthly revenue", value: "R$ 74.2k", delta: "+8%" },
    { label_pt: "Novos cadastros", label_en: "New signups", value: "36", delta: "+5" },
  ],

  radar: [
    { id: "r1", student: "João P.", status: "Inativo há 8 dias", days: 8, severity: "warn" },
    { id: "r2", student: "Fernanda L.", status: "Peso estagnado 3 semanas", days: 21, severity: "info" },
    { id: "r3", student: "Bruno T.", status: "Sem check-in há 14 dias", days: 14, severity: "crit" },
    { id: "r4", student: "Aline R.", status: "Dieta abaixo de 60% adesão", days: 7, severity: "warn" },
  ],

  coupons: [
    { id: "cp1", code: "VYRA10", pct: 10, active: true },
    { id: "cp2", code: "RESET25", pct: 25, active: true },
  ],

  partners: [
    { id: "pt1", email: "parceiro@empresa.com", active: true },
  ],

  coaches: [
    { id: "co1", email: "mari@vyra.club", active: true },
  ],

  broadcasts: [
    {
      id: "b1",
      text: "Hidratação hoje: 3 litros mínimo, especialmente treino de pernas!",
      date: new Date().toISOString().split("T")[0],
      author: "Mari — Coach",
    },
  ],

  challenge_photos: [
    {
      id: "photo-1",
      user_id: "u-camila",
      participant_name: "Camila Siqueira",
      caption: "Evolução de 16 semanas com o protocolo Vyra Shape. Foco em glúteos e definição abdominal!",
      photo_url: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80",
      category: "shape",
      votes_count: 428,
      created_at: "2026-08-15T10:00:00Z",
    },
    {
      id: "photo-2",
      user_id: "u-diego",
      participant_name: "Diego Pinheiro",
      caption: "Bulk limpo no Forge Protocol. Ganho de 5.4kg de massa magra mantendo o percentual de gordura.",
      photo_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
      category: "force",
      votes_count: 382,
      created_at: "2026-08-18T14:30:00Z",
    },
    {
      id: "photo-3",
      user_id: "u-larissa",
      participant_name: "Larissa Mendes",
      caption: "12 semanas do Projeto Reset 12! Recomposição física e disciplina na dieta.",
      photo_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
      category: "reset12",
      votes_count: 315,
      created_at: "2026-08-20T09:15:00Z",
    },
    {
      id: "photo-4",
      user_id: "u-mariana",
      participant_name: "Mariana Rocha",
      caption: "Transformação no Vyra Shape! -7cm de cintura e máxima simetria corporal.",
      photo_url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
      category: "shape",
      votes_count: 290,
      created_at: "2026-08-22T16:00:00Z",
    },
    {
      id: "photo-5",
      user_id: "u-rafael",
      participant_name: "Rafael Menezes",
      caption: "Densidade muscular nas costas e peito após 10 semanas de sobrecarga progressiva.",
      photo_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
      category: "force",
      votes_count: 244,
      created_at: "2026-08-25T11:45:00Z",
    },
    {
      id: "photo-6",
      user_id: "u-beatriz",
      participant_name: "Beatriz Cardoso",
      caption: "Reset 12 Semanas concluído! Foco total na consistência alimentar e treino diário.",
      photo_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
      category: "reset12",
      votes_count: 198,
      created_at: "2026-08-28T08:20:00Z",
    },
  ],

  photo_votes: [
    {
      id: "pv-init-1",
      photo_id: "photo-1",
      user_id: "me",
      created_at: "2026-08-29T10:00:00Z",
    },
  ] as Array<{ id: string; photo_id: string; user_id: string; created_at: string }>,

  profile: {
    id: "me",
    nickname: "Rafael",
    email: "rafael@vyra.club",
    avatar_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80",
    height_cm: 178,
    weight_kg: 81.1,
    waist_cm: 84,
    right_arm_cm: 39.5,
    left_arm_cm: 39.2,
    right_leg_cm: 58,
    left_leg_cm: 57.5,
    anamnesis: null as any,
    anamnesis_done: false,
    water_ml: 2500,
    creatine_g: 5.0,
    creatine_dose_g: 5.0,
    creatine_times: ["08:00", "20:00"],
    logged_in: false,
  },

  students: [
    {
      id: "std-1",
      name: "Rafael Mendes",
      nickname: "Rafa",
      email: "rafael@vyra.club",
      avatar_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80",
      plan: "Projeto Reset 12",
      goal: "Hipertrofia e Densidade Muscular",
      weight_kg: 81.1,
      height_cm: 178,
      waist_cm: 84,
      last_assessment: "2026-08-25",
      restrictions: "Leve intolerância a lactose",
      adherence_pct: 94,
      diet: {
        id: "diet-std-1",
        kcal: 2550,
        protein_pct: 35,
        carbs_pct: 45,
        fats_pct: 20,
        foods: [
          { id: "f1", name: "Omelete de claras com aveia e morangos", grams: 280, kcal: 490, p: 38, c: 45, f: 16, meal: "breakfast" },
          { id: "f2", name: "Frango grelhado com arroz jasmim e brócolis", grams: 380, kcal: 640, p: 58, c: 68, f: 12, meal: "lunch" },
          { id: "f3", name: "Whey isolado + banana + pasta de amendoim", grams: 320, kcal: 360, p: 32, c: 42, f: 8, meal: "snack" },
          { id: "f4", name: "Salmão grelhado com batata doce assada", grams: 340, kcal: 610, p: 44, c: 52, f: 20, meal: "dinner" },
          { id: "f5", name: "Iogurte zero lactose + castanhas do Pará", grams: 210, kcal: 350, p: 24, c: 18, f: 22, meal: "supper" },
        ],
      },
      workout: {
        id: "wk-std-1",
        day_label: "Dia 3 · Push",
        title: "Peito, Ombro & Tríceps",
        focus: "Push · Força & Densidade",
        duration_min: 58,
        intensity: "Alta",
        coach_note: "Foco no controle excêntrico de 3 segundos em cada repetição.",
        hero_image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&auto=format&fit=crop&q=80",
        exercises: [
          { id: "e1", name: "Supino reto barra", sets: 4, reps: "8-10", rest: "90s", muscle: "Peito", video_url: "https://www.youtube.com/watch?v=rT7DgCr-3pg", coach_tip: "Retração escapular firme." },
          { id: "e2", name: "Supino inclinado halter", sets: 3, reps: "10-12", rest: "75s", muscle: "Peito", video_url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", coach_tip: "Arco de 30° a 45°." },
          { id: "e3", name: "Desenvolvimento militar", sets: 4, reps: "8", rest: "90s", muscle: "Ombro", video_url: "https://www.youtube.com/watch?v=qEwKCR5JCog", coach_tip: "Core ativado." },
          { id: "e4", name: "Elevação lateral", sets: 4, reps: "12-15", rest: "45s", muscle: "Ombro", video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo", coach_tip: "Cotovelos alinhados." },
          { id: "e5", name: "Tríceps corda polia", sets: 3, reps: "12-15", rest: "45s", muscle: "Tríceps", video_url: "https://www.youtube.com/watch?v=vB5OHsJ3EME", coach_tip: "Abertura no final." },
        ],
      },
    },
    {
      id: "std-2",
      name: "Camila Santos",
      nickname: "Cami",
      email: "camila@vyra.club",
      avatar_url: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=200&q=80",
      plan: "Shape Protocol",
      goal: "Definição Muscular & Estética",
      weight_kg: 59.4,
      height_cm: 165,
      waist_cm: 66,
      last_assessment: "2026-08-20",
      restrictions: "Vegetariana (consome ovos e laticínios)",
      adherence_pct: 91,
      diet: {
        id: "diet-std-2",
        kcal: 1850,
        protein_pct: 35,
        carbs_pct: 45,
        fats_pct: 20,
        foods: [
          { id: "f1", name: "Omelete de 3 ovos com espinafre e ricota", grams: 240, kcal: 380, p: 28, c: 12, f: 18, meal: "breakfast" },
          { id: "f2", name: "Tofu grelhado com quinoa e mix de legumes", grams: 320, kcal: 480, p: 34, c: 54, f: 14, meal: "lunch" },
          { id: "f3", name: "Shake proteico vegetal com frutas vermelhas", grams: 280, kcal: 260, p: 26, c: 30, f: 4, meal: "snack" },
          { id: "f4", name: "Ovos pochê com batata doce assada e rúcula", grams: 300, kcal: 440, p: 28, c: 46, f: 14, meal: "dinner" },
          { id: "f5", name: "Cottage natural com sementes de abóbora", grams: 180, kcal: 290, p: 22, c: 14, f: 16, meal: "supper" },
        ],
      },
      workout: {
        id: "wk-std-2",
        day_label: "Dia 2 · Glúteos & Posterior",
        title: "Legs & Glúteos Foco",
        focus: "Hipertrofia Glútea & Coxas",
        duration_min: 50,
        intensity: "Alta",
        coach_note: "Priorize a amplitude máxima no búlgaro e elevação pélvica.",
        hero_image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format&fit=crop&q=80",
        exercises: [
          { id: "e1", name: "Elevação Pélvica com Barra", sets: 4, reps: "10-12", rest: "90s", muscle: "Glúteos", video_url: "https://www.youtube.com/watch?v=SEdqd1n01g4", coach_tip: "Pausa de 2s no topo da contração." },
          { id: "e2", name: "Agachamento Búlgaro", sets: 3, reps: "10 por perna", rest: "75s", muscle: "Quadríceps/Glúteos", video_url: "https://www.youtube.com/watch?v=2C-uNgKwPLE", coach_tip: "Tronco levemente inclinado à frente." },
          { id: "e3", name: "Stiff com Halteres", sets: 4, reps: "12", rest: "60s", muscle: "Posterior de Coxa", video_url: "https://www.youtube.com/watch?v=0hXvM8kRj3Y", coach_tip: "Lombar neutra, quadril para trás." },
          { id: "e4", name: "Cadeira Abdutora inclinada", sets: 4, reps: "15-20", rest: "45s", muscle: "Glúteo Médio", video_url: "https://www.youtube.com/watch?v=vV9Vb3h79fI", coach_tip: "Controle na volta." },
        ],
      },
    },
    {
      id: "std-3",
      name: "Diego Pereira",
      nickname: "Diego",
      email: "diego@vyra.club",
      avatar_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80",
      plan: "Forge Protocol",
      goal: "Ganho de Massa Bruta & Força",
      weight_kg: 89.2,
      height_cm: 183,
      waist_cm: 86,
      last_assessment: "2026-08-15",
      restrictions: "Sem restrições",
      adherence_pct: 88,
      diet: {
        id: "diet-std-3",
        kcal: 3100,
        protein_pct: 30,
        carbs_pct: 50,
        fats_pct: 20,
        foods: [
          { id: "f1", name: "4 ovos mexidos + 100g aveia + 2 bananas", grams: 380, kcal: 680, p: 42, c: 80, f: 20, meal: "breakfast" },
          { id: "f2", name: "Patinho moído com arroz branco e feijão", grams: 450, kcal: 820, p: 65, c: 92, f: 18, meal: "lunch" },
          { id: "f3", name: "Sanduíche de pão integral com frango desfiado", grams: 300, kcal: 450, p: 38, c: 48, f: 10, meal: "snack" },
          { id: "f4", name: "Filé de tilápia com macarrão integral ao sugo", grams: 420, kcal: 750, p: 56, c: 85, f: 16, meal: "dinner" },
          { id: "f5", name: "Caseína micellar + pasta de castanhas", grams: 220, kcal: 400, p: 34, c: 18, f: 20, meal: "supper" },
        ],
      },
      workout: {
        id: "wk-std-3",
        day_label: "Dia 1 · Pull & Força",
        title: "Costas, Trapézio & Bíceps",
        focus: "Heavy Pull & Progressive Overload",
        duration_min: 65,
        intensity: "Extrema",
        coach_note: "Cargas progressivas no levantamento terra e puxadas.",
        hero_image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1200&auto=format&fit=crop&q=80",
        exercises: [
          { id: "e1", name: "Levantamento Terra Barra", sets: 4, reps: "6", rest: "120s", muscle: "Costas/Cadeia Posterior", video_url: "https://www.youtube.com/watch?v=op9kVnSso6Q", coach_tip: "Puxe com os dorsais travados." },
          { id: "e2", name: "Puxada Alta Pronada", sets: 4, reps: "8-10", rest: "90s", muscle: "Dorsais", video_url: "https://www.youtube.com/watch?v=CAwf7n6Luuc", coach_tip: "Puxe direcionando os cotovelos aos bolsos." },
          { id: "e3", name: "Remada Curvada com Barra", sets: 4, reps: "8", rest: "90s", muscle: "Dorsais/Rombóides", video_url: "https://www.youtube.com/watch?v=FWJR5Ve8gkQ", coach_tip: "Tronco estável a 45°." },
          { id: "e4", name: "Rosca Direta Barra W", sets: 4, reps: "10-12", rest: "60s", muscle: "Bíceps", video_url: "https://www.youtube.com/watch?v=kwG2ipFRgfo", coach_tip: "Sem balançar o tronco." },
        ],
      },
    },
    {
      id: "std-4",
      name: "Fernanda Lima",
      nickname: "Nanda",
      email: "fernanda@vyra.club",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      plan: "Projeto Reset 12",
      goal: "Recomposição Corporal & Emagrecimento",
      weight_kg: 64.8,
      height_cm: 168,
      waist_cm: 74,
      last_assessment: "2026-08-10",
      restrictions: "Sem glúten",
      adherence_pct: 78,
      diet: {
        id: "diet-std-4",
        kcal: 1700,
        protein_pct: 40,
        carbs_pct: 35,
        fats_pct: 25,
        foods: [
          { id: "f1", name: "Crepioca funcional com frango desfiado", grams: 220, kcal: 360, p: 32, c: 28, f: 12, meal: "breakfast" },
          { id: "f2", name: "Patinho com abóbora cabotiá e salada verde", grams: 340, kcal: 460, p: 44, c: 38, f: 14, meal: "lunch" },
          { id: "f3", name: "Whey zero glúten + maçã picada com canela", grams: 260, kcal: 240, p: 26, c: 24, f: 3, meal: "snack" },
          { id: "f4", name: "Sobrecoxa desossada assada com legumes no vapor", grams: 320, kcal: 430, p: 40, c: 26, f: 16, meal: "dinner" },
          { id: "f5", name: "Mix de sementes e castanhas", grams: 40, kcal: 210, p: 8, c: 8, f: 18, meal: "supper" },
        ],
      },
      workout: {
        id: "wk-std-4",
        day_label: "Dia 1 · Full Body Funcional",
        title: "Condicionamento & Queima Calórica",
        focus: "Full Body Metcon",
        duration_min: 45,
        intensity: "Alta",
        coach_note: "Mantenha o ritmo cardiovascular constante entre as séries.",
        hero_image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&auto=format&fit=crop&q=80",
        exercises: [
          { id: "e1", name: "Agachamento Goblet com Kettlebell", sets: 4, reps: "12", rest: "60s", muscle: "Pernas/Core", video_url: "https://www.youtube.com/watch?v=MeIiIdhvXT4", coach_tip: "Postura ereta e peito aberto." },
          { id: "e2", name: "Remada Baixa Polia", sets: 4, reps: "12", rest: "60s", muscle: "Dorsais", video_url: "https://www.youtube.com/watch?v=GZbfZ033f74", coach_tip: "Aperte as costas atrás." },
          { id: "e3", name: "Flexão de Braços inclinada", sets: 3, reps: "10-12", rest: "45s", muscle: "Peito/Tríceps", video_url: "https://www.youtube.com/watch?v=4dF1DOWzf20", coach_tip: "Core totalmente travado." },
          { id: "e4", name: "Prancha Abdominal Dinâmica", sets: 3, reps: "45s", rest: "45s", muscle: "Core", video_url: "https://www.youtube.com/watch?v=pSHjTRCQxIw", coach_tip: "Respiração controlada." },
        ],
      },
    },
    {
      id: "std-5",
      name: "João Pedro Costa",
      nickname: "JP",
      email: "joao.pedro@vyra.club",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      plan: "Forge Protocol",
      goal: "Ganho de Massa Muscular e Força",
      weight_kg: 76.5,
      height_cm: 175,
      waist_cm: 80,
      last_assessment: "2026-08-01",
      restrictions: "Sem restrições",
      adherence_pct: 65,
      diet: {
        id: "diet-std-5",
        kcal: 2700,
        protein_pct: 35,
        carbs_pct: 45,
        fats_pct: 20,
        foods: [
          { id: "f1", name: "Panqueca de ovos e aveia com mel", grams: 260, kcal: 480, p: 32, c: 60, f: 12, meal: "breakfast" },
          { id: "f2", name: "Peito de frango com purê de batata e feijão", grams: 420, kcal: 720, p: 58, c: 82, f: 14, meal: "lunch" },
          { id: "f3", name: "Vitamina de whey, aveia e pasta de amendoim", grams: 350, kcal: 420, p: 35, c: 45, f: 10, meal: "snack" },
          { id: "f4", name: "Carne moída com mandioca cozida", grams: 380, kcal: 680, p: 50, c: 75, f: 16, meal: "dinner" },
          { id: "f5", name: "Iogurte natural com chia", grams: 200, kcal: 280, p: 18, c: 20, f: 12, meal: "supper" },
        ],
      },
      workout: {
        id: "wk-std-5",
        day_label: "Dia 2 · Peito & Tríceps",
        title: "Hipertrofia de Peitoral",
        focus: "Volume & Pump",
        duration_min: 55,
        intensity: "Média-Alta",
        coach_note: "Aumentar a consistência semanal de treinos.",
        hero_image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1200&auto=format&fit=crop&q=80",
        exercises: [
          { id: "e1", name: "Supino Inclinado com Halteres", sets: 4, reps: "10-12", rest: "90s", muscle: "Peito Superior", video_url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", coach_tip: "Desça até a linha do peito." },
          { id: "e2", name: "Crucifixo na Polia Média", sets: 4, reps: "12-15", rest: "60s", muscle: "Peito", video_url: "https://www.youtube.com/watch?v=taI4XduLpTk", coach_tip: "Abraça a árvore no pico." },
          { id: "e3", name: "Mergulho nas Paralelas", sets: 3, reps: "10", rest: "75s", muscle: "Tríceps/Peito", video_url: "https://www.youtube.com/watch?v=2z8JmcrW-As", coach_tip: "Incline o tronco levemente." },
        ],
      },
    },
    {
      id: "std-6",
      name: "Aline Rocha",
      nickname: "Aline",
      email: "aline@vyra.club",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      plan: "Shape Protocol",
      goal: "Tonificação e Emagrecimento",
      weight_kg: 56.2,
      height_cm: 162,
      waist_cm: 64,
      last_assessment: "2026-08-28",
      restrictions: "Vegetariana estrita",
      adherence_pct: 95,
      diet: {
        id: "diet-std-6",
        kcal: 1750,
        protein_pct: 30,
        carbs_pct: 50,
        fats_pct: 20,
        foods: [
          { id: "f1", name: "Pão artesanal com homus e sementes", grams: 200, kcal: 340, p: 18, c: 45, f: 10, meal: "breakfast" },
          { id: "f2", name: "Bowl de grão de bico, arroz negro e abacate", grams: 350, kcal: 510, p: 26, c: 68, f: 16, meal: "lunch" },
          { id: "f3", name: "Shake de proteína de ervilha com leite vegetal", grams: 280, kcal: 240, p: 28, c: 20, f: 4, meal: "snack" },
          { id: "f4", name: "Lentilha cozida com legumes grelhados e tahine", grams: 320, kcal: 450, p: 28, c: 55, f: 12, meal: "dinner" },
          { id: "f5", name: "Castanhas de caju e damascos", grams: 50, kcal: 210, p: 6, c: 18, f: 14, meal: "supper" },
        ],
      },
      workout: {
        id: "wk-std-6",
        day_label: "Dia 3 · Pernas & Abdômen",
        title: "Lower Body & Core",
        focus: "Tonificação e Definição",
        duration_min: 50,
        intensity: "Alta",
        coach_note: "Execução excelente nas últimas avaliações. Manter cadência!",
        hero_image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&auto=format&fit=crop&q=80",
        exercises: [
          { id: "e1", name: "Agachamento Livre", sets: 4, reps: "10", rest: "90s", muscle: "Quadríceps/Glúteos", video_url: "https://www.youtube.com/watch?v=ultWZbUMPL8", coach_tip: "Profundidade abaixo de 90°." },
          { id: "e2", name: "Leg Press 45°", sets: 4, reps: "12-15", rest: "75s", muscle: "Pernas completas", video_url: "https://www.youtube.com/watch?v=IZxyjW7MPJQ", coach_tip: "Pés na largura dos ombros." },
          { id: "e3", name: "Abdominal Infra no Banco", sets: 4, reps: "20", rest: "45s", muscle: "Abdômen", video_url: "https://www.youtube.com/watch?v=7hGZqV7QxG8", coach_tip: "Controle a descida." },
        ],
      },
    },
  ],

  workout_library: [
    {
      id: "lib-shape-1",
      day_label: "Vyra Shape · Glúteos & Posterior",
      title: "🍑 Shape Protocol: Glúteo Máximo & Isquiotibiais",
      focus: "Hipertrofia Glútea & Definição Feminina",
      duration_min: 52,
      intensity: "Alta",
      coach_note: "Priorize tensão mecânica e 2 segundos de isometria no pico de contração em todos os movimentos.",
      hero_image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format&fit=crop&q=80",
      is_template: true,
      exercises: [
        {
          id: "lib-e1",
          name: "Elevação Pélvica com Barra Livre",
          sets: 4,
          reps: "10-12",
          rest: "90s",
          muscle: "Glúteo Máximo",
          video_url: "https://www.youtube.com/watch?v=SEdqd1n01g4",
          coach_tip: "Mantenha queixo no peito e trave os glúteos no ponto mais alto.",
          coach_message: "Se a barra machucar o osso do quadril, use almofada de proteção.",
          substitute_exercise: "Elevação Pélvica na Máquina articulada",
        },
        {
          id: "lib-e2",
          name: "Agachamento Búlgaro com Halteres",
          sets: 3,
          reps: "10 cada lado",
          rest: "75s",
          muscle: "Glúteos / Quadríceps",
          video_url: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
          coach_tip: "Incline o tronco 15° à frente para recrutar mais glúteo.",
          coach_message: "Concentre o peso no calcanhar da perna da frente.",
          substitute_exercise: "Avanço andando com halteres ou Smith",
        },
        {
          id: "lib-e3",
          name: "Stiff com Halteres Pesados",
          sets: 4,
          reps: "12",
          rest: "60s",
          muscle: "Posterior de Coxa",
          video_url: "https://www.youtube.com/watch?v=0hXvM8kRj3Y",
          coach_tip: "Quadril para trás, coluna em extensão neutra total.",
          coach_message: "Não flexione os joelhos excessivamente.",
          substitute_exercise: "Mesa Flexora Unilateral",
        },
        {
          id: "lib-e4",
          name: "Cadeira Abdutora Tronco à Frente",
          sets: 4,
          reps: "15-20",
          rest: "45s",
          muscle: "Glúteo Médio",
          video_url: "https://www.youtube.com/watch?v=vV9Vb3h79fI",
          coach_tip: "Tronco inclinado à frente para pico de isolamento.",
          coach_message: "Cadência 2s abrindo e 2s fechando.",
          substitute_exercise: "Glúteo no Cabo polia média com caneleira",
        },
      ],
    },
    {
      id: "lib-force-1",
      day_label: "Vyra Force · Push Pesado",
      title: "💪 Force Protocol: Peito, Deltóides & Tríceps",
      focus: "Hipertrofia Pura & Progressão Contínua",
      duration_min: 60,
      intensity: "Extrema",
      coach_note: "Overload progressivo: registre a carga de cada série para subir peso no próximo treino.",
      hero_image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&auto=format&fit=crop&q=80",
      is_template: true,
      exercises: [
        {
          id: "lib-f1",
          name: "Supino Reto com Barra Olímpica",
          sets: 4,
          reps: "6-8",
          rest: "120s",
          muscle: "Peito Maior",
          video_url: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
          coach_tip: "Escápulas aduzidas e deprimidas. Pés cravados no chão.",
          coach_message: "Suba explosivo e desça controlando em 3 segundos.",
          substitute_exercise: "Supino Reto com Halteres pesados",
        },
        {
          id: "lib-f2",
          name: "Desenvolvimento Militar Barra",
          sets: 4,
          reps: "8-10",
          rest: "90s",
          muscle: "Deltoide Anterior",
          video_url: "https://www.youtube.com/watch?v=qEwKCR5JCog",
          coach_tip: "Glúteos e abdômen 100% contraídos para blindar lombar.",
          coach_message: "Não jogue a barra atrás da nuca.",
          substitute_exercise: "Desenvolvimento com Halteres no Banco 75°",
        },
        {
          id: "lib-f3",
          name: "Elevação Lateral na Polia Baixa",
          sets: 4,
          reps: "12-15",
          rest: "45s",
          muscle: "Deltoide Lateral",
          video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
          coach_tip: "Cabo passando por trás das pernas para tensão inicial.",
          coach_message: "Concentre na contração do ombro sem balanço do tronco.",
          substitute_exercise: "Elevação Lateral com Halteres",
        },
        {
          id: "lib-f4",
          name: "Tríceps Francês com Barra W",
          sets: 3,
          reps: "10-12",
          rest: "60s",
          muscle: "Tríceps Cabeça Longa",
          video_url: "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q",
          coach_tip: "Cotovelos fechados, alongue o tríceps na descida.",
          coach_message: "Carga moderada para preservar os cotovelos.",
          substitute_exercise: "Tríceps Testa com Halteres",
        },
      ],
    },
    {
      id: "lib-reset-1",
      day_label: "Reset 12 · Queima & Densidade",
      title: "⚡ Reset 12: Full Body Metabólico & Core",
      focus: "Transformação Física Acelerada & Déficit Eficiente",
      duration_min: 48,
      intensity: "Alta",
      coach_note: "Intervalos curtos e densidade de treino para máxima resposta metabólica.",
      hero_image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&auto=format&fit=crop&q=80",
      is_template: true,
      exercises: [
        {
          id: "lib-r1",
          name: "Agachamento Goblet com Halter Pesado",
          sets: 4,
          reps: "12-15",
          rest: "60s",
          muscle: "Quadríceps / Glúteos",
          video_url: "https://www.youtube.com/watch?v=MeIiIdhvXT4",
          coach_tip: "Mantenha o halter colado no esterno, agache fundo.",
          coach_message: "Ritmo contínuo sem descansar no topo.",
          substitute_exercise: "Leg Press 45° com pés paralelos",
        },
        {
          id: "lib-r2",
          name: "Remada Baixa Triângulo no Cabo",
          sets: 4,
          reps: "12",
          rest: "60s",
          muscle: "Dorsais / Rombóides",
          video_url: "https://www.youtube.com/watch?v=GZbfZ033f74",
          coach_tip: "Traga o puxador no umbigo, esmagando as costas.",
          coach_message: "Peito estufado e queixo erguido.",
          substitute_exercise: "Remada Unilateral com Halter (Serrote)",
        },
        {
          id: "lib-r3",
          name: "Flexão de Braços com Isometria 1s",
          sets: 3,
          reps: "10-15",
          rest: "45s",
          muscle: "Peitoral / Tríceps",
          video_url: "https://www.youtube.com/watch?v=4dF1DOWzf20",
          coach_tip: "Corpo como uma prancha rígida sem descer a pelve.",
          coach_message: "Se cansar, apoie os joelhos nas últimas repetições.",
          substitute_exercise: "Supino Reto com Halteres",
        },
      ],
    },
  ],
};

// ============ API Routes ============
const api = express.Router();

api.get("/", (req, res) => {
  res.json({ app: "Vyra Training & Performance", status: "ok" });
});

// Students
api.get("/students", (req, res) => {
  const search = ((req.query.search as string) || "").toLowerCase().trim();
  if (!search) return res.json(db.students);
  const filtered = db.students.filter(
    (s) =>
      s.name.toLowerCase().includes(search) ||
      s.nickname.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search) ||
      s.goal.toLowerCase().includes(search) ||
      s.plan.toLowerCase().includes(search)
  );
  res.json(filtered);
});

api.get("/students/:id", (req, res) => {
  const std = db.students.find((s) => s.id === req.params.id);
  if (!std) return res.status(404).json({ error: "Aluno não encontrado" });
  res.json(std);
});

api.put("/students/:id/diet", (req, res) => {
  const std = db.students.find((s) => s.id === req.params.id);
  if (!std) return res.status(404).json({ error: "Aluno não encontrado" });
  std.diet = { ...std.diet, ...req.body };
  if (std.id === "std-1" || std.email === db.profile.email) {
    db.diet = { ...db.diet, ...req.body };
  }
  res.json(std.diet);
});

api.put("/students/:id/workout", (req, res) => {
  const std = db.students.find((s) => s.id === req.params.id);
  if (!std) return res.status(404).json({ error: "Aluno não encontrado" });
  std.workout = { ...std.workout, ...req.body };
  if (std.id === "std-1" || std.email === db.profile.email) {
    db.workout = { ...db.workout, ...req.body };
  }
  res.json(std.workout);
});

api.post("/coach/assign-workout-bulk", (req, res) => {
  const { student_ids, workout } = req.body;
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ error: "Nenhum aluno selecionado" });
  }
  let count = 0;
  for (const id of student_ids) {
    const std = db.students.find((s) => s.id === id);
    if (std) {
      std.workout = { ...workout, id: `wk-${std.id}-${Date.now()}` };
      if (std.id === "std-1" || std.email === db.profile.email) {
        db.workout = { ...std.workout };
      }
      count++;
    }
  }
  db.broadcasts.unshift({
    id: `bcast-${Date.now()}`,
    title: "Novo Treino Prescrito pelo Coach",
    message: `Treino "${workout.title || "Prescrito"}" liberado na sua aba de Treino! Siga as orientações e cadência prescritas.`,
    date: new Date().toLocaleDateString("pt-BR"),
    target_plan: "all",
  });
  res.json({ ok: true, count, message: `Treino enviado com sucesso para ${count} aluno(s)!` });
});

api.get("/coach/workout-library", (req, res) => {
  res.json(db.workout_library || []);
});

api.post("/coach/workout-library", (req, res) => {
  if (!db.workout_library) db.workout_library = [];
  const item = {
    ...req.body,
    id: req.body.id || `lib-${Date.now()}`,
    is_template: true,
  };
  db.workout_library.unshift(item);
  res.json(item);
});

api.delete("/coach/workout-library/:id", (req, res) => {
  if (!db.workout_library) db.workout_library = [];
  db.workout_library = db.workout_library.filter((w: any) => w.id !== req.params.id);
  res.json({ ok: true });
});

// Plans
api.get("/plans", (req, res) => {
  res.json(db.plans);
});

// Workouts
api.get("/workout/today", (req, res) => {
  res.json(db.workout);
});

api.put("/workout/today", (req, res) => {
  db.workout = { ...db.workout, ...req.body };
  res.json(db.workout);
});

// Diet
api.get("/diet", (req, res) => {
  res.json(db.diet);
});

api.put("/diet", (req, res) => {
  db.diet = { ...db.diet, ...req.body };
  res.json(db.diet);
});

// Progress
api.get("/progress", (req, res) => {
  res.json(db.progress);
});

api.post("/progress", (req, res) => {
  const entry = {
    id: `p${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    ...req.body,
  };
  db.progress.push(entry);
  if (req.body.weight_kg) {
    db.profile.weight_kg = req.body.weight_kg;
  }
  if (req.body.waist_cm) {
    db.profile.waist_cm = req.body.waist_cm;
  }
  if (req.body.arms_cm) {
    db.profile.right_arm_cm = req.body.arms_cm;
  }
  res.json(entry);
});

// Challenges & Hall
function checkAndCrownChampion() {
  const evt = db.challenge_event;
  if (!evt) return;

  const now = new Date();
  const endDate = new Date(evt.end_date);
  const isPastDeadline = !isNaN(endDate.getTime()) && now >= endDate;

  if (isPastDeadline && evt.status === "active") {
    evt.status = "closed";
  }

  if (evt.status === "closed" && !evt.champion) {
    const activeSubmissions = [...db.challenges].filter((c) => c.status === "active");
    if (activeSubmissions.length > 0) {
      activeSubmissions.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const winner = activeSubmissions[0];
      const championData = {
        id: winner.id,
        name: winner.author,
        title: winner.title,
        votes: winner.votes || 0,
        photo: winner.after_image,
        date: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        weeks: winner.weeks,
      };
      evt.champion = championData;

      // Also add to Hall of Fame if not already present
      const alreadyInHall = db.hall.some((h) => h.champion === winner.author && h.title === winner.title);
      if (!alreadyInHall) {
        db.hall.unshift({
          id: `h${Date.now()}`,
          champion: winner.author,
          title: winner.title,
          date: championData.date,
          photo: winner.after_image,
          votes: winner.votes || 0,
        });
      }
    }
  }
}

api.get("/challenge-event", (req, res) => {
  checkAndCrownChampion();
  res.json(db.challenge_event);
});

api.put("/challenge-event", (req, res) => {
  const current = db.challenge_event;
  const updated = {
    ...current,
    ...req.body,
    // Preserve ID
    id: current.id,
  };

  // If status was changed to closed, crown champion
  if (req.body.status === "closed" && current.status !== "closed") {
    updated.status = "closed";
    const activeSubmissions = [...db.challenges].filter((c) => c.status === "active");
    if (activeSubmissions.length > 0) {
      activeSubmissions.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const winner = activeSubmissions[0];
      const championData = {
        id: winner.id,
        name: winner.author,
        title: winner.title,
        votes: winner.votes || 0,
        photo: winner.after_image,
        date: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        weeks: winner.weeks,
      };
      updated.champion = championData;

      const alreadyInHall = db.hall.some((h) => h.champion === winner.author);
      if (!alreadyInHall) {
        db.hall.unshift({
          id: `h${Date.now()}`,
          champion: winner.author,
          title: winner.title,
          date: championData.date,
          photo: winner.after_image,
          votes: winner.votes || 0,
        });
      }
    }
  }

  db.challenge_event = updated;
  res.json(db.challenge_event);
});

api.post("/challenge-event/close-and-crown", (req, res) => {
  db.challenge_event.status = "closed";
  const activeSubmissions = [...db.challenges].filter((c) => c.status === "active");
  activeSubmissions.sort((a, b) => (b.votes || 0) - (a.votes || 0));

  if (activeSubmissions.length === 0) {
    return res.status(400).json({ error: "Nenhum participante ativo encontrado para coroar." });
  }

  const winner = activeSubmissions[0];
  const championData = {
    id: winner.id,
    name: winner.author,
    title: winner.title,
    votes: winner.votes || 0,
    photo: winner.after_image,
    date: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
    weeks: winner.weeks,
  };
  db.challenge_event.champion = championData;

  const alreadyInHall = db.hall.some((h) => h.champion === winner.author);
  if (!alreadyInHall) {
    db.hall.unshift({
      id: `h${Date.now()}`,
      champion: winner.author,
      title: winner.title,
      date: championData.date,
      photo: winner.after_image,
      votes: winner.votes || 0,
    });
  }

  res.json({
    ok: true,
    event: db.challenge_event,
    champion: championData,
    ranking: activeSubmissions,
  });
});

api.get("/challenges", (req, res) => {
  checkAndCrownChampion();
  const clientIp = (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1"
  );

  const tag = req.query.tag as string;
  let items = db.challenges.filter((c) => c.status === "active");
  if (tag && tag !== "all" && tag !== "Todos") {
    items = items.filter(
      (c) =>
        c.tag?.toLowerCase() === tag.toLowerCase() ||
        (tag.toLowerCase().includes("reset") && c.tag?.toLowerCase().includes("reset")) ||
        (tag.toLowerCase().includes("shape") && c.tag?.toLowerCase().includes("shape")) ||
        (tag.toLowerCase().includes("force") && (c.tag?.toLowerCase().includes("force") || c.tag?.toLowerCase().includes("forge")))
    );
  }

  // Inject has_voted based on client IP
  const enriched = items.map((item) => {
    const votesForThis = db.ip_votes[item.id] || [];
    return {
      ...item,
      has_voted: votesForThis.includes(clientIp),
    };
  });

  // Sort by votes descending
  enriched.sort((a, b) => (b.votes || 0) - (a.votes || 0));

  res.json(enriched);
});

api.post("/challenges", (req, res) => {
  const cid = `c${Date.now().toString(36)}`;
  const doc = {
    id: cid,
    title: req.body.title || "Minha Transformação",
    author: req.body.author || "Membro Vyra",
    tag: req.body.tag || "shape",
    weeks: Number(req.body.weeks) || 12,
    weight_lost_kg: Number(req.body.weight_lost_kg) || 0,
    waist_reduction_cm: Number(req.body.waist_reduction_cm) || 0,
    story: req.body.story || "",
    before_image: req.body.before_image || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    after_image: req.body.after_image || "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
    vote_url: `https://vyra.club/votar/${cid}`,
    likes: 0,
    votes: 0,
    status: "active" as "active" | "closed",
    created_at: new Date().toISOString(),
  };
  db.challenges.unshift(doc);
  res.json(doc);
});

api.post("/challenges/:cid/vote", (req, res) => {
  checkAndCrownChampion();

  // Check if challenge is frozen/closed
  if (db.challenge_event.status === "closed") {
    return res.status(400).json({
      error: "A votação deste desafio já foi encerrada e o ranking foi congelado pelo Coach!",
    });
  }

  const clientIp = (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1"
  );

  const item = db.challenges.find((c) => c.id === req.params.cid);
  if (!item) {
    return res.status(404).json({ error: "Participante não encontrada" });
  }

  if (!db.ip_votes[item.id]) {
    db.ip_votes[item.id] = [];
  }

  // Anti-fraud: only 1 vote per IP per participant
  if (db.ip_votes[item.id].includes(clientIp)) {
    return res.status(403).json({
      error: "Seu voto já foi registrado para esta participante através do seu endereço IP. Votação auditada com controle anti-fraude.",
      already_voted: true,
      votes: item.votes,
    });
  }

  // Register vote and IP
  db.ip_votes[item.id].push(clientIp);
  item.votes = (item.votes || 0) + 1;
  item.likes = (item.likes || 0) + 1;

  res.json({
    ok: true,
    message: "Voto computado com sucesso!",
    votes: item.votes,
    has_voted: true,
    item,
  });
});

api.post("/challenges/:cid/like", (req, res) => {
  const item = db.challenges.find((c) => c.id === req.params.cid);
  if (item) {
    item.likes += 1;
    item.votes += 1;
    return res.json(item);
  }
  res.status(404).json({ error: "not found" });
});

api.delete("/challenges/:cid", (req, res) => {
  const idx = db.challenges.findIndex((c) => c.id === req.params.cid);
  if (idx !== -1) {
    db.challenges.splice(idx, 1);
    return res.json({ ok: true, message: "Desafio removido com sucesso!" });
  }
  res.status(404).json({ error: "Desafio não encontrado" });
});

api.post("/challenge-event/toggle", (req, res) => {
  const { is_active } = req.body;
  if (typeof is_active === "boolean") {
    db.challenge_event.is_active = is_active;
  } else {
    db.challenge_event.is_active = !db.challenge_event.is_active;
  }
  res.json(db.challenge_event);
});

api.post("/challenges/:cid/close", (req, res) => {
  const doc = db.challenges.find((c) => c.id === req.params.cid);
  if (!doc) {
    return res.status(404).json({ error: "not found" });
  }
  const hallEntry = {
    id: `h${Date.now().toString(36)}`,
    champion: doc.author,
    title: doc.title,
    date: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
    photo: doc.after_image,
    votes: doc.votes || doc.likes,
  };
  db.hall.unshift(hallEntry);
  doc.status = "closed";
  res.json({ ok: true, hall_entry: hallEntry });
});

api.get("/hall", (req, res) => {
  const sorted = [...db.hall].sort((a, b) => b.votes - a.votes);
  res.json(sorted);
});

// ==========================================
// Challenge Photos Gallery & Toggle Voting API
// ==========================================
api.get("/challenge-photos", async (req, res) => {
  const userId =
    (req.headers["x-user-id"] as string) ||
    "b97113b7-65a4-4eda-aca3-1baff1f6c3b6";
  const category = (req.query.category as string) || "";
  const search = ((req.query.search as string) || "").toLowerCase().trim();

  // 1. Tenta recuperar do Supabase
  try {
    const supabase = getSupabaseServer();
    let query = supabase
      .from("challenge_photos")
      .select("id, participant_name, photo_url, votes_count, caption, created_at, status, category")
      .order("votes_count", { ascending: false });

    if (category && category !== "all" && category !== "Todas") {
      query = query.eq("category", category.toLowerCase());
    }

    const { data: supabasePhotos, error: fetchErr } = await query;
    if (!fetchErr && supabasePhotos && supabasePhotos.length > 0) {
      const photoIds = supabasePhotos.map((p) => p.id);
      const { data: userVotes } = await supabase
        .from("photo_votes")
        .select("photo_id")
        .eq("user_id", userId)
        .in("photo_id", photoIds);

      const votedSet = new Set(userVotes?.map((v) => v.photo_id) || []);
      let enriched = supabasePhotos.map((photo) => ({
        ...photo,
        votes_count: Number(photo.votes_count) || 0,
        has_voted: votedSet.has(photo.id),
      }));

      if (search) {
        enriched = enriched.filter(
          (p) =>
            p.participant_name.toLowerCase().includes(search) ||
            (p.caption && p.caption.toLowerCase().includes(search))
        );
      }

      enriched.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
      return res.json(enriched);
    }
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to in-memory:", err);
  }

  // 2. Fallback em memória
  let photos = [...(db.challenge_photos || [])];

  if (category && category !== "all" && category !== "Todas") {
    photos = photos.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    photos = photos.filter(
      (p) =>
        p.participant_name.toLowerCase().includes(search) ||
        (p.caption && p.caption.toLowerCase().includes(search))
    );
  }

  const userVotedPhotoIds = new Set(
    (db.photo_votes || [])
      .filter((v) => v.user_id === userId)
      .map((v) => v.photo_id)
  );

  const enriched = photos.map((photo) => ({
    ...photo,
    has_voted: userVotedPhotoIds.has(photo.id),
  }));

  enriched.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
  res.json(enriched);
});

api.post("/challenge-photos/:id/toggle-vote", async (req, res) => {
  const photoId = req.params.id;
  const userId =
    (req.body.user_id as string) ||
    (req.headers["x-user-id"] as string) ||
    "b97113b7-65a4-4eda-aca3-1baff1f6c3b6";

  // 1. Tenta atualizar diretamente no Supabase
  try {
    const supabase = getSupabaseServer();
    const { data: existingVote } = await supabase
      .from("photo_votes")
      .select("id")
      .eq("photo_id", photoId)
      .eq("user_id", userId)
      .maybeSingle();

    let hasVoted = false;
    let action: "added" | "removed" = "added";

    if (existingVote) {
      await supabase
        .from("photo_votes")
        .delete()
        .eq("photo_id", photoId)
        .eq("user_id", userId);
      hasVoted = false;
      action = "removed";
    } else {
      await supabase.from("photo_votes").insert([
        { photo_id: photoId, user_id: userId }
      ]);
      hasVoted = true;
      action = "added";
    }

    // Busca valor atualizado do trigger do Supabase
    const { data: photoRow } = await supabase
      .from("challenge_photos")
      .select("*")
      .eq("id", photoId)
      .maybeSingle();

    if (photoRow) {
      return res.json({
        ok: true,
        photoId,
        hasVoted,
        newVoteCount: Number(photoRow.votes_count) || 0,
        action,
        photo: {
          ...photoRow,
          has_voted: hasVoted,
        },
      });
    }
  } catch (err) {
    console.warn("Supabase toggle-vote failed, falling back to in-memory:", err);
  }

  // 2. Fallback em memória
  const photo = db.challenge_photos?.find((p) => p.id === photoId);
  if (!photo) {
    return res.status(404).json({ error: "Foto do desafio não encontrada" });
  }

  if (!db.photo_votes) {
    db.photo_votes = [];
  }

  const existingIndex = db.photo_votes.findIndex(
    (v) => v.photo_id === photoId && v.user_id === userId
  );

  let hasVoted = false;
  let action: "added" | "removed" = "added";

  if (existingIndex !== -1) {
    db.photo_votes.splice(existingIndex, 1);
    photo.votes_count = Math.max(0, (photo.votes_count || 0) - 1);
    hasVoted = false;
    action = "removed";
  } else {
    db.photo_votes.push({
      id: `pv-${Date.now()}`,
      photo_id: photoId,
      user_id: userId,
      created_at: new Date().toISOString(),
    });
    photo.votes_count = (photo.votes_count || 0) + 1;
    hasVoted = true;
    action = "added";
  }

  res.json({
    ok: true,
    photoId,
    hasVoted,
    newVoteCount: photo.votes_count,
    action,
    photo: {
      ...photo,
      has_voted: hasVoted,
    },
  });
});

api.post("/challenge-photos", (req, res) => {
  const { participant_name, caption, photo_url, category } = req.body;
  if (!participant_name || !photo_url) {
    return res.status(400).json({ error: "Nome do participante e URL da foto são obrigatórios." });
  }

  const newPhoto = {
    id: `photo-${Date.now()}`,
    user_id: db.profile.id || "me",
    participant_name: participant_name.trim(),
    caption: caption || "",
    photo_url,
    category: category || "shape",
    votes_count: 0,
    created_at: new Date().toISOString(),
    has_voted: false,
  };

  if (!db.challenge_photos) db.challenge_photos = [];
  db.challenge_photos.push(newPhoto);

  res.status(201).json(newPhoto);
});

// Chat
api.get("/chat", (req, res) => {
  res.json(db.chat);
});

api.post("/chat", (req, res) => {
  const { author, persona, text, image } = req.body;
  if (!text || text.length > 200) {
    return res.status(400).json({ error: "text invalid or too long (max 200 chars)" });
  }
  const msg = {
    id: `m${Date.now()}`,
    author: author || "Aluno",
    persona: persona || "student",
    text,
    image: image || null,
    likes: 0,
    timestamp: new Date().toISOString(),
  };
  db.chat.push(msg);
  res.json(msg);
});

api.post("/chat/:mid/like", (req, res) => {
  const msg = db.chat.find((m) => m.id === req.params.mid);
  if (msg) {
    msg.likes += 1;
    return res.json(msg);
  }
  res.status(404).json({ error: "not found" });
});

// Coupons
api.get("/coupons", (req, res) => {
  res.json(db.coupons);
});

api.post("/coupons", (req, res) => {
  const { code, pct } = req.body;
  const doc = {
    id: `cp${Date.now()}`,
    code: (code || "").toUpperCase(),
    pct: Number(pct) || 10,
    active: true,
  };
  db.coupons.push(doc);
  res.json(doc);
});

api.post("/coupons/:cid/toggle", (req, res) => {
  const doc = db.coupons.find((c) => c.id === req.params.cid);
  if (doc) {
    doc.active = !doc.active;
    return res.json(doc);
  }
  res.status(404).json({ error: "not found" });
});

api.post("/coupon/check", (req, res) => {
  const { code, subtotal } = req.body;
  const doc = db.coupons.find((c) => c.code === (code || "").toUpperCase() && c.active);
  if (!doc) {
    return res.json({ valid: false, discount: 0, total: subtotal, percent: 0 });
  }
  const discount = Math.round(((subtotal * doc.pct) / 100) * 100) / 100;
  return res.json({
    valid: true,
    discount,
    total: Math.max(0, Math.round((subtotal - discount) * 100) / 100),
    percent: doc.pct,
  });
});

// Partners
api.get("/partners", (req, res) => {
  res.json(db.partners);
});

api.post("/partners", (req, res) => {
  const doc = { id: `pt${Date.now()}`, email: req.body.email, active: true };
  db.partners.push(doc);
  res.json(doc);
});

api.post("/partners/:pid/toggle", (req, res) => {
  const doc = db.partners.find((p) => p.id === req.params.pid);
  if (doc) {
    doc.active = !doc.active;
    return res.json(doc);
  }
  res.status(404).json({ error: "not found" });
});

// Coaches
api.get("/coaches", (req, res) => {
  res.json(db.coaches);
});

api.post("/coaches", (req, res) => {
  const doc = { id: `co${Date.now()}`, email: req.body.email, active: true };
  db.coaches.push(doc);
  res.json(doc);
});

api.post("/coaches/:cid/toggle", (req, res) => {
  const doc = db.coaches.find((c) => c.id === req.params.cid);
  if (doc) {
    doc.active = !doc.active;
    return res.json(doc);
  }
  res.status(404).json({ error: "not found" });
});

// KPIs & Radar
api.get("/kpis", (req, res) => {
  res.json(db.kpis);
});

api.get("/radar", (req, res) => {
  res.json(db.radar);
});

// Profile & Anamnesis
api.get("/profile", (req, res) => {
  res.json(db.profile);
});

api.put("/profile", (req, res) => {
  db.profile = { ...db.profile, ...req.body };
  res.json(db.profile);
});

api.post("/anamnesis", (req, res) => {
  db.profile.anamnesis = req.body;
  db.profile.anamnesis_done = true;
  if (req.body.weight_kg) db.profile.weight_kg = req.body.weight_kg;
  if (req.body.height_cm) db.profile.height_cm = req.body.height_cm;
  res.json({ ok: true, profile: db.profile });
});

// Broadcasts
api.get("/broadcasts", (req, res) => {
  res.json(db.broadcasts);
});

api.post("/broadcasts", (req, res) => {
  const doc = {
    id: `b${Date.now()}`,
    text: req.body.text,
    author: req.body.author || "Coach Mari",
    date: new Date().toISOString().split("T")[0],
  };
  db.broadcasts.unshift(doc);
  res.json(doc);
});

// Helper function with automatic retry and model failover for high demand (503 / 429)
async function generateGeminiContentWithFailover(prompt: string): Promise<string> {
  const ai = getAI();
  if (!ai) return "";

  const models = ["gemini-2.5-flash", "gemini-3.7-flash"];
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        const text = response.text || "";
        if (text.trim()) {
          return text;
        }
      } catch (err: any) {
        const isUnavailable =
          err?.status === 503 ||
          err?.code === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("UNAVAILABLE");

        if (isUnavailable && attempt < 2) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
      }
    }
  }
  return "";
}

// ============ AI Endpoints (Gemini with High-Quality Fallbacks) ============

api.post("/ai/form-checker", async (req, res) => {
  const { exercise, checklist = [] } = req.body;
  const countChecked = Array.isArray(checklist) ? checklist.length : 0;
  const baseScore = Math.min(98, 60 + countChecked * 9);

  const fallback = {
    score: baseScore,
    verdict_pt:
      baseScore >= 85
        ? "Excelente execução biomecânica — postura firme e controle excêntrico exemplar."
        : "Boa execução — pequenos ajustes finos na retração e estabilidade trarão ganhos máximos.",
    verdict_en:
      baseScore >= 85
        ? "Excellent biomechanical execution — strong posture and exemplary eccentric control."
        : "Solid form — minor tweaks in scapular retraction and stability will maximize results.",
    tips_pt: [
      "Mantenha a retração e depressão escapular durante todo o arco do movimento.",
      "Controle a fase excêntrica em 2 a 3 segundos para maximizar o recrutamento muscular.",
      "Mantenha os pés cravados no chão (leg drive) e expire na contração concêntrica.",
    ],
    tips_en: [
      "Keep scapulae retracted and depressed throughout the entire range of motion.",
      "Control the eccentric phase for 2-3 seconds to maximize muscular fiber recruitment.",
      "Keep your feet anchored into the floor for solid base drive and exhale on contraction.",
    ],
  };

  try {
    const prompt = `You are a world-class strength and conditioning coach analyzing athlete execution for "${exercise}".
The athlete marked these checklist items: ${JSON.stringify(checklist)}.
Return ONLY a valid JSON object without markdown fences:
{
  "score": integer between 65 and 98,
  "verdict_pt": "one precise sentence in Portuguese",
  "verdict_en": "one precise sentence in English",
  "tips_pt": ["tip 1 in PT", "tip 2 in PT", "tip 3 in PT"],
  "tips_en": ["tip 1 in EN", "tip 2 in EN", "tip 3 in EN"]
}`;
    const text = await generateGeminiContentWithFailover(prompt);
    if (!text) return res.json(fallback);
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(clean);
    return res.json(data);
  } catch (err) {
    return res.json(fallback);
  }
});

// Official Vyra Diet Assistant endpoint connecting to Google Gemini API
api.post("/ai/diet-assistant", async (req, res) => {
  const { objetivo = "Hipertrofia e definição muscular", calorias_alvo = 2400, restricoes = [] } = req.body;
  try {
    const recommendations = await getDietAssistantRecommendations({
      objetivo,
      calorias_alvo: Number(calorias_alvo) || 2400,
      restricoes,
    });
    return res.json(recommendations);
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

api.post("/ai/diet-suggest", async (req, res) => {
  const { meal, current_food, lang = "pt" } = req.body;
  const isPt = lang === "pt";

  const fallback = {
    suggestions: [
      {
        name: isPt ? "Ovos mexidos com tapioca e queijo branco" : "Scrambled eggs with tapioca & cottage",
        grams: 240,
        kcal: 450,
        p: 32,
        c: 40,
        f: 17,
      },
      {
        name: isPt ? "Panqueca proteica de aveia e banana" : "Protein oat & banana pancake",
        grams: 260,
        kcal: 510,
        p: 30,
        c: 56,
        f: 15,
      },
      {
        name: isPt ? "Iogurte grego natural com granola e chia" : "Greek yogurt with artisan granola & chia",
        grams: 250,
        kcal: 420,
        p: 28,
        c: 44,
        f: 14,
      },
    ],
  };

  try {
    const prompt = `You are a sports nutritionist. Athlete meal: "${meal}", current food: "${current_food}".
Generate 3 healthy high-performance alternative meal options in ${isPt ? "Brazilian Portuguese" : "English"}.
Return ONLY a valid JSON object without code fences:
{
  "suggestions": [
    { "name": "Food Name", "grams": number, "kcal": number, "p": number, "c": number, "f": number },
    { "name": "Food Name", "grams": number, "kcal": number, "p": number, "c": number, "f": number },
    { "name": "Food Name", "grams": number, "kcal": number, "p": number, "c": number, "f": number }
  ]
}`;
    const text = await generateGeminiContentWithFailover(prompt);
    if (!text) return res.json(fallback);
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(clean);
    return res.json(data);
  } catch (err) {
    return res.json(fallback);
  }
});

api.post("/ai/plate-analyze", async (req, res) => {
  const { lang = "pt" } = req.body;
  const isPt = lang === "pt";

  const fallback = {
    name: isPt ? "Frango grelhado com arroz integral e legumes" : "Grilled chicken, brown rice & steamed veggies",
    kcal: 580,
    p: 48,
    c: 54,
    f: 14,
    grams: 340,
  };

  try {
    const prompt = `You are a sports nutritionist analyzing a meal plate photo.
Return ONLY a valid JSON object without code fences estimating nutritional content:
{
  "name": "${isPt ? 'Nome descritivo do prato em português' : 'Descriptive name in English'}",
  "kcal": 550,
  "p": 45,
  "c": 50,
  "f": 15,
  "grams": 350
}`;
    const text = await generateGeminiContentWithFailover(prompt);
    if (!text) return res.json(fallback);
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(clean);
    return res.json(data);
  } catch (err) {
    return res.json(fallback);
  }
});

// AI Coach Workout Generator
api.post("/ai/coach-generate-workout", async (req, res) => {
  const {
    student_name = "Atleta Vyra",
    goal = "Hipertrofia Muscular",
    split = "Push (Peito, Ombro e Tríceps)",
    level = "Intermediário",
    duration_min = 55,
    focus_notes = "",
    lang = "pt",
  } = req.body;

  const isPt = lang === "pt";

  const fallback = {
    day_label: `Dia de Foco · ${split.split("(")[0].trim()}`,
    title: `${split.split("(")[0].trim()} · Protocolo Alta Performance`,
    focus: `${goal} · Tensão Mecânica`,
    duration_min: Number(duration_min) || 55,
    intensity: level === "Avançado" ? "Extrema" : "Alta",
    coach_note: `Prescrição personalizada para ${student_name}. Priorize cadência 3-0-1 (3s excêntrica, 0s transição, 1s explosiva). ${focus_notes ? `Obs: ${focus_notes}` : ""}`.trim(),
    hero_image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&auto=format&fit=crop&q=80",
    exercises: [
      {
        id: `e-${Date.now()}-1`,
        name: "Supino Inclinado com Halteres",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        muscle: "Peito Superior",
        video_url: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
        coach_tip: "Banco a 30°, retração e depressão escapular total.",
      },
      {
        id: `e-${Date.now()}-2`,
        name: "Desenvolvimento Militar com Halteres",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        muscle: "Ombro Anterior e Médio",
        video_url: "https://www.youtube.com/watch?v=qEwKCR5JCog",
        coach_tip: "Abdômen travado, cotovelos levemente à frente.",
      },
      {
        id: `e-${Date.now()}-3`,
        name: "Elevação Lateral na Polia",
        sets: 4,
        reps: "12-15",
        rest: "60s",
        muscle: "Deltoide Lateral",
        video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
        coach_tip: "Cabo na altura do joelho para tensão contínua.",
      },
      {
        id: `e-${Date.now()}-4`,
        name: "Tríceps Francês com Halter Unilateral",
        sets: 3,
        reps: "10-12",
        rest: "60s",
        muscle: "Tríceps Cabeça Longa",
        video_url: "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q",
        coach_tip: "Alongamento máximo na fase excêntrica.",
      },
      {
        id: `e-${Date.now()}-5`,
        name: "Tríceps Corda no Cross",
        sets: 3,
        reps: "12-15",
        rest: "45s",
        muscle: "Tríceps Lateral",
        video_url: "https://www.youtube.com/watch?v=vB5OHsJ3EME",
        coach_tip: "Abra a corda no final com pico de contração de 1s.",
      },
    ],
  };

  try {
    const prompt = `You are the Head Coach and Biomechanics Specialist of VYRA (elite training club).
Create a complete, highly professional workout protocol for the athlete:
- Student Name: "${student_name}"
- Primary Goal: "${goal}"
- Training Split / Muscle Group: "${split}"
- Athlete Level: "${level}"
- Target Session Duration: ${duration_min} minutes
- Coach Notes / Focus: "${focus_notes || 'Maximum biomechanical efficiency and progressive overload'}"
- Language: ${isPt ? "Brazilian Portuguese" : "English"}

Return ONLY a valid JSON object without markdown code fences:
{
  "day_label": "e.g. Dia 2 · Push Força",
  "title": "e.g. Peito, Deltóide & Tríceps",
  "focus": "e.g. Hipertrofia & Densidade Muscular",
  "duration_min": ${Number(duration_min) || 55},
  "intensity": "Alta",
  "coach_note": "Specific tactical coaching note explaining tempo and focus for the athlete",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 4,
      "reps": "8-10",
      "rest": "90s",
      "muscle": "Target Muscle Group",
      "video_url": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
      "coach_tip": "Precise biomechanical cue"
    }
  ]
}`;
    const text = await generateGeminiContentWithFailover(prompt);
    if (!text) return res.json(fallback);
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(clean);
    if (data.exercises && Array.isArray(data.exercises)) {
      data.exercises = data.exercises.map((ex: any, idx: number) => ({
        id: `e-${Date.now()}-${idx + 1}`,
        ...ex,
      }));
    }
    return res.json({
      hero_image: fallback.hero_image,
      ...data,
    });
  } catch (err) {
    return res.json(fallback);
  }
});

// AI Coach Diet & Macro Generator
api.post("/ai/coach-generate-diet", async (req, res) => {
  const {
    student_name = "Atleta Vyra",
    goal = "Hipertrofia Muscular",
    weight_kg = 75,
    height_cm = 175,
    restrictions = "Nenhuma",
    target_kcal,
    lang = "pt",
  } = req.body;

  const isPt = lang === "pt";
  const baseKcal = Number(target_kcal) || Math.round(Number(weight_kg) * 32 + (goal.toLowerCase().includes("hipertrofia") || goal.toLowerCase().includes("massa") ? 400 : -350));

  const fallback = {
    kcal: baseKcal,
    protein_pct: 35,
    carbs_pct: 45,
    fats_pct: 20,
    foods: [
      {
        id: `f-${Date.now()}-1`,
        name: "Omelete de 3 ovos com aveia em flocos e frutas vermelhas",
        grams: 280,
        kcal: Math.round(baseKcal * 0.22),
        p: 32,
        c: 45,
        f: 14,
        meal: "breakfast",
      },
      {
        id: `f-${Date.now()}-2`,
        name: "Filé de peito de frango grelhado com arroz jasmim e legumes ao vapor",
        grams: 380,
        kcal: Math.round(baseKcal * 0.32),
        p: 55,
        c: 65,
        f: 12,
        meal: "lunch",
      },
      {
        id: `f-${Date.now()}-3`,
        name: "Whey Protein 100% com banana prata e pasta de amendoim integral",
        grams: 300,
        kcal: Math.round(baseKcal * 0.16),
        p: 30,
        c: 38,
        f: 8,
        meal: "snack",
      },
      {
        id: `f-${Date.now()}-4`,
        name: "Salmão grelhado ou filé mignon com batata doce assada e azeite extravirgem",
        grams: 340,
        kcal: Math.round(baseKcal * 0.22),
        p: 46,
        c: 48,
        f: 16,
        meal: "dinner",
      },
      {
        id: `f-${Date.now()}-5`,
        name: "Iogurte grego natural com sementes de chia e castanhas",
        grams: 190,
        kcal: Math.round(baseKcal * 0.08),
        p: 20,
        c: 12,
        f: 10,
        meal: "supper",
      },
    ],
  };

  try {
    const prompt = `You are the Chief Sports Nutritionist at VYRA.
Calculate the macro proportions and prescribe 5 structured daily meals for this athlete:
- Student Name: "${student_name}"
- Goal: "${goal}"
- Weight: ${weight_kg} kg
- Height: ${height_cm} cm
- Dietary Restrictions: "${restrictions || 'None'}"
- Daily Calorie Target: ${baseKcal} kcal
- Language: ${isPt ? "Brazilian Portuguese" : "English"}

Return ONLY a valid JSON object without markdown code fences:
{
  "kcal": ${baseKcal},
  "protein_pct": 35,
  "carbs_pct": 45,
  "fats_pct": 20,
  "foods": [
    {
      "name": "Meal description in Portuguese",
      "grams": 300,
      "kcal": 500,
      "p": 40,
      "c": 50,
      "f": 15,
      "meal": "breakfast"
    }
  ]
}`;
    const text = await generateGeminiContentWithFailover(prompt);
    if (!text) return res.json(fallback);
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(clean);
    if (data.foods && Array.isArray(data.foods)) {
      data.foods = data.foods.map((fd: any, idx: number) => ({
        id: `f-${Date.now()}-${idx + 1}`,
        ...fd,
      }));
    }
    return res.json(data);
  } catch (err) {
    return res.json(fallback);
  }
});

// Mount API routes
app.use("/api", api);

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
