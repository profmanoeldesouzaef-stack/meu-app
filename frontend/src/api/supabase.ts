import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
const supabaseUrl = (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
  ? rawUrl
  : "https://qxcmqzzfsjvstlzveyrh.supabase.co";

const rawKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const supabaseAnonKey = (rawKey && !rawKey.startsWith("http") && rawKey.length > 20)
  ? rawKey
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y21xenpmc2p2c3RsenZleXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTE0NTYsImV4cCI6MjEwMzE2NzQ1Nn0.EiK8_Ty9k00TaNDeW6NAzwF4xVEQozEFKg8lfK4CMcw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
