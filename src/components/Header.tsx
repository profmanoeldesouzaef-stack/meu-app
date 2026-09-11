import React from "react";
import { useApp } from "../context/AppContext";
import { EagleIcon } from "./EagleIcon";
import {
  Shield,
  UserCheck,
  Award,
  Crown,
  User,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    persona,
    subscription,
    setActiveView,
    activeView,
    isChampion,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-200 bg-[#0A0A0A]/90 border-[#2B2B2F]/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Botão de Início com a Águia Vyra */}
        <div
          id="header-brand-logo"
          onClick={() => setActiveView("home")}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Início"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1C1808] via-[#151515] to-[#121214] border border-[#FF6A2A]/40 p-1 flex items-center justify-center shadow-lg shadow-[#FF6A2A]/20 group-hover:scale-105 group-hover:border-[#FF6A2A] transition-all">
            <EagleIcon detailed className="w-full h-full" />
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="text-xs font-black tracking-wider text-[#F5F5F7] group-hover:text-[#FF6A2A] transition-colors leading-none">
              VYRA
            </span>
            <span className="text-[9px] font-bold text-[#9B9BA1] tracking-widest leading-none mt-0.5">
              INÍCIO
            </span>
          </div>
          {subscription.active && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D8B46A]/20 text-[#D8B46A] border border-[#D8B46A]/30 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-2.5 h-2.5" />
              {subscription.planId?.toUpperCase() || "CLUB"}
            </span>
          )}
          {/* Coroa do Campeão: Estritamente condicionada ao Supabase (is_champion === true) */}
          {isChampion && (
            <span
              id="header-champion-crown-badge"
              className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF6A2A] via-[#E5A93C] to-[#D8B46A] text-[#121214] border border-[#FFE4A0]/60 uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse"
              title="Campeão Oficial Vyra (Reconhecido no Banco de Dados)"
            >
              <Crown className="w-3 h-3 fill-[#121214] stroke-[2]" />
              <span className="hidden sm:inline">CAMPEÃO</span>
            </span>
          )}
        </div>

        {/* Action Controls - Somente Área de Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Role Indicator (Only displayed if authenticated as Coach or Moderator) */}
          {persona === "coach" && (
            <div
              id="header-coach-badge"
              onClick={() => setActiveView("coach")}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D8B46A]/15 border border-[#D8B46A]/30 text-[#D8B46A] hover:bg-[#D8B46A]/25 transition-all text-xs font-bold"
              title="Acessar Painel do Coach"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Painel do Coach</span>
            </div>
          )}

          {persona === "moderator" && (
            <div
              id="header-mod-badge"
              onClick={() => setActiveView("moderator")}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6D9BFF]/15 border border-[#6D9BFF]/30 text-[#6D9BFF] hover:bg-[#6D9BFF]/25 transition-all text-xs font-bold"
              title="Acessar Painel de Moderação"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Moderação</span>
            </div>
          )}

          {/* Área de Perfil */}
          <button
            id="header-user-profile-badge"
            onClick={() => setActiveView("profile")}
            className={`cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all group shadow-sm ${
              activeView === "profile"
                ? "bg-[#1D1D1F] border-[#FF6A2A] text-[#FF6A2A]"
                : "bg-[#151515] border-[#2B2B2F] text-[#F5F5F7] hover:border-[#FF6A2A]/50 hover:bg-[#1D1D1F]"
            }`}
            title="Acessar Perfil"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6A2A] to-[#FF9A62] text-black font-black text-xs flex items-center justify-center shadow-sm shrink-0">
              <User className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold group-hover:text-[#FF6A2A] transition-colors">
              Perfil
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
