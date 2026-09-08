import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, fs } from "@/src/theme/tokens";

interface PaywallGateMobileProps {
  title?: string;
  description?: string;
  badge?: string;
  onGoBack?: () => void;
  onSubscribe?: () => void;
}

export const PaywallGateMobile: React.FC<PaywallGateMobileProps> = ({
  title = "Assinatura Inativa. Libere seu acesso para visualizar seu treino e dieta.",
  description = "Os treinos personalizados, dietas calculadas e desafios exclusivos da Vyra estão bloqueados. Ative seu plano para liberar seu acesso completo.",
  badge = "ACESSO EXCLUSIVO A ASSINANTES",
  onGoBack,
  onSubscribe,
}) => {
  const router = useRouter();

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      router.push("/(tabs)/profile");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255,106,42,0.18)", "rgba(10,10,10,0)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={32} color={colors.brand} />
        </View>

        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <Pressable
          testID="btn-paywall-unlock"
          onPress={handleSubscribe}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Assinar Agora</Text>
        </Pressable>

        {onGoBack && (
          <Pressable
            testID="btn-paywall-back"
            onPress={onGoBack}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.secondaryBtnText}>Voltar ao Início</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,106,42,0.12)",
    borderColor: "rgba(255,106,42,0.35)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,106,42,0.15)",
    borderColor: "rgba(255,106,42,0.3)",
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: colors.brand,
    fontSize: fs.sm,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fs.xl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fs.base,
    color: colors.textDim,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: fs.base,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: colors.textDim,
    fontSize: fs.sm,
    fontWeight: "600",
  },
});

export default PaywallGateMobile;
