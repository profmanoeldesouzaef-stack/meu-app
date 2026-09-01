import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { colors, radius, spacing, fs } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";
import { api } from "@/src/api/client";

export default function Community() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, persona } = useApp();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const load = () => api.chat().then((m) => {
    setMsgs(m);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }).catch(() => {});
  useEffect(load, []);

  const send = async () => {
    if (!text.trim()) return;
    const author = persona === "coach" ? "Você — Coach" : persona === "moderator" ? "Você — Mod" : "Você";
    const res = await api.postChat({ author, persona, text: text.trim() });
    setMsgs((cur) => [...cur, res]);
    setText("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="comm-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("comm.title")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <View style={styles.online} />
            <Text style={styles.sub}>248 online</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      >
        {msgs.map((m) => (
          <View key={m.id} style={styles.bubble}>
            <View style={styles.bubbleHead}>
              <Text style={[styles.author, m.persona === "coach" && { color: colors.gold }]}>{m.author}</Text>
              {m.persona === "coach" && (
                <View style={styles.coachTag}><Text style={styles.coachTagText}>COACH</Text></View>
              )}
            </View>
            <Text style={styles.msgText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          testID="comm-input"
          value={text}
          onChangeText={setText}
          placeholder={t("comm.placeholder")}
          placeholderTextColor={colors.textDim}
          style={styles.input}
        />
        <Pressable testID="comm-send" onPress={send} style={styles.sendBtn}>
          <Ionicons name="send" size={18} color={colors.text} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: fs.xl, fontWeight: "700" },
  sub: { color: colors.textDim, fontSize: fs.sm },
  online: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  bubble: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  bubbleHead: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  author: { color: colors.text, fontSize: fs.sm, fontWeight: "700" },
  coachTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: "rgba(216,180,106,0.2)" },
  coachTagText: { color: colors.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  msgText: { color: colors.text, fontSize: fs.base, marginTop: 4, lineHeight: 20 },
  inputBar: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, height: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text, paddingHorizontal: spacing.md, fontSize: fs.base },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});
