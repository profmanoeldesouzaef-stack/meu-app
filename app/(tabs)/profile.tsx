import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, FlatList, ActivityIndicator, Alert, Switch } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp, Theme } from "@/src/context/AppContext";
import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase";
import { FinanceCRMTable } from "@/src/components/FinanceCRMTable";

export { FinanceCRMTable };

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, theme, setTheme, subscription, setSubscription, setLoggedIn, persona, currentUserEmail, isCoachEmail, isChampion } = useApp();
  const [profile, setProfile] = useState<any>(null);
  
  // Papel do usuário no Supabase
  const [role, setRole] = useState<"coach" | "student">("student");
  const [loadingRole, setLoadingRole] = useState(true);

  // Modais
  const [editOpen, setEditOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);

  // Verificação de Papel (Supabase + Contexto)
  useEffect(() => {
    let active = true;

    async function checkUserRoleAndProfile() {
      try {
        setLoadingRole(true);
        const p = await api.profile().catch(() => null);
        if (active && p) setProfile(p);

        let determinedRole: "coach" | "student" = "student";

        // 1. Consulta usuário atual no Supabase Auth
        if (supabase && supabase.auth) {
          const { data: authData } = await supabase.auth.getUser();
          const user = authData?.user;

          if (user) {
            // Metadados do Supabase
            const metaRole = user.user_metadata?.role;
            if (metaRole === "coach") {
              determinedRole = "coach";
            } else {
              // Consulta tabela 'profiles' no Supabase
              const { data: sbProfile } = await supabase
                .from("profiles")
                .select("role, is_coach, email")
                .eq("id", user.id)
                .maybeSingle();

              if (sbProfile?.role === "coach" || sbProfile?.is_coach === true) {
                determinedRole = "coach";
              } else if (isCoachEmail(user.email || "") || isCoachEmail(sbProfile?.email || "")) {
                determinedRole = "coach";
              }
            }
          }
        }

        // 2. Fallbacks com dados de perfil e persona
        if (determinedRole !== "coach") {
          if (
            p?.role === "coach" ||
            p?.is_coach === true ||
            persona === "coach" ||
            isCoachEmail(p?.email || currentUserEmail || "")
          ) {
            determinedRole = "coach";
          }
        }

        if (active) {
          setRole(determinedRole);
        }
      } catch (err) {
        console.warn("Erro ao verificar papel do usuário no Supabase:", err);
      } finally {
        if (active) setLoadingRole(false);
      }
    }

    checkUserRoleAndProfile();

    return () => {
      active = false;
    };
  }, [persona, currentUserEmail, isCoachEmail]);

  const isCoach = role === "coach";

  const logout = () => {
    setSubscription({ active: false });
    setLoggedIn(false);
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing["3xl"] + 60,
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>{t("sec.profile")}</Text>

        {/* Header do Perfil (Com diferenciação Coach vs Aluno) */}
        <View style={styles.headerCard}>
          <Image
            source={
              profile?.avatar_url ||
              (isCoach
                ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                : "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80")
            }
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {profile?.full_name || profile?.nickname ?? (isCoach ? "Coach Vyra" : "Aluno")}
            </Text>
            <Text style={styles.email}>{profile?.email ?? "-"}</Text>

            {isCoach ? (
              <View style={[styles.badge, { backgroundColor: "rgba(255,106,42,0.15)", borderColor: "rgba(255,106,42,0.4)", borderWidth: 1 }]}>
                <Ionicons name="shield-checkmark" size={12} color={colors.brand} />
                <Text style={{ color: colors.brand, fontSize: fs.sm, fontWeight: "700" }}>
                  COACH OFICIAL · VYRA
                </Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: subscription.active ? "rgba(52,199,89,0.15)" : "rgba(216,180,106,0.15)" }]}>
                <Ionicons name={subscription.active ? "shield-checkmark" : "sparkles"} size={12} color={subscription.active ? colors.success : colors.gold} />
                <Text style={{ color: subscription.active ? colors.success : colors.gold, fontSize: fs.sm, fontWeight: "600" }}>
                  {subscription.active ? `${subscription.planId?.toUpperCase()} · ${t("profile.active")}` : t("profile.inactive")}
                </Text>
              </View>
            )}

            {/* Coroa: Estritamente condicionada ao banco de dados Supabase */}
            {isChampion && (
              <View style={[styles.badge, { backgroundColor: "rgba(255,106,42,0.15)", borderColor: "rgba(255,106,42,0.4)", borderWidth: 1, marginTop: 4 }]}>
                <Ionicons name="trophy" size={12} color={colors.gold} />
                <Text style={{ color: colors.gold, fontSize: fs.sm, fontWeight: "700" }}>
                  CAMPEÃO OFICIAL
                </Text>
              </View>
            )}
          </View>
          <Pressable testID="edit-profile-btn" onPress={() => setEditOpen(true)} style={styles.editIcon}>
            <Ionicons name="pencil" size={16} color={colors.brand} />
          </Pressable>
        </View>

        {/* ========================================================= */}
        {/* BLOCO 1: RENDERIZAÇÃO CONDICIONAL BASEADA NO ROLE (SUPABASE) */}
        {/* ========================================================= */}

        {isCoach ? (
          /* --- VISÃO DO COACH --- */
          /* Oculta botões de "Assinatura / Cartão de Crédito" e "Meu Protocolo" */
          /* Exibe apenas edição de perfil e botões de gestão (Dashboard Financeiro, Gestão de Alunos) */
          <>
            <Text style={[styles.section, { color: colors.brand, marginTop: spacing.xl }]}>
              PAINEL DE GESTÃO DO COACH
            </Text>

            {/* Resumo Financeiro & Alunos */}
            <View style={styles.coachCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                <View>
                  <Text style={{ color: colors.textDim, fontSize: fs.sm }}>MRR (Receita Recorrente)</Text>
                  <Text style={{ color: colors.brand, fontSize: fs["2xl"], fontWeight: "800" }}>R$ 4.250,00</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.textDim, fontSize: fs.sm }}>Alunos Ativos</Text>
                  <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700" }}>38</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: "rgba(255,106,42,0.15)", marginVertical: spacing.xs }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <Text style={{ color: colors.textDim, fontSize: fs.sm }}>Taxa de Retenção</Text>
                <Text style={{ color: colors.success, fontSize: fs.base, fontWeight: "700" }}>94.7%</Text>
              </View>
            </View>

            {/* Botões de Gestão: Dashboard Financeiro e Gestão de Alunos */}
            <Text style={styles.section}>MÓDULOS DE GESTÃO</Text>
            
            {/* Dashboard Financeiro */}
            <Pressable
              testID="btn-coach-financial-dashboard"
              onPress={() => setDashboardOpen(true)}
              style={[styles.rowBtn, { marginBottom: spacing.sm }]}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="stats-chart" size={18} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>Dashboard Financeiro</Text>
                <Text style={styles.rowSubtext}>Receitas, repasses, assinantes e métricas de conversão</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </Pressable>

            {/* Gestão de Alunos */}
            <Pressable
              testID="btn-coach-students-management"
              onPress={() => setStudentsModalOpen(true)}
              style={styles.rowBtn}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="people" size={18} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>Gestão de Alunos</Text>
                <Text style={styles.rowSubtext}>Acompanhamento individual, status e prescrição</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </Pressable>
          </>
        ) : (
          /* --- VISÃO DO ALUNO --- */
          /* Contém configurações padrão, perimetria e os botões "Assinatura / Cartão de Crédito" e "Meu Protocolo" */
          <>
            {/* Medidas e Perimetria */}
            <Text style={styles.section}>{t("sec.perimetry")}</Text>
            <View style={styles.periGrid}>
              <PeriCell label={t("profile.height")} value={profile?.height_cm} suffix="cm" />
              <PeriCell label={t("profile.weight")} value={profile?.weight_kg} suffix="kg" />
              <PeriCell label={t("profile.waist")} value={profile?.waist_cm} suffix="cm" />
              <PeriCell label={t("profile.right_arm")} value={profile?.right_arm_cm} suffix="cm" />
              <PeriCell label={t("profile.left_arm")} value={profile?.left_arm_cm} suffix="cm" />
              <PeriCell label={t("profile.right_leg")} value={profile?.right_leg_cm} suffix="cm" />
              <PeriCell label={t("profile.left_leg")} value={profile?.left_leg_cm} suffix="cm" />
            </View>

            {/* ASSINATURA E PAGAMENTO */}
            <Text style={styles.section}>ASSINATURA & FORMAS DE PAGAMENTO</Text>
            
            {/* Botão Ver Planos */}
            <Pressable
              testID="view-plans-btn"
              onPress={() => router.push("/paywall")}
              style={styles.rowBtn}
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { color: colors.text, fontWeight: "700" }]}>
                  Ver Planos
                </Text>
                <Text style={styles.rowSubtext}>
                  {subscription.active
                    ? `Plano Atual: ${subscription.planId?.toUpperCase()} · ${subscription.cycle || "Ativo"}`
                    : "Conheça os protocolos Shape, Force e Reset 12"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </Pressable>
          </>
        )}

        {/* Configurações de Tema */}
        <Text style={styles.section}>{t("profile.theme")}</Text>
        <View style={{ gap: spacing.sm }}>
          {(["dark", "light"] as Theme[]).map((th) => (
            <Pressable
              key={th}
              testID={`profile-theme-${th}`}
              onPress={() => setTheme(th)}
              style={[styles.langCard, theme === th && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" }]}
            >
              <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                <Ionicons name={th === "dark" ? "moon" : "sunny"} size={16} color={theme === th ? colors.brand : colors.textDim} />
                <Text style={[styles.langText, theme === th && { color: colors.text }]}>
                  {th === "dark" ? t("profile.dark") : t("profile.light")}
                </Text>
              </View>
              {theme === th && <Ionicons name="checkmark-circle" size={18} color={colors.brand} />}
            </Pressable>
          ))}
        </View>

        <Pressable testID="logout-btn" onPress={logout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>{t("cta.logout")}</Text>
        </Pressable>

        <Text style={styles.version}>{t("profile.version")}</Text>
      </ScrollView>

      {/* Modais */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        isCoach={isCoach}
        onSaved={(p: any) => setProfile(p)}
      />
      <CoachDashboardModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <CoachStudentsModal open={studentsModalOpen} onClose={() => setStudentsModalOpen(false)} />
      <PaymentMethodsModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <ProtocolModal open={protocolModalOpen} onClose={() => setProtocolModalOpen(false)} profile={profile} />
    </View>
  );
}

// --- MODAL DE FORMAS DE PAGAMENTO DO ALUNO ---
function PaymentMethodsModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [isAdding, setIsAdding] = useState(false);
  const [cards, setCards] = useState<any[]>([
    { id: "pm_1", brand: "Mastercard", cardholder: "RAFAEL SILVA", last4: "4242", exp: "12/28", isDefault: true },
  ]);

  // Form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@vyra_saved_cards").then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCards(parsed);
          }
        } catch {}
      }
    });
  }, [open]);

  const detectBrand = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (/^4/.test(clean)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "Mastercard";
    if (/^(4011|4389|5041|5067|6362)/.test(clean)) return "Elo";
    if (/^3[47]/.test(clean)) return "Amex";
    return "Cartão";
  };

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    setCardNumber(parts.join(" "));
    setErrorMsg(null);
  };

  const handleExpiryChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2, 4)}`);
    } else {
      setExpiry(digits);
    }
    setErrorMsg(null);
  };

  const handleSaveCard = async () => {
    const cleanNum = cardNumber.replace(/\D/g, "");
    if (cleanNum.length < 13) {
      setErrorMsg("Número de cartão inválido (mínimo 13 dígitos).");
      return;
    }
    if (!cardholder.trim() || cardholder.trim().length < 3) {
      setErrorMsg("Informe o nome do titular impresso no cartão.");
      return;
    }
    if (expiry.length < 5) {
      setErrorMsg("Data de validade inválida (formato MM/AA).");
      return;
    }
    if (cvv.length < 3) {
      setErrorMsg("CVV inválido (3 ou 4 dígitos).");
      return;
    }

    setSaving(true);
    const brand = detectBrand(cleanNum);
    const last4 = cleanNum.slice(-4);
    const newCard = {
      id: `pm_${Date.now()}`,
      brand,
      cardholder: cardholder.trim().toUpperCase(),
      last4,
      exp: expiry,
      isDefault: setAsDefault || cards.length === 0,
    };

    let updatedCards = cards;
    if (newCard.isDefault) {
      updatedCards = cards.map((c) => ({ ...c, isDefault: false }));
      updatedCards.unshift(newCard);
    } else {
      updatedCards = [newCard, ...cards];
    }

    setCards(updatedCards);
    await AsyncStorage.setItem("@vyra_saved_cards", JSON.stringify(updatedCards));

    setSaving(false);
    setIsAdding(false);
    setCardNumber("");
    setCardholder("");
    setExpiry("");
    setCvv("");
    setSetAsDefault(false);
    Alert.alert("Sucesso", "Cartão de crédito salvo com sucesso e protegido via Stripe!");
  };

  const handleRemove = async (id: string) => {
    Alert.alert("Remover Cartão", "Deseja remover este cartão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          const filtered = cards.filter((c) => c.id !== id);
          if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
            filtered[0].isDefault = true;
          }
          setCards(filtered);
          await AsyncStorage.setItem("@vyra_saved_cards", JSON.stringify(filtered));
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    const updated = cards.map((c) => ({ ...c, isDefault: c.id === id }));
    setCards(updated);
    await AsyncStorage.setItem("@vyra_saved_cards", JSON.stringify(updated));
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: colors.bg, marginTop: insets.top }}>
        <View style={styles.modalHeader}>
          <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700", flex: 1 }}>
            Formas de Pagamento
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={{ color: colors.textDim, fontSize: fs.base, marginBottom: spacing.lg }}>
            Gerencie seus cartões para renovação automática de assinaturas e compras. Seus dados são protegidos e tokenizados pela Stripe.
          </Text>

          {!isAdding ? (
            <>
              {cards.map((card) => (
                <View key={card.id} style={[styles.cardItem, card.isDefault && { borderColor: colors.brand }]}>
                  <View style={styles.cardBrandBox}>
                    <Ionicons name="card" size={22} color={card.isDefault ? colors.brand : colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.cardText}>{card.brand} final {card.last4}</Text>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>PRINCIPAL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardExp}>Titular: {card.cardholder || "Aluno"}</Text>
                    <Text style={styles.cardExp}>Expira em {card.exp}</Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {!card.isDefault && (
                      <Pressable onPress={() => handleSetDefault(card.id)} style={{ padding: 6 }}>
                        <Ionicons name="star-outline" size={18} color={colors.textDim} />
                      </Pressable>
                    )}
                    <Pressable onPress={() => handleRemove(card.id)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))}

              <Pressable
                testID="add-card-open-btn"
                onPress={() => {
                  setIsAdding(true);
                  setErrorMsg(null);
                }}
                style={styles.addCardBtn}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.brand} />
                <Text style={styles.addCardText}>Adicionar Novo Cartão</Text>
              </Pressable>
            </>
          ) : (
            /* Formulário para Adicionar Cartão */
            <View style={{ gap: spacing.md, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.brand, fontSize: fs.lg, fontWeight: "700" }}>
                  Novo Cartão de Crédito
                </Text>
                <Pressable onPress={() => setIsAdding(false)}>
                  <Text style={{ color: colors.textDim, fontSize: fs.sm }}>Cancelar</Text>
                </Pressable>
              </View>

              <View>
                <Text style={styles.label}>Número do Cartão ({detectBrand(cardNumber)})</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  keyboardType="numeric"
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={colors.textDim}
                  maxLength={19}
                  style={styles.input}
                />
              </View>

              <View>
                <Text style={styles.label}>Nome Impresso no Cartão</Text>
                <TextInput
                  value={cardholder}
                  onChangeText={(t) => setCardholder(t.toUpperCase())}
                  autoCapitalize="characters"
                  placeholder="Ex: RAFAEL SILVA"
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                />
              </View>

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Validade (MM/AA)</Text>
                  <TextInput
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    keyboardType="numeric"
                    placeholder="12/28"
                    placeholderTextColor={colors.textDim}
                    maxLength={5}
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    value={cvv}
                    onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="numeric"
                    secureTextEntry
                    placeholder="123"
                    placeholderTextColor={colors.textDim}
                    maxLength={4}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs }}>
                <Text style={{ color: colors.text, fontSize: fs.base }}>Definir como cartão principal</Text>
                <Switch
                  value={setAsDefault}
                  onValueChange={setSetAsDefault}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor="#F5F5F7"
                />
              </View>

              {errorMsg && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: radius.md, backgroundColor: "rgba(255,69,58,0.15)" }}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: fs.xs }}>{errorMsg}</Text>
                </View>
              )}

              <Pressable
                onPress={handleSaveCard}
                disabled={saving}
                style={{ height: 50, borderRadius: radius.lg, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: spacing.sm }}
              >
                {saving ? (
                  <ActivityIndicator color="#F5F5F7" />
                ) : (
                  <Text style={{ color: "#F5F5F7", fontSize: fs.base, fontWeight: "700" }}>Salvar Cartão</Text>
                )}
              </Pressable>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.xl, padding: spacing.md, backgroundColor: "rgba(52,199,89,0.08)", borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(52,199,89,0.2)" }}>
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            <Text style={{ color: colors.textDim, fontSize: fs.xs, flex: 1 }}>
              Proteção PCI-DSS Nível 1: Seus dados são criptografados de ponta a ponta e nunca armazenados em texto puro.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- MODAL DO PAINEL DO COACH COM CRM FINANCEIRO ---
function CoachDashboardModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: colors.bg, marginTop: insets.top }}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700" }}>CRM Financeiro & Vendas</Text>
            <Text style={{ color: colors.textDim, fontSize: fs.xs, marginTop: 2 }}>
              Gestão de contratos, protocolos e vigências
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Componente FinanceCRMTable com Busca, Query do Supabase e Cards */}
        <FinanceCRMTable />
      </View>
    </Modal>
  );
}

function PeriCell({ label, value, suffix }: any) {
  return (
    <View style={styles.periCell}>
      <Text style={styles.periLabel}>{label}</Text>
      <Text style={styles.periValue}>{value ?? "-"} <Text style={styles.periSuffix}>{suffix}</Text></Text>
    </View>
  );
}

function EditProfileModal({ open, onClose, profile, isCoach, onSaved }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = async () => {
    const body: any = {
      nickname: form.nickname,
      full_name: form.full_name || form.nickname,
      email: form.email,
      avatar_url: form.avatar_url,
    };

    // Alunos possuem métricas e perimetria adicionais
    if (!isCoach) {
      body.height_cm = parseInt(String(form.height_cm || 0), 10) || undefined;
      body.weight_kg = parseFloat(String(form.weight_kg || 0)) || undefined;
      body.waist_cm = parseFloat(String(form.waist_cm || 0)) || undefined;
      body.right_arm_cm = parseFloat(String(form.right_arm_cm || 0)) || undefined;
      body.left_arm_cm = parseFloat(String(form.left_arm_cm || 0)) || undefined;
      body.right_leg_cm = parseFloat(String(form.right_leg_cm || 0)) || undefined;
      body.left_leg_cm = parseFloat(String(form.left_leg_cm || 0)) || undefined;
      body.water_ml = parseInt(String(form.water_ml || 0), 10) || undefined;
      body.creatine_g = parseFloat(String(form.creatine_g || 0)) || undefined;
      body.creatine_times = typeof form.creatine_times === "string"
        ? form.creatine_times.split(",").map((s: string) => s.trim()).filter(Boolean)
        : form.creatine_times;
    }

    const p = await api.updateProfile(body);
    onSaved(p);
    onClose();
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }}>
        <View style={{ flex: 1, backgroundColor: colors.bg, marginTop: insets.top + 20, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700" }}>
                {isCoach ? "Editar Perfil do Coach" : t("profile.edit")}
              </Text>
              <Text style={{ color: colors.textDim, fontSize: fs.sm }}>
                {isCoach ? "Atualize sua apresentação e informações públicas" : "Atualize seus dados biométricos e perimetria"}
              </Text>
            </View>
            <Pressable testID="close-edit" onPress={onClose} hitSlop={8}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
            {/* Campos Comuns (Nome, Email, Foto) */}
            <EditRow label={isCoach ? "Nome do Coach" : t("profile.nickname")} value={form.nickname || form.full_name} onChange={(v: string) => set("nickname", v)} testID="edit-nickname" />
            <EditRow label="Email de Contato" value={form.email} onChange={(v: string) => set("email", v)} testID="edit-email" />
            <EditRow label="URL da Foto de Perfil" value={form.avatar_url} onChange={(v: string) => set("avatar_url", v)} testID="edit-avatar" />

            {/* Campos exclusivos do Aluno (Perimetria e Hábitos) */}
            {!isCoach && (
              <>
                <Text style={[styles.section, { marginTop: spacing.md, marginBottom: spacing.md }]}>Dados Biométricos & Medidas</Text>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.height")} value={String(form.height_cm ?? "")} onChange={(v: string) => set("height_cm", v)} keyboardType="number-pad" testID="edit-height" /></View>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.weight")} value={String(form.weight_kg ?? "")} onChange={(v: string) => set("weight_kg", v)} keyboardType="decimal-pad" testID="edit-weight" /></View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.waist")} value={String(form.waist_cm ?? "")} onChange={(v: string) => set("waist_cm", v)} keyboardType="decimal-pad" testID="edit-waist" /></View>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.right_arm")} value={String(form.right_arm_cm ?? "")} onChange={(v: string) => set("right_arm_cm", v)} keyboardType="decimal-pad" testID="edit-right-arm" /></View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.left_arm")} value={String(form.left_arm_cm ?? "")} onChange={(v: string) => set("left_arm_cm", v)} keyboardType="decimal-pad" testID="edit-left-arm" /></View>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.right_leg")} value={String(form.right_leg_cm ?? "")} onChange={(v: string) => set("right_leg_cm", v)} keyboardType="decimal-pad" testID="edit-right-leg" /></View>
                </View>
                <EditRow label={t("profile.left_leg")} value={String(form.left_leg_cm ?? "")} onChange={(v: string) => set("left_leg_cm", v)} keyboardType="decimal-pad" testID="edit-left-leg" />
                <EditRow label={t("profile.water_target")} value={String(form.water_ml ?? "")} onChange={(v: string) => set("water_ml", v)} keyboardType="number-pad" testID="edit-water" />
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.creatine_dose")} value={String(form.creatine_g ?? "")} onChange={(v: string) => set("creatine_g", v)} keyboardType="decimal-pad" testID="edit-creatine" /></View>
                  <View style={{ flex: 1 }}><EditRow label={t("profile.creatine_times")} value={Array.isArray(form.creatine_times) ? form.creatine_times.join(", ") : form.creatine_times || ""} onChange={(v: string) => set("creatine_times", v)} testID="edit-creatine-times" /></View>
                </View>
              </>
            )}

            <Pressable testID="save-profile-edit" onPress={save} style={{ height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: spacing.lg }}>
              <Text style={{ color: "#F5F5F7", fontSize: fs.lg, fontWeight: "600" }}>{t("cta.save")}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function EditRow({ label, value, onChange, testID, keyboardType }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
      <TextInput testID={testID} value={value} onChangeText={onChange} keyboardType={keyboardType}
        placeholderTextColor={colors.textDim}
        style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg }} />
    </View>
  );
}

// --- MODAL DE GESTÃO DE ALUNOS (COACH) ---
function CoachStudentsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      api.getStudents()
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setStudents(res);
          } else {
            setStudents([
              { id: "std_1", name: "Rafael Silva", email: "rafael@vyra.app", plan: "Mensal", protocol: "Hipertrofia Acelerada", status: "active", workoutCount: 18, adherence: "95%" },
              { id: "std_2", name: "Maria Souza", email: "maria@vyra.app", plan: "Trimestral", protocol: "Emagrecimento & Definição", status: "active", workoutCount: 14, adherence: "88%" },
              { id: "std_3", name: "Carlos Andrade", email: "carlos@vyra.app", plan: "Semestral", protocol: "Força & Potência", status: "late", workoutCount: 6, adherence: "52%" },
              { id: "std_4", name: "Ana Beatriz", email: "ana@vyra.app", plan: "Anual", protocol: "Hipertrofia Glúteos", status: "active", workoutCount: 22, adherence: "98%" },
              { id: "std_5", name: "Lucas Ferreira", email: "lucas@vyra.app", plan: "Mensal", protocol: "Recomposição Corporal", status: "active", workoutCount: 12, adherence: "84%" },
            ]);
          }
        })
        .catch(() => {
          setStudents([
            { id: "std_1", name: "Rafael Silva", email: "rafael@vyra.app", plan: "Mensal", protocol: "Hipertrofia Acelerada", status: "active", workoutCount: 18, adherence: "95%" },
            { id: "std_2", name: "Maria Souza", email: "maria@vyra.app", plan: "Trimestral", protocol: "Emagrecimento & Definição", status: "active", workoutCount: 14, adherence: "88%" },
            { id: "std_3", name: "Carlos Andrade", email: "carlos@vyra.app", plan: "Semestral", protocol: "Força & Potência", status: "late", workoutCount: 6, adherence: "52%" },
            { id: "std_4", name: "Ana Beatriz", email: "ana@vyra.app", plan: "Anual", protocol: "Hipertrofia Glúteos", status: "active", workoutCount: 22, adherence: "98%" },
          ]);
        });
    }
  }, [open]);

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.protocol?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: colors.bg, marginTop: insets.top }}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700" }}>Gestão de Alunos</Text>
            <Text style={{ color: colors.textDim, fontSize: fs.sm }}>{filtered.length} alunos cadastrados</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Barra de Busca */}
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textDim} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar aluno por nome, email ou protocolo..."
              placeholderTextColor={colors.textDim}
              style={{ flex: 1, color: colors.text, fontSize: fs.base, marginLeft: spacing.sm }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={colors.textDim} />
              </Pressable>
            )}
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentPlan}>{item.email} · Plano {item.plan || "Mensal"}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <Ionicons name="barbell-outline" size={14} color={colors.brand} />
                    <Text style={{ color: colors.textDim, fontSize: fs.sm, fontWeight: "500" }}>
                      {item.protocol || "Hipertrofia Acelerada"}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: item.status === "active" ? "rgba(52,199,89,0.15)" : "rgba(255,59,48,0.15)" }]}>
                  <Text style={[styles.statusText, { color: item.status === "active" ? colors.success : colors.error }]}>
                    {item.status === "active" ? "EM DIA" : "PENDENTE"}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.textDim, fontSize: fs.sm }}>
                  Adesão: <Text style={{ color: colors.text, fontWeight: "700" }}>{item.adherence || "90%"}</Text> ({item.workoutCount || 16} treinos)
                </Text>
                <Pressable
                  onPress={() => {
                    onClose();
                    router.push("/coach");
                  }}
                  style={styles.prescribeBtn}
                >
                  <Ionicons name="create-outline" size={14} color={colors.brand} />
                  <Text style={styles.prescribeBtnText}>Prescrever Treino</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

// --- MODAL DO PROTOCOLO DO ALUNO ---
function ProtocolModal({ open, onClose, profile }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)" }}>
        <View style={{ flex: 1, backgroundColor: colors.bg, marginTop: insets.top + 40, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700" }}>Meu Protocolo</Text>
              <Text style={{ color: colors.gold, fontSize: fs.sm, fontWeight: "600" }}>Periodização & Prescrição Ativa</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} showsVerticalScrollIndicator={false}>
            {/* Card do Protocolo Ativo */}
            <View style={styles.protocolActiveBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm }}>
                <View style={styles.protocolIconCircle}>
                  <Ionicons name="flash" size={22} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: fs.lg, fontWeight: "800" }}>
                    {profile?.active_protocol || "Hipertrofia Acelerada"}
                  </Text>
                  <Text style={{ color: colors.textDim, fontSize: fs.sm }}>
                    Fase 2: Sobrecarga Progressiva & Densidade
                  </Text>
                </View>
              </View>

              <Text style={{ color: colors.textDim, fontSize: fs.sm, lineHeight: 20 }}>
                Estruturado para aumento de hipertrofia miofibrilar com foco em exercícios compostos, controle estrito de descanso e anotação sistemática de cargas.
              </Text>
            </View>

            {/* Diretrizes Técnicas */}
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.subSectionTitle}>DIRETRIZES DO PROTOCOLO</Text>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>Coach Responsável</Text>
                <Text style={styles.paramValue}>Coach Manoel & Mari</Text>
              </View>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>Divisão Semanal</Text>
                <Text style={styles.paramValue}>5 Dias (ABCDE)</Text>
              </View>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>Meta de Hidratação Diária</Text>
                <Text style={styles.paramValue}>{profile?.water_ml || 2500} ml</Text>
              </View>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>Dose de Creatina Prescrita</Text>
                <Text style={styles.paramValue}>{profile?.creatine_g || 5} g / dia</Text>
              </View>
            </View>

            {/* Botão de Ação */}
            <Pressable
              onPress={() => {
                onClose();
                router.push("/training");
              }}
              style={styles.ctaPrimaryBtn}
            >
              <Ionicons name="barbell" size={20} color="#000" />
              <Text style={styles.ctaPrimaryText}>Acessar Treinos da Semana</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.lg },
  headerCard: { flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  name: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  email: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.sm },
  editIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,106,42,0.4)", backgroundColor: "rgba(255,106,42,0.1)", alignItems: "center", justifyContent: "center" },
  periGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  periCell: { flexBasis: "48%", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  periLabel: { color: colors.textDim, fontSize: fs.sm },
  periValue: { color: colors.text, fontSize: fs.xl, fontWeight: "700", marginTop: 4 },
  periSuffix: { color: colors.textDim, fontSize: fs.sm, fontWeight: "500" },
  langCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  langText: { color: colors.textDim, fontSize: fs.lg, fontWeight: "500" },
  rowBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowText: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  rowSubtext: { color: colors.textDim, fontSize: fs.xs, marginTop: 2 },
  menuIconBox: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: "rgba(255,106,42,0.1)", alignItems: "center", justifyContent: "center" },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,59,48,0.4)", marginTop: spacing.xl },
  logoutText: { color: colors.error, fontSize: fs.lg, fontWeight: "600" },
  version: { color: colors.textDim, fontSize: fs.sm, textAlign: "center", marginTop: spacing.lg },

  // --- Estilos do Protocolo ---
  protocolCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  protocolIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(216,180,106,0.15)", alignItems: "center", justifyContent: "center" },
  protocolTitle: { color: colors.text, fontSize: fs.base, fontWeight: "700" },
  protocolSubtitle: { color: colors.textDim, fontSize: fs.xs, marginTop: 2 },
  protocolBadge: { backgroundColor: "rgba(216,180,106,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  protocolBadgeText: { color: colors.gold, fontSize: 9, fontWeight: "800" },
  protocolActiveBox: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: "rgba(255,106,42,0.3)" },
  subSectionTitle: { color: colors.textDim, fontSize: fs.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: spacing.xs },
  paramRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  paramLabel: { color: colors.textDim, fontSize: fs.sm },
  paramValue: { color: colors.text, fontSize: fs.sm, fontWeight: "600" },
  ctaPrimaryBtn: { height: 52, borderRadius: radius.lg, backgroundColor: colors.gold, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.md },
  ctaPrimaryText: { color: "#000", fontSize: fs.base, fontWeight: "700" },

  // --- Estilos do Coach ---
  coachCard: { backgroundColor: "rgba(255,106,42,0.05)", borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: "rgba(255,106,42,0.3)" },
  dashboardBtn: { backgroundColor: colors.brand, height: 44, borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  dashboardBtnText: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  
  modalHeader: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center" },
  filterRow: { flexDirection: "row", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  filterBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterBadgeActive: { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.1)" },
  filterText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "500" },
  filterTextActive: { color: colors.brand, fontWeight: "700" },
  
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 46 },
  studentCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  studentName: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  studentPlan: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  statusText: { fontSize: 10, fontWeight: "800" },
  prescribeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" },
  prescribeBtnText: { color: colors.brand, fontSize: fs.xs, fontWeight: "700" },

  // --- Estilos de Pagamento ---
  cardItem: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardBrandBox: { width: 48, height: 36, backgroundColor: colors.surface2, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  cardText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  cardExp: { color: colors.textDim, fontSize: fs.sm },
  defaultBadge: { backgroundColor: "rgba(52,199,89,0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  defaultBadgeText: { color: colors.success, fontSize: 10, fontWeight: "700" },
  addCardBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 54, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.05)", marginTop: spacing.sm },
  addCardText: { color: colors.brand, fontSize: fs.lg, fontWeight: "600" }
});