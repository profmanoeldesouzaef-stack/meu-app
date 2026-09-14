import React, { useEffect, useState } from "react";
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
    theme,
    persona,
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
        {(activeView === "home" || !activeView) && <HomeView />}
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
        {activeView === "coach" && <CoachDashboardView />}
        {activeView === "moderator" && <ModeratorView />}
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
    // 1. Pega a sessão inicial
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Erro ao obter sessão:", err);
        setLoading(false);
      });

    // 2. Escuta mudanças de sessão em tempo real (incluindo login e logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
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

