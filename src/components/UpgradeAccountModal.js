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
  const { register, loginWithApple } = useAuth();
  const { colors } = useTheme();
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
      if (e.code !== "ERR_REQUEST_CANCELED") {
        setError("Appleサインインに失敗しました");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async () => {
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
      } else {
        setError("登録に失敗しました。もう一度お試しください");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    setShowEmail(false);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.box, { backgroundColor: colors.modalBg }]}>
          <Text style={[styles.title, { color: colors.text }]}>アカウント登録</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            カレンダーを共有するには{"\n"}アカウント登録が必要です
          </Text>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={10}
              style={styles.appleBtn}
              onPress={handleApple}
            />
          )}

          {!showEmail ? (
            <Pressable onPress={() => setShowEmail(true)}>
              <Text style={[styles.emailLink, { color: colors.textSecondary }]}>メールアドレスで登録</Text>
            </Pressable>
          ) : (
            <View style={styles.emailForm}>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="表示名"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
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
                placeholder="パスワード（6文字以上）"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Pressable style={styles.registerBtn} onPress={handleEmail} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerBtnText}>登録する</Text>
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
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
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
