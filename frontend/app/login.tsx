import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang, setLang } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Image
        source="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80"
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={["rgba(10,10,10,0.55)", "rgba(10,10,10,0.85)", colors.bg]}
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
      >
        <View style={styles.langRow}>
          <Pressable
            testID="lang-toggle-pt"
            onPress={() => setLang("pt")}
            style={[styles.langPill, lang === "pt" && styles.langPillActive]}
          >
            <Text style={[styles.langText, lang === "pt" && styles.langTextActive]}>PT</Text>
          </Pressable>
          <Pressable
            testID="lang-toggle-en"
            onPress={() => setLang("en")}
            style={[styles.langPill, lang === "en" && styles.langPillActive]}
          >
            <Text style={[styles.langText, lang === "en" && styles.langTextActive]}>EN</Text>
          </Pressable>
        </View>

        <View>
          <Text style={styles.mark}>V Y R A</Text>
          <Text style={styles.tag}>{t("app.tagline")}</Text>
          <Text style={styles.sub}>{t("login.subtitle")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("login.email")}</Text>
          <TextInput
            testID="login-email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@vyra.club"
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />
          <Text style={styles.label}>{t("login.password")}</Text>
          <TextInput
            testID="login-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />

          <Pressable
            testID="login-submit-button"
            onPress={() => router.replace("/paywall")}
            style={({ pressed }) => [styles.primary, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.primaryText}>{t("cta.login")}</Text>
          </Pressable>

          <Pressable
            testID="enter-demo-button"
            onPress={() => router.replace("/paywall")}
            style={styles.secondary}
          >
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
  langPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(21,21,21,0.7)",
  },
  langPillActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  langText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  langTextActive: { color: colors.text },
  mark: { color: colors.text, fontSize: 46, fontWeight: "800", letterSpacing: 8 },
  tag: { color: colors.gold, fontSize: fs.base, letterSpacing: 3, marginTop: spacing.sm, textTransform: "uppercase" },
  sub: { color: colors.textDim, fontSize: fs.lg, marginTop: spacing.md, lineHeight: 22 },
  card: {
    backgroundColor: "rgba(21,21,21,0.9)",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  label: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1 },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fs.lg,
  },
  primary: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  primaryText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  secondary: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(29,29,31,0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  secondaryText: { color: colors.text, fontSize: fs.lg, fontWeight: "500" },
  link: { alignItems: "center", paddingVertical: spacing.sm },
  linkText: { color: colors.textDim, fontSize: fs.base },
});
