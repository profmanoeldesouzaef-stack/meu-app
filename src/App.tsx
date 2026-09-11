import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { NotificationBanner } from "./components/NotificationBanner";
import { LoginModal } from "./components/LoginModal";
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
import { FirstTimeOnboardingModal } from "./components/FirstTimeOnboardingModal";

const AppContent: React.FC = () => {
  const {
    loggedIn,
    activeView,
    setActiveView,
    theme,
    persona,
    onboardingCompleted,
    milestoneCelebration,
    dismissMilestoneCelebration,
    chatNameColor,
    chatTextColor,
    setChatColors,
  } = useApp();
  const [formCheckerExercise, setFormCheckerExercise] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);

  // Strict role-based route guard
  React.useEffect(() => {
    if (persona === "student" && (activeView === "coach" || activeView === "moderator")) {
      setActiveView("home");
    }
  }, [persona, activeView, setActiveView]);

  if (!loggedIn) {
    return <LoginModal />;
  }

  // Mandatory fullscreen onboarding for students who haven't completed anamnesis
  if (persona === "student" && !onboardingCompleted && activeView !== "profile") {
    return (
      <div
        className={`min-h-screen font-sans selection:bg-[#FF6A2A] selection:text-white transition-colors duration-200 ${
          theme === "dark" ? "bg-[#0A0A0A] text-[#F5F5F7]" : "bg-[#F5F5F7] text-[#1D1D1F]"
        }`}
      >
        <FirstTimeOnboardingModal onCompleted={() => setActiveView(activeView && activeView !== "paywall" ? activeView : "home")} />
      </div>
    );
  }

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
        {activeView === "home" && <HomeView />}
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
        authorName={persona === "coach" ? "Coach Mari" : "Rafael Costa"}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
