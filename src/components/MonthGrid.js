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
import { useTheme } from "../context/ThemeContext";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function MonthGrid({ month, selectedDate, onSelectDate, eventDates, eventsByDate }) {
  const { colors } = useTheme();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
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
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const dayOfWeek = getDay(day);
          const dayEvents = eventsByDate ? eventsByDate[key] || [] : [];

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
                    { color: colors.dayText },
                    !inMonth && { color: colors.dayTextMuted },
                    selected && styles.dayTextSelected,
                    today && !selected && { color: colors.dayToday, fontWeight: "700" },
                    !selected && !today && inMonth && dayOfWeek === 0 && { color: colors.sunday },
                    !selected && !today && inMonth && dayOfWeek === 6 && { color: colors.saturday },
                  ]}
                >
                  {format(day, "d")}
                </Text>
              </View>
              <View style={styles.labelRow}>
                {dayEvents.slice(0, 2).map((ev, i) => (
                  <View key={i} style={[styles.eventLabel, { backgroundColor: ev.color || "#3A50E0" }]}>
                    <Text style={styles.eventLabelText} numberOfLines={1}>
                      {ev.title ? ev.title.slice(0, 3) : ""}
                    </Text>
                  </View>
                ))}
                {dayEvents.length > 2 && (
                  <Text style={[styles.moreText, { color: colors.textMuted }]}>+{dayEvents.length - 2}</Text>
                )}
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
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    height: 64,
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
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  labelRow: {
    width: "100%",
    alignItems: "center",
    gap: 1,
    marginTop: 1,
  },
  eventLabel: {
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 0,
    width: "90%",
    alignItems: "center",
  },
  eventLabelText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 12,
  },
  moreText: {
    fontSize: 7,
    fontWeight: "600",
  },
});
