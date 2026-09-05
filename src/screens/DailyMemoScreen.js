import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { format, addDays, subDays } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  subscribeMyCalendars,
  subscribeMemos,
  addMemo,
  deleteMemo,
} from "../services/calendarService";

export default function DailyMemoScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [calendars, setCalendars] = useState([]);
  const [selectedCalId, setSelectedCalId] = useState(null);
  const [memos, setMemos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newMemoText, setNewMemoText] = useState("");
  const [sending, setSending] = useState(false);

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
    const unsub = subscribeMemos(selectedCalId, setMemos);
    return unsub;
  }, [selectedCalId]);

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  // 選択日のメモをフィルタ
  const dayMemos = useMemo(() => {
    return memos
      .filter((m) => m.date === dateKey)
      .sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(0);
        const tb = b.createdAt?.toDate?.() || new Date(0);
        return ta - tb;
      });
  }, [memos, dateKey]);

  const handleSend = async () => {
    if (!newMemoText.trim() || !selectedCalId) return;
    setSending(true);
    try {
      await addMemo(selectedCalId, {
        date: dateKey,
        text: newMemoText.trim(),
        createdBy: user.uid,
        createdByName: user.displayName || "匿名",
      });
      setNewMemoText("");
    } catch (e) {
      Alert.alert("エラー", "メモの送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMemo = (memoId) => {
    Alert.alert("メモを削除", "このメモを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => deleteMemo(selectedCalId, memoId),
      },
    ]);
  };

  // 日付ナビの日付リスト（前後3日）
  const dateRange = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(subDays(selectedDate, 3), i));
  }, [selectedDate]);

  const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
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

      {/* 日付ナビ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateNav}
      >
        {dateRange.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const isSelected = key === dateKey;
          const isToday = key === format(new Date(), "yyyy-MM-dd");
          const dayOfWeek = d.getDay();
          const memoCount = memos.filter((m) => m.date === key).length;
          return (
            <Pressable
              key={key}
              style={[
                styles.dateItem,
                { backgroundColor: colors.surface },
                isSelected && { backgroundColor: colors.accent },
              ]}
              onPress={() => setSelectedDate(d)}
            >
              <Text
                style={[
                  styles.dateWeekday,
                  { color: dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : colors.textMuted },
                  isSelected && { color: "rgba(255,255,255,0.8)" },
                ]}
              >
                {WEEKDAY[dayOfWeek]}
              </Text>
              <Text
                style={[
                  styles.dateNum,
                  { color: colors.text },
                  isSelected && { color: "#fff" },
                ]}
              >
                {format(d, "d")}
              </Text>
              {isToday && !isSelected && (
                <View style={[styles.todayDot, { backgroundColor: colors.accent }]} />
              )}
              {memoCount > 0 && (
                <View style={[styles.memoBadge, isSelected ? { backgroundColor: "rgba(255,255,255,0.3)" } : { backgroundColor: colors.accentLight }]}>
                  <Text style={[styles.memoBadgeText, isSelected ? { color: "#fff" } : { color: colors.accentText }]}>
                    {memoCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 日付ヘッダー */}
      <View style={styles.dayHeader}>
        <Pressable onPress={() => setSelectedDate(subDays(selectedDate, 1))} hitSlop={12}>
          <Text style={[styles.navBtn, { color: colors.textSecondary }]}>{"<"}</Text>
        </Pressable>
        <Text style={[styles.dayTitle, { color: colors.text }]}>
          {format(selectedDate, "M月d日")}（{WEEKDAY[selectedDate.getDay()]}）
        </Text>
        <Pressable onPress={() => setSelectedDate(addDays(selectedDate, 1))} hitSlop={12}>
          <Text style={[styles.navBtn, { color: colors.textSecondary }]}>{">"}</Text>
        </Pressable>
      </View>

      {/* メモ一覧 */}
      <ScrollView style={styles.memoList} contentContainerStyle={styles.memoListContent}>
        {dayMemos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>メモはありません</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              引き継ぎ事項やメモを{"\n"}チームで共有しましょう
            </Text>
          </View>
        ) : (
          dayMemos.map((memo) => {
            const isOwn = memo.createdBy === user?.uid;
            const time = memo.createdAt?.toDate?.()
              ? format(memo.createdAt.toDate(), "HH:mm")
              : "";
            return (
              <View
                key={memo.id}
                style={[
                  styles.memoCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isOwn && { borderLeftColor: colors.accent, borderLeftWidth: 3 },
                ]}
              >
                <View style={styles.memoHeader}>
                  <View style={[styles.memoAvatar, { backgroundColor: colors.avatar }]}>
                    <Text style={[styles.memoAvatarText, { color: colors.avatarText }]}>
                      {(memo.createdByName || "?")[0]}
                    </Text>
                  </View>
                  <Text style={[styles.memoAuthor, { color: colors.text }]}>
                    {memo.createdByName || "匿名"}
                  </Text>
                  <Text style={[styles.memoTime, { color: colors.textVeryMuted }]}>{time}</Text>
                  {isOwn && (
                    <Pressable onPress={() => handleDeleteMemo(memo.id)} hitSlop={8}>
                      <Text style={[styles.deleteBtn, { color: colors.textVeryMuted }]}>✕</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.memoText, { color: colors.text }]}>{memo.text}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 入力欄 */}
      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="メモ・引き継ぎを入力..."
          placeholderTextColor={colors.textMuted}
          value={newMemoText}
          onChangeText={setNewMemoText}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendBtn, (!newMemoText.trim() || sending) && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!newMemoText.trim() || sending}
        >
          <Text style={styles.sendBtnText}>{sending ? "..." : "送信"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calChips: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, flexGrow: 0 },
  chip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipText: { fontSize: 14, fontWeight: "600" },
  dateNav: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  dateItem: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 44,
  },
  dateWeekday: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  dateNum: { fontSize: 16, fontWeight: "700" },
  todayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  memoBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
    minWidth: 18,
    alignItems: "center",
  },
  memoBadgeText: { fontSize: 10, fontWeight: "700" },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 16,
  },
  navBtn: { fontSize: 18, fontWeight: "600", paddingHorizontal: 8 },
  dayTitle: { fontSize: 17, fontWeight: "700" },
  memoList: { flex: 1 },
  memoListContent: { padding: 16, paddingBottom: 8 },
  emptyBox: { alignItems: "center", paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyDesc: { textAlign: "center", fontSize: 13, lineHeight: 20 },
  memoCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  memoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  memoAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  memoAvatarText: { fontSize: 12, fontWeight: "700" },
  memoAuthor: { fontSize: 13, fontWeight: "600", flex: 1 },
  memoTime: { fontSize: 11 },
  deleteBtn: { fontSize: 14, padding: 4 },
  memoText: { fontSize: 14, lineHeight: 22 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: "#3A50E0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
