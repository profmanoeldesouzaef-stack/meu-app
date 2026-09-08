import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, getSupabaseClient } from "./supabaseClient";

function initSupabase(): SupabaseClient {
  try {
    const client = getSupabaseClient();
    if (client) return client;
  } catch (e) {
    console.warn("Falha ao inicializar client configurado do Supabase:", e);
  }

  return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = initSupabase();

