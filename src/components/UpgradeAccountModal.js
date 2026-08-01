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

export default function UpgradeAccountModal({ visible, onClose, onSuccess }) {
  const { register, loginWithApple } = useAuth();
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
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>アカウント登録</Text>
          <Text style={styles.desc}>
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
              <Text style={styles.emailLink}>メールアドレスで登録</Text>
            </Pressable>
          ) : (
            <View style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="表示名"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="パスワード（6文字以上）"
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>あとで</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1D23",
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: "#8A8F98",
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
    color: "#8A8F98",
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
    borderColor: "#E1E4E8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#F8F9FB",
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
    color: "#E4572E",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  cancelText: {
    color: "#C4C8CE",
    fontSize: 13,
  },
});
