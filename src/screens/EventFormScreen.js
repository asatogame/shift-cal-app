import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { addEvent, updateEvent, deleteEvent } from "../services/calendarService";
import { getPresets } from "../services/shiftPresets";

const COLORS = ["#3A50E0", "#EF4444", "#16A34A", "#8B5CF6", "#F59E0B", "#EC4899"];

export default function EventFormScreen({ route, navigation }) {
  const { calendarId, event, date } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title || "");
  const [startTime, setStartTime] = useState(event?.startTime || "");
  const [endTime, setEndTime] = useState(event?.endTime || "");
  const [memo, setMemo] = useState(event?.memo || "");
  const [color, setColor] = useState(event?.color || COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
    });
  }, [navigation, colors]);

  useEffect(() => {
    if (!isEdit) {
      getPresets().then(setPresets);
    }
  }, [isEdit]);

  const applyPreset = (preset) => {
    setTitle(preset.label);
    setStartTime(preset.startTime || "");
    setEndTime(preset.endTime || "");
    setColor(preset.color);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("入力エラー", "タイトルを入力してください");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateEvent(calendarId, event.id, {
          title: title.trim(),
          startTime: startTime.trim() || null,
          endTime: endTime.trim() || null,
          memo: memo.trim(),
          color,
        });
      } else {
        await addEvent(calendarId, user.uid, {
          title: title.trim(),
          date,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          memo: memo.trim(),
          color,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("エラー", "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("削除確認", "この予定を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await deleteEvent(calendarId, event.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {!isEdit && presets.length > 0 && (
        <>
          <Text style={[styles.label, { color: colors.textMuted }]}>クイック入力</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
            {presets.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.presetChip, { backgroundColor: p.color + "18", borderColor: p.color }]}
                onPress={() => applyPreset(p)}
              >
                <Text style={[styles.presetChipText, { color: p.color }]}>{p.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={[styles.label, { color: colors.textMuted }]}>タイトル</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
        value={title}
        onChangeText={setTitle}
        placeholder="例: 早番、MTG、休み"
        placeholderTextColor={colors.textMuted}
        autoFocus={isEdit || presets.length === 0}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={[styles.label, { color: colors.textMuted }]}>開始</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="09:00"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.half}>
          <Text style={[styles.label, { color: colors.textMuted }]}>終了</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="18:00"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>メモ</Text>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
        value={memo}
        onChangeText={setMemo}
        placeholder="任意のメモ"
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>カラー</Text>
      <View style={styles.colorRow}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              color === c && { borderWidth: 3, borderColor: colors.text },
            ]}
          />
        ))}
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? "保存中..." : "保存する"}</Text>
      </Pressable>

      {isEdit && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>この予定を削除</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 12, marginBottom: 6, marginTop: 16, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  presetRow: { marginBottom: 4 },
  presetChip: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  presetChipText: { fontSize: 14, fontWeight: "700" },
  colorRow: { flexDirection: "row", gap: 12 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  saveButton: {
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  deleteButton: { alignItems: "center", marginTop: 20 },
  deleteButtonText: { fontSize: 14 },
});
