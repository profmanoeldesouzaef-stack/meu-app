import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const handleSubscribeExternal = () => {
    const targetUrl = slug 
      ? `https://vyratraining.com?plan=${slug}` 
      : "https://vyratraining.com";
    Linking.openURL(targetUrl);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
        <Text style={styles.backText}>Voltar</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={36} color={colors.brand} />
        </View>

        <Text style={styles.title}>Portal Oficial Seguro</Text>

        <Text style={styles.description}>
          A assinatura e ativação dos protocolos são realizadas de forma segura em nosso portal oficial.
        </Text>

        <Text style={styles.subDescription}>
          O aplicativo móvel não processa transações financeiras internamente para total conformidade com as diretrizes e máxima segurança.
        </Text>

        <Pressable onPress={handleSubscribeExternal} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Ir para o Portal Oficial</Text>
          <Ionicons name="open-outline" size={18} color="#0A0A0A" />
        </Pressable>

        <Pressable onPress={() => router.replace("/paywall")} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Ver outros protocolos</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xl,
    alignSelf: "flex-start",
  },
  backText: {
    color: colors.textDim,
    fontSize: fs.sm,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,106,42,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,106,42,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fs.xl,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.text,
    fontSize: fs.sm,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  subDescription: {
    color: colors.textDim,
    fontSize: fs.xs,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    backgroundColor: colors.brand,
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  ctaText: {
    color: "#0A0A0A",
    fontSize: fs.sm,
    fontWeight: "800",
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    color: colors.textDim,
    fontSize: fs.xs,
    fontWeight: "600",
  },
});
