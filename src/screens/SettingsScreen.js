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
import { app } from "../firebase";
import UpgradeAccountModal from "../components/UpgradeAccountModal";

export default function SettingsScreen({ navigation }) {
  const { user, isGuest, logout } = useAuth();
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  const displayName = user?.displayName || (isGuest() ? "ゲスト" : user?.email || "");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(displayName || "?")[0]}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>
            {isGuest() ? "匿名ユーザー" : user?.email || ""}
          </Text>
        </View>
      </View>

      {isGuest() && (
        <>
          <Text style={styles.sectionLabel}>アカウント登録</Text>
          <View style={styles.section}>
            <Pressable
              style={styles.row}
              onPress={() => setShowUpgrade(true)}
            >
              <Text style={[styles.rowText, { color: "#3A50E0" }]}>
                ログイン / アカウント登録
              </Text>
              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>
          <Text style={styles.hintText}>
            カレンダーを共有するにはアカウント登録が必要です
          </Text>
        </>
      )}

      <Text style={styles.sectionLabel}>サポート</Text>
      <View style={styles.section}>
        <Pressable
          style={[styles.row, styles.rowBorder]}
          onPress={() =>
            Linking.openURL(
              "mailto:info@jack-central.com?subject=" +
                encodeURIComponent("【シフトカレンダー共有】お問い合わせ")
            )
          }
        >
          <Text style={styles.rowText}>お問い合わせ</Text>
          <Text style={styles.rowSub}>メールで連絡</Text>
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
          <Text style={styles.rowText}>不具合を報告</Text>
          <Text style={styles.rowSub}>バグ報告</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>法的情報</Text>
      <View style={styles.section}>
        <Pressable
          style={[styles.row, styles.rowBorder]}
          onPress={() =>
            Linking.openURL(
              "https://asatogame.github.io/shift-cal-app/privacy.html"
            )
          }
        >
          <Text style={styles.rowText}>プライバシーポリシー</Text>
          <Text style={styles.rowArrow}>›</Text>
        </Pressable>
        <Pressable
          style={styles.row}
          onPress={() =>
            Linking.openURL(
              "https://asatogame.github.io/shift-cal-app/terms.html"
            )
          }
        >
          <Text style={styles.rowText}>利用規約</Text>
          <Text style={styles.rowArrow}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>アカウント</Text>
      <View style={styles.section}>
        <Pressable
          style={[styles.row, styles.rowBorder]}
          onPress={() => {
            Alert.alert("ログアウト", "ログアウトしますか？", [
              { text: "キャンセル", style: "cancel" },
              { text: "ログアウト", style: "destructive", onPress: logout },
            ]);
          }}
        >
          <Text style={[styles.rowText, { color: "#EF4444" }]}>ログアウト</Text>
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
          <Text style={[styles.rowText, { color: "#EF4444" }]}>
            アカウントを削除
          </Text>
        </Pressable>
      </View>

      <Text style={styles.version}>シフトカレンダー共有 v1.0.0</Text>

      <UpgradeAccountModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onSuccess={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFBFC" },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: "#3A50E0" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 4 },
  profileEmail: { fontSize: 13, color: "#9CA3AF" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
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
    borderBottomColor: "#F3F4F6",
  },
  rowText: { fontSize: 15, color: "#1F2937" },
  rowSub: { fontSize: 13, color: "#9CA3AF" },
  rowArrow: { fontSize: 18, color: "#D1D5DB" },
  hintText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: -16,
    marginBottom: 24,
    marginLeft: 4,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#D1D5DB",
    marginTop: 8,
  },
});
