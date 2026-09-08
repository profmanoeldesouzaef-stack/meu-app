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

export function useSubscription(): UseSubscriptionReturn {
  const { subscription, setSubscription, persona } = useApp();
  const isActive = Boolean(subscription && subscription.active);

  const canAccess = (feature: "training" | "diet" | "challenges"): boolean => {
    if (persona === "coach" || persona === "moderator") {
      return true;
    }
    return isActive;
  };

  return {
    subscription: subscription as any,
    isActive,
    hasActivePayment: isActive,
    planId: subscription?.planId,
    cycle: (subscription as any)?.cycle,
    canAccess,
    setSubscription,
  };
}

export default useSubscription;
