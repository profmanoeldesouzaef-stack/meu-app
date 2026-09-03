import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { VyraLogo } from "./VyraLogo";
import { Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export const LoginModal: React.FC = () => {
  const { t, setLoggedIn } = useApp();
  const [email, setEmail] = useState("rafael@vyra.app");
  const [password, setPassword] = useState("••••••••");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedIn(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#151515] border border-[#2B2B2F] p-8 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-24 h-24 mx-auto flex items-center justify-center">
          <VyraLogo className="w-full h-full" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#F5F5F7] tracking-tight">VYRA</h1>
          <p className="text-xs font-bold text-[#FF6A2A] uppercase tracking-widest mt-1">
            TRAINING & PERFORMANCE
          </p>
          <p className="text-xs text-[#9B9BA1] mt-2">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
              {t("login.email")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
              {t("login.password")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{t("cta.login")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2">
          <button
            onClick={() => setLoggedIn(true)}
            className="text-xs font-bold text-[#D8B46A] hover:underline flex items-center justify-center gap-1.5 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("cta.enter_demo")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
