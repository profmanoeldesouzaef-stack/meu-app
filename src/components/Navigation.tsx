import React from "react";
import { useApp, ActiveView } from "../context/AppContext";
import {
  Home,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  User,
  Trophy,
  MessageSquare,
  ShieldCheck,
  Settings,
  Camera,
  Lock,
} from "lucide-react";

export const Navigation: React.FC = () => {
  const {
    activeView,
    setActiveView,
    t,
    persona,
    subscription,
    anamnesisDone,
    photosDone,
    unreadCommunityCount,
    clearUnreadCommunity,
  } = useApp();

  const isTabLocked = (id: ActiveView) => {
    if (persona !== "student") return false;
    if (id === "training" || id === "diet") {
      return !subscription.active || !anamnesisDone || !photosDone;
    }
    if (id === "challenges") {
      return !subscription.active;
    }
    return false;
  };

  const handleOpenCommunity = () => {
    clearUnreadCommunity();
    setActiveView("community");
  };

  // Dedicated navigation per role
  const getNavItems = () => {
    if (persona === "coach") {
      return [
        { id: "coach" as ActiveView, label: "Painel do Coach", icon: ShieldCheck },
        { id: "challenges" as ActiveView, label: "Desafios", icon: Trophy },
        { id: "community" as ActiveView, label: t("sec.community"), icon: MessageSquare },
        { id: "profile" as ActiveView, label: "Perfil do Coach", icon: User },
      ];
    }
    if (persona === "moderator") {
      return [
        { id: "moderator" as ActiveView, label: "Painel de Moderação", icon: ShieldCheck },
        { id: "challenges" as ActiveView, label: "Desafios", icon: Trophy },
        { id: "community" as ActiveView, label: t("sec.community"), icon: MessageSquare },
        { id: "profile" as ActiveView, label: "Perfil da Moderação", icon: User },
      ];
    }
    return [
      { id: "training" as ActiveView, label: t("tab.training"), icon: Dumbbell },
      { id: "diet" as ActiveView, label: t("tab.diet"), icon: UtensilsCrossed },
      { id: "home" as ActiveView, label: t("tab.home"), icon: Home },
      { id: "challenges" as ActiveView, label: t("tab.challenges"), icon: Trophy },
      { id: "profile" as ActiveView, label: t("tab.profile"), icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop Top Sub-Navbar */}
      <nav className="hidden md:block bg-[#151515] border-b border-[#2B2B2F] sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const isCoachTab = item.id === "coach";
              const isModTab = item.id === "moderator";
              const locked = isTabLocked(item.id);

              return (
                <button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => {
                    if (item.id === "community") handleOpenCommunity();
                    else setActiveView(item.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
                    isActive
                      ? isCoachTab
                        ? "bg-[#D8B46A] text-[#0A0A0A] shadow-lg shadow-[#D8B46A]/20"
                        : isModTab
                        ? "bg-[#6D9BFF] text-white shadow-lg shadow-[#6D9BFF]/20"
                        : "bg-[#FF6A2A] text-white shadow-lg shadow-[#FF6A2A]/20"
                      : "text-[#9B9BA1] hover:text-[#F5F5F7] hover:bg-[#1D1D1F]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {locked && (
                    <Lock className="w-3 h-3 text-[#D8B46A] opacity-90 shrink-0 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {persona === "student" && (
              <button
                id="nav-desktop-community-btn"
                onClick={handleOpenCommunity}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative cursor-pointer ${
                  activeView === "community"
                    ? "bg-[#FF6A2A]/20 text-[#FF9A62] border border-[#FF6A2A]"
                    : "bg-[#1D1D1F] text-[#9B9BA1] hover:text-[#F5F5F7] border border-[#2B2B2F]"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-[#FF9A62]" />
                <span>{t("sec.community")}</span>
                {unreadCommunityCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#FF6A2A] animate-pulse" />
                )}
              </button>
            )}

            {persona === "coach" && (
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D8B46A] bg-[#D8B46A]/10 border border-[#D8B46A]/30 px-3 py-1 rounded-full">
                Área Exclusiva do Coach
              </span>
            )}

            {persona === "moderator" && (
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6D9BFF] bg-[#6D9BFF]/10 border border-[#6D9BFF]/30 px-3 py-1 rounded-full">
                Área Exclusiva da Moderação
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Floating Community Chat FAB for Student */}
      {persona === "student" && activeView !== "community" && (
        <button
          id="floating-community-fab"
          onClick={handleOpenCommunity}
          className="fixed bottom-20 md:bottom-8 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF6A2A] to-[#FF9A62] text-white flex items-center justify-center shadow-xl shadow-[#FF6A2A]/30 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
          title="Chat da Comunidade"
        >
          <MessageSquare className="w-6 h-6 stroke-[2.5]" />
          {unreadCommunityCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D8B46A] text-[10px] font-black text-[#0A0A0A] flex items-center justify-center border-2 border-[#0A0A0A] shadow-md animate-bounce">
              {unreadCommunityCount}
            </span>
          )}
        </button>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#151515]/95 backdrop-blur-xl border-t border-[#2B2B2F] px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const locked = isTabLocked(item.id);
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => {
                  if (item.id === "community") handleOpenCommunity();
                  else setActiveView(item.id);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                  isActive
                    ? persona === "coach"
                      ? "text-[#D8B46A]"
                      : persona === "moderator"
                      ? "text-[#6D9BFF]"
                      : "text-[#FF6A2A]"
                    : "text-[#9B9BA1]"
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors relative ${
                    isActive
                      ? persona === "coach"
                        ? "bg-[#D8B46A]/15"
                        : persona === "moderator"
                        ? "bg-[#6D9BFF]/15"
                        : "bg-[#FF6A2A]/15"
                      : ""
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                  {locked && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#151515] border border-[#2B2B2F] flex items-center justify-center">
                      <Lock className="w-2 h-2 text-[#D8B46A]" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-0.5 tracking-tight flex items-center gap-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
