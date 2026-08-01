import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
} from "date-fns";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function MonthGrid({ month, selectedDate, onSelectDate, eventDates, eventsByDate }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.weekdayLabel,
              i === 0 && styles.sunday,
              i === 6 && styles.saturday,
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
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const dayOfWeek = getDay(day);
          const dayEvents = eventsByDate ? eventsByDate[key] || [] : [];
          const colors = [...new Set(dayEvents.map((e) => e.color || "#3A50E0"))].slice(0, 3);

          return (
            <Pressable
              key={key}
              style={styles.cell}
              onPress={() => onSelectDate(day)}
            >
              <View style={[
                styles.dayCircle,
                selected && styles.dayCircleSelected,
                today && !selected && styles.dayCircleToday,
              ]}>
                <Text
                  style={[
                    styles.dayText,
                    !inMonth && styles.dayTextMuted,
                    selected && styles.dayTextSelected,
                    today && !selected && styles.dayTextToday,
                    !selected && !today && inMonth && dayOfWeek === 0 && styles.daySunday,
                    !selected && !today && inMonth && dayOfWeek === 6 && styles.daySaturday,
                  ]}
                >
                  {format(day, "d")}
                </Text>
              </View>
              <View style={styles.dotRow}>
                {colors.map((c, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  sunday: { color: "#EF4444" },
  saturday: { color: "#3B82F6" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: {
    backgroundColor: "#3A50E0",
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: "#3A50E0",
  },
  dayText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  dayTextMuted: {
    color: "#D1D5DB",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayTextToday: {
    color: "#3A50E0",
    fontWeight: "700",
  },
  daySunday: { color: "#EF4444" },
  daySaturday: { color: "#3B82F6" },
  dotRow: {
    flexDirection: "row",
    height: 6,
    gap: 2,
    marginTop: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
