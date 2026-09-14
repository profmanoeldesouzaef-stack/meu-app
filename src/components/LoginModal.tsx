import React, { useState } from "react";
import { VyraLogo } from "./VyraLogo";
import { AlertCircle, CheckCircle2, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export const LoginModal: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const getRedirectUrl = () => {
    if (typeof window !== "undefined" && window.location.origin) {
      return window.location.origin;
    }
    return "https://vyratraining.com";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setFeedback({
        text: "Por favor, preencha todos os campos obrigatórios.",
        type: "error",
      });
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setFeedback({
          text: "A senha deve ter no mínimo 6 caracteres.",
          type: "error",
        });
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setFeedback({
          text: "As senhas digitadas não coincidem. Verifique e tente novamente.",
          type: "error",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (!supabase || !supabase.auth) {
        setFeedback({
          text: "Serviço de autenticação não configurado.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      if (mode === "login") {
        // Autenticação por e-mail e senha
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (
            msg.includes("invalid login credentials") ||
            msg.includes("invalid_grant") ||
            msg.includes("invalid credential")
          ) {
            setFeedback({
              text: "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
              type: "error",
            });
          } else if (msg.includes("email not confirmed")) {
            setFeedback({
              text: "E-mail ainda não confirmado. Por favor, cheque sua caixa de entrada.",
              type: "error",
            });
          } else if (msg.includes("too many requests")) {
            setFeedback({
              text: "Muitas tentativas consecutivas. Aguarde alguns instantes antes de tentar de novo.",
              type: "error",
            });
          } else {
            setFeedback({
              text: error.message || "Erro ao realizar login.",
              type: "error",
            });
          }
        } else if (data?.user) {
          setFeedback({
            text: "Autenticado com sucesso! Entrando...",
            type: "success",
          });
        }
      } else {
        // Cadastro nativo com Supabase
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName.trim() || cleanEmail.split("@")[0],
              name: fullName.trim() || cleanEmail.split("@")[0],
              role: "aluno",
            },
          },
        });

        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("user already registered") || msg.includes("already registered")) {
            setFeedback({
              text: "Este e-mail já está cadastrado. Alterne para a aba 'Entrar'.",
              type: "error",
            });
          } else if (msg.includes("password should be")) {
            setFeedback({
              text: "A senha deve conter no mínimo 6 caracteres.",
              type: "error",
            });
          } else {
            setFeedback({
              text: error.message || "Erro ao criar conta.",
              type: "error",
            });
          }
        } else {
          if (data?.session) {
            setFeedback({
              text: "Conta criada com sucesso! Redirecionando...",
              type: "success",
            });
          } else {
            setFeedback({
              text: "Cadastro realizado com sucesso! Se necessário, confirme o link enviado ao seu e-mail.",
              type: "success",
            });
          }
        }
      }
    } catch (err: any) {
      setFeedback({
        text: err?.message || "Ocorreu um erro inesperado. Tente novamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (supabase && supabase.auth) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: getRedirectUrl(),
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
            redirectTo: getRedirectUrl(),
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

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto rounded-3xl bg-[#151515] border border-[#2B2B2F] p-6 sm:p-8 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 mx-auto flex items-center justify-center">
          <VyraLogo className="w-full h-full" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-[#F5F5F7] tracking-tight">VYRA</h1>
          <p className="text-[11px] font-bold text-[#FF6A2A] uppercase tracking-widest mt-0.5">
            TRAINING &amp; PERFORMANCE
          </p>
          <p className="text-xs text-[#9B9BA1] mt-2 leading-relaxed">
            {mode === "login"
              ? "Entre na sua conta para acessar seus treinos, métricas e comunidade."
              : "Crie sua conta para iniciar sua jornada de alta performance."}
          </p>
        </div>

        {/* Abas Entrar / Cadastrar */}
        <div className="flex rounded-xl bg-[#1D1D1F] p-1 border border-[#2B2B2F]">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => {
              setMode("login");
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-[#FF6A2A] text-white shadow-md"
                : "text-[#9B9BA1] hover:text-[#F5F5F7]"
            }`}
          >
            Entrar
          </button>
          <button
            id="tab-signup-btn"
            type="button"
            onClick={() => {
              setMode("signup");
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-[#FF6A2A] text-white shadow-md"
                : "text-[#9B9BA1] hover:text-[#F5F5F7]"
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* Feedback visual claro */}
        {feedback && (
          <div
            id="auth-feedback-banner"
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 text-left transition-all ${
              feedback.type === "error"
                ? "bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]"
                : "bg-[#34C759]/10 border-[#34C759]/30 text-[#34C759]"
            }`}
          >
            {feedback.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FF453A] mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34C759] mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback.text}</span>
          </div>
        )}

        {/* Formulário de E-mail e Senha */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-fullname-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#5A5A60] focus:border-[#FF6A2A] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-email-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#5A5A60] focus:border-[#FF6A2A] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password-input"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#5A5A60] focus:border-[#FF6A2A] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9BA1] hover:text-[#F5F5F7] cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9B9BA1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-confirm-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] text-xs text-[#F5F5F7] placeholder-[#5A5A60] focus:border-[#FF6A2A] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Botão de envio primário */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#FF6A2A] hover:bg-[#E85B1F] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-lg shadow-[#FF6A2A]/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : mode === "login" ? (
              <span>Entrar com e-mail e senha</span>
            ) : (
              <span>Cadastrar conta</span>
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2B2B2F]" />
          </div>
          <span className="relative bg-[#151515] px-3 text-[11px] font-bold text-[#9B9BA1] uppercase tracking-wider">
            ou continue com
          </span>
        </div>

        {/* Social Login Buttons (Google e Apple) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="google-login-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="py-3 px-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#4285F4]/60 hover:bg-[#252528] text-[#F5F5F7] text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span className="truncate">Google</span>
          </button>

          <button
            id="apple-login-btn"
            type="button"
            disabled={loading}
            onClick={handleAppleLogin}
            className="py-3 px-3 rounded-xl bg-[#1D1D1F] border border-[#2B2B2F] hover:border-[#9B9BA1] hover:bg-[#252528] text-[#F5F5F7] text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12-14.42-6.09-9.35-10.76-19.68-14-31-3.26-11.31-4.89-22.18-4.89-32.6 0-14.03 3.48-25.55 10.44-34.56 6.96-9.02 15.66-13.58 26.1-13.69 5.33 0 10.87 1.3 16.63 3.91 5.76 2.61 9.46 3.97 11.1 4.08 1.85-.11 5.76-1.52 11.74-4.24 5.98-2.72 11.2-3.97 15.65-3.75 14.68.87 25.87 6.47 33.58 16.8-12.83 7.72-19.13 18.27-18.91 31.64.22 10.44 4.13 19.14 11.74 26.1 7.61 6.96 16.74 10.87 27.4 11.74-2.18 6.53-4.78 13.16-7.83 19.9zM119.22 31.09c0-7.39 2.61-14.24 7.83-20.55 5.22-6.3 11.63-10.11 19.24-11.42.22 1.09.33 2.18.33 3.26 0 7.39-2.72 14.35-8.15 20.88-5.44 6.52-12 10.44-19.68 11.74-.32-1.2-.57-2.5-.57-3.91z" />
            </svg>
            <span className="truncate">Apple</span>
          </button>
        </div>

        {/* Rodapé alternar modo */}
        <div className="pt-2 text-center text-xs text-[#9B9BA1]">
          {mode === "login" ? (
            <p>
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setFeedback(null);
                }}
                className="text-[#FF6A2A] font-bold hover:underline cursor-pointer ml-1"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          ) : (
            <p>
              Já possui conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFeedback(null);
                }}
                className="text-[#FF6A2A] font-bold hover:underline cursor-pointer ml-1"
              >
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const LoginView = LoginModal;
export default LoginModal;
