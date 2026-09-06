import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image } from "expo-image";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

// =====================================================================
// SEUS DADOS DO SUPABASE
// =====================================================================
const SUPABASE_URL = "https://qxcmqzzfsjvstlzveyrh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y21xenpmc2p2c3RsenZleXJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5MTQ1NiwiZXhwIjoyMTAzMTY3NDU2fQ.9n2Pc8d5X8FxrVbOAGB6R9yQePzvzghr9TtZ6J2EY1w";
// =====================================================================

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, fmtPrice, lang, setSubscription } = useApp();
  const { slug, cycle } = useLocalSearchParams<{ slug: string; cycle: "month" | "quarter" | "year" | "test" | "semiannual" }>();

  const [plan, setPlan] = useState<any>(null);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ valid: boolean; discount: number; total: number; percent: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para o Modal do PIX
  const [pixModalVisible, setPixModalVisible] = useState(false);
  const [pixCode, setPixCode] = useState("");

  // Mapeamento dos IDs da Stripe
  const stripePrices = {
    test: "price_1UCUoSF7VqDt14kNlN81QRA1", 
    month: "price_1U9FMDF7VqDt14kN3LneAWDA", 
    quarter: "price_1U9FMDF7VqDt14kNZhtT1hIO", 
    semiannual: "price_1U9FMDF7VqDt14kNRVRuJWd0", 
    year: "price_1U9FMDF7VqDt14kNu6fxBRkh", 
  };

  useEffect(() => {
    api.plans().then((all) => {
      const found = all.find((p) => p.slug === slug);
      if (found) {
        setPlan(found);
      } else if (slug === "test" || cycle === "test") {
        setPlan({
          name: "Plano de Teste Coach",
          slug: "test",
          description: "Plano de teste a R$ 1,00 para validação de gateway.",
          accent: colors.brand,
          prices_brl: { test: 1 },
          prices_usd: { test: 1 }
        });
      }
    });
  }, [slug, cycle]);

  if (!plan) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const subtotal =
    (lang === "pt"
      ? (plan.prices_brl?.[cycle] ?? (cycle === "semiannual" ? plan.prices_brl?.semester : null) ?? (cycle === "test" ? 1 : null) ?? 0)
      : (plan.prices_usd?.[cycle] ?? (cycle === "semiannual" ? plan.prices_usd?.semester : null) ?? (cycle === "test" ? 1 : null) ?? 0)) || 0;
  const discount = applied?.valid ? applied.discount : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    if (!code) return;
    const res = await api.coupon(code, subtotal);
    setApplied(res);
    setMessage(res.valid ? t("checkout.applied") : t("checkout.invalid"));
  };

  const confirm = async () => {
    setIsProcessing(true);
    const selectedStripePriceId = stripePrices[cycle as keyof typeof stripePrices];
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email: "aluno_teste@vyra.com.br", 
          userId: "00000000-0000-0000-0000-000000000000",
          priceId: selectedStripePriceId,
          paymentMethod: paymentMethod
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      if (paymentMethod === "pix") {
        setPixCode("00020101021126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-42665544000052040000530398654041.005802BR5913Vyra Treinamentos6008SAO PAULO62070503***6304");
        setPixModalVisible(true);
      } else {
        Alert.alert("Cartão", "Tela de cartão de crédito será aberta aqui via Stripe Elements.");
      }
      
    } catch (err: any) {
      Alert.alert("Erro no Pagamento", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixAndFinish = () => {
    Alert.alert("Copiado!", "Código PIX copiado. Vá ao app do seu banco para pagar.");
    setPixModalVisible(false);
    setSubscription({ active: true, planId: plan.slug, cycle });
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable testID="checkout-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.title}>{t("checkout.title")}</Text>

        <View style={styles.card}>
          <Text style={styles.section}>{t("checkout.summary")}</Text>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: plan.accent }]} />
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.cycleText}>
              {cycle === "test" ? "Teste" : t(`paywall.${cycle === "month" ? "monthly" : cycle === "quarter" ? "quarterly" : "yearly"}`)}
            </Text>
          </View>
          <Text style={styles.desc}>{plan.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>{t("checkout.coupon")}</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TextInput
              testID="coupon-input"
              value={code}
              onChangeText={setCode}
              placeholder={t("checkout.enter_coupon")}
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              style={styles.input}
            />
            <Pressable testID="coupon-apply" onPress={applyCoupon} style={styles.applyBtn}>
              <Text style={styles.applyText}>{t("cta.apply")}</Text>
            </Pressable>
          </View>
          {message && (
            <Text
              style={{
                color: applied?.valid ? colors.success : colors.error,
                marginTop: spacing.sm, fontSize: fs.sm,
              }}
            >
              {message} {applied?.valid ? `· -${applied.percent}%` : ""}
            </Text>
          )}
        </View>

        <Text style={[styles.section, { marginTop: spacing.md }]}>FORMA DE PAGAMENTO</Text>
        <View style={styles.paymentContainer}>
          <Pressable 
            onPress={() => setPaymentMethod("pix")}
            style={[styles.paymentBtn, paymentMethod === "pix" && styles.paymentBtnActive]}
          >
            <Ionicons name="qr-code-outline" size={24} color={paymentMethod === "pix" ? colors.brand : colors.textDim} />
            <Text style={[styles.paymentText, paymentMethod === "pix" && styles.paymentTextActive]}>PIX</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => setPaymentMethod("card")}
            style={[styles.paymentBtn, paymentMethod === "card" && styles.paymentBtnActive]}
          >
            <Ionicons name="card-outline" size={24} color={paymentMethod === "card" ? colors.brand : colors.textDim} />
            <Text style={[styles.paymentText, paymentMethod === "card" && styles.paymentTextActive]}>Cartão</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { marginTop: spacing.lg }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("checkout.subtotal")}</Text>
            <Text style={styles.totalValue}>{fmtPrice(subtotal, subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("checkout.discount")}</Text>
              <Text style={[styles.totalValue, { color: colors.brand }]}>
                -{lang === "pt" ? `R$ ${discount.toFixed(2)}` : `$ ${discount.toFixed(2)}`}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={styles.grandLabel}>{t("checkout.total")}</Text>
            <Text style={styles.grandValue}>
              {lang === "pt" ? `R$ ${total.toFixed(2)}` : `$ ${total.toFixed(2)}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          testID="confirm-purchase-button"
          onPress={confirm}
          disabled={isProcessing}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Ionicons name={paymentMethod === "pix" ? "qr-code" : "card"} size={18} color={colors.text} />
              <Text style={styles.ctaText}>
                {paymentMethod === "pix" ? "Gerar PIX" : "Pagar com Cartão"}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* MODAL DO PIX QUE APARECE POR CIMA DA TELA */}
      <Modal visible={pixModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagamento via PIX</Text>
              <Pressable onPress={() => setPixModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={styles.pixContainer}>
              <Text style={styles.pixSubtitle}>Escaneie o QR Code abaixo com o aplicativo do seu banco:</Text>
              
              <View style={styles.qrCodeBox}>
                <Image 
                  source={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${pixCode}&margin=10`}
                  style={{ width: 200, height: 200 }} 
                  contentFit="contain" 
                />
              </View>

              <Text style={styles.pixSubtitle}>Ou se preferir, use o código Copia e Cola:</Text>
              
              <View style={styles.pixStringBox}>
                <Text style={styles.pixStringText} numberOfLines={2} ellipsizeMode="middle">
                  {pixCode}
                </Text>
              </View>

              <Pressable onPress={copyPixAndFinish} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={18} color={colors.bg} />
                <Text style={styles.copyBtnText}>Copiar Código PIX</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 60, paddingBottom: 120, paddingHorizontal: spacing.xl },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: fs["2xl"], fontWeight: "700", marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  planName: { color: colors.text, fontSize: fs.xl, fontWeight: "700", flex: 1 },
  cycleText: { color: colors.textDim, fontSize: fs.base },
  desc: { color: colors.textDim, fontSize: fs.base, marginTop: spacing.sm, lineHeight: 20 },
  input: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg, letterSpacing: 1 },
  applyBtn: { paddingHorizontal: spacing.lg, height: 48, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  applyText: { color: colors.text, fontWeight: "600", fontSize: fs.base },
  
  paymentContainer: { flexDirection: "row", gap: spacing.md },
  paymentBtn: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", gap: 8 },
  paymentBtnActive: { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.05)" },
  paymentText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  paymentTextActive: { color: colors.brand },

  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  totalLabel: { color: colors.textDim, fontSize: fs.lg },
  totalValue: { color: colors.text, fontSize: fs.lg, fontWeight: "500" },
  grandLabel: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  grandValue: { color: colors.brand, fontSize: fs.xl, fontWeight: "800" },
  stickyBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  ctaText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },

  // Estilos do Modal do PIX
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  pixContainer: { padding: spacing.xl, alignItems: "center" },
  pixSubtitle: { color: colors.textDim, fontSize: fs.base, textAlign: "center", marginBottom: spacing.lg },
  qrCodeBox: { backgroundColor: "#FFF", padding: 16, borderRadius: radius.lg, marginBottom: spacing.xl },
  pixStringBox: { width: "100%", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  pixStringText: { color: colors.text, fontSize: fs.sm, textAlign: "center" },
  copyBtn: { width: "100%", height: 52, backgroundColor: colors.brand, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  copyBtnText: { color: colors.bg, fontSize: fs.lg, fontWeight: "700" },
});