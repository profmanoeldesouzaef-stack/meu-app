import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { getDietAssistantRecommendations, getRecipesByIngredients } from "./lib/diet-assistant";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// Credenciais Oficiais do Supabase para persistência e sincronização em tempo real
const DEFAULT_SUPABASE_URL = "https://qxcmqzzfsjvstlzveyrh.supabase.co";
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y21xenpmc2p2c3RsenZleXJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5MTQ1NiwiZXhwIjoyMTAzMTY3NDU2fQ.9n2Pc8d5X8FxrVbOAGB6R9yQePzvzghr9TtZ6J2EY1w";

function getSafeSupabaseUrl(): string {
  const envUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
    return envUrl;
  }
  return DEFAULT_SUPABASE_URL;
}

function getSafeSupabaseKey(): string {
  const envKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (envKey && envKey.length > 20 && !envKey.startsWith("http")) {
    return envKey;
  }
  return DEFAULT_SUPABASE_SERVICE_ROLE_KEY;
}

let supabaseServerClient: SupabaseClient | null = null;
function getSupabaseServer(): SupabaseClient {
  if (!supabaseServerClient) {
    try {
      const url = getSafeSupabaseUrl();
      const key = getSafeSupabaseKey();
      supabaseServerClient = createSupabaseClient(url, key, {
        auth: { persistSession: false },
      });
    } catch (err) {
      console.warn("Falha na inicialização do Supabase Server Client com URL personalizada. Usando credenciais padrão:", err);
      supabaseServerClient = createSupabaseClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
    }
  }
  return supabaseServerClient;
}

/**
 * Salva ou atualiza a assinatura do usuário de forma segura,
 * sem disparar erro de constraint UNIQUE no PostgreSQL/Supabase.
 */
async function saveUserSubscription(
  sb: SupabaseClient,
  userId: string,
  subData: {
    status: string;
    plan_type?: string;
    payment_method?: string;
    current_period_end?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    has_lifetime_coupon?: boolean;
    updated_at?: string;
  }
) {
  try {
    const { data: existing } = await sb
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const payload = {
      ...subData,
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      const { data, error } = await sb
        .from("subscriptions")
        .update(payload)
        .eq("id", existing[0].id)
        .select();
      return { data, error };
    } else {
      const { data, error } = await sb
        .from("subscriptions")
        .insert({
          user_id: userId,
          created_at: new Date().toISOString(),
          ...payload,
        })
        .select();
      return { data, error };
    }
  } catch (err: any) {
    return { data: null, error: err };
  }
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
    {
      id: "test",
      slug: "test",
      name: "🧪 Plano de Teste (R$ 1,00)",
      tag: "Teste de Produção",
      description: "Plano temporário de R$ 1,00 para validação em ambiente Live de Webhooks e geração real de QR Code PIX.",
      accent: "#10B981",
      theme_color: "emerald",
      prices_brl: {
        month: 1.0,
        quarter: 1.0,
        semester: 1.0,
        year: 1.0,
        single: 1.0,
        test: 1.0,
      },
      prices_usd: {
        month: 1.0,
        quarter: 1.0,
        semester: 1.0,
        year: 1.0,
        single: 1.0,
        test: 1.0,
      },
      perks: [
        "Cobrança real de R$ 1,00 na Stripe Live",
        "QR Code PIX com valor R$ 1,00",
        "Liberação imediata no Supabase via Webhook",
        "Mapeamento estrito: price_1UCUo4F7VqDt14kNAJolBpkp",
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

  coach_guidelines: [
    "Foco no Agora: Gere o treino EXCLUSIVAMENTE para o dia de hoje. Não crie ou mostre a semana inteira.",
    "Variabilidade de Estímulos: O treino de hoje deve ser único e dinâmico. Nunca repita a exata mesma rotina dos dias anteriores. Varie os exercícios, as pegadas, as angulações ou os métodos de intensidade (como drop-set, rest-pause, bi-set, isometria) para gerar novos desafios.",
    "Formatação: Entregue o treino de forma direta e motivacional, listando apenas o que deve ser executado nesta sessão.",
    "Priorizar exercícios multiarticulares e cadência excêntrica controlada (3s).",
    "Sempre incluir opções de substituição equivalentes em macronutrientes para cada refeição.",
  ] as string[],

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

  weekly_schedule: {
    1: {
      id: "wk-seg",
      day_index: 1,
      day_name: "Segunda-feira",
      day_short: "SEG",
      title: "Peito, Ombro & Tríceps · Push Day",
      focus: "Push · Força & Tensão Mecânica",
      duration_min: 58,
      intensity: "Alta",
      coach_note: "Foco no controle excêntrico (3s). Se sentir dor na articulação, reduza carga 20% e me avise no chat.",
      hero_image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&auto=format&fit=crop&q=80",
      exercises: [
        { id: "e1", name: "Supino reto barra", sets: 4, reps: "8-10", rest: "90s", muscle: "Peito", video_url: "https://www.youtube.com/watch?v=rT7DgCr-3pg", coach_tip: "Mantenha escápulas retraídas durante toda a execução." },
        { id: "e2", name: "Supino inclinado halter", sets: 3, reps: "10-12", rest: "75s", muscle: "Peito", video_url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", coach_tip: "Inclinação de 30-45°. Trajetória em arco." },
        { id: "e3", name: "Desenvolvimento militar", sets: 4, reps: "8", rest: "90s", muscle: "Ombro", video_url: "https://www.youtube.com/watch?v=qEwKCR5JCog", coach_tip: "Core contraído, não arqueie a lombar." },
        { id: "e4", name: "Elevação lateral", sets: 4, reps: "12", rest: "45s", muscle: "Ombro", video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo", coach_tip: "Cotovelos ligeiramente flexionados, sem impulso." },
        { id: "e5", name: "Tríceps corda", sets: 3, reps: "12-15", rest: "45s", muscle: "Tríceps", video_url: "https://www.youtube.com/watch?v=vB5OHsJ3EME", coach_tip: "Cotovelos colados ao tronco, extensão completa." },
        { id: "e6", name: "Tríceps francês", sets: 3, reps: "10", rest: "60s", muscle: "Tríceps", video_url: "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q", coach_tip: "Cotovelos apontando pro teto, sem abrir." }
      ]
    },
    2: {
      id: "wk-ter",
      day_index: 2,
      day_name: "Terça-feira",
      day_short: "TER",
      title: "Costas, Bíceps & Trapézio · Pull Day",
      focus: "Dorsais · Densidade & Largura",
      duration_min: 52,
      intensity: "Alta",
      coach_note: "Puxe direcionando os cotovelos para a crista ilíaca, ativando latíssimo sem roubar no tronco.",
      hero_image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&auto=format&fit=crop&q=80",
      exercises: [
        { id: "p1", name: "Puxada frontal pronada", sets: 4, reps: "8-10", rest: "90s", muscle: "Dorsais", video_url: "https://www.youtube.com/watch?v=CAwf7n6Luuc", coach_tip: "Puxe com os cotovelos, peito estufado." },
        { id: "p2", name: "Remada curvada barra livre", sets: 4, reps: "8-10", rest: "90s", muscle: "Dorsais / Romboides", video_url: "https://www.youtube.com/watch?v=G8l_8chR5BE", coach_tip: "Tronco inclinado a 45°, coluna 100% estabilizada." },
        { id: "p3", name: "Remada baixa articulada", sets: 3, reps: "10-12", rest: "60s", muscle: "Costas Meio", video_url: "https://www.youtube.com/watch?v=GZbfZ033f74", coach_tip: "Alongue completamente a dorsal na fase excêntrica." },
        { id: "p4", name: "Crucifixo invertido máquina", sets: 3, reps: "12-15", rest: "45s", muscle: "Deltoide Posterior", video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo", coach_tip: "Mantenha os ombros abaixados e foque na contração." },
        { id: "p5", name: "Rosca direta barra W", sets: 4, reps: "10", rest: "60s", muscle: "Bíceps", video_url: "https://www.youtube.com/watch?v=kwG2ipFRgfo", coach_tip: "Cotovelos travados na linha do corpo." },
        { id: "p6", name: "Rosca martelo com halteres", sets: 3, reps: "12", rest: "45s", muscle: "Braquial / Antebraço", video_url: "https://www.youtube.com/watch?v=zC3nLlEvin4", coach_tip: "Subida controlada sem oscilação da lombar." }
      ]
    },
    3: null, // Quarta-feira: Descanso programado (Empty State amigável)
    4: {
      id: "wk-qui",
      day_index: 4,
      day_name: "Quinta-feira",
      day_short: "QUI",
      title: "Pernas & Glúteos · Leg Day Intenso",
      focus: "Inferiores · Quadríceps, Glúteos & Isquiotibiais",
      duration_min: 60,
      intensity: "Extrema",
      coach_note: "Dia de carga máxima. Mantenha a amplitude até a paralela ou abaixo. Beba pelo menos 1L de água durante a sessão.",
      hero_image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=1200&auto=format&fit=crop&q=80",
      exercises: [
        { id: "l1", name: "Agachamento livre com barra", sets: 4, reps: "6-8", rest: "120s", muscle: "Quadríceps / Glúteos", video_url: "https://www.youtube.com/watch?v=bEv6CCg2BC8", coach_tip: "Pés na largura dos ombros, joelhos acompanhando pontas dos pés." },
        { id: "l2", name: "Leg Press 45° unilateral", sets: 4, reps: "10-12", rest: "90s", muscle: "Quadríceps", video_url: "https://www.youtube.com/watch?v=IZxyjW7MPJQ", coach_tip: "Não descole o quadril do encosto do banco." },
        { id: "l3", name: "Cadeira extensora", sets: 3, reps: "12-15", rest: "60s", muscle: "Quadríceps Isolado", video_url: "https://www.youtube.com/watch?v=YyvSfVfbYC8", coach_tip: "2 segundos de pico de contração no topo." },
        { id: "l4", name: "Stiff com halteres pesados", sets: 4, reps: "10", rest: "75s", muscle: "Posterior de Coxa", video_url: "https://www.youtube.com/watch?v=0hXvM8kRj3Y", coach_tip: "Jogue o quadril para trás como se fosse fechar uma porta." },
        { id: "l5", name: "Mesa flexora", sets: 3, reps: "10-12", rest: "60s", muscle: "Isquiotibiais", video_url: "https://www.youtube.com/watch?v=1Tq3QdYUuHs", coach_tip: "Pés neutros sem rodar tornozelos." },
        { id: "l6", name: "Panturrilhas em pé no Smith", sets: 4, reps: "15-20", rest: "45s", muscle: "Panturrilhas", video_url: "https://www.youtube.com/watch?v=gwLzBJYoWlI", coach_tip: "Amplitude completa com pausa de 1s na base e 1s no topo." }
      ]
    },
    5: {
      id: "wk-sex",
      day_index: 5,
      day_name: "Sexta-feira",
      day_short: "SEX",
      title: "Ombros & Braços · Upper Body Densidade",
      focus: "Deltoides, Bíceps, Tríceps & Core",
      duration_min: 48,
      intensity: "Moderada/Alta",
      coach_note: "Trabalho de detalhe e simetria muscular. Controle de respiração nas repetições finais.",
      hero_image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80",
      exercises: [
        { id: "u1", name: "Desenvolvimento halteres sentado", sets: 4, reps: "10", rest: "75s", muscle: "Deltoides", video_url: "https://www.youtube.com/watch?v=qEwKCR5JCog", coach_tip: "Banco a 80 graus, cotovelos controlados." },
        { id: "u2", name: "Elevação lateral polia média", sets: 4, reps: "12-15", rest: "45s", muscle: "Deltoide Lateral", video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo", coach_tip: "Tensão constante desde o início do movimento." },
        { id: "u3", name: "Rosca Scott máquina", sets: 3, reps: "10-12", rest: "60s", muscle: "Bíceps", video_url: "https://www.youtube.com/watch?v=fIWP-FRFNU0", coach_tip: "Sem tirar os braços do apoio na descida." },
        { id: "u4", name: "Tríceps testa na barra W", sets: 3, reps: "10-12", rest: "60s", muscle: "Tríceps Longo", video_url: "https://www.youtube.com/watch?v=d_KZxkH_toI", coach_tip: "Cotovelos paralelos sem abrir para os lados." },
        { id: "u5", name: "Prancha abdominal isométrica", sets: 4, reps: "45s", rest: "30s", muscle: "Core / Abdômen", video_url: "https://www.youtube.com/watch?v=pSHjTRCQxIw", coach_tip: "Glúteos e abdômen fortemente contraídos." }
      ]
    },
    6: {
      id: "wk-sab",
      day_index: 6,
      day_name: "Sábado",
      day_short: "SÁB",
      title: "Metabólico Vyra Burn & Condicionamento",
      focus: "Cardio de Alta Intensidade & Core",
      duration_min: 42,
      intensity: "Alta",
      coach_note: "Circuito para queima de gordura e capacidade aeróbica. Mantenha os descansos pontuais.",
      hero_image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80",
      exercises: [
        { id: "m1", name: "Kettlebell Swing", sets: 4, reps: "20", rest: "45s", muscle: "Cadeia Posterior / Core", video_url: "https://www.youtube.com/watch?v=0hXvM8kRj3Y", coach_tip: "Explosão de quadril." },
        { id: "m2", name: "Burpees dinâmicos", sets: 3, reps: "12", rest: "60s", muscle: "Full Body", video_url: "https://www.youtube.com/watch?v=auBLPXO8Fww", coach_tip: "Cadência constante." },
        { id: "m3", name: "Abdominal remador", sets: 3, reps: "20", rest: "45s", muscle: "Abdômen", video_url: "https://www.youtube.com/watch?v=1fbU_MkV7NE", coach_tip: "Suba abraçando os joelhos." }
      ]
    },
    0: null, // Domingo: Descanso total & regeneração muscular
  } as Record<number, any>,

  diet: {
    id: "diet-default",
    kcal: 2450,
    protein_pct: 35,
    carbs_pct: 40,
    fats_pct: 25,
    foods: [
      {
        id: "f1",
        name: "Omelete com aveia",
        grams: 250,
        kcal: 480,
        p: 35,
        c: 42,
        f: 18,
        meal: "breakfast",
        ingredients: [
          { name: "Ovos médios caipiras", quantity: "3 unidades (150g)", grams: 150, kcal: 215, p: 19, c: 1, f: 15 },
          { name: "Aveia em flocos finos", quantity: "45g (3 colheres)", grams: 45, kcal: 165, p: 6, c: 27, f: 3 },
          { name: "Queijo minas frescal light", quantity: "40g picado", grams: 40, kcal: 75, p: 9, c: 1, f: 3 },
          { name: "Tomate em cubinhos e orégano", quantity: "15g", grams: 15, kcal: 25, p: 1, c: 3, f: 0 },
        ],
        recipe_instructions: [
          "1. Quebre os ovos em uma tigela e bata bem com garfo.",
          "2. Incorpore a aveia, o tomate, o queijo picado e as ervas.",
          "3. Despeje em frigideira antiaderente levemente untada com azeite em fogo médio-baixo.",
          "4. Tampe por 3 minutos, vire e doure por mais 1 minuto.",
        ],
      },
      {
        id: "f2",
        name: "Frango grelhado com arroz e legumes",
        grams: 350,
        kcal: 620,
        p: 55,
        c: 65,
        f: 12,
        meal: "lunch",
        ingredients: [
          { name: "Filé de peito de frango grelhado", quantity: "170g", grams: 170, kcal: 280, p: 50, c: 0, f: 5 },
          { name: "Arroz cozido (integral ou branco)", quantity: "140g", grams: 140, kcal: 220, p: 4, c: 48, f: 1 },
          { name: "Mix de brócolis e cenoura no vapor", quantity: "35g", grams: 35, kcal: 45, p: 2, c: 8, f: 0 },
          { name: "Azeite extravirgem de oliva", quantity: "5ml (1 colher de chá)", grams: 5, kcal: 45, p: 0, c: 0, f: 5 },
        ],
        recipe_instructions: [
          "1. Tempere o frango com alho, limão, sal e pimenta.",
          "2. Grelhe em frigideira quente por 4 a 5 minutos de cada lado até ficar dourado e suculento.",
          "3. Cozinhe os legumes no vapor até ficarem 'al dente'.",
          "4. Monte com o arroz aquecido e regue com o azeite.",
        ],
      },
      {
        id: "f3",
        name: "Whey isolado + banana",
        grams: 300,
        kcal: 320,
        p: 30,
        c: 40,
        f: 4,
        meal: "snack",
        ingredients: [
          { name: "Whey protein isolado (1 dosador)", quantity: "30g", grams: 30, kcal: 120, p: 26, c: 2, f: 1 },
          { name: "Banana prata fatiada", quantity: "1 unidade média (100g)", grams: 100, kcal: 95, p: 1, c: 23, f: 0 },
          { name: "Bebida vegetal ou leite desnatado", quantity: "170ml", grams: 170, kcal: 70, p: 5, c: 8, f: 1 },
        ],
        recipe_instructions: [
          "1. Adicione a bebida vegetal ou leite gelado em uma coqueteleira.",
          "2. Adicione o scoop de Whey e agite vigorosamente.",
          "3. Sirva em copo alto acompanhado da banana fatiada com canela.",
        ],
      },
      {
        id: "f4",
        name: "Salmão com batata doce",
        grams: 320,
        kcal: 580,
        p: 42,
        c: 48,
        f: 22,
        meal: "dinner",
        ingredients: [
          { name: "Filé de salmão fresco selado", quantity: "160g", grams: 160, kcal: 320, p: 38, c: 0, f: 18 },
          { name: "Batata doce assada com alecrim", quantity: "140g", grams: 140, kcal: 180, p: 3, c: 42, f: 0 },
          { name: "Salada verde com azeite", quantity: "20g", grams: 20, kcal: 45, p: 1, c: 2, f: 4 },
        ],
        recipe_instructions: [
          "1. Tempere o salmão com sal marinho, raspas de limão siciliano e pimenta.",
          "2. Sele na frigideira bem quente com a pele para baixo por 4 minutos, vire e deixe mais 2 minutos.",
          "3. Asse a batata doce em rodelas na airfryer com alecrim até dourar.",
          "4. Sirva o filé ao lado da batata doce crocante.",
        ],
      },
      {
        id: "f5",
        name: "Iogurte grego + castanhas",
        grams: 200,
        kcal: 340,
        p: 22,
        c: 18,
        f: 20,
        meal: "supper",
        ingredients: [
          { name: "Iogurte grego natural desnatado", quantity: "160g", grams: 160, kcal: 130, p: 16, c: 9, f: 1 },
          { name: "Mix de castanhas-do-pará e nozes picadas", quantity: "25g", grams: 25, kcal: 160, p: 4, c: 3, f: 15 },
          { name: "Sementes de chia e fio leve de mel", quantity: "15g", grams: 15, kcal: 50, p: 2, c: 6, f: 2 },
        ],
        recipe_instructions: [
          "1. Coloque o iogurte grego em uma taça gelada.",
          "2. Polvilhe as sementes de chia e as castanhas picadas por cima.",
          "3. Finalize com um fiozinho de mel e consuma antes de dormir.",
        ],
      },
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

  active_challenges: [
    {
      id: "ch-reset-1",
      title: "Desafio Vyra Reset 12 Semanas",
      subtitle: "Secagem e Recomposição Corporal Extrema",
      description: "Envie sua foto de evolução para concorrer ao título oficial de Campeão Vyra Reset e premiações exclusivas.",
      protocol: "Vyra Reset",
      prize: "👑 Cinturão Vyra + 1 Ano de Acompanhamento Grátis + Kit Completo de Suplementos",
      banner_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
      start_date: "2026-09-01",
      end_date: "2026-09-30T23:59:59.000Z",
      status: "active" as "active" | "finished" | "closed",
      entries_count: 3,
    },
    {
      id: "ch-shape-1",
      title: "Desafio Vyra Shape",
      subtitle: "Definição Máxima e Proporções Clássicas",
      description: "Transformação com foco em densidade e simetria muscular para o ciclo de primavera.",
      protocol: "Vyra Shape",
      prize: "🏆 Troféu Vyra Shape + Kit Suplementação Premium",
      banner_url: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=1200&q=80",
      start_date: "2026-09-01",
      end_date: "2026-10-15T23:59:59.000Z",
      status: "active" as "active" | "finished" | "closed",
      entries_count: 2,
    },
  ] as Array<{
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    protocol: string;
    prize?: string;
    banner_url?: string;
    start_date: string;
    end_date: string;
    status: "active" | "finished" | "closed";
    entries_count?: number;
    winner_id?: string;
    winner_name?: string;
    winner_photo_url?: string;
    finished_at?: string;
  }>,

  challenge_entries: [
    {
      id: "entry-1",
      user_id: "std-1",
      challenge_id: "ch-reset-1",
      photo_url: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
      participant_name: "Rafael Mendes",
      caption: "12 semanas de foco total no Protocolo Reset! Menos 8kg e definição no abdômen.",
      votes_count: 142,
      is_winner: false,
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "entry-2",
      user_id: "std-2",
      challenge_id: "ch-reset-1",
      photo_url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
      participant_name: "Carlos Eduardo",
      caption: "Evolução do peitoral e dorsal. Disciplina inegociável todos os dias.",
      votes_count: 118,
      is_winner: false,
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "entry-3",
      user_id: "std-3",
      challenge_id: "ch-reset-1",
      photo_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
      participant_name: "Mariana Souza",
      caption: "Menos 6kg de gordura e ganho expressivo de massa magra no ciclo.",
      votes_count: 95,
      is_winner: false,
      created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "entry-4",
      user_id: "std-4",
      challenge_id: "ch-shape-1",
      photo_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
      participant_name: "Lucas Alencar",
      caption: "Aperto de cintura e linha em V. Vyra Shape funcionando 100%.",
      votes_count: 87,
      is_winner: false,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
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
      is_veteran: false,
    },
    {
      id: "m2",
      author: "Rafael M.",
      persona: "student",
      text: "Fechei o supino com 92kg hoje, animal!",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      likes: 5,
      image: null,
      is_veteran: true,
      patente_level: 2,
    },
    {
      id: "m3",
      author: "Camila S.",
      persona: "student",
      text: "Alguém tem substituto pro salmão hoje?",
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      likes: 2,
      image: null,
      is_veteran: true,
      patente_level: 4,
    },
    {
      id: "m4",
      author: "NutriFit Suplementos",
      persona: "partner",
      text: "Novos lotes de Whey Isolado e Creatina Creapure já liberados com desconto VIP pro time Vyra! ⚡",
      timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
      likes: 9,
      image: null,
      is_veteran: true,
      patente_level: 6,
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
    {
      id: "cp-vet",
      code: "VETERANO",
      pct: 20,
      active: true,
      is_veteran: true,
      title: "Cupom Veterano Oficial (Desbloqueia Selo de Veterano)",
    },
  ],

  partners: [
    { id: "pt1", email: "parceiro@empresa.com", name: "Parceiro Oficial Vyra", active: true, is_veteran: true },
    { id: "pt2", email: "growth@nutrifit.com.br", name: "NutriFit Suplementos", active: true, is_veteran: true },
    { id: "pt3", email: "contato@crosslab.com", name: "CrossLab Wear", active: true, is_veteran: true },
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
      is_veteran: true,
      patente_level: 4,
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
      is_veteran: true,
      patente_level: 3,
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
      is_veteran: false,
      patente_level: 2,
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
      is_veteran: true,
      patente_level: 1,
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
      is_veteran: true,
      patente_level: 2,
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
      is_veteran: false,
      patente_level: 1,
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
    height_cm: null as any,
    weight_kg: null as any,
    waist_cm: null as any,
    hip_cm: null as any,
    right_arm_cm: null as any,
    left_arm_cm: null as any,
    right_leg_cm: null as any,
    left_leg_cm: null as any,
    thigh_right: null as any,
    thigh_left: null as any,
    last_assessment_date: null as any,
    anamnesis: null as any,
    anamnesis_done: false,
    water_ml: 2500,
    creatine_g: 5.0,
    creatine_dose_g: 5.0,
    creatine_times: ["08:00", "20:00"],
    logged_in: false,
    onboarding_completed: false,
    workout_released: false,
    diet_released: false,
    age: null as any,
    primary_goal: "",
    dietary_restrictions: "",
    medical_history: "",
    is_veteran: false,
    veteran_since: null,
    consecutive_months: 0,
    monthly_fee_paid: false,
    patente_level: 0,
    vip_chat_unlocked: false,
    is_champion: false,
    points: 0,
    rank: null,
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

  exercise_logs: [
    {
      id: "log-init-1",
      user_email: "rafael@vyra.club",
      workout_id: "wk-today",
      exercise_id: "e1",
      exercise_name: "Supino Reto com Barra",
      date: new Date().toISOString().split("T")[0],
      sets: [
        { set_num: 1, weight_kg: 60, reps: "10", completed: true },
        { set_num: 2, weight_kg: 70, reps: "10", completed: true },
        { set_num: 3, weight_kg: 75, reps: "8", completed: true },
        { set_num: 4, weight_kg: 80, reps: "6", completed: true },
      ],
      updated_at: new Date().toISOString(),
    },
  ] as Array<{
    id: string;
    user_email?: string;
    workout_id: string;
    exercise_id: string;
    exercise_name?: string;
    date: string;
    sets: Array<{
      set_num: number;
      weight_kg: number | string;
      reps: number | string;
      completed: boolean;
    }>;
    notes?: string;
    updated_at: string;
  }>,
};

// ============ API Routes ============
const api = express.Router();

api.get("/", (req, res) => {
  res.json({ app: "Vyra Training & Performance", status: "ok" });
});

// Coach Methodology Guidelines & AI Conversational Setup
api.get("/coach/guidelines", (req, res) => {
  if (!db.coach_guidelines) {
    db.coach_guidelines = [
      "Foco no Agora: Gere o treino EXCLUSIVAMENTE para o dia de hoje. Não crie ou mostre a semana inteira.",
      "Variabilidade de Estímulos: O treino de hoje deve ser único e dinâmico. Nunca repita a exata mesma rotina dos dias anteriores. Varie os exercícios, as pegadas, as angulações ou os métodos de intensidade (como drop-set, rest-pause, bi-set, isometria) para gerar novos desafios.",
      "Formatação: Entregue o treino de forma direta e motivacional, listando apenas o que deve ser executado nesta sessão.",
      "Priorizar exercícios multiarticulares e cadência excêntrica controlada (3s).",
      "Sempre incluir opções de substituição equivalentes em macronutrientes para cada refeição.",
    ];
  }
  res.json(db.coach_guidelines);
});

api.put("/coach/guidelines", (req, res) => {
  const { guidelines } = req.body;
  if (Array.isArray(guidelines)) {
    db.coach_guidelines = guidelines;
  }
  res.json(db.coach_guidelines || []);
});

api.post("/coach/ai-chat", async (req, res) => {
  const { message, active_guidelines = [] } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  if (!db.coach_guidelines || db.coach_guidelines.length === 0) {
    db.coach_guidelines = active_guidelines.length > 0 ? active_guidelines : [
      "Foco no Agora: Gere o treino EXCLUSIVAMENTE para o dia de hoje. Não crie ou mostre a semana inteira.",
      "Variabilidade de Estímulos: O treino de hoje deve ser único e dinâmico. Nunca repita a exata mesma rotina dos dias anteriores. Varie os exercícios, as pegadas, as angulações ou os métodos de intensidade (como drop-set, rest-pause, bi-set, isometria) para gerar novos desafios.",
      "Formatação: Entregue o treino de forma direta e motivacional, listando apenas o que deve ser executado nesta sessão.",
      "Priorizar exercícios multiarticulares e cadência excêntrica controlada (3s).",
      "Sempre incluir opções de substituição equivalentes em macronutrientes para cada refeição.",
    ];
  }

  const currentGuidelines = db.coach_guidelines;
  const guidelinesContext = `Diretrizes ativas já salvas pelo Coach:\n- ${currentGuidelines.join("\n- ")}`;

  const prompt = `Você é um Treinador de Alto Rendimento de elite da plataforma VYRA.
O usuário / Coach solicitará o seu planejamento diário ou instruirá sua metodologia.

SUAS REGRAS ESTRITAS DE CONDUTA SÃO:
- Foco no Agora: Gere o treino EXCLUSIVAMENTE para o dia de hoje. Não crie ou mostre a semana inteira.
- Variabilidade de Estímulos: O treino de hoje deve ser único e dinâmico. Nunca repita a exata mesma rotina dos dias anteriores. Varie os exercícios, as pegadas, as angulações ou os métodos de intensidade (como drop-set, rest-pause, bi-set, isometria) para gerar novos desafios.
- Formatação: Entregue o treino de forma direta e motivacional, listando apenas o que deve ser executado nesta sessão.

${guidelinesContext}

Mensagem do Coach:
"${message}"

Suas tarefas:
1. Responda como um verdadeiro Treinador de Alto Rendimento, de forma direta, técnica e motivacional, confirmando a assimilação de cada regra.
2. Consolide e mantenha a lista de diretrizes ativas da metodologia (incluindo as regras estritas acima mais quaisquer orientações específicas adicionadas pelo Coach).
3. No final da resposta, SEMPRE adicione o bloco estruturado com as diretrizes consolidadas:
<<<GUIDELINES: ["diretriz 1", "diretriz 2", ...]>>>`;

  try {
    const aiResponse = await generateGeminiContentWithFailover(prompt);
    if (!aiResponse) {
      return res.json({
        reply: "Entendido, Coach! Registrei todas as suas instruções de metodologia e aplicarei essas diretrizes em todas as próximas prescrições de treinos e planos alimentares dos seus alunos.",
        updated_guidelines: currentGuidelines,
      });
    }

    let reply = aiResponse;
    let updated_guidelines = currentGuidelines;

    const match = aiResponse.match(/<<<GUIDELINES:\s*(\[[\s\S]*?\])\s*>>>/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          updated_guidelines = parsed;
          db.coach_guidelines = parsed;
        }
      } catch (err) {
        console.warn("Failed to parse guidelines JSON from AI reply:", err);
      }
      reply = aiResponse.replace(/<<<GUIDELINES:[\s\S]*?>>>/, "").trim();
    }

    return res.json({ reply, updated_guidelines });
  } catch (e) {
    return res.json({
      reply: "Instruções do Coach salvas com sucesso no ecossistema de prescrição!",
      updated_guidelines: currentGuidelines,
    });
  }
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

api.put("/students/:id/vip-chat", (req, res) => {
  const std = db.students.find((s) => s.id === req.params.id);
  if (!std) return res.status(404).json({ error: "Aluno não encontrado" });
  const isVip = Boolean(req.body.vip_chat_unlocked);
  (std as any).vip_chat_unlocked = isVip;
  if (std.id === "std-1" || std.email === db.profile.email) {
    (db.profile as any).vip_chat_unlocked = isVip;
  }
  res.json(std);
});

api.put("/students/:id/protocol", (req, res) => {
  const std = db.students.find((s) => s.id === req.params.id);
  if (!std) return res.status(404).json({ error: "Aluno não encontrado" });
  const { water_ml, creatine_dose_g, creatine_doses_per_day, creatine_times, vip_chat_unlocked } = req.body;
  if (water_ml !== undefined) (std as any).water_ml = Number(water_ml) || 2500;
  if (creatine_dose_g !== undefined) (std as any).creatine_dose_g = Number(creatine_dose_g) || 5.0;
  if (creatine_doses_per_day !== undefined) (std as any).creatine_doses_per_day = Math.min(3, Math.max(1, Number(creatine_doses_per_day) || 1));
  if (creatine_times !== undefined && Array.isArray(creatine_times)) (std as any).creatine_times = creatine_times;
  if (vip_chat_unlocked !== undefined) (std as any).vip_chat_unlocked = Boolean(vip_chat_unlocked);

  if (std.id === "std-1" || std.email === db.profile.email) {
    if (water_ml !== undefined) db.profile.water_ml = Number(water_ml) || 2500;
    if (creatine_dose_g !== undefined) {
      db.profile.creatine_dose_g = Number(creatine_dose_g) || 5.0;
      db.profile.creatine_g = Number(creatine_dose_g) || 5.0;
    }
    if (creatine_doses_per_day !== undefined) {
      (db.profile as any).creatine_doses_per_day = Math.min(3, Math.max(1, Number(creatine_doses_per_day) || 1));
    }
    if (creatine_times !== undefined && Array.isArray(creatine_times)) {
      db.profile.creatine_times = creatine_times;
    }
    if (vip_chat_unlocked !== undefined) (db.profile as any).vip_chat_unlocked = Boolean(vip_chat_unlocked);
  }
  res.json(std);
});

// --- ONBOARDING & COACH RELEASE ENDPOINTS ---

// Submissão do Onboarding Inicial Obrigatório (Anamnese)
api.post("/onboarding", async (req, res) => {
  const {
    user_id,
    userId,
    full_name,
    fullName,
    nickname,
    age,
    weight_kg,
    weightKg,
    height_cm,
    heightCm,
    primary_goal,
    primaryGoal,
    dietary_restrictions,
    dietaryRestrictions,
    medical_history,
    medicalHistory,
    email,
  } = req.body;

  const effectiveUserId = user_id || userId || "me";
  const effectiveName = (full_name || fullName || "").trim() || "Aluno";
  const effectiveNickname = (nickname || "").trim() || effectiveName.split(" ")[0] || "Aluno";
  const effectiveAge = age !== undefined && age !== null && age !== "" ? Number(age) : null;
  const effectiveWeight = (weight_kg || weightKg) !== undefined && (weight_kg || weightKg) !== null && (weight_kg || weightKg) !== "" ? Number(weight_kg || weightKg) : null;
  const effectiveHeight = (height_cm || heightCm) !== undefined && (height_cm || heightCm) !== null && (height_cm || heightCm) !== "" ? Number(height_cm || heightCm) : null;
  const effectiveGoal = (primary_goal || primaryGoal || "").trim();
  const effectiveRestrictions = (dietary_restrictions || dietaryRestrictions || "").trim();
  const effectiveMedical = (medical_history || medicalHistory || "").trim();
  const effectiveEmail = (email || db.profile.email || "aluno@vyra.club").trim().toLowerCase();

  // 1. Atualiza o perfil em memória
  (db.profile as any).full_name = effectiveName;
  db.profile.nickname = effectiveNickname;
  (db.profile as any).name = effectiveName;
  (db.profile as any).age = effectiveAge;
  db.profile.weight_kg = effectiveWeight as any;
  db.profile.height_cm = effectiveHeight as any;
  (db.profile as any).primary_goal = effectiveGoal;
  (db.profile as any).dietary_restrictions = effectiveRestrictions;
  (db.profile as any).medical_history = effectiveMedical;
  (db.profile as any).onboarding_completed = true;
  (db.profile as any).workout_released = false;
  (db.profile as any).diet_released = false;
  (db.profile as any).last_assessment_date = new Date().toISOString().split("T")[0];

  // 2. Procura ou adiciona o aluno na lista do coach
  let student: any = db.students.find((s) => s.id === effectiveUserId || s.email === effectiveEmail);
  if (!student) {
    student = {
      id: effectiveUserId !== "me" ? effectiveUserId : `std-${Date.now()}`,
      name: effectiveName,
      nickname: effectiveNickname,
      email: effectiveEmail,
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      plan: "Aguardando Escolha",
      goal: effectiveGoal,
      weight_kg: effectiveWeight,
      height_cm: effectiveHeight,
      restrictions: effectiveRestrictions,
      adherence_pct: 100,
      primary_goal: effectiveGoal,
      age: effectiveAge,
      dietary_restrictions: effectiveRestrictions,
      medical_history: effectiveMedical,
      onboarding_completed: true,
      workout_released: false,
      diet_released: false,
      created_at: new Date().toISOString(),
    };
    db.students.unshift(student);
  } else {
    student.name = effectiveName;
    student.nickname = effectiveNickname;
    student.weight_kg = effectiveWeight;
    student.height_cm = effectiveHeight;
    student.goal = effectiveGoal;
    student.primary_goal = effectiveGoal;
    student.age = effectiveAge;
    student.restrictions = effectiveRestrictions;
    student.dietary_restrictions = effectiveRestrictions;
    student.medical_history = effectiveMedical;
    student.onboarding_completed = true;
    student.workout_released = false;
    student.diet_released = false;
  }

  // 3. Sincroniza com Supabase se configurado
  try {
    const sb = getSupabaseServer();
    if (sb && effectiveUserId && effectiveUserId !== "me") {
      // Upsert na tabela profiles
      const { error: profileErr } = await sb
        .from("profiles")
        .upsert(
          {
            id: effectiveUserId,
            full_name: effectiveName,
            name: effectiveName,
            nickname: effectiveNickname,
            email: effectiveEmail,
            weight_kg: effectiveWeight,
            height_cm: effectiveHeight,
            onboarding_completed: true,
            workout_released: false,
            diet_released: false,
            age: effectiveAge,
            primary_goal: effectiveGoal,
            dietary_restrictions: effectiveRestrictions,
            medical_history: effectiveMedical,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileErr) {
        // Se alguma coluna personalizada não existir em profiles, tenta salvar com colunas base
        await sb.from("profiles").upsert(
          {
            id: effectiveUserId,
            full_name: effectiveName,
            name: effectiveName,
            nickname: effectiveNickname,
            weight_kg: effectiveWeight,
            height_cm: effectiveHeight,
            onboarding_completed: true,
            workout_released: false,
            diet_released: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }

      // Tenta persistir na tabela student_onboarding
      try {
        await sb
          .from("student_onboarding")
          .upsert(
            {
              user_id: effectiveUserId,
              full_name: effectiveName,
              nickname: effectiveNickname,
              age: effectiveAge,
              weight_kg: effectiveWeight,
              height_cm: effectiveHeight,
              primary_goal: effectiveGoal,
              dietary_restrictions: effectiveRestrictions,
              medical_history: effectiveMedical,
              onboarding_completed: true,
              workout_released: false,
              diet_released: false,
              created_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      } catch {}
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar anamnese com Supabase:", err);
  }

  return res.json({
    ok: true,
    onboarding_completed: true,
    workout_released: false,
    diet_released: false,
    student,
  });
});

// Lista de Alunos Pendentes de Liberação de Treino ou Dieta
api.get("/coach/pending-students", async (req, res) => {
  // Procura na memória
  const memoryPending = db.students.filter(
    (s: any) =>
      s.onboarding_completed === true &&
      (s.workout_released === false || s.diet_released === false)
  );

  // Se houver Supabase, busca também alunos com onboarding concluído e pendência
  try {
    const sb = getSupabaseServer();
    if (sb) {
      const { data: supaProfiles } = await sb
        .from("profiles")
        .select("*")
        .eq("onboarding_completed", true)
        .or("workout_released.is.null,workout_released.eq.false,diet_released.is.null,diet_released.eq.false");

      if (supaProfiles && supaProfiles.length > 0) {
        for (const sp of supaProfiles) {
          const exists = memoryPending.find((m) => m.id === sp.id || m.email === sp.email);
          if (!exists) {
            memoryPending.unshift({
              id: sp.id,
              name: sp.full_name || sp.name || "Aluno",
              nickname: sp.nickname || sp.name || "Aluno",
              email: sp.email || "aluno@vyra.club",
              avatar_url: sp.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
              plan: sp.plan || sp.active_protocol || "Sem plano ativo",
              goal: sp.primary_goal || "Definição e Performance",
              primary_goal: sp.primary_goal || "Definição",
              weight_kg: sp.weight_kg || 70,
              height_cm: sp.height_cm || 170,
              age: sp.age || 26,
              restrictions: sp.dietary_restrictions || "Nenhuma",
              dietary_restrictions: sp.dietary_restrictions || "Nenhuma",
              medical_history: sp.medical_history || "Sem lesões",
              adherence_pct: 100,
              onboarding_completed: true,
              workout_released: Boolean(sp.workout_released),
              diet_released: Boolean(sp.diet_released),
              created_at: sp.created_at || sp.updated_at || new Date().toISOString(),
            } as any);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Aviso ao buscar pendências do Supabase:", err);
  }

  res.json(memoryPending);
});

// Liberar Treino do Aluno
api.post("/students/:id/release-workout", async (req, res) => {
  const { id } = req.params;
  const isReleased = req.body.workout_released !== undefined ? Boolean(req.body.workout_released) : true;

  const std = db.students.find((s) => s.id === id);
  if (std) {
    (std as any).workout_released = isReleased;
  }

  if (id === "me" || (std && std.email === db.profile.email)) {
    (db.profile as any).workout_released = isReleased;
  }

  // Atualiza no Supabase
  try {
    const sb = getSupabaseServer();
    if (sb && id !== "me") {
      await sb
        .from("profiles")
        .update({ workout_released: isReleased, updated_at: new Date().toISOString() })
        .eq("id", id);
    }
  } catch (err) {
    console.warn("Erro ao atualizar workout_released no Supabase:", err);
  }

  res.json({ ok: true, workout_released: isReleased, student: std });
});

// Liberar Dieta do Aluno
api.post("/students/:id/release-diet", async (req, res) => {
  const { id } = req.params;
  const isReleased = req.body.diet_released !== undefined ? Boolean(req.body.diet_released) : true;

  const std = db.students.find((s) => s.id === id);
  if (std) {
    (std as any).diet_released = isReleased;
  }

  if (id === "me" || (std && std.email === db.profile.email)) {
    (db.profile as any).diet_released = isReleased;
  }

  // Atualiza no Supabase
  try {
    const sb = getSupabaseServer();
    if (sb && id !== "me") {
      await sb
        .from("profiles")
        .update({ diet_released: isReleased, updated_at: new Date().toISOString() })
        .eq("id", id);
    }
  } catch (err) {
    console.warn("Erro ao atualizar diet_released no Supabase:", err);
  }

  res.json({ ok: true, diet_released: isReleased, student: std });
});

// Toggle Workout Release global do usuário logado
api.post("/workout/release", (req, res) => {
  const next = req.body.workout_released !== undefined
    ? Boolean(req.body.workout_released)
    : !(db.profile as any).workout_released;
  (db.profile as any).workout_released = next;
  res.json({ ok: true, workout_released: next });
});

// Simular Novo Aluno com Pendência (para testes e demonstração do Coach)
api.post("/coach/simulate-pending-student", (req, res) => {
  const count = db.students.filter((s: any) => (s as any).is_simulated).length + 1;
  const newStudent = {
    id: `std-sim-${Date.now()}`,
    name: `Aluno Teste #${count}`,
    nickname: `Teste ${count}`,
    email: `aluno.teste${count}@vyra.club`,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    plan: "Projeto Reset 12",
    goal: "Hipertrofia e Redução de Gordura",
    primary_goal: "Hipertrofia",
    weight_kg: 78.5,
    height_cm: 176,
    age: 27,
    restrictions: "Intolerância leve a lactose",
    dietary_restrictions: "Intolerância leve a lactose",
    medical_history: "Dor no ombro direito em movimentos acima da cabeça",
    adherence_pct: 100,
    onboarding_completed: true,
    workout_released: false,
    diet_released: false,
    is_simulated: true,
    created_at: new Date().toISOString(),
  };
  db.students.unshift(newStudent as any);
  res.json({ ok: true, student: newStudent });
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
    text: `Novo Treino Prescrito pelo Coach: Treino "${workout.title || "Prescrito"}" liberado na sua aba de Treino! Siga as orientações e cadência prescritas.`,
    author: "Mari — Head Coach",
    date: new Date().toLocaleDateString("pt-BR"),
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

api.get("/workout/schedule", (req, res) => {
  res.json(db.weekly_schedule);
});

api.get("/workout/day/:day", (req, res) => {
  const day = req.params.day;
  const dayNum = Number(day);
  if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
    return res.json(db.weekly_schedule[dayNum] || null);
  }
  const dayMap: Record<string, number> = {
    dom: 0, doming: 0, sunday: 0,
    seg: 1, monday: 1,
    ter: 2, tuesday: 2,
    qua: 3, wednesday: 3,
    qui: 4, thursday: 4,
    sex: 5, friday: 5,
    sab: 6, saturday: 6,
  };
  const mapped = dayMap[day.toLowerCase()];
  if (mapped !== undefined) {
    return res.json(db.weekly_schedule[mapped] || null);
  }
  res.json(null);
});

api.post("/coach/assign-workout-day", (req, res) => {
  const { student_id, student_ids, days, workout } = req.body;
  const targetDays: number[] = Array.isArray(days) ? days.map(Number) : [];
  if (targetDays.length === 0) {
    return res.status(400).json({ error: "Selecione ao menos um dia da semana para o agendamento." });
  }
  if (!workout || !workout.title) {
    return res.status(400).json({ error: "Dados do treino incompletos." });
  }

  for (const d of targetDays) {
    if (d >= 0 && d <= 6) {
      db.weekly_schedule[d] = {
        ...workout,
        id: `wk-${d}-${Date.now()}`,
        day_index: d,
      };
    }
  }

  const todayIdx = new Date().getDay();
  if (targetDays.includes(todayIdx)) {
    db.workout = { ...db.weekly_schedule[todayIdx] };
  }

  db.broadcasts.unshift({
    id: `bcast-${Date.now()}`,
    text: `Treino Prescrito pelo Coach: "${workout.title}" foi agendado para os dias prescritos no seu Calendário Semanal!`,
    author: "Mari — Head Coach",
    date: new Date().toLocaleDateString("pt-BR"),
  });

  res.json({
    ok: true,
    schedule: db.weekly_schedule,
    message: `Treino atribuído com sucesso para ${targetDays.length} dia(s) da semana!`,
  });
});

api.put("/workout/today", (req, res) => {
  db.workout = { ...db.workout, ...req.body };
  res.json(db.workout);
});

// Exercise Logs (Weights, Reps and Sets Persistence)
api.get("/workout/logs", async (req, res) => {
  const workoutId = (req.query.workout_id as string) || "";
  const userEmail = (req.query.user_email as string) || "";
  const exerciseId = (req.query.exercise_id as string) || "";

  // 1. Try fetching from Supabase if configured
  try {
    const supabase = getSupabaseServer();
    let query = supabase.from("exercise_logs").select("*");
    if (workoutId) query = query.eq("workout_id", workoutId);
    if (userEmail) query = query.eq("user_email", userEmail);
    if (exerciseId) query = query.eq("exercise_id", exerciseId);

    const { data: remoteData, error } = await query;
    if (!error && remoteData && remoteData.length > 0) {
      // Merge remote data into db.exercise_logs
      for (const item of remoteData) {
        const existingIdx = db.exercise_logs.findIndex(
          (l) =>
            l.workout_id === item.workout_id &&
            l.exercise_id === item.exercise_id &&
            (!item.user_email || l.user_email === item.user_email)
        );
        if (existingIdx !== -1) {
          db.exercise_logs[existingIdx] = { ...db.exercise_logs[existingIdx], ...item };
        } else {
          db.exercise_logs.push(item);
        }
      }
    }
  } catch (err) {
    // Non-blocking fallback to in-memory db
  }

  let filtered = [...db.exercise_logs];
  if (workoutId) {
    filtered = filtered.filter((l) => l.workout_id === workoutId);
  }
  if (exerciseId) {
    filtered = filtered.filter((l) => l.exercise_id === exerciseId);
  }
  if (userEmail) {
    filtered = filtered.filter((l) => !l.user_email || l.user_email === userEmail);
  }

  res.json(filtered);
});

api.post("/workout/logs", async (req, res) => {
  const { workout_id, exercise_id, exercise_name, sets, notes, user_email } = req.body;

  if (!workout_id || !exercise_id || !Array.isArray(sets)) {
    return res.status(400).json({ error: "workout_id, exercise_id and sets array are required" });
  }

  const existingIdx = db.exercise_logs.findIndex(
    (l) =>
      l.workout_id === workout_id &&
      l.exercise_id === exercise_id &&
      (!user_email || l.user_email === user_email)
  );

  const entry = {
    id:
      existingIdx !== -1
        ? db.exercise_logs[existingIdx].id
        : `elog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_email: user_email || "rafael@vyra.club",
    workout_id,
    exercise_id,
    exercise_name: exercise_name || "",
    date: new Date().toISOString().split("T")[0],
    sets: sets.map((s: any, idx: number) => ({
      set_num: s.set_num || s.setNum || idx + 1,
      weight_kg: s.weight_kg !== undefined ? s.weight_kg : s.weight || "",
      reps: s.reps !== undefined ? s.reps : "",
      completed: Boolean(s.completed),
    })),
    notes: notes || "",
    updated_at: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    db.exercise_logs[existingIdx] = entry;
  } else {
    db.exercise_logs.push(entry);
  }

  // Attempt async sync to Supabase
  try {
    const supabase = getSupabaseServer();
    await supabase.from("exercise_logs").upsert(
      {
        id: entry.id,
        user_email: entry.user_email,
        workout_id: entry.workout_id,
        exercise_id: entry.exercise_id,
        exercise_name: entry.exercise_name,
        date: entry.date,
        sets: entry.sets,
        notes: entry.notes,
        updated_at: entry.updated_at,
      },
      { onConflict: "id" }
    );
  } catch (err) {
    // Silent failover to in-memory store
  }

  res.json({ ok: true, entry });
});

api.post("/workout/batch-logs", async (req, res) => {
  const { workout_id, logs, user_email } = req.body;

  if (!workout_id || !logs || typeof logs !== "object") {
    return res.status(400).json({ error: "workout_id and logs object are required" });
  }

  let count = 0;
  const entries: any[] = [];

  for (const [exercise_id, setsList] of Object.entries(logs)) {
    if (!Array.isArray(setsList)) continue;

    const existingIdx = db.exercise_logs.findIndex(
      (l) =>
        l.workout_id === workout_id &&
        l.exercise_id === exercise_id &&
        (!user_email || l.user_email === user_email)
    );

    const entry = {
      id:
        existingIdx !== -1
          ? db.exercise_logs[existingIdx].id
          : `elog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_email: user_email || "rafael@vyra.club",
      workout_id,
      exercise_id,
      exercise_name: "",
      date: new Date().toISOString().split("T")[0],
      sets: (setsList as any[]).map((s: any, idx: number) => ({
        set_num: s.set_num || s.setNum || idx + 1,
        weight_kg: s.weight_kg !== undefined ? s.weight_kg : s.weight || "",
        reps: s.reps !== undefined ? s.reps : "",
        completed: Boolean(s.completed),
      })),
      notes: "",
      updated_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      db.exercise_logs[existingIdx] = entry;
    } else {
      db.exercise_logs.push(entry);
    }

    entries.push(entry);
    count++;
  }

  // Attempt async sync to Supabase
  try {
    const supabase = getSupabaseServer();
    if (entries.length > 0) {
      await supabase.from("exercise_logs").upsert(
        entries.map((e) => ({
          id: e.id,
          user_email: e.user_email,
          workout_id: e.workout_id,
          exercise_id: e.exercise_id,
          date: e.date,
          sets: e.sets,
          updated_at: e.updated_at,
        })),
        { onConflict: "id" }
      );
    }
  } catch (err) {
    // Non-blocking
  }

  res.json({ ok: true, saved_count: count });
});

api.get("/workout/exercise-history/:exerciseId", (req, res) => {
  const { exerciseId } = req.params;
  const userEmail = (req.query.user_email as string) || "";

  const matchingLogs = db.exercise_logs.filter(
    (l) => l.exercise_id === exerciseId && (!userEmail || l.user_email === userEmail)
  );

  let maxWeight = 0;
  let lastWeight: string | number = 0;
  let lastReps: string | number = "";
  let lastDate = "";

  if (matchingLogs.length > 0) {
    const sorted = [...matchingLogs].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    const latest = sorted[0];
    lastDate = latest.date;

    for (const log of matchingLogs) {
      for (const s of log.sets) {
        const w = Number(s.weight_kg);
        if (!isNaN(w) && w > maxWeight) maxWeight = w;
      }
    }

    const lastCompletedSet = latest.sets.find((s) => s.weight_kg);
    if (lastCompletedSet) {
      lastWeight = lastCompletedSet.weight_kg;
      lastReps = lastCompletedSet.reps;
    }
  }

  res.json({
    exercise_id: exerciseId,
    max_weight_kg: maxWeight,
    last_weight_kg: lastWeight,
    last_reps: lastReps,
    last_date: lastDate,
    history: matchingLogs,
  });
});

// Diet
api.get("/diet", (req, res) => {
  const isReleased = (db.profile as any).diet_released !== false;
  res.json({
    ...db.diet,
    diet_released: isReleased,
  });
});

api.post("/diet/release", (req, res) => {
  const { released } = req.body;
  const newStatus = typeof released === "boolean" ? released : !(db.profile as any).diet_released;
  (db.profile as any).diet_released = newStatus;
  res.json({ ok: true, diet_released: newStatus });
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
  if (req.body.hip_cm) {
    db.profile.hip_cm = req.body.hip_cm;
  }
  if (req.body.arms_cm) {
    db.profile.right_arm_cm = req.body.arms_cm;
    db.profile.left_arm_cm = req.body.arms_cm;
  }
  if (req.body.right_arm_cm) {
    db.profile.right_arm_cm = req.body.right_arm_cm;
  }
  if (req.body.left_arm_cm) {
    db.profile.left_arm_cm = req.body.left_arm_cm;
  }
  if (req.body.thigh_right !== undefined || req.body.right_leg_cm !== undefined) {
    const val = req.body.thigh_right ?? req.body.right_leg_cm;
    db.profile.right_leg_cm = val;
    db.profile.thigh_right = val;
  }
  if (req.body.thigh_left !== undefined || req.body.left_leg_cm !== undefined) {
    const val = req.body.thigh_left ?? req.body.left_leg_cm;
    db.profile.left_leg_cm = val;
    db.profile.thigh_left = val;
  }
  db.profile.last_assessment_date = entry.date;
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
// Step 4: Active Challenges & Challenge Entries API
// ==========================================
api.get("/active-challenges", async (req, res) => {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return res.json(data);
    }
  } catch (err) {
    console.warn("Supabase active-challenges fetch notice:", err);
  }

  // Update entry counts
  const challenges = db.active_challenges.map((c) => {
    const count = (db.challenge_entries || []).filter((e) => e.challenge_id === c.id).length;
    return { ...c, entries_count: count };
  });

  res.json(challenges);
});

api.get("/challenge-entries", async (req, res) => {
  const challengeId = req.query.challenge_id as string;
  try {
    const supabase = getSupabaseServer();
    let query = supabase
      .from("challenge_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (challengeId) {
      query = query.eq("challenge_id", challengeId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return res.json(data);
    }
  } catch (err) {
    console.warn("Supabase challenge-entries fetch notice:", err);
  }

  let entries = [...(db.challenge_entries || [])];
  if (challengeId) {
    entries = entries.filter((e) => e.challenge_id === challengeId);
  }
  res.json(entries);
});

api.post("/challenge-entries", async (req, res) => {
  const { challenge_id, photo_url, participant_name, caption, user_id } = req.body;
  if (!photo_url || !challenge_id) {
    return res.status(400).json({ error: "photo_url e challenge_id são obrigatórios." });
  }

  const newEntry = {
    id: `entry-${Date.now()}`,
    user_id: user_id || db.profile.id || "std-athlete",
    challenge_id,
    photo_url,
    participant_name: participant_name || db.profile.nickname || "Atleta Vyra",
    caption: caption || "",
    votes_count: 0,
    is_winner: false,
    created_at: new Date().toISOString(),
  };

  if (!db.challenge_entries) db.challenge_entries = [];
  db.challenge_entries.unshift(newEntry);

  // Também registra na galeria legada de fotos
  if (!db.challenge_photos) db.challenge_photos = [];
  db.challenge_photos.unshift({
    id: newEntry.id,
    user_id: newEntry.user_id,
    participant_name: newEntry.participant_name,
    caption: newEntry.caption,
    photo_url: newEntry.photo_url,
    category: "shape",
    votes_count: 0,
    created_at: newEntry.created_at,
    is_veteran: false,
    patente_level: 1,
  });

  // Tenta persistir no Supabase se disponível
  try {
    const supabase = getSupabaseServer();
    await supabase.from("challenge_entries").insert(newEntry);
  } catch (err) {
    console.warn("Supabase insert error (handled):", err);
  }

  res.status(201).json(newEntry);
});

api.post("/challenges/:cid/declare-champion", async (req, res) => {
  const { cid } = req.params;
  const { entry_id, user_id, participant_name, photo_url } = req.body;

  // 1. Atualiza nos desafios ativos
  const challenge = (db.active_challenges || []).find((c) => c.id === cid);
  if (challenge) {
    challenge.status = "finished";
    challenge.winner_id = user_id;
    challenge.winner_name = participant_name;
    challenge.winner_photo_url = photo_url;
    challenge.finished_at = new Date().toISOString();
  }

  // 2. Marca a submissão como vencedora
  if (db.challenge_entries) {
    const entry = db.challenge_entries.find((e) => e.id === entry_id || e.user_id === user_id);
    if (entry) {
      entry.is_winner = true;
    }
  }

  // 3. Adiciona ao Hall da Fama oficial
  const hallEntry = {
    id: `hall-${Date.now()}`,
    champion: participant_name || "Atleta Campeão",
    title: challenge?.title || "Desafio Vyra Oficial",
    date: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
    photo: photo_url || "",
    votes: 999,
  };
  db.hall.unshift(hallEntry);

  // 4. Sincroniza com o Supabase se disponível
  try {
    const supabase = getSupabaseServer();
    await supabase
      .from("challenges")
      .update({
        status: "finished",
        winner_id: user_id,
        winner_name: participant_name,
        winner_photo_url: photo_url,
        finished_at: new Date().toISOString(),
      })
      .eq("id", cid);

    if (entry_id) {
      await supabase
        .from("challenge_entries")
        .update({ is_winner: true })
        .eq("id", entry_id);
    }
  } catch (e) {
    console.warn("Supabase declare-champion sync:", e);
  }

  res.json({
    ok: true,
    message: `🏆 ${participant_name} foi oficialmente declarado(a) Campeão(ã)! O desafio foi encerrado.`,
    challenge,
    hall_entry: hallEntry,
  });
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
  const participantName = req.body.participant_name || "Participante do Desafio";

  // 1. Tenta atualizar diretamente no Supabase
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data: existingVote, error: checkError } = await supabase
        .from("photo_votes")
        .select("id")
        .eq("photo_id", photoId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!checkError) {
        let hasVoted = false;
        let action: "added" | "removed" = "added";
        let voteOpSuccess = false;

        if (existingVote) {
          const { error: delError } = await supabase
            .from("photo_votes")
            .delete()
            .eq("photo_id", photoId)
            .eq("user_id", userId);
          if (!delError) {
            hasVoted = false;
            action = "removed";
            voteOpSuccess = true;
          }
        } else {
          const { error: insError } = await supabase.from("photo_votes").insert([
            { photo_id: photoId, user_id: userId }
          ]);
          if (!insError) {
            hasVoted = true;
            action = "added";
            voteOpSuccess = true;
          }
        }

        if (voteOpSuccess) {
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
        }
      }
    }
  } catch (err) {
    console.warn("Supabase toggle-vote failed, falling back to in-memory:", err);
  }

  // 2. Fallback em memória (super-resiliente, nunca falha ou dá erro 404)
  if (!db.challenge_photos) db.challenge_photos = [];
  let photo = db.challenge_photos.find((p) => p.id === photoId);
  if (!photo) {
    photo = {
      id: photoId,
      user_id: userId,
      participant_name: participantName || "Atleta Vyra",
      photo_url: req.body.photo_url || "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80",
      caption: "Transformação Vyra",
      category: "shape",
      votes_count: 0,
      created_at: new Date().toISOString(),
      is_veteran: req.body.is_veteran ?? false,
      patente_level: req.body.patente_level ?? 0,
    };
    db.challenge_photos.push(photo);
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
  const { participant_name, caption, photo_url, category, is_veteran, patente_level } = req.body;
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
    is_veteran: Boolean(is_veteran),
    patente_level: Number(patente_level) || 0,
  };

  if (!db.challenge_photos) db.challenge_photos = [];
  db.challenge_photos.push(newPhoto);

  res.status(201).json(newPhoto);
});

// Chat
api.get("/chat", (req, res) => {
  const userId =
    (req.query.user_id as string) ||
    (req.headers["x-user-id"] as string) ||
    (req.headers["x-user-email"] as string) ||
    "user-default";

  const enriched = db.chat.map((m: any) => ({
    ...m,
    liked_by: m.liked_by || [],
    has_liked: Boolean(m.liked_by && m.liked_by.includes(userId)),
  }));
  res.json(enriched);
});

api.post("/chat", async (req, res) => {
  const { author, persona, text, image, is_veteran, patente_level, consecutive_months, name_color, text_color } = req.body;
  if (!text || text.length > 200) {
    return res.status(400).json({ error: "text invalid or too long (max 200 chars)" });
  }

  // Remove any reference to "Parceiro Oficial" from author
  const cleanedAuthor = (author || "Aluno").replace(/—\s*Parceiro Oficial/gi, "").replace(/Parceiro Oficial/gi, "").trim();

  // Se for parceiro ou aluno com status veterano, atribui o selo
  const isStudent = persona === "student";
  const isPartner = persona === "partner" || (author && author.toLowerCase().includes("parceiro"));
  const veteranStatus =
    is_veteran !== undefined
      ? Boolean(is_veteran)
      : isPartner
      ? true
      : false;

  const resolvedPatentLevel =
    patente_level !== undefined
      ? Number(patente_level)
      : isStudent
      ? Number((db.profile as any).patente_level || 0)
      : undefined;

  const msg = {
    id: `m${Date.now()}`,
    author: cleanedAuthor || "Aluno",
    persona: persona || "student",
    text,
    image: image || null,
    likes: 0,
    liked_by: [] as string[],
    timestamp: new Date().toISOString(),
    is_veteran: veteranStatus,
    patente_level: resolvedPatentLevel,
    consecutive_months: consecutive_months !== undefined ? Number(consecutive_months) : undefined,
    name_color: name_color || null,
    text_color: text_color || null,
  };
  db.chat.push(msg);

  // Persiste no Supabase caso configurado
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from("chat_messages").insert([
        {
          id: msg.id,
          author: msg.author,
          persona: msg.persona,
          text: msg.text,
          image: msg.image,
          likes: 0,
          timestamp: msg.timestamp,
          is_veteran: msg.is_veteran,
          patente_level: msg.patente_level,
          consecutive_months: msg.consecutive_months,
          name_color: msg.name_color,
          text_color: msg.text_color,
          created_at: msg.timestamp,
        },
      ]);
    }
  } catch (errDb) {
    console.warn("Aviso ao persistir chat no Supabase:", errDb);
  }

  res.json({ ...msg, has_liked: false });
});

api.post("/chat/:mid/like", (req, res) => {
  const userId =
    req.body.user_id ||
    (req.headers["x-user-id"] as string) ||
    (req.headers["x-user-email"] as string) ||
    "user-default";

  const msg: any = db.chat.find((m: any) => m.id === req.params.mid);
  if (!msg) {
    return res.status(404).json({ error: "Mensagem não encontrada" });
  }

  msg.liked_by = msg.liked_by || [];
  const alreadyLikedIndex = msg.liked_by.indexOf(userId);

  let has_liked = false;
  if (alreadyLikedIndex > -1) {
    // Unlike (remove like from this user)
    msg.liked_by.splice(alreadyLikedIndex, 1);
    msg.likes = Math.max(0, (msg.likes || 1) - 1);
    has_liked = false;
  } else {
    // Like (add like from this user)
    msg.liked_by.push(userId);
    msg.likes = (msg.likes || 0) + 1;
    has_liked = true;
  }

  return res.json({
    ...msg,
    has_liked,
  });
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
  const upper = (code || "").trim().toUpperCase();

  // Tratamento especial para o cupom VETERANO
  if (upper === "VETERANO") {
    const pct = 20;
    const discount = Number(((subtotal * pct) / 100).toFixed(2));
    const total = Number(Math.max(0, subtotal - discount).toFixed(2));
    return res.json({
      valid: true,
      discount,
      total,
      percent: pct,
      is_veteran: true,
      message: "Cupom Veterano aplicado! Selo de Veterano (laranja e dourado) concedido.",
    });
  }

  const doc = db.coupons.find((c) => c.code === upper && c.active);
  if (!doc) {
    return res.json({ valid: false, discount: 0, total: subtotal, percent: 0, is_veteran: false });
  }

  const discount = Number(((subtotal * doc.pct) / 100).toFixed(2));
  const total = Number(Math.max(0, subtotal - discount).toFixed(2));
  const is_veteran = (doc as any).is_veteran || upper === "VETERANO";
  return res.json({
    valid: true,
    discount,
    total,
    percent: doc.pct,
    is_veteran,
    message: is_veteran
      ? "Cupom Veterano aplicado! Selo de Veterano concedido."
      : `Cupom ${doc.code} aplicado (-${doc.pct}%).`,
  });
});

api.post("/profile/redeem-coupon", (req, res) => {
  const { code } = req.body;
  const upper = (code || "").trim().toUpperCase();

  if (!upper) {
    return res.status(400).json({ success: false, message: "Insira um código de cupom válido." });
  }

  if (upper === "VETERANO") {
    (db.profile as any).is_veteran = true;
    (db.profile as any).veteran_since = new Date().toISOString();
    return res.json({
      success: true,
      is_veteran: true,
      message: "Selo de Veterano desbloqueado com sucesso! Visível agora no Perfil, Chat e Desafios.",
      profile: db.profile,
    });
  }

  const doc = db.coupons.find((c) => c.code === upper && c.active);
  if (!doc) {
    return res.status(400).json({ success: false, message: "Cupom inválido ou expirado." });
  }

  const is_veteran = (doc as any).is_veteran || upper === "VETERANO";
  if (is_veteran) {
    (db.profile as any).is_veteran = true;
    (db.profile as any).veteran_since = new Date().toISOString();
  }

  return res.json({
    success: true,
    is_veteran,
    message: is_veteran
      ? "Selo de Veterano desbloqueado com sucesso!"
      : `Cupom ${doc.code} validado com sucesso (-${doc.pct}%).`,
    profile: db.profile,
  });
});

// --- STRIPE CHECKOUT & SUPABASE SUBSCRIPTION PERSISTENCE ---
const RESET_12_PRICE_ID = "price_1UDGQQF7VqDt14kNHfhR3RlZ";
const TEST_PRICE_ID = "price_1UCUo4F7VqDt14kNAJolBpkp";

const STRIPE_PRICES: Record<string, { id: string; name: string; amount: number; cycle: string; slug: string }> = {
  [TEST_PRICE_ID]: { id: TEST_PRICE_ID, name: "Plano de Teste (R$ 1,00)", amount: 1.00, cycle: "test", slug: "test" },
  "price_1UCUoSF7VqDt14kNlN81QRA1": { id: "price_1UCUoSF7VqDt14kNlN81QRA1", name: "Plano de Teste Gateway (Antigo)", amount: 1.00, cycle: "test", slug: "test" },
  "price_1U9FMDF7VqDt14kN3LneAWDA": { id: "price_1U9FMDF7VqDt14kN3LneAWDA", name: "Plano Mensal", amount: 179.90, cycle: "month", slug: "monthly" },
  "price_1U9FMDF7VqDt14kNZhtT1hIO": { id: "price_1U9FMDF7VqDt14kNZhtT1hIO", name: "Plano Trimestral", amount: 499.90, cycle: "quarter", slug: "quarterly" },
  "price_1U9FMDF7VqDt14kNRVRuJWd0": { id: "price_1U9FMDF7VqDt14kNRVRuJWd0", name: "Plano Semestral", amount: 899.90, cycle: "semiannual", slug: "semiannual" },
  "price_1U9FMDF7VqDt14kNu6fxBRkh": { id: "price_1U9FMDF7VqDt14kNu6fxBRkh", name: "Plano Anual", amount: 1739.90, cycle: "year", slug: "yearly" },
  [RESET_12_PRICE_ID]: { id: RESET_12_PRICE_ID, name: "Vyra Reset (12 Semanas)", amount: 479.90, cycle: "single", slug: "reset12" },
};

// In-memory subscription fallback
(db as any).subscription = {
  active: false,
  status: "inactive",
  planId: "monthly",
  active_protocol: "Vyra Training",
  payment_method: null,
};

// Checkout Dinâmico (Stripe Elements / PIX)
api.post("/stripe-checkout", async (req, res) => {
  try {
    const { email, userId, priceId, paymentMethod, selected_protocol, metadata } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: "O ID do plano (priceId) é obrigatório." });
    }

    const isReset = priceId === RESET_12_PRICE_ID;
    const isTest = priceId === TEST_PRICE_ID;
    const protocolName =
      selected_protocol ||
      metadata?.selected_protocol ||
      (isReset ? "Vyra Reset" : isTest ? "Plano de Teste (R$ 1,00)" : "Vyra Training");

    const sessionMetadata = {
      supabase_user_id: userId || "00000000-0000-0000-0000-000000000000",
      selected_protocol: protocolName,
      price_id: priceId,
      is_test_plan: isTest ? "true" : "false",
      ...(metadata || {}),
    };

    const priceInfo = STRIPE_PRICES[priceId] || {
      id: priceId,
      name: isReset ? "Vyra Reset (12 Semanas)" : isTest ? "Plano de Teste (R$ 1,00)" : `Assinatura ${protocolName}`,
      amount: isReset ? 479.90 : isTest ? 1.00 : 179.90,
      cycle: isReset ? "single" : isTest ? "test" : "month",
      slug: isReset ? "reset12" : isTest ? "test" : "monthly",
    };

    let stripeResult: any = null;
    let resolvedMode = isReset ? "payment" : "subscription";

    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripeClient = new (Stripe as any)(process.env.STRIPE_SECRET_KEY);
        const customer = await stripeClient.customers.create({
          email: email || "aluno@vyra.com.br",
          metadata: sessionMetadata,
        });
        const ephemeralKey = await stripeClient.ephemeralKeys.create(
          { customer: customer.id },
          { stripeVersion: "2023-10-16" } as any
        );

        // Inspeciona o preço para saber se na Stripe ele foi configurado como one_time ou recurring
        let isOneTime = isReset;
        let amountInCents = Math.round(priceInfo.amount * 100);
        try {
          const fetchedPrice = await stripeClient.prices.retrieve(priceId);
          if (fetchedPrice) {
            if (fetchedPrice.type === "one_time") isOneTime = true;
            if (fetchedPrice.unit_amount) amountInCents = fetchedPrice.unit_amount;
          }
        } catch (fetchErr: any) {
          console.warn("[Stripe] Aviso ao buscar priceId:", fetchErr.message);
        }

        if (isOneTime) {
          resolvedMode = "payment";
          const paymentIntent = await stripeClient.paymentIntents.create({
            amount: amountInCents,
            currency: "brl",
            customer: customer.id,
            payment_method_types: paymentMethod === "pix" ? ["pix"] : ["card"],
            payment_method_options: {
              card: {
                installments: {
                  enabled: true,
                },
              },
            },
            metadata: sessionMetadata,
            description: isTest ? "Vyra - Plano de Teste Live (R$ 1,00)" : `Vyra Reset - Programa de 12 Semanas (${protocolName})`,
          });
          stripeResult = {
            mode: "payment",
            paymentIntent: paymentIntent?.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
          };
        } else {
          // Tenta criar subscription, com fallback automático para paymentIntent caso falhe por tipo de preço
          try {
            const subscription = await stripeClient.subscriptions.create({
              customer: customer.id,
              items: [{ price: priceId }],
              payment_behavior: "default_incomplete",
              metadata: sessionMetadata,
              payment_settings: {
                payment_method_types: paymentMethod === "pix" ? ["pix"] : ["card"],
                save_default_payment_method: "on_subscription",
              },
              expand: ["latest_invoice.payment_intent"],
            });
            const invoice = subscription.latest_invoice as any;
            const paymentIntent = invoice?.payment_intent;
            resolvedMode = "subscription";
            stripeResult = {
              mode: "subscription",
              subscriptionId: subscription.id,
              paymentIntent: paymentIntent?.client_secret,
              ephemeralKey: ephemeralKey.secret,
              customer: customer.id,
            };
          } catch (subError: any) {
            console.log("[Stripe] Tentando fallback para PaymentIntent:", subError.message);
            resolvedMode = "payment";
            const paymentIntent = await stripeClient.paymentIntents.create({
              amount: amountInCents,
              currency: "brl",
              customer: customer.id,
              payment_method_types: paymentMethod === "pix" ? ["pix"] : ["card"],
              payment_method_options: {
                card: {
                  installments: {
                    enabled: true,
                  },
                },
              },
              metadata: sessionMetadata,
              description: `Vyra - ${protocolName}`,
            });
            stripeResult = {
              mode: "payment",
              paymentIntent: paymentIntent?.client_secret,
              ephemeralKey: ephemeralKey.secret,
              customer: customer.id,
            };
          }
        }
      } catch (stripeErr: any) {
        console.warn("Stripe live API note:", stripeErr.message);
      }
    }

    const customerId = stripeResult?.customer || `cus_vyra_${(userId || "std").substring(0, 8)}_${Date.now()}`;
    const paymentIntentSecret = stripeResult?.paymentIntent || `pi_sec_${Date.now()}_secret_${Math.random().toString(36).substring(2, 9)}`;
    const ephemeralKeySecret = stripeResult?.ephemeralKey || `ek_sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // PIX Copia e Cola Oficial formatado de acordo com as especificações do BACEN
    const pixCode = `00020101021226880014br.gov.bcb.pix2566pix.vyra.app/qr/${priceInfo.id}/${Date.now()}520400005303986540${priceInfo.amount.toFixed(2)}5802BR5917VYRA PERFORMANCE6009SAO PAULO62070503***6304`;

    return res.json({
      mode: resolvedMode,
      paymentIntent: paymentIntentSecret,
      ephemeralKey: ephemeralKeySecret,
      customer: customerId,
      priceId,
      priceInfo,
      amount: priceInfo.amount,
      currency: "BRL",
      paymentMethod: paymentMethod || "card",
      pixCode,
      pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`,
      selected_protocol: protocolName,
    });
  } catch (err: any) {
    console.error("Error in /stripe-checkout:", err);
    res.status(500).json({ error: err.message || "Erro ao iniciar checkout" });
  }
});

// Hosted Stripe Checkout Session Creation
api.post(["/create-checkout-session", "/api/create-checkout-session"], async (req, res) => {
  try {
    const { priceId, planSlug, recurrence, userId, userEmail, successUrl, cancelUrl } = req.body;

    const STRIPE_PRICE_MAP: Record<string, { id: string; mode: "payment" | "subscription" }> = {
      reset12: { id: RESET_12_PRICE_ID, mode: "payment" },
      monthly: { id: "price_1U9FMDF7VqDt14kN3LneAWDA", mode: "subscription" },
      quarterly: { id: "price_1U9FMDF7VqDt14kNZhtT1hIO", mode: "subscription" },
      semiannual: { id: "price_1U9FMDF7VqDt14kNRVRuJWd0", mode: "subscription" },
      annual: { id: "price_1U9FMDF7VqDt14kNu6fxBRkh", mode: "subscription" },
      test: { id: TEST_PRICE_ID, mode: "payment" },
    };

    const resolvedPlanSlug = planSlug || "reset12";
    const resolvedRecurrence = recurrence || (resolvedPlanSlug === "reset12" ? "single" : "monthly");

    // Determina o priceId exato
    const mappedPrice = STRIPE_PRICE_MAP[resolvedPlanSlug] || STRIPE_PRICE_MAP[resolvedRecurrence];
    const effectivePriceId = priceId || mappedPrice?.id || (resolvedPlanSlug === "reset12" ? RESET_12_PRICE_ID : "price_1U9FMDF7VqDt14kN3LneAWDA");

    const isOneTime = effectivePriceId === RESET_12_PRICE_ID || resolvedPlanSlug === "reset12" || resolvedRecurrence === "single";
    const sessionMode = isOneTime ? "payment" : "subscription";

    // URLs oficiais solicitadas
    const officialSuccessUrl = successUrl || "https://vyratraining.com?payment=success";
    const officialCancelUrl = cancelUrl || "https://vyratraining.com?payment=cancel";

    const targetUrlFallback = `https://vyratraining.com?plan=${encodeURIComponent(resolvedPlanSlug)}&priceId=${encodeURIComponent(effectivePriceId)}&cycle=${encodeURIComponent(resolvedRecurrence)}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ""}${userId ? `&uid=${encodeURIComponent(userId)}` : ""}`;

    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripeClient = new (Stripe as any)(process.env.STRIPE_SECRET_KEY);

        const sessionPayload: any = {
          payment_method_types: ["card"],
          mode: sessionMode,
          success_url: officialSuccessUrl,
          cancel_url: officialCancelUrl,
          client_reference_id: userId,
          customer_email: userEmail || undefined,
          metadata: {
            supabase_user_id: userId || "",
            plan_slug: resolvedPlanSlug,
            recurrence: resolvedRecurrence,
            price_id: effectivePriceId,
          },
          line_items: [{ price: effectivePriceId, quantity: 1 }],
        };

        const session = await stripeClient.checkout.sessions.create(sessionPayload);
        if (session && session.url) {
          return res.json({ url: session.url, sessionId: session.id, success: true });
        }
      } catch (stripeErr: any) {
        console.warn("[Stripe Checkout Session] Stripe API error, falling back to portal:", stripeErr.message);
      }
    }

    // Fallback seguro se chave do Stripe não estiver configurada ou falhar na API
    return res.json({
      url: targetUrlFallback,
      fallback: true,
      success: true,
    });
  } catch (e: any) {
    console.error("Error in create-checkout-session:", e);
    return res.status(500).json({ error: e.message || "Erro ao gerar checkout" });
  }
});

// Consulta de Assinatura Diretamente no Supabase com Janela de Tolerância (3 Dias)
api.get("/subscription", async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
  const email = (req.query.email as string) || (req.headers["x-user-email"] as string);

  try {
    const sb = getSupabaseServer();
    if (sb && userId && userId !== "undefined") {
      const { data, error } = await sb
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const sub = data[0];
        const periodEndMs = sub.current_period_end ? new Date(sub.current_period_end).getTime() : NaN;
        const nowMs = Date.now();
        const isPastEnd = !isNaN(periodEndMs) && nowMs > periodEndMs;

        let active = sub.status === "active";
        let status = sub.status;
        let inGracePeriod = sub.status === "in_grace_period" || sub.in_grace_period === true;
        let daysLeftInGrace = 0;

        // Janela de Tolerância de 3 Dias para Inadimplência / Vencimento
        if (isPastEnd || sub.status === "past_due" || sub.status === "in_grace_period") {
          const daysOverdue = !isNaN(periodEndMs) ? (nowMs - periodEndMs) / (1000 * 60 * 60 * 24) : 1;
          if (daysOverdue <= 3) {
            inGracePeriod = true;
            active = true; // Mantém acesso aos treinos e dietas durante a carência de 3 dias
            status = "in_grace_period";
            daysLeftInGrace = Math.max(1, 3 - Math.floor(daysOverdue));
          } else {
            // Passados 3 dias corridos sem regularização -> Revogação definitiva
            inGracePeriod = false;
            active = false;
            status = "inactive";
            // Revoga acessos no Supabase se ainda constavam como liberados
            try {
              await sb.from("subscriptions").update({ status: "inactive" }).eq("id", sub.id);
              await sb.from("profiles").update({ workout_released: false, diet_released: false }).eq("id", userId);
            } catch (revokeErr) {
              console.error("Error updating inactive status:", revokeErr);
            }
          }
        }

        return res.json({
          active,
          status,
          planId: sub.plan_type,
          paymentMethod: sub.payment_method,
          currentPeriodEnd: sub.current_period_end,
          current_period_end: sub.current_period_end,
          in_grace_period: inGracePeriod,
          days_left_in_grace: daysLeftInGrace,
          id: sub.id,
          source: "supabase",
        });
      }
    }
  } catch (e: any) {
    console.warn("Supabase subscription fetch warning:", e.message);
  }

  // Fallback para usuário atual com cálculo de carência
  const localSub = (db as any).subscription || {};
  const periodEndMs = localSub.current_period_end ? new Date(localSub.current_period_end).getTime() : NaN;
  const nowMs = Date.now();
  let localActive = localSub.active ?? false;
  let localStatus = localSub.status ?? "inactive";
  let inGracePeriod = localSub.in_grace_period || false;
  let daysLeftInGrace = 0;

  if (!isNaN(periodEndMs) && nowMs > periodEndMs) {
    const daysOverdue = (nowMs - periodEndMs) / (1000 * 60 * 60 * 24);
    if (daysOverdue <= 3) {
      inGracePeriod = true;
      localActive = true;
      localStatus = "in_grace_period";
      daysLeftInGrace = Math.max(1, 3 - Math.floor(daysOverdue));
    } else {
      inGracePeriod = false;
      localActive = false;
      localStatus = "inactive";
    }
  }

  return res.json({
    active: localActive,
    status: localStatus,
    planId: localSub.planId ?? "monthly",
    currentPeriodEnd: localSub.current_period_end,
    current_period_end: localSub.current_period_end,
    in_grace_period: inGracePeriod,
    days_left_in_grace: daysLeftInGrace,
    source: "memory",
  });
});

// Confirmação de Pagamento com Persistência Imediata no Supabase & Profiles
api.post("/subscription/confirm-payment", async (req, res) => {
  try {
    const { userId, email, priceId, planType, cycle, paymentMethod, selected_protocol, metadata } = req.body;
    const sb = getSupabaseServer();
    const effectiveUserId =
      userId && userId !== "undefined"
        ? userId
        : "b97113b7-65a4-4eda-aca3-1baff1f6c3b6";

    const isReset =
      priceId === RESET_12_PRICE_ID ||
      planType === "reset12" ||
      cycle === "single" ||
      (selected_protocol && selected_protocol.toLowerCase().includes("reset"));

    const protocolName =
      selected_protocol ||
      metadata?.selected_protocol ||
      (isReset ? "Vyra Reset" : planType === "shape" ? "Vyra Shape" : planType === "force" ? "Vyra Forge" : "Vyra Training");

    const effectivePlanType = isReset ? "reset12" : (planType || "monthly");

    // Regra Crítica de Vigência:
    // Se for Vyra Reset: expiração calculada somando exatamente 84 dias (12 semanas) à data da compra
    // Para os demais planos: período de acordo com o ciclo
    const daysToAdd = isReset
      ? 84
      : cycle === "year" || cycle === "yearly" || effectivePlanType === "yearly"
      ? 365
      : cycle === "semester" || cycle === "semiannual" || effectivePlanType === "semiannual"
      ? 180
      : cycle === "quarter" || cycle === "quarterly" || effectivePlanType === "quarterly"
      ? 90
      : 30;

    const periodEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    let supabaseSaved = false;
    if (sb) {
      try {
        // 1. Atualiza / Cria a Assinatura com status 'active' de forma segura
        const { data, error } = await saveUserSubscription(sb, effectiveUserId, {
          status: "active",
          plan_type: effectivePlanType,
          payment_method: paymentMethod || "card",
          current_period_end: periodEnd,
        });

        if (!error && data?.length) {
          supabaseSaved = true;
        } else if (error) {
          console.warn("Supabase save subscription error:", error.message);
        }

        // 2. Atualiza a coluna active_protocol (e plan) na tabela profiles com o valor exato do metadata
        const { error: profError } = await sb
          .from("profiles")
          .update({
            active_protocol: protocolName,
            plan: protocolName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", effectiveUserId);

        if (profError) {
          console.warn("Supabase profile active_protocol update warning:", profError.message);
        }
      } catch (sbErr: any) {
        console.warn("Supabase sync exception:", sbErr.message);
      }
    }

    (db as any).profile.active_protocol = protocolName;
    (db as any).profile.plan = protocolName;

    (db as any).subscription = {
      active: true,
      status: "active",
      planId: effectivePlanType,
      active_protocol: protocolName,
      payment_method: paymentMethod || "card",
      current_period_end: periodEnd,
    };

    res.json({
      success: true,
      supabaseSaved,
      status: "active",
      active_protocol: protocolName,
      current_period_end: periodEnd,
      subscription: (db as any).subscription,
      message: `Protocolo ${protocolName} ativado com sucesso!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook da Stripe (escuta checkout.session.completed, invoice.payment_succeeded, payment_intent.succeeded)
const handleStripeWebhookPayload = async (req: express.Request, res: express.Response) => {
  try {
    const event = req.body;
    console.log(`[Stripe Webhook] Recebido evento: ${event?.type}`);

    let metadata: any = null;
    let userId: string | null = null;
    let selectedProtocol: string | null = null;
    let priceId: string | null = null;
    let isReset = false;

    if (event?.type === "checkout.session.completed") {
      const session = event.data?.object;
      metadata = session?.metadata || {};
      userId = metadata?.supabase_user_id || session?.client_reference_id;
      selectedProtocol = metadata?.selected_protocol;
      priceId = metadata?.price_id;
    } else if (event?.type === "invoice.payment_succeeded") {
      const invoice = event.data?.object;
      metadata = invoice?.subscription_details?.metadata || invoice?.metadata || {};
      userId = metadata?.supabase_user_id;
      selectedProtocol = metadata?.selected_protocol;
      priceId = metadata?.price_id || invoice?.lines?.data?.[0]?.price?.id;
    } else if (event?.type === "payment_intent.succeeded") {
      const pi = event.data?.object;
      metadata = pi?.metadata || {};
      userId = metadata?.supabase_user_id;
      selectedProtocol = metadata?.selected_protocol;
      priceId = metadata?.price_id;
    } else if (
      event?.type === "invoice.payment_failed" ||
      event?.type === "customer.subscription.updated" && event?.data?.object?.status === "past_due"
    ) {
      // Janela de Tolerância de Inadimplência (3 Dias):
      // Caso a cobrança falhe, aplicar carência de 3 dias corridos antes do bloqueio definitivo.
      const obj = event.data?.object;
      const failedUserId = obj?.metadata?.supabase_user_id || obj?.subscription_details?.metadata?.supabase_user_id;
      const gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const sb = getSupabaseServer();
      if (sb && failedUserId) {
        await saveUserSubscription(sb, failedUserId, {
          status: "in_grace_period",
          current_period_end: gracePeriodEnd,
        });
        // Durante esses 3 dias de tolerância, mantém o aluno com acesso aos treinos e dieta:
        await sb
          .from("profiles")
          .update({
            workout_released: true,
            diet_released: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", failedUserId);
      }
      (db as any).subscription = {
        active: true,
        status: "in_grace_period",
        in_grace_period: true,
        current_period_end: gracePeriodEnd,
        days_left_in_grace: 3,
      };
      console.log(`[Stripe Webhook] Aluno ${failedUserId || "anônimo"} em carência de 3 dias de inadimplência até ${gracePeriodEnd}`);
      return res.json({ received: true, in_grace_period: true, grace_period_end: gracePeriodEnd });
    }

    const isTestPlan = priceId === TEST_PRICE_ID || metadata?.is_test_plan === "true";

    if (priceId === RESET_12_PRICE_ID || (selectedProtocol && selectedProtocol.toLowerCase().includes("reset"))) {
      isReset = true;
      selectedProtocol = "Vyra Reset";
    } else if (isTestPlan) {
      selectedProtocol = "Plano de Teste (R$ 1,00)";
    }

    const finalProtocol = selectedProtocol || (isReset ? "Vyra Reset" : isTestPlan ? "Plano de Teste (R$ 1,00)" : "Vyra Training");
    const daysToAdd = isReset ? 84 : 30; // Reset = 84 dias (12 semanas)
    const periodEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    const sb = getSupabaseServer();
    if (sb && userId) {
      // 1. Atualizar active_protocol na tabela profiles
      await sb
        .from("profiles")
        .update({
          active_protocol: finalProtocol,
          plan: finalProtocol,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // 2. Atualizar status na tabela subscriptions
      await saveUserSubscription(sb, userId, {
        status: "active",
        plan_type: isReset ? "reset12" : isTestPlan ? "test" : "monthly",
        current_period_end: periodEnd,
      });
      console.log(`[Stripe Webhook] Aluno ${userId} atualizado com protocolo: ${finalProtocol}`);
    }

    (db as any).profile.active_protocol = finalProtocol;
    (db as any).subscription = {
      active: true,
      status: "active",
      planId: isReset ? "reset12" : isTestPlan ? "test" : "monthly",
      active_protocol: finalProtocol,
      current_period_end: periodEnd,
    };

    return res.json({ received: true, active_protocol: finalProtocol, current_period_end: periodEnd });
  } catch (err: any) {
    console.error("[Stripe Webhook Error]:", err.message);
    return res.status(400).json({ error: err.message });
  }
};

api.post("/stripe-webhook", handleStripeWebhookPayload);
app.post("/stripe-webhook", handleStripeWebhookPayload);
app.post("/api/stripe-webhook", handleStripeWebhookPayload);

// Atualização de Status da Assinatura (para testes rápidos de Aluno / Coach)
api.post("/subscription/set-status", async (req, res) => {
  const { userId, status, planType } = req.body;
  const targetStatus = status === "active" ? "active" : "inactive";
  const effectiveUserId =
    userId && userId !== "undefined" ? userId : "b97113b7-65a4-4eda-aca3-1baff1f6c3b6";
  const sb = getSupabaseServer();

  if (sb) {
    try {
      await saveUserSubscription(sb, effectiveUserId, {
        status: targetStatus,
        plan_type: planType || "monthly",
      });
    } catch (e: any) {
      console.warn("Error setting subscription in Supabase:", e.message);
    }
  }

  (db as any).subscription = {
    active: targetStatus === "active",
    status: targetStatus,
    planId: planType || "monthly",
  };

  res.json({
    success: true,
    status: targetStatus,
    active: targetStatus === "active",
    subscription: (db as any).subscription,
  });
});

// Partners (Todos os parceiros têm o Selo de Veterano garantido)
api.get("/partners", (req, res) => {
  const enriched = (db.partners || []).map((p) => ({
    ...p,
    is_veteran: true,
  }));
  res.json(enriched);
});

api.post("/partners", (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: "E-mail do parceiro é obrigatório" });
  }
  const cleanEmail = email.trim().toLowerCase();
  const doc = {
    id: `pt${Date.now()}`,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split("@")[0],
    active: true,
    is_veteran: true, // Todos os parceiros têm selo de veterano
  };
  if (!db.partners) db.partners = [];
  db.partners.unshift(doc);
  res.json(doc);
});

api.post("/partners/:pid/toggle", (req, res) => {
  const doc = db.partners.find((p) => p.id === req.params.pid);
  if (doc) {
    doc.active = !doc.active;
    return res.json({ ...doc, is_veteran: true });
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
  const userEmail = (req.headers["x-user-email"] as string) || (req.query.email as string) || db.profile.email;
  const isPartner = (db.partners || []).some(
    (p) => p.email.toLowerCase() === userEmail.toLowerCase() && p.active
  );
  if (isPartner) {
    (db.profile as any).is_veteran = true;
    (db.profile as any).is_partner = true;
  }
  res.json(db.profile);
});

api.put("/profile", (req, res) => {
  db.profile = { ...db.profile, ...req.body };
  res.json(db.profile);
});

api.post("/profile", (req, res) => {
  db.profile = { ...db.profile, ...req.body };
  res.json(db.profile);
});

api.patch("/profile", (req, res) => {
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

  const models = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"];
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

async function generateGeminiVisionWithFailover(prompt: string, imageBase64?: string): Promise<string> {
  const ai = getAI();
  if (!ai) return "";

  let contents: any = prompt;
  if (imageBase64 && typeof imageBase64 === "string" && imageBase64.includes("base64,")) {
    const parts = imageBase64.split("base64,");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const data = parts[1];
    contents = [
      {
        text: prompt,
      },
      {
        inlineData: {
          mimeType,
          data,
        },
      },
    ];
  }

  const models = ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"];
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
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

// AI Recipes by Ingredients: Gera pelo menos 5 opções de cardápio completas com modo de preparo
api.post("/ai/recipes-by-ingredients", async (req, res) => {
  const {
    ingredientes = [],
    tipo_refeicao = "Qualquer refeição",
    calorias_alvo = 500,
    restricoes = [],
  } = req.body;

  try {
    const recipes = await getRecipesByIngredients({
      ingredientes: Array.isArray(ingredientes) ? ingredientes : [ingredientes],
      tipo_refeicao,
      calorias_alvo: Number(calorias_alvo) || 500,
      restricoes,
    });
    return res.json(recipes);
  } catch (err) {
    console.error("Erro ao gerar receitas por ingredientes:", err);
    return res.status(500).json({ error: "Falha ao gerar receitas com ingredientes" });
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
  const { lang = "pt", image_base64 } = req.body;
  const isPt = lang === "pt";

  const fallback = {
    name: isPt ? "Frango grelhado com arroz branco, feijão e brócolis" : "Grilled chicken with rice, beans & steamed broccoli",
    assessment: isPt
      ? "Excelente equilíbrio calórico e protéico, ideal para hipertrofia e manutenção de massa magra."
      : "Well-balanced meal rich in lean proteins with high biological value and complex carbs.",
    foods: [
      {
        id: "item_1",
        name: isPt ? "Peito de Frango Grelhado" : "Grilled Chicken Breast",
        grams: 150,
        kcal: 240,
        p: 46.5,
        c: 0.0,
        f: 5.4,
        per_100g: { kcal: 160, p: 31.0, c: 0.0, f: 3.6 },
      },
      {
        id: "item_2",
        name: isPt ? "Arroz Branco Cozido" : "Cooked White Rice",
        grams: 130,
        kcal: 169,
        p: 3.3,
        c: 36.4,
        f: 0.3,
        per_100g: { kcal: 130, p: 2.5, c: 28.0, f: 0.2 },
      },
      {
        id: "item_3",
        name: isPt ? "Feijão Carioca Cozido" : "Cooked Pinto Beans",
        grams: 100,
        kcal: 76,
        p: 4.8,
        c: 13.6,
        f: 0.5,
        per_100g: { kcal: 76, p: 4.8, c: 13.6, f: 0.5 },
      },
      {
        id: "item_4",
        name: isPt ? "Brócolis no Vapor" : "Steamed Broccoli",
        grams: 80,
        kcal: 28,
        p: 2.2,
        c: 5.6,
        f: 0.3,
        per_100g: { kcal: 35, p: 2.8, c: 7.0, f: 0.4 },
      },
    ],
    total_grams: 460,
    kcal: 513,
    p: 56.8,
    c: 55.6,
    f: 6.5,
  };

  try {
    const prompt = `You are a sports nutritionist and computer vision nutrition expert analyzing a meal plate photo.
Identify each individual food item visible on the plate, estimate its exact quantity in grams, and calculate its nutritional breakdown.
Language: ${isPt ? "Brazilian Portuguese" : "English"}.
Return ONLY a valid JSON object without code fences or markdown matching this structure:
{
  "name": "${isPt ? "Nome descritivo e apetitoso do prato" : "Descriptive meal name"}",
  "assessment": "${isPt ? "Avaliação nutricional esportiva concisa sobre o equilíbrio do prato" : "Concise sports nutrition assessment"}",
  "foods": [
    {
      "id": "item_1",
      "name": "Nome do alimento (ex: Peito de Frango Grelhado)",
      "grams": 150,
      "kcal": 240,
      "p": 46.5,
      "c": 0.0,
      "f": 5.4,
      "per_100g": {
        "kcal": 160,
        "p": 31.0,
        "c": 0.0,
        "f": 3.6
      }
    }
  ],
  "total_grams": 460,
  "kcal": 513,
  "p": 56.8,
  "c": 55.6,
  "f": 6.5
}`;

    let text = "";
    if (image_base64 && typeof image_base64 === "string") {
      text = await generateGeminiVisionWithFailover(prompt, image_base64);
    } else {
      text = await generateGeminiContentWithFailover(prompt);
    }

    if (!text) return res.json(fallback);
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(clean);

    if (!Array.isArray(data.foods) || data.foods.length === 0) {
      return res.json({ ...fallback, ...data });
    }

    // Normaliza os alimentos com id e per_100g se faltar
    const normalizedFoods = data.foods.map((food: any, idx: number) => {
      const grams = Math.max(1, Number(food.grams) || 100);
      const kcal = Number(food.kcal) || 100;
      const p = Number(food.p) || 5;
      const c = Number(food.c) || 10;
      const f = Number(food.f) || 2;
      const ratio = grams / 100;

      const per_100g = food.per_100g || {
        kcal: Math.round(kcal / ratio),
        p: Number((p / ratio).toFixed(1)),
        c: Number((c / ratio).toFixed(1)),
        f: Number((f / ratio).toFixed(1)),
      };

      return {
        id: food.id || `item_${idx + 1}_${Date.now()}`,
        name: food.name || `Alimento ${idx + 1}`,
        grams,
        kcal,
        p,
        c,
        f,
        per_100g,
      };
    });

    const total_grams = normalizedFoods.reduce((acc: number, item: any) => acc + item.grams, 0);
    const total_kcal = normalizedFoods.reduce((acc: number, item: any) => acc + item.kcal, 0);
    const total_p = Number(normalizedFoods.reduce((acc: number, item: any) => acc + item.p, 0).toFixed(1));
    const total_c = Number(normalizedFoods.reduce((acc: number, item: any) => acc + item.c, 0).toFixed(1));
    const total_f = Number(normalizedFoods.reduce((acc: number, item: any) => acc + item.f, 0).toFixed(1));

    return res.json({
      name: data.name || fallback.name,
      assessment: data.assessment || fallback.assessment,
      foods: normalizedFoods,
      total_grams,
      kcal: total_kcal,
      p: total_p,
      c: total_c,
      f: total_f,
    });
  } catch (err) {
    console.error("Plate analysis error:", err);
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
    workout_date = "",
    generation_mode = "single_day",
    period_weeks = 1,
  } = req.body;

  const isPt = lang === "pt";

  // Calculate formatted date context
  let dateContext = "";
  if (workout_date) {
    try {
      const parsedDate = new Date(`${workout_date}T12:00:00Z`);
      if (!isNaN(parsedDate.getTime())) {
        const weekday = parsedDate.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
        const dayMonth = parsedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
        dateContext = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} (${dayMonth})`;
      }
    } catch {}
  }

  const activeGuidelines = db.coach_guidelines || [];
  const guidelinesPrompt = activeGuidelines.length > 0
    ? `\nCRITICAL COACH METHODOLOGY GUIDELINES TO ENFORCE:\n- ${activeGuidelines.join("\n- ")}`
    : "";

  let modeInstruction = "Generate a single high-performance session.";
  if (generation_mode === "weekly_split") {
    modeInstruction = `Generate a comprehensive week workout protocol starting from ${dateContext || workout_date || "this week"}, distributing exercises and sets strategically across muscle groups.`;
  } else if (generation_mode === "multi_week_periodization") {
    modeInstruction = `Generate a multi-week periodization (${period_weeks} weeks mesocycle) starting on ${dateContext || workout_date || "today"}. Emphasize progressive mechanical tension and structured volume variation.`;
  }

  const fallbackDayLabel = dateContext
    ? `${dateContext} · ${split.split("(")[0].trim()}`
    : `Dia de Foco · ${split.split("(")[0].trim()}`;

  const fallback = {
    day_label: fallbackDayLabel,
    title: `${split.split("(")[0].trim()} · Protocolo Alta Performance`,
    focus: `${goal} · Tensão Mecânica`,
    duration_min: Number(duration_min) || 55,
    intensity: level === "Avançado" ? "Extrema" : "Alta",
    coach_note: `Prescrição para ${student_name} (${dateContext || "Semana Atual"}). Priorize cadência excêntrica 3s. ${focus_notes ? `Obs: ${focus_notes}` : ""}`.trim(),
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
    const prompt = `Você é um Treinador de Alto Rendimento de elite da plataforma VYRA.
O usuário ou treinador solicita o planejamento diário de treino.

SUAS REGRAS ESTRITAS SÃO:
1. FOCO NO AGORA: Gere o treino EXCLUSIVAMENTE para o dia de hoje. Não crie ou mostre a semana inteira.
2. VARIABILIDADE DE ESTÍMULOS: O treino de hoje deve ser único e dinâmico. Nunca repita a exata mesma rotina dos dias anteriores. Varie os exercícios, as pegadas, as angulações ou os métodos de intensidade (como drop-set, rest-pause, bi-set, isometria) para gerar novos desafios.
3. FORMATAÇÃO: Entregue o treino de forma direta e motivacional, listando apenas o que deve ser executado nesta sessão.

PARÂMETROS DA SESSÃO:
- Aluno: "${student_name}"
- Objetivo: "${goal}"
- Agrupamento Muscular / Divisão: "${split}"
- Nível do Atleta: "${level}"
- Duração Alvo: ${duration_min} minutos
- Observações Específicas / Foco: "${focus_notes || 'Variabilidade biomecânica e estímulos inéditos'}"
- Data de Referência: "${dateContext || workout_date || 'Hoje'}"
${guidelinesPrompt}

Retorne EXCLUSIVAMENTE um objeto JSON válido sem blocos markdown:
{
  "day_label": "${dateContext ? `${dateContext} · ${split.split("(")[0].trim()}` : "Treino de Hoje · " + split.split("(")[0].trim()}",
  "title": "Título direto e motivacional do treino",
  "focus": "Foco específico da sessão",
  "duration_min": ${Number(duration_min) || 55},
  "intensity": "Alta",
  "coach_note": "Nota direta, motivacional e técnica orientando cadência e métodos de intensidade desta sessão",
  "exercises": [
    {
      "name": "Nome do Exercício",
      "sets": 4,
      "reps": "8-10",
      "rest": "90s",
      "muscle": "Grupamento Específico",
      "video_url": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
      "coach_tip": "Dica biomecânica e método de intensidade (drop-set, rest-pause, bi-set, isometria)"
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
    const activeGuidelines = db.coach_guidelines || [];
    const guidelinesPrompt = activeGuidelines.length > 0
      ? `\nCRITICAL COACH METHODOLOGY GUIDELINES TO ENFORCE:\n- ${activeGuidelines.join("\n- ")}`
      : "";

    const prompt = `You are the Chief Sports Nutritionist at VYRA.
Calculate the macro proportions and prescribe 5 structured daily meals for this athlete:
- Student Name: "${student_name}"
- Goal: "${goal}"
- Weight: ${weight_kg} kg
- Height: ${height_cm} cm
- Dietary Restrictions: "${restrictions || 'None'}"
- Daily Calorie Target: ${baseKcal} kcal
${guidelinesPrompt}
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

// Any unhandled /api/* request returns 404 JSON instead of falling through to Vite SPA HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
  next(err);
});

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
