import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { VyraLogo } from "./VyraLogo";
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
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    persona,
    setPersona,
    lang,
    setLang,
    theme,
    setTheme,
    t,
    subscription,
    setActiveView,
    activeView,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-200 bg-[#0A0A0A]/90 border-[#2B2B2F]/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          id="header-brand-logo"
          onClick={() => setActiveView("home")}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Início"
        >
          <div className="w-10 h-10 rounded-xl bg-[#151515] border border-[#2B2B2F] p-1 flex items-center justify-center shadow-lg shadow-[#FF6A2A]/15 group-hover:scale-105 transition-transform">
            <VyraLogo className="w-full h-full" />
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
          {/* Persona Demo Switcher */}
          <div className="flex items-center bg-[#151515] p-1 rounded-xl border border-[#2B2B2F]">
            <button
              id="persona-student-btn"
              onClick={() => {
                setPersona("student");
                if (activeView === "coach" || activeView === "moderator") setActiveView("home");
              }}
              title="Persona: Aluno"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                persona === "student"
                  ? "bg-[#FF6A2A] text-white shadow-sm"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("profile.student")}</span>
            </button>

            <button
              id="persona-coach-btn"
              onClick={() => {
                setPersona("coach");
                setActiveView("coach");
              }}
              title="Persona: Coach"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                persona === "coach"
                  ? "bg-[#D8B46A] text-[#0A0A0A] font-bold shadow-sm"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("profile.coach")}</span>
            </button>

            <button
              id="persona-mod-btn"
              onClick={() => {
                setPersona("moderator");
                setActiveView("moderator");
              }}
              title="Persona: Moderador"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                persona === "moderator"
                  ? "bg-[#6D9BFF] text-white font-bold shadow-sm"
                  : "text-[#9B9BA1] hover:text-[#F5F5F7]"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("profile.moderator")}</span>
            </button>
          </div>

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

          {/* Notification Button */}
          <div className="relative">
            <button
              id="header-notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-[#151515] border border-[#2B2B2F] flex items-center justify-center text-[#9B9BA1] hover:text-[#F5F5F7] hover:border-[#4A4A52] transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6A2A]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#151515] border border-[#2B2B2F] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2F]">
                  <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
                    {t("sec.reminders")}
                  </h4>
                  <span className="text-[10px] text-[#9B9BA1]">Alertas Ativos</span>
                </div>
                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {/* Coach Message Alert */}
                  <div
                    onClick={() => {
                      setActiveView("community");
                      setShowNotifications(false);
                    }}
                    className="p-3 rounded-xl bg-gradient-to-r from-[#D8B46A]/20 to-[#D8B46A]/5 border border-[#D8B46A]/40 text-xs cursor-pointer hover:border-[#D8B46A] transition-colors"
                  >
                    <p className="font-bold text-[#D8B46A] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Mensagem do Coach Manoel
                    </p>
                    <p className="text-[#F5F5F7] mt-1 font-medium">
                      "Semana com foco total em progressive overload e hidratação. Mantenha os 3L!"
                    </p>
                    <span className="text-[10px] text-[#D8B46A]/80 mt-1 block">Clique para responder</span>
                  </div>

                  {/* Water Alert */}
                  <div
                    onClick={() => {
                      setActiveView("home");
                      setShowNotifications(false);
                    }}
                    className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#6D9BFF]/40 text-xs cursor-pointer hover:border-[#6D9BFF] transition-colors"
                  >
                    <p className="font-bold text-[#6D9BFF] flex items-center gap-1.5">
                      💧 Lembrete de Hidratação
                    </p>
                    <p className="text-[#9B9BA1] mt-0.5">
                      Hora de tomar 250ml de água. Mantenha sua meta do dia em dia.
                    </p>
                  </div>

                  {/* Creatine Alert */}
                  <div
                    onClick={() => {
                      setActiveView("home");
                      setShowNotifications(false);
                    }}
                    className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#FF6A2A]/40 text-xs cursor-pointer hover:border-[#FF6A2A] transition-colors"
                  >
                    <p className="font-bold text-[#FF9A62] flex items-center gap-1.5">
                      ⚡ Lembrete de Dose de Creatina
                    </p>
                    <p className="text-[#9B9BA1] mt-0.5">
                      Dose prescrita pelo Coach. Marque o check da tomada.
                    </p>
                  </div>

                  {/* 20 Days Assessment Alert */}
                  <div
                    onClick={() => {
                      setActiveView("progress");
                      setShowNotifications(false);
                    }}
                    className="p-2.5 rounded-xl bg-[#1D1D1F] border border-[#34C759]/40 text-xs cursor-pointer hover:border-[#34C759] transition-colors"
                  >
                    <p className="font-bold text-[#34C759] flex items-center gap-1.5">
                      📸 Ciclo de 20 Dias: Fotos & Perimetria
                    </p>
                    <p className="text-[#9B9BA1] mt-0.5">
                      Atualize seu shape e medidas para ajuste do protocolo pelo Coach.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
