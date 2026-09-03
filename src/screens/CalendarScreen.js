import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from "react-native";
import { format, addMonths, subMonths } from "date-fns";
import MonthGrid from "../components/MonthGrid";
import { subscribeEvents, deleteEvent, getCalendar } from "../services/calendarService";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function CalendarScreen({ route, navigation }) {
  const { calendarId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [calendarInfo, setCalendarInfo] = useState(null);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getCalendar(calendarId).then(setCalendarInfo);
  }, [calendarId]);

  useEffect(() => {
    const unsub = subscribeEvents(calendarId, setEvents);
    return unsub;
  }, [calendarId]);

  useEffect(() => {
    navigation.setOptions({
      title: calendarInfo ? calendarInfo.name : "カレンダー",
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
      headerShadowVisible: false,
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate("Share", { calendarId })} style={{ marginRight: 4 }}>
          <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: 14 }}>共有</Text>
        </Pressable>
      ),
    });
  }, [navigation, calendarInfo, calendarId, colors]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const eventDates = useMemo(() => new Set(Object.keys(eventsByDate)), [eventsByDate]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const dayEvents = useMemo(
    () =>
      (eventsByDate[selectedKey] || []).sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      ),
    [eventsByDate, selectedKey]
  );

  const handleDeleteEvent = (eventId) => {
    deleteEvent(calendarId, eventId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.monthHeader, { backgroundColor: colors.bg }]}>
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

      <MonthGrid
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        eventDates={eventDates}
        eventsByDate={eventsByDate}
      />

      <View style={[styles.daySection, { backgroundColor: colors.surface }]}>
        <View style={styles.dayHeader}>
          <Text style={[styles.dayHeaderDate, { color: colors.text }]}>{format(selectedDate, "M/d")}</Text>
          <Text style={[styles.dayHeaderWeekday, { color: colors.textMuted }]}>{format(selectedDate, "EEEEE")}</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.dayEventCount, { color: colors.textSecondary }]}>
            {dayEvents.length > 0 ? `${dayEvents.length}件` : ""}
          </Text>
        </View>

        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventList}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.textVeryMuted }]}>予定はありません</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.eventCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
              onLongPress={() => handleDeleteEvent(item.id)}
              onPress={() =>
                navigation.navigate("EventForm", { calendarId, event: item, date: selectedKey })
              }
            >
              <View style={[styles.eventColorBar, { backgroundColor: item.color || "#3A50E0" }]} />
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
                {(item.startTime || item.endTime) && (
                  <Text style={[styles.eventTime, { color: colors.textMuted }]}>
                    {item.startTime || ""}
                    {item.endTime ? ` ~ ${item.endTime}` : ""}
                  </Text>
                )}
                {!!item.memo && <Text style={[styles.eventMemo, { color: colors.textSecondary }]} numberOfLines={1}>{item.memo}</Text>}
              </View>
            </Pressable>
          )}
        />
      </View>

      <View style={[styles.fabRow, { backgroundColor: colors.surface }]}>
        <Pressable
          style={[styles.fabShift, { backgroundColor: colors.fabShiftBg }]}
          onPress={() => navigation.navigate("ShiftQuickAdd", { calendarId })}
        >
          <Text style={[styles.fabShiftText, { color: colors.fabShiftText }]}>シフト一括</Text>
        </Pressable>
        <Pressable
          style={[styles.fabPhoto, { backgroundColor: colors.fabPhotoBg }]}
          onPress={() => navigation.navigate("PhotoImport", { calendarId })}
        >
          <Text style={[styles.fabPhotoText, { color: colors.fabPhotoText }]}>写真取込</Text>
        </Pressable>
        <Pressable
          style={styles.fabAdd}
          onPress={() =>
            navigation.navigate("EventForm", { calendarId, date: selectedKey })
          }
        >
          <Text style={styles.fabAddText}>+ 追加</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 20,
  },
  monthNav: { fontSize: 18, fontWeight: "600", paddingHorizontal: 8 },
  monthLabel: { fontSize: 17, fontWeight: "700" },
  daySection: {
    flex: 1,
    marginTop: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 6,
  },
  dayHeaderDate: { fontSize: 20, fontWeight: "800" },
  dayHeaderWeekday: { fontSize: 14, fontWeight: "500" },
  dayEventCount: { fontSize: 12 },
  eventList: { paddingHorizontal: 16, paddingBottom: 8, flexGrow: 1 },
  emptyBox: { alignItems: "center", paddingTop: 32 },
  emptyText: { fontSize: 14 },
  eventCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    alignItems: "stretch",
    borderWidth: 1,
  },
  eventColorBar: { width: 4, borderRadius: 2, marginRight: 12 },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: "700" },
  eventTime: { fontSize: 13, marginTop: 3 },
  eventMemo: { fontSize: 12, marginTop: 3 },
  fabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 8,
  },
  fabShift: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  fabShiftText: { fontWeight: "700", fontSize: 13 },
  fabPhoto: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  fabPhotoText: { fontWeight: "700", fontSize: 13 },
  fabAdd: {
    flex: 1,
    backgroundColor: "#3A50E0",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  fabAddText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
