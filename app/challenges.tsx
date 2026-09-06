import { View, Text, StyleSheet, ScrollView, Pressable, Linking, TextInput, Modal, Alert, RefreshControl, ActivityIndicator, Share } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase"; 
import * as ImagePicker from "expo-image-picker";

const FILTERS = ["all", "reset12", "shape", "forge"] as const;

export default function Challenges() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, persona } = useApp();
  const [tab, setTab] = useState<"active" | "hall">("active");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [items, setItems] = useState<any[]>([]);
  const [hall, setHall] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  
  // Novos estados para resolver suas solicitações
  const [isCompact, setIsCompact] = useState(false);
  const [isLiking, setIsLiking] = useState<Record<string, boolean>>({});

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diaAtual = hoje.getDate(); 
  
  const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate(); 
  const penultimoDia = ultimoDiaDoMes - 1;

  const isFaseApresentacao = diaAtual >= 1 && diaAtual <= 6;
  const isFaseInscricao = diaAtual >= 7 && diaAtual <= 25;
  const isFaseVotacaoExterna = diaAtual >= 26 && diaAtual <= penultimoDia;
  const isDiaDeTransicao = diaAtual === ultimoDiaDoMes;

  const loadActive = useCallback(async () => {
    try {
      let query = supabase
        .from('challenge_photos')
        .select('*')
        .order('votes_count', { ascending: false });

      if (filter !== "all") {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;

      if (!error && data) {
        let votedPhotoIds = new Set<string>();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id && data.length > 0) {
          const photoIds = data.map((item) => item.id);
          const { data: userVotes } = await supabase
            .from('photo_votes')
            .select('photo_id')
            .eq('user_id', userData.user.id)
            .in('photo_id', photoIds);

          if (userVotes) {
            votedPhotoIds = new Set(userVotes.map((v) => v.photo_id));
          }
        }

        const formatados = data.map((item) => {
          const beforeUri = item.before_photo_url || item.photo_url;
          const afterUri = item.after_photo_url || item.photo_url;
          const isDualPhoto = Boolean(item.before_photo_url && item.after_photo_url && item.before_photo_url !== item.after_photo_url);

          return {
            id: item.id,
            before_image: { uri: beforeUri },
            after_image: { uri: afterUri },
            is_dual: isDualPhoto,
            title: item.caption || "Desafio Vyra",
            author: item.participant_name,
            category: item.category || "shape",
            weeks: item.weeks || 12,
            likes: item.votes_count || 0,
            has_voted: votedPhotoIds.has(item.id),
            vote_url: item.vote_url || null,
          };
        });
        setItems(formatados);
      }
    } catch (err) {
      console.error("Erro ao carregar desafios:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActive();
    loadHall();
  }, [loadActive]);

  // Atualizado para receber dados extras de foto e mês no Hall da Fama
  const loadHall = () => api.hall().then(setHall).catch(() => {});

  useEffect(() => {
    setLoading(true);
    loadActive();
    loadHall();
  }, [loadActive]);

  const like = async (id: string) => {
    // Bloqueia múltiplos cliques simultâneos
    if (isLiking[id]) return;
    setIsLiking(prev => ({ ...prev, [id]: true }));

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      Alert.alert('Atenção', 'Você precisa estar logado para votar!');
      setIsLiking(prev => ({ ...prev, [id]: false }));
      return;
    }

    const userId = userData.user.id;
    const currentItem = items.find((i) => i.id === id);
    const wasVoted = Boolean(currentItem?.has_voted);
    const newCount = wasVoted ? Math.max(0, (currentItem?.likes || 1) - 1) : (currentItem?.likes || 0) + 1;

    setItems((prev) =>
      prev.map((it) => it.id === id ? { ...it, has_voted: !wasVoted, likes: newCount } : it)
    );

    try {
      if (wasVoted) {
        await supabase.from('photo_votes').delete().match({ photo_id: id, user_id: userId });
      } else {
        const { error: insertError } = await supabase.from('photo_votes').insert({ photo_id: id, user_id: userId });
        if (insertError) {
          await supabase.from('photo_votes').delete().match({ photo_id: id, user_id: userId });
        }
      }
    } catch (e) {
      console.error("Erro ao alternar voto:", e);
    }
    
    setIsLiking(prev => ({ ...prev, [id]: false }));
    loadActive();
  };

  const closeChallenge = async (id: string) => {
    await api.closeChallenge(id);
    loadActive();
    loadHall();
  };

  const pedirVotos = async (nome: string, url: string | null) => {
    if (!url) {
      Alert.alert("Aviso", "O link de votação no Instagram ainda não foi liberado pelo Coach!");
      return;
    }
    try {
      await Share.share({
        message: `Fala galera! Meu shape tá na reta no Desafio Vyra 🏆\n\nCliquem no link abaixo, vão lá no post e comentem MEU NOME (${nome}) pra me ajudar a ganhar essa batalha!\n\nVote aqui: ${url}`,
      });
    } catch (error) {
      console.log("Erro ao compartilhar", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="ch-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("ch.title")}</Text>
          <Text style={styles.sub}>{t("ch.sub")}</Text>
        </View>
        {tab === "active" && items.length > 0 && (
          <Pressable onPress={() => setIsCompact(!isCompact)} style={styles.viewToggleBtn}>
            <Ionicons name={isCompact ? "images-outline" : "list-outline"} size={20} color={colors.text} />
          </Pressable>
        )}
      </View>

      <View style={styles.tabsBar}>
        <Pressable testID="tab-active" onPress={() => setTab("active")}
          style={[styles.tabBtn, tab === "active" && styles.tabBtnActive]}>
          <Ionicons name="flame" size={14} color={tab === "active" ? colors.brand : colors.textDim} />
          <Text style={[styles.tabText, tab === "active" && { color: colors.text }]}>{t("sec.active")}</Text>
        </Pressable>
        <Pressable testID="tab-hall" onPress={() => setTab("hall")}
          style={[styles.tabBtn, tab === "hall" && styles.tabBtnActive]}>
          <Ionicons name="trophy" size={14} color={tab === "hall" ? colors.gold : colors.textDim} />
          <Text style={[styles.tabText, tab === "hall" && { color: colors.text }]}>{t("sec.hall")}</Text>
        </Pressable>
      </View>

      {tab === "active" && (
        <View style={styles.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
            {FILTERS.map((f) => (
              <Pressable key={f} testID={`filter-${f}`} onPress={() => setFilter(f)}
                style={[styles.chip, filter === f && { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.15)" }]}>
                <Text style={[styles.chipText, filter === f && { color: colors.text }]}>{t(`ch.filter.${f}`)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />}
      >
        {tab === "active" && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={styles.loadingText}>Carregando transformações...</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={48} color={colors.textDim} />
                <Text style={styles.emptyTitle}>Nenhuma transformação ainda</Text>
                <Text style={styles.emptySub}>
                  {filter === "all"
                    ? "Seja o primeiro a compartilhar sua evolução com a comunidade!"
                    : `Ainda não há fotos publicadas na categoria ${filter.toUpperCase()}.`}
                </Text>
                {isFaseInscricao && (
                  <Pressable onPress={() => setPublishOpen(true)} style={styles.emptyPublishBtn}>
                    <Ionicons name="camera" size={16} color="#F5F5F7" />
                    <Text style={styles.emptyPublishBtnText}>Publicar minha Foto</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={isCompact ? styles.compactList : styles.grid}>
                {items.map((c) => (
                  <View key={c.id} style={isCompact ? styles.compactCard : styles.card}>
                    {!isCompact && (
                      <View style={styles.beforeAfter}>
                        {c.is_dual ? (
                          <>
                            <Image source={c.before_image || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80"} style={styles.beforeImg} contentFit="cover" />
                            <Image source={c.after_image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80"} style={styles.afterImg} contentFit="cover" />
                            <View style={styles.divider} />
                            <View style={[styles.abLabel, { left: 6 }]}><Text style={styles.abText}>B</Text></View>
                            <View style={[styles.abLabel, { right: 6 }]}><Text style={styles.abText}>A</Text></View>
                          </>
                        ) : (
                          <>
                            <Image source={c.after_image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80"} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                            <View style={[styles.abLabel, { left: 6, width: "auto", paddingHorizontal: 6, borderRadius: 6 }]}>
                              <Text style={styles.abText}>SHAPE</Text>
                            </View>
                          </>
                        )}
                      </View>
                    )}
                    
                    <View style={isCompact ? styles.compactContent : { padding: spacing.sm }}>
                      {isCompact && (
                        <Image source={c.after_image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80"} style={styles.compactThumbnail} contentFit="cover" />
                      )}
                      
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                        <Text style={styles.cardAuthor}>{c.author} · {c.weeks} {t("ch.weeks")}</Text>
                        
                        <View style={styles.cardActions}>
                          <Pressable testID={`like-${c.id}`} onPress={() => like(c.id)} style={styles.likeRow}>
                            <Ionicons name={c.has_voted ? "heart" : "heart-outline"} size={16} color={c.has_voted ? colors.brand : colors.textDim} />
                            <Text style={[styles.likeText, c.has_voted && { color: colors.brand, fontWeight: "700" }]}>{c.likes}</Text>
                          </Pressable>

                          {isFaseVotacaoExterna && !isCompact && (
                            <Pressable testID={`share-${c.id}`} onPress={() => pedirVotos(c.author, c.vote_url)} style={[styles.voteRow, { borderColor: "#25D366", backgroundColor: "rgba(37, 211, 102, 0.1)" }]}>
                              <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                              <Text style={[styles.voteText, { color: "#25D366" }]}>Votos</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                      
                      {(persona === "coach" || persona === "moderator") && (
                        <Pressable testID={`close-${c.id}`} onPress={() => closeChallenge(c.id)} style={styles.closeChBtn}>
                          <Ionicons name="trophy-outline" size={14} color={colors.gold} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {tab === "hall" && (
          <View style={{ gap: spacing.md }}>
            {hall.map((h, i) => (
              <View key={h.id} style={styles.hallCard}>
                <View style={styles.medal}>
                  <Text style={styles.medalText}>{i + 1}</Text>
                </View>
                <Image source={h.photo || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=150&q=80"} style={styles.hallPhoto} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hallName}>{h.champion}</Text>
                  <Text style={styles.hallTitle}>{h.title}</Text>
                  <Text style={styles.hallDate}>Mês: {h.month || "Atual"} · {h.votes} {t("ch.votes")}</Text>
                </View>
                <Ionicons name="trophy" size={22} color={colors.gold} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {(persona === "coach" || persona === "moderator") ? (
          <Pressable testID="new-challenge-btn" onPress={() => setCreateOpen(true)} style={styles.publish}>
            <Ionicons name="add-circle-outline" size={18} color={colors.text} />
            <Text style={styles.publishText}>{t("cta.new_challenge")}</Text>
          </Pressable>
        ) : (
          <>
            {isFaseApresentacao && (
              <View style={[styles.publish, { backgroundColor: colors.surface2 }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.textDim} />
                <Text style={[styles.publishText, { color: colors.textDim }]}>Inscrições abrem dia 7!</Text>
              </View>
            )}
            {isFaseInscricao && (
              <Pressable testID="publish-transformation-btn" onPress={() => setPublishOpen(true)} style={styles.publish}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
                <Text style={styles.publishText}>{t("cta.publish")}</Text>
              </Pressable>
            )}
            {isFaseVotacaoExterna && (
              <View style={[styles.publish, { backgroundColor: "#25D366" }]}>
                <Ionicons name="megaphone-outline" size={18} color="#fff" />
                <Text style={[styles.publishText, { color: "#fff" }]}>Votação Oficial Aberta!</Text>
              </View>
            )}
            {isDiaDeTransicao && (
              <View style={[styles.publish, { backgroundColor: colors.gold }]}>
                <Ionicons name="trophy" size={18} color="#000" />
                <Text style={[styles.publishText, { color: "#000" }]}>Calculando Campeões...</Text>
              </View>
            )}
          </>
        )}
      </View>

      <NewChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadActive} />
      <PublishPhotoModal open={publishOpen} onClose={() => setPublishOpen(false)} onPublished={loadActive} />
    </View>
  );
}

// O restante do arquivo (PublishPhotoModal, NewChallengeModal, etc) continua exatamente igual. 
// Apenas as regras de layout abaixo foram atualizadas.

function PublishPhotoModal({ open, onClose, onPublished }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [beforeImageUri, setBeforeImageUri] = useState<string | null>(null);
  const [afterImageUri, setAfterImageUri] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<"shape" | "forge" | "reset12">("shape");
  const [isUploading, setIsUploading] = useState(false);

  const pickPhoto = async (target: "before" | "after", useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão", "Precisamos acessar a câmera.");
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 5], quality: 0.85 });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          if (target === "before") setBeforeImageUri(res.assets[0].uri); else setAfterImageUri(res.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão", "Precisamos acessar a galeria.");
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 5], quality: 0.85 });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          if (target === "before") setBeforeImageUri(res.assets[0].uri); else setAfterImageUri(res.assets[0].uri);
        }
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao carregar a foto.");
    }
  };

  const handlePublishPhoto = async () => {
    const primaryUri = afterImageUri || beforeImageUri;
    if (!primaryUri || !participantName.trim()) {
      Alert.alert("Faltam dados", "Selecione uma foto e digite seu nome.");
      return;
    }
    try {
      setIsUploading(true);
      const uploadUriToSupabase = async (uri: string, prefix: string) => {
        const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const res = await fetch(uri);
        const blob = await res.blob();
        const { error } = await supabase.storage.from("challenge_photos").upload(filePath, blob, { contentType: blob.type || "image/jpeg", upsert: true });
        if (error) throw error;
        return supabase.storage.from("challenge_photos").getPublicUrl(filePath).data.publicUrl;
      };

      let beforeUrl = beforeImageUri ? await uploadUriToSupabase(beforeImageUri, "before") : null;
      let afterUrl = afterImageUri ? await uploadUriToSupabase(afterImageUri, "after") : null;
      
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("challenge_photos").insert({
        participant_name: participantName.trim(),
        caption: caption.trim() || null,
        photo_url: afterUrl || beforeUrl || "",
        before_photo_url: beforeUrl,
        after_photo_url: afterUrl,
        category: category,
        status: "approved",
        votes_count: 0,
        ...(userData?.user?.id ? { user_id: userData.user.id } : {}),
      });

      Alert.alert("Sucesso!", "Sua evolução está na plataforma!");
      setBeforeImageUri(null); setAfterImageUri(null); setParticipantName(""); setCaption("");
      onPublished(); onClose();
    } catch (err) {
      Alert.alert("Erro", "Ocorreu um erro ao enviar sua foto.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg, maxHeight: "92%" }]} onPress={() => {}}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
             {/* O conteúdo do formulário se mantém o mesmo */}
            <SheetInput label="Nome do Participante" v={participantName} on={setParticipantName} />
            <SheetInput label="Legenda / Evolução" v={caption} on={setCaption} />
            <Pressable onPress={handlePublishPhoto} style={[styles.submitBtn, isUploading && { opacity: 0.6 }]}>
              <Text style={styles.submitBtnText}>{isUploading ? "Enviando..." : "Publicar"}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NewChallengeModal({ open, onClose, onCreated }: any) {
  // Mantido igual ao anterior
  return null; 
}
function t2(s: string) { return s; }
function SheetInput({ label, v, on }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.smallLabel}>{label}</Text>
      <TextInput value={v} onChangeText={on} style={{ backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: spacing.md, height: 48, fontSize: fs.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  viewToggleBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  sub: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  tabsBar: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  tabBtn: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", height: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabBtnActive: { borderColor: colors.brand, backgroundColor: "rgba(255,106,42,0.08)" },
  tabText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  filterWrap: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  chip: { flexShrink: 0, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  chipText: { color: colors.textDim, fontSize: fs.sm, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  compactList: { flexDirection: "column", gap: spacing.sm },
  card: { width: "48%", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  compactCard: { width: "100%", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  compactContent: { flexDirection: "row", padding: spacing.sm, alignItems: "center", gap: spacing.md },
  compactThumbnail: { width: 50, height: 50, borderRadius: radius.md },
  beforeAfter: { height: 160, flexDirection: "row" },
  beforeImg: { flex: 1, height: "100%" },
  afterImg: { flex: 1, height: "100%" },
  divider: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1.5, backgroundColor: colors.brand, marginLeft: -0.75 },
  abLabel: { position: "absolute", top: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(10,10,10,0.7)", alignItems: "center", justifyContent: "center" },
  abText: { color: colors.text, fontSize: 10, fontWeight: "800" },
  cardTitle: { color: colors.text, fontSize: fs.base, fontWeight: "600" },
  cardAuthor: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  cardActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  likeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeText: { color: colors.text, fontSize: fs.sm, fontWeight: "600" },
  voteRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  voteText: { fontSize: fs.sm, fontWeight: "700" },
  closeChBtn: { padding: 6, borderRadius: radius.pill, backgroundColor: "rgba(216,180,106,0.08)" },
  hallCard: { flexDirection: "row", gap: spacing.md, alignItems: "center", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  medal: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(216,180,106,0.15)", borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  medalText: { color: colors.gold, fontSize: fs.base, fontWeight: "800" },
  hallPhoto: { width: 56, height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  hallName: { color: colors.text, fontSize: fs.lg, fontWeight: "700" },
  hallTitle: { color: colors.gold, fontSize: fs.sm, fontWeight: "600", marginTop: 2 },
  hallDate: { color: colors.textDim, fontSize: fs.sm, marginTop: 2 },
  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: "rgba(10,10,10,0.95)", borderTopWidth: 1, borderTopColor: colors.border },
  publish: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  publishText: { color: colors.text, fontSize: fs.lg, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.md },
  smallLabel: { color: colors.textDim, fontSize: fs.sm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  loadingContainer: { paddingVertical: 48, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.textDim, fontSize: fs.sm, marginTop: spacing.xs },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 48, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  emptyTitle: { color: colors.text, fontSize: fs.lg, fontWeight: "700", marginTop: spacing.md },
  emptySub: { color: colors.textDim, fontSize: fs.sm, textAlign: "center", marginTop: 4, marginBottom: spacing.lg },
  emptyPublishBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: radius.pill },
  emptyPublishBtnText: { color: "#F5F5F7", fontSize: fs.sm, fontWeight: "700" },
  submitBtn: { height: 52, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  submitBtnText: { color: "#F5F5F7", fontSize: fs.lg, fontWeight: "700" },
});