/**
 * Tratamento explícito de erros do Supabase com alerta e log no console.
 */
export function handleSupabaseError(error: any, context?: string): string {
  if (!error) return "";
  
  console.error("[ERRO SUPABASE]:", error, context ? `Contexto: ${context}` : "");
  const details = error.details || error.hint || "";
  const message = `Falha ao salvar no banco: ${error.message || error} - ${details}`;
  
  try {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    }
  } catch (e) {
    console.warn("[handleSupabaseError] Não foi possível disparar alert nativo no iframe:", e);
  }

  // Despacha evento personalizado para que banners globais de erro capturem se necessário
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("supabase_write_error", {
          detail: { message, error, context },
        })
      );
    }
  } catch {}

  return message;
}
