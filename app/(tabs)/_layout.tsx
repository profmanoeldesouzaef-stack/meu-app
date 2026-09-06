import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, spacing } from "@/src/theme/tokens";
import { useApp } from "@/src/context/AppContext";

export default function TabsLayout() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          tabBarItemStyle: { alignSelf: "center" },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            ...(Platform.OS === "web" ? { height: 64 } : {}),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tab.home"),
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: t("tab.training"),
            tabBarIcon: ({ color }) => <Ionicons name="barbell-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="diet"
          options={{
            title: t("tab.diet"),
            tabBarIcon: ({ color }) => <Ionicons name="restaurant-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: t("tab.progress"),
            tabBarIcon: ({ color }) => <Ionicons name="trending-up-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tab.profile"),
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
          }}
        />
      </Tabs>

      <Pressable
        testID="community-fab"
        onPress={() => router.push("/community")}
        style={[styles.fab, { bottom: 49 + insets.bottom + 12, right: spacing.lg }]}
      >
        <Ionicons name="chatbubbles" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
