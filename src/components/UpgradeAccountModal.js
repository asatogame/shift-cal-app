import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function UpgradeAccountModal({ visible, onClose, onSuccess }) {
  const { register, login, loginWithApple } = useAuth();
  const { colors } = useTheme();
  const [tab, setTab] = useState("register"); // "register" or "login"
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleApple = async () => {
    setError("");
    setBusy(true);
    try {
      await loginWithApple();
      onSuccess?.();
      onClose();
    } catch (e) {
      if (e.code === "ERR_REQUEST_CANCELED" || e.code === "ERR_CANCELED") {
        // ユーザーがキャンセル
      } else if (e.code === "auth/credential-already-in-use") {
        setError("このApple IDは既に別のアカウントで使用されています");
      } else if (e.code === "auth/provider-already-linked") {
        setError("このアカウントは既にAppleと連携されています");
      } else {
        console.warn("Apple sign-in error:", e.code, e.message);
        setError(`Appleサインインに失敗しました（${e.code || "不明"}）。もう一度お試しください`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailRegister = async () => {
    setError("");
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setBusy(true);
    try {
      await register(email, password, displayName);
      onSuccess?.();
      onClose();
    } catch (e) {
      const code = e?.code;
      if (code === "auth/email-already-in-use") {
        setError("このメールアドレスは既に使われています");
      } else if (code === "auth/weak-password") {
        setError("パスワードは6文字以上にしてください");
      } else if (code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません");
      } else {
        setError("登録に失敗しました。もう一度お試しください");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
      onSuccess?.();
      onClose();
    } catch (e) {
      const code = e?.code;
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setError("メールアドレスまたはパスワードが間違っています");
      } else if (code === "auth/wrong-password") {
        setError("パスワードが間違っています");
      } else if (code === "auth/too-many-requests") {
        setError("ログイン試行回数が多すぎます。しばらく待ってからお試しください");
      } else {
        setError("ログインに失敗しました。もう一度お試しください");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    setTab("register");
    setShowEmail(false);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError("");
    onClose();
  };

  const isLogin = tab === "login";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.box, { backgroundColor: colors.modalBg }]}>
          {/* タブ切り替え */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, !isLogin && [styles.tabActive, { borderBottomColor: colors.accent }]]}
              onPress={() => { setTab("register"); setShowEmail(false); setError(""); }}
            >
              <Text style={[styles.tabText, { color: !isLogin ? colors.accent : colors.textSecondary }]}>
                アカウント登録
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, isLogin && [styles.tabActive, { borderBottomColor: colors.accent }]]}
              onPress={() => { setTab("login"); setShowEmail(false); setError(""); }}
            >
              <Text style={[styles.tabText, { color: isLogin ? colors.accent : colors.textSecondary }]}>
                ログイン
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {isLogin
              ? "既存のアカウントにログイン"
              : "カレンダーを共有するには\nアカウント登録が必要です"}
          </Text>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                isLogin
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
              }
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={10}
              style={styles.appleBtn}
              onPress={handleApple}
            />
          )}

          {!showEmail ? (
            <Pressable onPress={() => setShowEmail(true)}>
              <Text style={[styles.emailLink, { color: colors.textSecondary }]}>
                {isLogin ? "メールアドレスでログイン" : "メールアドレスで登録"}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.emailForm}>
              {!isLogin && (
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                  placeholder="表示名"
                  placeholderTextColor={colors.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              )}
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="メールアドレス"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder={isLogin ? "パスワード" : "パスワード（6文字以上）"}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Pressable
                style={[styles.registerBtn, busy && { opacity: 0.6 }]}
                onPress={isLogin ? handleEmailLogin : handleEmailRegister}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerBtnText}>
                    {isLogin ? "ログイン" : "登録する"}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={[styles.cancelText, { color: colors.textVeryMuted }]}>あとで</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  box: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  tabRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "700",
  },
  desc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  appleBtn: {
    width: "100%",
    height: 48,
    marginBottom: 12,
  },
  emailLink: {
    fontSize: 13,
    textDecorationLine: "underline",
    paddingVertical: 8,
  },
  emailForm: {
    width: "100%",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  registerBtn: {
    backgroundColor: "#3A50E0",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  error: {
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
  },
});
