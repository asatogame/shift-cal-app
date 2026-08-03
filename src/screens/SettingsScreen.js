import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Linking } from "react-native";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getAnalysisUsage } from "../services/claudeVision";
import { app } from "../firebase";

const THEME_OPTIONS = [
  { key: "system", label: "端末に合わせる" },
  { key: "light", label: "ライト" },
  { key: "dark", label: "ダーク" },
];

export default function SettingsScreen({ navigation }) {
  const { colors, setting, setTheme, isDark } = useTheme();
  const { user, isGuest, logout } = useAuth();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    getAnalysisUsage().then(setUsage).catch(() => {});
  }, []);

  const displayName = user?.displayName || (isGuest() ? "ゲスト" : user?.email || "");

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(displayName || "?")[0]}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
            {isGuest() ? "匿名ユーザー" : user?.email || ""}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>プラン</Text>
      <Pressable
        style={[styles.premiumCard, { backgroundColor: usage?.isSubscriber ? colors.surface : colors.primary, borderColor: colors.border, borderWidth: usage?.isSubscriber ? 1 : 0 }]}
        onPress={() => navigation.navigate("Premium")}
      >
        {usage?.isSubscriber ? (
          <>
            <Text style={[styles.premiumTitle, { color: colors.primary }]}>✨ プレミアム会員</Text>
            <Text style={[styles.premiumDesc, { color: colors.textSec }]}>
              AI解析 残り{usage.remaining}/10回（今月）{usage.bonus > 0 ? ` + ${usage.bonus}回` : ""}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.premiumTitle, { color: "#fff" }]}>✨ プレミアムプランに登録</Text>
            <Text style={[styles.premiumDesc, { color: "rgba(255,255,255,0.8)" }]}>
              広告非表示 + AI解析 月10回 — ¥300/月
            </Text>
          </>
        )}
      </Pressable>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>テーマ</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {THEME_OPTIONS.map((opt, i) => (
          <Pressable
            key={opt.key}
            style={[
              styles.row,
              i < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
            onPress={() => setTheme(opt.key)}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>{opt.label}</Text>
            {setting === opt.key && (
              <Text style={[styles.check, { color: colors.primary }]}>✓</Text>
            )}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>サポート</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          onPress={() => Linking.openURL("mailto:info@jack-central.com?subject=" + encodeURIComponent("【シフトカレンダー共有】お問い合わせ"))}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>お問い合わせ</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>メールで連絡</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("mailto:info@jack-central.com?subject=" + encodeURIComponent("【シフトカレンダー共有】不具合報告") + "&body=" + encodeURIComponent("■ 発生した問題\n\n\n■ 再現手順\n\n\n■ 端末情報\n"))}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>不具合を報告</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>バグ報告</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>法的情報</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          onPress={() => Linking.openURL("https://asatogame.github.io/shift-cal-app/privacy.html")}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>プライバシーポリシー</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("https://asatogame.github.io/shift-cal-app/terms.html")}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>利用規約</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>アカウント</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          onPress={() => {
            Alert.alert("ログアウト", "ログアウトしますか？", [
              { text: "キャンセル", style: "cancel" },
              { text: "ログアウト", style: "destructive", onPress: logout },
            ]);
          }}
        >
          <Text style={[styles.rowText, { color: colors.danger }]}>ログアウト</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() => {
            Alert.alert(
              "アカウントを削除",
              "すべてのデータが完全に削除されます。この操作は取り消せません。本当に削除しますか？",
              [
                { text: "キャンセル", style: "cancel" },
                {
                  text: "削除する",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const functions = getFunctions(app, "asia-northeast1");
                      const deleteAccount = httpsCallable(functions, "deleteAccount");
                      await deleteAccount();
                      Alert.alert("削除完了", "アカウントが削除されました。");
                    } catch (e) {
                      Alert.alert("エラー", "アカウントの削除に失敗しました。");
                    }
                  },
                },
              ]
            );
          }}
        >
          <Text style={[styles.rowText, { color: colors.danger }]}>アカウントを削除</Text>
        </Pressable>
      </View>

      <Text style={[styles.version, { color: colors.textMuted }]}>
        シフトカレンダー共有 v1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  profileEmail: { fontSize: 13 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  section: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: { fontSize: 15 },
  check: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 13 },
  premiumCard: { borderRadius: 16, padding: 18, marginBottom: 24, alignItems: "center" },
  premiumTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  premiumDesc: { fontSize: 13 },
  version: { textAlign: "center", fontSize: 12, marginTop: 16 },
});
