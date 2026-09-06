import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

const MAX = 200;
const MOCK_IMG = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80";

export default function Community() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, persona } = useApp();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = () => {
    api.profile().then(setProfile).catch(() => {});
    api.chat().then((m) => {
      setMsgs(m);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }).catch(() => {});
  };
  
  useEffect(load, []);

  const send = async () => {
    if (!text.trim() && !pendingImage) return;
    if (text.length > MAX) return;
    
    const baseName = profile?.nickname || "Você";
    const author = persona === "coach" ? `${baseName} — Coach` : persona === "moderator" ? `${baseName} — Mod` : baseName;
    
    try {
      const res = await api.postChat({ author, persona, text: text.trim(), image: pendingImage });
      setMsgs((cur) => [...cur, res]);
      setText(""); setPendingImage(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e: any) {
      Alert.alert("Erro", "Máx 200 caracteres.");
    }
  };

  const like = async (id: string) => {
    const res = await api.likeChat(id);
    setMsgs((cur) => cur.map((m) => (m.id === id ? res : m)));
  };

  const remaining = MAX - text.length;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="comm-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("comm.title")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <View style={styles.online} />
            <Text style={styles.sub}>248 online</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        {msgs.map((m) => (
          <View key={m.id} style={styles.bubble}>
            <View style={styles.bubbleHead}>
              <Text style={[styles.author, m.persona === "coach" && { color: colors.gold }]}>{m.author}</Text>
              {m.persona === "coach" && (
                <View style={styles.coachTag}><Text style={styles.coachTagText}>COACH</Text></View>
              )}
            </View>
            {m.text ? <Text style={styles.msgText}>{m.text}</Text> : null}
            {m.image ? (
              <Image source={m.image} style={styles.msgImage} contentFit="cover" />
            ) : null}
            <View style={styles.msgActions}>
              <Pressable testID={`like-msg-${m.id}`} onPress={() => like(m.id)} style={styles.likeBtn}>
                <Ionicons name="heart" size={14} color={colors.brand} />
                <Text style={styles.likeCount}>{m.likes ?? 0}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {pendingImage && (
        <View style={styles.pendingImage}>
          <Ionicons name="image" size={14} color={colors.brand} />
          <Text style={{ color: colors.text, fontSize: fs.sm, flex: 1 }}>Imagem anexada</Text>
          <Pressable onPress={() => setPendingImage(null)}><Ionicons name="close" size={16} color={colors.textDim} /></Pressable>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable testID="attach-image" onPress={() => setPendingImage(MOCK_IMG)} style={styles.attachBtn}>
          <Ionicons name="image-outline" size={18} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <TextInput
            testID="comm-input"
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX))}
            placeholder={t("comm.placeholder")}
            placeholderTextColor={colors.textDim}
            style={styles.input}
            maxLength={MAX}
          />
          <Text style={[styles.counter, { color: remaining < 20 ? colors.error : colors.textDim }]}>{remaining}</Text>
        </View>
        <Pressable testID="comm-send" onPress={send} style={styles.sendBtn}>
          <Ionicons name="send" size={18} color={colors.text} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  sub: { color: colors.textDim, fontSize: fs.sm },
  online: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  bubble: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  bubbleHead: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  author: { color: colors.text, fontSize: fs.sm, fontWeight: "700" },
  coachTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: "rgba(216,180,106,0.2)" },
  coachTagText: { color: colors.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  msgText: { color: colors.text, fontSize: fs.base, marginTop: 4, lineHeight: 20 },
  msgImage: { width: "100%", height: 180, borderRadius: radius.md, marginTop: spacing.sm },
  msgActions: { flexDirection: "row", marginTop: spacing.sm, gap: spacing.md },
  likeBtn: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(255,106,42,0.08)", borderWidth: 1, borderColor: "rgba(255,106,42,0.3)" },
  likeCount: { color: colors.brand, fontSize: fs.sm, fontWeight: "700" },
  pendingImage: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, marginHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  inputBar: { flexDirection: "row", gap: spacing.sm, alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  attachBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  input: { height: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text, paddingHorizontal: spacing.md, paddingRight: 40, fontSize: fs.base },
  counter: { position: "absolute", right: 12, top: 14, fontSize: 10, fontWeight: "700" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});