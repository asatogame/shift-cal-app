import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  subscribeMyCalendars,
  subscribeEvents,
  getMembers,
} from "../services/calendarService";

export default function MonthlyShiftTableScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [calendars, setCalendars] = useState([]);
  const [selectedCalId, setSelectedCalId] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [month, setMonth] = useState(new Date());

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

  const monthDays = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  // メンバー × 日ごとのイベントマップ（表示月のみ）
  const scheduleMap = useMemo(() => {
    const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");
    const map = {};
    members.forEach((m) => {
      map[m.uid] = {};
    });
    events.forEach((e) => {
      if (map[e.createdBy] && e.date >= monthStart && e.date <= monthEnd) {
        if (!map[e.createdBy][e.date]) map[e.createdBy][e.date] = [];
        map[e.createdBy][e.date].push(e);
      }
    });
    return map;
  }, [members, events, month]);

  // メンバーごとの月間出勤日数（表示月のみカウント）
  const workDayCounts = useMemo(() => {
    const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");
    const counts = {};
    members.forEach((m) => {
      const daySet = new Set();
      events.forEach((e) => {
        if (e.createdBy === m.uid && e.date >= monthStart && e.date <= monthEnd) {
          daySet.add(e.date);
        }
      });
      counts[m.uid] = daySet.size;
    });
    return counts;
  }, [members, events, month]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
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

      {/* 月ナビ */}
      <View style={styles.monthNav}>
        <Pressable onPress={() => setMonth(subMonths(month, 1))} hitSlop={12}>
          <Text style={[styles.navBtn, { color: colors.textSecondary }]}>{"<"}</Text>
        </Pressable>
        <Pressable onPress={() => setMonth(new Date())}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {format(month, "yyyy年 M月")}
          </Text>
        </Pressable>
        <Pressable onPress={() => setMonth(addMonths(month, 1))} hitSlop={12}>
          <Text style={[styles.navBtn, { color: colors.textSecondary }]}>{">"}</Text>
        </Pressable>
      </View>

      {/* マトリクス表 */}
      <ScrollView style={styles.tableScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* ヘッダー行：日付 */}
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.surface }]}>
              <View style={[styles.nameCell, { borderRightColor: colors.border }]}>
                <Text style={[styles.headerCellText, { color: colors.textMuted }]}>名前</Text>
              </View>
              {monthDays.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const dayOfWeek = d.getDay();
                const isToday = key === todayStr;
                return (
                  <View
                    key={key}
                    style={[
                      styles.dayCell,
                      { borderRightColor: colors.border },
                      dayOfWeek === 0 && { backgroundColor: "rgba(239,68,68,0.06)" },
                      dayOfWeek === 6 && { backgroundColor: "rgba(59,130,246,0.06)" },
                      isToday && { backgroundColor: "rgba(58,80,224,0.12)" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.headerDayText,
                        {
                          color:
                            dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : colors.textMuted,
                        },
                      ]}
                    >
                      {WEEKDAY[dayOfWeek]}
                    </Text>
                    <Text
                      style={[
                        styles.headerDateText,
                        { color: colors.text },
                        isToday && styles.todayText,
                        isToday && { backgroundColor: colors.accent, color: "#fff" },
                      ]}
                    >
                      {format(d, "d")}
                    </Text>
                  </View>
                );
              })}
              <View style={[styles.totalCell, { borderLeftColor: colors.border }]}>
                <Text style={[styles.headerCellText, { color: colors.textMuted }]}>計</Text>
              </View>
            </View>

            {/* メンバー行 */}
            {members.map((m, mi) => (
              <View
                key={m.uid}
                style={[
                  styles.tableRow,
                  { backgroundColor: mi % 2 === 0 ? colors.bg : colors.surface },
                ]}
              >
                <View style={[styles.nameCell, { borderRightColor: colors.border }]}>
                  <Text style={[styles.nameCellText, { color: colors.text }]} numberOfLines={1}>
                    {m.displayName || "名前未設定"}
                  </Text>
                </View>
                {monthDays.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const evts = scheduleMap[m.uid]?.[key] || [];
                  const dayOfWeek = d.getDay();
                  const isToday = key === todayStr;
                  return (
                    <View
                      key={key}
                      style={[
                        styles.dayCell,
                        { borderRightColor: colors.border },
                        dayOfWeek === 0 && { backgroundColor: "rgba(239,68,68,0.04)" },
                        dayOfWeek === 6 && { backgroundColor: "rgba(59,130,246,0.04)" },
                        isToday && { backgroundColor: "rgba(58,80,224,0.08)" },
                      ]}
                    >
                      {evts.length > 0 ? (
                        <View
                          style={[
                            styles.cellBadge,
                            { backgroundColor: evts[0].color || "#3A50E0" },
                          ]}
                        >
                          <Text style={styles.cellBadgeText} numberOfLines={1}>
                            {evts[0].title.slice(0, 2)}
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.cellEmpty, { color: colors.textVeryMuted }]}>−</Text>
                      )}
                    </View>
                  );
                })}
                <View style={[styles.totalCell, { borderLeftColor: colors.border }]}>
                  <Text style={[styles.totalText, { color: colors.text }]}>
                    {workDayCounts[m.uid] || 0}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {members.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            カレンダーを選択してください
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calChips: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, flexGrow: 0 },
  chip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipText: { fontSize: 14, fontWeight: "600" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 20,
  },
  navBtn: { fontSize: 18, fontWeight: "600", paddingHorizontal: 8 },
  monthLabel: { fontSize: 16, fontWeight: "700" },
  tableScroll: { flex: 1 },
  tableRow: { flexDirection: "row", minHeight: 40 },
  tableHeader: { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.1)" },
  nameCell: {
    width: 80,
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
  },
  nameCellText: { fontSize: 12, fontWeight: "600" },
  headerCellText: { fontSize: 11, fontWeight: "600" },
  dayCell: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    paddingVertical: 2,
  },
  headerDayText: { fontSize: 10, fontWeight: "600" },
  headerDateText: {
    fontSize: 12,
    fontWeight: "700",
    width: 22,
    height: 22,
    textAlign: "center",
    lineHeight: 22,
    borderRadius: 11,
    overflow: "hidden",
  },
  todayText: { borderRadius: 11, overflow: "hidden" },
  totalCell: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
  },
  totalText: { fontSize: 13, fontWeight: "700" },
  cellBadge: {
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 24,
    alignItems: "center",
  },
  cellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  cellEmpty: { fontSize: 12 },
  emptyBox: { position: "absolute", top: "50%", left: 0, right: 0, alignItems: "center" },
  emptyText: { fontSize: 14 },
});
