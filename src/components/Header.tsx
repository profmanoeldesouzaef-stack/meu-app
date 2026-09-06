import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { VyraLogo } from "./VyraLogo";
import { EagleIcon } from "./EagleIcon";
import {
  Flame,
  Globe,
  Sun,
  Moon,
  Shield,
  Dumbbell,
  UserCheck,
  Bell,
  Sparkles,
  Award,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  LogOut,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    persona,
    lang,
    setLang,
    theme,
    setTheme,
    t,
    subscription,
    setActiveView,
    activeView,
    systemNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    logout,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close reminders dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);

  const unreadCount = systemNotifications.filter((n) => !n.read).length;

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

          {/* Language Toggle */}
          <button
            id="header-lang-toggle"
            onClick={() => setLang(lang === "pt" ? "en" : "pt")}
            className="h-9 px-2.5 rounded-xl bg-[#151515] border border-[#2B2B2F] text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5 hover:border-[#4A4A52] transition-colors"
            title="Trocar idioma / Switch language"
          >
            <Globe className="w-3.5 h-3.5 text-[#FF9A62]" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="header-theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-center text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#4A4A52] transition-colors"
            title="Alternar tema"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[#D8B46A]" />
            ) : (
              <Moon className="w-4 h-4 text-[#6D9BFF]" />
            )}
          </button>

          {/* Notification Button & Reminders Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              id="header-notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-center text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#4A4A52] transition-colors relative cursor-pointer"
              title="Lembretes diários"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6A2A] ring-2 ring-[#0A0A0A]" />
              )}
            </button>

            {showNotifications && (
              <>
                {/* Backdrop invisível que fecha o lembrete ao clicar em qualquer área fora */}
                <div
                  id="reminders-backdrop"
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setShowNotifications(false)}
                />

                <div
                  id="header-reminders-dropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#151515] border border-[#2B2B2F] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2"
                >
                <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                      {persona === "coach" ? "Lembretes dos Alunos" : t("sec.reminders")}
                    </h4>
                    {unreadCount > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6A2A]/20 text-[#FF9A62] border border-[#FF6A2A]/40">
                        {unreadCount} pendente{unreadCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        Em dia
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 ? (
                    <button
                      id="header-mark-all-read-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllNotificationsAsRead();
                      }}
                      className="text-xs font-bold text-[#D8B46A] hover:text-[#F5F5F7] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-[#D8B46A]/15 cursor-pointer"
                      title="Marcar todos os lembretes como lidos"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar como lido</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#9B9BA1] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
                      Todos lidos
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {systemNotifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#9B9BA1]">
                      Nenhum lembrete registrado no momento.
                    </div>
                  ) : (
                    systemNotifications.map((notif) => {
                      const isCoach = notif.type === "coach";
                      const isWater = notif.type === "water";
                      const isCreatine = notif.type === "creatine";
                      const isAssessment = notif.type === "assessment";

                      return (
                        <div
                          key={notif.id}
                          id={`reminder-item-${notif.id}`}
                          onClick={() => {
                            if (!notif.read) markNotificationAsRead(notif.id);
                            if (persona === "coach") setActiveView("coach");
                            else if (isCoach) setActiveView("community");
                            else if (isAssessment) setActiveView("progress");
                            else setActiveView("home");
                            setShowNotifications(false);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            notif.read
                              ? "bg-[#1A1A1C]/60 border-[#2B2B2F]/60 opacity-65 hover:opacity-100 hover:border-[#4A4A52]"
                              : isCoach
                              ? "bg-gradient-to-r from-[#D8B46A]/20 to-[#D8B46A]/5 border-[#D8B46A]/40 hover:border-[#D8B46A]"
                              : isWater
                              ? "bg-[#1D1D1F] border-[#6D9BFF]/40 hover:border-[#6D9BFF]"
                              : isCreatine
                              ? "bg-[#1D1D1F] border-[#FF6A2A]/40 hover:border-[#FF6A2A]"
                              : "bg-[#1D1D1F] border-[#34C759]/40 hover:border-[#34C759]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`font-bold flex items-center gap-1.5 ${
                                isCoach
                                  ? "text-[#D8B46A]"
                                  : isWater
                                  ? "text-[#6D9BFF]"
                                  : isCreatine
                                  ? "text-[#FF9A62]"
                                  : "text-[#34C759]"
                              }`}
                            >
                              {isCoach && <Sparkles className="w-3.5 h-3.5 shrink-0" />}
                              {isWater && <span className="shrink-0">💧</span>}
                              {isCreatine && <span className="shrink-0">⚡</span>}
                              {isAssessment && <Camera className="w-3.5 h-3.5 shrink-0" />}
                              <span className="truncate">{notif.title}</span>
                            </p>

                            {/* Button: Marcar como lido */}
                            {!notif.read ? (
                              <button
                                id={`mark-read-btn-${notif.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationAsRead(notif.id);
                                }}
                                className="text-[10px] font-bold text-[#D8B46A] hover:text-white bg-[#D8B46A]/10 hover:bg-[#D8B46A]/25 border border-[#D8B46A]/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                                title="Marcar lembrete como lido"
                              >
                                <Check className="w-3 h-3" />
                                <span>Marcar como lido</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#6E6E73] flex items-center gap-1 shrink-0 font-medium">
                                <Check className="w-3 h-3 text-[#34C759]" />
                                Lido
                              </span>
                            )}
                          </div>

                          <p className="text-[#F5F5F7] mt-1 font-medium leading-relaxed">
                            {notif.message}
                          </p>

                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[#2B2B2F]/40 text-[10px] text-[#9B9BA1]">
                            <span>{notif.timestamp}</span>
                            <span className="text-[10px] text-[#9B9BA1] hover:text-[#F5F5F7]">
                              {isCoach
                                ? "Clique para abrir comunidade"
                                : isAssessment
                                ? "Clique para atualizar fotos"
                                : "Clique para ir ao início"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
          </div>

          {/* Quick Logout Button */}
          <button
            id="header-logout-btn"
            onClick={() => setShowLogoutModal(true)}
            className="w-9 h-9 rounded-xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-center text-[#9B9BA1] hover:text-[#FF453A] hover:border-[#FF453A]/40 transition-colors cursor-pointer"
            title="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#F5F5F7]">Sair da Conta</h3>
              <p className="text-xs text-[#9B9BA1] mt-1.5 leading-relaxed">
                Deseja realmente desconectar da sua conta Vyra?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="header-cancel-logout-btn"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs font-bold text-[#9B9BA1] hover:text-[#F5F5F7] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="header-confirm-logout-btn"
                onClick={async () => {
                  setShowLogoutModal(false);
                  await logout();
                }}
                className="flex-1 py-3 rounded-xl bg-[#FF453A] text-white text-xs font-bold hover:bg-[#FF453A]/90 transition-all cursor-pointer shadow-lg shadow-[#FF453A]/20 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sim, Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
