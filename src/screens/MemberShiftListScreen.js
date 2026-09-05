import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  subscribeMyCalendars,
  subscribeEvents,
  getMembers,
} from "../services/calendarService";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export default function MemberShiftListScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [calendars, setCalendars] = useState([]);
  const [selectedCalId, setSelectedCalId] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyCalendars(user.uid, (list) => {
      setCalendars(list);
      if (!selectedCalId && list.length > 0) setSelectedCalId(list[0].id);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!selectedCalId) return;
    const unsub = subscribeEvents(selectedCalId, setEvents);
    return unsub;
  }, [selectedCalId]);

  useEffect(() => {
    if (!selectedCalId) return;
    const cal = calendars.find((c) => c.id === selectedCalId);
    if (cal?.memberIds) {
      getMembers(cal.memberIds).then(setMembers);
    }
  }, [selectedCalId, calendars]);

  // 週の日付配列 (月〜日)
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // メンバー × 日ごとにイベントをマッピング
  const memberSchedule = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      map[m.uid] = {};
      weekDates.forEach((d) => {
        const key = format(d, "yyyy-MM-dd");
        map[m.uid][key] = events.filter(
          (e) => e.createdBy === m.uid && e.date === key
        );
      });
    });
    return map;
  }, [members, events, weekDates]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* カレンダー選択 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calChips}>
        {calendars.map((cal) => (
          <Pressable
            key={cal.id}
            style={[
              styles.chip,
              { backgroundColor: colors.surfaceAlt },
              selectedCalId === cal.id && { backgroundColor: colors.accent },
            ]}
            onPress={() => setSelectedCalId(cal.id)}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.textMuted },
                selectedCalId === cal.id && { color: "#fff" },
              ]}
            >
              {cal.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 週ナビゲーション */}
      <View style={styles.weekNav}>
        <Pressable onPress={() => setWeekStart(subWeeks(weekStart, 1))} hitSlop={12}>
          <Text style={[styles.navBtn, { color: colors.textSecondary }]}>{"<"}</Text>
        </Pressable>
        <Pressable onPress={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          <Text style={[styles.weekLabel, { color: colors.text }]}>
            {format(weekStart, "M/d")} 〜{" "}
            {format(addDays(weekStart, 6), "M/d")}
          </Text>
        </Pressable>
        <Pressable onPress={() => setWeekStart(addWeeks(weekStart, 1))} hitSlop={12}>
          <Text style={[styles.navBtn, { color: colors.textSecondary }]}>{">"}</Text>
        </Pressable>
      </View>

      {/* 曜日ヘッダー */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <View style={styles.nameCol}>
          <Text style={[styles.headerText, { color: colors.textMuted }]}>メンバー</Text>
        </View>
        {weekDates.map((d, i) => {
          const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          return (
            <View key={i} style={styles.dayCol}>
              <Text
                style={[
                  styles.dayLabel,
                  { color: i === 5 ? "#3B82F6" : i === 6 ? "#EF4444" : colors.textMuted },
                ]}
              >
                {WEEKDAYS[i]}
              </Text>
              <Text
                style={[
                  styles.dateLabel,
                  { color: colors.text },
                  isToday && styles.todayLabel,
                  isToday && { backgroundColor: colors.accent, color: "#fff" },
                ]}
              >
                {format(d, "d")}
              </Text>
            </View>
          );
        })}
      </View>

      {/* メンバー行 */}
      {members.map((m) => (
        <View
          key={m.uid}
          style={[styles.memberRow, { borderBottomColor: colors.border }]}
        >
          <View style={styles.nameCol}>
            <View style={[styles.avatar, { backgroundColor: colors.avatar }]}>
              <Text style={[styles.avatarText, { color: colors.avatarText }]}>
                {(m.displayName || "?")[0]}
              </Text>
            </View>
            <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
              {m.displayName || "名前未設定"}
            </Text>
          </View>
          {weekDates.map((d, i) => {
            const key = format(d, "yyyy-MM-dd");
            const evts = memberSchedule[m.uid]?.[key] || [];
            return (
              <View key={i} style={styles.dayCol}>
                {evts.length === 0 ? (
                  <Text style={[styles.offText, { color: colors.textVeryMuted }]}>−</Text>
                ) : (
                  evts.slice(0, 2).map((e, ei) => (
                    <View
                      key={ei}
                      style={[styles.shiftBadge, { backgroundColor: e.color || "#3A50E0" }]}
                    >
                      <Text style={styles.shiftBadgeText} numberOfLines={1}>
                        {e.title.slice(0, 2)}
                      </Text>
                    </View>
                  ))
                )}
                {evts.length > 2 && (
                  <Text style={[styles.moreText, { color: colors.textMuted }]}>
                    +{evts.length - 2}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}

      {members.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            メンバーがいません
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  calChips: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexGrow: 0 },
  chip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipText: { fontSize: 14, fontWeight: "600" },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 20,
  },
  navBtn: { fontSize: 18, fontWeight: "600", paddingHorizontal: 8 },
  weekLabel: { fontSize: 16, fontWeight: "700" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  headerText: { fontSize: 11, fontWeight: "600" },
  nameCol: {
    width: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 4,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  dayLabel: { fontSize: 11, fontWeight: "600" },
  dateLabel: {
    fontSize: 13,
    fontWeight: "700",
    width: 24,
    height: 24,
    textAlign: "center",
    lineHeight: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  todayLabel: {
    borderRadius: 12,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    minHeight: 56,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "700" },
  memberName: { fontSize: 11, fontWeight: "600", flex: 1 },
  shiftBadge: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginVertical: 1,
    minWidth: 28,
    alignItems: "center",
  },
  shiftBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  offText: { fontSize: 14 },
  moreText: { fontSize: 9 },
  emptyBox: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14 },
});
