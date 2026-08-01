import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login, register, loginWithApple } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, displayName.trim());
      }
    } catch (e) {
      setError(translateError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithApple();
    } catch (e) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        setError("Appleサインインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>シフトカレンダー共有</Text>
        <Text style={styles.subtitle}>
          仕事仲間とシフトを共有。{"\n"}写真を撮るだけで予定を自動登録。
        </Text>

        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}

        {!showEmailForm && (
          <Pressable
            style={styles.emailToggle}
            onPress={() => setShowEmailForm(true)}
          >
            <Text style={styles.emailToggleText}>
              メールアドレスでログイン / 登録
            </Text>
          </Pressable>
        )}

        {showEmailForm && (
          <>
            {mode === "register" && (
              <TextInput
                style={styles.input}
                placeholder="表示名"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="none"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="パスワード（6文字以上）"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable style={styles.button} onPress={handleEmailSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === "login" ? "ログイン" : "登録する"}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setError("");
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              <Text style={styles.switchText}>
                {mode === "login"
                  ? "アカウントをお持ちでない方はこちら"
                  : "すでにアカウントをお持ちの方はこちら"}
              </Text>
            </Pressable>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function translateError(e) {
  const code = e && e.code;
  switch (code) {
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません";
    case "auth/email-already-in-use":
      return "このメールアドレスはすでに登録されています";
    case "auth/weak-password":
      return "パスワードは6文字以上にしてください";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "メールアドレスまたはパスワードが正しくありません";
    default:
      return "エラーが発生しました。もう一度お試しください";
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1D23",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8A8F98",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  appleButton: {
    width: "100%",
    height: 52,
    marginBottom: 16,
  },
  emailToggle: {
    paddingVertical: 14,
    alignItems: "center",
  },
  emailToggleText: {
    color: "#8A8F98",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E1E4E8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#F8F9FB",
  },
  error: {
    color: "#E4572E",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#3A50E0",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  switchText: {
    color: "#3A50E0",
    fontSize: 13,
    textAlign: "center",
  },
});
