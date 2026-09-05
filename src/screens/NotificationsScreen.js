import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  subscribeMyCalendars,
  subscribeSwapRequests,
} from "../services/calendarService";

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [calendars, setCalendars] = useState([]);
  const [allSwapRequests, setAllSwapRequests] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyCalendars(user.uid, setCalendars);
    return unsub;
  }, [user]);

  // 全カレンダーのswapRequestsを購読
  useEffect(() => {
    if (calendars.length === 0) {
      setAllSwapRequests([]);
      return;
    }
    const unsubs = [];
    const requestMap = {};
    calendars.forEach((cal) => {
      const unsub = subscribeSwapRequests(cal.id, (requests) => {
        requestMap[cal.id] = requests.map((r) => ({ ...r, calendarId: cal.id, calendarName: cal.name }));
        // 全カレンダー分をフラットにまとめる
        const all = Object.values(requestMap).flat();
        setAllSwapRequests(all);
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [calendars]);

  // 自分宛の通知（pending swap requests）
  const notifications = useMemo(() => {
    return allSwapRequests
      .filter((r) => r.toUid === user?.uid && r.status === "pending")
      .sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(0);
        const tb = b.createdAt?.toDate?.() || new Date(0);
        return tb - ta;
      });
  }, [allSwapRequests, user]);

  // 最近の全通知（accepted/rejected含む、自分関連のみ）
  const recentActivity = useMemo(() => {
    return allSwapRequests
      .filter((r) => (r.toUid === user?.uid || r.fromUid === user?.uid) && r.status !== "pending")
      .sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(0);
        const tb = b.createdAt?.toDate?.() || new Date(0);
        return tb - ta;
      })
      .slice(0, 20);
  }, [allSwapRequests, user]);

  const hasContent = notifications.length > 0 || recentActivity.length > 0;

  if (!hasContent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={styles.emptyIcon}>📬</Text>
        <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>まだアクティビティがありません</Text>
        <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
          シフト交換リクエストの通知が{"\n"}ここに表示されます
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* 承認待ちリクエスト */}
      {notifications.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🔔 対応が必要（{notifications.length}件）
          </Text>
          {notifications.map((req) => {
            const time = req.createdAt?.toDate?.() ? format(req.createdAt.toDate(), "M/d HH:mm") : "";
            return (
              <Pressable
                key={req.id}
                style={[styles.notifCard, { backgroundColor: colors.surface, borderColor: "#F59E0B" }]}
                onPress={() => {
                  // ShiftTabNav → ShiftSwapに遷移
                  navigation.navigate("ShiftTabNav", { screen: "ShiftSwap" });
                }}
              >
                <View style={styles.notifHeader}>
                  <Text style={styles.notifEmoji}>🔄</Text>
                  <View style={styles.notifInfo}>
                    <Text style={[styles.notifTitle, { color: colors.text }]}>
                      {req.fromName}さんからシフト交換リクエスト
                    </Text>
                    <Text style={[styles.notifDetail, { color: colors.textSecondary }]}>
                      「{req.fromTitle}」{req.fromDate}
                    </Text>
                  </View>
                  <Text style={[styles.notifTime, { color: colors.textVeryMuted }]}>{time}</Text>
                </View>
                {req.message ? (
                  <Text style={[styles.notifMessage, { color: colors.textMuted }]}>
                    💬 {req.message}
                  </Text>
                ) : null}
                <Text style={[styles.notifAction, { color: colors.accent }]}>
                  タップして確認 →
                </Text>
              </Pressable>
            );
          })}
        </>
      )}

      {/* 最近のアクティビティ */}
      {recentActivity.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: notifications.length > 0 ? 20 : 0 }]}>
            📋 最近のアクティビティ
          </Text>
          {recentActivity.map((req) => {
            const isSent = req.fromUid === user?.uid;
            const time = req.createdAt?.toDate?.() ? format(req.createdAt.toDate(), "M/d HH:mm") : "";
            const statusEmoji = req.status === "accepted" ? "✅" : "❌";
            const statusText = req.status === "accepted" ? "承認されました" : "拒否されました";
            return (
              <View
                key={req.id}
                style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.notifHeader}>
                  <Text style={styles.notifEmoji}>{statusEmoji}</Text>
                  <View style={styles.notifInfo}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>
                      {isSent
                        ? `${req.toName}さんへの交換リクエストが${statusText}`
                        : `${req.fromName}さんの交換リクエストを${req.status === "accepted" ? "承認しました" : "拒否しました"}`
                      }
                    </Text>
                    <Text style={[styles.notifDetail, { color: colors.textSecondary }]}>
                      「{req.fromTitle}」{req.fromDate} • {req.calendarName}
                    </Text>
                  </View>
                  <Text style={[styles.notifTime, { color: colors.textVeryMuted }]}>{time}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scrollContainer: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  notifCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  notifEmoji: { fontSize: 24 },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  notifDetail: { fontSize: 12 },
  notifTime: { fontSize: 11 },
  notifMessage: { fontSize: 12, marginTop: 6, marginLeft: 34 },
  notifAction: { fontSize: 13, fontWeight: "600", marginTop: 8, marginLeft: 34 },
  activityCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  activityTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
});
