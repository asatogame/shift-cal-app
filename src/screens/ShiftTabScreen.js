import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { subscribeMyCalendars } from "../services/calendarService";

export default function ShiftTabScreen({ navigation }) {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyCalendars(user.uid, (list) => {
      setCalendars(list);
      if (!selectedCalendarId && list.length > 0) {
        setSelectedCalendarId(list[0].id);
      }
    });
    return unsub;
  }, [user]);

  const selectedCalendar = calendars.find((c) => c.id === selectedCalendarId);

  const menuItems = [
    {
      icon: "⚡",
      title: "シフト一括登録",
      desc: "パターンを選んで複数日をまとめて登録",
      onPress: () => {
        if (selectedCalendarId) {
          navigation.navigate("ShiftQuickAdd", { calendarId: selectedCalendarId });
        }
      },
    },
    {
      icon: "📷",
      title: "写真から予定登録",
      desc: "シフト表の写真をAIで自動読み取り",
      onPress: () => {
        if (selectedCalendarId) {
          navigation.navigate("PhotoImport", { calendarId: selectedCalendarId });
        }
      },
    },
    {
      icon: "🎨",
      title: "シフトパターン管理",
      desc: "パターンの追加・編集・並べ替え",
      onPress: () => {
        // ShiftPatternScreen が将来追加されたらここでnavigate
      },
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.calendarSelector}>
        <Text style={styles.calendarSelectorLabel}>対象カレンダー</Text>
        {calendars.length === 0 ? (
          <Text style={styles.noCalendarText}>
            カレンダーがありません。「カレンダー」タブから作成してください。
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarChips}>
            {calendars.map((cal) => (
              <Pressable
                key={cal.id}
                style={[
                  styles.calendarChip,
                  selectedCalendarId === cal.id && styles.calendarChipSelected,
                ]}
                onPress={() => setSelectedCalendarId(cal.id)}
              >
                <Text
                  style={[
                    styles.calendarChipText,
                    selectedCalendarId === cal.id && styles.calendarChipTextSelected,
                  ]}
                >
                  {cal.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {menuItems.map((item, i) => (
        <Pressable
          key={i}
          style={[styles.menuCard, !selectedCalendarId && { opacity: 0.4 }]}
          onPress={item.onPress}
          disabled={!selectedCalendarId}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <View style={styles.menuTextBox}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDesc}>{item.desc}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F" },
  content: { padding: 16, paddingTop: 8 },
  calendarSelector: {
    backgroundColor: "#1A1A1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2E",
  },
  calendarSelectorLabel: { fontSize: 12, color: "#8A8F98", marginBottom: 10 },
  noCalendarText: { fontSize: 13, color: "#6B7280", lineHeight: 20 },
  calendarChips: { flexDirection: "row" },
  calendarChip: {
    backgroundColor: "#2A2A2E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  calendarChipSelected: { backgroundColor: "#3A50E0" },
  calendarChipText: { fontSize: 14, color: "#9CA3AF", fontWeight: "600" },
  calendarChipTextSelected: { color: "#fff" },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1E",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A2E",
  },
  menuIcon: { fontSize: 28, marginRight: 14 },
  menuTextBox: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "700", color: "#F3F4F6", marginBottom: 4 },
  menuDesc: { fontSize: 12, color: "#6B7280" },
  menuArrow: { fontSize: 20, color: "#4B5563" },
});
