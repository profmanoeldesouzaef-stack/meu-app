import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, StatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AppProvider, useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

// Hide default web scrollbar globally (user requested)
if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
    *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    body { background-color: #0A0A0A; }
  `;
  document.head.appendChild(style);
}

function AppInner() {
  const { loggedIn, setAnamnesisDone } = useApp();
  const router = useRouter();
  const segments = useSegments();

  // AuthGuard: Bloqueio de Visitantes - Fim do Modo Visitante
  useEffect(() => {
    const inAuthGroup = segments[0] === "login";
    if (!loggedIn && !inAuthGroup) {
      router.replace("/login");
    }
  }, [loggedIn, segments, router]);

  // sync remote profile → local flag once on cold start
  useEffect(() => {
    api.profile()
      .then((p) => { if (p?.anamnesis_done) setAnamnesisDone(true); })
      .catch(() => {});
  }, [setAnamnesisDone]);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0A" },
          animation: "fade",
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppInner />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
