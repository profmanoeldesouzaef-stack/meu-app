import { useApp } from "../context/AppContext";
import { Subscription } from "../types";

export interface UseSubscriptionReturn {
  subscription: Subscription;
  isActive: boolean;
  hasActivePayment: boolean;
  planId?: string;
  cycle?: string;
  expiresAt?: string;
  canAccess: (feature: "training" | "diet" | "challenges") => boolean;
  setSubscription: (sub: any) => void;
}

/**
 * Hook global de verificação de pagamento e assinatura ativa (Vyra Paywall Guard)
 * Garante que apenas alunos com pagamento ativo ou membros da comissão técnica (Coach/Mod)
 * tenham acesso às áreas de Treino, Dieta e Desafios.
 */
export function useSubscription(): UseSubscriptionReturn {
  const { subscription, setSubscription, persona } = useApp();
  const isActive = Boolean(subscription && subscription.active);

  const canAccess = (feature: "training" | "diet" | "challenges"): boolean => {
    // Coach e Moderador possuem acesso operacional irrestrito
    if (persona === "coach" || persona === "moderator") {
      return true;
    }
    // Alunos necessitam obrigatoriamente de assinatura/pagamento vigente
    return isActive;
  };

  return {
    subscription,
    isActive,
    hasActivePayment: isActive,
    planId: subscription?.planId,
    cycle: (subscription as any)?.cycle || (subscription as any)?.billingCycle,
    expiresAt: subscription?.expiresAt,
    canAccess,
    setSubscription,
  };
}

export default useSubscription;
