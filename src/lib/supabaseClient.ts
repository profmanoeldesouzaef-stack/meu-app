import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Configurações e Credenciais Oficiais do Supabase do Projeto Vyra
export const DEFAULT_SUPABASE_URL = "https://qxcmqzzfsjvstlzveyrh.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y21xenpmc2p2c3RsenZleXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTE0NTYsImV4cCI6MjEwMzE2NzQ1Nn0.EiK8_Ty9k00TaNDeW6NAzwF4xVEQozEFKg8lfK4CMcw";

export interface SupabaseCredentialStatus {
  url: string;
  key: string;
  isConfigured: boolean;
  isCustom: boolean;
  isValidUrl: boolean;
  hasKey: boolean;
  urlWarning?: string;
}

/**
 * Recupera e valida as credenciais do Supabase.
 * Usa as credenciais oficiais fornecidas pelo usuário como padrão,
 * com suporte para sobrescrever via variáveis de ambiente ou localStorage.
 */
export function getSupabaseCredentials(): SupabaseCredentialStatus {
  let envUrl = "";
  let envKey = "";
  try {
    if (typeof process !== "undefined" && process.env) {
      envUrl = (process.env as any).EXPO_PUBLIC_SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL || "";
      envKey = (process.env as any).EXPO_PUBLIC_SUPABASE_ANON_KEY || (process.env as any).VITE_SUPABASE_ANON_KEY || "";
    }
  } catch {
    // ignore
  }

  let localUrl = "";
  let localKey = "";
  try {
    localUrl = localStorage.getItem("vyra_supabase_url") || "";
    localKey = localStorage.getItem("vyra_supabase_anon_key") || "";
  } catch {
    // ignore
  }

  let rawUrl = (localUrl.trim() || envUrl.trim() || DEFAULT_SUPABASE_URL);
  let rawKey = (localKey.trim() || envKey.trim() || DEFAULT_SUPABASE_ANON_KEY);

  // Se o usuário colou a chave sb_publishable_* ou sb_secret_* no lugar da URL
  let detectedKeyInUrl = false;
  if (rawUrl.startsWith("sb_publishable_") || rawUrl.startsWith("sb_secret_")) {
    if (!rawKey || rawKey === DEFAULT_SUPABASE_ANON_KEY) {
      rawKey = rawUrl;
    }
    rawUrl = DEFAULT_SUPABASE_URL;
    detectedKeyInUrl = true;
  }

  // Se a chave passada foi sb_secret_*, no client-side usamos a anon key oficial
  if (rawKey.startsWith("sb_secret_")) {
    rawKey = DEFAULT_SUPABASE_ANON_KEY;
  }

  // Garantir que a URL seja válida HTTP/HTTPS
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    if (rawUrl.includes("supabase.co")) {
      rawUrl = `https://${rawUrl}`;
    } else {
      rawUrl = DEFAULT_SUPABASE_URL;
    }
  }

  if (!rawKey || rawKey.startsWith("http://") || rawKey.startsWith("https://")) {
    rawKey = DEFAULT_SUPABASE_ANON_KEY;
  }

  const isValidUrl = Boolean(rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")));
  const hasKey = Boolean(rawKey);
  const isConfigured = isValidUrl && hasKey;

  let urlWarning: string | undefined;
  if (detectedKeyInUrl) {
    urlWarning = "Chave detectada no campo de URL. Conectando automaticamente à URL oficial do Supabase: " + DEFAULT_SUPABASE_URL;
  } else if (!isValidUrl) {
    urlWarning = "A URL do Supabase precisa começar com https:// (ex: https://seu-projeto.supabase.co)";
  }

  return {
    url: rawUrl,
    key: rawKey,
    isConfigured,
    isCustom: Boolean(localUrl || localKey),
    isValidUrl,
    hasKey,
    urlWarning,
  };
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = "";
let lastUsedKey = "";

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isValidUrl } = getSupabaseCredentials();

  const safeUrl = isValidUrl && (url.startsWith("http://") || url.startsWith("https://"))
    ? url
    : DEFAULT_SUPABASE_URL;
  const safeKey = key && !key.startsWith("http") ? key : DEFAULT_SUPABASE_ANON_KEY;

  if (cachedClient && lastUsedUrl === safeUrl && lastUsedKey === safeKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(safeUrl, safeKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = safeUrl;
    lastUsedKey = safeKey;
    return cachedClient;
  } catch (err) {
    console.error("Falha ao inicializar SupabaseClient:", err);
    try {
      return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch {
      return null;
    }
  }
}

export const supabase: SupabaseClient =
  getSupabaseClient() ||
  createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

// ID de usuário padrão compatível com a chave estrangeira auth.users do Supabase
export const DEFAULT_VOTING_USER_ID = "b97113b7-65a4-4eda-aca3-1baff1f6c3b6";

/**
 * Retorna o ID único do usuário atual para auditoria e registro de votos.
 * Gera e persiste um UUID exclusivo por dispositivo/navegador para que os votos não fiquem restritos a um único usuário.
 */
export function getVotingUserId(): string {
  try {
    let localUid = localStorage.getItem("vyra_user_unique_id");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!localUid || !uuidRegex.test(localUid) || localUid === DEFAULT_VOTING_USER_ID) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        localUid = crypto.randomUUID();
      } else {
        localUid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      localStorage.setItem("vyra_user_unique_id", localUid);
    }
    return localUid;
  } catch {
    return DEFAULT_VOTING_USER_ID;
  }
}
