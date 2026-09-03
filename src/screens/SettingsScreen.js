import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { app } from "../firebase";
import UpgradeAccountModal from "../components/UpgradeAccountModal";

const THEME_OPTIONS = [
  { key: "system", label: "端末に合わせる" },
  { key: "light", label: "ライト" },
  { key: "dark", label: "ダーク" },
];

export default function SettingsScreen({ navigation }) {
  const { user, isGuest, logout } = useAuth();
  const { colors, mode, setThemeMode } = useTheme();
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  const displayName = user?.displayName || (isGuest() ? "ゲスト" : user?.email || "");

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.avatar }]}>
          <Text style={[styles.avatarText, { color: colors.avatarText }]}>
            {(displayName || "?")[0]}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {isGuest() ? "匿名ユーザー" : user?.email || ""}
          </Text>
        </View>
      </View>

      {isGuest() && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>アカウント登録</Text>
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              style={styles.row}
              onPress={() => setShowUpgrade(true)}
            >
              <Text style={[styles.rowText, { color: colors.accent }]}>
                ログイン / アカウント登録
              </Text>
              <Text style={[styles.rowArrow, { color: colors.textVeryMuted }]}>›</Text>
            </Pressable>
          </View>
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            カレンダーを共有するにはアカウント登録が必要です
          </Text>
        </>
      )}

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>外観</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {THEME_OPTIONS.map((opt, i) => (
          <Pressable
            key={opt.key}
            style={[styles.row, i < THEME_OPTIONS.length - 1 && [styles.rowBorder, { borderBottomColor: colors.border }]]}
            onPress={() => setThemeMode(opt.key)}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>{opt.label}</Text>
            {mode === opt.key && <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "700" }}>✓</Text>}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>サポート</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.row, styles.rowBorder, { borderBottomColor: colors.border }]}
          onPress={() =>
            Linking.openURL(
              "mailto:info@jack-central.com?subject=" +
                encodeURIComponent("【シフトカレンダー共有】お問い合わせ")
            )
          }
        >
          <Text style={[styles.rowText, { color: colors.text }]}>お問い合わせ</Text>
          <Text style={[styles.rowSub, { color: colors.textSecondary }]}>メールで連絡</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() =>
            Linking.openURL(
              "mailto:info@jack-central.com?subject=" +
                encodeURIComponent("【シフトカレンダー共有】不具合報告") +
                "&body=" +
                encodeURIComponent(
                  "■ 発生した問題\n\n\n■ 再現手順\n\n\n■ 端末情報\n"
                )
            )
          }
        >
          <Text style={[styles.rowText, { color: colors.text }]}>不具合を報告</Text>
          <Text style={[styles.rowSub, { color: colors.textSecondary }]}>バグ報告</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>法的情報</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.row, styles.rowBorder, { borderBottomColor: colors.border }]}
          onPress={() =>
            Linking.openURL(
              "https://asatogame.github.io/shift-cal-app/privacy.html"
            )
          }
        >
          <Text style={[styles.rowText, { color: colors.text }]}>プライバシーポリシー</Text>
          <Text style={[styles.rowArrow, { color: colors.textVeryMuted }]}>›</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() =>
            Linking.openURL(
              "https://asatogame.github.io/shift-cal-app/terms.html"
            )
          }
        >
          <Text style={[styles.rowText, { color: colors.text }]}>利用規約</Text>
          <Text style={[styles.rowArrow, { color: colors.textVeryMuted }]}>›</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>アカウント</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.row, styles.rowBorder, { borderBottomColor: colors.border }]}
          onPress={() => {
            Alert.alert("ログアウト", "ログアウトしますか？", [
              { text: "キャンセル", style: "cancel" },
              { text: "ログアウト", style: "destructive", onPress: logout },
            ]);
          }}
        >
          <Text style={[styles.rowText, { color: colors.error }]}>ログアウト</Text>
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
                      const deleteAccount = httpsCallable(
                        functions,
                        "deleteAccount"
                      );
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
          <Text style={[styles.rowText, { color: colors.error }]}>
            アカウントを削除
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.version, { color: colors.textVeryMuted }]}>シフトカレンダー共有 v1.0.0</Text>

      <UpgradeAccountModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onSuccess={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
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
  rowBorder: {
    borderBottomWidth: 1,
  },
  rowText: { fontSize: 15 },
  rowSub: { fontSize: 13 },
  rowArrow: { fontSize: 18 },
  hintText: {
    fontSize: 12,
    marginTop: -16,
    marginBottom: 24,
    marginLeft: 4,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});
