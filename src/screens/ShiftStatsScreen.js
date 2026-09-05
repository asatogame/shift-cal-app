import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { subscribeMyCalendars, subscribeEvents } from "../services/calendarService";

export default function ShiftStatsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [month, setMonth] = useState(new Date());
  const [calendars, setCalendars] = useState([]);
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyCalendars(user.uid, setCalendars);
    return unsub;
  }, [user]);

  // 全カレンダーのイベントを購読
  useEffect(() => {
    if (calendars.length === 0) {
      setAllEvents([]);
      return;
    }
    const unsubs = [];
    const eventsMap = {};
    calendars.forEach((cal) => {
      const unsub = subscribeEvents(cal.id, (events) => {
        eventsMap[cal.id] = events.map((e) => ({ ...e, calendarName: cal.name, calendarColor: cal.color }));
        const merged = Object.values(eventsMap).flat();
        setAllEvents(merged);
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [calendars]);

  const monthStr = format(month, "yyyy-MM");

  const monthEvents = useMemo(
    () => allEvents.filter((e) => e.date && e.date.startsWith(monthStr)),
    [allEvents, monthStr]
  );

  // パターン別集計
  const patternStats = useMemo(() => {
    const map = {};
    monthEvents.forEach((e) => {
      const key = e.title || "（タイトルなし）";
      if (!map[key]) {
        map[key] = { count: 0, color: e.color || "#3A50E0", totalMinutes: 0 };
      }
      map[key].count++;
      // 勤務時間計算
      if (e.startTime && e.endTime) {
        const [sh, sm] = e.startTime.split(":").map(Number);
        const [eh, em] = e.endTime.split(":").map(Number);
        let minutes = (eh * 60 + em) - (sh * 60 + sm);
        if (minutes < 0) minutes += 24 * 60; // 日をまたぐ場合
        map[key].totalMinutes += minutes;
      }
    });
    return Object.entries(map)
      .map(([title, data]) => ({ title, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [monthEvents]);

  const totalDays = monthEvents.length;
  const totalMinutes = patternStats.reduce((sum, p) => sum + p.totalMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainMinutes = totalMinutes % 60;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* 月切り替え */}
      <View style={styles.monthHeader}>
        <Pressable onPress={() => setMonth(subMonths(month, 1))} hitSlop={16}>
          <Text style={[styles.monthNav, { color: colors.textSecondary }]}>{"<"}</Text>
        </Pressable>
        <Pressable onPress={() => setMonth(new Date())}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{format(month, "yyyy年 M月")}</Text>
        </Pressable>
        <Pressable onPress={() => setMonth(addMonths(month, 1))} hitSlop={16}>
          <Text style={[styles.monthNav, { color: colors.textSecondary }]}>{">"}</Text>
        </Pressable>
      </View>

      {/* サマリーカード */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: colors.accent }]}>{totalDays}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>出勤日数</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: colors.accent }]}>
            {totalHours}:{String(remainMinutes).padStart(2, "0")}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>合計勤務時間</Text>
        </View>
      </View>

      {/* パターン別内訳 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>シフト別 内訳</Text>

      {patternStats.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            この月の予定はありません
          </Text>
        </View>
      ) : (
        patternStats.map((p, i) => {
          const hours = Math.floor(p.totalMinutes / 60);
          const mins = p.totalMinutes % 60;
          return (
            <View
              key={i}
              style={[styles.statRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.statColor, { backgroundColor: p.color }]} />
              <View style={styles.statInfo}>
                <Text style={[styles.statTitle, { color: colors.text }]}>{p.title}</Text>
                {p.totalMinutes > 0 && (
                  <Text style={[styles.statTime, { color: colors.textSecondary }]}>
                    {hours}時間{mins > 0 ? `${mins}分` : ""}
                  </Text>
                )}
              </View>
              <View style={styles.statCountBox}>
                <Text style={[styles.statCount, { color: colors.accent }]}>{p.count}</Text>
                <Text style={[styles.statCountLabel, { color: colors.textMuted }]}>回</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 20,
    marginBottom: 16,
  },
  monthNav: { fontSize: 18, fontWeight: "600", paddingHorizontal: 8 },
  monthLabel: { fontSize: 17, fontWeight: "700" },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  summaryValue: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  summaryLabel: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  emptyCard: {
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyText: { fontSize: 14 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  statColor: { width: 4, height: 36, borderRadius: 2, marginRight: 14 },
  statInfo: { flex: 1 },
  statTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  statTime: { fontSize: 12 },
  statCountBox: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  statCount: { fontSize: 24, fontWeight: "800" },
  statCountLabel: { fontSize: 12, fontWeight: "600" },
});
