import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function NotificationsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={styles.icon}>📬</Text>
      <Text style={[styles.title, { color: colors.textMuted }]}>まだアクティビティがありません</Text>
      <Text style={[styles.desc, { color: colors.textSecondary }]}>
        予定の追加・変更・削除が{"\n"}ここに表示されます
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  icon: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  desc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
