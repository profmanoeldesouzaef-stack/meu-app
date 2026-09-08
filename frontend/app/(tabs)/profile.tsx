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

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, theme, setTheme, subscription, setSubscription, setLoggedIn } = useApp();
  const [profile, setProfile] = useState<any>(null);
  
  // Modais
  const [editOpen, setEditOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Aqui você define a regra de quem é o Coach.
  const isCoach = true; 

  useEffect(() => { api.profile().then(setProfile).catch(() => {}); }, []);

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

        <View style={styles.headerCard}>
          <Image source={profile?.avatar_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80"} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.nickname ?? "-"}</Text>
            <Text style={styles.email}>{profile?.email ?? "-"}</Text>
            <View style={[styles.badge, { backgroundColor: subscription.active ? "rgba(52,199,89,0.15)" : "rgba(216,180,106,0.15)" }]}>
              <Ionicons name={subscription.active ? "shield-checkmark" : "sparkles"} size={12} color={subscription.active ? colors.success : colors.gold} />
              <Text style={{ color: subscription.active ? colors.success : colors.gold, fontSize: fs.sm, fontWeight: "600" }}>
                {subscription.active ? `${subscription.planId?.toUpperCase()} · ${t("profile.active")}` : t("profile.inactive")}
              </Text>
            </View>
          </View>
          <Pressable testID="edit-profile-btn" onPress={() => setEditOpen(true)} style={styles.editIcon}>
            <Ionicons name="pencil" size={16} color={colors.brand} />
          </Pressable>
        </View>

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

        <Text style={styles.section}>{t("profile.theme")}</Text>
        <View style={{ gap: spacing.sm }}>
          {(["dark", "light"] as Theme[]).map((th) => (
            <Pressable key={th} testID={`profile-theme-${th}`} onPress={() => setTheme(th)}
              style={[styles.langCard, theme === th && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" }]}>
              <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                <Ionicons name={th === "dark" ? "moon" : "sunny"} size={16} color={theme === th ? colors.brand : colors.textDim} />
                <Text style={[styles.langText, theme === th && { color: colors.text }]}>{th === "dark" ? t("profile.dark") : t("profile.light")}</Text>
              </View>
              {theme === th && <Ionicons name="checkmark-circle" size={18} color={colors.brand} />}
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>ASSINATURA E PAGAMENTO</Text>
        <Pressable testID="manage-plan-btn" onPress={() => router.push("/paywall")} style={styles.rowBtn}>
          <Ionicons name="sparkles-outline" size={18} color={colors.text} />
          <Text style={styles.rowText}>{subscription.active ? `${subscription.planId?.toUpperCase()} · ${subscription.cycle}` : t("cta.premium")}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </Pressable>
        
        {/* NOVO: Botão de Formas de Pagamento (Cartões Salvos) */}
        <Pressable testID="payment-methods-btn" onPress={() => setPaymentModalOpen(true)} style={[styles.rowBtn, { marginTop: spacing.sm }]}>
          <Ionicons name="card-outline" size={18} color={colors.text} />
          <Text style={styles.rowText}>Formas de Pagamento</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </Pressable>

        {/* --- ÁREA EXCLUSIVA DO COACH --- */}
        {isCoach && (
          <>
            <Text style={[styles.section, { color: colors.brand, marginTop: spacing.xl }]}>Área Exclusiva (Coach)</Text>
            <View style={styles.coachCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                <View>
                  <Text style={{ color: colors.textDim, fontSize: fs.sm }}>MRR (Receita Recorrente)</Text>
                  <Text style={{ color: colors.brand, fontSize: fs["2xl"], fontWeight: "800" }}>R$ 4.250,00</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.textDim, fontSize: fs.sm }}>Assinantes</Text>
                  <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700" }}>38</Text>
                </View>
              </View>
              
              <Pressable onPress={() => setDashboardOpen(true)} style={styles.dashboardBtn}>
                <Ionicons name="stats-chart" size={18} color={colors.text} />
                <Text style={styles.dashboardBtnText}>Abrir Dashboard Financeiro</Text>
              </Pressable>
            </View>
          </>
        )}

        <Pressable testID="logout-btn" onPress={logout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>{t("cta.logout")}</Text>
        </Pressable>

        <Text style={styles.version}>{t("profile.version")}</Text>
      </ScrollView>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} onSaved={(p) => setProfile(p)} />
      <CoachDashboardModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <PaymentMethodsModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
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

// --- MODAL DO PAINEL DO COACH ---
function CoachDashboardModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("month");

  const mockStudents = [
    { id: "1", name: "João Silva", plan: "Mensal", status: "active", method: "pix", coupon: true, date: "05/09/2026" },
    { id: "2", name: "Maria Souza", plan: "Trimestral", status: "active", method: "card", coupon: false, date: "02/09/2026" },
    { id: "3", name: "Carlos Andrade", plan: "Semestral", status: "late", method: "pix", coupon: true, date: "28/08/2026" },
    { id: "4", name: "Ana Beatriz", plan: "Anual", status: "active", method: "card", coupon: false, date: "15/08/2026" },
  ];

  const filters = [
    { id: "month", label: "Mensal" },
    { id: "quarter", label: "Trimestral" },
    { id: "semiannual", label: "Semestral" },
    { id: "year", label: "Anual" }
  ];

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: colors.bg, marginTop: insets.top }}>
        <View style={styles.modalHeader}>
          <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700", flex: 1 }}>Dashboard Financeiro</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
        </View>
        
        <View style={styles.filterRow}>
          {filters.map(f => (
            <Pressable key={f.id} onPress={() => setFilter(f.id)} style={[styles.filterBadge, filter === f.id && styles.filterBadgeActive]}>
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={mockStudents}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentPlan}>{item.plan} • Vence: {item.date}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <View style={styles.smallBadge}>
                      <Ionicons name={item.method === "pix" ? "qr-code" : "card"} size={12} color={colors.textDim} />
                      <Text style={styles.smallBadgeText}>{item.method.toUpperCase()}</Text>
                    </View>
                    {item.coupon && (
                      <View style={[styles.smallBadge, { backgroundColor: "rgba(255,106,42,0.15)", borderColor: "rgba(255,106,42,0.3)" }]}>
                        <Ionicons name="ticket" size={12} color={colors.brand} />
                        <Text style={[styles.smallBadgeText, { color: colors.brand }]}>CUPOM FIEL</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: item.status === "active" ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)" }]}>
                  <Text style={[styles.statusText, { color: item.status === "active" ? colors.success : colors.error }]}>
                    {item.status === "active" ? "EM DIA" : "ATRASADO"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
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

function EditProfileModal({ open, onClose, profile, onSaved }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = async () => {
    const body = {
      nickname: form.nickname,
      email: form.email,
      height_cm: parseInt(String(form.height_cm || 0), 10) || undefined,
      weight_kg: parseFloat(String(form.weight_kg || 0)) || undefined,
      waist_cm: parseFloat(String(form.waist_cm || 0)) || undefined,
      right_arm_cm: parseFloat(String(form.right_arm_cm || 0)) || undefined,
      left_arm_cm: parseFloat(String(form.left_arm_cm || 0)) || undefined,
      right_leg_cm: parseFloat(String(form.right_leg_cm || 0)) || undefined,
      left_leg_cm: parseFloat(String(form.left_leg_cm || 0)) || undefined,
      water_ml: parseInt(String(form.water_ml || 0), 10) || undefined,
      creatine_g: parseFloat(String(form.creatine_g || 0)) || undefined,
      creatine_times: typeof form.creatine_times === "string" ? form.creatine_times.split(",").map((s: string) => s.trim()).filter(Boolean) : form.creatine_times,
    };
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
            <Text style={{ color: colors.text, fontSize: fs.xl, fontWeight: "700", flex: 1 }}>{t("profile.edit")}</Text>
            <Pressable testID="close-edit" onPress={onClose}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
            <EditRow label={t("profile.nickname")} value={form.nickname} onChange={(v) => set("nickname", v)} testID="edit-nickname" />
            <EditRow label="Email" value={form.email} onChange={(v) => set("email", v)} testID="edit-email" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.height")} value={String(form.height_cm ?? "")} onChange={(v) => set("height_cm", v)} keyboardType="number-pad" testID="edit-height" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.weight")} value={String(form.weight_kg ?? "")} onChange={(v) => set("weight_kg", v)} keyboardType="decimal-pad" testID="edit-weight" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.waist")} value={String(form.waist_cm ?? "")} onChange={(v) => set("waist_cm", v)} keyboardType="decimal-pad" testID="edit-waist" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.right_arm")} value={String(form.right_arm_cm ?? "")} onChange={(v) => set("right_arm_cm", v)} keyboardType="decimal-pad" testID="edit-right-arm" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.left_arm")} value={String(form.left_arm_cm ?? "")} onChange={(v) => set("left_arm_cm", v)} keyboardType="decimal-pad" testID="edit-left-arm" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.right_leg")} value={String(form.right_leg_cm ?? "")} onChange={(v) => set("right_leg_cm", v)} keyboardType="decimal-pad" testID="edit-right-leg" /></View>
            </View>
            <EditRow label={t("profile.left_leg")} value={String(form.left_leg_cm ?? "")} onChange={(v) => set("left_leg_cm", v)} keyboardType="decimal-pad" testID="edit-left-leg" />
            <EditRow label={t("profile.water_target")} value={String(form.water_ml ?? "")} onChange={(v) => set("water_ml", v)} keyboardType="number-pad" testID="edit-water" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><EditRow label={t("profile.creatine_dose")} value={String(form.creatine_g ?? "")} onChange={(v) => set("creatine_g", v)} keyboardType="decimal-pad" testID="edit-creatine" /></View>
              <View style={{ flex: 1 }}><EditRow label={t("profile.creatine_times")} value={Array.isArray(form.creatine_times) ? form.creatine_times.join(", ") : form.creatine_times || ""} onChange={(v) => set("creatine_times", v)} testID="edit-creatine-times" /></View>
            </View>

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
  rowText: { color: colors.text, flex: 1, fontSize: fs.lg },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,59,48,0.4)", marginTop: spacing.xl },
  logoutText: { color: colors.error, fontSize: fs.lg, fontWeight: "600" },
  version: { color: colors.textDim, fontSize: fs.sm, textAlign: "center", marginTop: spacing.lg },

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
  
  studentCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  studentName: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  studentPlan: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  statusText: { fontSize: 10, fontWeight: "800" },
  smallBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  smallBadgeText: { color: colors.textDim, fontSize: 10, fontWeight: "600" },

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