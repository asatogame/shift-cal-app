import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { subscribeMyCalendars } from "../services/calendarService";

export default function ShiftTabScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
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
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.calendarSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.calendarSelectorLabel, { color: colors.textMuted }]}>対象カレンダー</Text>
        {calendars.length === 0 ? (
          <Text style={[styles.noCalendarText, { color: colors.textSecondary }]}>
            カレンダーがありません。「カレンダー」タブから作成してください。
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarChips}>
            {calendars.map((cal) => (
              <Pressable
                key={cal.id}
                style={[
                  styles.calendarChip,
                  { backgroundColor: colors.surfaceAlt },
                  selectedCalendarId === cal.id && { backgroundColor: colors.accent },
                ]}
                onPress={() => setSelectedCalendarId(cal.id)}
              >
                <Text
                  style={[
                    styles.calendarChipText,
                    { color: colors.textMuted },
                    selectedCalendarId === cal.id && { color: "#fff" },
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
          style={[
            styles.menuCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !selectedCalendarId && { opacity: 0.4 },
          ]}
          onPress={item.onPress}
          disabled={!selectedCalendarId}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <View style={styles.menuTextBox}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
          </View>
          <Text style={[styles.menuArrow, { color: colors.textVeryMuted }]}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  calendarSelector: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  calendarSelectorLabel: { fontSize: 12, marginBottom: 10 },
  noCalendarText: { fontSize: 13, lineHeight: 20 },
  calendarChips: { flexDirection: "row" },
  calendarChip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  calendarChipText: { fontSize: 14, fontWeight: "600" },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  menuIcon: { fontSize: 28, marginRight: 14 },
  menuTextBox: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  menuDesc: { fontSize: 12 },
  menuArrow: { fontSize: 20 },
});
