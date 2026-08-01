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
import { analyzeSchedulePhoto } from "../services/claudeVision";
import { addEventsBulk } from "../services/calendarService";

export default function PhotoImportScreen({ route, navigation }) {
  const { calendarId } = route.params;
  const { user } = useAuth();
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
    <View style={styles.container}>
      {!parsedEvents && (
        <View style={styles.pickerArea}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.hintBox}>
              <Text style={styles.hintIcon}>📷</Text>
              <Text style={styles.hintTitle}>シフト表を読み取る</Text>
              <Text style={styles.hintDesc}>
                シフト表や勤務表の写真を撮影、{"\n"}またはアルバムから選択してください
              </Text>
            </View>
          )}

          <View style={styles.pickButtons}>
            <Pressable style={styles.pickButton} onPress={() => pickImage(true)}>
              <Text style={styles.pickButtonText}>カメラで撮影</Text>
            </Pressable>
            <Pressable style={[styles.pickButton, styles.pickButtonAlt]} onPress={() => pickImage(false)}>
              <Text style={[styles.pickButtonText, styles.pickButtonTextAlt]}>アルバムから選択</Text>
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
            <Text style={styles.resultTitle}>
              {parsedEvents.length}件検出
            </Text>
            <Text style={styles.resultDesc}>内容を確認して登録してください</Text>
          </View>
          <FlatList
            data={parsedEvents}
            keyExtractor={(item) => item._key}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={[styles.resultCard, !item.selected && styles.resultCardOff]}>
                <Pressable onPress={() => toggleSelected(item._key)} style={styles.checkboxArea}>
                  <View style={[styles.checkbox, item.selected && styles.checkboxOn]}>
                    {item.selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.resultInput}
                    value={item.title}
                    onChangeText={(v) => updateEventField(item._key, "title", v)}
                    placeholder="タイトル"
                  />
                  <View style={styles.resultRow}>
                    <TextInput
                      style={[styles.resultInput, styles.resultInputSmall]}
                      value={item.date}
                      onChangeText={(v) => updateEventField(item._key, "date", v)}
                      placeholder="YYYY-MM-DD"
                    />
                    <TextInput
                      style={[styles.resultInput, styles.resultInputSmall]}
                      value={item.startTime}
                      onChangeText={(v) => updateEventField(item._key, "startTime", v)}
                      placeholder="開始"
                    />
                    <TextInput
                      style={[styles.resultInput, styles.resultInputSmall]}
                      value={item.endTime}
                      onChangeText={(v) => updateEventField(item._key, "endTime", v)}
                      placeholder="終了"
                    />
                  </View>
                </View>
              </View>
            )}
          />
          <View style={styles.bottomRow}>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setParsedEvents(null);
                setImage(null);
              }}
            >
              <Text style={styles.retryButtonText}>撮り直す</Text>
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
  container: { flex: 1, backgroundColor: "#FAFBFC", padding: 20 },
  pickerArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  hintBox: { alignItems: "center", marginBottom: 32 },
  hintIcon: { fontSize: 48, marginBottom: 16 },
  hintTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginBottom: 8 },
  hintDesc: { color: "#9CA3AF", textAlign: "center", lineHeight: 22, fontSize: 14 },
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
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#3A50E0",
  },
  pickButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  pickButtonTextAlt: { color: "#3A50E0" },
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
  resultTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  resultDesc: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  resultCardOff: { opacity: 0.4 },
  checkboxArea: { paddingTop: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: "#3A50E0", borderColor: "#3A50E0" },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  resultInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    marginBottom: 6,
  },
  resultRow: { flexDirection: "row", gap: 6 },
  resultInputSmall: { flex: 1 },
  bottomRow: { flexDirection: "row", gap: 10, paddingTop: 10 },
  retryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryButtonText: { color: "#6B7280", fontWeight: "700" },
  saveAllButton: {
    flex: 2,
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveAllButtonText: { color: "#fff", fontWeight: "700" },
});
