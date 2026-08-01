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

export default function CalendarScreen({ route, navigation }) {
  const { calendarId } = route.params;
  const { user } = useAuth();
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
      headerStyle: { backgroundColor: "#fff" },
      headerShadowVisible: false,
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate("Share", { calendarId })} style={{ marginRight: 4 }}>
          <Text style={styles.headerAction}>共有</Text>
        </Pressable>
      ),
    });
  }, [navigation, calendarInfo, calendarId]);

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

  const memberCount = calendarInfo?.memberIds?.length || 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.monthHeader}>
        <Pressable onPress={() => setMonth(subMonths(month, 1))} hitSlop={16}>
          <Text style={styles.monthNav}>{"<"}</Text>
        </Pressable>
        <Pressable onPress={() => setMonth(new Date())}>
          <Text style={styles.monthLabel}>{format(month, "yyyy年 M月")}</Text>
        </Pressable>
        <Pressable onPress={() => setMonth(addMonths(month, 1))} hitSlop={16}>
          <Text style={styles.monthNav}>{">"}</Text>
        </Pressable>
      </View>

      <MonthGrid
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        eventDates={eventDates}
        eventsByDate={eventsByDate}
      />

      <View style={styles.daySection}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderDate}>{format(selectedDate, "M/d")}</Text>
          <Text style={styles.dayHeaderWeekday}>{format(selectedDate, "EEEE").slice(0, 1) === "M" ? format(selectedDate, "EEEEE") : format(selectedDate, "EEEEE")}</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.dayEventCount}>
            {dayEvents.length > 0 ? `${dayEvents.length}件` : ""}
          </Text>
        </View>

        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventList}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>予定はありません</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.eventCard}
              onLongPress={() => handleDeleteEvent(item.id)}
              onPress={() =>
                navigation.navigate("EventForm", { calendarId, event: item, date: selectedKey })
              }
            >
              <View style={[styles.eventColorBar, { backgroundColor: item.color || "#3A50E0" }]} />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {(item.startTime || item.endTime) && (
                  <Text style={styles.eventTime}>
                    {item.startTime || ""}
                    {item.endTime ? ` ~ ${item.endTime}` : ""}
                  </Text>
                )}
                {!!item.memo && <Text style={styles.eventMemo} numberOfLines={1}>{item.memo}</Text>}
              </View>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.fabRow}>
        <Pressable
          style={styles.fabShift}
          onPress={() => navigation.navigate("ShiftQuickAdd", { calendarId })}
        >
          <Text style={styles.fabShiftText}>シフト一括</Text>
        </Pressable>
        <Pressable
          style={styles.fabPhoto}
          onPress={() => navigation.navigate("PhotoImport", { calendarId })}
        >
          <Text style={styles.fabPhotoText}>写真取込</Text>
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
  container: { flex: 1, backgroundColor: "#FAFBFC" },
  headerAction: { color: "#3A50E0", fontWeight: "700", fontSize: 14 },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    gap: 20,
  },
  monthNav: { fontSize: 18, color: "#9CA3AF", fontWeight: "600", paddingHorizontal: 8 },
  monthLabel: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  daySection: {
    flex: 1,
    backgroundColor: "#fff",
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
  dayHeaderDate: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  dayHeaderWeekday: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  dayEventCount: { fontSize: 12, color: "#9CA3AF" },
  eventList: { paddingHorizontal: 16, paddingBottom: 8, flexGrow: 1 },
  emptyBox: { alignItems: "center", paddingTop: 32 },
  emptyText: { color: "#D1D5DB", fontSize: 14 },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  eventColorBar: { width: 4, borderRadius: 2, marginRight: 12 },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  eventTime: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  eventMemo: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },
  fabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 8,
    backgroundColor: "#fff",
  },
  fabShift: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  fabShiftText: { color: "#3A50E0", fontWeight: "700", fontSize: 13 },
  fabPhoto: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  fabPhotoText: { color: "#16A34A", fontWeight: "700", fontSize: 13 },
  fabAdd: {
    flex: 1,
    backgroundColor: "#3A50E0",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  fabAddText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
