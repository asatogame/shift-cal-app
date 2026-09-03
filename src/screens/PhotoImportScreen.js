import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analyzeSchedulePhoto } from "../services/claudeVision";
import { addEventsBulk } from "../services/calendarService";

export default function PhotoImportScreen({ route, navigation }) {
  const { calendarId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedEvents, setParsedEvents] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async (fromCamera) => {
    const permissionResult = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("権限が必要です", "設定アプリからカメラ/写真へのアクセスを許可してください");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

    if (result.canceled || !result.assets || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    setImage({ uri: asset.uri, base64: asset.base64, mimeType });
    setParsedEvents(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const events = await analyzeSchedulePhoto(image.base64, image.mimeType);
      setParsedEvents(
        events.map((e, i) => ({
          _key: String(i),
          title: e.title || "",
          date: e.date || "",
          startTime: e.startTime || "",
          endTime: e.endTime || "",
          memo: e.memo || "",
          selected: true,
        }))
      );
    } catch (e) {
      Alert.alert("解析エラー", "画像の解析に失敗しました。もう一度お試しください。");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateEventField = (key, field, value) => {
    setParsedEvents((prev) =>
      prev.map((e) => (e._key === key ? { ...e, [field]: value } : e))
    );
  };

  const toggleSelected = (key) => {
    setParsedEvents((prev) =>
      prev.map((e) => (e._key === key ? { ...e, selected: !e.selected } : e))
    );
  };

  const handleSaveAll = async () => {
    const toSave = (parsedEvents || []).filter((e) => e.selected && e.title && e.date);
    if (toSave.length === 0) {
      Alert.alert("登録する予定がありません", "タイトルと日付が入力された予定を選択してください");
      return;
    }
    setSaving(true);
    try {
      await addEventsBulk(calendarId, user.uid, toSave);
      Alert.alert("登録完了", `${toSave.length}件の予定を登録しました`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("エラー", "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {!parsedEvents && (
        <View style={styles.pickerArea}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.hintBox}>
              <Text style={styles.hintIcon}>📷</Text>
              <Text style={[styles.hintTitle, { color: colors.text }]}>シフト表を読み取る</Text>
              <Text style={[styles.hintDesc, { color: colors.textMuted }]}>
                シフト表や勤務表の写真を撮影、{"\n"}またはアルバムから選択してください
              </Text>
            </View>
          )}

          <View style={styles.pickButtons}>
            <Pressable style={styles.pickButton} onPress={() => pickImage(true)}>
              <Text style={styles.pickButtonText}>カメラで撮影</Text>
            </Pressable>
            <Pressable
              style={[styles.pickButton, styles.pickButtonAlt, { backgroundColor: colors.surface, borderColor: colors.accent }]}
              onPress={() => pickImage(false)}
            >
              <Text style={[styles.pickButtonText, { color: colors.accent }]}>アルバムから選択</Text>
            </Pressable>
          </View>

          {image && (
            <Pressable
              style={styles.analyzeButton}
              onPress={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <View style={styles.analyzingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.analyzeButtonText}>  AI解析中...</Text>
                </View>
              ) : (
                <Text style={styles.analyzeButtonText}>AIで予定を読み取る</Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {parsedEvents && (
        <>
          <View style={styles.resultHeader}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {parsedEvents.length}件検出
            </Text>
            <Text style={[styles.resultDesc, { color: colors.textMuted }]}>内容を確認して登録してください</Text>
          </View>
          <FlatList
            data={parsedEvents}
            keyExtractor={(item) => item._key}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }, !item.selected && styles.resultCardOff]}>
                <Pressable onPress={() => toggleSelected(item._key)} style={styles.checkboxArea}>
                  <View style={[styles.checkbox, { borderColor: colors.textVeryMuted }, item.selected && styles.checkboxOn]}>
                    {item.selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.resultInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                    value={item.title}
                    onChangeText={(v) => updateEventField(item._key, "title", v)}
                    placeholder="タイトル"
                    placeholderTextColor={colors.textMuted}
                  />
                  <View style={styles.resultRow}>
                    <TextInput
                      style={[styles.resultInput, styles.resultInputSmall, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                      value={item.date}
                      onChangeText={(v) => updateEventField(item._key, "date", v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      style={[styles.resultInput, styles.resultInputSmall, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                      value={item.startTime}
                      onChangeText={(v) => updateEventField(item._key, "startTime", v)}
                      placeholder="開始"
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      style={[styles.resultInput, styles.resultInputSmall, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                      value={item.endTime}
                      onChangeText={(v) => updateEventField(item._key, "endTime", v)}
                      placeholder="終了"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            )}
          />
          <View style={styles.bottomRow}>
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setParsedEvents(null);
                setImage(null);
              }}
            >
              <Text style={[styles.retryButtonText, { color: colors.textSecondary }]}>撮り直す</Text>
            </Pressable>
            <Pressable style={styles.saveAllButton} onPress={handleSaveAll} disabled={saving}>
              <Text style={styles.saveAllButtonText}>
                {saving ? "登録中..." : "選択した予定を登録"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pickerArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  hintBox: { alignItems: "center", marginBottom: 32 },
  hintIcon: { fontSize: 48, marginBottom: 16 },
  hintTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  hintDesc: { textAlign: "center", lineHeight: 22, fontSize: 14 },
  preview: { width: "100%", height: 300, marginBottom: 20, borderRadius: 16 },
  pickButtons: { flexDirection: "row", gap: 10, width: "100%" },
  pickButton: {
    flex: 1,
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickButtonAlt: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  pickButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  analyzeButton: {
    marginTop: 16,
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  analyzingRow: { flexDirection: "row", alignItems: "center" },
  analyzeButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  resultHeader: { marginBottom: 14 },
  resultTitle: { fontSize: 18, fontWeight: "800" },
  resultDesc: { fontSize: 13, marginTop: 4 },
  resultCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
  },
  resultCardOff: { opacity: 0.4 },
  checkboxArea: { paddingTop: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: "#3A50E0", borderColor: "#3A50E0" },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  resultInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 6,
  },
  resultRow: { flexDirection: "row", gap: 6 },
  resultInputSmall: { flex: 1 },
  bottomRow: { flexDirection: "row", gap: 10, paddingTop: 10 },
  retryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryButtonText: { fontWeight: "700" },
  saveAllButton: {
    flex: 2,
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveAllButtonText: { color: "#fff", fontWeight: "700" },
});
