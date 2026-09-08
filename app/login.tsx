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
  const {
    t,
    lang,
    setLang,
    colors,
    loggedIn,
    setLoggedIn,
    anamnesisDone,
    setCurrentUserName,
    setCurrentUserNickname,
    definirPerfil,
  } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
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
          Alert.alert("Erro com Google", error.message);
          return;
        }
      } else {
        Alert.alert("Autenticação", "Serviço de autenticação não configurado.");
      }
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível autenticar com Google.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (supabase && supabase.auth) {
        const { error } = await supabase.auth.signInWithOAuth({ provider: "apple" });
        if (error) {
          Alert.alert("Erro com Apple", error.message);
          return;
        }
      } else {
        Alert.alert("Autenticação", "Serviço de autenticação não configurado.");
      }
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível autenticar com Apple.");
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
          const msg = error.message || "Erro ao cadastrar usuário.";
          setErrorMsg(msg);
          Alert.alert("Erro no Cadastro", msg);
          setLoading(false);
          return;
        }

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

        setCurrentUserName(cleanName);
        setCurrentUserNickname(cleanNickname);

        let activeUser = data?.user;
        if (!data?.session) {
          const { data: signData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInErr || !signData?.user) {
            Alert.alert(
              "Conta Criada",
              "Sua conta foi criada com sucesso! Faça login com seu e-mail e senha."
            );
            setIsSignUp(false);
            setLoading(false);
            return;
          }
          activeUser = signData.user;
        }

        if (activeUser) {
          await definirPerfil({
            ...activeUser,
            user_metadata: {
              ...activeUser.user_metadata,
              full_name: cleanName,
              name: cleanName,
              nickname: cleanNickname,
              display_name: cleanNickname,
            },
            raw_user_meta_data: {
              ...activeUser.raw_user_meta_data,
              full_name: cleanName,
              name: cleanName,
              nickname: cleanNickname,
              display_name: cleanNickname,
            },
          });
        }

        proceed(true);
      } else {
        // Fluxo de Login estrito com Supabase Auth (sem mock e sem bypass)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error || !data?.user) {
          const msg = "E-mail ou senha incorretos. Tente novamente ou crie uma conta.";
          setErrorMsg(msg);
          Alert.alert("Erro de Autenticação", msg);
          setLoading(false);
          return;
        }

        proceed(false);
      }
    } catch {
      const msg = "E-mail ou senha incorretos. Tente novamente ou crie uma conta.";
      setErrorMsg(msg);
      Alert.alert("Erro de Autenticação", msg);
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

          {isSignUp && (
            <>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                testID="signup-fullname"
                value={fullName}
                onChangeText={(t) => {
                  setFullName(t);
                  setErrorMsg(null);
                }}
                autoCapitalize="words"
                placeholder="Ex: Rafael Silva"
                placeholderTextColor="#9B9BA1"
                style={styles.input}
              />

              <Text style={styles.label}>Apelido / Como quer ser chamado</Text>
              <TextInput
                testID="signup-nickname"
                value={nickname}
                onChangeText={(t) => {
                  setNickname(t);
                  setErrorMsg(null);
                }}
                autoCapitalize="words"
                placeholder="Ex: Rafa"
                placeholderTextColor="#9B9BA1"
                style={styles.input}
              />
            </>
          )}

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