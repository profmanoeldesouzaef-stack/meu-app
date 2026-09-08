import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { supabase } from "@/src/api/supabase";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang, setLang, colors, loggedIn, setLoggedIn, anamnesisDone } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loggedIn) {
      if (!anamnesisDone) router.replace("/anamnesis");
      else router.replace("/(tabs)");
    }
  }, [loggedIn, anamnesisDone, router]);

  const proceed = (isNewUser = false) => {
    setLoggedIn(true);
    if (isNewUser) {
      router.replace("/(tabs)/profile");
    } else if (!anamnesisDone) {
      router.replace("/anamnesis");
    } else {
      router.replace("/(tabs)");
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (supabase && supabase.auth) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
        });
        if (error) {
          console.warn("Supabase Google Auth:", error.message);
        }
      }
      proceed(false);
    } catch {
      proceed(false);
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (supabase && supabase.auth) {
        await supabase.auth.signInWithOAuth({ provider: "apple" });
      }
      proceed(false);
    } catch {
      proceed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (supabase && supabase.auth) {
          const { data } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
          });
          if (!data?.session) {
            try {
              await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
            } catch {}
          }
        }
        proceed(true);
      } else {
        if (supabase && supabase.auth) {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
        }
        proceed(false);
      }
    } catch {
      proceed(isSignUp);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Image
        source="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80"
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={["rgba(10,10,10,0.55)", "rgba(10,10,10,0.85)", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.xl,
          justifyContent: "space-between",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.langRow}>
          <Pressable testID="lang-toggle-pt" onPress={() => setLang("pt")}
            style={[styles.langPill, lang === "pt" && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
            <Text style={[styles.langText, lang === "pt" && { color: "#F5F5F7" }]}>PT</Text>
          </Pressable>
          <Pressable testID="lang-toggle-en" onPress={() => setLang("en")}
            style={[styles.langPill, lang === "en" && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
            <Text style={[styles.langText, lang === "en" && { color: "#F5F5F7" }]}>EN</Text>
          </Pressable>
        </View>

        <View>
          <Text style={styles.mark}>V Y R A</Text>
          <Text style={styles.tag}>{t("app.tagline")}</Text>
          <Text style={styles.sub}>{isSignUp ? "Crie sua conta para iniciar" : t("login.subtitle")}</Text>
        </View>

        <View style={styles.card}>
          {/* Social Login Buttons */}
          <Pressable testID="google-login-button" onPress={loginWithGoogle} disabled={loading} style={styles.googleBtn}>
            <Ionicons name="logo-google" size={18} color="#F5F5F7" />
            <Text style={styles.googleBtnText}>Continuar com o Google</Text>
          </Pressable>

          <Pressable testID="apple-login-button" onPress={loginWithApple} disabled={loading} style={styles.appleBtn}>
            <Ionicons name="logo-apple" size={20} color="#F5F5F7" />
            <Text style={styles.googleBtnText}>Continuar com a Apple</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou com e-mail</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>{t("login.email")}</Text>
          <TextInput testID="login-email" value={email} onChangeText={(t) => { setEmail(t); setErrorMsg(null); }} autoCapitalize="none"
            keyboardType="email-address" placeholder="seu.email@exemplo.com" placeholderTextColor="#9B9BA1" style={styles.input} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.label}>{t("login.password")}</Text>
            <Text style={{ color: "#9B9BA1", fontSize: 10 }}>Mínimo 6 dígitos</Text>
          </View>
          <TextInput testID="login-password" value={password} onChangeText={(t) => { setPassword(t); setErrorMsg(null); }} secureTextEntry
            placeholder="••••••••" placeholderTextColor="#9B9BA1" style={styles.input} />

          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#FF453A" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Pressable testID="login-submit-button" onPress={handleSubmit} disabled={loading}
            style={({ pressed }) => [styles.primary, { backgroundColor: colors.brand, opacity: pressed || loading ? 0.85 : 1 }]}>
            {loading ? (
              <ActivityIndicator color="#F5F5F7" />
            ) : (
              <Text style={styles.primaryText}>{isSignUp ? "Criar Conta" : t("cta.login")}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }} style={styles.toggleAuthBtn}>
            <Text style={styles.toggleAuthText}>
              {isSignUp ? "Já tem uma conta? Faça Login" : "Não tem conta? Cadastre-se"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  langRow: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  langPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: "#2B2B2F", backgroundColor: "rgba(21,21,21,0.7)" },
  langText: { color: "#9B9BA1", fontSize: fs.sm, fontWeight: "600" },
  mark: { color: "#F5F5F7", fontSize: 46, fontWeight: "800", letterSpacing: 8 },
  tag: { color: "#D8B46A", fontSize: fs.base, letterSpacing: 3, marginTop: spacing.sm, textTransform: "uppercase" },
  sub: { color: "#9B9BA1", fontSize: fs.lg, marginTop: spacing.md, lineHeight: 22 },
  card: { backgroundColor: "rgba(21,21,21,0.9)", borderColor: "#2B2B2F", borderWidth: 1, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm },
  label: { color: "#9B9BA1", fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: "#1D1D1F", borderRadius: radius.md, borderWidth: 1, borderColor: "#2B2B2F", color: "#F5F5F7", paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: fs.base },
  primary: { height: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", marginTop: spacing.xs },
  primaryText: { color: "#F5F5F7", fontSize: fs.lg, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2B2B2F" },
  dividerText: { color: "#9B9BA1", marginHorizontal: spacing.sm, fontSize: 11, textTransform: "uppercase" },
  googleBtn: { height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: "#2B2B2F", backgroundColor: "#1D1D1F", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  appleBtn: { height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: "#2B2B2F", backgroundColor: "#1D1D1F", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: 2 },
  googleBtnText: { color: "#F5F5F7", fontSize: fs.sm, fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: radius.md, backgroundColor: "rgba(255,69,58,0.12)", borderWidth: 1, borderColor: "rgba(255,69,58,0.3)" },
  errorText: { color: "#FF453A", fontSize: fs.xs, fontWeight: "600" },
  toggleAuthBtn: { alignItems: "center", paddingVertical: spacing.xs, marginTop: 2 },
  toggleAuthText: { color: "#FF6A2A", fontSize: fs.sm, fontWeight: "600" },
});