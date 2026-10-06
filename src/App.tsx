import React, { useEffect, useState } from "react";
import { UserCheck, Shield } from "lucide-react";
import { supabase } from "./supabaseClient";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { NotificationBanner } from "./components/NotificationBanner";
import { MilestoneCelebrationModal } from "./components/MilestoneCelebrationModal";
import { ChatColorPickerModal } from "./components/ChatColorPickerModal";
import { HomeView } from "./views/HomeView";
import { TrainingView } from "./views/TrainingView";
import { DietView } from "./views/DietView";
import { ProgressView } from "./views/ProgressView";
import { ProfileView } from "./views/ProfileView";
import { PaywallView } from "./views/PaywallView";
import { CheckoutView } from "./views/CheckoutView";
import { AnamnesisView } from "./views/AnamnesisView";
import { ChallengesView } from "./views/ChallengesView";
import { CommunityView } from "./views/CommunityView";
import { CoachDashboardView } from "./views/CoachDashboardView";
import { ModeratorView } from "./views/ModeratorView";
import { FormCheckerModal } from "./views/FormCheckerModal";
import { PhotoGalleryView } from "./views/PhotoGalleryView";
import { GaleriaView } from "./views/GaleriaView";
import { WorkoutCompletionView } from "./views/WorkoutCompletionView";
import { LoginModal } from "./components/LoginModal";

// Componente principal de aluno/painel
export const MainDashboard: React.FC<{ user?: any }> = ({ user }) => {
  const {
    user: contextUser,
    activeView,
    setActiveView,
    theme,
    persona,
    isCoach,
    isModerator,
    isAdmin,
    userRole,
    milestoneCelebration,
    dismissMilestoneCelebration,
    chatNameColor,
    chatTextColor,
    setChatColors,
  } = useApp();
  const [formCheckerExercise, setFormCheckerExercise] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);

  const currentUser = user || contextUser;

  return (
    <div
      className={`min-h-screen font-sans selection:bg-[#FF6A2A] selection:text-white transition-colors duration-200 ${
        theme === "dark" ? "bg-[#0A0A0A] text-[#F5F5F7]" : "bg-[#F5F5F7] text-[#1D1D1F]"
      }`}
    >
      <NotificationBanner />
      <Header />
      <Navigation />

      <main className="min-h-[calc(100vh-140px)]">
        {(activeView === "home" || !activeView) && (
          userRole === "aluno" || persona === "student" ? (
            <HomeView />
          ) : isCoach ? (
            <CoachDashboardView />
          ) : isModerator ? (
            <ModeratorView />
          ) : (
            <HomeView />
          )
        )}
        {activeView === "training" && (
          <TrainingView
            onOpenFormChecker={(exerciseName) =>
              setFormCheckerExercise(exerciseName || "Supino Reto com Barra")
            }
          />
        )}
        {activeView === "diet" && <DietView />}
        {activeView === "progress" && <ProgressView />}
        {activeView === "challenges" && <ChallengesView />}
        {activeView === "galeria" && <GaleriaView />}
        {activeView === "photo-gallery" && <GaleriaView />}
        {activeView === "community" && <CommunityView onOpenColorPicker={() => setIsColorPickerOpen(true)} />}
        {activeView === "profile" && <ProfileView onOpenColorPicker={() => setIsColorPickerOpen(true)} />}
        {activeView === "paywall" && <PaywallView />}
        {activeView === "checkout" && <CheckoutView />}
        {activeView === "anamnesis" && <AnamnesisView />}
        {activeView === "coach" && (
          isCoach ? (
            <CoachDashboardView />
          ) : (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D8B46A]/10 border border-[#D8B46A]/30 text-[#D8B46A] flex items-center justify-center mx-auto shadow-lg shadow-[#D8B46A]/10">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F7]">Área Restrita aos Treinadores</h2>
              <p className="text-sm text-[#9B9BA1] leading-relaxed">
                Este painel de prescrições, auditoria e CRM de alunos é exclusivo para a equipe de coaches credenciados Vyra.
              </p>
              <button
                onClick={() => setActiveView("home")}
                className="px-6 py-2.5 rounded-xl bg-[#FF6A2A] text-white font-bold text-sm hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#FF6A2A]/20"
              >
                Voltar à Área do Aluno
              </button>
            </div>
          )
        )}
        {activeView === "moderator" && (
          isModerator ? (
            <ModeratorView />
          ) : (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#6D9BFF]/10 border border-[#6D9BFF]/30 text-[#6D9BFF] flex items-center justify-center mx-auto shadow-lg shadow-[#6D9BFF]/10">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#F5F5F7]">Área Restrita à Moderação</h2>
              <p className="text-sm text-[#9B9BA1] leading-relaxed">
                Este painel de governança, credenciamento e auditoria da plataforma é restrito aos administradores e moderadores oficiais Vyra.
              </p>
              <button
                onClick={() => setActiveView("home")}
                className="px-6 py-2.5 rounded-xl bg-[#FF6A2A] text-white font-bold text-sm hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#FF6A2A]/20"
              >
                Voltar à Área do Aluno
              </button>
            </div>
          )
        )}
        {activeView === "workout-completion" && <WorkoutCompletionView />}
      </main>

      {/* Form Checker Modal Overlay */}
      {formCheckerExercise && (
        <FormCheckerModal
          initialExercise={formCheckerExercise}
          onClose={() => setFormCheckerExercise(null)}
        />
      )}

      {/* Celebratory Milestone Modal */}
      {milestoneCelebration && (
        <MilestoneCelebrationModal
          data={milestoneCelebration}
          onClose={dismissMilestoneCelebration}
          onOpenColorPicker={() => setIsColorPickerOpen(true)}
        />
      )}

      {/* VIP Chat Color Picker Modal */}
      <ChatColorPickerModal
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        currentNameColor={chatNameColor}
        currentTextColor={chatTextColor}
        onSave={(nameColor, textColor) => setChatColors(nameColor, textColor)}
        authorName={persona === "coach" ? "Coach Mari" : (currentUser?.user_metadata?.full_name || "Aluno Vyra")}
      />
    </div>
  );
};

export function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Pega a sessão inicial e consulta o papel diretamente no banco
    async function loadSessionAndProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          let profile: any = null;
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('role, cargo, is_coach')
              .eq('id', session.user.id)
              .single();
            if (!error && data) {
              profile = data;
            }
          } catch (e) {
            console.warn("Aviso ao consultar profiles:", e);
          }

          if (!profile && session.user.email) {
            const { data: profileByEmail } = await supabase
              .from('profiles')
              .select('role, cargo, is_coach')
              .ilike('email', session.user.email.trim())
              .maybeSingle();
            if (profileByEmail) {
              profile = profileByEmail;
            }
          }

          const userRole = (profile?.role || profile?.cargo || '').toLowerCase();
          const isCoach = userRole === 'coach' || profile?.is_coach === true;
          const isModerator = userRole === 'moderator' || userRole === 'moderador';

          console.log('[AUTH PROFILE]:', { email: session.user.email, profile, userRole, isCoach, isModerator });
        }
        setSession(session);
      } catch (err) {
        console.warn("Erro ao obter sessão:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSessionAndProfile();

    // 2. Escuta mudanças de sessão em tempo real (incluindo login e logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (currentSession?.user) {
        let profile: any = null;
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role, cargo, is_coach')
            .eq('id', currentSession.user.id)
            .single();
          if (!error && data) {
            profile = data;
          }
        } catch (e) {
          console.warn("Aviso ao consultar profiles:", e);
        }

        if (!profile && currentSession.user.email) {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('role, cargo, is_coach')
            .ilike('email', currentSession.user.email.trim())
            .maybeSingle();
          if (profileByEmail) {
            profile = profileByEmail;
          }
        }

        const userRole = (profile?.role || profile?.cargo || '').toLowerCase();
        const isCoach = userRole === 'coach' || profile?.is_coach === true;
        const isModerator = userRole === 'moderator' || userRole === 'moderador';

        console.log('[AUTH PROFILE]:', { email: currentSession.user.email, profile, userRole, isCoach, isModerator });
      }
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tela de sincronização enquanto o Supabase processa a URL/token
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-orange-500 font-semibold">
        Sincronizando Vyra Training...
      </div>
    );
  }

  // Se houver sessão ativa: renderiza a área interna do app
  if (session?.user) {
    return (
      <AppProvider>
        <MainDashboard user={session.user} />
      </AppProvider>
    );
  }

  // Se não houver sessão ativa: renderiza a tela de login tradicional
  return <LoginModal />;
}

export default App;

