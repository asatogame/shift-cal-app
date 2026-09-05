import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  subscribeMyCalendars,
  subscribeEvents,
  subscribeSwapRequests,
  createSwapRequest,
  updateSwapRequest,
  executeSwap,
  getMembers,
} from "../services/calendarService";

export default function ShiftSwapScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [calendars, setCalendars] = useState([]);
  const [selectedCalId, setSelectedCalId] = useState(null);
  const [events, setEvents] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);

  // 新規リクエスト用state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(1); // 1: 自分の予定選択, 2: 相手選択, 3: 確認

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
    const unsub1 = subscribeEvents(selectedCalId, setEvents);
    const unsub2 = subscribeSwapRequests(selectedCalId, setSwapRequests);
    return () => { unsub1(); unsub2(); };
  }, [selectedCalId]);

  useEffect(() => {
    if (!selectedCalId) return;
    const cal = calendars.find((c) => c.id === selectedCalId);
    if (cal?.memberIds) {
      getMembers(cal.memberIds).then(setMembers);
    }
  }, [selectedCalId, calendars]);

  // 自分の今後の予定
  const myFutureEvents = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return events
      .filter((e) => e.createdBy === user?.uid && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, user]);

  // 他メンバー一覧
  const otherMembers = useMemo(() => {
    return members.filter((m) => m.uid !== user?.uid);
  }, [members, user]);

  // 自分に関連するリクエスト（受信 + 送信）
  const myRequests = useMemo(() => {
    return swapRequests
      .filter((r) => r.fromUid === user?.uid || r.toUid === user?.uid)
      .sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(0);
        const tb = b.createdAt?.toDate?.() || new Date(0);
        return tb - ta;
      });
  }, [swapRequests, user]);

  const pendingForMe = useMemo(() => {
    return myRequests.filter((r) => r.toUid === user?.uid && r.status === "pending");
  }, [myRequests, user]);

  const handleCreateRequest = async () => {
    if (!selectedEvent || !selectedTarget || !selectedCalId) return;
    setSending(true);
    const cal = calendars.find((c) => c.id === selectedCalId);
    try {
      await createSwapRequest(selectedCalId, {
        fromUid: user.uid,
        toUid: selectedTarget.uid,
        fromEventId: selectedEvent.id,
        toEventId: null,
        fromDate: selectedEvent.date,
        toDate: selectedEvent.date,
        fromTitle: selectedEvent.title,
        toTitle: "",
        message: message.trim(),
        fromName: user.displayName || "匿名",
        toName: selectedTarget.displayName || "名前未設定",
        calendarName: cal?.name || "",
      });
      Alert.alert("送信完了", `${selectedTarget.displayName || "相手"}にシフト交換リクエストを送信しました`);
      closeNewRequest();
    } catch (e) {
      Alert.alert("エラー", "リクエストの送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = (req) => {
    Alert.alert("交換を承認", `${req.fromName}の「${req.fromTitle}」(${req.fromDate})を引き受けますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "承認する",
        onPress: async () => {
          try {
            await executeSwap(selectedCalId, req);
            Alert.alert("完了", "シフト交換が完了しました");
          } catch {
            Alert.alert("エラー", "交換処理に失敗しました");
          }
        },
      },
    ]);
  };

  const handleReject = (req) => {
    Alert.alert("交換を拒否", "このリクエストを拒否しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "拒否する",
        style: "destructive",
        onPress: () => updateSwapRequest(selectedCalId, req.id, "rejected"),
      },
    ]);
  };

  const closeNewRequest = () => {
    setShowNewRequest(false);
    setSelectedEvent(null);
    setSelectedTarget(null);
    setMessage("");
    setStep(1);
  };

  const statusLabel = (status) => {
    switch (status) {
      case "pending": return { text: "承認待ち", color: "#F59E0B", bg: "#FEF3C7" };
      case "accepted": return { text: "承認済み", color: "#16A34A", bg: "#DCFCE7" };
      case "rejected": return { text: "拒否", color: "#EF4444", bg: "#FEE2E2" };
      default: return { text: status, color: colors.textMuted, bg: colors.surfaceAlt };
    }
  };

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

      {/* 受信リクエスト */}
      {pendingForMe.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📥 受信したリクエスト（{pendingForMe.length}件）
          </Text>
          {pendingForMe.map((req) => (
            <View
              key={req.id}
              style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: "#F59E0B" }]}
            >
              <Text style={[styles.reqTitle, { color: colors.text }]}>
                {req.fromName}さんからの交換リクエスト
              </Text>
              <Text style={[styles.reqDetail, { color: colors.textSecondary }]}>
                「{req.fromTitle}」{req.fromDate}
              </Text>
              {req.message ? (
                <Text style={[styles.reqMessage, { color: colors.textMuted }]}>
                  💬 {req.message}
                </Text>
              ) : null}
              <View style={styles.reqActions}>
                <Pressable
                  style={[styles.acceptBtn]}
                  onPress={() => handleAccept(req)}
                >
                  <Text style={styles.acceptBtnText}>承認する</Text>
                </Pressable>
                <Pressable
                  style={[styles.rejectBtn, { borderColor: "#EF4444" }]}
                  onPress={() => handleReject(req)}
                >
                  <Text style={[styles.rejectBtnText, { color: "#EF4444" }]}>拒否</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 履歴 */}
      <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📋 交換リクエスト履歴
        </Text>
        {myRequests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔄</Text>
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
              リクエストはありません
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              シフトの交換が必要な時に{"\n"}メンバーにリクエストを送りましょう
            </Text>
          </View>
        ) : (
          myRequests.map((req) => {
            const st = statusLabel(req.status);
            const isSent = req.fromUid === user?.uid;
            return (
              <View
                key={req.id}
                style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyDirection, { color: colors.textMuted }]}>
                    {isSent ? "送信 →" : "← 受信"}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.text}</Text>
                  </View>
                </View>
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  {isSent ? `→ ${req.toName}` : `← ${req.fromName}`}
                </Text>
                <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                  「{req.fromTitle}」{req.fromDate}
                </Text>
                {req.message ? (
                  <Text style={[styles.historyMessage, { color: colors.textMuted }]}>
                    💬 {req.message}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 新規リクエストボタン */}
      <View style={[styles.fabContainer, { backgroundColor: colors.bg }]}>
        <Pressable
          style={styles.fabBtn}
          onPress={() => setShowNewRequest(true)}
        >
          <Text style={styles.fabBtnText}>🔄 シフト交換をリクエスト</Text>
        </Pressable>
      </View>

      {/* 新規リクエストモーダル */}
      <Modal visible={showNewRequest} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>シフト交換リクエスト</Text>
              <Pressable onPress={closeNewRequest}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {/* ステップインジケーター */}
            <View style={styles.steps}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    { backgroundColor: s <= step ? colors.accent : colors.surfaceAlt },
                  ]}
                />
              ))}
            </View>

            {step === 1 && (
              <>
                <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
                  ① 交換したいシフトを選択
                </Text>
                <FlatList
                  data={myFutureEvents}
                  keyExtractor={(item) => item.id}
                  style={styles.eventList}
                  ListEmptyComponent={
                    <Text style={[styles.emptyListText, { color: colors.textMuted }]}>
                      今後の予定がありません
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={[
                        styles.eventItem,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedEvent?.id === item.id && { borderColor: colors.accent, borderWidth: 2 },
                      ]}
                      onPress={() => {
                        setSelectedEvent(item);
                        setStep(2);
                      }}
                    >
                      <View style={[styles.eventColor, { backgroundColor: item.color || "#3A50E0" }]} />
                      <View style={styles.eventInfo}>
                        <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                          {item.date} {item.startTime ? `${item.startTime}〜${item.endTime || ""}` : ""}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
                  ② 交換を依頼する相手を選択
                </Text>
                <FlatList
                  data={otherMembers}
                  keyExtractor={(item) => item.uid}
                  style={styles.eventList}
                  ListEmptyComponent={
                    <Text style={[styles.emptyListText, { color: colors.textMuted }]}>
                      他のメンバーがいません
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={[
                        styles.memberItem,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedTarget?.uid === item.uid && { borderColor: colors.accent, borderWidth: 2 },
                      ]}
                      onPress={() => {
                        setSelectedTarget(item);
                        setStep(3);
                      }}
                    >
                      <View style={[styles.mAvatar, { backgroundColor: colors.avatar }]}>
                        <Text style={[styles.mAvatarText, { color: colors.avatarText }]}>
                          {(item.displayName || "?")[0]}
                        </Text>
                      </View>
                      <Text style={[styles.mName, { color: colors.text }]}>
                        {item.displayName || "名前未設定"}
                      </Text>
                    </Pressable>
                  )}
                />
                <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
                  <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>← 戻る</Text>
                </Pressable>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
                  ③ 確認して送信
                </Text>
                <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>交換するシフト</Text>
                  <Text style={[styles.confirmValue, { color: colors.text }]}>
                    {selectedEvent?.title}（{selectedEvent?.date}）
                  </Text>
                  <Text style={[styles.confirmLabel, { color: colors.textMuted, marginTop: 10 }]}>依頼先</Text>
                  <Text style={[styles.confirmValue, { color: colors.text }]}>
                    {selectedTarget?.displayName || "名前未設定"}
                  </Text>
                </View>
                <TextInput
                  style={[styles.messageInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }]}
                  placeholder="メッセージ（任意）"
                  placeholderTextColor={colors.textMuted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={200}
                />
                <Pressable
                  style={[styles.sendBtn, sending && { opacity: 0.5 }]}
                  onPress={handleCreateRequest}
                  disabled={sending}
                >
                  <Text style={styles.sendBtnText}>{sending ? "送信中..." : "リクエストを送信"}</Text>
                </Pressable>
                <Pressable style={styles.backBtn} onPress={() => setStep(2)}>
                  <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>← 戻る</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calChips: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, flexGrow: 0 },
  chip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipText: { fontSize: 14, fontWeight: "600" },
  section: { paddingHorizontal: 16, paddingTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  requestCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
  },
  reqTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  reqDetail: { fontSize: 13, marginBottom: 4 },
  reqMessage: { fontSize: 12, marginBottom: 10 },
  reqActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rejectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  rejectBtnText: { fontWeight: "700", fontSize: 14 },
  historyScroll: { flex: 1 },
  historyContent: { padding: 16, paddingBottom: 80 },
  historyCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historyDirection: { fontSize: 12, fontWeight: "600" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  historyTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  historyDetail: { fontSize: 12 },
  historyMessage: { fontSize: 12, marginTop: 4 },
  emptyBox: { alignItems: "center", paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyDesc: { textAlign: "center", fontSize: 13, lineHeight: 20 },
  fabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  fabBtn: {
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  fabBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // モーダル
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalClose: { fontSize: 18, padding: 4 },
  steps: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLabel: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  eventList: { maxHeight: 300 },
  emptyListText: { textAlign: "center", paddingVertical: 20 },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  eventColor: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: "700" },
  eventDate: { fontSize: 12, marginTop: 2 },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  mAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mAvatarText: { fontSize: 14, fontWeight: "700" },
  mName: { fontSize: 15, fontWeight: "600" },
  backBtn: { alignItems: "center", paddingVertical: 12 },
  backBtnText: { fontSize: 14 },
  confirmCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  confirmLabel: { fontSize: 12, fontWeight: "600" },
  confirmValue: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: "#3A50E0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
