import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { getPresets } from "../services/shiftPresets";
import { addEvent } from "../services/calendarService";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function ShiftQuickAddScreen({ route, navigation }) {
  const { calendarId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [month, setMonth] = useState(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
    });
  }, [navigation, colors]);

  useEffect(() => {
    getPresets().then((p) => {
      setPresets(p);
      if (p.length > 0) setSelectedPreset(p[0]);
    });
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const toggleDate = (day) => {
    const key = format(day, "yyyy-MM-dd");
    const next = new Set(selectedDates);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedDates(next);
  };

  const handleSave = async () => {
    if (!selectedPreset) {
      Alert.alert("エラー", "シフトパターンを選んでください");
      return;
    }
    if (selectedDates.size === 0) {
      Alert.alert("エラー", "日付を1つ以上選んでください");
      return;
    }
    setSaving(true);
    try {
      const dates = Array.from(selectedDates).sort();
      for (const date of dates) {
        await addEvent(calendarId, user.uid, {
          title: selectedPreset.label,
          date,
          startTime: selectedPreset.startTime,
          endTime: selectedPreset.endTime,
          color: selectedPreset.color,
        });
      }
      Alert.alert(
        "完了",
        `${dates.length}件の「${selectedPreset.label}」を登録しました`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert("エラー", "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>シフトパターンを選択</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
        {presets.map((p) => (
          <Pressable
            key={p.id}
            style={[
              styles.presetChip,
              { borderColor: p.color },
              selectedPreset?.id === p.id && { backgroundColor: p.color },
            ]}
            onPress={() => setSelectedPreset(p)}
          >
            <Text
              style={[
                styles.presetChipText,
                { color: p.color },
                selectedPreset?.id === p.id && { color: "#fff" },
              ]}
            >
              {p.label}
            </Text>
            {p.startTime ? (
              <Text
                style={[
                  styles.presetChipSub,
                  { color: p.color },
                  selectedPreset?.id === p.id && { color: "rgba(255,255,255,0.8)" },
                ]}
              >
                {p.startTime}-{p.endTime}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        日付を選択（{selectedDates.size}日選択中）
      </Text>

      <View style={styles.monthHeader}>
        <Pressable onPress={() => setMonth(subMonths(month, 1))} hitSlop={12}>
          <Text style={[styles.monthNav, { color: colors.accentText }]}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{format(month, "yyyy年 M月")}</Text>
        <Pressable onPress={() => setMonth(addMonths(month, 1))} hitSlop={12}>
          <Text style={[styles.monthNav, { color: colors.accentText }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.weekdayLabel,
              { color: colors.weekday },
              i === 0 && { color: colors.sunday },
              i === 6 && { color: colors.saturday },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const selected = selectedDates.has(key);
          return (
            <Pressable
              key={key}
              style={[
                styles.cell,
                selected && {
                  backgroundColor: selectedPreset?.color || "#3A50E0",
                  borderRadius: 10,
                },
              ]}
              onPress={() => inMonth && toggleDate(day)}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: colors.dayText },
                  !inMonth && { color: colors.dayTextMuted },
                  selected && { color: "#fff", fontWeight: "700" },
                  isToday(day) && !selected && { color: colors.dayToday, fontWeight: "700" },
                ]}
              >
                {format(day, "d")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {selectedDates.size}件の予定を一括登録
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  presetScroll: { marginBottom: 20 },
  presetChip: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: "center",
    minWidth: 80,
  },
  presetChipText: {
    fontSize: 15,
    fontWeight: "700",
  },
  presetChipSub: {
    fontSize: 11,
    marginTop: 2,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 24,
  },
  monthNav: { fontSize: 24, paddingHorizontal: 12 },
  monthLabel: { fontSize: 16, fontWeight: "700" },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  cell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 15 },
  saveButton: {
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
