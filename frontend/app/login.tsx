import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang, setLang, colors, loggedIn, setLoggedIn, anamnesisDone } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // auto-redirect if already authenticated on this device
    if (loggedIn) {
      if (!anamnesisDone) router.replace("/anamnesis");
      else router.replace("/(tabs)");
    }
  }, [loggedIn, anamnesisDone, router]);

  const proceed = () => {
    setLoggedIn(true);
    if (!anamnesisDone) router.replace("/anamnesis");
    else router.replace("/(tabs)");
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
          <Text style={styles.sub}>{t("login.subtitle")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("login.email")}</Text>
          <TextInput testID="login-email" value={email} onChangeText={setEmail} autoCapitalize="none"
            keyboardType="email-address" placeholder="you@vyra.club" placeholderTextColor="#9B9BA1" style={styles.input} />
          <Text style={styles.label}>{t("login.password")}</Text>
          <TextInput testID="login-password" value={password} onChangeText={setPassword} secureTextEntry
            placeholder="••••••••" placeholderTextColor="#9B9BA1" style={styles.input} />

          <Pressable testID="login-submit-button" onPress={proceed}
            style={({ pressed }) => [styles.primary, { backgroundColor: colors.brand, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.primaryText}>{t("cta.login")}</Text>
          </Pressable>

          <Pressable testID="enter-demo-button" onPress={proceed} style={styles.secondary}>
            <Ionicons name="flash-outline" size={16} color={colors.brand} />
            <Text style={styles.secondaryText}>{t("cta.enter_demo")}</Text>
          </Pressable>

          <Pressable style={styles.link}>
            <Text style={styles.linkText}>{t("cta.forgot")}</Text>
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
  card: { backgroundColor: "rgba(21,21,21,0.9)", borderColor: "#2B2B2F", borderWidth: 1, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  label: { color: "#9B9BA1", fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: "#1D1D1F", borderRadius: radius.md, borderWidth: 1, borderColor: "#2B2B2F", color: "#F5F5F7", paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: fs.lg },
  primary: { height: 52, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  primaryText: { color: "#F5F5F7", fontSize: fs.lg, fontWeight: "600" },
  secondary: { height: 52, borderRadius: radius.lg, borderWidth: 1, borderColor: "#2B2B2F", backgroundColor: "rgba(29,29,31,0.7)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  secondaryText: { color: "#F5F5F7", fontSize: fs.lg, fontWeight: "500" },
  link: { alignItems: "center", paddingVertical: spacing.sm },
  linkText: { color: "#9B9BA1", fontSize: fs.base },
});
