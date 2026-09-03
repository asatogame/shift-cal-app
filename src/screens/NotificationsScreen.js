import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📬</Text>
      <Text style={styles.title}>まだアクティビティがありません</Text>
      <Text style={styles.desc}>
        予定の追加・変更・削除が{"\n"}ここに表示されます
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  icon: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 17, fontWeight: "700", color: "#9CA3AF", marginBottom: 8 },
  desc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
});
