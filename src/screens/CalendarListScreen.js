import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { subscribeMyCalendars, createCalendar, joinCalendarByCode } from "../services/calendarService";
import UpgradeAccountModal from "../components/UpgradeAccountModal";

const CAL_COLORS = ["#3A50E0", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function CalendarListScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const [calendars, setCalendars] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyCalendars(user.uid, setCalendars);
    return unsub;
  }, [user]);

  const closeModal = () => {
    setModalMode(null);
    setInputValue("");
  };

  const requireAccount = (action) => {
    if (isGuest()) {
      setPendingAction(action);
      setShowUpgrade(true);
      return true;
    }
    return false;
  };

  const handleUpgradeSuccess = () => {
    if (pendingAction === "join") {
      setModalMode("join");
    }
    setPendingAction(null);
  };

  const handleJoinPress = () => {
    if (!requireAccount("join")) {
      setModalMode("join");
    }
  };

  const handleConfirm = async () => {
    if (!inputValue.trim()) return;
    setBusy(true);
    try {
      if (modalMode === "create") {
        const id = await createCalendar(user.uid, inputValue.trim());
        closeModal();
        navigation.navigate("Calendar", { calendarId: id });
      } else {
        if (isGuest()) {
          closeModal();
          requireAccount("join");
          return;
        }
        const id = await joinCalendarByCode(user.uid, inputValue.trim());
        closeModal();
        navigation.navigate("Calendar", { calendarId: id });
      }
    } catch (e) {
      Alert.alert("エラー", e.message || "処理に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>マイカレンダー</Text>
        <View style={styles.headerRight}>
          {isGuest() && (
            <Pressable style={styles.registerBtn} onPress={() => setShowUpgrade(true)}>
              <Text style={styles.registerBtnText}>アカウント登録</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.settingsBtn}
            onPress={() => navigation.navigate("Settings")}
            hitSlop={8}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={calendars}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>カレンダーがありません</Text>
            <Text style={styles.emptyDesc}>
              新規作成するか、招待コードで{"\n"}仲間のカレンダーに参加しましょう
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const color = CAL_COLORS[index % CAL_COLORS.length];
          return (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("Calendar", { calendarId: item.id })}
            >
              <View style={[styles.cardAccent, { backgroundColor: color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>
                      {item.memberIds?.length || 1}人
                    </Text>
                  </View>
                  <Text style={styles.cardCode}>#{item.inviteCode}</Text>
                </View>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </Pressable>
          );
        }}
      />

      <View style={styles.actions}>
        <Pressable style={styles.createBtn} onPress={() => setModalMode("create")}>
          <Text style={styles.createBtnText}>+ 新規作成</Text>
        </Pressable>
        <Pressable style={styles.joinBtn} onPress={handleJoinPress}>
          <Text style={styles.joinBtnText}>コードで参加</Text>
        </Pressable>
      </View>

      <Modal visible={modalMode !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {modalMode === "create" ? "新しいカレンダー" : "招待コードで参加"}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={modalMode === "create" ? "カレンダー名を入力" : "招待コードを入力"}
              autoCapitalize={modalMode === "create" ? "none" : "characters"}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={closeModal} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={[styles.modalConfirm, !inputValue.trim() && { opacity: 0.4 }]}
                disabled={busy || !inputValue.trim()}
              >
                <Text style={styles.modalConfirmText}>
                  {busy ? "処理中..." : modalMode === "create" ? "作成" : "参加"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <UpgradeAccountModal
        visible={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          setPendingAction(null);
        }}
        onSuccess={handleUpgradeSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFBFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1F2937" },
  registerBtn: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  registerBtnText: { color: "#3A50E0", fontSize: 13, fontWeight: "600" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsBtn: { padding: 4 },
  settingsIcon: { fontSize: 20 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  emptyBox: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#6B7280", marginBottom: 8 },
  emptyDesc: {
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardAccent: { width: 5, alignSelf: "stretch" },
  cardBody: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937", marginBottom: 6 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  memberBadgeText: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  cardCode: { fontSize: 11, color: "#D1D5DB" },
  cardArrow: { fontSize: 20, color: "#D1D5DB", marginRight: 16 },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 8,
    gap: 10,
    backgroundColor: "#FAFBFC",
  },
  createBtn: {
    flex: 1,
    backgroundColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  joinBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#3A50E0",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  joinBtnText: { color: "#3A50E0", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#1F2937" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 8 },
  modalCancelText: { color: "#9CA3AF", fontSize: 15 },
  modalConfirm: {
    backgroundColor: "#3A50E0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalConfirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
