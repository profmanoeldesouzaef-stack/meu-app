import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { VyraLogo } from "./VyraLogo";
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, UserPlus, LogIn } from "lucide-react";
import { supabase } from "../lib/supabase";

export const LoginModal: React.FC = () => {
  const {
    t,
    loginWithEmail,
    setActiveView,
    definirPerfil,
    setCurrentUserName,
    setCurrentUserNickname,
  } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (supabase && supabase.auth) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setFeedback({
            text: "Erro ao autenticar com Google: " + error.message,
            type: "error",
          });
        }
      } else {
        setFeedback({
          text: "Serviço de autenticação não configurado.",
          type: "error",
        });
      }
    } catch (err: any) {
      setFeedback({
        text: "Erro ao autenticar com Google: " + (err.message || ""),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (supabase && supabase.auth) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setFeedback({
            text: "Erro ao autenticar com Apple: " + error.message,
            type: "error",
          });
        }
      } else {
        setFeedback({
          text: "Serviço de autenticação não configurado.",
          type: "error",
        });
      }
    } catch (err: any) {
      setFeedback({
        text: "Erro ao autenticar com Apple: " + (err.message || ""),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      setFeedback({ text: "Por favor, insira um e-mail válido.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        text: "A senha deve conter no mínimo 6 caracteres por segurança.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Fluxo de Cadastro estrito com Supabase Auth
        const cleanName = fullName.trim() || cleanEmail.split("@")[0];
        const cleanNickname = nickname.trim() || cleanName.split(" ")[0] || cleanName;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              name: cleanName,
              nickname: cleanNickname,
              display_name: cleanNickname,
              // Gamificação inicializada estritamente com valores base
              points: 0,
              rank: null,
              is_champion: false,
              is_veteran: false,
              consecutive_months: 0,
              patente_level: 0,
            },
          },
        });

        if (error) {
          setFeedback({
            text: error.message || "Erro ao criar conta. Verifique os dados e tente novamente.",
            type: "error",
          });
          setLoading(false);
          return;
        }

        // Garante sincronização imediata na tabela profiles
        if (data?.user) {
          try {
            await supabase.from("profiles").upsert(
              {
                id: data.user.id,
                email: cleanEmail,
                full_name: cleanName,
                name: cleanName,
                nickname: cleanNickname,
                role: "student",
                is_coach: false,
                is_champion: false,
                points: 0,
                rank: null,
                consecutive_months: 0,
                is_veteran: false,
                monthly_fee_paid: false,
                patente_level: 0,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          } catch (e) {
            console.warn("Aviso ao inicializar perfil:", e);
          }
        }

        // Atualiza os estados de nome e apelido imediatamente
        setCurrentUserName(cleanName);
        setCurrentUserNickname(cleanNickname);
        localStorage.setItem("vyra_user_name", cleanName);
        localStorage.setItem("vyra_user_nickname", cleanNickname);

        // Se a sessão não foi aberta diretamente (ex: confirmação pendente), tenta logar com as credenciais
        let activeAuthUser = data?.user;
        if (!data?.session) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (signInErr || !signInData?.user) {
            setFeedback({
              text: "Conta criada com sucesso! Entre com seu e-mail e senha cadastrados.",
              type: "success",
            });
            setIsSignUp(false);
            setLoading(false);
            return;
          }
          activeAuthUser = signInData.user;
        }

        if (activeAuthUser) {
          await definirPerfil({
            ...activeAuthUser,
            user_metadata: {
              ...activeAuthUser.user_metadata,
              full_name: cleanName,
              name: cleanName,
              nickname: cleanNickname,
              display_name: cleanNickname,
            },
            raw_user_meta_data: {
              ...activeAuthUser.raw_user_meta_data,
              full_name: cleanName,
              name: cleanName,
              nickname: cleanNickname,
              display_name: cleanNickname,
            },
          });
        }

        // Conecta o usuário e o direciona para o aplicativo
        loginWithEmail(cleanEmail);
        localStorage.setItem("vyra_is_new_user", "true");
        localStorage.setItem("vyra_open_profile_edit", "true");
        localStorage.setItem("vyra_logged_in", "true");
        localStorage.setItem("vyra_pending_fullname", cleanName);
        localStorage.setItem("vyra_pending_nickname", cleanNickname);
        setActiveView("profile");
        setFeedback({
          text: "Conta criada e sincronizada com sucesso! Bem-vindo ao VYRA.",
          type: "success",
        });
      } else {
        // Fluxo de Login estrito com Supabase Auth (sem mock, sem fallback de bypass)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error || !data?.user) {
          setFeedback({
            text: "E-mail ou senha incorretos. Tente novamente ou crie uma conta.",
            type: "error",
          });
          setLoading(false);
          return;
        }

        // Sucesso comprovado no Supabase: sincroniza dados reais
        await definirPerfil(data.user);
        const res = loginWithEmail(cleanEmail);
        setFeedback({ text: res.message, type: "success" });
      }
    } catch (err: any) {
      setFeedback({
        text: "E-mail ou senha incorretos. Tente novamente ou crie uma conta.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#151515] border border-[#2B2B2F] p-7 sm:p-8 space-y-5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto flex items-center justify-center">
          <VyraLogo className="w-full h-full" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#F5F5F7] tracking-tight">VYRA</h1>
          <p className="text-[11px] font-bold text-[#FF6A2A] uppercase tracking-widest mt-0.5">
            TRAINING & PERFORMANCE
          </p>
          <p className="text-xs text-[#9B9BA1] mt-1.5">
            {isSignUp
              ? "Crie sua conta para iniciar sua transformação de performance."
              : "Entre para acessar seus treinos, métricas e comunidade."}
          </p>
        </div>

        {/* Social Login Buttons (Google e Apple) */}
        <div className="space-y-2.5 pt-1">
          <button
            id="google-login-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#4285F4]/60 hover:bg-[#252528] text-[#F5F5F7] text-xs font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com o Google</span>
          </button>

          <button
            id="apple-login-btn"
            type="button"
            disabled={loading}
            onClick={handleAppleLogin}
            className="w-full py-3 px-4 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#9B9BA1] hover:bg-[#252528] text-[#F5F5F7] text-xs font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12-14.42-6.09-9.35-10.76-19.68-14-31-3.26-11.31-4.89-22.18-4.89-32.6 0-14.03 3.48-25.55 10.44-34.56 6.96-9.02 15.66-13.58 26.1-13.69 5.33 0 10.87 1.3 16.63 3.91 5.76 2.61 9.46 3.97 11.1 4.08 1.85-.11 5.76-1.52 11.74-4.24 5.98-2.72 11.2-3.97 15.65-3.75 14.68.87 25.87 6.47 33.58 16.8-12.83 7.72-19.13 18.27-18.91 31.64.22 10.44 4.13 19.14 11.74 26.1 7.61 6.96 16.74 10.87 27.4 11.74-2.18 6.53-4.78 13.16-7.83 19.9zM119.22 31.09c0-7.39 2.61-14.24 7.83-20.55 5.22-6.3 11.63-10.11 19.24-11.42.22 1.09.33 2.18.33 3.26 0 7.39-2.72 14.35-8.15 20.88-5.44 6.52-12 10.44-19.68 11.74-.32-1.2-.57-2.5-.57-3.91z" />
            </svg>
            <span>Continuar com a Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-[#2B2B2F]" />
          <span className="text-[11px] font-semibold text-[#9B9BA1] uppercase tracking-wider">
            ou com e-mail
          </span>
          <div className="flex-1 h-px bg-[#2B2B2F]" />
        </div>

        {/* Tab Switcher: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F]">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setFeedback(null);
            }}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !isSignUp
                ? "bg-[#2B2B2F] text-[#F5F5F7] shadow-sm"
                : "text-[#9B9BA1] hover:text-[#F5F5F7]"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setFeedback(null);
            }}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isSignUp
                ? "bg-[#FF6A2A] text-white shadow-sm"
                : "text-[#9B9BA1] hover:text-[#F5F5F7]"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Nome Completo
                </label>
                <input
                  id="signup-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Rafael Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
                  Apelido / Como quer ser chamado
                </label>
                <input
                  id="signup-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: Rafa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#9B9BA1] mb-1">
              {t("login.email")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFeedback(null);
                }}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#9B9BA1]">
                {t("login.password")}
              </label>
              <span className="text-[10px] text-[#9B9BA1]">Mínimo 6 caracteres</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFeedback(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-[#F5F5F7] text-sm focus:outline-none focus:border-[#FF6A2A]"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                feedback.type === "error"
                  ? "bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]"
                  : "bg-[#34C759]/10 border-[#34C759]/30 text-[#34C759]"
              }`}
            >
              {feedback.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6A2A] to-[#FF9A62] text-white hover:brightness-110 shadow-lg shadow-[#FF6A2A]/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
          >
            <span>{loading ? "Processando..." : isSignUp ? "Cadastrar e Iniciar" : t("cta.login")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

