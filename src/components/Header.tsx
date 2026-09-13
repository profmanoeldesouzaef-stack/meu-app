import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { EagleIcon } from "./EagleIcon";
import {
  Shield,
  UserCheck,
  Award,
  Crown,
  User,
  Bell,
  Check,
  Droplet,
  Zap,
  MessageSquare,
  Smartphone,
  Trash2,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    persona,
    subscription,
    setActiveView,
    activeView,
    isChampion,
    systemNotifications,
    dismissNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    requestPushPermission,
    pushPermissionState,
  } = useApp();

  const [showAvisosMenu, setShowAvisosMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = systemNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAvisosMenu(false);
      }
    };
    if (showAvisosMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAvisosMenu]);

  const handleNotificationClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    if (notif.type === "coach") {
      setActiveView("community");
    } else if (notif.type === "water" || notif.type === "creatine") {
      setActiveView("home");
    }
    setShowAvisosMenu(false);
  };

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

        {/* Action Controls */}
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

          {/* Botão de Avisos */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-avisos-btn"
              onClick={() => setShowAvisosMenu(!showAvisosMenu)}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                showAvisosMenu
                  ? "bg-[#1D1D1F] border-[#FF6A2A] text-[#FF6A2A]"
                  : "bg-[#151515] border-[#2B2B2F] text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#FF6A2A]/50"
              }`}
              title="Avisos e Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF6A2A] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Avisos (Não intrusivo) */}
            {showAvisosMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#151515] border border-[#2B2B2F] shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3.5 border-b border-[#2B2B2F] flex items-center justify-between bg-[#1A1A1E]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#FF6A2A]" />
                    <h3 className="text-xs font-black text-[#F5F5F7] uppercase tracking-wider">
                      Avisos & Lembretes
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FF6A2A]/20 text-[#FF6A2A]">
                        {unreadCount} novos
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] font-bold text-[#D8B46A] hover:underline cursor-pointer"
                    >
                      Marcar lidos
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#2B2B2F]/60">
                  {systemNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#9B9BA1]">
                      Nenhum aviso no momento.
                    </div>
                  ) : (
                    systemNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 transition-all cursor-pointer flex items-start justify-between gap-2.5 hover:bg-[#1D1D1F] ${
                          !notif.read ? "bg-[#1A1A22]/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              notif.type === "coach"
                                ? "bg-[#D8B46A]/20 text-[#D8B46A]"
                                : notif.type === "water"
                                ? "bg-[#6D9BFF]/20 text-[#6D9BFF]"
                                : notif.type === "creatine"
                                ? "bg-[#FF6A2A]/20 text-[#FF6A2A]"
                                : "bg-[#9B9BA1]/20 text-[#9B9BA1]"
                            }`}
                          >
                            {notif.type === "coach" && <MessageSquare className="w-3.5 h-3.5" />}
                            {notif.type === "water" && <Droplet className="w-3.5 h-3.5" />}
                            {notif.type === "creatine" && <Zap className="w-3.5 h-3.5" />}
                            {notif.type === "general" && <Bell className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4
                                className={`text-xs ${
                                  !notif.read ? "font-bold text-[#F5F5F7]" : "font-medium text-[#9B9BA1]"
                                }`}
                              >
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A2A] shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-[#9B9BA1] mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-[#6E6E73] mt-1 block">
                              {notif.timestamp}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notif.id);
                          }}
                          className="p-1 rounded text-[#6E6E73] hover:text-[#FF453A] hover:bg-[#2B2B2F] shrink-0"
                          title="Remover aviso"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Rodapé: Notificações no celular */}
                <div className="p-3 bg-[#111113] border-t border-[#2B2B2F] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#D8B46A] shrink-0" />
                    <span className="text-[10px] text-[#9B9BA1]">
                      {pushPermissionState === "granted"
                        ? "Avisos ativos no seu celular"
                        : "Receber avisos no celular"}
                    </span>
                  </div>
                  {pushPermissionState !== "granted" && (
                    <button
                      onClick={requestPushPermission}
                      className="px-2 py-1 rounded-lg bg-[#FF6A2A] hover:bg-[#FF9A62] text-white text-[10px] font-bold cursor-pointer"
                    >
                      Ativar no celular
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

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

